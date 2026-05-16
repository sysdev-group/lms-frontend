import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AssignmentService } from '@core/services/assignment.service';
import { SubmissionService } from '@core/services/submission.service';
import { AuthService } from '@core/auth/auth.service';
import { Assignment, Submission } from '@shared/models/models';
import { AssignmentCreateDialogComponent } from '../assignment-create-dialog/assignment-create-dialog.component';

interface AssignmentRow extends Assignment {
  readonly deadlineLabel: string;
  readonly deadlineCss: string;
  readonly deadlineBarCss: string;
  readonly deadlinePillCss: string;
  readonly isOverdue: boolean;
}

@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [
    RouterLink,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-container">

      <!-- Page header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display text-2xl font-bold text-slate-800">
          {{ userRole() === 'Student' ? 'My Assignments' : 'Assignments' }}
        </h1>
        @if (userRole() === 'Lecturer' || userRole() === 'Admin') {
          <button mat-flat-button color="primary" class="min-h-[44px]"
            (click)="openCreateDialog()">
            <mat-icon>add</mat-icon> Create Assignment
          </button>
        }
      </div>

      <!-- ── Loading skeleton ──────────────────────────────────────── -->
      @if (isLoading()) {
        @if (userRole() === 'Student') {
          @for (sec of [1,2,3]; track sec) {
            <div class="h-3.5 w-24 bg-slate-200 rounded animate-pulse mb-3 mt-6 first:mt-0"></div>
            @for (card of [1,2]; track card) {
              <div class="lms-card relative overflow-hidden mb-3 animate-pulse">
                <div class="absolute inset-y-0 left-0 w-1 bg-slate-200"></div>
                <div class="pl-3 space-y-3">
                  <div class="h-4 w-3/4 bg-slate-200 rounded"></div>
                  <div class="h-3 w-1/2 bg-slate-100 rounded"></div>
                  <div class="flex gap-2">
                    <div class="h-5 w-20 bg-slate-100 rounded-full"></div>
                    <div class="h-5 w-16 bg-slate-100 rounded-full"></div>
                  </div>
                  <div class="h-10 w-28 bg-slate-100 rounded"></div>
                </div>
              </div>
            }
          }
        } @else {
          <div class="lms-card p-0 overflow-hidden">
            <div class="flex gap-8 px-6 py-3.5 bg-slate-50 border-b border-slate-200 animate-pulse">
              @for (c of [1,2,3,4,5,6]; track c) {
                <div class="h-3 bg-slate-200 rounded w-16"></div>
              }
            </div>
            @for (r of [1,2,3,4]; track r) {
              <div class="flex gap-8 px-6 py-4 border-b border-slate-100 animate-pulse">
                @for (c of [1,2,3,4,5,6]; track c) {
                  <div class="h-4 bg-slate-100 rounded flex-1"></div>
                }
              </div>
            }
          </div>
        }

      <!-- ── Error ──────────────────────────────────────────────────── -->
      } @else if (error()) {
        <div class="lms-card text-center py-16">
          <mat-icon class="text-slate-200 mb-3" style="font-size:56px;width:56px;height:56px">
            error_outline
          </mat-icon>
          <p class="text-red-600 font-medium">{{ error() }}</p>
        </div>

      <!-- ── Student view ───────────────────────────────────────────── -->
      } @else if (userRole() === 'Student') {

        @if (assignments().length === 0) {
          <div class="lms-card text-center py-16">
            <mat-icon class="text-slate-200 mb-4" style="font-size:72px;width:72px;height:72px">
              assignment
            </mat-icon>
            <p class="font-display text-lg font-semibold text-slate-600 mb-1">No assignments yet</p>
            <p class="text-sm text-slate-400 mb-6">
              Your assignments will appear here once your lecturer posts them.
            </p>
            <a routerLink="/courses" mat-stroked-button class="min-h-[44px]">Browse Modules</a>
          </div>

        } @else {

          <!-- Due Soon section -->
          @if (dueSoonAssignments().length > 0) {
            <p class="font-display text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Due Soon
            </p>
            <div class="space-y-3 mb-8">
              @for (a of dueSoonAssignments(); track a.id) {
                <a [routerLink]="['/assignments', a.id]"
                  class="lms-card relative overflow-hidden block hover:shadow-md transition-shadow cursor-pointer no-underline">
                  <div [class]="a.deadlineBarCss"></div>
                  <div class="pl-3">
                    <p class="font-display font-semibold text-slate-800">{{ a.title }}</p>
                    <div class="flex items-center gap-1 mt-0.5 text-sm text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:1">book</mat-icon>
                      {{ a.courseName }}
                    </div>
                    <div class="flex flex-wrap items-center gap-2 mt-3">
                      <span [class]="a.deadlinePillCss">
                        <mat-icon style="font-size:11px;width:11px;height:11px;line-height:1;margin-right:2px">schedule</mat-icon>
                        {{ a.deadlineLabel }}
                      </span>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Not Submitted
                      </span>
                    </div>
                    <div class="mt-3 inline-flex items-center justify-center min-h-[44px] px-5 rounded text-sm font-semibold bg-primary-600 text-white">
                      Submit
                    </div>
                  </div>
                </a>
              }
            </div>
          }

          <!-- Submitted section -->
          @if (submittedAssignments().length > 0) {
            <p class="font-display text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Submitted
            </p>
            <div class="space-y-3 mb-8">
              @for (a of submittedAssignments(); track a.id) {
                <a [routerLink]="['/assignments', a.id]"
                  class="lms-card relative overflow-hidden block hover:shadow-md transition-shadow cursor-pointer no-underline">
                  <div [class]="a.deadlineBarCss"></div>
                  <div class="pl-3">
                    <p class="font-display font-semibold text-slate-800">{{ a.title }}</p>
                    <div class="flex items-center gap-1 mt-0.5 text-sm text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:1">book</mat-icon>
                      {{ a.courseName }}
                    </div>
                    <div class="flex flex-wrap items-center gap-2 mt-3">
                      <span [class]="a.deadlinePillCss">
                        <mat-icon style="font-size:11px;width:11px;height:11px;line-height:1;margin-right:2px">schedule</mat-icon>
                        {{ a.deadlineLabel }}
                      </span>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Submitted
                      </span>
                    </div>
                    <div class="mt-3 inline-flex items-center justify-center min-h-[44px] px-5 rounded text-sm font-semibold border border-slate-300 text-slate-700">
                      View Submission
                    </div>
                  </div>
                </a>
              }
            </div>
          }

          <!-- Graded section -->
          @if (gradedAssignments().length > 0) {
            <p class="font-display text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Graded
            </p>
            <div class="space-y-3 mb-8">
              @for (a of gradedAssignments(); track a.id) {
                <a [routerLink]="['/assignments', a.id]"
                  class="lms-card relative overflow-hidden block hover:shadow-md transition-shadow cursor-pointer no-underline">
                  <div class="absolute inset-y-0 left-0 w-1 bg-primary-600"></div>
                  <div class="pl-3">
                    <p class="font-display font-semibold text-slate-800">{{ a.title }}</p>
                    <div class="flex items-center gap-1 mt-0.5 text-sm text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:1">book</mat-icon>
                      {{ a.courseName }}
                    </div>
                    <div class="flex flex-wrap items-center gap-2 mt-3">
                      <span [class]="a.deadlinePillCss">
                        <mat-icon style="font-size:11px;width:11px;height:11px;line-height:1;margin-right:2px">schedule</mat-icon>
                        {{ a.deadlineLabel }}
                      </span>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Graded
                      </span>
                    </div>
                    <div class="mt-3 inline-flex items-center justify-center min-h-[44px] px-5 rounded text-sm font-semibold border border-slate-300 text-slate-700">
                      View Grade
                    </div>
                  </div>
                </a>
              }
            </div>
          }

        }

      <!-- ── Lecturer / Admin view ──────────────────────────────────── -->
      } @else {

        @if (assignments().length === 0) {
          <div class="lms-card text-center py-16">
            <mat-icon class="text-slate-200 mb-4" style="font-size:72px;width:72px;height:72px">
              assignment_add
            </mat-icon>
            <p class="font-display text-lg font-semibold text-slate-600 mb-1">No assignments created</p>
            <p class="text-sm text-slate-400 mb-6">Create your first assignment and it will appear here.</p>
            <button mat-flat-button color="primary" class="min-h-[44px]" (click)="openCreateDialog()">
              Create Assignment
            </button>
          </div>

        } @else {
          <div class="lms-card p-0 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Title
                    </th>
                    <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Module
                    </th>
                    <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Due Date
                    </th>
                    <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Submissions
                    </th>
                    <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (a of assignments(); track a.id) {
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="px-6 py-4 font-display font-semibold text-slate-800">{{ a.title }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ a.courseName }}</td>
                      <td class="px-6 py-4">
                        <span [class]="a.deadlinePillCss">
                          {{ a.deadlineLabel }}
                        </span>
                      </td>
                      <td class="px-6 py-4 min-w-[120px]">
                        <span class="font-medium text-slate-700">{{ a.submissionCount }}</span>
                        <span class="text-slate-400 text-xs ml-1">submitted</span>
                      </td>
                      <td class="px-6 py-4">
                        @if (a.isOverdue) {
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Closed
                          </span>
                        } @else {
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Published
                          </span>
                        }
                      </td>
                      <td class="px-6 py-4">
                        <a [routerLink]="['/assignments', a.id]"
                          class="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          aria-label="View submissions">
                          <mat-icon>visibility</mat-icon>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

      }
    </div>
  `,
})
export class AssignmentListComponent implements OnInit {
  isLoading = signal(false);
  assignments = signal<AssignmentRow[]>([]);
  mySubmissions = signal<Submission[]>([]);
  error = signal<string | null>(null);

  readonly userRole = this.authService.userRole;

  readonly dueSoonAssignments = computed(() =>
    this.assignments().filter(a => !this.mySubmissions().find(s => s.assignmentId === a.id))
  );

  readonly submittedAssignments = computed(() =>
    this.assignments().filter(a => {
      const s = this.mySubmissions().find(sub => sub.assignmentId === a.id);
      return s != null && !s.isGraded;
    })
  );

  readonly gradedAssignments = computed(() =>
    this.assignments().filter(a => {
      const s = this.mySubmissions().find(sub => sub.assignmentId === a.id);
      return s != null && s.isGraded;
    })
  );

  private courseId: string | undefined;
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  constructor(
    private route: ActivatedRoute,
    private assignmentService: AssignmentService,
    private submissionService: SubmissionService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.queryParamMap.get('courseId') ?? undefined;
    this.loadAssignments();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(AssignmentCreateDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((created: boolean) => {
      if (created) {
        this.snackBar.open('Assignment created successfully.', 'Dismiss', { duration: 4000 });
        this.loadAssignments();
      }
    });
  }

  private loadAssignments(): void {
    if (!this.authService.currentUser()) return;
    this.isLoading.set(true);
    this.error.set(null);

    if (this.userRole() === 'Student') {
      forkJoin({
        assignments: this.courseId
          ? this.assignmentService.getAssignments(this.courseId)
          : this.assignmentService.getMyAssignments(),
        submissions: this.submissionService.getMySubmissions().pipe(catchError(() => of<Submission[]>([])))
      }).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ({ assignments, submissions }) => {
            this.mySubmissions.set(submissions);
            this.assignments.set(assignments.map(a => ({ ...a, ...this.deadlineInfo(a.deadline) })));
            this.isLoading.set(false);
          },
          error: (err: { error?: { message?: string } }) => {
            this.error.set(err?.error?.message ?? 'Failed to load assignments.');
            this.isLoading.set(false);
          },
        });
    } else {
      const obs = this.courseId
        ? this.assignmentService.getAssignments(this.courseId)
        : this.assignmentService.getMyAssignments();
      obs.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.assignments.set(data.map(a => ({ ...a, ...this.deadlineInfo(a.deadline) })));
            this.isLoading.set(false);
          },
          error: (err: { error?: { message?: string } }) => {
            this.error.set(err?.error?.message ?? 'Failed to load assignments.');
            this.isLoading.set(false);
          },
        });
    }
  }

  private deadlineInfo(deadline: string): {
    deadlineLabel: string;
    deadlineCss: string;
    deadlineBarCss: string;
    deadlinePillCss: string;
    isOverdue: boolean;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(deadline);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const abs = Math.abs(diff);
    const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;
    const pill = 'inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ';

    if (diff < 0) return {
      deadlineLabel: `Overdue by ${days(abs)}`,
      deadlineCss: 'text-sm font-medium text-red-600',
      deadlineBarCss: 'absolute inset-y-0 left-0 w-1 bg-red-500',
      deadlinePillCss: pill + 'bg-red-50 text-red-600',
      isOverdue: true,
    };
    if (diff === 0) return {
      deadlineLabel: 'Due today',
      deadlineCss: 'text-sm font-medium text-orange-500',
      deadlineBarCss: 'absolute inset-y-0 left-0 w-1 bg-amber-500',
      deadlinePillCss: pill + 'bg-amber-50 text-amber-600',
      isOverdue: false,
    };
    if (diff <= 2) return {
      deadlineLabel: `${days(diff)} left`,
      deadlineCss: 'text-sm font-medium text-amber-600',
      deadlineBarCss: 'absolute inset-y-0 left-0 w-1 bg-amber-500',
      deadlinePillCss: pill + 'bg-amber-50 text-amber-600',
      isOverdue: false,
    };
    return {
      deadlineLabel: `${days(diff)} left`,
      deadlineCss: 'text-sm font-medium text-green-600',
      deadlineBarCss: 'absolute inset-y-0 left-0 w-1 bg-green-500',
      deadlinePillCss: pill + 'bg-green-50 text-green-600',
      isOverdue: false,
    };
  }
}
