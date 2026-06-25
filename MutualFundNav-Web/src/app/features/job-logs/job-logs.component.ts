import { Component, OnInit } from '@angular/core';
import { JobsService } from '../../core/services/jobs.service';
import { JobLog } from '../../core/models/job-log.model';

@Component({
  selector: 'app-job-logs',
  templateUrl: './job-logs.component.html',
  styleUrls: ['./job-logs.component.scss']
})
export class JobLogsComponent implements OnInit {
  logs: JobLog[] = [];
  loading = true;
  error: string | null = null;
  errorDetail: string | null = null;
  expandedId: number | null = null;
  count = 50;

  constructor(private jobsSvc: JobsService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = null;
    this.jobsSvc.getLogs(this.count).subscribe({
      next: (data) => { this.logs = data; this.loading = false; },
      error: (err) => {
        this.loading = false;
        this.error = `[${err.status}] ${err.message}`;
        this.errorDetail = err.detail;
      }
    });
  }

  toggle(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  formatDate(dt: string | null): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  duration(log: JobLog): string {
    if (log.elapsedSeconds == null) return '—';
    if (log.elapsedSeconds < 60) return `${log.elapsedSeconds.toFixed(2)}s`;
    return `${(log.elapsedSeconds / 60).toFixed(1)}m`;
  }

  get successCount(): number { return this.logs.filter(l => l.isSuccess).length; }
  get failureCount(): number { return this.logs.filter(l => !l.isSuccess).length; }
}
