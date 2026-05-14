import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <h1 class="section-title">Dashboard</h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="lms-card text-center py-8">
          <p class="text-sm font-medium text-slate-700 mb-1">Upcoming Deadlines</p>
          <p class="text-slate-400 text-sm">No deadlines to show.</p>
        </div>
        <div class="lms-card text-center py-8">
          <p class="text-sm font-medium text-slate-700 mb-1">Enrolled Courses</p>
          <p class="text-slate-400 text-sm">No courses enrolled.</p>
        </div>
        <div class="lms-card text-center py-8">
          <p class="text-sm font-medium text-slate-700 mb-1">Notifications</p>
          <p class="text-slate-400 text-sm">No new notifications.</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {}
