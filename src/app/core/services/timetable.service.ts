import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { TimetableSession, CreateSessionRequest } from '@shared/models/models';

@Injectable({ providedIn: 'root' })
export class TimetableService {
  constructor(private api: ApiService) {}

  getSessions(courseId?: string): Observable<TimetableSession[]> {
    return this.api.get<TimetableSession[]>('/timetable', courseId ? { courseId } : undefined);
  }

  createSession(request: CreateSessionRequest): Observable<TimetableSession> {
    return this.api.post<TimetableSession>('/timetable', request);
  }

  publishSession(id: string): Observable<void> {
    return this.api.put<void>(`/timetable/${id}/publish`, {});
  }

  deleteSession(id: string): Observable<void> {
    return this.api.delete<void>(`/timetable/${id}`);
  }
}
