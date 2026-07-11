import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'shell-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  // Auth is handled by MutualFundAuth-Web via the shared `mf_access_token`
  // cookie. The shell only reads it to display who's logged in — no new
  // auth flow is implemented here per the current phase.
  userLabel = 'Account';

  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.titleService.getTitle() || 'MutualFund')
    ),
    { initialValue: 'MutualFund' }
  );
}
