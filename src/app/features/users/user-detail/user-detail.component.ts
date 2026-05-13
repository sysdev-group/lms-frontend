import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <div class="lms-card text-center py-12">
        <h2 class="section-title">User Detail</h2>
        <p class="text-slate-500">
          Edit form for user. User ID: <strong>{{ userId }}</strong>
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
