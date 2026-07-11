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

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Cookie first: this same interceptor also ships inside main.elements.ts
  // and runs inside whichever document embeds it (the shell, at whatever
  // port), so it needs to read whatever that document's origin can see.
  // The cookie is shared across localhost ports; localStorage isn't.
  const token = readCookie(COOKIE_NAME) || localStorage.getItem('access_token');

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
