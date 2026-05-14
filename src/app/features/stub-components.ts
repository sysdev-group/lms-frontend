// All components in this file have been extracted to their own files and are no longer used.
// This file is kept for reference only and can be deleted once all routes are implemented.

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

// ─── Shared stub template ─────────────────────────────────────────────────────
function stubTemplate(title: string, docsSection: string, hint: string): string {
  return `
    <div class="page-container">
      <div class="lms-card text-center py-12">
        <h2 class="section-title">${title}</h2>
        <p class="text-slate-500 max-w-md mx-auto">
          This page is not yet implemented.<br/>
          Docs: <strong>${docsSection}</strong><br/>
          ${hint}
        </p>
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
        <div class="lms-card">
          <p class="text-slate-500 text-sm">TODO: Upcoming deadlines widget. See Section 7.9.</p>
        </div>
        <div class="lms-card">
          <p class="text-slate-500 text-sm">TODO: Enrolled courses summary. See Section 7.9.</p>
        </div>
        <div class="lms-card">
          <p class="text-slate-500 text-sm">TODO: Recent notifications. See Section 7.7.</p>
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
  template: stubTemplate('Grades', 'Section 7.6 + Section 27', 'Inject GradeService. Students see published grades only.'),
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
  template: stubTemplate('Timetable', 'Section 24', 'Inject TimetableService. Render as a weekly grid.'),
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
  template: stubTemplate('Attendance', 'Section 26', 'Role-aware: student view shows percentage; lecturer view shows mark-attendance form.'),
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
  template: stubTemplate('Notifications', 'Section 7.7 + Section 23', 'Inject NotificationService. Show unread count badge in sidebar.'),
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
  template: stubTemplate('Enrollment', 'Section 28', 'Admin only. Inject EnrollmentService. Supports bulk CSV enrollment.'),
})
export class EnrollmentComponent {}
