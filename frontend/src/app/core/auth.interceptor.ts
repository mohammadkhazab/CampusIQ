import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Attaches `Authorization: Bearer <access>` to our own API calls, and sends the user
 * back to the login screen when the backend rejects the token (expired or invalid).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Only our API gets the token; never leak it to a third-party URL.
  const isApi = req.url.startsWith('/api/');
  const isTokenEndpoint = req.url.startsWith('/api/token/');
  const token = auth.accessToken();

  const authed =
    isApi && !isTokenEndpoint && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && isApi && !isTokenEndpoint) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
