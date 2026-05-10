import { Routes } from '@angular/router';

export const COURSE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./course-list/course-list.component').then(m => m.CourseListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./course-detail/course-detail.component').then(m => m.CourseDetailComponent),
  },
];
