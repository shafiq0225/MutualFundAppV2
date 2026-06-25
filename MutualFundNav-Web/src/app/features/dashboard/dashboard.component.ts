import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription, forkJoin } from 'rxjs';
import { NavService } from '../../core/services/nav.service';
import { JobsService } from '../../core/services/jobs.service';
import { JobLog } from '../../core/models/job-log.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  latestNavDate: string | null = null;
  latestNavRecords: number | null = null;
  targetDate: string | null = null;
  latestJob: JobLog | null = null;
  countdown = '';
  loading = true;
  triggering = false;
  triggerResult: { success: boolean; message: string } | null = null;
  error: string | null = null;
  customTriggerDate = '';

  private subs = new Subscription();

  constructor(private navSvc: NavService, private jobsSvc: JobsService) {}

  ngOnInit(): void {
    this.load();
    // auto-refresh every 30 seconds
    this.subs.add(interval(30000).subscribe(() => this.load()));
    // countdown every second
    this.subs.add(interval(1000).subscribe(() => this.updateCountdown()));
    this.updateCountdown();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      latest: this.navSvc.getLatest(),
      target: this.navSvc.getTargetDate(),
      job: this.jobsSvc.getLatestLog()
    }).subscribe({
      next: ({ latest, target, job }) => {
        this.latestNavDate = latest?.latestNavDate ?? null;
        this.targetDate = target?.targetDate ?? null;
        this.latestJob = job;
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load dashboard: [${err.status}] ${err.message}`;
        this.loading = false;
      }
    });
  }

  trigger(date?: string): void {
    this.triggering = true;
    this.triggerResult = null;
    const call = date ? this.navSvc.triggerForDate(date) : this.navSvc.trigger();

    call.subscribe({
      next: (res) => {
        this.triggering = false;
        this.triggerResult = {
          success: true,
          message: res.wasStored
            ? `✓ NAV downloaded for ${res.date}. ${res.message ?? ''}`
            : `ℹ Already stored for ${res.date}.`
        };
        this.load();
      },
      error: (err) => {
        this.triggering = false;
        this.triggerResult = {
          success: false,
          message: `✗ Trigger failed [${err.status}]: ${err.message}`
        };
      }
    });
  }

  private updateCountdown(): void {
    const now = new Date();
    const next = new Date();
    next.setHours(8, 30, 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);
    const diff = next.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    this.countdown = `${h}h ${m}m ${s}s`;
  }

  get jobStatusClass(): string {
    if (!this.latestJob) return 'unknown';
    return this.latestJob.isSuccess ? 'success' : 'failure';
  }

  get jobStatusLabel(): string {
    if (!this.latestJob) return 'No runs yet';
    return this.latestJob.isSuccess ? 'Success' : 'Failed';
  }

  formatDate(dt: string | null): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatTime(dt: string | null): string {
    if (!dt) return '';
    return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
