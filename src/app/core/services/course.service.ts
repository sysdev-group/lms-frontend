import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResult } from '@shared/models/api-response.model';
import { Course, CreateCourseRequest } from '@shared/models/models';

/** Service for course API operations. */
@Injectable({ providedIn: 'root' })
export class CourseService {
  constructor(private api: ApiService) {}

  /** Get the paginated list of courses. */
  getCourses(): Observable<PaginatedResult<Course>> {
    return this.api.get<PaginatedResult<Course>>('/courses');
  }

  /** Get a single course by its ID. */
  getCourseById(id: string): Observable<Course> {
    return this.api.get<Course>(`/courses/${id}`);
  }

  /** Create a new course. */
  createCourse(payload: CreateCourseRequest): Observable<Course> {
    return this.api.post<Course>('/courses', payload);
  }
}
