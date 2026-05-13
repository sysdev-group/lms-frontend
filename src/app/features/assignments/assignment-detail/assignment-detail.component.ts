import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="mb-4">
        <a routerLink="/assignments" mat-button class="text-slate-500 hover:text-slate-700 -ml-2">
          <mat-icon>arrow_back</mat-icon>
          Back to Assignments
        </a>
      </div>
      <div class="lms-card text-center py-16">
        <h1 class="section-title">Assignment Detail</h1>
        <p class="text-slate-400 text-sm">Assignment information is not yet available.</p>
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
