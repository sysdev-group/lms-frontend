import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { CourseService } from '@core/services/course.service';
import { AuthService } from '@core/auth/auth.service';
import { Course } from '@shared/models/models';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
  ],
  template: `
    <div class="page-container">
      <div class="max-w-4xl mx-auto">

        <!-- Breadcrumb -->
        <div class="mb-5">
          <a routerLink="/courses"
             class="inline-flex items-center gap-1.5 text-sm text-slate-500
                    hover:text-slate-700 transition-colors no-underline cursor-pointer">
            <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
            Back to Modules
          </a>
        </div>

        <!-- Skeleton -->
        @if (isLoading()) {
          <div class="animate-pulse space-y-5">
            <div class="lms-card relative overflow-hidden">
              <div class="absolute inset-y-0 left-0 w-1 bg-slate-200"></div>
              <div class="pl-3 space-y-3">
                <div class="h-3 bg-slate-200 rounded w-20"></div>
                <div class="h-7 bg-slate-200 rounded w-2/3"></div>
                <div class="flex items-center gap-2 pt-1">
                  <div class="w-7 h-7 bg-slate-200 rounded-full"></div>
                  <div class="h-3 bg-slate-200 rounded w-32"></div>
                </div>
                <div class="flex gap-4 pt-2">
                  <div class="h-3 bg-slate-100 rounded w-24"></div>
                  <div class="h-3 bg-slate-100 rounded w-20"></div>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <div class="flex gap-8 border-b border-slate-100 px-6 py-3">
                <div class="h-4 bg-slate-200 rounded w-16"></div>
                <div class="h-4 bg-slate-100 rounded w-20"></div>
                <div class="h-4 bg-slate-100 rounded w-16"></div>
                <div class="h-4 bg-slate-100 rounded w-20"></div>
              </div>
              <div class="p-6 space-y-3">
                <div class="h-4 bg-slate-100 rounded w-full"></div>
                <div class="h-4 bg-slate-100 rounded w-5/6"></div>
                <div class="h-4 bg-slate-100 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        }

        <!-- Error state -->
        @else if (errorMessage()) {
          <div class="lms-card text-center py-14">
            <div class="inline-flex items-center justify-center w-12 h-12
                        rounded-full bg-red-50 mb-4">
              <mat-icon class="text-red-400"
                        style="font-size:24px;width:24px;height:24px">error_outline</mat-icon>
            </div>
            <h2 class="font-display text-base font-semibold text-slate-800 mb-1.5">
              Module could not be loaded
            </h2>
            <p class="text-sm text-slate-500 mb-6">{{ errorMessage() }}</p>
            <button mat-stroked-button color="primary" class="min-h-[44px]"
                    type="button" (click)="loadCourse()">
              Try again
            </button>
          </div>
        }

        <!-- Main content -->
        @else {
          @if (course(); as c) {

            <!-- Header card -->
            <div class="lms-card mb-5 relative overflow-hidden">
              <div class="absolute inset-y-0 left-0 w-1 bg-primary-600"></div>
              <div class="pl-3">

                <!-- Code + status -->
                <div class="flex items-start justify-between mb-2">
                  <span class="text-xs font-semibold uppercase tracking-wide text-primary-600">
                    {{ c.code }}
                  </span>
                  <span class="badge shrink-0"
                        [class.badge-success]="!c.isArchived"
                        [class.badge-neutral]="c.isArchived">
                    {{ courseStatus(c) }}
                  </span>
                </div>

                <!-- Module title -->
                <h1 class="font-display text-2xl font-bold text-slate-900 leading-tight mb-3">
                  {{ c.title }}
                </h1>

                <!-- Lecturer row -->
                @if (c.lecturerName) {
                  <div class="flex items-center gap-2 mb-4">
                    <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center
                                justify-center flex-shrink-0">
                      <span class="text-xs font-bold text-blue-700">
                        {{ c.lecturerName[0].toUpperCase() }}
                      </span>
                    </div>
                    <span class="text-sm text-slate-600">{{ c.lecturerName }}</span>
                  </div>
                }

                <!-- Meta row -->
                <div class="flex flex-wrap items-center gap-4">
                  <div class="flex items-center gap-1.5 text-sm text-slate-500">
                    <mat-icon style="font-size:16px;width:16px;height:16px">groups</mat-icon>
                    <span>{{ c.enrolledStudentCount }} enrolled</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-sm text-slate-500">
                    <mat-icon style="font-size:16px;width:16px;height:16px">star_outline</mat-icon>
                    <span>{{ c.creditHours }} credit hours</span>
                  </div>
                  @if (c.semesterName) {
                    <div class="flex items-center gap-1.5 text-sm text-slate-500">
                      <mat-icon style="font-size:16px;width:16px;height:16px">event_note</mat-icon>
                      <span>{{ c.semesterName }}</span>
                    </div>
                  }
                </div>

                @if (c.description) {
                  <p class="mt-4 text-sm text-slate-600 leading-relaxed
                            border-t border-slate-100 pt-4">
                    {{ c.description }}
                  </p>
                }

              </div>
            </div>

            <!-- Tab group -->
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <mat-tab-group class="w-full" animationDuration="150ms">

                <!-- ── Tab 1: Overview ─────────────────────────────────── -->
                <mat-tab label="Overview">
                  <div class="p-6 space-y-5">

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      @if (c.lecturerName) {
                        <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                          <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center
                                      justify-center flex-shrink-0">
                            <mat-icon class="text-blue-600"
                                      style="font-size:20px;width:20px;height:20px">person</mat-icon>
                          </div>
                          <div>
                            <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">
                              Lecturer
                            </p>
                            <p class="text-sm font-semibold text-slate-800 mt-0.5">
                              {{ c.lecturerName }}
                            </p>
                          </div>
                        </div>
                      }

                      @if (c.semesterName) {
                        <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                          <div class="w-9 h-9 rounded-lg bg-violet-50 flex items-center
                                      justify-center flex-shrink-0">
                            <mat-icon class="text-violet-600"
                                      style="font-size:20px;width:20px;height:20px">event_note</mat-icon>
                          </div>
                          <div>
                            <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">
                              Semester
                            </p>
                            <p class="text-sm font-semibold text-slate-800 mt-0.5">
                              {{ c.semesterName }}
                            </p>
                          </div>
                        </div>
                      }

                      <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                        <div class="w-9 h-9 rounded-lg bg-green-50 flex items-center
                                    justify-center flex-shrink-0">
                          <mat-icon class="text-green-600"
                                    style="font-size:20px;width:20px;height:20px">groups</mat-icon>
                        </div>
                        <div>
                          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            Enrolled Students
                          </p>
                          <p class="font-display text-xl font-bold text-slate-900 mt-0.5">
                            {{ c.enrolledStudentCount }}
                          </p>
                        </div>
                      </div>

                      <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                        <div class="w-9 h-9 rounded-lg bg-amber-50 flex items-center
                                    justify-center flex-shrink-0">
                          <mat-icon class="text-amber-600"
                                    style="font-size:20px;width:20px;height:20px">star_outline</mat-icon>
                        </div>
                        <div>
                          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            Credit Hours
                          </p>
                          <p class="font-display text-xl font-bold text-slate-900 mt-0.5">
                            {{ c.creditHours }}
                          </p>
                        </div>
                      </div>
                    </div>

                    @if (c.description) {
                      <div>
                        <h3 class="font-display font-semibold text-slate-900 mb-2">
                          Description
                        </h3>
                        <p class="text-sm text-slate-600 leading-relaxed">
                          {{ c.description }}
                        </p>
                      </div>
                    }

                    @if (createdAt(c)) {
                      <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400
                                  pt-4 border-t border-slate-100">
                        <mat-icon style="font-size:14px;width:14px;height:14px">calendar_today</mat-icon>
                        <span>Created {{ createdAt(c) | date:'mediumDate' }}</span>
                        @if (updatedAt(c)) {
                          <span class="text-slate-200">·</span>
                          <mat-icon style="font-size:14px;width:14px;height:14px">update</mat-icon>
                          <span>Updated {{ updatedAt(c) | date:'mediumDate' }}</span>
                        }
                      </div>
                    }

                  </div>
                </mat-tab>

                <!-- ── Tab 2: Assignments ──────────────────────────────── -->
                <mat-tab label="Assignments">
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-5">
                      <h3 class="font-display font-semibold text-slate-900">Assignments</h3>
                      @if (role() === 'Lecturer') {
                        <a routerLink="/assignments" mat-flat-button color="primary"
                           class="min-h-[40px]">
                          <mat-icon>add</mat-icon>
                          Add Assignment
                        </a>
                      }
                    </div>
                    <div class="flex flex-col items-center py-8 text-center">
                      <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center
                                  justify-center mb-3">
                        <mat-icon class="text-blue-500"
                                  style="font-size:24px;width:24px;height:24px">assignment</mat-icon>
                      </div>
                      @if (role() === 'Student') {
                        <p class="text-sm font-medium text-slate-700">
                          View and submit your assignments
                        </p>
                        <p class="text-xs text-slate-400 mt-1">
                          Track submission status and due dates on the Assignments page.
                        </p>
                        <a routerLink="/assignments" mat-flat-button color="primary"
                           class="mt-5 min-h-[44px]">
                          Go to Assignments
                        </a>
                      } @else if (role() === 'Lecturer') {
                        <p class="text-sm font-medium text-slate-700">
                          Manage assignments for this module
                        </p>
                        <p class="text-xs text-slate-400 mt-1">
                          View submission counts and grade student work.
                        </p>
                        <a routerLink="/assignments" mat-stroked-button color="primary"
                           class="mt-5 min-h-[44px]">
                          View All Assignments
                        </a>
                      } @else {
                        <p class="text-sm font-medium text-slate-700">Module assignments</p>
                        <p class="text-xs text-slate-400 mt-1">
                          View assignments and submission data on the Assignments page.
                        </p>
                        <a routerLink="/assignments" mat-stroked-button color="primary"
                           class="mt-5 min-h-[44px]">
                          View Assignments
                        </a>
                      }
                    </div>
                  </div>
                </mat-tab>

                <!-- ── Tab 3: Timetable ───────────────────────────────── -->
                <mat-tab label="Timetable">
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-5">
                      <h3 class="font-display font-semibold text-slate-900">Timetable</h3>
                    </div>
                    <div class="flex flex-col items-center py-8 text-center">
                      <div class="w-12 h-12 rounded-full bg-violet-50 flex items-center
                                  justify-center mb-3">
                        <mat-icon class="text-violet-500"
                                  style="font-size:24px;width:24px;height:24px">schedule</mat-icon>
                      </div>
                      <p class="text-sm font-medium text-slate-700">
                        Upcoming sessions for this module
                      </p>
                      <p class="text-xs text-slate-400 mt-1">
                        View room, time, and session types on the Timetable page.
                      </p>
                      <a routerLink="/timetable" mat-flat-button color="primary"
                         class="mt-5 min-h-[44px]">
                        View Timetable
                      </a>
                    </div>
                  </div>
                </mat-tab>

                <!-- ── Tab 4: Attendance ──────────────────────────────── -->
                <mat-tab label="Attendance">
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-5">
                      <h3 class="font-display font-semibold text-slate-900">Attendance</h3>
                    </div>
                    <div class="flex flex-col items-center py-8 text-center">
                      <div class="w-12 h-12 rounded-full bg-green-50 flex items-center
                                  justify-center mb-3">
                        <mat-icon class="text-green-500"
                                  style="font-size:24px;width:24px;height:24px">how_to_reg</mat-icon>
                      </div>
                      @if (role() === 'Student') {
                        <p class="text-sm font-medium text-slate-700">
                          Your attendance summary
                        </p>
                        <p class="text-xs text-slate-400 mt-1">
                          View your attendance percentage and session history.
                        </p>
                        <a routerLink="/attendance" mat-flat-button color="primary"
                           class="mt-5 min-h-[44px]">
                          View My Attendance
                        </a>
                      } @else if (role() === 'Lecturer') {
                        <p class="text-sm font-medium text-slate-700">
                          Class attendance roster
                        </p>
                        <p class="text-xs text-slate-400 mt-1">
                          Mark attendance and view the full class record.
                        </p>
                        <a routerLink="/attendance" mat-flat-button color="primary"
                           class="mt-5 min-h-[44px]">
                          Manage Attendance
                        </a>
                      } @else {
                        <p class="text-sm font-medium text-slate-700">
                          Module attendance data
                        </p>
                        <p class="text-xs text-slate-400 mt-1">
                          View attendance records for this module.
                        </p>
                        <a routerLink="/attendance" mat-stroked-button color="primary"
                           class="mt-5 min-h-[44px]">
                          View Attendance
                        </a>
                      }
                    </div>
                  </div>
                </mat-tab>

              </mat-tab-group>
            </div>

          }
        }

      </div>
    </div>
  `,
})
export class CourseDetailComponent implements OnInit {
  course = signal<Course | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly role = computed(() => this.authService.currentUser()?.role);

  private courseId = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.courseId.set(this.route.snapshot.paramMap.get('id'));
    this.loadCourse();
  }

  loadCourse(): void {
    const id = this.courseId();
    if (!id) {
      this.course.set(null);
      this.errorMessage.set('The course link is missing an ID.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.courseService.getCourseById(id).subscribe({
      next: course => {
        this.course.set(course);
        this.isLoading.set(false);
      },
      error: () => {
        this.course.set(null);
        this.errorMessage.set('Please go back to Modules and open the module again.');
        this.isLoading.set(false);
      },
    });
  }

  courseStatus(course: Course): string {
    return course.isArchived ? 'Archived' : 'Active';
  }

  createdAt(course: Course): string | null {
    return this.optionalDate(course, 'createdAt');
  }

  updatedAt(course: Course): string | null {
    return this.optionalDate(course, 'updatedAt');
  }

  private optionalDate(course: Course, field: 'createdAt' | 'updatedAt'): string | null {
    return (course as Course & Record<typeof field, string | null | undefined>)[field] ?? null;
  }
}
