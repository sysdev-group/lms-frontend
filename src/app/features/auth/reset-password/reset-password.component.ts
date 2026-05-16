import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/auth/auth.service';

const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordsMismatch: true } : null;
};

@Component({
  selector: 'app-reset-password',
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

      <!-- ── Left column ── -->
      <div class="hidden lg:flex flex-col w-1/2 min-h-screen bg-slate-900 items-center justify-center p-12 relative">
        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <mat-icon class="text-white" style="font-size:22px;width:22px;height:22px">school</mat-icon>
          </div>
          <p class="font-display text-2xl text-white font-bold mt-4">LMS</p>
          <p class="text-slate-400 text-sm mt-1">Your learning. Organised.</p>
        </div>
        <div class="mt-12 flex flex-col gap-6">
          <div class="flex items-center">
            <mat-icon class="text-blue-400 mr-3 shrink-0" style="font-size:20px;width:20px;height:20px">lock_reset</mat-icon>
            <span class="text-slate-300 text-sm">Choose a strong, unique password</span>
          </div>
          <div class="flex items-center">
            <mat-icon class="text-blue-400 mr-3 shrink-0" style="font-size:20px;width:20px;height:20px">verified_user</mat-icon>
            <span class="text-slate-300 text-sm">All existing sessions will be signed out</span>
          </div>
          <div class="flex items-center">
            <mat-icon class="text-blue-400 mr-3 shrink-0" style="font-size:20px;width:20px;height:20px">timer</mat-icon>
            <span class="text-slate-300 text-sm">Reset links expire after 30 minutes</span>
          </div>
        </div>
        <p class="absolute bottom-8 text-slate-600 text-xs">Villa College — UWE Bristol</p>
      </div>

      <!-- ── Right column ── -->
      <div class="flex flex-col min-h-screen w-full lg:w-1/2 bg-white items-center justify-center p-8">
        <div class="max-w-sm w-full">

          @if (success()) {
            <!-- Success state -->
            <div class="flex flex-col items-center text-center">
              <mat-icon class="text-green-500 mb-4" style="font-size:64px;width:64px;height:64px">check_circle</mat-icon>
              <h1 class="font-display text-xl font-bold text-slate-900 mb-2">Password reset successfully</h1>
              <p class="text-slate-500 text-sm mb-8">You can now sign in with your new password.</p>
              <a routerLink="/auth/login" mat-flat-button color="primary" class="w-full min-h-[48px] flex items-center justify-center">
                Go to Login
              </a>
            </div>

          } @else if (tokenError()) {
            <!-- Token invalid state -->
            <div class="flex flex-col items-center text-center">
              <mat-icon class="text-red-500 mb-4" style="font-size:64px;width:64px;height:64px">error_outline</mat-icon>
              <h1 class="font-display text-xl font-bold text-slate-900 mb-2">Link invalid or expired</h1>
              <p class="text-slate-500 text-sm mb-8">This reset link is invalid or has expired. Request a new one.</p>
              <a routerLink="/auth/forgot-password" mat-flat-button color="primary" class="w-full min-h-[48px] flex items-center justify-center">
                Request a new link
              </a>
            </div>

          } @else {
            <!-- Form state -->
            <h1 class="font-display text-2xl text-slate-900 font-bold">Set new password</h1>
            <p class="text-slate-500 text-sm mt-1 mb-8">Must be at least 8 characters.</p>

            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" novalidate>

              <!-- New password -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>New password</mat-label>
                <mat-icon matPrefix class="text-slate-400 mr-1" style="font-size:18px;width:18px;height:18px">lock</mat-icon>
                <input matInput [type]="showNew() ? 'text' : 'password'" formControlName="newPassword" autocomplete="new-password" />
                <button mat-icon-button matSuffix type="button"
                  (click)="showNew.set(!showNew())"
                  [attr.aria-label]="showNew() ? 'Hide password' : 'Show password'">
                  <mat-icon style="font-size:18px;width:18px;height:18px">
                    {{ showNew() ? 'visibility_off' : 'visibility' }}
                  </mat-icon>
                </button>
                @if (resetForm.get('newPassword')?.touched && resetForm.get('newPassword')?.hasError('required')) {
                  <mat-error>Password is required</mat-error>
                }
                @if (resetForm.get('newPassword')?.touched && resetForm.get('newPassword')?.hasError('minlength')) {
                  <mat-error>Password must be at least 8 characters</mat-error>
                }
              </mat-form-field>

              <!-- Confirm password -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Confirm password</mat-label>
                <mat-icon matPrefix class="text-slate-400 mr-1" style="font-size:18px;width:18px;height:18px">lock_outline</mat-icon>
                <input matInput [type]="showConfirm() ? 'text' : 'password'" formControlName="confirmPassword" autocomplete="new-password" />
                <button mat-icon-button matSuffix type="button"
                  (click)="showConfirm.set(!showConfirm())"
                  [attr.aria-label]="showConfirm() ? 'Hide password' : 'Show password'">
                  <mat-icon style="font-size:18px;width:18px;height:18px">
                    {{ showConfirm() ? 'visibility_off' : 'visibility' }}
                  </mat-icon>
                </button>
                @if (resetForm.get('confirmPassword')?.touched && resetForm.hasError('passwordsMismatch')) {
                  <mat-error>Passwords do not match</mat-error>
                }
              </mat-form-field>

              <!-- Error banner -->
              @if (errorMessage()) {
                <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <mat-icon class="text-red-500 shrink-0" style="font-size:18px;width:18px;height:18px">error_outline</mat-icon>
                  <span class="text-sm text-red-700">{{ errorMessage() }}</span>
                </div>
              }

              <button mat-flat-button color="primary" type="submit"
                [disabled]="isLoading()"
                class="w-full min-h-[48px] flex items-center justify-center">
                @if (isLoading()) {
                  <mat-spinner diameter="20" />
                } @else {
                  Reset Password
                }
              </button>

            </form>
          }

        </div>
      </div>

    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly token = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly success = signal(false);
  readonly tokenError = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly resetForm = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.token.set(t);
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { newPassword, confirmPassword } = this.resetForm.value;

    this.authService
      .resetPassword({
        token: this.token()!,
        newPassword: newPassword!,
        confirmPassword: confirmPassword!,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.success.set(true);
          this.isLoading.set(false);
        },
        error: () => {
          this.tokenError.set(true);
          this.isLoading.set(false);
        },
      });
  }
}
