import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutStateService {
  readonly sidebarCollapsed = signal(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}
