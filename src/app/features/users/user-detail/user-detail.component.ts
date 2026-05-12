import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * User detail / edit page — Admin only.
 * TODO (Task 4): Load user by :id, reactive edit form, password-reset trigger,
 * deactivation with MatDialog confirmation. See Section 7.3 and Section 29.3.
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <div class="lms-card text-center py-12">
        <h2 class="section-title">User Detail</h2>
        <p class="text-slate-500">
          User ID: <strong>{{ userId }}</strong><br />
          Full implementation coming in Task 4.
        </p>
      </div>
    </div>
  `,
})
export class UserDetailComponent {
  userId: string;

  constructor(private route: ActivatedRoute) {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
  }
}
