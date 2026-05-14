import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AssignmentService } from '@core/services/assignment.service';
import { AuthService } from '@core/auth/auth.service';
import { Assignment } from '@shared/models/models';
import { AssignmentCreateDialogComponent } from '../assignment-create-dialog/assignment-create-dialog.component';

interface AssignmentRow extends Assignment {
  readonly deadlineLabel: string;
  readonly deadlineCss: string;
}

/**
 * Assignment list page.
 * Students see deadline status. Lecturers also see submission counts.
 * Accepts an optional ?courseId query param to scope the list to a course.
 * See Section 7.5.
 */
@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [RouterLink, MatProgressSpinnerModule, MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <h1 class="section-title mb-0">Assignments</h1>
        @if (userRole() === 'Lecturer' || userRole() === 'Admin') {
          <button mat-flat-button color="primary" class="min-h-[44px]"
            (click)="openCreateDialog()">+ Create Assignment</button>
        }
      </div>

      @if (isLoading()) {
        <div class="flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>
      } @else if (error()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-red-400 mb-3">error_outline</mat-icon>
          <p class="text-red-600">{{ error() }}</p>
        </div>
      } @else if (assignments().length === 0) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-slate-300 mb-3">assignment</mat-icon>
          <p class="text-slate-500">No assignments have been posted yet.</p>
        </div>
      } @else {
        <ul class="space-y-3">
          @for (a of assignments(); track a.id) {
            <li>
              <a [routerLink]="['/assignments', a.id]"
                class="lms-card block hover:shadow-md transition-shadow cursor-pointer">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-800 truncate">{{ a.title }}</p>
                    <p class="text-sm text-slate-500 mt-0.5">{{ a.courseName }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <span [class]="a.deadlineCss">
                      {{ a.deadlineLabel }}
                    </span>
                    @if (userRole() === 'Lecturer' || userRole() === 'Admin') {
                      <p class="text-xs text-slate-400 mt-1">
                        {{ a.submissionCount }} submission{{ a.submissionCount === 1 ? '' : 's' }}
                      </p>
                    }
                  </div>
                </div>
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class AssignmentListComponent implements OnInit {
  isLoading = signal(false);
  assignments = signal<AssignmentRow[]>([]);
  error = signal<string | null>(null);

  readonly userRole = this.authService.userRole;

  private courseId: string | undefined;

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  constructor(
    private route: ActivatedRoute,
    private assignmentService: AssignmentService,
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
    this.isLoading.set(true);
    this.error.set(null);
    this.assignmentService.getAssignments(this.courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
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

  private deadlineInfo(deadline: string): { deadlineLabel: string; deadlineCss: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(deadline);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const abs = Math.abs(diff);
    const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;
    if (diff < 0) return { deadlineLabel: `Overdue by ${days(abs)}`, deadlineCss: 'text-sm font-medium text-red-600' };
    if (diff === 0) return { deadlineLabel: 'Due today', deadlineCss: 'text-sm font-medium text-orange-500' };
    if (diff <= 3) return { deadlineLabel: `${days(diff)} left`, deadlineCss: 'text-sm font-medium text-amber-600' };
    return { deadlineLabel: `${days(diff)} left`, deadlineCss: 'text-sm font-medium text-green-600' };
  }
}
