import { Component, OnInit } from '@angular/core';
import { NavService } from '../../core/services/nav.service';
import { NavFileSummary } from '../../core/models/nav-file.model';

@Component({
  selector: 'app-kafka-events',
  templateUrl: './kafka-events.component.html',
  styleUrls: ['./kafka-events.component.scss']
})
export class KafkaEventsComponent implements OnInit {
  events: NavFileSummary[] = [];
  loading = true;
  error: string | null = null;
  errorDetail: string | null = null;

  constructor(private navSvc: NavService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = null;
    this.navSvc.getHistory().subscribe({
      next: (data) => {
        // Each stored NAV = one nav-file-processed Kafka event
        this.events = data.filter(d => !d.isHoliday).sort((a, b) =>
          new Date(b.navDate).getTime() - new Date(a.navDate).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.error = 'GET /api/nav/history endpoint not found (404).';
          this.errorDetail = 'Add the /history endpoint to NavController to enable Kafka event tracking.';
        } else {
          this.error = `[${err.status}] ${err.message}`;
          this.errorDetail = err.detail;
        }
      }
    });
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(dt: string): string {
    return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }
}
