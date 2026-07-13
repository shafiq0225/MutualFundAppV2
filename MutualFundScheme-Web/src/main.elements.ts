// Web Component entry point — built via the "elements" configuration
// (see angular.json), separate from src/main.ts which still bootstraps
// this app standalone on port 4205 for direct dev/testing.
//
// IMPORTANT: scheme-list-element and scheme-nav-element are each their own
// createApplication() call, deliberately NOT sharing one injector/router.
// SchemesComponent has no router; NavComponent does (it navigates to scheme
// details). Sharing a single application between them meant the router's
// one-time "initial navigation" could fire while the nav element's outlet
// didn't exist in the DOM yet (e.g. if /scheme loaded first), leaving the
// nav element permanently blank once it did mount. Separate applications
// means each router's initial navigation is tied only to its own element's
// mount timing.

import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { provideRouter } from '@angular/router';
import { LocationStrategy } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { SchemesComponent } from './app/features/schemes/schemes.component';
import { NavComponent } from './app/features/nav/nav.component';
import { SchemeDetailsComponent } from './app/features/scheme-details/scheme-details.component';
import { SchemeNavRootComponent } from './app/elements-shell/scheme-nav-root.component';
import { MemoryLocationStrategy } from './app/elements-shell/memory-location-strategy';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

// Every remote bundles its own copy of zone.js. If another remote already
// loaded on this page first (e.g. the shell loads Auth's login screen,
// then the user navigates to /scheme), a plain `import 'zone.js'` here
// throws ("Zone already loaded") and aborts this WHOLE module before it
// ever reaches customElements.define() — silently breaking this remote
// with no visible error except a console warning easy to miss. Guarding
// it means remotes can load in any order. Apply this same guard in any
// future remote's main.elements.ts too.
async function ensureZoneJs(): Promise<void> {
  if (!(window as unknown as { Zone?: unknown }).Zone) {
    await import('zone.js');
  }
}

async function registerSchemeListElement(): Promise<void> {
  if (customElements.get('scheme-list-element')) return;

  const app = await createApplication({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideAnimations(),
      provideToastr({
        timeOut: 3500,
        positionClass: 'toast-top-right',
        preventDuplicates: true
      })
    ]
  });

  const element = createCustomElement(SchemesComponent, { injector: app.injector });
  customElements.define('scheme-list-element', element);
}

async function registerSchemeNavElement(): Promise<void> {
  if (customElements.get('scheme-nav-element')) return;

  const app = await createApplication({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideAnimations(),
      provideToastr({
        timeOut: 3500,
        positionClass: 'toast-top-right',
        preventDuplicates: true
      }),
      // In-memory routing only — see memory-location-strategy.ts. This
      // router never touches the real browser URL, so it can't collide
      // with the shell's router.
      { provide: LocationStrategy, useClass: MemoryLocationStrategy },
      provideRouter([
        { path: '', redirectTo: 'nav', pathMatch: 'full' },
        { path: 'nav', component: NavComponent },
        { path: 'nav/scheme/:schemeCode', component: SchemeDetailsComponent },
        { path: '**', redirectTo: 'nav' }
      ])
    ]
  });

  const element = createCustomElement(SchemeNavRootComponent, { injector: app.injector });
  customElements.define('scheme-nav-element', element);
}

ensureZoneJs()
  .then(() => Promise.all([
    registerSchemeListElement(),
    registerSchemeNavElement()
  ]))
  .catch((err) => console.error('Failed to register scheme elements', err));
