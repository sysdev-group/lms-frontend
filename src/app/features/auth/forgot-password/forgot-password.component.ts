import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Forgot Password page.
 * TODO: Implement form with email field that calls AuthService.forgotPassword().
 * See Section 29 — Password Reset & Account Recovery.
 * Follow the same pattern as LoginComponent.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div class="lms-card w-full max-w-md text-center">
        <h2 class="section-title">Forgot Password</h2>
        <p class="text-slate-500 mb-4">
          TODO: Implement this page. See Section 29 of system docs.
        </p>
        <a routerLink="/auth/login" class="text-primary-600 text-sm">Back to login</a>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {}
