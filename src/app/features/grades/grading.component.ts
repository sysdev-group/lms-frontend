import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AssignmentService } from '@core/services/assignment.service';
import { SubmissionService } from '@core/services/submission.service';
import { GradeService } from '@core/services/grade.service';
import { Assignment, Grade, Submission } from '@shared/models/models';

type StatusFilter = 'all' | 'ungraded' | 'graded' | 'published';

interface SubmissionRow extends Submission {
  gradeId: string | null;
  readonly gradeForm: FormGroup;
}

@Component({
  selector: 'app-grading',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <div>

      <!-- Page header -->
      <div class="mb-6">
        <h1 class="font-display text-2xl font-bold text-slate-800">Grade Submissions</h1>
        @if (selectedAssignment()) {
          <p class="text-sm text-slate-500 mt-1">
            {{ selectedAssignment()!.title }}
            @if (selectedAssignment()!.courseName) {
              · {{ selectedAssignment()!.courseName }}
            }
          </p>
        } @else {
          <p class="text-sm text-slate-500 mt-1">Select an assignment to start grading</p>
        }
      </div>

      <!-- ── Loading skeleton: assignments ────────────────────────────── -->
      @if (isLoadingAssignments()) {
        <div class="lms-card mb-4 animate-pulse">
          <div class="h-10 w-full bg-slate-200 rounded"></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2 space-y-3">
            @for (c of [1,2,3,4]; track c) {
              <div class="lms-card relative overflow-hidden animate-pulse">
                <div class="absolute inset-y-0 left-0 w-1 bg-slate-200"></div>
                <div class="pl-3 space-y-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-4 w-1/2 bg-slate-200 rounded"></div>
                      <div class="h-3 w-1/3 bg-slate-100 rounded"></div>
                    </div>
                    <div class="h-5 w-20 bg-slate-100 rounded-full"></div>
                  </div>
                </div>
              </div>
            }
          </div>
          <div class="lms-card animate-pulse space-y-3">
            <div class="h-5 w-3/4 bg-slate-200 rounded"></div>
            <div class="h-4 w-1/2 bg-slate-100 rounded"></div>
            <div class="h-2 w-full bg-slate-100 rounded-full"></div>
          </div>
        </div>

      <!-- ── Error ─────────────────────────────────────────────────────── -->
      } @else if (error()) {
        <div class="lms-card text-center py-16">
          <mat-icon class="text-slate-200 mb-3" style="font-size:56px;width:56px;height:56px">
            error_outline
          </mat-icon>
          <p class="text-red-600 font-medium">{{ error() }}</p>
        </div>

      <!-- ── No assignments ─────────────────────────────────────────────── -->
      } @else if (assignments().length === 0) {
        <div class="lms-card text-center py-16">
          <mat-icon class="text-slate-200 mb-3" style="font-size:56px;width:56px;height:56px">
            assignment
          </mat-icon>
          <p class="font-semibold text-slate-600 mb-1">No assignments found</p>
          <p class="text-sm text-slate-400">Create an assignment first to start grading submissions.</p>
        </div>

      } @else {

        <!-- ── Filter bar ─────────────────────────────────────────────── -->
        <div class="flex flex-wrap items-center gap-3 mb-5">

          <!-- Assignment selector -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-[220px] shrink-0">
            <mat-label>Assignment</mat-label>
            <mat-select
              [value]="selectedAssignmentId()"
              (selectionChange)="onAssignmentChange($event.value)">
              @for (a of assignments(); track a.id) {
                <mat-option [value]="a.id">{{ a.title }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Status filter -->
          <mat-button-toggle-group
            [value]="statusFilter()"
            (change)="statusFilter.set($event.value)"
            aria-label="Filter by status">
            <mat-button-toggle value="all" class="min-h-[44px]">All</mat-button-toggle>
            <mat-button-toggle value="ungraded" class="min-h-[44px]">Ungraded</mat-button-toggle>
            <mat-button-toggle value="graded" class="min-h-[44px]">Graded</mat-button-toggle>
            <mat-button-toggle value="published" class="min-h-[44px]">Published</mat-button-toggle>
          </mat-button-toggle-group>

          <!-- Summary count -->
          @if (!isLoadingSubmissions()) {
            <span class="text-sm text-slate-500 ml-auto">
              <span class="font-semibold text-slate-700">{{ ungradedCount() }}</span>
              ungraded of
              <span class="font-semibold text-slate-700">{{ submissions().length }}</span>
              total
            </span>
          }

        </div>

        <!-- ── Two-column layout ──────────────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">

          <!-- Left: submission list (2/3) -->
          <div class="lg:col-span-2">

            <!-- Submissions loading skeleton -->
            @if (isLoadingSubmissions()) {
              <div class="space-y-3">
                @for (c of [1,2,3]; track c) {
                  <div class="lms-card relative overflow-hidden animate-pulse">
                    <div class="absolute inset-y-0 left-0 w-1 bg-primary-600 opacity-30"></div>
                    <div class="pl-3 space-y-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                        <div class="flex-1 space-y-2">
                          <div class="h-4 w-1/2 bg-slate-200 rounded"></div>
                          <div class="h-3 w-1/3 bg-slate-100 rounded"></div>
                        </div>
                        <div class="h-5 w-20 bg-slate-100 rounded-full"></div>
                      </div>
                      <div class="h-10 w-24 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                }
              </div>

            <!-- No submissions empty state -->
            } @else if (submissions().length === 0) {
              <div class="lms-card text-center py-12">
                <mat-icon class="text-slate-200 mb-3" style="font-size:56px;width:56px;height:56px">
                  inbox
                </mat-icon>
                <p class="font-semibold text-slate-600 mb-1">No submissions yet</p>
                <p class="text-sm text-slate-400">
                  Students haven't submitted this assignment yet.
                </p>
              </div>

            <!-- Filter empty -->
            } @else if (filteredSubmissions().length === 0) {
              <div class="lms-card text-center py-10">
                <mat-icon class="text-slate-200 mb-2" style="font-size:40px;width:40px;height:40px">
                  filter_list_off
                </mat-icon>
                <p class="text-slate-500 text-sm">No submissions match this filter</p>
                <button mat-stroked-button class="min-h-[44px] mt-3"
                  (click)="statusFilter.set('all')">
                  Show All
                </button>
              </div>

            } @else {

              <div class="space-y-3">
                @for (row of filteredSubmissions(); track row.id) {

                  <div class="lms-card relative overflow-hidden hover:shadow-md transition-shadow">
                    <div class="absolute inset-y-0 left-0 w-1 bg-primary-600"></div>
                    <div class="pl-3">

                      <!-- Student info row -->
                      <div class="flex items-start gap-3 mb-3">
                        <!-- Avatar -->
                        <div class="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-sm shrink-0 select-none">
                          {{ row.studentName.charAt(0).toUpperCase() }}
                        </div>

                        <!-- Name + time -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-2 flex-wrap">
                            <p class="font-semibold text-slate-800">{{ row.studentName }}</p>

                            <!-- Status badge -->
                            @if (row.gradeId !== null) {
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Published
                              </span>
                            } @else if (row.isGraded) {
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Graded
                              </span>
                            } @else {
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                Ungraded
                              </span>
                            }
                          </div>

                          <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <mat-icon style="font-size:12px;width:12px;height:12px;line-height:1">schedule</mat-icon>
                            {{ row.submittedAt | date:'mediumDate' }}
                            @if (row.isLate) {
                              &nbsp;·&nbsp;<span class="text-red-600 font-medium">Late</span>
                            }
                          </p>
                        </div>
                      </div>

                      <!-- File attachment -->
                      @if (row.fileName) {
                        <div class="flex items-center gap-1.5 text-sm text-slate-600 mb-3 cursor-pointer hover:text-primary-600 transition-colors w-fit">
                          <mat-icon style="font-size:14px;width:14px;height:14px;line-height:1">attach_file</mat-icon>
                          <span class="underline underline-offset-2">{{ row.fileName }}</span>
                        </div>
                      }

                      <!-- Grade button (expands inline panel) -->
                      <button mat-stroked-button class="min-h-[44px]"
                        (click)="toggleExpand(row.id)">
                        <mat-icon>{{ expandedId() === row.id ? 'expand_less' : 'edit' }}</mat-icon>
                        {{ expandedId() === row.id ? 'Close' : (row.isGraded ? 'Re-grade' : 'Grade') }}
                      </button>

                      <!-- Inline grading panel -->
                      @if (expandedId() === row.id) {
                        <div [formGroup]="row.gradeForm"
                          class="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">

                          <!-- Grade input -->
                          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                            <mat-label>Grade</mat-label>
                            <input matInput type="number" formControlName="marks"
                              min="0"
                              [max]="selectedAssignment()?.maxMarks ?? 9999"
                              placeholder="0" />
                            <mat-hint>
                              Out of {{ selectedAssignment()?.maxMarks ?? '—' }} marks
                            </mat-hint>
                          </mat-form-field>

                          <!-- Feedback textarea -->
                          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                            <mat-label>Feedback for student…</mat-label>
                            <textarea matInput formControlName="feedback" rows="3"></textarea>
                          </mat-form-field>

                          <!-- Actions -->
                          <div class="flex items-center gap-2 flex-wrap pt-1">
                            <button mat-flat-button color="primary" class="min-h-[44px]"
                              [disabled]="row.gradeForm.invalid || savingIds().has(row.id)"
                              (click)="saveGrade(row)">
                              Save Grade
                            </button>

                            @if (row.gradeId !== null) {
                              <button mat-stroked-button class="min-h-[44px]"
                                [disabled]="savingIds().has(row.id)"
                                (click)="publishGrade(row.gradeId!, row.id)">
                                Publish Grade
                              </button>
                            }
                          </div>

                        </div>
                      }

                    </div>
                  </div>

                }
              </div>

              <!-- Publish All Grades -->
              @if (allGraded() && publishedCount() < submissions().length) {
                <button mat-flat-button color="warn"
                  class="w-full min-h-[44px] mt-6"
                  (click)="publishAllGrades()">
                  <mat-icon>publish</mat-icon>
                  Publish All Grades
                </button>
              }

            }
          </div>

          <!-- Right: summary sidebar (1/3) -->
          <div class="space-y-4">

            @if (selectedAssignment()) {
              <div class="lms-card sticky top-4">

                <!-- Assignment title & module -->
                <h2 class="font-display font-semibold text-slate-800 leading-snug mb-1">
                  {{ selectedAssignment()!.title }}
                </h2>
                @if (selectedAssignment()!.courseName) {
                  <p class="text-sm text-slate-500 mb-3">{{ selectedAssignment()!.courseName }}</p>
                }

                <!-- Due date -->
                <p class="text-xs flex items-center gap-1 mb-4"
                  [class]="deadlineUrgencyCss(selectedAssignment()!.deadline)">
                  <mat-icon style="font-size:14px;width:14px;height:14px;line-height:1">event</mat-icon>
                  Due {{ selectedAssignment()!.deadline | date:'mediumDate' }}
                </p>

                <div class="border-t border-slate-100 pt-4 space-y-2">

                  <!-- Stats -->
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">Total submissions</span>
                    <span class="font-semibold text-slate-800">{{ submissions().length }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">Graded</span>
                    <span class="font-semibold text-slate-800">{{ gradedCount() }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">Published</span>
                    <span class="font-semibold text-slate-800">{{ publishedCount() }}</span>
                  </div>

                  <!-- Progress bar -->
                  @if (submissions().length > 0) {
                    <mat-progress-bar
                      mode="determinate"
                      color="primary"
                      [value]="(gradedCount() / submissions().length) * 100"
                      class="!rounded-full mt-2">
                    </mat-progress-bar>
                    <p class="text-xs text-slate-400 text-right">
                      {{ gradedCount() }} / {{ submissions().length }} graded
                    </p>
                  }

                </div>

                <!-- Max marks -->
                <div class="mt-3 pt-3 border-t border-slate-100">
                  <span class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono">
                    <mat-icon style="font-size:12px;width:12px;height:12px;line-height:1">grade</mat-icon>
                    Max {{ selectedAssignment()!.maxMarks }} marks
                  </span>
                </div>

              </div>
            }

          </div>

        </div>

      }
    </div>
  `,
})
export class GradingComponent implements OnInit {
  isLoadingAssignments = signal(true);
  isLoadingSubmissions = signal(false);
  assignments = signal<Assignment[]>([]);
  selectedAssignmentId = signal<string>('');
  submissions = signal<SubmissionRow[]>([]);
  statusFilter = signal<StatusFilter>('all');
  expandedId = signal<string | null>(null);
  savingIds = signal<ReadonlySet<string>>(new Set());
  error = signal<string | null>(null);

  readonly selectedAssignment = computed(() =>
    this.assignments().find(a => a.id === this.selectedAssignmentId()) ?? null
  );
  readonly gradedCount = computed(() =>
    this.submissions().filter(r => r.isGraded).length
  );
  readonly publishedCount = computed(() =>
    this.submissions().filter(r => r.gradeId !== null).length
  );
  readonly ungradedCount = computed(() =>
    this.submissions().filter(r => !r.isGraded).length
  );
  readonly allGraded = computed(() =>
    this.submissions().length > 0 && this.ungradedCount() === 0
  );
  readonly filteredSubmissions = computed(() => {
    const f = this.statusFilter();
    const subs = this.submissions();
    if (f === 'ungraded')  return subs.filter(r => !r.isGraded);
    if (f === 'graded')    return subs.filter(r => r.isGraded && r.gradeId === null);
    if (f === 'published') return subs.filter(r => r.gradeId !== null);
    return subs;
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private submissionService: SubmissionService,
    private gradeService: GradeService,
  ) {}

  ngOnInit(): void {
    this.assignmentService.getAssignments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: assignments => {
          this.assignments.set(assignments);
          this.isLoadingAssignments.set(false);
          if (assignments.length > 0) {
            this.selectedAssignmentId.set(assignments[0].id);
            this.loadSubmissions(assignments[0].id);
          }
        },
        error: err => {
          this.error.set(err?.error?.message ?? 'Failed to load assignments.');
          this.isLoadingAssignments.set(false);
        },
      });
  }

  onAssignmentChange(id: string): void {
    this.selectedAssignmentId.set(id);
    this.expandedId.set(null);
    this.statusFilter.set('all');
    this.loadSubmissions(id);
  }

  toggleExpand(id: string): void {
    this.expandedId.update(current => (current === id ? null : id));
  }

  saveGrade(row: SubmissionRow): void {
    if (row.gradeForm.invalid || this.savingIds().has(row.id)) return;
    this.savingIds.update(ids => new Set([...ids, row.id]));
    this.gradeService.gradeSubmission(row.id, {
      marksAwarded: row.gradeForm.value.marks,
      feedback: row.gradeForm.value.feedback || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: grade => {
          this.submissions.update(rows =>
            rows.map(r => r.id === row.id ? { ...r, isGraded: true, gradeId: grade.id } : r)
          );
          this.removeSavingId(row.id);
          this.snackBar.open('Grade saved.', 'OK', { duration: 3000 });
        },
        error: () => {
          this.removeSavingId(row.id);
          this.snackBar.open('Failed to save grade.', 'Dismiss', { duration: 4000 });
        },
      });
  }

  publishGrade(gradeId: string, submissionId: string): void {
    if (this.savingIds().has(submissionId)) return;
    this.savingIds.update(ids => new Set([...ids, submissionId]));
    this.gradeService.publishGrade(gradeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.removeSavingId(submissionId);
          this.snackBar.open('Grade published.', 'OK', { duration: 3000 });
        },
        error: () => {
          this.removeSavingId(submissionId);
          this.snackBar.open('Failed to publish grade.', 'Dismiss', { duration: 4000 });
        },
      });
  }

  publishAllGrades(): void {
    this.submissions()
      .filter(r => r.gradeId != null && !this.savingIds().has(r.id))
      .forEach(r => this.publishGrade(r.gradeId!, r.id));
  }

  deadlineUrgencyCss(deadline: string): string {
    const date = new Date(deadline);
    const now = new Date();
    if (date < now) return 'text-red-600 font-medium';
    if (date.getTime() - now.getTime() < 86_400_000) return 'text-amber-600 font-medium';
    return 'text-slate-600';
  }

  private loadSubmissions(assignmentId: string): void {
    this.isLoadingSubmissions.set(true);
    const assignment = this.selectedAssignment();
    const grades$ = assignment?.courseId
      ? this.gradeService.getGradesByCourse(assignment.courseId)
          .pipe(catchError(() => of<Grade[]>([])))
      : of<Grade[]>([]);

    forkJoin({
      submissions: this.submissionService.getByAssignment(assignmentId),
      grades: grades$,
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ submissions, grades }) => {
          const title = this.selectedAssignment()?.title ?? '';
          const gradeMap = new Map<string, string>(
            grades
              .filter((g): g is Grade & { studentId: string } =>
                g.studentId !== undefined && g.assignmentTitle === title)
              .map(g => [g.studentId, g.id])
          );
          const maxMarks = this.selectedAssignment()?.maxMarks ?? 9999;
          this.submissions.set(
            submissions.map(s => ({
              ...s,
              gradeId: gradeMap.get(s.studentId ?? '') ?? null,
              gradeForm: this.fb.group({
                marks: [
                  null as number | null,
                  [Validators.required, Validators.min(0), Validators.max(maxMarks)],
                ],
                feedback: [''],
              }),
            }))
          );
          this.isLoadingSubmissions.set(false);
        },
        error: err => {
          this.error.set(err?.error?.message ?? 'Failed to load submissions.');
          this.isLoadingSubmissions.set(false);
        },
      });
  }

  private removeSavingId(id: string): void {
    this.savingIds.update(ids => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }
}
