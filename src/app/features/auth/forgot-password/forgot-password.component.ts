import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/auth/auth.service';

/**
 * Forgot Password page.
 * See Section 29 - Password Reset & Account Recovery.
 * Follow the same pattern as LoginComponent.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div class="w-full max-w-md">

        <!-- Logo / Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4">
            <mat-icon class="text-white text-3xl">school</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-slate-800">Modern Modular LMS</h1>
          <p class="text-slate-500 mt-1">Reset your password</p>
        </div>

        <!-- Card -->
        <div class="lms-card">
          <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" novalidate>

            @if (message()) {
              <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <p class="text-sm text-green-700">{{ message() }}</p>
              </div>
            }

            <!-- Email -->
            <mat-form-field class="w-full mb-4" appearance="outline">
              <mat-label>Email address</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-icon matPrefix class="mr-2 text-slate-400">email</mat-icon>
              @if (forgotPasswordForm.get('email')?.hasError('required') && forgotPasswordForm.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (forgotPasswordForm.get('email')?.hasError('email')) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>

            <!-- Submit -->
            <button mat-flat-button color="primary"
              type="submit"
              class="w-full h-11"
              [disabled]="isLoading() || forgotPasswordForm.invalid">
              @if (isLoading()) {
                <mat-spinner diameter="20" class="inline-block mr-2" />
                Sending link...
              } @else {
                Send reset link
              }
            </button>

            <!-- Back to login link -->
            <div class="text-center mt-6">
              <a routerLink="/auth/login"
                class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Back to login
              </a>
            </div>

          </form>
        </div>

      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;

  // Local UI state as signals
  isLoading = signal(false);
  message = signal<string | null>(null);

  private readonly safeMessage = 'If this email exists, a password reset link has been sent.';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.message.set(null);

    this.authService.forgotPassword(this.forgotPasswordForm.value).subscribe({
      next: () => {
        this.message.set(this.safeMessage);
        this.isLoading.set(false);
      },
      error: () => {
        this.message.set(this.safeMessage);
        this.isLoading.set(false);
      },
    });
  }
}
