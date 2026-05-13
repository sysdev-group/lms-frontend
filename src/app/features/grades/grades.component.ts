import { Component } from '@angular/core';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <h1 class="section-title">Grades</h1>
      <div class="lms-card text-center py-12">
        <p class="text-slate-500">No grades to display yet.</p>
      </div>
    </div>
  `,
})
export class GradesComponent {}
