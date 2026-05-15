import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
    MatButtonToggleModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <div class="max-w-2xl mx-auto">

        <!-- Header -->
        <div class="mb-6">
          <h1 class="font-display text-2xl font-bold text-slate-900">Notifications</h1>
          <p class="text-sm text-slate-500 mt-0.5">Stay on top of your activity</p>
        </div>

        <!-- Skeleton -->
        @if (isLoading()) {
          <div class="space-y-2">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <div class="bg-white rounded-lg border-l-4 border-l-slate-200 p-4 flex items-start gap-3 animate-pulse">
                <div class="w-2 h-2 rounded-full bg-slate-200 mt-2 shrink-0"></div>
                <div class="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                <div class="flex-1 space-y-2 pt-0.5">
                  <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div class="h-3 bg-slate-200 rounded w-full"></div>
                  <div class="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
              @if (i < 5) {
                <div class="border-b border-slate-100"></div>
              }
            }
          </div>

        <!-- Error -->
        } @else if (errorMessage()) {
          <div class="lms-card text-center py-12">
            <mat-icon class="text-red-400" style="font-size:2.5rem;width:2.5rem;height:2.5rem">error_outline</mat-icon>
            <p class="text-red-600 mt-3">{{ errorMessage() }}</p>
          </div>

        <!-- Main content -->
        } @else {

          <!-- Action bar -->
          <div class="flex items-center justify-between gap-4 flex-wrap mb-4">
            <mat-button-toggle-group #filter="matButtonToggleGroup" value="all" hideSingleSelectionIndicator>
              <mat-button-toggle value="all" class="min-h-[44px]">All</mat-button-toggle>
              <mat-button-toggle value="unread" class="min-h-[44px]">
                <span class="flex items-center gap-1.5">
                  Unread
                  @if (unreadCount() > 0) {
                    <span class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full leading-none">
                      {{ unreadCount() }}
                    </span>
                  }
                </span>
              </mat-button-toggle>
              <mat-button-toggle value="urgent" class="min-h-[44px]">High Priority</mat-button-toggle>
            </mat-button-toggle-group>

            @if (unreadCount() > 0) {
              <button mat-stroked-button (click)="markAllAsRead()" class="min-h-[44px]">
                Mark All as Read
              </button>
            }
          </div>

          <!-- Notification list -->
          <div class="space-y-2">
            @for (n of notifications(); track n.id) {
              @if (
                filter.value === 'all' ||
                (filter.value === 'unread' && !n.isRead) ||
                (filter.value === 'urgent' && n.priority === 'Urgent')
              ) {
                <div
                  class="rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 relative overflow-hidden"
                  [class.bg-red-50]="n.priority === 'Urgent' && !n.isRead"
                  [class.border-l-red-500]="n.priority === 'Urgent' && !n.isRead"
                  [class.bg-blue-50]="!n.isRead && n.priority !== 'Urgent'"
                  [class.border-l-blue-600]="!n.isRead && n.priority !== 'Urgent'"
                  [class.bg-white]="n.isRead"
                  [class.border-l-transparent]="n.isRead"
                  (click)="markAsRead(n)">
                  <div class="flex items-start gap-3 p-4">

                    <!-- Dot indicator (always reserves space) -->
                    <div class="mt-2 shrink-0 w-2 h-2">
                      @if (!n.isRead && n.priority === 'Urgent') {
                        <div class="w-2 h-2 rounded-full bg-red-500"></div>
                      } @else if (!n.isRead) {
                        <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                      }
                    </div>

                    <!-- Avatar initial -->
                    <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center shrink-0">
                      {{ (n.title[0] || 'S').toUpperCase() }}
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-slate-900 text-sm leading-snug">{{ n.title }}</p>
                      <p class="text-sm text-slate-600 line-clamp-2 mt-0.5">{{ n.body }}</p>
                      <p class="text-xs text-slate-400 mt-1">{{ n.createdAt | date:'MMM d, h:mm a' }}</p>
                    </div>

                    <!-- Right: badge + mark-as-read -->
                    <div class="shrink-0 flex flex-col items-end gap-2">
                      @if (n.priority === 'Urgent') {
                        <span class="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Urgent</span>
                      } @else if (n.priority === 'Important') {
                        <span class="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">Important</span>
                      }
                      @if (!n.isRead) {
                        <button
                          class="text-xs text-blue-600 hover:text-blue-800 min-h-[44px] flex items-center"
                          (click)="$event.stopPropagation(); markAsRead(n)">
                          Mark as Read
                        </button>
                      }
                    </div>

                  </div>
                </div>
              }
            }

            <!-- Empty state: All -->
            @if (filter.value === 'all' && notifications().length === 0) {
              <div class="text-center py-16">
                <mat-icon class="text-green-400" style="font-size:3rem;width:3rem;height:3rem">check_circle</mat-icon>
                <p class="font-display text-xl text-slate-900 mt-4">You're all caught up</p>
                <p class="text-slate-500 text-sm mt-1">No notifications yet</p>
              </div>
            }

            <!-- Empty state: Unread -->
            @if (filter.value === 'unread' && unreadCount() === 0) {
              <div class="text-center py-16">
                <mat-icon class="text-slate-300" style="font-size:3rem;width:3rem;height:3rem">notifications_none</mat-icon>
                <p class="text-slate-500 mt-4">No unread notifications</p>
              </div>
            }

            <!-- Empty state: Urgent -->
            @if (filter.value === 'urgent' && urgentCount() === 0) {
              <div class="text-center py-16">
                <mat-icon class="text-slate-300" style="font-size:3rem;width:3rem;height:3rem">notifications_none</mat-icon>
                <p class="text-slate-500 mt-4">No urgent notifications</p>
              </div>
            }
          </div>

        }

      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);
  readonly urgentCount = computed(() => this.notifications().filter(n => n.priority === 'Urgent').length);

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
