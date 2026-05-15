import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Course, CreateProgrammeRequest, Programme, ProgrammeList } from '@shared/models/models';

@Injectable({ providedIn: 'root' })
export class ProgrammeService {
  constructor(private api: ApiService) {}

  getAll(): Observable<ProgrammeList[]> {
    return this.api.get<ProgrammeList[]>('/programmes');
  }

  getById(id: string): Observable<Programme> {
    return this.api.get<Programme>(`/programmes/${id}`);
  }

  getCourses(programmeId: string): Observable<Course[]> {
    return this.api.get<Course[]>(`/programmes/${programmeId}/courses`);
  }

  create(request: CreateProgrammeRequest): Observable<Programme> {
    return this.api.post<Programme>('/programmes', request);
  }
}
