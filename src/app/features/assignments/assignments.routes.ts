import { Routes } from '@angular/router';

export const ASSIGNMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./assignment-list/assignment-list.component').then(m => m.AssignmentListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./assignment-detail/assignment-detail.component').then(m => m.AssignmentDetailComponent),
  },
];
