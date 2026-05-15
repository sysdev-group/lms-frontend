import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/auth.guard';

/**
 * Application routes.
 * All feature modules are lazy-loaded — only downloaded when first navigated to.
 * This keeps the initial bundle small (see Section 13 — Performance Optimization).
 *
 * Route protection:
 *   authGuard       — requires any authenticated user
 *   roleGuard([])   — requires specific role(s)
 */
export const routes: Routes = [
  // ─── Default redirect ───────────────────────────────────────────────────
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ─── Auth (public) ──────────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // ─── Protected routes (require login) ───────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    // Shell component provides the sidebar + navbar layout for all inner pages
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'programmes',
        loadComponent: () =>
          import('./features/programmes/programme-list/programme-list.component')
            .then(m => m.ProgrammeListComponent),
        canActivate: [authGuard],
      },
      {
        path: 'programmes/:id',
        loadComponent: () =>
          import('./features/programmes/programme-detail/programme-detail.component')
            .then(m => m.ProgrammeDetailComponent),
        canActivate: [authGuard],
      },
      {
        path: 'courses',
        loadChildren: () =>
          import('./features/courses/courses.routes').then(m => m.COURSE_ROUTES),
      },
      {
        path: 'assignments',
        loadChildren: () =>
          import('./features/assignments/assignments.routes').then(m => m.ASSIGNMENT_ROUTES),
      },
      {
        path: 'grades',
        loadComponent: () =>
          import('./features/grades/grades.component').then(m => m.GradesComponent),
      },
      {
        path: 'timetable',
        loadComponent: () =>
          import('./features/timetable/timetable.component').then(m => m.TimetableComponent),
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/attendance/attendance.component').then(m => m.AttendanceComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
      },

      // ── Admin-only routes ──────────────────────────────────────────────
      {
        path: 'users',
        canActivate: [roleGuard(['Admin'])],
        loadChildren: () =>
          import('./features/users/users.routes').then(m => m.USER_ROUTES),
      },
      {
        path: 'enrollment',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/enrollment/enrollment.component').then(m => m.EnrollmentComponent),
      },
      {
        path: 'audit',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/audit/audit.component').then(m => m.AuditComponent),
      },
    ],
  },

  // ─── Catch-all ──────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'dashboard' },
];
