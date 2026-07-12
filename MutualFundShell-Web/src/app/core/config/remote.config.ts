// Central registry of micro frontend origins.
// Ports must stay exactly as-is — the backend/gateway CORS + cookie config
// already depends on them. Do not change without updating Ocelot + APIs too.
export interface RemoteAppConfig {
  /** Origin the app is served from (dev: ng serve port, prod: behind gateway/CDN). */
  origin: string;
  /** Bundle that registers this remote's custom elements (built via its "elements" config). */
  elementsBundle: string;
  /**
   * Global stylesheet emitted alongside elementsBundle by the same
   * "elements" build config (see angular.json — styles: ["src/styles.scss"]).
   * Every remote defines its own design-system utility classes (buttons,
   * modals, tables, etc.) in its own global styles.scss, same as the shell
   * does — those never get bundled into individual components, so without
   * loading this too, an embedded remote renders unstyled. Optional only
   * because a remote that has no elements of its own (investment/nav today)
   * has nothing to load either bundle for yet.
   */
  stylesBundle?: string;
  /** Custom element tag names this remote exposes. */
  tags: string[];
}

export const remoteApps: Record<'scheme' | 'auth' | 'investment' | 'nav', RemoteAppConfig> = {
  scheme: {
    origin: 'http://localhost:4205',
    elementsBundle: '/elements/main.js',
    stylesBundle: '/elements/styles.css',
    tags: ['scheme-list-element', 'scheme-nav-element']
  },
  auth: {
    origin: 'http://localhost:4202',
    elementsBundle: '/elements/main.js',
    stylesBundle: '/elements/styles.css',
    tags: ['auth-users-element', 'auth-pending-element', 'auth-family-element', 'auth-login-element']
  },
  investment: {
    origin: 'http://localhost:4203',
    elementsBundle: '/elements/main.js',
    tags: []
  },
  nav: {
    origin: 'http://localhost:4204',
    elementsBundle: '/elements/main.js',
    tags: []
  }
};
