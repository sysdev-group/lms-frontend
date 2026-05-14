import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResult } from '@shared/models/api-response.model';
import { AuditLog, AuditLogQueryParams } from '@shared/models/models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly base = '/audit';

  constructor(private api: ApiService) {}

  getLogs(params?: AuditLogQueryParams): Observable<PaginatedResult<AuditLog>> {
    return this.api.get<PaginatedResult<AuditLog>>(
      this.base,
      params as unknown as Record<string, string | number | boolean>,
    );
  }
}
