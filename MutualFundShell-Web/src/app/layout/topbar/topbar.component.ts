import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { LayoutStateService } from '../../core/services/layout-state.service';
import { AuthCookieService } from '../../core/services/auth-cookie.service';
import { remoteApps } from '../../core/config/remote.config';

@Component({
  selector: 'shell-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  readonly layout = inject(LayoutStateService);

  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly authCookie = inject(AuthCookieService);

  pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.titleService.getTitle() || 'MutualFund')
    ),
    { initialValue: 'MutualFund' }
  );

  // Best-effort — see AuthCookieService for why this is currently often
  // null (Auth app stores its token in localStorage today, not the shared
  // cookie the integration plan calls for).
  user = this.authCookie.getUser();

  menuOpen = false;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuOpen = false;
  }

  logout(): void {
    // The shell can't clear Auth's own localStorage across origins, so
    // logout hands off to the Auth app itself, which owns that state.
    window.location.href = `${remoteApps.auth.origin}/login`;
  }
}
