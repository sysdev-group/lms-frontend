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
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div class="w-full max-w-sm">

        <!-- Logo / Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-md">
            <mat-icon style="font-size:32px;width:32px;height:32px;color:white">school</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-slate-800">Modern Modular LMS</h1>
          <p class="text-slate-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>

            <!-- Error message -->
            @if (errorMessage()) {
              <div class="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                <mat-icon style="font-size:18px;width:18px;height:18px" class="text-red-500 shrink-0">error_outline</mat-icon>
                <p class="text-sm text-red-700">{{ errorMessage() }}</p>
              </div>
            }

            <!-- Email -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  style="font-size:20px;width:20px;height:20px">email</mat-icon>
                <input type="email" formControlName="email" autocomplete="email"
                  placeholder="you@example.com"
                  class="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm
                         text-slate-800 placeholder-slate-400 bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
              </div>
              @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                <p class="mt-1 text-xs text-red-600">Email is required</p>
              }
              @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                <p class="mt-1 text-xs text-red-600">Enter a valid email address</p>
              }
            </div>

            <!-- Password -->
            <div class="mb-5">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  style="font-size:20px;width:20px;height:20px">lock</mat-icon>
                <input [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password" autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg text-sm
                         text-slate-800 placeholder-slate-400 bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                <button type="button" (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  <mat-icon style="font-size:20px;width:20px;height:20px">
                    {{ showPassword() ? 'visibility_off' : 'visibility' }}
                  </mat-icon>
                </button>
              </div>
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <p class="mt-1 text-xs text-red-600">Password is required</p>
              }
            </div>

            <!-- Forgot password -->
            <div class="text-right mb-6">
              <a routerLink="/auth/forgot-password"
                class="text-sm text-blue-600 hover:text-blue-700 font-medium transition">
                Forgot your password?
              </a>
            </div>

            <!-- Submit -->
            <button type="submit" [disabled]="isLoading()"
              class="w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white transition
                     flex items-center justify-center gap-2
                     bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
              @if (isLoading()) {
                <mat-spinner diameter="18" />
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
