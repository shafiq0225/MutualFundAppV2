import { Routes } from '@angular/router';
import { UsersComponent } from './features/users/users.component';
import { PendingComponent } from './features/users/pending/pending.component';
import { FamilyComponent } from './features/family/family.component';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'users', component: UsersComponent, canActivate: [authGuard] },
  { path: 'users/pending', component: PendingComponent, canActivate: [authGuard] },
  { path: 'family', component: FamilyComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
