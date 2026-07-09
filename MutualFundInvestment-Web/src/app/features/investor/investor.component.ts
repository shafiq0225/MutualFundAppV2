import { Component, OnInit } from '@angular/core';
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
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, DonutChartComponent],
  templateUrl: './investor.component.html',
  styleUrls: ['./investor.component.scss']
})
export class InvestorComponent implements OnInit {
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

  constructor(
    private familyService: FamilyPortfolioService,
    private holdingsService: HoldingsService,
    private authFamilyService: AuthFamilyService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadAll();
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
    const anyUserId = this.overview?.members?.[0]?.userId;
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
      this.memberHoldings = [];
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

  get currentMember(): MemberSummaryDto | null {
    if (this.selectedUserId === 'family' || !this.overview) return null;
    return this.overview.members.find(m => m.userId === this.selectedUserId) ?? null;
  }

  // ── Aggregate stat helpers ────────────────────────────────────
  get headline() {
    return this.currentMember ?? this.overview;
  }

  get principalGainsSegments(): DonutSegment[] {
    const h = this.headline;
    if (!h) return [];
    const gain = Math.max(h.profitLoss, 0);
    return [
      { value: h.totalInvested, color: 'var(--steel)' },
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
    const investorUserId = this.selectedUserId;

    this.ledgerRows = this.allHoldings.filter(h =>
      h.investorUserId === investorUserId && h.schemeCode === scheme.schemeCode);

    this.ledgerDateFrom = '';
    this.ledgerDateTo = '';
  }

  closeSchemeDetail(): void {
    this.selectedScheme = null;
    this.ledgerRows = [];
  }

  get filteredLedgerRows(): HoldingDto[] {
    let rows = this.ledgerRows;
    if (this.ledgerDateFrom) rows = rows.filter(r => r.purchaseDate >= this.ledgerDateFrom);
    if (this.ledgerDateTo) rows = rows.filter(r => r.purchaseDate <= this.ledgerDateTo);
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
}
