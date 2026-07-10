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
        this.setTokens(response.accessToken, response.refreshToken);
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

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    // Also write to a cookie so other apps on the same domain (different ports)
    // can read the token — localStorage is origin-scoped (host+port), cookies are not.
    const maxAge = 60 * 60 * 8; // 8 hours
    document.cookie = `mf_access_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }

  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    // Expire the shared cookie
    document.cookie = `mf_access_token=; path=/; max-age=0; SameSite=Lax`;
  }

  private checkAuthStatus(): void {
    const token = this.getAccessToken();
    this.isAuthenticatedSubject.next(!!token);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
