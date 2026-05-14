import { Component } from '@angular/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <h1 class="section-title">Notifications</h1>
      <div class="lms-card text-center py-12">
        <p class="text-slate-500">Your notifications will appear here.</p>
      </div>
    </div>
  `,
})
export class NotificationsComponent {}
