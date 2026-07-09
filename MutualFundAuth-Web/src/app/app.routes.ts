import { Routes } from '@angular/router';
import { UsersComponent } from './features/users/users.component';
import { PendingComponent } from './features/users/pending/pending.component';
import { FamilyComponent } from './features/family/family.component';

export const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', component: UsersComponent },
  { path: 'users/pending', component: PendingComponent },
  { path: 'family', component: FamilyComponent },
  { path: '**', redirectTo: 'users' }
];
