import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgrammeService } from '../programme.service';

@Component({
  selector: 'app-programme-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Create Programme</h2>

    <mat-dialog-content>
      @if (errorMessage()) {
        <p class="text-red-600 text-sm mb-4">{{ errorMessage() }}</p>
      }

      <form [formGroup]="form" class="flex flex-col gap-4 pt-1">

        <mat-form-field appearance="outline">
          <mat-label>Programme Code</mat-label>
          <input matInput formControlName="code" placeholder="e.g. BSC-CS" />
          @if (form.controls.code.touched && form.controls.code.hasError('required')) {
            <mat-error>Programme Code is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Programme Title</mat-label>
          <input matInput formControlName="title"
                 placeholder="e.g. BSc Computer Science" />
          @if (form.controls.title.touched && form.controls.title.hasError('required')) {
            <mat-error>Programme Title is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Department</mat-label>
          <input matInput formControlName="department"
                 placeholder="e.g. School of Computing" />
          @if (form.controls.department.touched && form.controls.department.hasError('required')) {
            <mat-error>Department is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Year</mat-label>
          <input matInput type="number" formControlName="year"
                 placeholder="e.g. 1" min="1" max="6" />
          @if (form.controls.year.touched && form.controls.year.hasError('required')) {
            <mat-error>Year is required.</mat-error>
          }
          @if (form.controls.year.touched && form.controls.year.hasError('min')) {
            <mat-error>Year must be at least 1.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Brief description of the programme"></textarea>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false" [disabled]="isLoading()">
        Cancel
      </button>
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
export class ProgrammeCreateDialogComponent {
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    code:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    title:       new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    department:  new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    year:        new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    description: new FormControl('', { nonNullable: true }),
  });

  private readonly programmeService = inject(ProgrammeService);
  private readonly dialogRef = inject(MatDialogRef<ProgrammeCreateDialogComponent>);

  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { code, title, department, year, description } = this.form.getRawValue();

    this.programmeService.create({
      code,
      title,
      department,
      year: year ?? 1,
      description: description || undefined,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.dialogRef.close(true);
      },
      error: (err: { error?: { message?: string } }) => {
        const msg = err?.error?.message ?? 'Failed to create programme. Please try again.';
        this.errorMessage.set(msg);
        this.isLoading.set(false);
      },
    });
  }
}
