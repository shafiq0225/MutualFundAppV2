import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutStateService } from '../../core/services/layout-state.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** Shows a small "Soon" badge — the route still navigates to a placeholder page. */
  soon: boolean;
}

@Component({
  selector: 'shell-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly layout = inject(LayoutStateService);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fa-gauge-high', route: '/dashboard', soon: true },
    { label: 'User', icon: 'fa-user', route: '/user', soon: true },
    { label: 'Pending Approvals', icon: 'fa-hourglass-half', route: '/pending-approvals', soon: true },
    { label: 'Family Groups', icon: 'fa-people-roof', route: '/family-groups', soon: true },
    { label: 'Scheme', icon: 'fa-list-check', route: '/scheme', soon: false },
    { label: 'NAV Comparison', icon: 'fa-chart-line', route: '/nav-comparison', soon: false },
    { label: 'Orders', icon: 'fa-receipt', route: '/orders', soon: true },
    { label: 'Portfolio', icon: 'fa-wallet', route: '/portfolio', soon: true }
  ];
}
