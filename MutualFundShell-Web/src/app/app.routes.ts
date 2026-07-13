import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { PlaceholderComponent } from './features/placeholder/placeholder.component';
import { SchemeListHostComponent } from './features/scheme-host/scheme-list-host.component';
import { SchemeNavHostComponent } from './features/scheme-host/scheme-nav-host.component';
import { UsersHostComponent } from './features/auth-host/users-host.component';
import { PendingHostComponent } from './features/auth-host/pending-host.component';
import { FamilyHostComponent } from './features/auth-host/family-host.component';
import { LoginHostComponent } from './features/auth-host/login-host.component';
import { RegisterHostComponent } from './features/auth-host/register-host.component';
import { authGuard, requiresPermission } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginHostComponent, title: 'Login' },
  { path: 'register', component: RegisterHostComponent, title: 'Register' },

  // Functional today — Scheme/NAV/User/Pending/Family are Web Components
  // (each bootstraps its own isolated Angular app, see their
  // main.elements.ts). Orders/Portfolio are Module Federation instead —
  // MutualFundInvestment-Web exposes these two standalone components
  // directly (see its federation.config.js) and they're hosted inside
  // THIS app's own router-outlet/injector, not an isolated one. That's
  // why they needed the shell's own auth interceptor (see
  // core/interceptors/auth.interceptor.ts) rather than relying on
  // Investment-Web's own — that one never runs in this context.
  { path: 'scheme', component: SchemeListHostComponent, title: 'Scheme Management', canActivate: [authGuard, requiresPermission('scheme.manage')] },
  { path: 'nav-comparison', component: SchemeNavHostComponent, title: 'NAV Comparison', canActivate: [authGuard] },
  { path: 'user', component: UsersHostComponent, title: 'User', canActivate: [authGuard] },
  { path: 'pending-approvals', component: PendingHostComponent, title: 'Pending Approvals', canActivate: [authGuard] },
  { path: 'family-groups', component: FamilyHostComponent, title: 'Family Groups', canActivate: [authGuard] },
  {
    path: 'orders',
    title: 'Orders',
    canActivate: [authGuard],
    loadComponent: () =>
      loadRemoteModule({
        remoteName: 'mutualfund-investment-web',
        exposedModule: './Orders'
      }).then((m) => m.OrdersComponent)
  },
  {
    path: 'portfolio',
    title: 'Portfolio',
    canActivate: [authGuard],
    loadComponent: () =>
      loadRemoteModule({
        remoteName: 'mutualfund-investment-web',
        exposedModule: './Portfolio'
      }).then((m) => m.InvestorComponent)
  },

  // Placeholders — reserved in the sidebar, not yet wired to a remote
  { path: 'dashboard', component: PlaceholderComponent, data: { title: 'Dashboard' }, title: 'Dashboard', canActivate: [authGuard] },

  { path: '**', redirectTo: 'dashboard' }
];