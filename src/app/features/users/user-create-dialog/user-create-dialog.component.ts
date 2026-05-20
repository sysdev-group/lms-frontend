import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Add User</h2>

    <mat-dialog-content>
      @if (errorMessage()) {
        <p class="text-red-600 text-sm mb-4">{{ errorMessage() }}</p>
      }

      <form [formGroup]="form" class="flex flex-col gap-4 pt-1">

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" />
            @if (form.controls.firstName.touched && form.controls.firstName.hasError('required')) {
              <mat-error>First name is required.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" />
            @if (form.controls.lastName.touched && form.controls.lastName.hasError('required')) {
              <mat-error>Last name is required.</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" placeholder="user@example.com" />
          @if (form.controls.email.touched && form.controls.email.hasError('required')) {
            <mat-error>Email is required.</mat-error>
          }
          @if (form.controls.email.touched && form.controls.email.hasError('email')) {
            <mat-error>Enter a valid email address.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="Student">Student</mat-option>
            <mat-option value="Lecturer">Lecturer</mat-option>
            <mat-option value="Admin">Admin</mat-option>
          </mat-select>
          @if (form.controls.role.touched && form.controls.role.hasError('required')) {
            <mat-error>Role is required.</mat-error>
          }
        </mat-form-field>

      </form>

      <p class="text-xs text-slate-400 mt-2">
        A temporary password will be emailed to the user automatically.
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false" [disabled]="isLoading()">Cancel</button>
      <button mat-flat-button color="primary"
        [disabled]="form.invalid || isLoading()"
        (click)="submit()">
        @if (isLoading()) {
          <mat-spinner diameter="18" class="inline-block" />
        } @else {
          Create User
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class UserCreateDialogComponent {
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName:  new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email:     new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role:      new FormControl<'Student' | 'Lecturer' | 'Admin' | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });

  private readonly userService = inject(UserService);
  private readonly dialogRef = inject(MatDialogRef<UserCreateDialogComponent>);

  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { firstName, lastName, email, role } = this.form.getRawValue();

    this.userService.createUser({
      firstName,
      lastName,
      email,
      role: role as 'Student' | 'Lecturer' | 'Admin',
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.dialogRef.close(true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to create user. Please try again.');
        this.isLoading.set(false);
      },
    });
  }
}
