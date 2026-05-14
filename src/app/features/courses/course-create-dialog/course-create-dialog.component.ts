import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CourseService } from '@core/services/course.service';

@Component({
  selector: 'app-course-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Create Course</h2>

    <mat-dialog-content>
      @if (errorMessage()) {
        <p class="text-red-600 text-sm mb-4">{{ errorMessage() }}</p>
      }

      <form [formGroup]="form" class="flex flex-col gap-4 pt-1">
        <mat-form-field appearance="outline">
          <mat-label>Course Code</mat-label>
          <input matInput formControlName="code" placeholder="e.g. CS101" />
          @if (form.controls.code.touched && form.controls.code.hasError('required')) {
            <mat-error>Course Code is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Course Title</mat-label>
          <input matInput formControlName="title" placeholder="e.g. Introduction to Computing" />
          @if (form.controls.title.touched && form.controls.title.hasError('required')) {
            <mat-error>Course Title is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
            placeholder="Brief description of the course"></textarea>
          @if (form.controls.description.touched && form.controls.description.hasError('required')) {
            <mat-error>Description is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Max Students</mat-label>
          <input matInput type="number" formControlName="maxStudents" placeholder="e.g. 30" min="1" />
          @if (form.controls.maxStudents.touched && form.controls.maxStudents.hasError('required')) {
            <mat-error>Max Students is required.</mat-error>
          }
          @if (form.controls.maxStudents.touched && form.controls.maxStudents.hasError('min')) {
            <mat-error>Max Students must be at least 1.</mat-error>
          }
        </mat-form-field>
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
export class CourseCreateDialogComponent {
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    maxStudents: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
  });

  private readonly courseService = inject(CourseService);
  private readonly dialogRef = inject(MatDialogRef<CourseCreateDialogComponent>);

  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { code, title, description, maxStudents } = this.form.getRawValue();

    this.courseService.createCourse({ code, title, description, maxStudents: maxStudents ?? undefined }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.dialogRef.close(true);
      },
      error: (err: { error?: { message?: string } }) => {
        const msg = err?.error?.message ?? 'Failed to create course. Please try again.';
        this.errorMessage.set(msg);
        this.isLoading.set(false);
      },
    });
  }
}
