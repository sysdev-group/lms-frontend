import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UserRole } from '@shared/models/models';

/**
 * Protects routes that require authentication.
 * Apply to any route that should not be accessible when logged out.
 *
 * Usage in routes:
 *   { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) return true;

  router.navigate(['/auth/login']);
  return false;
};

/**
 * Protects routes that require a specific role.
 * Redirects to a 403-style page if the user doesn't have the required role.
 *
 * Usage in routes:
 *   {
 *     path: 'users',
 *     component: UserListComponent,
 *     canActivate: [roleGuard(['Admin'])]
 *   }
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/auth/login']);
      return false;
    }

    const userRole = authService.userRole();
    if (userRole && allowedRoles.includes(userRole)) return true;

    // Logged in but wrong role — redirect to their dashboard
    router.navigate(['/dashboard']);
    return false;
  };
};
