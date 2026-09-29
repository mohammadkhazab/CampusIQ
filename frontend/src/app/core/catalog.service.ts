import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Course, Page } from './models';

/** Read-only access to the catalog API. The interceptor adds the JWT. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  /** Fetches one page (1-based) of GET /api/courses/; the backend returns 20 courses per page. */
  listCourses(page = 1): Observable<Page<Course>> {
    const params = new HttpParams().set('page', page);
    return this.http.get<Page<Course>>('/api/courses/', { params });
  }

  /** Fetches a single course by id; errors with 404 if it does not exist. */
  getCourse(id: number): Observable<Course> {
    return this.http.get<Course>(`/api/courses/${id}/`);
  }
}
