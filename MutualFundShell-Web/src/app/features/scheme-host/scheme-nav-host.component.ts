import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebComponentLoaderService } from '../../core/services/webcomponent-loader.service';

@Component({
  selector: 'shell-scheme-nav-host',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (ready()) {
      <scheme-nav-element></scheme-nav-element>
    } @else if (error()) {
      <div class="remote-error">
        <i class="fas fa-triangle-exclamation"></i>
        NAV Comparison is unavailable right now. Confirm MutualFundScheme-Web
        is running on port 4205 and try again.
      </div>
    } @else {
      <div class="remote-loading">
        <i class="fas fa-circle-notch fa-spin"></i> Loading NAV Comparison…
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
export class SchemeNavHostComponent implements OnInit {
  private readonly loader = inject(WebComponentLoaderService);

  ready = signal(false);
  error = signal(false);

  ngOnInit(): void {
    this.loader.load('scheme')
      .then(() => this.ready.set(true))
      .catch(() => this.error.set(true));
  }
}
