import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Submission, CreateSubmissionRequest } from '@shared/models/models';

/**
 * Submission service — Section 7.5 (Assignment Module) and Section 25.5 (API routes).
 *
 * Routes:
 *   POST /submissions                        — student submits an assignment
 *   GET  /submissions/:id                    — single submission by ID
 *   GET  /submissions/assignment/:id         — all submissions for an assignment (Lecturer only)
 *   GET  /submissions/my                     — current student's own submissions
 */
@Injectable({ providedIn: 'root' })
export class SubmissionService {
  constructor(private api: ApiService) {}

  /**
   * Submit an assignment. Student role required.
   * @param request Submission payload containing assignmentId and optional fileId.
   */
  submit(request: CreateSubmissionRequest): Observable<Submission> {
    return this.api.post<Submission>('/submissions', request);
  }

  /**
   * Fetch a single submission by its ID.
   * @param id The submission UUID.
   */
  getById(id: string): Observable<Submission> {
    return this.api.get<Submission>(`/submissions/${id}`);
  }

  /**
   * Fetch all submissions for a given assignment. Lecturer role required.
   * @param assignmentId The assignment UUID whose submissions to retrieve.
   */
  getByAssignment(assignmentId: string): Observable<Submission[]> {
    return this.api.get<Submission[]>(`/submissions/assignment/${assignmentId}`);
  }

  /**
   * Fetch the current authenticated student's own submissions across all assignments.
   * Student role required — the backend resolves the identity from the JWT.
   */
  getMySubmissions(): Observable<Submission[]> {
    return this.api.get<Submission[]>('/submissions/my');
  }
}
