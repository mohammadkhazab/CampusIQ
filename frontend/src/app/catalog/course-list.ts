import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogService } from '../core/catalog.service';
import { Course, Page } from '../core/models';

/** Course catalog at /courses: a paged table of courses, each linking to its detail view. */
@Component({
  selector: 'app-course-list',
  imports: [RouterLink],
  template: `
    <h2>Courses</h2>
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    } @else if (data(); as page) {
      <p>{{ page.count }} courses</p>
      <table>
        <thead>
          <tr><th>Code</th><th>Title</th><th>Category</th><th>Credits</th></tr>
        </thead>
        <tbody>
          @for (course of page.results; track course.id) {
            <tr>
              <td><a [routerLink]="['/courses', course.id]">{{ course.code }}</a></td>
              <td>{{ course.title }}</td>
              <td>{{ course.category_name }}</td>
              <td>{{ course.credits }}</td>
            </tr>
          } @empty {
            <tr><td colspan="4">No courses yet.</td></tr>
          }
        </tbody>
      </table>
      <p>
        <button (click)="load(pageNo() - 1)" [disabled]="!page.previous">Previous</button>
        Page {{ pageNo() }}
        <button (click)="load(pageNo() + 1)" [disabled]="!page.next">Next</button>
      </p>
    } @else {
      <p>Loading…</p>
    }
  `,
})
export class CourseList implements OnInit {
  private readonly catalog = inject(CatalogService);

  /** The current page from the API; null until the first response arrives (shows "Loading…"). */
  protected readonly data = signal<Page<Course> | null>(null);
  /** The page number currently displayed, used by the Previous/Next buttons. */
  protected readonly pageNo = signal(1);
  protected readonly error = signal('');

  /** Loads the first page when the view opens. */
  ngOnInit(): void {
    this.load(1);
  }

  /**
   * Fetches the given page and shows it. The page number only advances once the
   * request succeeds, so a failed load never leaves the counter out of sync.
   */
  load(page: number): void {
    this.catalog.listCourses(page).subscribe({
      next: (data) => {
        this.data.set(data);
        this.pageNo.set(page);
      },
      error: () => this.error.set('Could not load courses.'),
    });
  }
}
