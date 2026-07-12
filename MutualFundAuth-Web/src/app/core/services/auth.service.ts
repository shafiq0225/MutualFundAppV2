import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Cookies (unlike localStorage) are scoped by hostname only, not port — a
// cookie set with no explicit Domain from http://localhost:4202 is also
// readable from http://localhost:4200, :4205, etc. That's what lets the
// shell (and every other embedded remote) see the logged-in user without
// each of them needing their own copy of this service. See
// MutualFundShell-Web's AuthCookieService, which was already written
// against this exact cookie name in anticipation of this fix.
const COOKIE_NAME = 'mf_access_token';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // 8h, matches typical access-token lifetime

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = `${environment.authApiUrl}/api/auth`;
  private readonly tokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  login(dto: LoginDto): Observable<TokenResponseDto> {
    return this.http.post<TokenResponseDto>(`${this.authApi}/login`, dto).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken, response.expiresIn);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  logout(): Observable<{ message: string }> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    return this.http.post<{ message: string }>(`${this.authApi}/logout`, { refreshToken }).pipe(
      tap(() => {
        this.clearTokens();
        this.isAuthenticatedSubject.next(false);
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  private setTokens(accessToken: string, refreshToken: string, expiresIn?: number): void {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    setCookie(COOKIE_NAME, accessToken, expiresIn && expiresIn > 0 ? expiresIn : COOKIE_MAX_AGE_SECONDS);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    clearCookie(COOKIE_NAME);
  }

  private checkAuthStatus(): void {
    this.isAuthenticatedSubject.next(this.hasValidToken());
  }

  /**
   * Token PRESENCE isn't the same as token VALIDITY. A token can sit in
   * localStorage from a previous session after it's expired server-side —
   * that's exactly what causes API calls to 401 while isLoggedIn() still
   * naively returned true. This decodes the JWT's `exp` claim and treats
   * a missing, malformed, or expired token as logged-out, clearing it so
   * it doesn't keep tripping the same check later.
   */
  private hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const expiry = this.getTokenExpiry(token);
    if (expiry === null || expiry * 1000 <= Date.now()) {
      this.clearTokens();
      return false;
    }
    return true;
  }

  private getTokenExpiry(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
      const claims = JSON.parse(json);
      return typeof claims.exp === 'number' ? claims.exp : null;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }
}