// Web Component entry point — built via the "elements" configuration
// (see angular.json), separate from src/main.ts which still bootstraps
// this app standalone on port 4202 for direct dev/testing.
//
// IMPORTANT: Login and Register are deliberately NOT registered here.
// They stay full-page redirects to this app's own origin (see the shell's
// logout handling) rather than embedded elements — credentials belong on
// their own origin/address bar, and the shared-localStorage-token model
// only needs the *authenticated* pages embedded in the shell.
//
// UsersComponent, PendingComponent, and FamilyComponent don't use the
// Router at all (unlike Scheme-Web's NavComponent), so none of them need
// the router-outlet-wrapper + MemoryLocationStrategy + explicit
// initialNavigation() dance that scheme-nav-element required. Each is
// just createCustomElement() directly, same as scheme-list-element.

import 'zone.js';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { UsersComponent } from './app/features/users/users.component';
import { PendingComponent } from './app/features/users/pending/pending.component';
import { FamilyComponent } from './app/features/family/family.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

const sharedProviders = [
  provideHttpClient(withInterceptors([authInterceptor])),
  provideAnimations(),
  provideToastr({
    timeOut: 3500,
    positionClass: 'toast-top-right',
    preventDuplicates: true
  })
];

async function registerAuthUsersElement(): Promise<void> {
  if (customElements.get('auth-users-element')) return;

  const app = await createApplication({ providers: sharedProviders });
  const element = createCustomElement(UsersComponent, { injector: app.injector });
  customElements.define('auth-users-element', element);
}

async function registerAuthPendingElement(): Promise<void> {
  if (customElements.get('auth-pending-element')) return;

  const app = await createApplication({ providers: sharedProviders });
  const element = createCustomElement(PendingComponent, { injector: app.injector });
  customElements.define('auth-pending-element', element);
}

async function registerAuthFamilyElement(): Promise<void> {
  if (customElements.get('auth-family-element')) return;

  const app = await createApplication({ providers: sharedProviders });
  const element = createCustomElement(FamilyComponent, { injector: app.injector });
  customElements.define('auth-family-element', element);
}

Promise.all([
  registerAuthUsersElement(),
  registerAuthPendingElement(),
  registerAuthFamilyElement()
]).catch((err) => console.error('Failed to register auth elements', err));
