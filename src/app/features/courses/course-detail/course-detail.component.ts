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
      <div class="lms-card text-center py-12">
        <h2 class="section-title">Course Detail</h2>
        <p class="text-slate-500">
          TODO: Load course by ID from route params.<br/>
          Show Materials, Assignments, and Students tabs.
        </p>
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
