import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  Submission,
  GradeSubmissionRequest,
} from '@shared/models/models';

/**
 * Assignment service — Section 7.5 (Assignment Module) and Section 25.5 (API routes).
 *
 * Routes:
 *   GET  /assignments                    — list all assignments, optionally filtered by courseId
 *   GET  /assignments/:id                — single assignment by ID
 *   POST /assignments                    — create an assignment (Lecturer only)
 *   PUT  /assignments/:id                — update an assignment (Lecturer only)
 *   PUT  /assignments/:submissionId/grade — grade a submission (Lecturer only)
 *
 * Previously the assignment list method was named getAssignmentsByCourse with a required
 * courseId parameter. It is now getAssignments with an optional courseId so the same
 * method covers both the "all assignments" and "by course" use cases.
 */
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  constructor(private api: ApiService) {}

  /**
   * Fetch all assignments, optionally scoped to a single course.
   * Replaces the stub's getAssignmentsByCourse — courseId is now optional so
   * callers can retrieve all assignments without filtering.
   * @param courseId Optional course ID to filter results.
   */
  getAssignments(courseId?: string): Observable<Assignment[]> {
    const params: Record<string, string> | undefined = courseId ? { courseId } : undefined;
    return this.api.get<Assignment[]>('/assignments', params);
  }

  /**
   * Fetch a single assignment by its ID.
   * @param id The assignment UUID.
   */
  getAssignmentById(id: string): Observable<Assignment> {
    return this.api.get<Assignment>(`/assignments/${id}`);
  }

  /**
   * Create a new assignment. Lecturer role required.
   * @param request Assignment creation payload.
   */
  createAssignment(request: CreateAssignmentRequest): Observable<Assignment> {
    return this.api.post<Assignment>('/assignments', request);
  }

  /**
   * Update an existing assignment. Lecturer role required.
   * @param id The assignment UUID to update.
   * @param request Fields to update.
   */
  updateAssignment(id: string, request: UpdateAssignmentRequest): Observable<Assignment> {
    return this.api.put<Assignment>(`/assignments/${id}`, request);
  }

  /**
   * Grade a student submission. Lecturer role required.
   *
   * Route: PUT /assignments/:submissionId/grade (Section 25.5).
   * The path segment is the submission UUID — the route is namespaced under
   * /assignments because grading is an assignment-owned action, but the ID
   * passed here identifies the specific submission being graded, not the
   * parent assignment.
   *
   * @param submissionId The submission UUID to grade.
   * @param request Marks and optional feedback.
   */
  gradeSubmission(submissionId: string, request: GradeSubmissionRequest): Observable<Submission> {
    return this.api.put<Submission>(`/assignments/${submissionId}/grade`, request);
  }
}
