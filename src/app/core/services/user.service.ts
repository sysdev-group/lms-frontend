import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResult } from '@shared/models/api-response.model';
import { User, CreateUserRequest, UpdateUserRequest, UserQueryParams } from '@shared/models/models';

/** User management service — Section 7.3. */
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  /** Fetch paginated, filtered list of users. */
  getUsers(params?: UserQueryParams): Observable<PaginatedResult<User>> {
    return this.api.get<PaginatedResult<User>>('/users', params as unknown as Record<string, string | number | boolean>);
  }

  /** Fetch a single user by ID. */
  getUserById(id: string): Observable<User> {
    return this.api.get<User>(`/users/${id}`);
  }

  /** Create a new user account. */
  createUser(request: CreateUserRequest): Observable<User> {
    return this.api.post<User>('/users', request);
  }

  /** Update user name, role, or status. */
  updateUser(id: string, request: UpdateUserRequest): Observable<User> {
    return this.api.put<User>(`/users/${id}`, request);
  }

  /** Soft-delete (deactivate) a user account. */
  deactivateUser(id: string): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }
}
