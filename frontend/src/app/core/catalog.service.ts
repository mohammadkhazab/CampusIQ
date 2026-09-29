import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Course, Page } from './models';

/** Read-only access to the catalog API. The interceptor adds the JWT. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  listCourses(page = 1): Observable<Page<Course>> {
    const params = new HttpParams().set('page', page);
    return this.http.get<Page<Course>>('/api/courses/', { params });
  }

  getCourse(id: number): Observable<Course> {
    return this.http.get<Course>(`/api/courses/${id}/`);
  }
}
