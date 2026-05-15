import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/auth/auth.service';
import { Grade, GradeSubmissionRequest } from '@shared/models/models';

@Injectable({ providedIn: 'root' })
export class GradeService {
  constructor(private api: ApiService, private authService: AuthService) {}

  getGradesByCourse(courseId: string): Observable<Grade[]> {
    return this.api.get<Grade[]>(`/grades/course/${courseId}`);
  }

  getGradesByStudent(studentId: string): Observable<Grade[]> {
    const resolvedId = studentId === 'me'
      ? (this.authService.currentUser()?.id ?? studentId)
      : studentId;
    return this.api.get<Grade[]>(`/grades/student/${resolvedId}`);
  }

  gradeSubmission(submissionId: string, request: GradeSubmissionRequest): Observable<Grade> {
    return this.api.put<Grade>(`/assignments/${submissionId}/grade`, request);
  }

  publishGrade(gradeId: string): Observable<void> {
    return this.api.put<void>(`/grades/${gradeId}/publish`, {});
  }
}
