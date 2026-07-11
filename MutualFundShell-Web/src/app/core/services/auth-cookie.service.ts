import { Injectable } from '@angular/core';

export interface AuthUser {
  name: string;
  email?: string;
  raw: Record<string, unknown>;
}

/**
 * Reads the shared `mf_access_token` cookie. MutualFundAuth-Web's
 * AuthService sets this cookie (in addition to its own localStorage
 * entries) on login/logout — see auth.service.ts. Cookies aren't
 * port-scoped like localStorage is, so this works regardless of whether
 * the token was set from Auth-Web's own origin (:4202) or from inside an
 * embedded auth-login-element running in the shell's own document (:4200).
 */
@Injectable({ providedIn: 'root' })
export class AuthCookieService {
  private static readonly COOKIE_NAME = 'mf_access_token';

  getUser(): AuthUser | null {
    const token = this.readCookie(AuthCookieService.COOKIE_NAME);
    if (!token) return null;

    const claims = this.decodeJwtPayload(token);
    if (!claims) return null;

    const name =
      (claims['name'] as string) ||
      (claims['unique_name'] as string) ||
      (claims['email'] as string) ||
      'Account';

    return { name, email: claims['email'] as string | undefined, raw: claims };
  }

  private readCookie(name: string): string | null {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(name + '='));
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
