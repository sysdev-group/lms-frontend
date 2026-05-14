import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuditService } from '@core/services/audit.service';
import { AuditLog, AuditLogQueryParams } from '@shared/models/models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="section-title !mb-0">Activity Log</h1>
        <button mat-stroked-button color="primary" (click)="exportCsv()">
          <mat-icon>download</mat-icon>
          Export CSV
        </button>
      </div>

      <!-- Filters -->
      <div class="lms-card mb-4">
        <form [formGroup]="filterForm">

          <div class="flex flex-col sm:flex-row gap-3 mb-3">

            <mat-form-field appearance="outline" class="sm:w-52">
              <mat-label>Action Type</mat-label>
              <mat-select formControlName="actionType">
                <mat-option value="">All actions</mat-option>
                @for (opt of actionOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="sm:w-44">
              <mat-label>Entity Type</mat-label>
              <mat-select formControlName="entityType">
                <mat-option value="">All types</mat-option>
                @for (type of entityTypeOptions; track type) {
                  <mat-option [value]="type">{{ type }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1 min-w-0">
              <mat-label>Search by user</mat-label>
              <mat-icon matPrefix class="mr-2 text-slate-400">person_search</mat-icon>
              <input matInput formControlName="userSearch" placeholder="Name or user ID..." />
            </mat-form-field>

          </div>

          <div class="flex flex-col sm:flex-row gap-3">

            <mat-form-field appearance="outline" class="sm:w-52">
              <mat-label>Date From</mat-label>
              <input matInput [matDatepicker]="fromPicker" formControlName="dateFrom" readonly />
              <mat-datepicker-toggle matSuffix [for]="fromPicker" />
              <mat-datepicker #fromPicker />
            </mat-form-field>

            <mat-form-field appearance="outline" class="sm:w-52">
              <mat-label>Date To</mat-label>
              <input matInput [matDatepicker]="toPicker" formControlName="dateTo" readonly />
              <mat-datepicker-toggle matSuffix [for]="toPicker" />
              <mat-datepicker #toPicker />
            </mat-form-field>

          </div>

        </form>
      </div>

      <!-- Table card -->
      <div class="lms-card p-0 overflow-hidden">

        @if (isLoading()) {
          <div class="flex justify-center py-16">
            <mat-spinner diameter="40" />
          </div>
        }

        @if (!isLoading() && errorMessage()) {
          <div class="text-center py-16">
            <mat-icon class="!text-5xl text-red-300 mb-3 block">error_outline</mat-icon>
            <p class="text-slate-700 font-medium">Something went wrong</p>
            <p class="text-sm text-slate-400 mt-1">{{ errorMessage() }}</p>
            <button mat-stroked-button class="mt-4" (click)="loadLogs()">Try again</button>
          </div>
        }

        @if (!isLoading() && !errorMessage() && logs().length === 0) {
          <div class="text-center py-16">
            <mat-icon class="!text-5xl text-slate-300 mb-3 block">history</mat-icon>
            <p class="text-slate-500 font-medium">No activity found for the selected filters</p>
            <p class="text-sm text-slate-400 mt-1">Try adjusting your filters or date range</p>
          </div>
        }

        @if (!isLoading() && !errorMessage() && logs().length > 0) {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="logs()" class="w-full">

              <ng-container matColumnDef="timestamp">
                <th mat-header-cell *matHeaderCellDef
                  class="!pl-6 font-semibold text-slate-700 bg-slate-50 whitespace-nowrap">
                  Timestamp
                </th>
                <td mat-cell *matCellDef="let log"
                  class="!pl-6 text-slate-600 text-sm whitespace-nowrap">
                  {{ formatTimestamp(log.timestamp) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef
                  class="font-semibold text-slate-700 bg-slate-50">
                  User
                </th>
                <td mat-cell *matCellDef="let log" class="font-medium text-slate-800">
                  {{ log.userFullName ?? 'System' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef
                  class="font-semibold text-slate-700 bg-slate-50">
                  Action
                </th>
                <td mat-cell *matCellDef="let log">
                  <span class="badge badge-info">{{ formatAction(log.action) }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="entity">
                <th mat-header-cell *matHeaderCellDef
                  class="font-semibold text-slate-700 bg-slate-50">
                  Entity
                </th>
                <td mat-cell *matCellDef="let log" class="text-slate-700">
                  {{ log.entityType }}
                </td>
              </ng-container>

              <ng-container matColumnDef="ipAddress">
                <th mat-header-cell *matHeaderCellDef
                  class="!pr-6 font-semibold text-slate-700 bg-slate-50">
                  IP Address
                </th>
                <td mat-cell *matCellDef="let log" class="!pr-6">
                  <span class="text-xs text-slate-400 font-mono">
                    {{ log.ipAddress ?? '—' }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="hover:bg-slate-50 transition-colors">
              </tr>

            </table>
          </div>

          <mat-paginator
            [length]="totalCount()"
            [pageSize]="pageSize()"
            [pageIndex]="page()"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (page)="onPageChange($event)"
            class="border-t border-slate-200"
            aria-label="Select page" />
        }

      </div>

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
