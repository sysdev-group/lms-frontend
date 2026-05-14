import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Notification, SendNotificationRequest } from '@shared/models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private api: ApiService) {}

  getMyNotifications(unreadOnly = false): Observable<Notification[]> {
    return this.api.get<Notification[]>('/notifications', { unreadOnly });
  }

  send(request: SendNotificationRequest): Observable<void> {
    return this.api.post<void>('/notifications', request);
  }

  markAsRead(id: string): Observable<void> {
    return this.api.patch<void>(`/notifications/${id}/read`);
  }

  markAllAsRead(): Observable<string> {
    return this.api.patch<string>('/notifications/mark-all-read');
  }
}
