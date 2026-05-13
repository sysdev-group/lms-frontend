// ─────────────────────────────────────────────────────────────────────────────
// STUB FEATURE COMPONENTS
//
// Each component below renders a placeholder page.
// To implement: replace the template with real UI and inject the matching service.
// Follow LoginComponent as the pattern for forms and ShellComponent for layout.
//
// File organisation note:
// Each class below should eventually live in its own file.
// They are grouped here for scaffold brevity. Move them as you implement them.
// ─────────────────────────────────────────────────────────────────────────────

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

// ─── Shared stub template ─────────────────────────────────────────────────────
function stubTemplate(title: string): string {
  return `
    <div class="page-container">
      <h1 class="section-title">${title}</h1>
      <div class="lms-card text-center py-16">
        <p class="text-slate-400 text-sm">This section is not yet available.</p>
      </div>
    </div>
  `;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
/**
 * Dashboard — role-aware. Shows different content depending on Student/Lecturer/Admin.
 * TODO: Inject AuthService, check role, render appropriate widgets.
 * See Section 7.9 — Dashboard Module.
 */
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

// ─── Grades ───────────────────────────────────────────────────────────────────
/**
 * TODO: Inject GradeService, list grades per course.
 * Students see only published grades. Lecturers see all. See Section 7.6 + 27.
 */
@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [],
  template: stubTemplate('Grades'),
})
export class GradesComponent {}

// ─── Timetable ────────────────────────────────────────────────────────────────
/**
 * TODO: Inject TimetableService, render weekly schedule grid.
 * Offline caching support planned. See Section 24.
 */
@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [],
  template: stubTemplate('Timetable'),
})
export class TimetableComponent {}

// ─── Attendance ───────────────────────────────────────────────────────────────
/**
 * TODO: Students see their attendance %. Lecturers see a mark-attendance form.
 * See Section 26.
 */
@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [],
  template: stubTemplate('Attendance'),
})
export class AttendanceComponent {}

// ─── Notifications ────────────────────────────────────────────────────────────
/**
 * TODO: Inject NotificationService, list notifications with read/unread state.
 * See Section 7.7 + Section 23.
 */
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [],
  template: stubTemplate('Notifications'),
})
export class NotificationsComponent {}

// ─── Enrollment ───────────────────────────────────────────────────────────────
/**
 * TODO: Admin-only. Inject EnrollmentService, allow bulk enrollment + drops.
 * See Section 28.
 */
@Component({
  selector: 'app-enrollment',
  standalone: true,
  imports: [],
  template: stubTemplate('Enrollment'),
})
export class EnrollmentComponent {}
