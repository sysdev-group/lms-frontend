import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
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
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatRadioModule,
  ],
  template: `
    <div class="page-container">
      <h1 class="section-title">Attendance</h1>

      @if (userRole() === 'Student') {

        <!-- ── Student view ── -->
        @if (isLoading()) {
          <div class="flex justify-center py-16">
            <mat-spinner diameter="40" />
          </div>
        } @else if (errorMessage()) {
          <div class="lms-card text-center py-12">
            <mat-icon class="text-red-400 mb-3">error_outline</mat-icon>
            <p class="text-red-600">{{ errorMessage() }}</p>
          </div>
        } @else if (summary().length === 0) {
          <div class="lms-card text-center py-12">
            <mat-icon class="text-slate-300 mb-3">event_available</mat-icon>
            <p class="text-slate-500">No attendance records found.</p>
          </div>
        } @else {
          <div class="space-y-3">
            @for (s of summary(); track s.courseId) {
              <div class="lms-card">
                <div class="flex items-center justify-between gap-4 flex-wrap">
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-800 truncate">{{ s.courseName }}</p>
                    <p class="text-sm text-slate-500 mt-0.5">
                      {{ s.attendedSessions }} / {{ s.totalSessions }} sessions attended
                    </p>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    @if (s.belowWarningThreshold) {
                      <mat-icon class="text-red-500" title="Below attendance threshold">warning</mat-icon>
                    }
                    <span [class]="percentageCss(s)">
                      {{ s.attendancePercentage | number:'1.0-0' }}%
                    </span>
                  </div>
                </div>
                <!-- Attendance bar -->
                <div class="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    [class]="barCss(s)"
                    [style.width.%]="s.attendancePercentage">
                  </div>
                </div>
              </div>
            }
          </div>
        }

      } @else {

        <!-- ── Lecturer / Admin view ── -->
        <div class="lms-card mb-6">
          <h2 class="font-semibold text-slate-700 mb-4">Select Session</h2>

          @if (sessionsLoading()) {
            <div class="flex justify-center py-6">
              <mat-spinner diameter="32" />
            </div>
          } @else if (sessionsError()) {
            <p class="text-red-600 text-sm">{{ sessionsError() }}</p>
          } @else {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Timetable Session</mat-label>
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
              <mat-icon class="text-red-400 mb-3">error_outline</mat-icon>
              <p class="text-red-600">{{ errorMessage() }}</p>
            </div>
          } @else if (markableRecords().length === 0) {
            <div class="lms-card text-center py-12">
              <mat-icon class="text-slate-300 mb-3">people</mat-icon>
              <p class="text-slate-500">No students enrolled in this session.</p>
            </div>
          } @else {
            <div class="lms-card">
              <h2 class="font-semibold text-slate-700 mb-4">Mark Attendance</h2>

              <div class="space-y-4">
                @for (rec of markableRecords(); track rec.studentId; let i = $index) {
                  <div class="flex items-center gap-4 flex-wrap border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <p class="font-medium text-slate-800 w-48 shrink-0">{{ rec.studentName }}</p>
                    <mat-radio-group
                      [(ngModel)]="markableRecords()[i].status"
                      class="flex gap-4 flex-wrap">
                      @for (opt of statusOptions; track opt) {
                        <mat-radio-button [value]="opt">{{ opt }}</mat-radio-button>
                      }
                    </mat-radio-group>
                  </div>
                }
              </div>

              <div class="mt-6 flex items-center justify-between flex-wrap gap-3">
                @if (submitError()) {
                  <p class="text-red-600 text-sm">{{ submitError() }}</p>
                } @else if (submitSuccess()) {
                  <p class="text-green-600 text-sm flex items-center gap-1">
                    <mat-icon class="text-base leading-none">check_circle</mat-icon>
                    Attendance saved.
                  </p>
                } @else {
                  <span></span>
                }
                <button
                  mat-flat-button
                  color="primary"
                  [disabled]="isSubmitting()"
                  (click)="submitAttendance()">
                  @if (isSubmitting()) {
                    <mat-spinner diameter="18" class="inline-block mr-2" />
                  }
                  Save Attendance
                </button>
              </div>
            </div>
          }
        }

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

  readonly statusOptions: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];
  readonly userRole = this.authService.userRole;

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
