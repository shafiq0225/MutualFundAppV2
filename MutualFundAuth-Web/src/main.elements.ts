// Web Component entry point — built via the "elements" configuration
// (see angular.json), separate from src/main.ts which still bootstraps
// this app standalone on port 4202 for direct dev/testing.
//
// Login IS registered here (auth-login-element) — it's how the shell gets
// users authenticated without leaving its own page. It works with no
// router in this injector because LoginComponent's Router dependency is
// optional; on success/switch it emits loginSuccess/switchToRegister
// outputs instead, which the shell's LoginHostComponent listens for.
//
// Register is deliberately NOT registered here — it stays a full-page
// redirect to this app's own origin (see the shell's login/switchToRegister
// and logout handling). Registration isn't a "logged in" action, so there's
// no shared-session reason to embed it, and keeping it out narrows this
// bundle's scope to what the shell actually needs post-login.
//
// UsersComponent, PendingComponent, and FamilyComponent don't use the
// Router at all (unlike Scheme-Web's NavComponent), so none of them need
// the router-outlet-wrapper + MemoryLocationStrategy + explicit
// initialNavigation() dance that scheme-nav-element required. Each is
// just createCustomElement() directly, same as scheme-list-element.

import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { UsersComponent } from './app/features/users/users.component';
import { PendingComponent } from './app/features/users/pending/pending.component';
import { FamilyComponent } from './app/features/family/family.component';
import { LoginComponent } from './app/features/login/login.component';
import { RegisterComponent } from './app/features/register/register.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

// Every remote bundles its own copy of zone.js. If another remote already
// loaded on this page first, a plain `import 'zone.js'` here throws
// ("Zone already loaded") and aborts this WHOLE module before it ever
// reaches customElements.define() — silently breaking this remote. Guard
// it so remotes can load in any order. Same pattern used in Scheme-Web's
// main.elements.ts — apply it in any future remote's main.elements.ts too.
async function ensureZoneJs(): Promise<void> {
  if (!(window as unknown as { Zone?: unknown }).Zone) {
    await import('zone.js');
  }
}

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

async function registerAuthLoginElement(): Promise<void> {
  if (customElements.get('auth-login-element')) return;

  // LoginComponent's Router dependency is optional (see login.component.ts)
  // so it doesn't need a router provided here — it emits loginSuccess /
  // switchToRegister outputs instead, which the shell's LoginHostComponent
  // listens for and turns into real shell navigation.
  const app = await createApplication({ providers: sharedProviders });
  const element = createCustomElement(LoginComponent, { injector: app.injector });
  customElements.define('auth-login-element', element);
}

async function registerAuthRegisterElement(): Promise<void> {
  if (customElements.get('auth-register-element')) return;

  // RegisterComponent's Router dependency is optional (see register.component.ts)
  // so it doesn't need a router provided here — it emits registerSuccess /
  // switchToLogin outputs instead, which the shell's RegisterHostComponent
  // listens for and turns into real shell navigation.
  const app = await createApplication({ providers: sharedProviders });
  const element = createCustomElement(RegisterComponent, { injector: app.injector });
  customElements.define('auth-register-element', element);
}

ensureZoneJs()
  .then(() => Promise.all([
    registerAuthUsersElement(),
    registerAuthPendingElement(),
    registerAuthFamilyElement(),
    registerAuthLoginElement(),
    registerAuthRegisterElement()
  ]))
  .catch((err) => console.error('Failed to register auth elements', err));
