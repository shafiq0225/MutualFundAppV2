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
      const tasks: Promise<void>[] = [this.injectScript(config)];
      if (config.stylesBundle) {
        tasks.push(this.injectStylesheet(config.origin + config.stylesBundle));
      }
      pending = Promise.all(tasks).then(() => undefined);
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

  // Each remote's own global styles.scss defines the utility classes
  // (buttons, modals, tables, etc.) its templates rely on — those never
  // get bundled per-component, so without this an embedded remote renders
  // with no design-system styling at all even though the script loaded fine.
  private injectStylesheet(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`link[data-remote-href="${url}"]`);
      if (existing) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset['remoteHref'] = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load remote stylesheet: ${url}`));
      document.head.appendChild(link);
    });
  }
}
