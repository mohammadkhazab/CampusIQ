import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogService } from '../core/catalog.service';
import { Course, Page } from '../core/models';

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

  protected readonly data = signal<Page<Course> | null>(null);
  protected readonly pageNo = signal(1);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.load(1);
  }

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
