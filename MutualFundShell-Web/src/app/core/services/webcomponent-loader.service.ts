import { Injectable } from '@angular/core';
import { remoteApps, RemoteAppConfig } from '../config/remote.config';

/**
 * Loads a remote micro frontend's custom-element bundle on demand, once per
 * remote per page load. Each remote must be built with its own "elements"
 * configuration (see MutualFundScheme-Web src/main.elements.ts) so it
 * registers window.customElements.define(...) for its tags instead of
 * bootstrapping its own <app-root>.
 */
@Injectable({ providedIn: 'root' })
export class WebComponentLoaderService {
  private readonly loaded = new Map<string, Promise<void>>();

  load(remote: keyof typeof remoteApps): Promise<void> {
    const config = remoteApps[remote];
    const cacheKey = config.origin + config.elementsBundle;

    let pending = this.loaded.get(cacheKey);
    if (!pending) {
      pending = this.injectScript(config);
      this.loaded.set(cacheKey, pending);
    }
    return pending;
  }

  private injectScript(config: RemoteAppConfig): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const url = config.origin + config.elementsBundle;
      const existing = document.querySelector(`script[data-remote-src="${url}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.src = url;
      script.dataset['remoteSrc'] = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load remote bundle: ${url}`));
      document.head.appendChild(script);
    });
  }
}
