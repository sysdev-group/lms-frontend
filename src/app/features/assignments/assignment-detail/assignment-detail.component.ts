import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { AssignmentService } from '@core/services/assignment.service';
import { SubmissionService } from '@core/services/submission.service';
import { GradeService } from '@core/services/grade.service';
import { AuthService } from '@core/auth/auth.service';
import { Assignment, Grade, Submission } from '@shared/models/models';

interface DeadlineInfo {
  readonly label: string;
  readonly css: string;
  readonly pillCss: string;
  readonly isPast: boolean;
}

interface SubmissionRow extends Submission {
  gradeId: string | null;
  readonly gradeForm: FormGroup;
}

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
  ],
  template: `
    <div class="page-container max-w-3xl mx-auto">

      <!-- Breadcrumb -->
      <a routerLink="/assignments"
        class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer no-underline">
        <mat-icon style="font-size:18px;width:18px;height:18px;line-height:1">arrow_back</mat-icon>
        Back to Assignments
      </a>

      <!-- ── Loading skeleton ──────────────────────────────────────── -->
      @if (isLoading()) {
        <div class="lms-card relative overflow-hidden animate-pulse mb-4">
          <div class="absolute inset-y-0 left-0 w-1 bg-slate-200"></div>
          <div class="pl-3 space-y-3">
            <div class="h-6 w-2/3 bg-slate-200 rounded"></div>
            <div class="h-4 w-1/3 bg-slate-100 rounded"></div>
            <div class="h-4 w-full bg-slate-100 rounded mt-2"></div>
            <div class="h-4 w-4/5 bg-slate-100 rounded"></div>
          </div>
        </div>
        <div class="lms-card animate-pulse">
          <div class="h-4 w-1/4 bg-slate-200 rounded mb-4"></div>
          <div class="h-32 bg-slate-100 rounded-xl"></div>
        </div>

      <!-- ── Error ──────────────────────────────────────────────────── -->
      } @else if (error()) {
        <div class="lms-card text-center py-16">
          <mat-icon class="text-slate-200 mb-3" style="font-size:56px;width:56px;height:56px">
            error_outline
          </mat-icon>
          <p class="text-red-600 font-medium">{{ error() }}</p>
        </div>

      } @else if (!assignment()) {
        <div class="lms-card text-center py-16">
          <mat-icon class="text-slate-200 mb-3" style="font-size:56px;width:56px;height:56px">
            assignment
          </mat-icon>
          <p class="text-slate-500">Assignment not found.</p>
        </div>

      } @else {

        <!-- ── Header card ──────────────────────────────────────────── -->
        <div class="lms-card relative overflow-hidden mb-4">
          <div class="absolute inset-y-0 left-0 w-1 bg-primary-600"></div>
          <div class="pl-3">
            <div class="flex items-start justify-between gap-4 mb-3">
              <h1 class="font-display text-2xl font-bold text-slate-900 leading-snug">
                {{ assignment()!.title }}
              </h1>
              <!-- Status badge top-right -->
              @if (deadlineInfo()!.isPast) {
                <span class="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Closed
                </span>
              } @else {
                <span class="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Active
                </span>
              }
            </div>

            <div class="flex items-center gap-1 text-sm text-slate-500 mb-3">
              <mat-icon style="font-size:14px;width:14px;height:14px;line-height:1">book</mat-icon>
              {{ assignment()!.courseName }}
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <span [class]="deadlineInfo()!.pillCss">
                <mat-icon style="font-size:11px;width:11px;height:11px;line-height:1;margin-right:3px">schedule</mat-icon>
                {{ deadlineInfo()!.label }}
              </span>
              <span class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                <mat-icon style="font-size:11px;width:11px;height:11px;line-height:1">grade</mat-icon>
                Max {{ assignment()!.maxMarks }} marks
              </span>
            </div>
          </div>
        </div>

        <!-- ── Description card ─────────────────────────────────────── -->
        @if (assignment()!.description) {
          <div class="lms-card mb-4">
            <h2 class="font-display font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">
              Description
            </h2>
            <p class="text-slate-700 leading-relaxed">{{ assignment()!.description }}</p>
          </div>
        }

        <!-- ════════════════════════════════════════════════════════════
             Student view
             ════════════════════════════════════════════════════════════ -->
        @if (userRole() === 'Student') {

          <!-- Graded state -->
          @if (myGrade() && myGrade()!.isPublished) {
            <div class="lms-card text-center py-8 mb-4">
              <p class="font-display text-5xl font-bold text-slate-900">
                {{ myGrade()!.marksAwarded }}
                <span class="text-2xl text-slate-400 font-normal">/ {{ assignment()!.maxMarks }}</span>
              </p>
              <span [class]="gradePercentageCss(pct(myGrade()!, assignment()!.maxMarks))">
                {{ pct(myGrade()!, assignment()!.maxMarks) }}%
              </span>
              @if (myGrade()!.letterGrade) {
                <p class="mt-2 font-display text-xl font-semibold text-primary-600">
                  {{ myGrade()!.letterGrade }}
                </p>
              }
            </div>

            <mat-expansion-panel class="mb-4 rounded-xl shadow-sm border border-slate-200 !overflow-hidden">
              <mat-expansion-panel-header>
                <mat-panel-title class="font-semibold text-slate-700">
                  <mat-icon class="mr-2 text-slate-400">feedback</mat-icon>
                  Lecturer Feedback
                </mat-panel-title>
              </mat-expansion-panel-header>
              @if (myGrade()!.feedback) {
                <p class="text-slate-600 leading-relaxed">{{ myGrade()!.feedback }}</p>
              } @else {
                <p class="text-slate-400 italic">No feedback provided.</p>
              }
            </mat-expansion-panel>

            <!-- View submission file -->
            @if (mySubmission()) {
              <div class="lms-card bg-blue-50 border border-blue-200 flex items-center gap-3">
                <mat-icon class="text-blue-500 shrink-0">check_circle</mat-icon>
                <div class="flex-1 min-w-0">
                  @if (mySubmission()!.fileName) {
                    <p class="font-semibold text-slate-800 truncate">{{ mySubmission()!.fileName }}</p>
                  }
                  <p class="text-xs text-slate-500 mt-0.5">
                    Submitted {{ mySubmission()!.submittedAt | date:'mediumDate' }}
                    @if (mySubmission()!.isLate) {
                      &nbsp;·&nbsp;
                      <span class="text-red-600 font-medium">Late</span>
                    }
                  </p>
                </div>
                <button mat-stroked-button class="min-h-[44px] shrink-0">View File</button>
              </div>
            }

          <!-- Submitted but not yet graded -->
          } @else if (mySubmission()) {

            <div class="lms-card">
              <h2 class="font-display font-semibold text-slate-700 mb-3">Your Submission</h2>

              <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 mb-4">
                <mat-icon class="text-blue-500 shrink-0">check_circle</mat-icon>
                <div class="flex-1 min-w-0">
                  @if (mySubmission()!.fileName) {
                    <p class="font-semibold text-slate-800 truncate">{{ mySubmission()!.fileName }}</p>
                  } @else {
                    <p class="font-semibold text-slate-800">Submission received</p>
                  }
                  <p class="text-xs text-slate-500 mt-0.5">
                    Submitted {{ mySubmission()!.submittedAt | date:'medium' }}
                    @if (mySubmission()!.isLate) {
                      &nbsp;·&nbsp;<span class="text-red-600 font-medium">Late</span>
                    }
                  </p>
                </div>
                <button mat-stroked-button class="min-h-[44px] shrink-0">View File</button>
              </div>

              @if (mySubmission()!.isGraded) {
                <p class="text-sm text-amber-600 flex items-center gap-1">
                  <mat-icon style="font-size:16px;width:16px;height:16px;line-height:1">hourglass_empty</mat-icon>
                  Grade is ready but not yet published by your lecturer.
                </p>
              } @else {
                <p class="text-sm text-slate-500 flex items-center gap-1">
                  <mat-icon style="font-size:16px;width:16px;height:16px;line-height:1">pending</mat-icon>
                  Not yet graded.
                </p>
              }
            </div>

          <!-- Not submitted -->
          } @else {
            <div class="lms-card">
              <h2 class="font-display font-semibold text-slate-700 mb-4">Submit Assignment</h2>

              @if (deadlineInfo()!.isPast) {
                <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-700">
                  <mat-icon class="shrink-0" style="font-size:18px;width:18px;height:18px;line-height:1.4">warning</mat-icon>
                  The deadline has passed. Submissions are no longer accepted.
                </div>
              }

              <!-- Upload zone -->
              <div class="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-6 mb-4">
                <div class="flex flex-col items-center text-center mb-4 pointer-events-none">
                  <mat-icon class="text-slate-300 mb-2" style="font-size:44px;width:44px;height:44px">cloud_upload</mat-icon>
                  <p class="text-slate-500 font-medium">Drop your file here or click to browse</p>
                  <p class="text-xs text-slate-400 mt-1">Accepted: PDF, DOC, DOCX, ZIP</p>
                </div>
                <form [formGroup]="submitForm" (ngSubmit)="submitAssignment()">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>File ID</mat-label>
                    <input matInput formControlName="fileId"
                      placeholder="Paste the file ID returned by the upload service" />
                    <mat-hint>Upload your file and paste the returned ID here.</mat-hint>
                  </mat-form-field>

                  @if (submitError()) {
                    <p class="text-sm text-red-600 mt-2">{{ submitError() }}</p>
                  }

                  <button mat-flat-button color="primary" type="submit"
                    class="w-full min-h-[44px] mt-4"
                    [disabled]="deadlineInfo()!.isPast || isSubmitting()">
                    @if (isSubmitting()) {
                      <mat-spinner diameter="18" class="inline-block mr-2"></mat-spinner>
                      Submitting…
                    } @else {
                      Submit Assignment
                    }
                  </button>
                </form>
              </div>
            </div>
          }

        <!-- ════════════════════════════════════════════════════════════
             Lecturer / Admin view
             ════════════════════════════════════════════════════════════ -->
        } @else if (userRole() === 'Lecturer' || userRole() === 'Admin') {

          <!-- Submission summary -->
          <div class="lms-card mb-4">
            <div class="flex items-baseline justify-between mb-2">
              <h2 class="font-display font-semibold text-slate-700">Submissions</h2>
              <span class="text-sm text-slate-500">
                {{ allSubmissions().length }} submitted
              </span>
            </div>
            <mat-progress-bar
              mode="determinate"
              [value]="allSubmissions().length > 0 ? 100 : 0"
              class="rounded-full h-2 mb-3">
            </mat-progress-bar>
            <div class="flex flex-wrap gap-4 text-xs text-slate-500">
              <span>
                <span class="font-semibold text-slate-700">{{ gradedCount() }}</span> graded
              </span>
              <span>
                <span class="font-semibold text-slate-700">{{ publishedCount() }}</span> published
              </span>
              <span>
                <span class="font-semibold text-slate-700">{{ allSubmissions().length - gradedCount() }}</span> awaiting grade
              </span>
            </div>
          </div>

          <!-- Submission cards -->
          @if (allSubmissions().length === 0) {
            <div class="lms-card text-center py-12">
              <mat-icon class="text-slate-200 mb-3" style="font-size:56px;width:56px;height:56px">inbox</mat-icon>
              <p class="text-slate-500 font-medium">No submissions yet</p>
              <p class="text-sm text-slate-400 mt-1">Student submissions will appear here.</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (row of allSubmissions(); track row.id) {
                <div class="lms-card relative overflow-hidden">
                  <div class="absolute inset-y-0 left-0 w-1 bg-primary-600"></div>
                  <div class="pl-3">

                    <!-- Student info row -->
                    <div class="flex items-start gap-3 mb-3">
                      <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
                        {{ row.studentName.charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                          <p class="font-semibold text-slate-800">{{ row.studentName }}</p>
                          @if (row.isGraded) {
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Graded
                            </span>
                          } @else {
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Not graded
                            </span>
                          }
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">
                          Submitted {{ row.submittedAt | date:'mediumDate' }}
                          @if (row.isLate) {
                            &nbsp;·&nbsp;<span class="text-red-600 font-medium">Late</span>
                          }
                        </p>
                      </div>
                    </div>

                    <!-- File -->
                    @if (row.fileName) {
                      <div class="flex items-center gap-1 text-sm text-slate-600 mb-3">
                        <mat-icon style="font-size:14px;width:14px;height:14px;line-height:1">attach_file</mat-icon>
                        <span class="underline cursor-pointer hover:text-primary-600 transition-colors">
                          {{ row.fileName }}
                        </span>
                      </div>
                    }

                    <!-- Grade form -->
                    <div [formGroup]="row.gradeForm" class="flex flex-wrap items-end gap-2">
                      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-24 shrink-0">
                        <mat-label>Mark</mat-label>
                        <input matInput type="number" formControlName="marks"
                          min="0" [max]="assignment()!.maxMarks" />
                      </mat-form-field>

                      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1 min-w-[160px]">
                        <mat-label>Feedback</mat-label>
                        <input matInput formControlName="feedback" placeholder="Optional feedback" />
                      </mat-form-field>

                      <button mat-flat-button color="primary" class="min-h-[44px]"
                        [disabled]="row.gradeForm.invalid || savingIds().has(row.id)"
                        (click)="saveGrade(row)">
                        @if (savingIds().has(row.id)) {
                          <mat-spinner diameter="16" class="inline-block mr-1"></mat-spinner>
                        }
                        {{ row.isGraded ? 'Re-grade' : 'Save' }}
                      </button>

                      @if (row.gradeId) {
                        <button mat-stroked-button color="accent" class="min-h-[44px]"
                          [disabled]="savingIds().has(row.id)"
                          (click)="publishGrade(row.gradeId, row.id)">
                          @if (savingIds().has(row.id)) {
                            <mat-spinner diameter="16" class="inline-block mr-1"></mat-spinner>
                          }
                          Publish
                        </button>
                      }
                    </div>

                  </div>
                </div>
              }
            </div>

            <!-- Publish All Grades -->
            @if (hasPublishableGrades()) {
              <button mat-flat-button color="warn"
                class="w-full min-h-[44px] mt-6"
                (click)="publishAllGrades()">
                <mat-icon>publish</mat-icon>
                Publish All Grades
              </button>
            }
          }

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

  readonly gradedCount = computed(() => this.allSubmissions().filter(r => r.isGraded).length);
  readonly publishedCount = computed(() => this.allSubmissions().filter(r => r.gradeId !== null).length);
  readonly hasPublishableGrades = computed(() => this.allSubmissions().some(r => r.gradeId !== null));

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
      this.loadLecturerView();
    }
  }

  pct(grade: Grade, maxMarks: number): number {
    return Math.round((grade.marksAwarded / maxMarks) * 100);
  }

  gradePercentageCss(percentage: number): string {
    const base = 'mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold font-display ';
    if (percentage >= 70) return base + 'bg-green-100 text-green-700';
    if (percentage >= 60) return base + 'bg-blue-100 text-blue-700';
    if (percentage >= 40) return base + 'bg-amber-100 text-amber-700';
    return base + 'bg-red-100 text-red-700';
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

  publishAllGrades(): void {
    this.allSubmissions()
      .filter(r => r.gradeId != null && !this.savingIds().has(r.id))
      .forEach(r => this.publishGrade(r.gradeId!, r.id));
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
    this.assignmentService.getAssignmentById(this.assignmentId).pipe(
      switchMap(assignment => {
        const grades$ = assignment.courseId
          ? this.gradeService.getGradesByCourse(assignment.courseId)
              .pipe(catchError(() => of<Grade[]>([])))
          : of<Grade[]>([]);
        return forkJoin({
          assignment: of(assignment),
          submissions: this.submissionService.getByAssignment(this.assignmentId),
          grades: grades$,
        });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ assignment, submissions, grades }) => {
        this.assignment.set(assignment);
        this.deadlineInfo.set(this.buildDeadlineInfo(assignment.deadline));
        const gradeMap = new Map<string, string>(
          grades
            .filter((g): g is Grade & { studentId: string } =>
              g.studentId !== undefined && g.assignmentTitle === assignment.title)
            .map(g => [g.studentId, g.id]),
        );
        this.allSubmissions.set(
          submissions.map(s =>
            this.toSubmissionRow(
              s,
              assignment.maxMarks,
              s.studentId ? (gradeMap.get(s.studentId) ?? null) : null,
            )
          )
        );
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load assignment.');
        this.isLoading.set(false);
      },
    });
  }

  private toSubmissionRow(s: Submission, maxMarks: number, gradeId: string | null = null): SubmissionRow {
    return {
      ...s,
      gradeId,
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
    const pill = 'inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ';

    if (diff < 0)  return { label: `Overdue by ${days(abs)}`, css: 'text-sm font-medium text-red-600',    pillCss: pill + 'bg-red-50 text-red-600',    isPast: true  };
    if (diff === 0) return { label: 'Due today',               css: 'text-sm font-medium text-orange-500', pillCss: pill + 'bg-amber-50 text-amber-600', isPast: false };
    if (diff <= 2)  return { label: `${days(diff)} left`,      css: 'text-sm font-medium text-amber-600',  pillCss: pill + 'bg-amber-50 text-amber-600', isPast: false };
    return             { label: `${days(diff)} left`,          css: 'text-sm font-medium text-green-600',  pillCss: pill + 'bg-green-50 text-green-600', isPast: false };
  }

  private removeSavingId(id: string): void {
    this.savingIds.update(ids => { const next = new Set(ids); next.delete(id); return next; });
  }
}
