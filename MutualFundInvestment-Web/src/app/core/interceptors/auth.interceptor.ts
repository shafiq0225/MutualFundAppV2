import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

const API_URLS = [
  environment.investmentApiUrl,
  environment.schemeApiUrl,
  environment.authApiUrl
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const isOurApi = API_URLS.some(base => req.url.startsWith(base));

  if (token && isOurApi) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};
