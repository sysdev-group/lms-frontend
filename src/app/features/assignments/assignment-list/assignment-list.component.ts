import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Assignment list page.
 * TODO: Inject AssignmentService, list assignments with deadlines and status badges.
 * Students see their submission status. Lecturers see submission counts.
 * See Section 7.5.
 */
@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <h1 class="section-title">Assignments</h1>
      <div class="lms-card text-center py-12">
        <p class="text-slate-500">
          TODO: List assignments with deadlines.<br/>
          Use <code>AssignmentService.getAssignmentsByCourse()</code>.
        </p>
      </div>
    </div>
  `,
})
export class AssignmentListComponent {}

/**
 * Assignment detail page — submission form for students, grading view for lecturers.
 * TODO:
 *   1. Load assignment by :id
 *   2. Students: show file upload form + submit button
 *   3. Lecturers: show submissions table with grade inputs
 * See Section 7.5 + Section 7.6.
 */
@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <div class="lms-card text-center py-12">
        <h2 class="section-title">Assignment Detail</h2>
        <p class="text-slate-500">
          TODO: Students see submission form. Lecturers see grading panel.<br/>
          Assignment ID: <strong>{{ assignmentId }}</strong>
        </p>
      </div>
    </div>
  `,
})
export class AssignmentDetailComponent {
  assignmentId: string;
  constructor(private route: ActivatedRoute) {
    this.assignmentId = this.route.snapshot.paramMap.get('id') ?? '';
  }
}
