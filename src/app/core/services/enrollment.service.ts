import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { environment } from '@env/environment';
import { Enrollment, EnrollStudentRequest } from '@shared/models/models';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  enroll(request: EnrollStudentRequest): Observable<Enrollment> {
    return this.api.post<Enrollment>('/enrollment', request);
  }

  drop(enrollmentId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/enrollment/${enrollmentId}`);
  }

  getStudentEnrollments(studentId: string): Observable<Enrollment[]> {
    return this.api.get<Enrollment[]>(`/enrollment/student/${studentId}`);
  }
}
