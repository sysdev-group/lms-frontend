import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Intercepts HTTP errors and shows user-friendly snackbar messages.
 * 401 errors are handled by authInterceptor — this handles everything else.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 is handled by authInterceptor — skip it here
      if (error.status === 401) return throwError(() => error);

      const message = getErrorMessage(error);
      snackBar.open(message, 'Dismiss', {
        duration: 4000,
        panelClass: ['error-snackbar'],
      });

      return throwError(() => error);
    })
  );
};

function getErrorMessage(error: HttpErrorResponse): string {
  // Try to extract the message from the ApiResponse envelope
  if (error.error?.message) return error.error.message;

  switch (error.status) {
    case 400: return 'Invalid request. Please check your input.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 409: return 'A conflict occurred. The resource may already exist.';
    case 422: return 'This action could not be completed due to a business rule.';
    case 429: return 'Too many requests. Please wait a moment and try again.';
    case 500: return 'A server error occurred. Please try again later.';
    case 0:   return 'Cannot connect to the server. Check your internet connection.';
    default:  return `An unexpected error occurred (${error.status}).`;
  }
}
