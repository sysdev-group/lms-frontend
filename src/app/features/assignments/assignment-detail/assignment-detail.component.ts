import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AssignmentService } from '@core/services/assignment.service';
import { SubmissionService } from '@core/services/submission.service';
import { GradeService } from '@core/services/grade.service';
import { AuthService } from '@core/auth/auth.service';
import { Assignment, Grade, Submission } from '@shared/models/models';

interface DeadlineInfo {
  readonly label: string;
  readonly css: string;
  readonly isPast: boolean;
}

interface SubmissionRow extends Submission {
  gradeId: string | null;
  readonly gradeForm: FormGroup;
}

/**
 * Assignment detail page — Section 7.5 + 7.6.
 * Students see their submission status, grade (when published), and a submit form.
 * Lecturers see all submissions with inline grading controls.
 */
@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatProgressSpinnerModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <div class="page-container">

      @if (isLoading()) {
        <div class="flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>

      } @else if (error()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-red-400 mb-3">error_outline</mat-icon>
          <p class="text-red-600">{{ error() }}</p>
        </div>

      } @else if (!assignment()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-slate-300 mb-3">assignment</mat-icon>
          <p class="text-slate-500">Assignment not found.</p>
        </div>

      } @else {

        <!-- Assignment header (all roles) -->
        <div class="lms-card mb-6">
          <div class="flex items-start justify-between gap-6">
            <div class="min-w-0 flex-1">
              <h1 class="section-title">{{ assignment()!.title }}</h1>
              <p class="text-sm text-slate-500 -mt-3 mb-4">{{ assignment()!.courseName }}</p>
              @if (assignment()!.description) {
                <p class="text-slate-700 leading-relaxed">{{ assignment()!.description }}</p>
              }
            </div>
            <div class="shrink-0 text-right space-y-1">
              <p [class]="deadlineInfo()!.css">
                {{ deadlineInfo()!.label }}
              </p>
              <p class="text-xs text-slate-500">Max marks: {{ assignment()!.maxMarks }}</p>
            </div>
          </div>
        </div>

        <!-- ── Student view ───────────────────────────────────────────────── -->
        @if (userRole() === 'Student') {

          @if (mySubmission()) {

            <!-- Submitted state -->
            <div class="lms-card space-y-4">
              <h2 class="font-semibold text-slate-800">Your Submission</h2>

              <div class="flex flex-wrap gap-3 text-sm text-slate-700">
                <span>
                  Submitted
                  <span class="font-medium">{{ mySubmission()!.submittedAt | date:'medium' }}</span>
                </span>
                @if (mySubmission()!.isLate) {
                  <span class="badge badge-danger">Late</span>
                } @else {
                  <span class="badge badge-success">On time</span>
                }
                @if (mySubmission()!.fileName) {
                  <span class="text-slate-500">
                    <mat-icon class="text-sm align-middle mr-0.5">attach_file</mat-icon>
                    {{ mySubmission()!.fileName }}
                  </span>
                }
              </div>

              <!-- Grade section -->
              @if (myGrade() && myGrade()!.isPublished) {
                <div class="pt-4 border-t border-slate-100">
                  <h3 class="text-sm font-medium text-slate-600 mb-2">Grade</h3>
                  <p class="text-3xl font-bold text-slate-900">
                    {{ myGrade()!.marksAwarded }}
                    <span class="text-xl text-slate-400">/ {{ assignment()!.maxMarks }}</span>
                    @if (myGrade()!.letterGrade) {
                      <span class="ml-3 text-xl font-semibold text-primary-600">
                        {{ myGrade()!.letterGrade }}
                      </span>
                    }
                  </p>
                  @if (myGrade()!.feedback) {
                    <p class="mt-2 text-sm text-slate-600">
                      <span class="font-medium">Feedback:</span> {{ myGrade()!.feedback }}
                    </p>
                  }
                </div>
              } @else if (mySubmission()!.isGraded) {
                <p class="text-sm text-amber-600 pt-2 border-t border-slate-100">
                  <mat-icon class="text-sm align-middle mr-1">hourglass_empty</mat-icon>
                  Grade is ready but not yet published by your lecturer.
                </p>
              } @else {
                <p class="text-sm text-slate-500 pt-2 border-t border-slate-100">
                  <mat-icon class="text-sm align-middle mr-1">pending</mat-icon>
                  Not yet graded.
                </p>
              }
            </div>

          } @else {

            <!-- Submit form -->
            <div class="lms-card">
              <h2 class="font-semibold text-slate-800 mb-4">Submit Assignment</h2>

              @if (deadlineInfo()!.isPast) {
                <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-700">
                  <mat-icon class="shrink-0 text-base">warning</mat-icon>
                  The deadline has passed. Submissions are no longer accepted.
                </div>
              }

              <form [formGroup]="submitForm" (ngSubmit)="submitAssignment()" class="space-y-4">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>File ID (optional)</mat-label>
                  <input matInput formControlName="fileId"
                    placeholder="Paste the file ID returned by the upload service" />
                  <mat-hint>Upload your file separately and paste the returned ID here.</mat-hint>
                </mat-form-field>

                @if (submitError()) {
                  <p class="text-sm text-red-600">{{ submitError() }}</p>
                }

                <button mat-flat-button color="primary" type="submit"
                  [disabled]="deadlineInfo()!.isPast || isSubmitting()">
                  @if (isSubmitting()) {
                    <mat-spinner diameter="18" class="inline-block mr-2" />
                    Submitting…
                  } @else {
                    Submit Assignment
                  }
                </button>
              </form>
            </div>

          }

        <!-- ── Lecturer / Admin view ──────────────────────────────────────── -->
        } @else if (userRole() === 'Lecturer' || userRole() === 'Admin') {

          <div class="lms-card">
            <h2 class="font-semibold text-slate-800 mb-4">
              Submissions
              <span class="ml-2 text-sm font-normal text-slate-500">
                ({{ allSubmissions().length }})
              </span>
            </h2>

            @if (allSubmissions().length === 0) {
              <div class="text-center py-10">
                <mat-icon class="text-slate-300 mb-2">inbox</mat-icon>
                <p class="text-slate-500">No submissions yet.</p>
              </div>

            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr class="border-b border-slate-200">
                      <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Student
                      </th>
                      <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Submitted At
                      </th>
                      <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th class="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Grading
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (row of allSubmissions(); track row.id) {
                      <tr>
                        <td class="py-4 pr-4 font-medium text-slate-800">
                          {{ row.studentName }}
                        </td>
                        <td class="py-4 pr-4 text-slate-600">
                          {{ row.submittedAt | date:'medium' }}
                        </td>
                        <td class="py-4 pr-4">
                          @if (row.isLate) {
                            <span class="badge badge-danger">Late</span>
                          } @else {
                            <span class="badge badge-success">On time</span>
                          }
                        </td>
                        <td class="py-4">
                          <div [formGroup]="row.gradeForm" class="flex flex-wrap items-end gap-2">

                            @if (row.isGraded && !row.gradeId) {
                              <span class="badge badge-info mr-1">Graded</span>
                            }

                            <mat-form-field appearance="outline" subscriptSizing="dynamic"
                              class="w-24 shrink-0">
                              <mat-label>Mark</mat-label>
                              <input matInput type="number" formControlName="marks"
                                min="0" [max]="assignment()!.maxMarks" />
                            </mat-form-field>

                            <mat-form-field appearance="outline" subscriptSizing="dynamic"
                              class="flex-1 min-w-[160px]">
                              <mat-label>Feedback</mat-label>
                              <input matInput formControlName="feedback"
                                placeholder="Optional feedback" />
                            </mat-form-field>

                            <button mat-flat-button color="primary"
                              [disabled]="row.gradeForm.invalid || savingIds().has(row.id)"
                              (click)="saveGrade(row)">
                              @if (savingIds().has(row.id)) {
                                <mat-spinner diameter="16" class="inline-block mr-1" />
                              }
                              {{ row.isGraded ? 'Re-grade' : 'Save' }}
                            </button>

                            @if (row.gradeId) {
                              <button mat-stroked-button color="accent"
                                [disabled]="savingIds().has(row.id)"
                                (click)="publishGrade(row.gradeId, row.id)">
                                @if (savingIds().has(row.id)) {
                                  <mat-spinner diameter="16" class="inline-block mr-1" />
                                }
                                Publish
                              </button>
                            }

                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

        }
      }
    </div>
  `,
})
export class AssignmentDetailComponent implements OnInit {
  isLoading = signal(true);
  assignment = signal<Assignment | null>(null);
  mySubmission = signal<Submission | null>(null);
  allSubmissions = signal<SubmissionRow[]>([]);
  myGrade = signal<Grade | null>(null);
  error = signal<string | null>(null);
  deadlineInfo = signal<DeadlineInfo | null>(null);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  savingIds = signal<ReadonlySet<string>>(new Set());

  readonly userRole = this.authService.userRole;
  readonly submitForm: FormGroup;

  private readonly destroyRef = inject(DestroyRef);
  private assignmentId = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private submissionService: SubmissionService,
    private gradeService: GradeService,
    private authService: AuthService,
  ) {
    this.submitForm = this.fb.group({ fileId: [''] });
  }

  ngOnInit(): void {
    this.assignmentId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isLoading.set(true);
    if (this.authService.userRole() === 'Student') {
      this.loadStudentView();
    } else {
      // Lecturer and Admin both use the submission table view
      this.loadLecturerView();
    }
  }

  submitAssignment(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submissionService.submit({
      assignmentId: this.assignmentId,
      fileId: this.submitForm.value.fileId || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (submission) => {
          this.mySubmission.set(submission);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.submitError.set(err?.error?.message ?? 'Submission failed. Please try again.');
          this.isSubmitting.set(false);
        },
      });
  }

  saveGrade(row: SubmissionRow): void {
    if (row.gradeForm.invalid || this.savingIds().has(row.id)) return;
    this.savingIds.update(ids => new Set([...ids, row.id]));
    this.gradeService.gradeSubmission(row.id, {
      marksAwarded: row.gradeForm.value.marks,
      feedback: row.gradeForm.value.feedback || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (grade) => {
          this.allSubmissions.update(rows =>
            rows.map(r => r.id === row.id ? { ...r, isGraded: true, gradeId: grade.id } : r)
          );
          this.removeSavingId(row.id);
        },
        error: () => this.removeSavingId(row.id),
      });
  }

  publishGrade(gradeId: string, submissionId: string): void {
    if (this.savingIds().has(submissionId)) return;
    this.savingIds.update(ids => new Set([...ids, submissionId]));
    this.gradeService.publishGrade(gradeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.removeSavingId(submissionId),
        error: () => this.removeSavingId(submissionId),
      });
  }

  private loadStudentView(): void {
    forkJoin([
      this.assignmentService.getAssignmentById(this.assignmentId),
      this.submissionService.getMySubmissions(),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(([assignment, submissions]) => {
        this.assignment.set(assignment);
        this.deadlineInfo.set(this.buildDeadlineInfo(assignment.deadline));
        const mine = submissions.find(s => s.assignmentId === this.assignmentId) ?? null;
        this.mySubmission.set(mine);
        // Grade matched by title — Grade.assignmentId is not exposed by the API yet.
        return mine?.isGraded
          ? this.gradeService.getGradesByStudent('me').pipe(catchError(() => of(null)))
          : of(null);
      }),
    ).subscribe({
      next: (grades) => {
        if (grades) {
          const title = this.assignment()?.title;
          this.myGrade.set(grades.find(g => g.assignmentTitle === title) ?? null);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load assignment.');
        this.isLoading.set(false);
      },
    });
  }

  private loadLecturerView(): void {
    forkJoin([
      this.assignmentService.getAssignmentById(this.assignmentId),
      this.submissionService.getByAssignment(this.assignmentId),
    ]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([assignment, submissions]) => {
          this.assignment.set(assignment);
          this.deadlineInfo.set(this.buildDeadlineInfo(assignment.deadline));
          this.allSubmissions.set(submissions.map(s => this.toSubmissionRow(s, assignment.maxMarks)));
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load assignment.');
          this.isLoading.set(false);
        },
      });
  }

  private toSubmissionRow(s: Submission, maxMarks: number): SubmissionRow {
    return {
      ...s,
      gradeId: null,
      gradeForm: this.fb.group({
        marks: [null, [Validators.required, Validators.min(0), Validators.max(maxMarks)]],
        feedback: [''],
      }),
    };
  }

  private buildDeadlineInfo(deadline: string): DeadlineInfo {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(deadline);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const abs = Math.abs(diff);
    const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;
    if (diff < 0)  return { label: `Overdue by ${days(abs)}`, css: 'text-sm font-medium text-red-600',   isPast: true  };
    if (diff === 0) return { label: 'Due today',               css: 'text-sm font-medium text-orange-500', isPast: false };
    if (diff <= 3)  return { label: `${days(diff)} left`,       css: 'text-sm font-medium text-amber-600', isPast: false };
    return             { label: `${days(diff)} left`,           css: 'text-sm font-medium text-green-600', isPast: false };
  }

  private removeSavingId(id: string): void {
    this.savingIds.update(ids => { const next = new Set(ids); next.delete(id); return next; });
  }
}
