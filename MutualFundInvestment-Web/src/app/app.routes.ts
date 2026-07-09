import { Routes } from '@angular/router';
import { OrdersComponent } from './features/orders/orders.component';
import { InvestorComponent } from './features/investor/investor.component';

export const routes: Routes = [
  { path: '', redirectTo: 'orders', pathMatch: 'full' },
  { path: 'orders', component: OrdersComponent },
  { path: 'investor', component: InvestorComponent },
  { path: '**', redirectTo: 'orders' }
];
