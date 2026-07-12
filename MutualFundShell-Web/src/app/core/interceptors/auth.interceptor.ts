import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthCookieService } from '../services/auth-cookie.service';
import { environment } from '../../../environments/environment';

/**
 * Web-Component remotes (Scheme, Auth) each bootstrap their own isolated
 * Angular application (see their main.elements.ts) and carry their own
 * HTTP interceptor. Module-Federation remotes (Investment's Orders /
 * Portfolio) do NOT — a federated component is hosted directly inside the
 * shell's single Angular application, so only the shell's own app.config
 * providers apply. Investment-Web's own authInterceptor (which reads ITS
 * OWN localStorage) never runs in that context, and even if it did,
 * localStorage accessed from federated code resolves against the shell's
 * origin (:4200), not Investment's (:4203) — so its token key wouldn't be
 * there regardless. This interceptor is what makes federated components'
 * API calls authenticated: it reads the shared mf_access_token cookie
 * (same one AuthCookieService/every other remote already relies on) and
 * attaches it to requests going to the gateway.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authCookie = inject(AuthCookieService);
  const token = authCookie.getToken();

  const isGatewayRequest = req.url.startsWith(environment.apiUrl);

  if (token && isGatewayRequest) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};
