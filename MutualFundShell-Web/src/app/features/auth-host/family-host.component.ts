import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebComponentLoaderService } from '../../core/services/webcomponent-loader.service';

@Component({
  selector: 'shell-family-host',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (ready()) {
      <div class="page-container">
        <auth-family-element></auth-family-element>
      </div>
    } @else if (error()) {
      <div class="remote-error">
        <i class="fas fa-triangle-exclamation"></i>
        Family Groups is unavailable right now. Confirm MutualFundAuth-Web
        is running on port 4202 and try again.
      </div>
    } @else {
      <div class="remote-loading">
        <i class="fas fa-circle-notch fa-spin"></i> Loading Family Groups…
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
export class FamilyHostComponent implements OnInit {
  private readonly loader = inject(WebComponentLoaderService);

  ready = signal(false);
  error = signal(false);

  ngOnInit(): void {
    this.loader.load('auth')
      .then(() => this.ready.set(true))
      .catch(() => this.error.set(true));
  }
}
