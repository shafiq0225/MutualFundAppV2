import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginDto, TokenResponseDto, DecodedTokenClaims } from '../models/auth.model';

const TOKEN_KEY = 'mf_investment_access_token';
const REFRESH_KEY = 'mf_investment_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.authApiUrl}/api/auth`;

  // Reactive signal so the app shell can show/hide login state
  currentUser = signal<DecodedTokenClaims | null>(this.decodeStoredToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(dto: LoginDto): Observable<TokenResponseDto> {
    return this.http.post<TokenResponseDto>(`${this.api}/login`, dto).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        localStorage.setItem(REFRESH_KEY, res.refreshToken);
        this.currentUser.set(this.decodeToken(res.accessToken));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const claims = this.currentUser();
    if (!claims) return false;
    return claims.exp * 1000 > Date.now();
  }

  private decodeStoredToken(): DecodedTokenClaims | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const claims = this.decodeToken(token);
    // Drop expired tokens on load rather than pretending they're valid
    if (claims && claims.exp * 1000 <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      return null;
    }
    return claims;
  }

  private decodeToken(token: string): DecodedTokenClaims | null {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as DecodedTokenClaims;
    } catch {
      return null;
    }
  }
}
