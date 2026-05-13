import { Component } from '@angular/core';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <h1 class="section-title">Users</h1>
      <div class="lms-card text-center py-12">
        <p class="text-slate-500">
          Paginated user table with search and role filter coming soon.
        </p>
      </div>
    </div>
  `,
})
export class UserListComponent {}
