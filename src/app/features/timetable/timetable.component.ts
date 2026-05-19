import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimetableService } from '@core/services/timetable.service';
import { CourseService } from '@core/services/course.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/auth/auth.service';
import { TimetableSession, CreateSessionRequest, SessionType, Course, User } from '@shared/models/models';

interface WeekDay {
  name: string;
  date: Date;
  isToday: boolean;
}

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">

      <!-- ─── Header ─── -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 class="font-display text-2xl font-bold text-slate-900">
            {{ isAdmin() ? 'Timetable' : canManage() ? 'Manage Timetable' : 'My Timetable' }}
          </h1>
          <p class="text-slate-500 text-sm mt-1">Weekly Schedule</p>
          @if (isAdmin()) {
            <span class="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full mt-1">
              Admin View
            </span>
          }
        </div>
        @if (canManage()) {
          <button mat-flat-button color="primary" class="min-h-[44px]"
            [disabled]="isLoading()"
            (click)="toggleCreateForm()">
            <mat-icon>add</mat-icon>
            {{ showCreateForm() ? 'Cancel' : 'Add Session' }}
          </button>
        }
      </div>

      <!-- ─── Create Form ─── -->
      @if (showCreateForm()) {
        <div class="lms-card mb-6">
          <h2 class="font-display font-semibold text-slate-700 mb-4">New Session</h2>
          <form #createForm="ngForm" (ngSubmit)="createSession(createForm.valid)">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Course dropdown -->
              <mat-form-field appearance="outline">
                <mat-label>Course</mat-label>
                <mat-select [(ngModel)]="newSession.courseId" name="courseId" required
                  (ngModelChange)="onCourseChange($event)">
                  @if (isLoadingCourses()) {
                    <mat-option disabled>Loading courses…</mat-option>
                  }
                  @for (course of courses(); track course.id) {
                    <mat-option [value]="course.id">
                      {{ course.code }} — {{ course.title }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <!-- Lecturer: auto-filled for Lecturer role, dropdown for Admin -->
              @if (isAdmin()) {
                <mat-form-field appearance="outline">
                  <mat-label>Lecturer</mat-label>
                  <mat-select [(ngModel)]="newSession.lecturerId" name="lecturerId" required>
                    @if (isLoadingLecturers()) {
                      <mat-option disabled>Loading lecturers…</mat-option>
                    }
                    @for (lec of lecturers(); track lec.id) {
                      <mat-option [value]="lec.id">{{ lec.firstName }} {{ lec.lastName }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              <mat-form-field appearance="outline">
                <mat-label>Day</mat-label>
                <mat-select [(ngModel)]="newSession.dayOfWeek" name="dayOfWeek" required>
                  @for (day of dayOptions; track day.value) {
                    <mat-option [value]="day.value">{{ day.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Start Time</mat-label>
                <input matInput type="time" [(ngModel)]="newSession.startTime" name="startTime" required />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>End Time</mat-label>
                <input matInput type="time" [(ngModel)]="newSession.endTime" name="endTime" required />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Room</mat-label>
                <input matInput [(ngModel)]="newSession.room" name="room" required />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Type</mat-label>
                <mat-select [(ngModel)]="newSession.type" name="type" required>
                  @for (t of sessionTypes; track t) {
                    <mat-option [value]="t">{{ t }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="flex justify-end gap-3 mt-4">
              <button mat-stroked-button type="button" class="min-h-[44px]" (click)="toggleCreateForm()">Cancel</button>
              <button mat-flat-button color="primary" type="submit" class="min-h-[44px]"
                [disabled]="createForm.invalid || isSaving()">
                @if (isSaving()) {
                  <mat-spinner diameter="16" class="inline-block mr-1" />
                }
                Create Session
              </button>
            </div>
          </form>
        </div>
      }

      <!-- ─── Loading skeleton ─── -->
      @if (isLoading() && sessions().length === 0 && !errorMessage()) {
        <div class="hidden md:grid grid-cols-7 gap-3 animate-pulse">
          @for (i of [1,2,3,4,5,6,7]; track i) {
            <div class="flex flex-col gap-2">
              <div class="bg-slate-200 rounded-lg h-10"></div>
              <div class="bg-slate-100 rounded-xl flex-1 min-h-[180px] p-2 flex flex-col gap-2">
                <div class="bg-slate-200 rounded-lg h-24"></div>
                <div class="bg-slate-200 rounded-lg h-16"></div>
              </div>
            </div>
          }
        </div>
        <div class="md:hidden space-y-4 animate-pulse">
          @for (i of [1,2,3,4,5]; track i) {
            <div>
              <div class="bg-slate-200 rounded h-5 w-24 mb-2"></div>
              <div class="bg-slate-200 rounded-xl h-16 mb-2"></div>
            </div>
          }
        </div>
      } @else if (errorMessage()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-red-400 !text-4xl mb-3">error_outline</mat-icon>
          <p class="text-red-600">{{ errorMessage() }}</p>
        </div>
      } @else {

        <!-- ════════════════════════════════════════
             DESKTOP FIXED WEEKLY GRID  (md and above)
        ════════════════════════════════════════ -->
        <div class="hidden md:grid grid-cols-7 gap-3">
          @for (day of weekDays(); track day.name) {
            <div class="flex flex-col gap-2">

              <!-- Column header -->
              <div [class]="day.isToday
                ? 'rounded-lg px-3 py-2 text-center bg-blue-50 border border-blue-200'
                : 'rounded-lg px-3 py-2 text-center bg-white border border-slate-200'">
                <p [class]="day.isToday
                  ? 'font-semibold text-sm text-blue-700'
                  : 'font-semibold text-sm text-slate-700'">
                  {{ day.name }}
                </p>
                @if (day.isToday) {
                  <p class="text-xs text-blue-400 font-medium">Today</p>
                }
              </div>

              <!-- Sessions column -->
              <div [class]="day.isToday
                ? 'bg-blue-50 rounded-xl p-2 flex flex-col gap-2 flex-1 min-h-[180px]'
                : 'bg-slate-50 rounded-xl p-2 flex flex-col gap-2 flex-1 min-h-[180px]'">

                @if (sessionsForDay(day.name).length === 0) {
                  <div class="bg-slate-50 border border-dashed border-slate-200 rounded-lg min-h-[120px] flex items-center justify-center">
                    <span class="text-slate-400 text-sm">No classes</span>
                  </div>
                }

                @for (session of sessionsForDay(day.name); track session.id; let idx = $index) {
                  <div [class]="sessionCardBg(session) + ' rounded-lg border p-3 relative overflow-hidden cursor-default'">
                    <!-- Left colour bar -->
                    <div [class]="moduleColorBar(idx) + ' absolute left-0 top-0 bottom-0 w-1 rounded-l-lg'"></div>

                    <div class="pl-2">
                      @if (!session.isPublished) {
                        <span class="inline-block bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full mb-1.5">
                          Draft
                        </span>
                      }
                      <p class="font-semibold text-slate-800 text-sm leading-snug">{{ session.courseTitle }}</p>
                      <p class="text-xs text-slate-500 mt-1">{{ session.startTime }} – {{ session.endTime }}</p>

                      <div class="flex items-center gap-1 mt-1">
                        <mat-icon class="text-slate-400 !text-xs !w-3 !h-3 leading-none">room</mat-icon>
                        <span class="text-xs text-slate-500">{{ session.room }}</span>
                      </div>

                      <span [class]="typeBadgeClass(session.type) + ' inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-2'">
                        {{ session.type }}
                      </span>

                      @if (canManage() && !isAdmin()) {
                        <div class="flex items-center gap-1 mt-2 flex-wrap">
                          @if (!session.isPublished) {
                            <button mat-stroked-button color="primary"
                              class="!text-xs !min-h-[28px] !h-[28px] !leading-none !px-2"
                              [disabled]="isLoading()"
                              (click)="publishSession(session)">
                              Publish
                            </button>
                          }
                          <button mat-icon-button color="warn"
                            class="!w-[28px] !h-[28px] !min-h-[44px]"
                            matTooltip="Delete session"
                            [disabled]="isLoading()"
                            (click)="deleteSession(session)">
                            <mat-icon class="!text-base">delete</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- ════════════════════════════════════════
             MOBILE DAY LIST  (below md)
        ════════════════════════════════════════ -->
        <div class="md:hidden space-y-5">
          @if (sessions().length === 0) {
            <div class="lms-card text-center py-12">
              <mat-icon class="text-slate-300 !text-4xl mb-3">calendar_today</mat-icon>
              <p class="text-slate-500">No classes scheduled</p>
            </div>
          }
          @for (day of weekDays(); track day.name) {
            <div>
              <h3 [class]="day.isToday
                ? 'font-semibold text-blue-600 text-sm mb-2 px-1 flex items-center gap-2'
                : 'font-semibold text-slate-600 text-sm mb-2 px-1'">
                {{ day.name }}
                @if (day.isToday) {
                  <span class="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">Today</span>
                }
              </h3>
              @if (sessionsForDay(day.name).length === 0) {
                <p class="text-xs text-slate-400 pl-2 mb-1">No classes</p>
              }
              @for (session of sessionsForDay(day.name); track session.id; let idx = $index) {
                <div [class]="sessionCardBg(session) + ' rounded-lg border p-3 mb-2 flex items-start gap-3 relative overflow-hidden'">
                  <div [class]="moduleColorBar(idx) + ' absolute left-0 top-0 bottom-0 w-1 rounded-l-lg'"></div>
                  <div class="pl-2 flex items-start gap-3 w-full">
                    <span class="bg-slate-100 text-slate-600 font-mono text-xs font-semibold rounded px-2 py-1 shrink-0 mt-0.5">
                      {{ session.startTime }}
                    </span>
                    <div class="min-w-0 flex-1">
                      @if (!session.isPublished) {
                        <span class="inline-block bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full mb-1">Draft</span>
                      }
                      <p class="font-semibold text-slate-800 text-sm">{{ session.courseTitle }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">{{ session.startTime }} – {{ session.endTime }}</p>
                      <div class="flex items-center gap-1 mt-0.5">
                        <mat-icon class="text-slate-400 !text-xs !w-3 !h-3 leading-none">room</mat-icon>
                        <span class="text-xs text-slate-500">{{ session.room }}</span>
                      </div>
                      <span [class]="typeBadgeClass(session.type) + ' inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1'">
                        {{ session.type }}
                      </span>
                      @if (canManage() && !isAdmin()) {
                        <div class="flex items-center gap-1 mt-2 flex-wrap">
                          @if (!session.isPublished) {
                            <button mat-stroked-button color="primary"
                              class="!text-xs !min-h-[28px] !h-[28px] !leading-none !px-2"
                              [disabled]="isLoading()"
                              (click)="publishSession(session)">
                              Publish
                            </button>
                          }
                          <button mat-icon-button color="warn"
                            class="!w-[28px] !h-[28px] !min-h-[44px]"
                            matTooltip="Delete session"
                            [disabled]="isLoading()"
                            (click)="deleteSession(session)">
                            <mat-icon class="!text-base">delete</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class TimetableComponent implements OnInit {
  sessions = signal<TimetableSession[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isSaving = signal(false);
  showCreateForm = signal(false);
  currentWeekStart = signal<Date>(this.getMonday(new Date()));

  courses = signal<Course[]>([]);
  lecturers = signal<User[]>([]);
  isLoadingCourses = signal(false);
  isLoadingLecturers = signal(false);

  newSession: CreateSessionRequest = this.emptySession();

  readonly dayOptions = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 0 },
  ];
  readonly sessionTypes: SessionType[] = ['Lecture', 'Lab', 'Tutorial'];

  readonly canManage = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Lecturer' || role === 'Admin';
  });

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'Admin');

  readonly weekLabel = computed(() => {
    const d = this.currentWeekStart();
    return `Week of ${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`;
  });

  readonly weekDays = computed((): WeekDay[] => {
    const start = this.currentWeekStart();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((name, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      date.setHours(0, 0, 0, 0);
      return { name, date, isToday: date.getTime() === today.getTime() };
    });
  });

  readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly timetableService = inject(TimetableService);
  private readonly courseService = inject(CourseService);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadSessions();
  }

  goToPrevWeek(): void {
    this.currentWeekStart.update(d => {
      const n = new Date(d);
      n.setDate(d.getDate() - 7);
      return n;
    });
  }

  goToNextWeek(): void {
    this.currentWeekStart.update(d => {
      const n = new Date(d);
      n.setDate(d.getDate() + 7);
      return n;
    });
  }

  jumpToToday(): void {
    this.currentWeekStart.set(this.getMonday(new Date()));
  }

  sessionsForDay(dayName: string): TimetableSession[] {
    return this.sessions().filter(s => s.dayOfWeek === dayName);
  }

  typeBadgeClass(type: SessionType): string {
    if (type === 'Lecture') return 'bg-blue-100 text-blue-700';
    if (type === 'Lab') return 'bg-violet-100 text-violet-700';
    return 'bg-green-100 text-green-700';
  }

  sessionCardBg(session: TimetableSession): string {
    return session.isPublished ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200';
  }

  moduleColorBar(index: number): string {
    const bars = ['bg-blue-500', 'bg-violet-500', 'bg-green-500', 'bg-amber-500'];
    return bars[index % bars.length];
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    if (this.showCreateForm()) {
      this.loadFormData();
    } else {
      this.newSession = this.emptySession();
      this.courses.set([]);
      this.lecturers.set([]);
    }
  }

  onCourseChange(courseId: string): void {
    if (!courseId) return;
    this.courseService.getCourseSemesterId(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: semId => { this.newSession.semesterId = semId; },
        error: () => { this.newSession.semesterId = ''; },
      });
  }

  private loadFormData(): void {
    this.isLoadingCourses.set(true);
    this.courseService.getCourses({ pageSize: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => { this.courses.set(result.items); this.isLoadingCourses.set(false); },
        error: () => this.isLoadingCourses.set(false),
      });

    if (this.isAdmin()) {
      this.isLoadingLecturers.set(true);
      this.userService.getUsers({ role: 'Lecturer', pageSize: 200 })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: result => { this.lecturers.set(result.items); this.isLoadingLecturers.set(false); },
          error: () => this.isLoadingLecturers.set(false),
        });
    } else {
      const user = this.authService.currentUser();
      if (user?.id) {
        this.newSession.lecturerId = user.id;
      }
    }
  }

  createSession(valid: boolean | null): void {
    if (!valid) return;
    const user = this.authService.currentUser();
    const request: CreateSessionRequest = {
      ...this.newSession,
      lecturerId: user?.role === 'Lecturer' ? (user.id ?? this.newSession.lecturerId) : this.newSession.lecturerId,
    };
    this.isSaving.set(true);
    this.timetableService.createSession(request).subscribe({
      next: (session) => {
        this.sessions.update(s => [...s, session]);
        this.snackBar.open('Session created successfully.', 'Dismiss', { duration: 4000 });
        this.showCreateForm.set(false);
        this.newSession = this.emptySession();
        this.isSaving.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to create session.', 'Dismiss', { duration: 4000 });
        this.isSaving.set(false);
      },
    });
  }

  publishSession(session: TimetableSession): void {
    this.isLoading.set(true);
    this.timetableService.publishSession(session.id).subscribe({
      next: () => {
        this.sessions.update(s => s.map(item =>
          item.id === session.id ? { ...item, isPublished: true } : item,
        ));
        this.snackBar.open('Session published.', 'Dismiss', { duration: 3000 });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to publish session.', 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }

  deleteSession(session: TimetableSession): void {
    this.isLoading.set(true);
    this.timetableService.deleteSession(session.id).subscribe({
      next: () => {
        this.sessions.update(s => s.filter(item => item.id !== session.id));
        this.snackBar.open('Session deleted.', 'Dismiss', { duration: 3000 });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to delete session.', 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }

  private loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.timetableService.getSessions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.sessions.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load timetable.');
          this.isLoading.set(false);
        },
      });
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  private emptySession(): CreateSessionRequest {
    return {
      courseId: '',
      lecturerId: '',
      semesterId: '',
      dayOfWeek: 1,
      startTime: '',
      endTime: '',
      room: '',
      type: 'Lecture',
    };
  }
}
