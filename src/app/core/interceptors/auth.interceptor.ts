import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';

/**
 * HTTP interceptor that:
 *   1. Attaches the Bearer access token to every outgoing request
 *   2. On 401 response — silently refreshes the token and retries the request
 *   3. On refresh failure — clears session and redirects to login
 *
 * Registered as a functional interceptor in app.config.ts.
 * This is the WORKED EXAMPLE interceptor — do not create additional interceptors
 * unless you have a specific new concern.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Skip token attachment for auth endpoints (login, refresh, forgot-password)
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const token = authService.getAccessToken();
  const authReq = token ? attachToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint(req.url)) {
        // Token expired — try to refresh silently, then retry the original request
        return authService.refreshToken().pipe(
          switchMap(() => next(attachToken(req, authService.getAccessToken()!)))
        );
      }
      return throwError(() => error);
    })
  );
};

function attachToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
    withCredentials: true,  // Always send cookies (refresh token)
  });
}

function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login')
    || url.includes('/auth/refresh')
    || url.includes('/auth/forgot-password')
    || url.includes('/auth/reset-password');
}
