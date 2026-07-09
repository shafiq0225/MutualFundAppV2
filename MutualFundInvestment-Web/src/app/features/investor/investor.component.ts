import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

import { FamilyPortfolioService } from '../../core/services/family-portfolio.service';
import { HoldingsService } from '../../core/services/holdings.service';
import { AuthFamilyService } from '../../core/services/auth-family.service';
import { FamilyOverviewDto, MemberSummaryDto, HoldingCardDto, QuickReturnDto } from '../../core/models/family-portfolio.model';
import { HoldingDto } from '../../core/models/holding.model';
import { AuthFamilyMemberDto } from '../../core/models/auth-family.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { DonutChartComponent, DonutSegment } from '../../shared/components/donut-chart/donut-chart.component';

type PeriodKey = 'yesterday' | 'thisWeek' | 'oneMonth' | 'oneYear';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek',  label: 'This Week' },
  { key: 'oneMonth',  label: '1 Month' },
  { key: 'oneYear',   label: '1 Year' }
];

@Component({
  selector: 'app-investor',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './investor.component.html',
  styleUrls: ['./investor.component.scss']
})
export class InvestorComponent implements OnInit, AfterViewInit {
  loading = true;
  overview: FamilyOverviewDto | null = null;
  relationshipMap = new Map<string, AuthFamilyMemberDto>();
  allHoldings: HoldingDto[] = [];

  periods = PERIODS;
  selectedUserId = 'family'; // 'family' = aggregate view, else a userId

  memberHoldings: HoldingCardDto[] = [];
  loadingMemberDetail = false;

  // Detail-view (per-scheme ledger)
  selectedScheme: HoldingCardDto | null = null;
  ledgerRows: HoldingDto[] = [];
  ledgerDateFrom = '';
  ledgerDateTo = '';

  // Snapshot job trigger
  isTriggeringSnapshot = false;

  // Filters
  schemeFilter = 'all';
  dateFrom: string | null = null;
  dateTo: string | null = null;

  // View state
  showDetailView = false;

  // ViewChild references for donut charts
  @ViewChild('returnsDonut', { static: false }) returnsDonut!: ElementRef;
  @ViewChild('pnlDonut', { static: false }) pnlDonut!: ElementRef;

  // Period colors matching reference
  private readonly PERIOD_COLORS = {
    yesterday: '#C08A2E',
    thisWeek: '#5C6EA8',
    oneMonth: '#7FD1B9',
    oneYear: '#E8A38E'
  };

  constructor(
    private familyService: FamilyPortfolioService,
    private holdingsService: HoldingsService,
    private authFamilyService: AuthFamilyService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    // Render donut charts after view is initialized
    this.renderDonutCharts();
  }

  private renderDonutCharts(): void {
    if (!this.overview) return;

    const headline = this.headline;
    if (!headline) return;

    // Get period returns for donut charts
    const periodReturns = {
      yesterday: this.periodReturnOf(headline, 'yesterday'),
      thisWeek: this.periodReturnOf(headline, 'thisWeek'),
      oneMonth: this.periodReturnOf(headline, 'oneMonth'),
      oneYear: this.periodReturnOf(headline, 'oneYear')
    };

    // Render returns donut
    this.drawDonut(this.returnsDonut, periodReturns, true);
    // Render P&L donut
    this.drawDonut(this.pnlDonut, periodReturns, false);
  }

  private drawDonut(svgElement: ElementRef, periodReturns: any, isPercent: boolean): void {
    if (!svgElement || !svgElement.nativeElement) return;

    const svg = svgElement.nativeElement;
    const size = 100;
    const thickness = 13;
    const r = (size - thickness) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;

    const periods = Object.keys(periodReturns);
    const values = periods.map(p => {
      const ret = periodReturns[p];
      if (!ret || !ret.hasData) return 0;
      return isPercent ? Math.abs(ret.returnPercent) : Math.abs(ret.returnAmount);
    });

    const totalAbs = values.reduce((s: number, v: number) => s + v, 0) || 1;
    let offset = 0;

    let html = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${thickness}"/>`;

    periods.forEach((p, i) => {
      const ret = periodReturns[p];
      if (!ret || !ret.hasData) return;

      const weight = values[i] / totalAbs;
      const len = circumference * weight;
      const color = this.PERIOD_COLORS[p as keyof typeof this.PERIOD_COLORS];

      html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}"
        stroke-width="${thickness}" stroke-dasharray="${len} ${circumference - len}"
        stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += len;
    });

