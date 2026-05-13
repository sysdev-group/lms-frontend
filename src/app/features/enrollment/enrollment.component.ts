import { Component } from '@angular/core';

@Component({
  selector: 'app-enrollment',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <h1 class="section-title">Enrollment</h1>
      <div class="lms-card text-center py-12">
        <p class="text-slate-500">Enrollment management will appear here.</p>
      </div>
    </div>
  `,
})
export class EnrollmentComponent {}
