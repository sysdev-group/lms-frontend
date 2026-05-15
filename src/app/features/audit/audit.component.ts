import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuditService } from '@core/services/audit.service';
import { AuditLog, AuditLogQueryParams } from '@shared/models/models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-container">

      <!-- Page header -->
      <div class="mb-6">
        <h1 class="font-display text-2xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
        <p class="text-slate-500 mt-1 text-sm">System activity and security events</p>
      </div>

      <!-- ─── SKELETON ─── -->
      @if (isLoading()) {

        <!-- Tile skeletons -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          @for (i of [1,2,3,4]; track i) {
            <div class="lms-card min-h-[88px] animate-pulse">
              <div class="h-8 w-14 bg-slate-200 rounded mb-3"></div>
              <div class="h-2.5 w-28 bg-slate-100 rounded"></div>
            </div>
          }
        </div>

        <!-- Filter skeleton -->
        <div class="lms-card mb-4 animate-pulse">
          <div class="flex gap-3 flex-wrap">
            <div class="h-14 flex-1 min-w-[200px] bg-slate-100 rounded-lg"></div>
            <div class="h-14 w-44 bg-slate-100 rounded-lg"></div>
            <div class="h-10 w-28 bg-slate-200 rounded-lg self-end"></div>
            <div class="h-10 w-20 bg-slate-100 rounded-lg self-end"></div>
          </div>
        </div>

        <!-- Row skeletons -->
        <div class="lms-card p-0 overflow-hidden">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="flex items-start gap-4 px-6 py-4 border-b border-slate-100 last:border-0">
              <div class="w-9 h-9 rounded-full bg-slate-200 animate-pulse flex-shrink-0"></div>
              <div class="flex-1 min-w-0 space-y-2">
                <div class="flex justify-between gap-4">
                  <div class="h-4 bg-slate-200 rounded animate-pulse w-32"></div>
                  <div class="h-3 bg-slate-100 rounded animate-pulse w-28"></div>
                </div>
                <div class="h-3 bg-slate-100 rounded animate-pulse w-48"></div>
                <div class="h-3 bg-slate-100 rounded animate-pulse w-36"></div>
              </div>
            </div>
          }
        </div>

      }

      <!-- ─── LOADED CONTENT ─── -->
      @if (!isLoading()) {

        <!-- Summary tiles -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <!-- Total Events — blue -->
          <div class="lms-card relative overflow-hidden hover:shadow-md transition-shadow min-h-[88px]">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"></div>
            <div class="pl-1">
              <p class="font-display text-3xl font-bold text-slate-900">{{ totalCount() }}</p>
              <p class="text-xs text-slate-500 uppercase tracking-wide mt-1.5">Total Events</p>
            </div>
          </div>

          <!-- Events Today — amber -->
          <div class="lms-card relative overflow-hidden hover:shadow-md transition-shadow min-h-[88px]">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl"></div>
            <div class="pl-1">
              <p class="font-display text-3xl font-bold text-slate-900">{{ eventsToday }}</p>
              <p class="text-xs text-slate-500 uppercase tracking-wide mt-1.5">Events Today</p>
            </div>
          </div>

          <!-- Failed / Destructive — red -->
          <div class="lms-card relative overflow-hidden hover:shadow-md transition-shadow min-h-[88px]">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl"></div>
            <div class="pl-1">
              <p class="font-display text-3xl font-bold text-slate-900">{{ failedLoginCount }}</p>
              <p class="text-xs text-slate-500 uppercase tracking-wide mt-1.5">Failed Logins</p>
            </div>
          </div>

          <!-- Most Active User — violet -->
          <div class="lms-card relative overflow-hidden hover:shadow-md transition-shadow min-h-[88px]">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l-xl"></div>
            <div class="pl-1">
              <p class="font-display text-xl font-bold text-slate-900 truncate leading-tight mt-1">
                {{ mostActiveUser }}
              </p>
              <p class="text-xs text-slate-500 uppercase tracking-wide mt-1.5">Most Active User</p>
            </div>
          </div>

        </div>

        <!-- Filter card -->
        <div class="lms-card mb-4">
          <form [formGroup]="filterForm">

            <div class="flex flex-col sm:flex-row gap-3 mb-3">

              <mat-form-field appearance="outline" class="flex-1 min-w-0">
                <mat-icon matPrefix class="text-slate-400 mr-1">search</mat-icon>
                <input matInput formControlName="userSearch"
                  placeholder="Search by user or action..." />
              </mat-form-field>

              <mat-form-field appearance="outline" class="sm:w-52">
                <mat-label>Action type</mat-label>
                <mat-select formControlName="actionType">
                  <mat-option value="">All</mat-option>
                  @for (opt of actionOptions; track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <button mat-flat-button color="primary" type="button"
                class="min-h-[44px]"
                (click)="loadLogs()">
                Apply Filters
              </button>
              <button mat-stroked-button type="button"
                class="min-h-[44px]"
                (click)="clearFilters()">
                Clear
              </button>
            </div>

            <!-- Active filter chips -->
            @if (activeFilters.length > 0) {
              <div class="mt-3">
                <mat-chip-set>
                  @for (f of activeFilters; track f.key) {
                    <mat-chip (removed)="removeFilter(f.key)">
                      {{ f.label }}: {{ f.value }}
                      <button matChipRemove aria-label="Remove filter">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </mat-chip>
                  }
                </mat-chip-set>
              </div>
            }

          </form>
        </div>

        <!-- Color legend -->
        <div class="flex items-center gap-4 mb-4 flex-wrap">
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span class="text-xs text-slate-500">Read actions</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <span class="text-xs text-slate-500">Write actions</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span class="text-xs text-slate-500">Delete &amp; Auth failures</span>
          </div>
        </div>

        <!-- Error state -->
        @if (errorMessage()) {
          <div class="lms-card mb-4 flex flex-col items-center py-10 gap-3">
            <mat-icon class="!text-4xl text-red-400">error_outline</mat-icon>
            <p class="text-slate-700 font-semibold">Something went wrong</p>
            <p class="text-sm text-slate-400">{{ errorMessage() }}</p>
            <button mat-stroked-button class="mt-1" (click)="loadLogs()">Try again</button>
          </div>
        }

        <!-- Audit feed -->
        @if (!errorMessage() && logs().length > 0) {
          <div class="lms-card p-0 overflow-hidden">

            @for (log of logs(); track log.id) {
              <div class="border-b border-slate-100 last:border-0">

                <!-- Row -->
                <div class="flex items-start gap-4 px-5 py-4 hover:bg-slate-50
                  transition-colors cursor-pointer border-l-4"
                  [style.borderLeftColor]="getActionColor(log.action)"
                  (click)="toggleLog(log.id)">

                  <!-- Avatar -->
                  <div class="w-9 h-9 rounded-full bg-slate-200 flex items-center
                    justify-center flex-shrink-0 text-sm font-semibold text-slate-600 select-none">
                    {{ getInitial(log.userFullName) }}
                  </div>

                  <!-- Body -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-semibold text-slate-900 text-sm">
                          {{ log.userFullName ?? 'System' }}
                        </span>
                      </div>
                      <div class="text-right flex-shrink-0">
                        <p class="text-xs text-slate-400 whitespace-nowrap">
                          {{ formatTimestamp(log.timestamp) }}
                        </p>
                        <p class="text-xs text-slate-400">({{ getRelativeTime(log.timestamp) }})</p>
                      </div>
                    </div>
                    <p class="text-sm text-slate-700 mt-0.5">{{ formatAction(log.action) }}</p>
                    @if (log.entityType) {
                      <p class="text-xs text-slate-500 mt-0.5 font-mono">
                        {{ log.entityType }}{{ log.entityId ? ': #' + log.entityId.slice(0, 8) : '' }}
                      </p>
                    }
                  </div>

                  <!-- Expand chevron -->
                  <mat-icon
                    class="text-slate-400 flex-shrink-0 transition-transform duration-200 text-[20px] mt-0.5"
                    [class.rotate-180]="expandedLogId() === log.id">
                    expand_more
                  </mat-icon>

                </div>

                <!-- Expanded JSON detail -->
                @if (expandedLogId() === log.id) {
                  <div class="px-5 pb-4 bg-slate-50 border-l-4"
                    [style.borderLeftColor]="getActionColor(log.action)">
                    <div class="bg-slate-900 rounded-lg p-3 mt-1">
                      <pre class="text-green-400 font-mono text-xs whitespace-pre-wrap
                        overflow-auto max-h-52 leading-relaxed">{{ formatLogAsJson(log) }}</pre>
                    </div>
                  </div>
                }

              </div>
            }

          </div>

          <mat-paginator
            [length]="totalCount()"
            [pageSize]="pageSize()"
            [pageIndex]="page()"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (page)="onPageChange($event)"
            class="mt-1 border border-slate-200 rounded-xl bg-white"
            aria-label="Select page" />
        }

        <!-- Empty state -->
        @if (!errorMessage() && logs().length === 0) {
          <div class="lms-card flex flex-col items-center justify-center py-16 gap-3">
            <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <mat-icon class="!text-3xl text-slate-400">history</mat-icon>
            </div>
            <p class="font-semibold text-slate-700">No audit events match your filters</p>
            <p class="text-sm text-slate-400">Try adjusting your search or clearing the filters</p>
            <button mat-stroked-button class="mt-2 min-h-[44px]" (click)="clearFilters()">
              Clear Filters
            </button>
          </div>
        }

      }

    </div>
  `,
})
export class AuditComponent {
  private readonly auditService = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  logs = signal<AuditLog[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  totalCount = signal(0);
  page = signal(0);
  pageSize = signal(25);
  expandedLogId = signal<string | null>(null);

  filterForm = this.fb.group({
    actionType: [''],
    entityType: [''],
    userSearch: [''],
    dateFrom: [null as Date | null],
    dateTo: [null as Date | null],
  });

  readonly displayedColumns = ['timestamp', 'user', 'action', 'entity', 'ipAddress'];

  readonly actionOptions: { value: string; label: string }[] = [
    { value: 'UserCreated',       label: 'User Created' },
    { value: 'UserUpdated',       label: 'User Updated' },
    { value: 'UserDeactivated',   label: 'User Deactivated' },
    { value: 'CourseCreated',     label: 'Course Created' },
    { value: 'CourseUpdated',     label: 'Course Updated' },
    { value: 'CourseArchived',    label: 'Course Archived' },
    { value: 'AssignmentCreated', label: 'Assignment Created' },
    { value: 'AssignmentUpdated', label: 'Assignment Updated' },
    { value: 'SubmissionCreated', label: 'Submission Created' },
    { value: 'SubmissionGraded',  label: 'Submission Graded' },
    { value: 'EnrollmentCreated', label: 'Enrollment Created' },
    { value: 'EnrollmentDropped', label: 'Enrollment Dropped' },
    { value: 'Login',             label: 'Login' },
    { value: 'Logout',            label: 'Logout' },
  ];

  readonly entityTypeOptions: string[] = [
    'User', 'Course', 'Assignment', 'Submission',
    'Enrollment', 'TimetableSession', 'Notification',
  ];

  constructor() {
    this.loadLogs();
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.page.set(0);
      this.loadLogs();
    });
  }

  // ─── Summary tile getters (derived from current page data) ────────────────

  get eventsToday(): number {
    const today = new Date().toDateString();
    return this.logs().filter(l => new Date(l.timestamp).toDateString() === today).length;
  }

  get failedLoginCount(): number {
    return this.logs().filter(l => {
      const a = l.action.toLowerCase();
      return a.includes('deactivat') || a.includes('fail') || a.includes('denied') ||
             a.includes('drop') || a.includes('archive');
    }).length;
  }

  get mostActiveUser(): string {
    const counts: Record<string, number> = {};
    for (const log of this.logs()) {
      if (log.userFullName) counts[log.userFullName] = (counts[log.userFullName] ?? 0) + 1;
    }
    const entries = Object.entries(counts);
    if (!entries.length) return '—';
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }

  // ─── Active filter chips ──────────────────────────────────────────────────

  get activeFilters(): { key: string; label: string; value: string }[] {
    const { actionType, entityType, userSearch } = this.filterForm.value;
    const filters: { key: string; label: string; value: string }[] = [];
    if (actionType) filters.push({ key: 'actionType', label: 'Action', value: this.formatAction(actionType) });
    if (entityType) filters.push({ key: 'entityType', label: 'Entity', value: entityType });
    if (userSearch?.trim()) filters.push({ key: 'userSearch', label: 'User', value: userSearch });
    return filters;
  }

  removeFilter(key: string): void {
    this.filterForm.get(key)?.setValue('');
    this.page.set(0);
    this.loadLogs();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      actionType: '', entityType: '', userSearch: '', dateFrom: null, dateTo: null,
    });
    this.page.set(0);
    this.loadLogs();
  }

  // ─── Row expand/collapse ─────────────────────────────────────────────────

  toggleLog(id: string): void {
    this.expandedLogId.set(this.expandedLogId() === id ? null : id);
  }

  // ─── Display helpers ─────────────────────────────────────────────────────

  getActionColor(action: string): string {
    const a = action.toLowerCase();
    if (a.includes('deactivat') || a.includes('delete') || a.includes('drop') ||
        a.includes('archive') || a.includes('denied') || a.includes('fail'))
      return '#ef4444';
    if (a.includes('create') || a.includes('update') || a.includes('login') ||
        a.includes('logout') || a.includes('grade') || a.includes('enroll') || a.includes('submit'))
      return '#f59e0b';
    return '#22c55e';
  }

  getRelativeTime(timestamp: string): string {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }

  getInitial(name: string | null): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  formatLogAsJson(log: AuditLog): string {
    return JSON.stringify(log, null, 2);
  }

  // ─── Existing methods (unchanged) ────────────────────────────────────────

  loadLogs(): void {
    const { actionType, entityType, userSearch, dateFrom, dateTo } = this.filterForm.value;
    const params: AuditLogQueryParams = {
      page: this.page() + 1,
      pageSize: this.pageSize(),
    };
    if (actionType) params.actionType = actionType;
    if (entityType) params.entityType = entityType;
    if (userSearch?.trim()) params.userId = userSearch.trim();
    if (dateFrom) params.dateFrom = (dateFrom as Date).toISOString().split('T')[0];
    if (dateTo) params.dateTo = (dateTo as Date).toISOString().split('T')[0];

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.auditService.getLogs(params).subscribe({
      next: result => {
        this.logs.set(result.items);
        this.totalCount.set(result.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Unable to load activity log. Please try again.');
        this.isLoading.set(false);
        this.snackBar.open('Unable to load activity log', 'Dismiss', { duration: 5000 });
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadLogs();
  }

  formatAction(action: string): string {
    return action.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  formatTimestamp(timestamp: string): string {
    const d = new Date(timestamp);
    const date = d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
    return `${date}, ${time}`;
  }

  exportCsv(): void {
    this.snackBar.open('CSV export coming soon', 'OK', { duration: 3000 });
  }
}
