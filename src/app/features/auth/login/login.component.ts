import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/auth/auth.service';

/**
 * Login page — the WORKED EXAMPLE component.
 *
 * Patterns demonstrated here that every other component should follow:
 *   - Standalone component with explicit imports array
 *   - Reactive forms with validation
 *   - Signals for local UI state (isLoading, showPassword, errorMessage)
 *   - Service call in ngSubmit handler with error handling
 *   - Template uses Tailwind for layout, Angular Material for form fields
 *   - No logic in the template — all in the class
 */
@Component({
  selector: 'app-login',
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

        <!-- Logo / Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4">
            <mat-icon class="text-white text-3xl">school</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-slate-800">Modern Modular LMS</h1>
          <p class="text-slate-500 mt-1">Sign in to your account</p>
        </div>

        <!-- Card -->
        <div class="lms-card">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>

            <!-- Error message -->
            @if (errorMessage()) {
              <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p class="text-sm text-red-700">{{ errorMessage() }}</p>
              </div>
            }

            <!-- Email -->
            <mat-form-field class="w-full mb-2" appearance="outline">
              <mat-label>Email address</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-icon matPrefix class="mr-2 text-slate-400">email</mat-icon>
              @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (loginForm.get('email')?.hasError('email')) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>

            <!-- Password -->
            <mat-form-field class="w-full mb-4" appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password" />
              <mat-icon matPrefix class="mr-2 text-slate-400">lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            <!-- Forgot password link -->
            <div class="text-right mb-6">
              <a routerLink="/auth/forgot-password"
                class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot your password?
              </a>
            </div>

            <!-- Submit -->
            <button mat-flat-button color="primary"
              type="submit"
              class="w-full h-11"
              [disabled]="isLoading() || loginForm.invalid">
              @if (isLoading()) {
                <mat-spinner diameter="20" class="inline-block mr-2" />
                Signing in...
              } @else {
                Sign in
              }
            </button>

          </form>
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  loginForm: FormGroup;

  // Local UI state as signals
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Invalid email or password.');
        this.isLoading.set(false);
      },
    });
  }
}
