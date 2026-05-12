import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '@core/services/user.service';
import { User, UserRole, UserQueryParams } from '@shared/models/models';

/**
 * Admin-only user list page — Section 7.3.
 * Displays a paginated, filterable table of all users.
 * Filters: search (name/email), role, active status.
 * Row actions: edit (navigates to detail), deactivate.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">

      <!-- Header -->
      <h1 class="section-title">Users</h1>

      <!-- Filters -->
      <div class="lms-card mb-4">
        <form [formGroup]="filterForm" class="flex flex-col sm:flex-row gap-3">

          <mat-form-field appearance="outline" class="flex-1 min-w-0">
            <mat-label>Search</mat-label>
            <input matInput formControlName="search" placeholder="Name or email..." />
            <mat-icon matPrefix class="mr-2 text-slate-400">search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="sm:w-44">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="">All roles</mat-option>
              <mat-option value="Student">Student</mat-option>
              <mat-option value="Lecturer">Lecturer</mat-option>
              <mat-option value="Admin">Admin</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="sm:w-40">
            <mat-label>Status</mat-label>
            <mat-select formControlName="isActive">
              <mat-option value="">All</mat-option>
              <mat-option value="true">Active</mat-option>
              <mat-option value="false">Inactive</mat-option>
            </mat-select>
          </mat-form-field>

        </form>
      </div>

      <!-- Table card -->
      <div class="lms-card p-0 overflow-hidden">

        <!-- Loading -->
        @if (isLoading()) {
          <div class="flex justify-center py-16">
            <mat-spinner diameter="40" />
          </div>
        }

        <!-- Empty state -->
        @if (!isLoading() && users().length === 0) {
          <div class="text-center py-16">
            <mat-icon class="!text-5xl text-slate-300 mb-3 block">people</mat-icon>
            <p class="text-slate-500 font-medium">No users found</p>
            <p class="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        }

        <!-- Table -->
        @if (!isLoading() && users().length > 0) {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="users()" class="w-full">

              <!-- Name column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef class="!pl-6 font-semibold text-slate-700 bg-slate-50">Name</th>
                <td mat-cell *matCellDef="let user" class="!pl-6">
                  <div class="flex items-center gap-3 py-1">
                    <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span class="text-primary-700 text-xs font-semibold">
                        {{ user.firstName[0] }}{{ user.lastName[0] }}
                      </span>
                    </div>
                    <span class="font-medium text-slate-800">{{ user.firstName }} {{ user.lastName }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Email column — hidden on mobile -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef class="font-semibold text-slate-700 bg-slate-50 hidden sm:table-cell">Email</th>
                <td mat-cell *matCellDef="let user" class="text-slate-600 text-sm hidden sm:table-cell">
                  {{ user.email }}
                </td>
              </ng-container>

              <!-- Role column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef class="font-semibold text-slate-700 bg-slate-50">Role</th>
                <td mat-cell *matCellDef="let user">
                  <span [class]="roleBadgeClass(user.role)">{{ user.role }}</span>
                </td>
              </ng-container>

              <!-- Status column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="font-semibold text-slate-700 bg-slate-50">Status</th>
                <td mat-cell *matCellDef="let user">
                  @if (user.isActive) {
                    <span class="badge badge-success">Active</span>
                  } @else {
                    <span class="badge badge-danger">Inactive</span>
                  }
                </td>
              </ng-container>

              <!-- Actions column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="!pr-4 bg-slate-50"></th>
                <td mat-cell *matCellDef="let user" class="!pr-4">
                  <div class="flex items-center justify-end gap-1">
                    <button mat-icon-button
                      matTooltip="Edit user"
                      (click)="$event.stopPropagation(); editUser(user)"
                      aria-label="Edit user">
                      <mat-icon class="text-slate-500">edit</mat-icon>
                    </button>
                    @if (user.isActive) {
                      <button mat-icon-button color="warn"
                        matTooltip="Deactivate user"
                        (click)="$event.stopPropagation(); onDeactivateClick(user)"
                        aria-label="Deactivate user">
                        <mat-icon>person_off</mat-icon>
                      </button>
                    }
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="hover:bg-slate-50 transition-colors cursor-pointer"
                (click)="editUser(row)">
              </tr>

            </table>
          </div>

          <!-- Paginator -->
          <mat-paginator
            [length]="totalCount()"
            [pageSize]="pageSize()"
            [pageIndex]="page()"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            class="border-t border-slate-200"
            aria-label="Select page" />
        }

      </div>
    </div>
  `,
})
export class UserListComponent implements OnInit {
  users = signal<User[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  page = signal(0);
  pageSize = signal(10);

  filterForm: FormGroup;
  readonly displayedColumns = ['name', 'email', 'role', 'status', 'actions'];

  constructor(
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      role: [''],
      isActive: [''],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.page.set(0);
      this.loadUsers();
    });
  }

  loadUsers(): void {
    const { search, role, isActive } = this.filterForm.value;
    const params: Record<string, string | number | boolean> = {
      page: this.page() + 1,  // paginator is 0-indexed; API is 1-indexed
      pageSize: this.pageSize(),
    };
    if (search?.trim()) params['search'] = search.trim();
    if (role) params['role'] = role;
    if (isActive !== '') params['isActive'] = isActive === 'true';

    this.isLoading.set(true);
    this.userService.getUsers(params as unknown as UserQueryParams).subscribe({
      next: result => {
        this.users.set(result.items);
        this.totalCount.set(result.totalCount);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  editUser(user: User): void {
    this.router.navigate(['/users', user.id]);
  }

  onDeactivateClick(user: User): void {
    const name = `${user.firstName} ${user.lastName}`;
    if (!window.confirm(`Deactivate ${name}?\n\nThey will no longer be able to log in.`)) {
      return;
    }
    this.userService.deactivateUser(user.id).subscribe({
      next: () => this.loadUsers(),
    });
  }

  roleBadgeClass(role: UserRole): string {
    const map: Record<UserRole, string> = {
      Admin:    'badge badge-info',
      Lecturer: 'badge badge-warning',
      Student:  'badge badge-success',
    };
    return map[role] ?? 'badge badge-neutral';
  }
}
