import { Component, OnInit } from '@angular/core';
import { NavService } from '../../core/services/nav.service';
import { NavFileSummary } from '../../core/models/nav-file.model';

@Component({
  selector: 'app-nav-history',
  templateUrl: './nav-history.component.html',
  styleUrls: ['./nav-history.component.scss']
})
export class NavHistoryComponent implements OnInit {
  records: NavFileSummary[] = [];
  filtered: NavFileSummary[] = [];
  loading = true;
  error: string | null = null;
  errorDetail: string | null = null;
  search = '';
  sortCol = 'navDate';
  sortDir = -1; // -1 = desc

  constructor(private navSvc: NavService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = null;
    this.navSvc.getHistory().subscribe({
      next: (data) => {
        this.records = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.error = 'GET /api/nav/history endpoint not found (404).';
          this.errorDetail = 'This endpoint needs to be added to NavController. See the backend update guide.';
        } else {
          this.error = `[${err.status}] ${err.message}`;
          this.errorDetail = err.detail;
        }
      }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.records
      .filter(r => !q || r.navDate.includes(q))
      .sort((a, b) => {
        const av = (a as any)[this.sortCol];
        const bv = (b as any)[this.sortCol];
        return av < bv ? this.sortDir : av > bv ? -this.sortDir : 0;
      });
  }

  sort(col: string): void {
    if (this.sortCol === col) this.sortDir *= -1;
    else { this.sortCol = col; this.sortDir = -1; }
    this.applyFilter();
  }

  sortIcon(col: string): string {
    if (this.sortCol !== col) return '↕';
    return this.sortDir === -1 ? '↓' : '↑';
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(dt: string): string {
    return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

}
