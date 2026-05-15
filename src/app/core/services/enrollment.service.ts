import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Enrollment, EnrollStudentRequest } from '@shared/models/models';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  constructor(private api: ApiService) {}

  enroll(request: EnrollStudentRequest): Observable<Enrollment> {
    return this.api.post<Enrollment>('/enrollment', request);
  }

  drop(enrollmentId: string): Observable<void> {
    return this.api.delete<void>(`/enrollment/${enrollmentId}`);
  }

  getStudentEnrollments(studentId: string): Observable<Enrollment[]> {
    return this.api.get<Enrollment[]>(`/enrollment/student/${studentId}`);
  }

  getCourseEnrollments(courseId: string): Observable<Enrollment[]> {
    return this.api.get<Enrollment[]>(`/enrollment/course/${courseId}`);
  }
}
