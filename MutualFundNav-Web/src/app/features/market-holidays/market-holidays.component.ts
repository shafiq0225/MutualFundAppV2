import { Component, OnInit } from '@angular/core';
import { HolidaysService } from '../../core/services/holidays.service';
import { MarketHoliday } from '../../core/models/market-holiday.model';

interface CalDay { date: Date; isHoliday: boolean; isSunday: boolean; isSaturday: boolean; holiday?: MarketHoliday; }

@Component({
  selector: 'app-market-holidays',
  templateUrl: './market-holidays.component.html',
  styleUrls: ['./market-holidays.component.scss']
})
export class MarketHolidaysComponent implements OnInit {
  holidays: MarketHoliday[] = [];
  months: { name: string; days: (CalDay | null)[] }[] = [];
  loading = true;
  error: string | null = null;
  errorDetail: string | null = null;
  year = new Date().getFullYear();
  refreshing = false;

  constructor(private holidaySvc: HolidaysService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = null;
    this.holidaySvc.getForYear(this.year).subscribe({
      next: (data) => {
        this.holidays = data;
        this.buildCalendar();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = `[${err.status}] ${err.message}`;
        this.errorDetail = err.detail;
      }
    });
  }

  refresh(): void {
    this.refreshing = true;
    this.holidaySvc.refresh().subscribe({
      next: () => { this.refreshing = false; this.load(); },
      error: (err) => { this.refreshing = false; this.error = `Refresh failed: ${err.message}`; }
    });
  }

  changeYear(delta: number): void {
    this.year += delta;
    this.load();
  }

  private buildCalendar(): void {
    const holidayMap = new Map<string, MarketHoliday>();
    this.holidays.forEach(h => {
      const key = new Date(h.holidayDate).toDateString();
      holidayMap.set(key, h);
    });

    this.months = [];
    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(this.year, m, 1);
      const lastDay  = new Date(this.year, m + 1, 0);
      const days: (CalDay | null)[] = [];

      // blank cells before first day (week starts Monday)
      const startOffset = (firstDay.getDay() + 6) % 7;
      for (let i = 0; i < startOffset; i++) days.push(null);

      for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(this.year, m, d);
        const h = holidayMap.get(date.toDateString());
        days.push({ date, isHoliday: !!h, isSunday: date.getDay() === 0, isSaturday: date.getDay() === 6, holiday: h });
      }

      this.months.push({ name: firstDay.toLocaleString('en-IN', { month: 'long' }), days });
    }
  }
}
