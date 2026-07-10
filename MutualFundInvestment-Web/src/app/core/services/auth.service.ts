import { Injectable, signal } from '@angular/core';
import { DecodedTokenClaims } from '../models/auth.model';

// Cookie name written by MutualFundAuth-Web after login.
// Cookies are scoped by domain (not port), so both apps running on localhost
// share the same cookie jar — unlike localStorage which is per origin (host+port).
const COOKIE_NAME = 'mf_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signal used only for topbar display (user name).
  // Auth decisions always call decodeStoredToken() fresh — never read the signal —
  // so the cookie written by Auth-Web is always picked up on page refresh.
  currentUser = signal<DecodedTokenClaims | null>(this.decodeStoredToken());

  /**
   * Read fresh from the shared cookie on every call so that a login performed
   * in MutualFundAuth-Web (different port, same domain) is recognised
   * immediately after a page refresh in this app.
   */
  isAuthenticated(): boolean {
    const claims = this.decodeStoredToken();
    if (!claims) return false;
    this.currentUser.set(claims);   // keep topbar in sync
    return true;
  }

  getAccessToken(): string | null {
    return this.getCookie(COOKIE_NAME);
  }

  private decodeStoredToken(): DecodedTokenClaims | null {
    const token = this.getCookie(COOKIE_NAME);
    if (!token) return null;
    const claims = this.decodeToken(token);
    if (!claims) return null;
    // Treat expired tokens as absent
    if (claims.exp * 1000 <= Date.now()) return null;
    return claims;
  }

  private getCookie(name: string): string | null {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
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
