import { Routes } from '@angular/router';

import { CourseDetail } from './catalog/course-detail';
import { CourseList } from './catalog/course-list';
import { authGuard } from './core/auth.guard';
import { Login } from './login/login';

/**
 * App URL map. Catalog pages sit behind authGuard; unknown URLs fall back to the course
 * list, which itself redirects to /login when signed out.
 */
export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'courses', component: CourseList, canActivate: [authGuard] },
  { path: 'courses/:id', component: CourseDetail, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'courses' },
  { path: '**', redirectTo: 'courses' },
];
