import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpBackend,
  HttpClient
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError, NEVER, BehaviorSubject, filter, take } from 'rxjs';
import { environment } from '../../../environments/environment';

const COOKIE_NAME = 'mf_access_token';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

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
  const backend = inject(HttpBackend);
  const http = new HttpClient(backend); // Bypasses interceptors to avoid circular injection
  
  const token = readCookie(COOKIE_NAME);
  const isGatewayRequest = req.url.startsWith(environment.apiUrl);
  const isRetry = req.headers.has('X-Token-Retry');

  let authReq = req;
  if (token && isGatewayRequest) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isGatewayRequest && !isRetry) {
        return handle401Error(authReq, next, http);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, http: HttpClient): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      isRefreshing = false;
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
      window.location.href = '/login';
      return NEVER;
    }

    return http.post<any>(`${environment.apiUrl}/api/auth/refresh`, { refreshToken }).pipe(
      switchMap((res: any) => {
        isRefreshing = false;

        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);

        const maxAge = res.expiresIn && res.expiresIn > 0 ? res.expiresIn : 60 * 60 * 8;
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(res.accessToken)}; path=/; max-age=${maxAge}; SameSite=Lax`;

        refreshTokenSubject.next(res.accessToken);

        return next(req.clone({
          setHeaders: { 
            Authorization: `Bearer ${res.accessToken}`,
            'X-Token-Retry': 'true'
          }
        }));
      }),
      catchError((err) => {
        isRefreshing = false;
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;

        window.location.href = '/login';
        return NEVER;
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next(req.clone({
          setHeaders: { 
            Authorization: `Bearer ${token}`,
            'X-Token-Retry': 'true'
          }
        }));
      })
    );
  }
}
