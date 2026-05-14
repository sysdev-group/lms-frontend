import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Grade, GradeSubmissionRequest } from '@shared/models/models';

/**
 * Grade service — Section 7.6 and Section 27 (Grading Module).
 *
 * Routes:
 *   GET  /grades/course/:id        — all grades for a course (Lecturer/Admin)
 *   GET  /grades/student/:id       — all grades for a student
 *   PUT  /grades/:submissionId     — grade a submission (Lecturer)
 *   POST /grades/:id/publish       — publish a grade (Lecturer)
 */
@Injectable({ providedIn: 'root' })
export class GradeService {
  constructor(private api: ApiService) {}

  /**
   * Fetch all grades for a given course. Lecturer and Admin roles required.
   * @param courseId The course UUID whose grades to retrieve.
   */
  getGradesByCourse(courseId: string): Observable<Grade[]> {
    return this.api.get<Grade[]>(`/grades/course/${courseId}`);
  }

  /**
   * Fetch all grades for a specific student.
   * Pass the literal string `'me'` to resolve the authenticated user's identity from the JWT.
   * @param studentId The student UUID, or `'me'` for the current user.
   */
  getGradesByStudent(studentId: string): Observable<Grade[]> {
    return this.api.get<Grade[]>(`/grades/student/${studentId}`);
  }

  /**
   * Grade a submission. Lecturer role required.
   * @param submissionId The submission UUID to grade.
   * @param request Grading payload — marksAwarded (required) and optional feedback.
   */
  gradeSubmission(submissionId: string, request: GradeSubmissionRequest): Observable<Grade> {
    return this.api.put<Grade>(`/grades/${submissionId}`, request);
  }

  /**
   * Publish a grade, making it visible to the student. Lecturer role required.
   * @param gradeId The grade UUID to publish.
   */
  publishGrade(gradeId: string): Observable<void> {
    return this.api.post<void>(`/grades/${gradeId}/publish`, {});
  }
}
