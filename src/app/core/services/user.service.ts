import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResult } from '@shared/models/api-response.model';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
  BulkImportResult,
} from '@shared/models/models';

/** Docs: Section 7.3 — User Management Module */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = '/users';

  constructor(private api: ApiService) {}

  /** Returns a paginated, filtered list of users. */
  getUsers(params?: UserQueryParams): Observable<PaginatedResult<User>> {
    return this.api.get<PaginatedResult<User>>(
      this.base,
      params as unknown as Record<string, string | number | boolean>,
    );
  }

  /** Returns a single user by ID. Throws 404 if not found. */
  getUserById(id: string): Observable<User> {
    return this.api.get<User>(`${this.base}/${id}`);
  }

  /** Creates a new user. The backend auto-generates and emails the initial password. */
  createUser(request: CreateUserRequest): Observable<User> {
    return this.api.post<User>(this.base, request);
  }

  /** Partially updates a user's profile fields. */
  updateUser(id: string, request: UpdateUserRequest): Observable<User> {
    return this.api.put<User>(`${this.base}/${id}`, request);
  }

  /** Soft-deletes (deactivates) a user — sets isActive to false on the backend. */
  deactivateUser(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/${id}`);
  }

  /** Uploads a CSV file and bulk-creates users. Returns per-row success/failure counts. */
  bulkImport(csvFile: File): Observable<BulkImportResult> {
    const formData = new FormData();
    formData.append('file', csvFile);
    return this.api.post<BulkImportResult>(`${this.base}/bulk-import`, formData);
  }
}
