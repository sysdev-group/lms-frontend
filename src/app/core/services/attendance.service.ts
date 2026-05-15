import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  AttendanceRecord,
  MarkAttendanceRequest,
  StudentAttendanceSummary,
} from '@shared/models/models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(private api: ApiService) {}

  getStudentSummary(studentId: string): Observable<StudentAttendanceSummary[]> {
    return this.api.get<StudentAttendanceSummary[]>(`/attendance/student/${studentId}`);
  }

  getSessionRecords(sessionId: string): Observable<AttendanceRecord[]> {
    return this.api.get<AttendanceRecord[]>(`/attendance/session/${sessionId}`);
  }

  markAttendance(request: MarkAttendanceRequest): Observable<void> {
    return this.api.post<void>(`/attendance/session/${request.timetableSessionId}`, request);
  }
}
