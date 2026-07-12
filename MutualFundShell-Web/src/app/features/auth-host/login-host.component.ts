import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WebComponentLoaderService } from '../../core/services/webcomponent-loader.service';
import { AuthCookieService } from '../../core/services/auth-cookie.service';
import { remoteApps } from '../../core/config/remote.config';

@Component({
  selector: 'shell-login-host',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (ready()) {
      <!-- auth-login-element dispatches loginSuccess / switchToRegister as
           native CustomEvents (that's how Angular Elements maps @Output),
           so these bindings work even though this is an unknown element
           as far as the shell's own compiler is concerned. -->
      <auth-login-element
        (loginSuccess)="onLoginSuccess()"
        (switchToRegister)="onSwitchToRegister()">
      </auth-login-element>
    } @else if (error()) {
      <div class="remote-error">
        <i class="fas fa-triangle-exclamation"></i>
        Login is unavailable right now. Confirm MutualFundAuth-Web is running
        on port 4202 and try again.
      </div>
    } @else {
      <div class="remote-loading">
        <i class="fas fa-circle-notch fa-spin"></i> Loading Login…
      </div>
    }
  `,
  styles: [`
    .remote-loading, .remote-error {
      display: flex; align-items: center; gap: 10px;
      padding: 40px; color: var(--text-muted, #6B6455);
    }
    .remote-error { color: var(--danger, #9C3B26); }
  `]
})
export class LoginHostComponent implements OnInit {
  private readonly loader = inject(WebComponentLoaderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authCookie = inject(AuthCookieService);

  ready = signal(false);
  error = signal(false);

  ngOnInit(): void {
    // '/' now redirects here (the shell's start page is login — see
    // app.routes.ts), so an already-authenticated visitor landing on
    // /login should skip straight past the form rather than being asked
    // to log in again.
    if (this.authCookie.getUser()) {
      this.onLoginSuccess();
      return;
    }

    this.loader.load('auth')
      .then(() => this.ready.set(true))
      .catch(() => this.error.set(true));
  }

  onLoginSuccess(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl || '/dashboard');
  }

  onSwitchToRegister(): void {
    // Registration isn't a "logged in" action and isn't embedded (see
    // main.elements.ts) — hand off to the standalone Auth-Web app itself.
    window.location.href = `${remoteApps.auth.origin}/register`;
  }
}
