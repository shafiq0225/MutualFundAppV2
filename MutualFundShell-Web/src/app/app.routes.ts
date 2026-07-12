import { Routes } from '@angular/router';
import { PlaceholderComponent } from './features/placeholder/placeholder.component';
import { SchemeListHostComponent } from './features/scheme-host/scheme-list-host.component';
import { SchemeNavHostComponent } from './features/scheme-host/scheme-nav-host.component';
import { UsersHostComponent } from './features/auth-host/users-host.component';
import { PendingHostComponent } from './features/auth-host/pending-host.component';
import { FamilyHostComponent } from './features/auth-host/family-host.component';
import { LoginHostComponent } from './features/auth-host/login-host.component';
import { RegisterHostComponent } from './features/auth-host/register-host.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginHostComponent, title: 'Login' },
  { path: 'register', component: RegisterHostComponent, title: 'Register' },

  // Functional today
  { path: 'scheme', component: SchemeListHostComponent, title: 'Scheme Management', canActivate: [authGuard] },
  { path: 'nav-comparison', component: SchemeNavHostComponent, title: 'NAV Comparison', canActivate: [authGuard] },
  { path: 'user', component: UsersHostComponent, title: 'User', canActivate: [authGuard] },
  { path: 'pending-approvals', component: PendingHostComponent, title: 'Pending Approvals', canActivate: [authGuard] },
  { path: 'family-groups', component: FamilyHostComponent, title: 'Family Groups', canActivate: [authGuard] },

  // Placeholders — reserved in the sidebar, not yet wired to a remote
  { path: 'dashboard', component: PlaceholderComponent, data: { title: 'Dashboard' }, title: 'Dashboard', canActivate: [authGuard] },
  { path: 'orders', component: PlaceholderComponent, data: { title: 'Orders' }, title: 'Orders', canActivate: [authGuard] },
  { path: 'portfolio', component: PlaceholderComponent, data: { title: 'Portfolio' }, title: 'Portfolio', canActivate: [authGuard] },

  { path: '**', redirectTo: 'dashboard' }
];