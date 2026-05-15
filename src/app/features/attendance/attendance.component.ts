import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { AttendanceService } from '@core/services/attendance.service';
import { TimetableService } from '@core/services/timetable.service';
import { AuthService } from '@core/auth/auth.service';
import {
  AttendanceRecord,
  AttendanceStatus,
  MarkAttendanceRequest,
  StudentAttendanceSummary,
  TimetableSession,
} from '@shared/models/models';

interface MarkableRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  notes: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">

      <!-- ════════════════════════════════════════
           STUDENT VIEW
      ════════════════════════════════════════ -->
      @if (userRole() === 'Student') {

        <div class="mb-6">
          <h1 class="font-display text-2xl font-bold text-slate-900">My Attendance</h1>
        </div>

        @if (isLoading()) {
          <div class="space-y-4 animate-pulse">
            <div class="h-44 bg-slate-200 rounded-xl"></div>
            <div class="h-24 bg-slate-200 rounded-xl"></div>
            <div class="h-24 bg-slate-200 rounded-xl"></div>
          </div>
        } @else if (errorMessage()) {
          <div class="lms-card text-center py-12">
            <mat-icon class="text-red-400 !text-4xl mb-3">error_outline</mat-icon>
            <p class="text-red-600">{{ errorMessage() }}</p>
          </div>
        } @else if (summary().length === 0) {
          <div class="lms-card text-center py-12">
            <mat-icon class="text-slate-300 !text-4xl mb-3">event_available</mat-icon>
            <p class="text-slate-500">No attendance records yet</p>
          </div>
        } @else {

          <!-- ─── Overall summary card ─── -->
          <div class="lms-card mb-4 text-center relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-l-xl"></div>
            <p class="text-slate-500 text-sm mb-2">Overall Attendance</p>
            <p [class]="overallPctClass() + ' font-display text-5xl font-bold'">
              {{ overallPct() }}%
            </p>
            <p class="text-slate-500 text-sm mt-2">
              {{ totalAttended() }} of {{ totalSessions() }} sessions attended
            </p>
            <div class="mt-4 h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                [class]="overallBarClass()"
                [style.width.%]="overallPct()">
              </div>
            </div>
          </div>

          <!-- ─── Warning banner ─── -->
          @if (anyBelowThreshold()) {
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <mat-icon class="text-amber-600 shrink-0 mt-0.5">warning</mat-icon>
              <p class="text-amber-800 text-sm">
                Your attendance is below the required 80% threshold.
                Please speak to your lecturer.
              </p>
            </div>
          }

          <!-- ─── Module filter ─── -->
          <div class="lms-card mb-4 flex flex-wrap items-center gap-4">
            <mat-form-field appearance="outline" class="!w-56 !mb-0">
              <mat-label>Module</mat-label>
              <mat-select [(ngModel)]="selectedModuleFilter" (ngModelChange)="onModuleFilterChange($event)">
                <mat-option value="all">All Modules</mat-option>
                @for (s of summary(); track s.courseId) {
                  <mat-option [value]="s.courseId">{{ s.courseName }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- ─── Per-module breakdown ─── -->
          <h2 class="font-display text-lg font-bold text-slate-900 mb-3">By Module</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            @for (s of filteredSummary(); track s.courseId; let idx = $index) {
              <div class="lms-card hover:shadow-md transition-shadow relative overflow-hidden cursor-default">
                <div [class]="moduleLeftBar(idx) + ' absolute left-0 top-0 bottom-0 w-1 rounded-l-xl'"></div>
                <div class="pl-2">
                  <p class="font-semibold text-slate-800 mb-1 leading-snug">{{ s.courseName }}</p>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-slate-500">{{ s.attendedSessions }} / {{ s.totalSessions }} sessions</span>
                    <span [class]="modulePctClass(s) + ' font-bold text-sm'">
                      {{ s.attendancePercentage | number:'1.0-0' }}%
                    </span>
                  </div>
                  <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500"
                      [class]="moduleBarClass(s)"
                      [style.width.%]="s.attendancePercentage">
                    </div>
                  </div>
                  @if (s.belowWarningThreshold) {
                    <div class="flex items-center gap-1 mt-2">
                      <mat-icon class="text-amber-500 !text-xs !w-3 !h-3 leading-none">warning</mat-icon>
                      <span class="text-xs text-amber-600">Below 80% threshold</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

      } @else {

        <!-- ════════════════════════════════════════
             LECTURER / ADMIN VIEW
        ════════════════════════════════════════ -->
        <div class="mb-6">
          <h1 class="font-display text-2xl font-bold text-slate-900">Mark Attendance</h1>
        </div>

        <mat-tab-group animationDuration="200ms" class="w-full">

          <!-- ─── TAB 1: Mark Attendance ─── -->
          <mat-tab label="Mark Attendance">
            <div class="pt-6 space-y-4">

              <!-- Session selector -->
              <div class="lms-card">
                @if (sessionsLoading()) {
                  <div class="flex justify-center py-6">
                    <mat-spinner diameter="32" />
                  </div>
                } @else if (sessionsError()) {
                  <p class="text-red-600 text-sm">{{ sessionsError() }}</p>
                } @else {
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Select a session</mat-label>
                    <mat-select [(ngModel)]="selectedSessionId" (ngModelChange)="onSessionChange($event)">
                      @for (sess of sessions(); track sess.id) {
                        <mat-option [value]="sess.id">
                          {{ sess.courseTitle }} — {{ sess.dayOfWeek }} {{ sess.startTime }}–{{ sess.endTime }} ({{ sess.room }})
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
              </div>

              @if (selectedSessionId) {
                @if (isLoading()) {
                  <div class="flex justify-center py-16">
                    <mat-spinner diameter="40" />
                  </div>
                } @else if (errorMessage()) {
                  <div class="lms-card text-center py-12">
                    <mat-icon class="text-red-400 !text-4xl mb-3">error_outline</mat-icon>
                    <p class="text-red-600">{{ errorMessage() }}</p>
                  </div>
                } @else if (markableRecords().length === 0) {
                  <div class="lms-card text-center py-12">
                    <mat-icon class="text-slate-300 !text-4xl mb-3">people</mat-icon>
                    <p class="text-slate-500">No students enrolled in this session.</p>
                  </div>
                } @else {
                  <div class="lms-card relative overflow-hidden">
                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-l-xl"></div>
                    <div class="pl-2">
                      <!-- Roster header -->
                      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div>
                          <p class="font-semibold text-slate-800">Student Roster</p>
                          <p class="text-sm text-slate-500">{{ markableRecords().length }} students</p>
                        </div>
                        <button mat-stroked-button class="min-h-[44px]" (click)="markAllPresent()">
                          <mat-icon>done_all</mat-icon>
                          Mark All Present
                        </button>
                      </div>

                      <!-- Students -->
                      <div class="space-y-0">
                        @for (rec of markableRecords(); track rec.studentId; let i = $index) {
                          <div>
                            <div class="flex items-center gap-4 py-3 flex-wrap">
                              <!-- Avatar -->
                              <div class="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <span class="text-sm font-semibold text-slate-600">
                                  {{ rec.studentName.charAt(0).toUpperCase() }}
                                </span>
                              </div>
                              <!-- Name -->
                              <p class="font-semibold text-slate-800 text-sm flex-1 min-w-[120px]">{{ rec.studentName }}</p>
                              <!-- Toggle buttons -->
                              <div class="flex gap-1.5 ml-auto flex-wrap">
                                <button
                                  [class]="rec.status === 'Present'
                                    ? 'min-h-[44px] px-3 text-xs font-semibold rounded-lg bg-green-600 text-white border-0 cursor-pointer transition-colors'
                                    : 'min-h-[44px] px-3 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 border-0 cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors'"
                                  (click)="setStudentStatus(i, 'Present')">
                                  Present
                                </button>
                                <button
                                  [class]="rec.status === 'Late'
                                    ? 'min-h-[44px] px-3 text-xs font-semibold rounded-lg bg-amber-500 text-white border-0 cursor-pointer transition-colors'
                                    : 'min-h-[44px] px-3 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 border-0 cursor-pointer hover:bg-amber-50 hover:text-amber-700 transition-colors'"
                                  (click)="setStudentStatus(i, 'Late')">
                                  Late
                                </button>
                                <button
                                  [class]="rec.status === 'Absent'
                                    ? 'min-h-[44px] px-3 text-xs font-semibold rounded-lg bg-red-600 text-white border-0 cursor-pointer transition-colors'
                                    : 'min-h-[44px] px-3 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 border-0 cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors'"
                                  (click)="setStudentStatus(i, 'Absent')">
                                  Absent
                                </button>
                              </div>
                            </div>
                            @if (i < markableRecords().length - 1) {
                              <mat-divider />
                            }
                          </div>
                        }
                      </div>

                      <!-- Save indicator -->
                      <div class="mt-4 flex items-center gap-2 text-sm">
                        @if (submitSuccess()) {
                          <mat-icon class="text-green-600 !text-base">check_circle</mat-icon>
                          <span class="text-green-600">All changes saved</span>
                        } @else {
                          <mat-icon class="text-amber-500 !text-base">pending</mat-icon>
                          <span class="text-amber-600">Unsaved changes</span>
                        }
                      </div>

                      <!-- Submit button -->
                      <button
                        mat-flat-button
                        color="primary"
                        class="w-full min-h-[48px] mt-4"
                        [disabled]="isSubmitting()"
                        (click)="submitAttendance()">
                        @if (isSubmitting()) {
                          <mat-spinner diameter="18" class="inline-block mr-2" />
                        }
                        Submit Attendance
                      </button>

                      @if (submitError()) {
                        <p class="text-red-600 text-sm mt-2">{{ submitError() }}</p>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </mat-tab>

          <!-- ─── TAB 2: Attendance Summary ─── -->
          <mat-tab label="Attendance Summary">
            <div class="pt-6">
              @if (markableRecords().length === 0) {
                <div class="lms-card text-center py-12">
                  <mat-icon class="text-slate-300 !text-4xl mb-3">bar_chart</mat-icon>
                  <p class="text-slate-500">Select a session and mark attendance to view the summary.</p>
                </div>
              } @else {
                <div class="lms-card overflow-hidden">
                  <p class="font-semibold text-slate-700 mb-4">
                    Session Summary
                    <span class="text-slate-400 font-normal text-sm ml-2">{{ markableRecords().length }} students</span>
                  </p>
                  <table mat-table [dataSource]="markableRecords()" class="w-full">
                    <ng-container matColumnDef="student">
                      <th mat-header-cell *matHeaderCellDef class="!font-semibold">Student</th>
                      <td mat-cell *matCellDef="let rec">
                        <div class="flex items-center gap-3 py-2">
                          <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <span class="text-xs font-semibold text-slate-600">{{ rec.studentName.charAt(0) }}</span>
                          </div>
                          <span class="font-medium text-slate-800 text-sm">{{ rec.studentName }}</span>
                        </div>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef class="!font-semibold">Status</th>
                      <td mat-cell *matCellDef="let rec">
                        <span [class]="summaryStatusClass(rec.status)">{{ rec.status }}</span>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="summaryColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: summaryColumns;" class="hover:bg-slate-50 transition-colors"></tr>
                  </table>
                  <mat-paginator [pageSizeOptions]="[10, 25, 50]" pageSize="10" showFirstLastButtons />
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
})
export class AttendanceComponent implements OnInit {
  summary = signal<StudentAttendanceSummary[]>([]);
  sessions = signal<TimetableSession[]>([]);
  markableRecords = signal<MarkableRecord[]>([]);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  sessionsLoading = signal(false);
  sessionsError = signal<string | null>(null);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);

  selectedSessionId: string | null = null;
  selectedModuleFilter = 'all';

  readonly statusOptions: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];
  readonly summaryColumns = ['student', 'status'];
  readonly userRole = this.authService.userRole;

  readonly overallPct = computed(() => {
    const s = this.summary();
    if (s.length === 0) return 0;
    const total = s.reduce((acc, cur) => acc + cur.totalSessions, 0);
    const attended = s.reduce((acc, cur) => acc + cur.attendedSessions, 0);
    return total === 0 ? 0 : Math.round((attended / total) * 100);
  });

  readonly totalSessions = computed(() => this.summary().reduce((a, s) => a + s.totalSessions, 0));
  readonly totalAttended = computed(() => this.summary().reduce((a, s) => a + s.attendedSessions, 0));
  readonly anyBelowThreshold = computed(() => this.summary().some(s => s.belowWarningThreshold));

  readonly filteredSummary = computed(() => {
    const filter = this.selectedModuleFilter;
    if (filter === 'all') return this.summary();
    return this.summary().filter(s => s.courseId === filter);
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private attendanceService: AttendanceService,
    private timetableService: TimetableService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const role = this.authService.currentUser()?.role;
    if (role === 'Student') {
      const studentId = this.authService.currentUser()!.id;
      this.isLoading.set(true);
      this.attendanceService.getStudentSummary(studentId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.summary.set(data);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.errorMessage.set(err?.error?.message ?? 'Failed to load attendance.');
            this.isLoading.set(false);
          },
        });
    } else {
      this.sessionsLoading.set(true);
      this.timetableService.getSessions()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.sessions.set(data);
            this.sessionsLoading.set(false);
          },
          error: (err) => {
            this.sessionsError.set(err?.error?.message ?? 'Failed to load sessions.');
            this.sessionsLoading.set(false);
          },
        });
    }
  }

  onModuleFilterChange(_: string): void {
    // filter applied reactively via filteredSummary computed
  }

  onSessionChange(sessionId: string): void {
    this.errorMessage.set(null);
    this.submitError.set(null);
    this.submitSuccess.set(false);
    this.markableRecords.set([]);
    this.isLoading.set(true);

    this.attendanceService.getSessionRecords(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (records: AttendanceRecord[]) => {
          this.markableRecords.set(records.map(r => ({
            studentId: r.studentId,
            studentName: r.studentName,
            status: r.status === 'NotTaken' ? 'Present' : r.status,
            notes: r.notes ?? '',
          })));
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load session records.');
          this.isLoading.set(false);
        },
      });
  }

  setStudentStatus(index: number, status: AttendanceStatus): void {
    this.markableRecords.update(records => {
      const updated = [...records];
      updated[index] = { ...updated[index], status };
      return updated;
    });
    this.submitSuccess.set(false);
  }

  markAllPresent(): void {
    this.markableRecords.update(records =>
      records.map(r => ({ ...r, status: 'Present' as AttendanceStatus })),
    );
    this.submitSuccess.set(false);
  }

  submitAttendance(): void {
    if (!this.selectedSessionId) return;

    this.submitError.set(null);
    this.submitSuccess.set(false);
    this.isSubmitting.set(true);

    const request: MarkAttendanceRequest = {
      timetableSessionId: this.selectedSessionId,
      date: new Date().toISOString().split('T')[0],
      records: this.markableRecords().map(r => ({
        studentId: r.studentId,
        status: r.status,
        notes: r.notes || undefined,
      })),
    };

    this.attendanceService.markAttendance(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitSuccess.set(true);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.submitError.set(err?.error?.message ?? 'Failed to save attendance.');
          this.isSubmitting.set(false);
        },
      });
  }

  overallPctClass(): string {
    const p = this.overallPct();
    if (p >= 80) return 'text-green-600';
    if (p >= 60) return 'text-amber-600';
    return 'text-red-600';
  }

  overallBarClass(): string {
    const p = this.overallPct();
    if (p >= 80) return 'bg-green-500';
    if (p >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  }

  modulePctClass(s: StudentAttendanceSummary): string {
    if (s.attendancePercentage >= 80) return 'text-green-600';
    if (s.attendancePercentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  }

  moduleBarClass(s: StudentAttendanceSummary): string {
    if (s.attendancePercentage >= 80) return 'bg-green-500';
    if (s.attendancePercentage >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  }

  moduleLeftBar(index: number): string {
    const bars = ['bg-blue-500', 'bg-violet-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'];
    return bars[index % bars.length];
  }

  summaryStatusClass(status: AttendanceStatus): string {
    const base = 'text-xs font-medium px-2 py-0.5 rounded-full ';
    if (status === 'Present') return base + 'bg-green-100 text-green-700';
    if (status === 'Absent') return base + 'bg-red-100 text-red-700';
    if (status === 'Late') return base + 'bg-amber-100 text-amber-700';
    return base + 'bg-slate-100 text-slate-600';
  }

  percentageCss(s: StudentAttendanceSummary): string {
    if (s.belowWarningThreshold) return 'text-lg font-bold text-red-600';
    if (s.attendancePercentage >= 80) return 'text-lg font-bold text-green-600';
    return 'text-lg font-bold text-amber-600';
  }

  barCss(s: StudentAttendanceSummary): string {
    if (s.belowWarningThreshold) return 'bg-red-500';
    if (s.attendancePercentage >= 80) return 'bg-green-500';
    return 'bg-amber-500';
  }
}
