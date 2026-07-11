import { Routes } from '@angular/router';
import { PlaceholderComponent } from './features/placeholder/placeholder.component';
import { SchemeListHostComponent } from './features/scheme-host/scheme-list-host.component';
import { SchemeNavHostComponent } from './features/scheme-host/scheme-nav-host.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Functional today
  { path: 'scheme', component: SchemeListHostComponent, title: 'Scheme Management' },
  { path: 'nav-comparison', component: SchemeNavHostComponent, title: 'NAV Comparison' },

  // Placeholders — reserved in the sidebar, not yet wired to a remote
  { path: 'dashboard', component: PlaceholderComponent, data: { title: 'Dashboard' }, title: 'Dashboard' },
  { path: 'user', component: PlaceholderComponent, data: { title: 'User' }, title: 'User' },
  { path: 'pending-approvals', component: PlaceholderComponent, data: { title: 'Pending Approvals' }, title: 'Pending Approvals' },
  { path: 'family-groups', component: PlaceholderComponent, data: { title: 'Family Groups' }, title: 'Family Groups' },
  { path: 'orders', component: PlaceholderComponent, data: { title: 'Orders' }, title: 'Orders' },
  { path: 'portfolio', component: PlaceholderComponent, data: { title: 'Portfolio' }, title: 'Portfolio' },

  { path: '**', redirectTo: 'dashboard' }
];
