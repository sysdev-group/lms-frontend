import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AssignmentService } from '@core/services/assignment.service';
import { CourseService } from '@core/services/course.service';
import { Course } from '@shared/models/models';

function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selected = new Date(control.value as Date);
  selected.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected > today ? null : { pastDate: true };
}

@Component({
  selector: 'app-assignment-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Create Assignment</h2>

    <mat-dialog-content>
      @if (errorMessage()) {
        <p class="text-red-600 text-sm mb-4">{{ errorMessage() }}</p>
      }

      <form [formGroup]="form" class="flex flex-col gap-4 pt-1">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="Assignment title" />
          @if (form.controls.title.touched && form.controls.title.hasError('required')) {
            <mat-error>Title is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
            placeholder="Brief description of the assignment"></textarea>
          @if (form.controls.description.touched && form.controls.description.hasError('required')) {
            <mat-error>Description is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Module</mat-label>
          <mat-select formControlName="courseId">
            @for (course of courses(); track course.id) {
              <mat-option [value]="course.id">{{ course.code }} — {{ course.title }}</mat-option>
            }
          </mat-select>
          @if (form.controls.courseId.touched && form.controls.courseId.hasError('required')) {
            <mat-error>Module is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Deadline</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="deadline" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          @if (form.controls.deadline.touched && form.controls.deadline.hasError('required')) {
            <mat-error>Deadline is required.</mat-error>
          }
          @if (form.controls.deadline.touched && form.controls.deadline.hasError('pastDate')) {
            <mat-error>Deadline must be a future date.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Max Marks</mat-label>
          <input matInput type="number" formControlName="maxMarks" placeholder="e.g. 100" min="1" />
          @if (form.controls.maxMarks.touched && form.controls.maxMarks.hasError('required')) {
            <mat-error>Max Marks is required.</mat-error>
          }
          @if (form.controls.maxMarks.touched && form.controls.maxMarks.hasError('min')) {
            <mat-error>Max Marks must be at least 1.</mat-error>
          }
        </mat-form-field>

        <mat-checkbox formControlName="allowResubmission">Allow Resubmission</mat-checkbox>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false" [disabled]="isLoading()">Cancel</button>
      <button mat-flat-button color="primary"
        [disabled]="form.invalid || isLoading()"
        (click)="submit()">
        @if (isLoading()) {
          <mat-spinner diameter="18" class="inline-block" />
        } @else {
          Create
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class AssignmentCreateDialogComponent implements OnInit {
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  courses = signal<Course[]>([]);

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    courseId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    deadline: new FormControl<Date | null>(null, [Validators.required, futureDateValidator]),
    maxMarks: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    allowResubmission: new FormControl(false, { nonNullable: true }),
  });

  private readonly assignmentService = inject(AssignmentService);
  private readonly courseService = inject(CourseService);
  private readonly dialogRef = inject(MatDialogRef<AssignmentCreateDialogComponent>);

  ngOnInit(): void {
    this.courseService.getCourses().subscribe({
      next: (result) => this.courses.set(result.items),
      error: () => this.errorMessage.set('Failed to load courses. Please close and try again.'),
    });
  }

  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { title, description, courseId, deadline, maxMarks, allowResubmission } =
      this.form.getRawValue();

    this.assignmentService.createAssignment({
      title,
      description,
      courseId,
      deadline: deadline!.toISOString(),
      maxMarks: maxMarks!,
      allowResubmission,
      turnitinEnabled: false,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.dialogRef.close(true);
      },
      error: (err: { error?: { message?: string } }) => {
        const msg = err?.error?.message ?? 'Failed to create assignment. Please try again.';
        this.errorMessage.set(msg);
        this.isLoading.set(false);
      },
    });
  }
}
