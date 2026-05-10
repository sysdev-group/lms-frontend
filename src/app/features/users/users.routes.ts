import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./user-list/user-list.component').then(m => m.UserListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./user-detail/user-detail.component').then(m => m.UserDetailComponent),
  },
];
