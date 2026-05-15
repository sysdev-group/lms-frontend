import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@features/users/user-detail/user-detail.component';
import { EnrollmentService } from '@core/services/enrollment.service';
import { CourseService } from '@core/services/course.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/auth/auth.service';
import {
  Course,
  Enrollment,
  EnrollStudentRequest,
  User,
} from '@shared/models/models';

@Component({
  selector: 'app-enrollment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <h1 class="section-title">Enrollment</h1>

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
        } @else if (enrollments().length === 0) {
          <div class="lms-card text-center py-12">
            <mat-icon class="text-slate-300 mb-3">school</mat-icon>
            <p class="text-slate-500">You are not enrolled in any courses.</p>
          </div>
        } @else {
          <div class="lms-card p-0 overflow-hidden">
            <table mat-table [dataSource]="enrollments()" class="w-full">

              <ng-container matColumnDef="course">
                <th mat-header-cell *matHeaderCellDef
                  class="!pl-6 font-semibold text-slate-700 bg-slate-50 text-xs uppercase tracking-wide">
                  Course
                </th>
                <td mat-cell *matCellDef="let e" class="!pl-6 font-medium text-slate-800">
                  {{ e.courseName }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef
                  class="font-semibold text-slate-700 bg-slate-50 text-xs uppercase tracking-wide">
                  Status
                </th>
                <td mat-cell *matCellDef="let e">
                  <span [class]="statusCss(e.status)">{{ e.status }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="enrolledAt">
                <th mat-header-cell *matHeaderCellDef
                  class="font-semibold text-slate-700 bg-slate-50 text-xs uppercase tracking-wide">
                  Enrolled
                </th>
                <td mat-cell *matCellDef="let e" class="text-slate-600 text-sm">
                  {{ e.enrolledAt | date:'mediumDate' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="!pr-4 bg-slate-50"></th>
                <td mat-cell *matCellDef="let e" class="!pr-4">
                  <button mat-button color="warn"
                    [disabled]="e.status !== 'Active'"
                    (click)="onDrop(e)">
                    Drop
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="studentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: studentColumns;"
                class="hover:bg-slate-50 transition-colors">
              </tr>
            </table>
          </div>
        }

      } @else {

        <!-- ── Admin / Lecturer view ── -->
        <mat-card class="mb-6">
          <mat-card-header class="mb-2">
            <mat-card-title>Enroll a Student</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (formLoading()) {
              <div class="flex justify-center py-8">
                <mat-spinner diameter="32" />
              </div>
            } @else if (formError()) {
              <div class="py-4 flex items-center gap-2">
                <mat-icon class="text-red-400">error_outline</mat-icon>
                <p class="text-red-600 text-sm">{{ formError() }}</p>
              </div>
            } @else {
              <form [formGroup]="enrollForm" (ngSubmit)="onEnroll()" class="flex flex-col gap-4 mt-2">

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Module</mat-label>
                  <mat-select formControlName="courseId">
                    @for (c of courses(); track c.id) {
                      <mat-option [value]="c.id">{{ c.code }} — {{ c.title }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Student</mat-label>
                  <mat-select formControlName="studentId">
                    @for (s of students(); track s.id) {
                      <mat-option [value]="s.id">
                        {{ s.firstName }} {{ s.lastName }} — {{ s.email }}
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Semester ID</mat-label>
                  <input matInput formControlName="semesterId" placeholder="e.g. sem-2026-1" />
                </mat-form-field>

                <div class="flex justify-end">
                  <button mat-flat-button color="primary" type="submit"
                    [disabled]="enrollForm.invalid || isSubmitting()">
                    @if (isSubmitting()) {
                      <mat-spinner diameter="18" class="inline-block mr-2" />
                    }
                    Enroll Student
                  </button>
                </div>

              </form>
            }
          </mat-card-content>
        </mat-card>

        <!-- Course enrollment list (shown once a course is selected) -->
        @if (selectedCourseId()) {
          <h2 class="font-display font-semibold text-slate-700 mb-3">Enrolled Students</h2>

          @if (listLoading()) {
            <div class="flex justify-center py-8">
              <mat-spinner diameter="36" />
            </div>
          } @else if (courseEnrollments().length === 0) {
            <div class="lms-card text-center py-10">
              <mat-icon class="text-slate-300 mb-2">people</mat-icon>
              <p class="text-slate-500">No students enrolled in this course yet.</p>
            </div>
          } @else {
            <div class="lms-card p-0 overflow-hidden">
              <table mat-table [dataSource]="courseEnrollments()" class="w-full">

                <ng-container matColumnDef="student">
                  <th mat-header-cell *matHeaderCellDef
                    class="!pl-6 font-semibold text-slate-700 bg-slate-50 text-xs uppercase tracking-wide">
                    Student
                  </th>
                  <td mat-cell *matCellDef="let e" class="!pl-6 font-medium text-slate-800">
                    {{ e.studentName }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef
                    class="font-semibold text-slate-700 bg-slate-50 text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <td mat-cell *matCellDef="let e">
                    <span [class]="statusCss(e.status)">{{ e.status }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="enrolledAt">
                  <th mat-header-cell *matHeaderCellDef
                    class="font-semibold text-slate-700 bg-slate-50 text-xs uppercase tracking-wide">
                    Enrolled
                  </th>
                  <td mat-cell *matCellDef="let e" class="text-slate-600 text-sm">
                    {{ e.enrolledAt | date:'mediumDate' }}
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="adminColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: adminColumns;"
                  class="hover:bg-slate-50 transition-colors">
                </tr>
              </table>
            </div>
          }
        }

      }
    </div>
  `,
})
export class EnrollmentComponent implements OnInit {
  enrollments = signal<Enrollment[]>([]);
  courses = signal<Course[]>([]);
  students = signal<User[]>([]);
  courseEnrollments = signal<Enrollment[]>([]);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  formLoading = signal(false);
  formError = signal<string | null>(null);
  isSubmitting = signal(false);
  listLoading = signal(false);
  selectedCourseId = signal<string | null>(null);

  enrollForm: FormGroup;

  readonly userRole = this.authService.userRole;
  readonly studentColumns = ['course', 'status', 'enrolledAt', 'actions'];
  readonly adminColumns = ['student', 'status', 'enrolledAt'];

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private enrollmentService: EnrollmentService,
    private courseService: CourseService,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder,
  ) {
    this.enrollForm = this.fb.group({
      courseId: ['', Validators.required],
      studentId: ['', Validators.required],
      semesterId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const role = this.authService.currentUser()?.role;
    if (role === 'Student') {
      this.loadStudentEnrollments();
    } else {
      this.loadFormData();
      this.enrollForm.get('courseId')!.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((courseId: string | null) => {
          if (courseId) {
            this.selectedCourseId.set(courseId);
            this.loadCourseEnrollments(courseId);
          } else {
            this.selectedCourseId.set(null);
            this.courseEnrollments.set([]);
          }
        });
    }
  }

  private loadStudentEnrollments(): void {
    const studentId = this.authService.currentUser()!.id;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.enrollmentService.getStudentEnrollments(studentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.enrollments.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load enrollments.');
          this.isLoading.set(false);
        },
      });
  }

  private loadFormData(): void {
    this.formLoading.set(true);
    forkJoin({
      courses: this.courseService.getCourses(),
      students: this.userService.getUsers({ role: 'Student', pageSize: 200 }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ courses, students }) => {
          this.courses.set(courses.items);
          this.students.set(students.items);
          this.formLoading.set(false);
        },
        error: (err) => {
          this.formError.set(err?.error?.message ?? 'Failed to load form data.');
          this.formLoading.set(false);
        },
      });
  }

  private loadCourseEnrollments(courseId: string): void {
    this.listLoading.set(true);
    this.courseEnrollments.set([]);
    this.enrollmentService.getCourseEnrollments(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.courseEnrollments.set(data);
          this.listLoading.set(false);
        },
        error: () => {
          this.listLoading.set(false);
        },
      });
  }

  onEnroll(): void {
    if (this.enrollForm.invalid) return;
    this.isSubmitting.set(true);
    const { courseId, studentId, semesterId } = this.enrollForm.value as {
      courseId: string;
      studentId: string;
      semesterId: string;
    };
    const request: EnrollStudentRequest = { courseId, studentId, semesterId };

    this.enrollmentService.enroll(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Student enrolled successfully.', 'Close', { duration: 3000 });
          this.isSubmitting.set(false);
          this.enrollForm.reset();
          this.selectedCourseId.set(courseId);
          this.loadCourseEnrollments(courseId);
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message ?? 'Enrollment failed.', 'Dismiss', { duration: 4000 });
          this.isSubmitting.set(false);
        },
      });
  }

  onDrop(enrollment: Enrollment): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Drop Enrollment',
        message: `Drop enrollment from "${enrollment.courseName}"? This action cannot be undone.`,
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.enrollmentService.drop(enrollment.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.loadStudentEnrollments(),
          error: (err) => {
            this.errorMessage.set(err?.error?.message ?? 'Failed to drop enrollment.');
          },
        });
    });
  }

  statusCss(status: string): string {
    const map: Record<string, string> = {
      Active: 'badge badge-success',
      Dropped: 'badge badge-danger',
      Completed: 'badge badge-info',
    };
    return map[status] ?? 'badge badge-neutral';
  }
}
