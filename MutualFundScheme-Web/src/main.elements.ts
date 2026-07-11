// Web Component entry point — built via the "elements" configuration
// (see angular.json), separate from src/main.ts which still bootstraps
// this app standalone on port 4205 for direct dev/testing.
//
// This lets MutualFundScheme-Web run BOTH ways at once, per the "should
// work on both" decision:
//   - standalone: `npm start` -> http://localhost:4205 (own router, own topbar)
//   - as a remote: `npm run build:elements` -> registers
//     <scheme-list-element> and <scheme-nav-element> as custom elements,
//     consumed by the Shell app's scheme-host components.
//
// Each element gets its own isolated Angular application (own injector,
// own router instance scoped to that element) via createApplication(), so
// internal navigation (e.g. NavComponent -> scheme detail) keeps working
// inside the element without needing the shell's router.

import 'zone.js';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { SchemesComponent } from './app/features/schemes/schemes.component';
import { NavComponent } from './app/features/nav/nav.component';
import { SchemeDetailsComponent } from './app/features/scheme-details/scheme-details.component';
import { SchemeNavRootComponent } from './app/elements-shell/scheme-nav-root.component';

async function registerElements(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideHttpClient(),
      provideAnimations(),
      provideToastr({
        timeOut: 3500,
        positionClass: 'toast-top-right',
        preventDuplicates: true
      }),
      // Scoped router just for navigation *within* the nav element
      // (nav -> scheme details -> back). The shell's own router is
      // untouched; this does not affect the browser URL/history unless
      // useHash/binding is configured, which we intentionally skip here.
      provideRouter([
        { path: '', redirectTo: 'nav', pathMatch: 'full' },
        { path: 'nav', component: NavComponent },
        { path: 'nav/scheme/:schemeCode', component: SchemeDetailsComponent },
        { path: '**', redirectTo: 'nav' }
      ])
    ]
  });

  const schemeListElement = createCustomElement(SchemesComponent, { injector: app.injector });
  const schemeNavElement = createCustomElement(SchemeNavRootComponent, { injector: app.injector });

  if (!customElements.get('scheme-list-element')) {
    customElements.define('scheme-list-element', schemeListElement);
  }
  if (!customElements.get('scheme-nav-element')) {
    customElements.define('scheme-nav-element', schemeNavElement);
  }
}

registerElements().catch((err) => console.error('Failed to register scheme elements', err));
