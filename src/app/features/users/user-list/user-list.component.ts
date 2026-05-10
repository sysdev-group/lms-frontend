import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * User list page — Admin only.
 * TODO: Inject UserService, render paginated table with search/filter.
 * Support deactivate action. See Section 7.3.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <h1 class="section-title">Users</h1>
      <div class="lms-card text-center py-12">
        <p class="text-slate-500">
          TODO: Paginated user table with search and role filter.<br/>
          Use <code>UserService.getUsers()</code>.
        </p>
      </div>
    </div>
  `,
})
export class UserListComponent {}

/**
 * User detail/edit page — Admin only.
 * TODO: Load user by :id, show edit form, deactivate button.
 * See Section 7.3.
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
          TODO: Edit form for user. User ID: <strong>{{ userId }}</strong>
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
