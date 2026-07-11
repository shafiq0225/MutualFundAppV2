import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthCookieService } from '../services/auth-cookie.service';

// Mirrors MutualFundAuth-Web's own auth.guard.ts, but checks the shared
// mf_access_token cookie (via AuthCookieService) instead of AuthService,
// since the shell has no AuthService of its own — the cookie is the only
// thing it shares with Auth-Web.
export const authGuard: CanActivateFn = (route, state) => {
  const authCookie = inject(AuthCookieService);
  const router = inject(Router);

  if (authCookie.getUser()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
