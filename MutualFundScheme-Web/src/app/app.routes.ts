import { Routes } from '@angular/router';
import { NavComponent } from './features/nav/nav.component';
import { SchemeDetailsComponent } from './features/scheme-details/scheme-details.component';
import { SchemesComponent } from './features/schemes/schemes.component';

export const routes: Routes = [
  { path: '', redirectTo: 'nav', pathMatch: 'full' },
  { path: 'nav', component: NavComponent },
  // Nested under 'nav' so NavComponent's relative navigate(['scheme', code])
  // and SchemeDetailsComponent's navigate(['../..']) resolve back to /nav.
  { path: 'nav/scheme/:schemeCode', component: SchemeDetailsComponent },
  { path: 'schemes', component: SchemesComponent },
  { path: '**', redirectTo: 'nav' }
];
