import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse } from '@shared/models/api-response.model';
import { AuthUser, LoginRequest, LoginResponse, ForgotPasswordRequest, ResetPasswordRequest } from '@shared/models/models';

/**
 * Authentication service — the WORKED EXAMPLE for frontend services.
 *
 * KEY DECISIONS:
 *   - Access token stored in a private signal (in-memory only — never localStorage)
 *   - Refresh token is an HttpOnly cookie managed by the browser automatically
 *   - Current user exposed as a readonly signal — components react to changes
 *   - All HTTP calls go directly to HttpClient here (not ApiService) because
 *     auth endpoints need special handling that bypasses the interceptor
 *
 * See Section 30 — JWT Refresh Token Strategy.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  // ─── State ───────────────────────────────────────────────────────────────
  // Private writable signals — only this service can change them
  private _accessToken = signal<string | null>(null);
  private _currentUser = signal<AuthUser | null>(null);

  // Public readonly computed signals — components can read these
  readonly currentUser = computed(() => this._currentUser());
  readonly isLoggedIn = computed(() => this._accessToken() !== null);
  readonly userRole = computed(() => this._currentUser()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Log in with email and password.
   * On success: stores access token in memory, user in signal.
   * Refresh token is set as HttpOnly cookie by the server automatically.
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, request, {
        withCredentials: true,  // Required to send/receive cookies
      })
      .pipe(
        tap(res => {
          if (res.success && res.data) {
            this._accessToken.set(res.data.accessToken);
            this._currentUser.set(res.data.user);
          }
        }),
        // Unwrap and return just the LoginResponse
        tap({ error: () => this.clearSession() }),
      ) as unknown as Observable<LoginResponse>;
  }

  /**
   * Log out the current user.
   * Clears local state and calls the backend to revoke the refresh token.
   */
  logout(): void {
    this.http
      .post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ complete: () => this.clearSession() });
  }

  /**
   * Silently get a new access token using the refresh token cookie.
   * Called automatically by the AuthInterceptor when a 401 is received.
   * Returns the new access token as a string.
   */
  refreshToken(): Observable<string> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/refresh`, {}, {
        withCredentials: true,
      })
      .pipe(
        tap(res => {
          if (res.success && res.data) {
            this._accessToken.set(res.data.accessToken);
            this._currentUser.set(res.data.user);
          }
        }),
        // Map to just the access token string for the interceptor
        catchError(err => {
          this.clearSession();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        }),
      ) as unknown as Observable<string>;
  }

  /** Returns the current in-memory access token. Used by the auth interceptor. */
  getAccessToken(): string | null {
    return this._accessToken();
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/reset-password`, request);
  }

  private clearSession(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
}
