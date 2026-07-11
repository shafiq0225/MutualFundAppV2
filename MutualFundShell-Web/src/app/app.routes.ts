import { Routes } from '@angular/router';
import { PlaceholderComponent } from './features/placeholder/placeholder.component';
import { SchemeListHostComponent } from './features/scheme-host/scheme-list-host.component';
import { SchemeNavHostComponent } from './features/scheme-host/scheme-nav-host.component';
import { UsersHostComponent } from './features/auth-host/users-host.component';
import { PendingHostComponent } from './features/auth-host/pending-host.component';
import { FamilyHostComponent } from './features/auth-host/family-host.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Functional today
  { path: 'scheme', component: SchemeListHostComponent, title: 'Scheme Management' },
  { path: 'nav-comparison', component: SchemeNavHostComponent, title: 'NAV Comparison' },
  { path: 'user', component: UsersHostComponent, title: 'User' },
  { path: 'pending-approvals', component: PendingHostComponent, title: 'Pending Approvals' },
  { path: 'family-groups', component: FamilyHostComponent, title: 'Family Groups' },

  // Placeholders — reserved in the sidebar, not yet wired to a remote
  { path: 'dashboard', component: PlaceholderComponent, data: { title: 'Dashboard' }, title: 'Dashboard' },
  { path: 'orders', component: PlaceholderComponent, data: { title: 'Orders' }, title: 'Orders' },
  { path: 'portfolio', component: PlaceholderComponent, data: { title: 'Portfolio' }, title: 'Portfolio' },

  { path: '**', redirectTo: 'dashboard' }
];