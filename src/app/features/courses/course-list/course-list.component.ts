import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

/**
 * Course list page.
 * TODO:
 *   1. Inject CourseService
 *   2. Call getCourses() in ngOnInit
 *   3. Render courses in a card grid or table
 *   4. Add search/filter bar using CourseQueryParams
 *   5. Admin/Lecturer: show "Create Course" button
 * See Section 7.4 — Course Module.
 */
@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <h1 class="section-title mb-0">Courses</h1>
        <!-- TODO: Show only for Admin/Lecturer -->
        <button mat-flat-button color="primary">+ Create Course</button>
      </div>

      <div class="lms-card text-center py-12">
        <p class="text-slate-500">
          TODO: Render course cards here.<br/>
          Inject <code>CourseService</code> and call <code>getCourses()</code>.
        </p>
      </div>
    </div>
  `,
})
export class CourseListComponent {}
