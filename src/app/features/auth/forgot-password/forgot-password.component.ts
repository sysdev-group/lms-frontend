import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div class="w-full max-w-md">

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4">
            <mat-icon class="text-white text-3xl">lock_reset</mat-icon>
          </div>
          <h1 class="font-display text-2xl font-bold text-slate-800">Reset your password</h1>
          <p class="text-slate-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        <!-- Card -->
        <div class="lms-card">

          @if (submitted()) {
            <!-- Success state -->
            <div class="text-center py-4">
              <mat-icon class="text-green-500 mb-3" style="font-size:48px;width:48px;height:48px">
                mark_email_read
              </mat-icon>
              <h2 class="font-display text-lg font-semibold text-slate-800 mb-2">Check your inbox</h2>
              <p class="text-slate-500 text-sm mb-6">
                If an account exists for
                <strong class="text-slate-700">{{ emailSent() }}</strong>,
                a reset link has been sent.
              </p>
              <a routerLink="/auth/login"
                class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Back to sign in
              </a>
            </div>

          } @else {
            <!-- Form state -->
            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" novalidate>

              <mat-form-field class="w-full mb-4" appearance="outline">
                <mat-label>Email address</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email" />
                <mat-icon matPrefix class="mr-2 text-slate-400">email</mat-icon>
                @if (forgotForm.get('email')?.hasError('required') && forgotForm.get('email')?.touched) {
                  <mat-error>Email is required</mat-error>
                }
                @if (forgotForm.get('email')?.hasError('email') && forgotForm.get('email')?.touched) {
                  <mat-error>Enter a valid email address</mat-error>
                }
              </mat-form-field>

              <button mat-flat-button color="primary"
                type="submit"
                class="w-full h-11 mb-4"
                [disabled]="isLoading() || forgotForm.invalid">
                @if (isLoading()) {
                  <mat-spinner diameter="20" class="inline-block mr-2" />
                  Sending...
                } @else {
                  Send reset link
                }
              </button>

              <div class="text-center">
                <a routerLink="/auth/login"
                  class="text-sm text-slate-500 hover:text-slate-700">
                  Back to sign in
                </a>
              </div>

            </form>
          }

        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isLoading = signal(false);
  submitted = signal(false);
  emailSent = signal('');

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const email = this.forgotForm.value.email as string;

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.emailSent.set(email);
        this.submitted.set(true);
        this.isLoading.set(false);
      },
      error: () => {
        // Always show success to prevent user enumeration — errorInterceptor
        // already displayed a snackbar for genuine network failures.
        this.emailSent.set(email);
        this.submitted.set(true);
        this.isLoading.set(false);
      },
    });
  }
}
