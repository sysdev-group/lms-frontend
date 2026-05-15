import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResult } from '@shared/models/api-response.model';
import { Course, CourseQueryParams, CreateCourseRequest, UpdateCourseRequest } from '@shared/models/models';

/** Service for course API operations. */
@Injectable({ providedIn: 'root' })
export class CourseService {
  constructor(private api: ApiService) {}

  /** Get the paginated list of courses. */
  getCourses(params?: CourseQueryParams): Observable<PaginatedResult<Course>> {
    return this.api.get<PaginatedResult<Course>>('/courses', this.toQueryParams(params));
  }

  /** Get a single course by its ID. */
  getCourseById(id: string): Observable<Course> {
    return this.api.get<Course>(`/courses/${id}`);
  }

  /** Create a new course. */
  createCourse(request: CreateCourseRequest): Observable<Course> {
    return this.api.post<Course>('/courses', request);
  }

  /** Update a course. */
  updateCourse(id: string, request: UpdateCourseRequest): Observable<Course> {
    return this.api.put<Course>(`/courses/${id}`, request);
  }

  /** Get the semester ID for a course — used by enrollment form auto-fill. */
  getCourseSemesterId(id: string): Observable<string> {
    return this.api.get<string>(`/courses/${id}/semester-id`);
  }

  private toQueryParams(params?: CourseQueryParams): Record<string, string | number | boolean> | undefined {
    if (!params) {
      return undefined;
    }

    const queryParams: Record<string, string | number | boolean> = {};
    if (params.search) {
      queryParams['search'] = params.search;
    }
    if (params.semesterId) {
      queryParams['semesterId'] = params.semesterId;
    }
    if (params.isArchived !== undefined) {
      queryParams['isArchived'] = params.isArchived;
    }
    if (params.page !== undefined) {
      queryParams['page'] = params.page;
    }
    if (params.pageSize !== undefined) {
      queryParams['pageSize'] = params.pageSize;
    }

    return queryParams;
  }
}
