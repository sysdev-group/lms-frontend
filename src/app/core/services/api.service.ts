import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse, PaginatedResult } from '@shared/models/api-response.model';

/**
 * Base service that wraps HttpClient and handles the ApiResponse envelope.
 * All feature services inject this (or extend it) instead of HttpClient directly.
 *
 * PATTERN FOR YOUR MODULE SERVICE:
 *   @Injectable({ providedIn: 'root' })
 *   export class CourseService {
 *     constructor(private api: ApiService) {}
 *
 *     getCourses(): Observable<Course[]> {
 *       return this.api.get<Course[]>('/courses');
 *     }
 *   }
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** GET request — unwraps ApiResponse and returns data directly */
  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams })
      .pipe(map(res => this.unwrap(res)));
  }

  /** POST request */
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(map(res => this.unwrap(res)));
  }

  /** PUT request */
  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(map(res => this.unwrap(res)));
  }

  /** PATCH request */
  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body ?? {})
      .pipe(map(res => this.unwrap(res)));
  }

  /** DELETE request */
  delete<T = void>(path: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`)
      .pipe(map(res => this.unwrap(res)));
  }

  /** Unwraps the ApiResponse envelope — throws if success is false */
  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'An error occurred');
    }
    return response.data as T;
  }
}
