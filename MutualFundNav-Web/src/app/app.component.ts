import { Component } from '@angular/core';

type Tab = 'dashboard' | 'nav-history' | 'job-logs' | 'holidays' | 'kafka';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  activeTab: Tab = 'dashboard';

  tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard',    label: 'Dashboard',       icon: '⬡' },
    { id: 'nav-history',  label: 'NAV History',     icon: '📄' },
    { id: 'job-logs',     label: 'Job Logs',        icon: '🗒' },
    { id: 'holidays',     label: 'Market Holidays', icon: '📅' },
    { id: 'kafka',        label: 'Kafka Events',    icon: '⚡' }
  ];

  setTab(tab: Tab): void { this.activeTab = tab; }
}
