import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-wrap">
      <div class="spinner"><i class="fas fa-circle-notch fa-spin"></i></div>
      <p *ngIf="message" class="spinner-msg">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-wrap {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; padding: 48px 24px;
    }
    .spinner { color: var(--gold, #C08A2E); font-size: 32px; }
    .spinner-msg { color: var(--text-muted, #6B6455); font-size: 14px; }
  `]
})
export class LoadingSpinnerComponent {
  @Input() message?: string;
}
