import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebComponentLoaderService } from '../../core/services/webcomponent-loader.service';

@Component({
  selector: 'shell-register-host',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (ready()) {
      <!-- auth-register-element dispatches registerSuccess / switchToLogin as
           native CustomEvents (that's how Angular Elements maps @Output),
           so these bindings work even though this is an unknown element
           as far as the shell's own compiler is concerned. -->
      <auth-register-element
        (registerSuccess)="onRegisterSuccess()"
        (switchToLogin)="onSwitchToLogin()">
      </auth-register-element>
    } @else if (error()) {
      <div class="remote-error">
        <i class="fas fa-triangle-exclamation"></i>
        Registration is unavailable right now. Confirm MutualFundAuth-Web is running
        on port 4202 and try again.
      </div>
    } @else {
      <div class="remote-loading">
        <i class="fas fa-circle-notch fa-spin"></i> Loading Registration…
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
export class RegisterHostComponent implements OnInit {
  private readonly loader = inject(WebComponentLoaderService);
  private readonly router = inject(Router);

  ready = signal(false);
  error = signal(false);

  ngOnInit(): void {
    this.loader.load('auth')
      .then(() => this.ready.set(true))
      .catch(() => this.error.set(true));
  }

  onRegisterSuccess(): void {
    // After successful registration, navigate to login
    this.router.navigate(['/login']);
  }

  onSwitchToLogin(): void {
    // User clicked "Sign in" link in register form
    this.router.navigate(['/login']);
  }
}
