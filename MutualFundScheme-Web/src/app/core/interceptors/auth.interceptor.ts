import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';

const COOKIE_NAME = 'mf_access_token';

function readCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

// This app never issues or stores its own token (unlike Auth-Web) — it's
// purely a consumer of whatever mf_access_token cookie is already present.
// That cookie is set by Auth-Web's login (see auth.service.ts there) and
// is readable here regardless of port, and regardless of whether this
// script is running standalone (ng serve, :4205) or embedded inside the
// shell's document as scheme-list-element/scheme-nav-element (:4200) —
// cookies aren't port-scoped, unlike localStorage.
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const token = readCookie(COOKIE_NAME);

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
