import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Course detail page — shows materials, assignments, and enrolled students.
 * TODO:
 *   1. Get :id param from ActivatedRoute
 *   2. Inject CourseService, call getCourseById(id)
 *   3. Inject AssignmentService, call getAssignmentsByCourse(id)
 *   4. Render tabs: Materials | Assignments | Students (Lecturer/Admin only)
 * See Section 7.4.
 */
@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <div class="lms-card text-center py-16">
        <h1 class="section-title">Course Detail</h1>
        <p class="text-slate-400 text-sm">Course information is not yet available.</p>
      </div>
    </div>
  `,
})
export class CourseDetailComponent {
  courseId: string;
  constructor(private route: ActivatedRoute) {
    this.courseId = this.route.snapshot.paramMap.get('id') ?? '';
  }
}
