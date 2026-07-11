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

import 'zone.js';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { provideRouter } from '@angular/router';
import { LocationStrategy } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { SchemesComponent } from './app/features/schemes/schemes.component';
import { NavComponent } from './app/features/nav/nav.component';
import { SchemeDetailsComponent } from './app/features/scheme-details/scheme-details.component';
import { SchemeNavRootComponent } from './app/elements-shell/scheme-nav-root.component';
import { MemoryLocationStrategy } from './app/elements-shell/memory-location-strategy';

async function registerSchemeListElement(): Promise<void> {
  if (customElements.get('scheme-list-element')) return;

  const app = await createApplication({
    providers: [
      provideHttpClient(),
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
      provideHttpClient(),
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

Promise.all([
  registerSchemeListElement(),
  registerSchemeNavElement()
]).catch((err) => console.error('Failed to register scheme elements', err));
