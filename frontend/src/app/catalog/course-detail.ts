import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogService } from '../core/catalog.service';
import { Course } from '../core/models';

/** Course detail at /courses/:id: shows one course's full record. */
@Component({
  selector: 'app-course-detail',
  imports: [RouterLink],
  template: `
    <p><a routerLink="/courses">← All courses</a></p>
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    } @else if (course(); as c) {
      <h2>{{ c.code }} — {{ c.title }}</h2>
      <p>Category: {{ c.category_name }} · Credits: {{ c.credits }}</p>
      <p>{{ c.description }}</p>
    } @else {
      <p>Loading…</p>
    }
  `,
})
export class CourseDetail implements OnInit {
  private readonly catalog = inject(CatalogService);

  /** Bound from the `:id` route param (withComponentInputBinding). */
  readonly id = input.required<string>();

  /** The loaded course; null until the response arrives (shows "Loading…"). */
  protected readonly course = signal<Course | null>(null);
  protected readonly error = signal('');

  /** Fetches the course named in the URL; a 404 gets its own "not found" message. */
  ngOnInit(): void {
    this.catalog.getCourse(Number(this.id())).subscribe({
      next: (course) => this.course.set(course),
      error: (err) => this.error.set(err.status === 404 ? 'Course not found.' : 'Could not load course.'),
    });
  }
}
