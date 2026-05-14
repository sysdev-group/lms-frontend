import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <h1 class="section-title">Dashboard</h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="lms-card">
          <p class="text-slate-500 text-sm">Upcoming deadlines will appear here.</p>
        </div>
        <div class="lms-card">
          <p class="text-slate-500 text-sm">Enrolled courses summary will appear here.</p>
        </div>
        <div class="lms-card">
          <p class="text-slate-500 text-sm">Recent notifications will appear here.</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {}
