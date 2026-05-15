import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';

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
    <div class="flex min-h-screen">

      <!-- ── Left column (hidden on mobile) ── -->
      <div class="hidden lg:flex flex-col w-1/2 min-h-screen bg-slate-900 items-center justify-center p-12 relative">

        <!-- Brand block -->
        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <mat-icon class="text-white" style="font-size:22px;width:22px;height:22px">school</mat-icon>
          </div>
          <p class="font-display text-2xl text-white font-bold mt-4">LMS</p>
          <p class="text-slate-400 text-sm mt-1">Your learning. Organised.</p>
        </div>

        <!-- Feature list -->
        <div class="mt-12 flex flex-col gap-6">
          <div class="flex items-center">
            <mat-icon class="text-blue-400 mr-3 shrink-0" style="font-size:20px;width:20px;height:20px">book</mat-icon>
            <span class="text-slate-300 text-sm">Access your modules and assignments</span>
          </div>
          <div class="flex items-center">
            <mat-icon class="text-blue-400 mr-3 shrink-0" style="font-size:20px;width:20px;height:20px">trending_up</mat-icon>
            <span class="text-slate-300 text-sm">Track attendance and grades</span>
          </div>
          <div class="flex items-center">
            <mat-icon class="text-blue-400 mr-3 shrink-0" style="font-size:20px;width:20px;height:20px">notifications</mat-icon>
            <span class="text-slate-300 text-sm">Stay on top of deadlines</span>
          </div>
        </div>

        <!-- University name -->
        <p class="absolute bottom-8 text-slate-600 text-xs">Villa College — UWE Bristol</p>
      </div>

      <!-- ── Right column ── -->
      <div class="flex flex-col min-h-screen w-full lg:w-1/2 bg-white items-center justify-center p-8">
        <div class="max-w-sm w-full">

          <!-- Heading -->
          <h1 class="font-display text-2xl text-slate-900 font-bold">Welcome back</h1>
          <p class="text-slate-500 text-sm mt-1 mb-8">Sign in to your account</p>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>

            <!-- Email -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email address</mat-label>
              <mat-icon matPrefix class="text-slate-400 mr-1" style="font-size:18px;width:18px;height:18px">email</mat-icon>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (loginForm.get('email')?.hasError('required')) {
                <mat-error>Email is required</mat-error>
              }
              @if (loginForm.get('email')?.hasError('email')) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>

            <!-- Password -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix class="text-slate-400 mr-1" style="font-size:18px;width:18px;height:18px">lock</mat-icon>
              <input matInput [type]="showPassword() ? 'text' : 'password'"
                formControlName="password" autocomplete="current-password" />
              <button mat-icon-button matSuffix type="button"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                <mat-icon style="font-size:18px;width:18px;height:18px">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </mat-icon>
              </button>
              @if (loginForm.get('password')?.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            <!-- Forgot password -->
            <div class="text-right text-sm -mt-2 mb-6">
              <a routerLink="/auth/forgot-password"
                class="text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">
                Forgot password?
              </a>
            </div>

            <!-- Submit -->
            <button mat-flat-button color="primary" type="submit"
              [disabled]="isLoading()"
              class="w-full min-h-[48px] flex items-center justify-center">
              @if (isLoading()) {
                <mat-spinner diameter="20" />
              } @else {
                Sign In
              }
            </button>

            <!-- Error state -->
            @if (errorMessage()) {
              <div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-4 flex items-center gap-2">
                <mat-icon class="text-red-500 shrink-0" style="font-size:18px;width:18px;height:18px">error_outline</mat-icon>
                <span class="text-sm text-red-700">{{ errorMessage() }}</span>
              </div>
            }

            <!-- Divider -->
            <div class="flex items-center gap-3 my-6">
              <div class="border-t border-slate-200 flex-1"></div>
              <span class="text-xs text-slate-400">or</span>
              <div class="border-t border-slate-200 flex-1"></div>
            </div>

            <!-- Dev quick-fill (non-production only) -->
            @if (!isProd) {
              <div class="flex gap-2">
                <button mat-stroked-button type="button"
                  class="flex-1 text-xs min-h-[44px]"
                  (click)="fillCredentials('admin')">Admin</button>
                <button mat-stroked-button type="button"
                  class="flex-1 text-xs min-h-[44px]"
                  (click)="fillCredentials('lecturer')">Lecturer</button>
                <button mat-stroked-button type="button"
                  class="flex-1 text-xs min-h-[44px]"
                  (click)="fillCredentials('student')">Student</button>
              </div>
            }

          </form>
        </div>
      </div>

    </div>
  `,
})
export class LoginComponent {
  loginForm: FormGroup;

  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  protected readonly isProd = environment.production;

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

  fillCredentials(role: 'admin' | 'lecturer' | 'student'): void {
    const creds = {
      admin:    { email: 'admin@lms.com',    password: 'Admin@123'    },
      lecturer: { email: 'lecturer@lms.com', password: 'Lecturer@123' },
      student:  { email: 'student1@lms.com', password: 'Student@123'  },
    };
    this.loginForm.patchValue(creds[role]);
  }
}
