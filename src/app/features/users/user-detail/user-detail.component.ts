import { Component, OnInit, signal, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/auth/auth.service';
import { User, UserRole, UpdateUserRequest } from '@shared/models/models';

/** Confirmation dialog for destructive actions (e.g. deactivate). */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="text-slate-600 text-sm">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Confirm</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }) {}
}

/**
 * User detail / edit page — Admin only.
 * Loads user by :id, shows profile, reactive edit form,
 * password-reset trigger, and MatDialog deactivation confirm.
 * See Sections 7.3 and 29.3.
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">

      <!-- Back link -->
      <a routerLink="/users"
        class="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-6 font-medium">
        <mat-icon class="!text-base !h-4 !w-4">arrow_back</mat-icon>
        Back to Users
      </a>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>
      }

      @if (!isLoading() && user()) {

        <!-- Profile header -->
        <div class="lms-card mb-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">

            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span class="text-primary-700 text-xl font-bold">
                {{ user()!.firstName[0] }}{{ user()!.lastName[0] }}
              </span>
            </div>

            <div class="flex-1 min-w-0">
              <h1 class="text-xl font-bold text-slate-800">
                {{ user()!.firstName }} {{ user()!.lastName }}
              </h1>
              <p class="text-slate-500 text-sm mt-0.5">{{ user()!.email }}</p>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <span [class]="roleBadgeClass(user()!.role)">{{ user()!.role }}</span>
                @if (user()!.isActive) {
                  <span class="badge badge-success">Active</span>
                } @else {
                  <span class="badge badge-danger">Inactive</span>
                }
              </div>
            </div>

            <div class="text-sm text-slate-400 flex-shrink-0 hidden sm:block text-right">
              <p>Joined {{ user()!.createdAt | date:'mediumDate' }}</p>
              @if (user()!.lastLoginAt) {
                <p class="mt-0.5">Last login {{ user()!.lastLoginAt | date:'mediumDate' }}</p>
              } @else {
                <p class="mt-0.5">Never logged in</p>
              }
            </div>

          </div>
        </div>

        <!-- Edit form -->
        <div class="lms-card mb-4">
          <h2 class="text-base font-semibold text-slate-700 mb-4">Edit Profile</h2>

          @if (saveSuccess()) {
            <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
              <p class="text-sm text-green-700 flex items-center gap-1.5">
                <mat-icon class="!text-base !h-4 !w-4">check_circle</mat-icon>
                Changes saved successfully.
              </p>
            </div>
          }

          <form [formGroup]="editForm" (ngSubmit)="onSave()" novalidate>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>First name</mat-label>
                <input matInput formControlName="firstName" />
                @if (editForm.get('firstName')?.hasError('required') && editForm.get('firstName')?.touched) {
                  <mat-error>First name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Last name</mat-label>
                <input matInput formControlName="lastName" />
                @if (editForm.get('lastName')?.hasError('required') && editForm.get('lastName')?.touched) {
                  <mat-error>Last name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="Student">Student</mat-option>
                  <mat-option value="Lecturer">Lecturer</mat-option>
                  <mat-option value="Admin">Admin</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Status</mat-label>
                <mat-select formControlName="isActive">
                  <mat-option [value]="true">Active</mat-option>
                  <mat-option [value]="false">Inactive</mat-option>
                </mat-select>
              </mat-form-field>

            </div>

            <div class="flex justify-end mt-2">
              <button mat-flat-button color="primary" type="submit"
                [disabled]="isSaving() || editForm.invalid || !editForm.dirty">
                @if (isSaving()) {
                  <mat-spinner diameter="18" class="inline-block mr-2" />
                  Saving...
                } @else {
                  Save Changes
                }
              </button>
            </div>
          </form>
        </div>

        <!-- Account actions -->
        <div class="lms-card">
          <h2 class="text-base font-semibold text-slate-700 mb-4">Account Actions</h2>
          <div class="flex flex-col gap-4">

            <!-- Password reset -->
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p class="text-sm font-medium text-slate-700">Password Reset</p>
                <p class="text-xs text-slate-400 mt-0.5">
                  Sends a reset link to {{ user()!.email }}. The user sets their own new password.
                </p>
                @if (resetSent()) {
                  <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <mat-icon class="!text-sm !h-4 !w-4">check_circle</mat-icon>
                    Reset email sent.
                  </p>
                }
              </div>
              <button mat-stroked-button (click)="onResetPassword()"
                [disabled]="isResetting() || resetSent()">
                @if (isResetting()) {
                  <mat-spinner diameter="16" class="inline-block mr-1" />
                  Sending...
                } @else {
                  <mat-icon>lock_reset</mat-icon>
                  Send Reset Email
                }
              </button>
            </div>

            @if (user()!.isActive) {
              <mat-divider />

              <!-- Deactivate -->
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p class="text-sm font-medium text-slate-700">Deactivate Account</p>
                  <p class="text-xs text-slate-400 mt-0.5">The user will no longer be able to log in.</p>
                </div>
                <button mat-stroked-button color="warn" (click)="onDeactivate()"
                  [disabled]="isDeactivating()">
                  @if (isDeactivating()) {
                    <mat-spinner diameter="16" class="inline-block mr-1" />
                    Deactivating...
                  } @else {
                    <mat-icon>person_off</mat-icon>
                    Deactivate Account
                  }
                </button>
              </div>
            }

          </div>
        </div>

      }
    </div>
  `,
})
export class UserDetailComponent implements OnInit {
  user = signal<User | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  saveSuccess = signal(false);
  isResetting = signal(false);
  resetSent = signal(false);
  isDeactivating = signal(false);

  editForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      role:      ['', Validators.required],
      isActive:  [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.isLoading.set(true);
    this.userService.getUserById(id).subscribe({
      next: user => {
        this.user.set(user);
        this.editForm.reset({
          firstName: user.firstName,
          lastName:  user.lastName,
          role:      user.role,
          isActive:  user.isActive,
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSave(): void {
    if (this.editForm.invalid || !this.editForm.dirty) return;
    this.isSaving.set(true);
    this.saveSuccess.set(false);
    const request: UpdateUserRequest = this.editForm.value;
    this.userService.updateUser(this.user()!.id, request).subscribe({
      next: updated => {
        this.user.set(updated);
        this.editForm.reset({
          firstName: updated.firstName,
          lastName:  updated.lastName,
          role:      updated.role,
          isActive:  updated.isActive,
        });
        this.saveSuccess.set(true);
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false),
    });
  }

  onResetPassword(): void {
    this.isResetting.set(true);
    this.authService.forgotPassword({ email: this.user()!.email }).subscribe({
      next: () => {
        this.resetSent.set(true);
        this.isResetting.set(false);
      },
      error: () => this.isResetting.set(false),
    });
  }

  onDeactivate(): void {
    const user = this.user()!;
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Deactivate Account',
        message: `Deactivate ${user.firstName} ${user.lastName}? They will no longer be able to log in.`,
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.isDeactivating.set(true);
      this.userService.deactivateUser(user.id).subscribe({
        next: () => this.router.navigate(['/users']),
        error: () => this.isDeactivating.set(false),
      });
    });
  }

  roleBadgeClass(role: UserRole): string {
    const map: Record<UserRole, string> = {
      Admin:    'badge badge-info',
      Lecturer: 'badge badge-warning',
      Student:  'badge badge-success',
    };
    return map[role] ?? 'badge badge-neutral';
  }
}
