// Central registry of micro frontend origins.
// Ports must stay exactly as-is — the backend/gateway CORS + cookie config
// already depends on them. Do not change without updating Ocelot + APIs too.
export interface RemoteAppConfig {
  /** Origin the app is served from (dev: ng serve port, prod: behind gateway/CDN). */
  origin: string;
  /** Bundle that registers this remote's custom elements (built via its "elements" config). */
  elementsBundle: string;
  /** Custom element tag names this remote exposes. */
  tags: string[];
}

export const remoteApps: Record<'scheme' | 'auth' | 'investment' | 'nav', RemoteAppConfig> = {
  scheme: {
    origin: 'http://localhost:4205',
    elementsBundle: '/elements/main.js',
    tags: ['scheme-list-element', 'scheme-nav-element']
  },
  auth: {
    origin: 'http://localhost:4202',
    elementsBundle: '/elements/main.js',
    tags: []
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
