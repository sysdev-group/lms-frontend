import { Component } from '@angular/core';

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
  imports: [],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <h1 class="section-title mb-0">Courses</h1>
      </div>

      <div class="lms-card text-center py-16">
        <p class="text-slate-400 text-sm">No courses available yet.</p>
      </div>
    </div>
  `,
})
export class CourseListComponent {}
