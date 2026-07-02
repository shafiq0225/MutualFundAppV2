import {
  Component, OnInit, ChangeDetectorRef,
  ElementRef, ViewChild, ViewChildren,
  QueryList, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { SchemeDetailsService } from '../../core/services/scheme-details.service';
import { SchemeDetailsDto, PeriodReturnDto } from '../../core/models/scheme-details.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

export interface PeriodCard {
  label: string;
  period: PeriodReturnDto | null;
  sliceCount: number;
}

@Component({
  selector: 'app-scheme-details',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './scheme-details.component.html',
  styleUrls: ['./scheme-details.component.scss']
})
export class SchemeDetailsComponent implements OnInit, AfterViewInit {
  scheme: SchemeDetailsDto | null = null;
  loading = true;
  schemeCode = '';

  @ViewChild('sparklineCanvas')
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChildren('periodCanvas')
  periodCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: SchemeDetailsService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.schemeCode =
      this.route.snapshot.paramMap.get('schemeCode') || '';
    this.loadDetails();
  }

  ngAfterViewInit(): void {
    if (this.scheme?.navHistory?.length) {
      this.drawAllCharts();
    }
  }

  loadDetails(): void {
    this.loading = true;
    this.service.getSchemeDetails(this.schemeCode).subscribe({
      next: (data) => {
        this.scheme = data;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.drawAllCharts(), 120);
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Failed to load scheme details.');
        this.cdr.detectChanges();
      }
    });
  }

  // ── Period card definitions ──────────────────────────────────────
  get periodCards(): PeriodCard[] {
    if (!this.scheme) return [];
    return [
      { label: '1 Month', period: this.scheme.oneMonth, sliceCount: 5 },
      { label: '3 Month', period: this.scheme.threeMonth, sliceCount: 10 },
      { label: '6 Month', period: this.scheme.sixMonth, sliceCount: 18 },
      { label: '1 Year', period: this.scheme.oneYear, sliceCount: 25 },
      { label: '3 Year', period: this.scheme.threeYear, sliceCount: 30 },
    ];
  }

  // ── Draw all charts ──────────────────────────────────────────────
  drawAllCharts(): void {
    this.drawSparkline();
    setTimeout(() => this.drawPeriodSparklines(), 60);
  }

  drawSparkline(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.scheme?.navHistory?.length) return;
    const navs = this.scheme.navHistory.map(d => d.nav);
    this.drawChart(canvas, navs, this.scheme.isDailyUp, 80);
  }

  drawPeriodSparklines(): void {
    if (!this.periodCanvases || !this.scheme?.navHistory?.length) return;

    // FIX: #periodCanvas lives inside *ngIf="card.period?.hasData", so
    // QueryList only holds canvases for cards where hasData === true.
    // Build a parallel array of only the data-bearing cards so that
    // canvases[i] always corresponds to cardsWithData[i].
    const cardsWithData = this.periodCards.filter(c => c.period?.hasData);

    this.periodCanvases.toArray().forEach((ref, i) => {
      const card = cardsWithData[i];
      const canvas = ref?.nativeElement;
      if (!canvas || !card?.period?.hasData) return;

      const slice = this.scheme!.navHistory
        .slice(-card.sliceCount)
        .map(d => d.nav);

      this.drawChart(canvas, slice, card.period.isPositive, 52);
    });
  }

  private drawChart(
    canvas: HTMLCanvasElement,
    navs: number[],
    isUp: boolean,
    height: number
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || navs.length < 2) return;

    // FIX: getBoundingClientRect().width is reliable on mobile where
    // offsetWidth can return 0 before the first paint completes.
    const W = Math.round(
      canvas.getBoundingClientRect().width || canvas.offsetWidth || 200
    );
    const H = height;
    canvas.width = W;
    canvas.height = H;

    const min = Math.min(...navs);
    const max = Math.max(...navs);
    const range = max - min || 1;
    const pad = { t: 6, r: 4, b: 6, l: 4 };
    const cW = W - pad.l - pad.r;
    const cH = H - pad.t - pad.b;
    const step = cW / (navs.length - 1);

    const pts = navs.map((n, i) => ({
      x: pad.l + i * step,
      y: pad.t + cH - ((n - min) / range) * cH
    }));

    const color = isUp ? '#22c55e' : '#ef4444';
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, isUp
      ? 'rgba(34,197,94,0.22)'
      : 'rgba(239,68,68,0.22)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    // Fill
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.lineTo(pts[0].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  goBack(): void {
    this.router.navigate(['/nav']);
  }
}
