import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '@core/services/notification.service';
import { Notification, NotificationPriority } from '@shared/models/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatBadgeModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <h1 class="section-title flex items-center gap-2">
          Notifications
          @if (unreadCount() > 0) {
            <span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-blue-500 rounded-full">
              {{ unreadCount() }}
            </span>
          }
        </h1>
        @if (unreadCount() > 0) {
          <button mat-stroked-button (click)="markAllAsRead()">
            Mark all as read
          </button>
        }
      </div>

      @if (isLoading()) {
        <div class="flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>
      } @else if (errorMessage()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-red-400 mb-3">error_outline</mat-icon>
          <p class="text-red-600">{{ errorMessage() }}</p>
        </div>
      } @else if (notifications().length === 0) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-slate-300 mb-3" style="font-size:2.5rem;width:2.5rem;height:2.5rem">notifications_none</mat-icon>
          <p class="text-slate-500">No notifications.</p>
        </div>
      } @else {
        <ul class="space-y-2">
          @for (n of notifications(); track n.id) {
            <li
              (click)="markAsRead(n)"
              [class.bg-blue-50]="!n.isRead"
              [class.border-blue-200]="!n.isRead"
              class="lms-card border border-transparent cursor-pointer hover:shadow-md transition-all">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <p [class.font-semibold]="!n.isRead" class="text-slate-800">{{ n.title }}</p>
                  <p class="text-sm text-slate-500 mt-0.5">{{ n.body }}</p>
                  <p class="text-xs text-slate-400 mt-1">{{ n.createdAt | date:'medium' }}</p>
                </div>
                <div class="shrink-0 flex flex-col items-end gap-2">
                  <span [class]="priorityClass(n.priority)" class="text-xs font-medium px-2 py-0.5 rounded-full">
                    {{ n.priority }}
                  </span>
                  @if (!n.isRead) {
                    <span class="w-2 h-2 rounded-full bg-blue-500 mt-1"></span>
                  }
                </div>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) return;
    this.notifications.update(list =>
      list.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => this.loadNotifications(),
      error: () => {
        this.notifications.update(list =>
          list.map(n => n.id === notification.id ? { ...n, isRead: false } : n)
        );
        this.snackBar.open('Failed to mark notification as read.', 'Dismiss', { duration: 3000 });
      },
    });
  }

  markAllAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.loadNotifications(),
      error: () => {
        this.loadNotifications();
        this.snackBar.open('Failed to mark all notifications as read.', 'Dismiss', { duration: 3000 });
      },
    });
  }

  priorityClass(priority: NotificationPriority): string {
    switch (priority) {
      case 'Urgent':    return 'bg-red-100 text-red-700';
      case 'Important': return 'bg-amber-100 text-amber-700';
      default:          return 'bg-slate-100 text-slate-600';
    }
  }

  private loadNotifications(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.notificationService.getMyNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.notifications.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load notifications.');
          this.isLoading.set(false);
        },
      });
  }
}
