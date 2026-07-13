import { initFederation } from '@angular-architects/native-federation';
import { environment } from './environments/environment';

const manifest = environment.production
  ? { 'mutualfund-investment-web': 'https://shafiq0225-mutualfund-investment.pages.dev/remoteEntry.json' }
  : { 'mutualfund-investment-web': 'http://localhost:4203/remoteEntry.json' };

initFederation(manifest)
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));