    svg.innerHTML = html;
  }

  loadAll(): void {
    this.loading = true;

    forkJoin({
      overview: this.familyService.getOverview(),
      holdings: this.holdingsService.getAll()
    }).subscribe({
      next: ({ overview, holdings }) => {
        this.overview = overview;
        this.allHoldings = holdings;
        this.loadRelationships();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Failed to load family portfolio.');
      }
    });
  }

  private loadRelationships(): void {
    const anyUserId = this.overview?.members?.[0]?.investorUserId;
    if (!anyUserId) return;

    this.authFamilyService.getRelationshipMapForUser(anyUserId).subscribe({
      next: (map) => this.relationshipMap = map,
      error: () => { /* non-fatal */ }
    });
  }

  relationOf(userId: string): string {
    return this.relationshipMap.get(userId)?.relationshipType ?? '';
  }

  panOf(userId: string): string {
    return this.relationshipMap.get(userId)?.panNumber ?? userId;
  }

  memberSinceOf(userId: string): string | null {
    return this.relationshipMap.get(userId)?.addedAt ?? null;
  }

  foliosLinkedFor(userId: string): number {
    return new Set(
      this.allHoldings.filter(h => h.investorUserId === userId).map(h => h.folioNumber)
    ).size;
  }

  // ── Member Selector ───────────────────────────────────────────
  selectMember(userId: string): void {
    this.selectedUserId = userId;
    this.selectedScheme = null;

    if (userId === 'family') {
      // Aggregate holdings from all family members using allHoldings
      this.memberHoldings = this.aggregateFamilyHoldings();
      return;
    }

    this.loadingMemberDetail = true;
    this.familyService.getMemberHoldings(userId).subscribe({
      next: (data) => {
        this.memberHoldings = data.holdings;
        this.loadingMemberDetail = false;
      },
      error: () => {
        this.loadingMemberDetail = false;
        this.toastr.error('Failed to load member holdings.');
      }
    });
  }

  private aggregateFamilyHoldings(): HoldingCardDto[] {
    // Group holdings by scheme code and aggregate values
    const schemeMap = new Map<string, HoldingCardDto>();

    this.allHoldings.forEach(holding => {
      const existing = schemeMap.get(holding.schemeCode);
      if (existing) {
        existing.investedAmount += holding.investedAmount;
        existing.currentValue += holding.currentValue;
        existing.gain += holding.profitLoss;
        existing.units += holding.units;
        existing.gainPercent = existing.investedAmount > 0
          ? (existing.gain / existing.investedAmount) * 100
          : 0;
        existing.isGain = existing.gain >= 0;
      } else {
        const gainPercent = holding.investedAmount > 0
          ? (holding.profitLoss / holding.investedAmount) * 100
          : 0;
        schemeMap.set(holding.schemeCode, {
          holdingId: holding.id,
          schemeCode: holding.schemeCode,
          schemeName: holding.schemeName,
          fundName: holding.fundName,
          folioNumber: holding.folioNumber,
          orderNumber: holding.orderNumber,
          investedAmount: holding.investedAmount,
          units: holding.units,
          purchaseNAV: holding.purchaseNAV,
          currentNAV: holding.currentNAV,
          currentValue: holding.currentValue,
          gain: holding.profitLoss,
          gainPercent: gainPercent,
          isGain: holding.profitLoss >= 0
        });
      }
    });

    return Array.from(schemeMap.values());
  }

  get currentMember(): MemberSummaryDto | null {
    if (this.selectedUserId === 'family' || !this.overview) return null;
    return this.overview.members.find(m => m.investorUserId === this.selectedUserId) ?? null;
  }

  // ── Aggregate stat helpers ────────────────────────────────────
  get headline() {
    return this.currentMember ?? this.overview;
  }

  get currentValue(): number {
    const h = this.headline;
    if (!h) return 0;
    return (h as any).totalCurrentValue || (h as any).totalFamilyCurrentValue || 0;
  }

  get totalInvested(): number {
    const h = this.headline;
    if (!h) return 0;
    return (h as any).totalInvested || (h as any).totalFamilyInvested || 0;
  }

  get totalGain(): number {
    const h = this.headline;
    if (!h) return 0;
    return (h as any).totalGain || (h as any).totalFamilyGain || 0;
  }

  get totalGainPercent(): number {
    const h = this.headline;
    if (!h) return 0;
    return (h as any).totalGainPercent || (h as any).totalFamilyGainPercent || 0;
  }

  get principalGainsSegments(): DonutSegment[] {
    const h = this.headline;
    if (!h) return [];
    const gain = Math.max(this.totalGain, 0);
    const invested = this.totalInvested;
    return [
      { value: invested, color: 'var(--steel)' },
      { value: gain, color: 'var(--gain)' }
    ];
  }

  periodReturnOf(source: MemberSummaryDto | FamilyOverviewDto | HoldingCardDto | null, key: PeriodKey): QuickReturnDto | null | undefined {
    if (!source) return null;
    return (source as any)[key];
  }

  periodDonutSegments(ret: QuickReturnDto | null | undefined): DonutSegment[] {
    if (!ret || !ret.hasData) return [{ value: 1, color: '#EAE3D5' }];
    const color = ret.isPositive ? 'var(--gain)' : 'var(--loss)';
    const pct = Math.min(Math.abs(ret.returnPercent), 100);
    return [
      { value: pct, color },
      { value: 100 - pct, color: '#EAE3D5' }
    ];
  }

  // ── Scheme card → detail ledger drill-down ────────────────────
  openSchemeDetail(scheme: HoldingCardDto): void {
    this.selectedScheme = scheme;
    this.showDetailView = true;
    const investorUserId = this.selectedUserId;

    this.ledgerRows = this.allHoldings.filter(h =>
      h.investorUserId === investorUserId && h.schemeCode === scheme.schemeCode);

    this.ledgerDateFrom = '';
    this.ledgerDateTo = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeSchemeDetail(): void {
    this.selectedScheme = null;
    this.showDetailView = false;
    this.ledgerRows = [];
  }

  get filteredLedgerRows(): HoldingDto[] {
    let rows = this.ledgerRows;
    // Use the new dateFrom/dateTo properties from the cover filter
    if (this.dateFrom) rows = rows.filter(r => r.purchaseDate && r.purchaseDate >= this.dateFrom!);
    if (this.dateTo) rows = rows.filter(r => r.purchaseDate && r.purchaseDate <= this.dateTo!);
    // Also support the legacy ledgerDateFrom/ledgerDateTo for backward compatibility
    if (this.ledgerDateFrom) rows = rows.filter(r => r.purchaseDate && r.purchaseDate >= this.ledgerDateFrom);
    if (this.ledgerDateTo) rows = rows.filter(r => r.purchaseDate && r.purchaseDate <= this.ledgerDateTo);
    return rows;
  }

  get ledgerTotals() {
    const rows = this.filteredLedgerRows;
    return {
      invested: rows.reduce((s, r) => s + r.investedAmount, 0),
      currentValue: rows.reduce((s, r) => s + r.currentValue, 0),
      units: rows.reduce((s, r) => s + r.units, 0),
      pnl: rows.reduce((s, r) => s + r.profitLoss, 0)
    };
  }

  get uniqueSchemes(): string[] {
    const schemes = new Set<string>();
    this.memberHoldings.forEach(h => schemes.add(h.schemeName));
    return Array.from(schemes).sort();
  }

  get filteredSchemes(): HoldingCardDto[] {
    let schemes = this.memberHoldings;
    // Deduplicate by scheme code to avoid duplicate cards
    const dedupedMap = new Map<string, HoldingCardDto>();
    schemes.forEach(s => {
      if (!dedupedMap.has(s.schemeCode)) {
        dedupedMap.set(s.schemeCode, s);
      }
    });
    schemes = Array.from(dedupedMap.values());

    if (this.schemeFilter !== 'all') {
      schemes = schemes.filter(s => s.schemeName === this.schemeFilter);
    }
    return schemes;
  }

  triggerSnapshot(): void {
    this.isTriggeringSnapshot = true;
    this.familyService.triggerSnapshot().subscribe({
      next: (response: any) => {
        this.isTriggeringSnapshot = false;
        this.toastr.success('Snapshot triggered successfully');
        // Reload data after snapshot
        setTimeout(() => this.loadAll(), 2000);
      },
      error: () => {
        this.isTriggeringSnapshot = false;
        this.toastr.error('Failed to trigger snapshot');
      }
    });
  }

  clearDateRange(): void {
    this.dateFrom = null;
    this.dateTo = null;
  }

  getOwnerName(scheme: HoldingCardDto): string {
    // Find the member who owns this scheme
    const member = this.overview?.members.find(m => m.investorUserId === this.selectedUserId);
    return member?.investorName || 'Unknown';
  }
}
