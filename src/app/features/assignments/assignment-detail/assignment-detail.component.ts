import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <div class="lms-card text-center py-12">
        <h2 class="section-title">Assignment Detail</h2>
        <p class="text-slate-500">
          Students see submission form. Lecturers see grading panel.<br/>
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
