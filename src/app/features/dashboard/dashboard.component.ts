import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/auth/auth.service';
import { AssignmentService } from '@core/services/assignment.service';
import { EnrollmentService } from '@core/services/enrollment.service';
import { NotificationService } from '@core/services/notification.service';
import { TimetableService } from '@core/services/timetable.service';
import { UserService } from '@core/services/user.service';
import { CourseService } from '@core/services/course.service';
import {
  Assignment,
  TimetableSession,
  Enrollment,
  Notification,
  User,
  Course,
} from '@shared/models/models';
import { PaginatedResult } from '@shared/models/api-response.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <h1 class="section-title">Dashboard</h1>

      @if (isLoading()) {
        <div class="flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>
      } @else {

        @if (role() === 'Student') {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

            <!-- Upcoming deadlines -->
            <div class="lms-card">
              <div class="flex items-center gap-2 mb-3">
                <mat-icon class="text-amber-500">assignment_late</mat-icon>
                <p class="text-sm font-semibold text-slate-700">Upcoming Deadlines (7 days)</p>
              </div>
              @if (upcomingDeadlines().length === 0) {
                <p class="text-slate-400 text-sm">No upcoming deadlines.</p>
              } @else {
                <ul class="space-y-2">
                  @for (a of upcomingDeadlines(); track a.id) {
                    <li>
                      <a [routerLink]="['/assignments', a.id]"
                         class="flex justify-between items-center hover:underline cursor-pointer">
                        <span class="text-sm text-slate-700 truncate">{{ a.title }}</span>
                        <span [class]="deadlineCss(a.deadline)" class="text-xs shrink-0 ml-2">
                          {{ deadlineLabel(a.deadline) }}
                        </span>
                      </a>
                    </li>
                  }
                </ul>
              }
            </div>

            <!-- Enrolled courses count -->
            <div class="lms-card text-center py-6">
              <mat-icon class="text-blue-400 mb-2">school</mat-icon>
              <p class="text-3xl font-bold text-slate-800">{{ enrolledCourseCount() }}</p>
              <p class="text-sm text-slate-500 mt-1">Enrolled Courses</p>
              <a routerLink="/courses" mat-button color="primary" class="mt-3 block text-sm">
                View Courses
              </a>
            </div>

            <!-- Unread notifications count -->
            <div class="lms-card text-center py-6">
              <mat-icon class="text-green-400 mb-2">notifications</mat-icon>
              <p class="text-3xl font-bold text-slate-800">{{ unreadCount() }}</p>
              <p class="text-sm text-slate-500 mt-1">Unread Notifications</p>
              <a routerLink="/notifications" mat-button color="primary" class="mt-3 block text-sm">
                View Notifications
              </a>
            </div>
          </div>

          <div class="mt-6 flex gap-3 flex-wrap">
            <a routerLink="/assignments" mat-stroked-button>Assignments</a>
            <a routerLink="/courses" mat-stroked-button>Courses</a>
            <a routerLink="/notifications" mat-stroked-button>Notifications</a>
          </div>
        }

        @if (role() === 'Lecturer') {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <!-- Pending submissions -->
            <div class="lms-card text-center py-6">
              <mat-icon class="text-orange-400 mb-2">pending_actions</mat-icon>
              <p class="text-3xl font-bold text-slate-800">{{ pendingSubmissionCount() }}</p>
              <p class="text-sm text-slate-500 mt-1">Pending Submissions to Grade</p>
              <a routerLink="/assignments" mat-button color="primary" class="mt-3 block text-sm">
                View Assignments
              </a>
            </div>

            <!-- Today's timetable sessions -->
            <div class="lms-card">
              <div class="flex items-center gap-2 mb-3">
                <mat-icon class="text-purple-400">today</mat-icon>
                <p class="text-sm font-semibold text-slate-700">Today's Sessions</p>
              </div>
              @if (todaySessions().length === 0) {
                <p class="text-slate-400 text-sm">No sessions scheduled for today.</p>
              } @else {
                <ul class="space-y-3">
                  @for (s of todaySessions(); track s.id) {
                    <li class="text-sm">
                      <p class="font-medium text-slate-700">{{ s.courseTitle }}</p>
                      <p class="text-slate-500 text-xs mt-0.5">
                        {{ s.startTime }} – {{ s.endTime }} · {{ s.room }} · {{ s.type }}
                      </p>
                    </li>
                  }
                </ul>
              }
              <a routerLink="/timetable" mat-button class="mt-4 block text-sm">
                View Full Timetable
              </a>
            </div>
          </div>

          <div class="mt-6 flex gap-3 flex-wrap">
            <a routerLink="/assignments" mat-stroked-button>Assignments</a>
            <a routerLink="/timetable" mat-stroked-button>Timetable</a>
          </div>
        }

        @if (role() === 'Admin') {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

            <!-- Total users -->
            <div class="lms-card text-center py-6">
              <mat-icon class="text-blue-400 mb-2">people</mat-icon>
              <p class="text-3xl font-bold text-slate-800">{{ totalUserCount() }}</p>
              <p class="text-sm text-slate-500 mt-1">Total Users</p>
              <a routerLink="/users" mat-button color="primary" class="mt-3 block text-sm">
                Manage Users
              </a>
            </div>

            <!-- Total courses -->
            <div class="lms-card text-center py-6">
              <mat-icon class="text-green-400 mb-2">menu_book</mat-icon>
              <p class="text-3xl font-bold text-slate-800">{{ totalCourseCount() }}</p>
              <p class="text-sm text-slate-500 mt-1">Total Courses</p>
              <a routerLink="/courses" mat-button color="primary" class="mt-3 block text-sm">
                View Courses
              </a>
            </div>

            <!-- Activity Log -->
            <div class="lms-card text-center py-6">
              <mat-icon class="text-slate-500 mb-2">history</mat-icon>
              <p class="text-sm font-semibold text-slate-700 mt-1">Activity Log</p>
              <p class="text-sm text-slate-500 mt-1">View all system activity and user actions</p>
              <a routerLink="/audit" mat-button color="primary" class="mt-3 block text-sm">View Activity Log</a>
            </div>
          </div>

          <div class="mt-6 flex gap-3 flex-wrap">
            <a routerLink="/users" mat-stroked-button>User Management</a>
            <a routerLink="/courses" mat-stroked-button>Courses</a>
          </div>
        }

      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  isLoading = signal(false);

  // Student
  upcomingDeadlines = signal<Assignment[]>([]);
  enrolledCourseCount = signal(0);
  unreadCount = signal(0);

  // Lecturer
  pendingSubmissionCount = signal(0);
  todaySessions = signal<TimetableSession[]>([]);

  // Admin
  totalUserCount = signal(0);
  totalCourseCount = signal(0);

  readonly role = computed(() => this.authService.currentUser()?.role ?? null);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly authService: AuthService,
    private readonly assignmentService: AssignmentService,
    private readonly enrollmentService: EnrollmentService,
    private readonly notificationService: NotificationService,
    private readonly timetableService: TimetableService,
    private readonly userService: UserService,
    private readonly courseService: CourseService,
  ) {}

  ngOnInit(): void {
    const r = this.role();
    if (r === 'Student') {
      this.loadStudentData();
    } else if (r === 'Lecturer') {
      this.loadLecturerData();
    } else if (r === 'Admin') {
      this.loadAdminData();
    }
  }

  deadlineLabel(deadline: string): string {
    const days = this.daysUntil(deadline);
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  }

  deadlineCss(deadline: string): string {
    const days = this.daysUntil(deadline);
    if (days === 0) return 'text-orange-500 font-medium';
    if (days <= 2) return 'text-amber-600 font-medium';
    return 'text-green-600 font-medium';
  }

  private daysUntil(deadline: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(deadline);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private loadStudentData(): void {
    const userId = this.authService.currentUser()!.id;
    this.isLoading.set(true);
    forkJoin({
      assignments: this.assignmentService.getAssignments().pipe(
        catchError(() => of<Assignment[]>([])),
      ),
      enrollments: this.enrollmentService.getStudentEnrollments(userId).pipe(
        catchError(() => of<Enrollment[]>([])),
      ),
      notifications: this.notificationService.getMyNotifications(true).pipe(
        catchError(() => of<Notification[]>([])),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ assignments, enrollments, notifications }) => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const cutoff = new Date(now);
          cutoff.setDate(now.getDate() + 7);
          this.upcomingDeadlines.set(
            assignments.filter(a => {
              const d = new Date(a.deadline);
              d.setHours(0, 0, 0, 0);
              return d >= now && d <= cutoff;
            }),
          );
          this.enrolledCourseCount.set(enrollments.filter(e => e.status === 'Active').length);
          this.unreadCount.set(notifications.length);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadLecturerData(): void {
    this.isLoading.set(true);
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    forkJoin({
      assignments: this.assignmentService.getAssignments().pipe(
        catchError(() => of<Assignment[]>([])),
      ),
      sessions: this.timetableService.getSessions().pipe(
        catchError(() => of<TimetableSession[]>([])),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ assignments, sessions }) => {
          this.pendingSubmissionCount.set(
            assignments.reduce((sum, a) => sum + a.submissionCount, 0),
          );
          this.todaySessions.set(sessions.filter(s => s.dayOfWeek === todayName));
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadAdminData(): void {
    this.isLoading.set(true);
    forkJoin({
      users: this.userService.getUsers({ pageSize: 1 }).pipe(
        catchError(() => of<PaginatedResult<User>>({ items: [], totalCount: 0, page: 1, pageSize: 1 })),
      ),
      courses: this.courseService.getCourses({ pageSize: 1 }).pipe(
        catchError(() => of<PaginatedResult<Course>>({ items: [], totalCount: 0, page: 1, pageSize: 1 })),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users, courses }) => {
          this.totalUserCount.set(users.totalCount);
          this.totalCourseCount.set(courses.totalCount);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}
