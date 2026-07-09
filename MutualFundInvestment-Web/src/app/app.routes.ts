import { Routes } from '@angular/router';
import { OrdersComponent } from './features/orders/orders.component';
import { InvestorComponent } from './features/investor/investor.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'orders', pathMatch: 'full' },
  { path: 'orders', component: OrdersComponent, canActivate: [authGuard] },
  { path: 'investor', component: InvestorComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'orders' }
];
