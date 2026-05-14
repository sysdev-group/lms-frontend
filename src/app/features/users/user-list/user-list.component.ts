import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '@core/services/feature-services';
import { User, UserRole } from '@shared/models/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">

      <!-- Page header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="section-title mb-0">Users</h1>
      </div>

      <!-- Filters -->
      <form [formGroup]="filterForm" class="lms-card mb-4 flex flex-wrap gap-4 items-end py-4">
        <mat-form-field appearance="outline" class="flex-1 min-w-48">
          <mat-label>Search</mat-label>
          <input matInput formControlName="search" placeholder="Name or email..." />
          <mat-icon matPrefix class="mr-2 text-slate-400">search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-40">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="">All roles</mat-option>
            <mat-option value="Student">Student</mat-option>
            <mat-option value="Lecturer">Lecturer</mat-option>
            <mat-option value="Admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      @if (isLoading()) {
        <div class="lms-card flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>
      } @else if (error()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-red-400 mb-3" style="font-size:48px;width:48px;height:48px">
            error_outline
          </mat-icon>
          <p class="text-slate-600 mb-4">{{ error() }}</p>
          <button mat-stroked-button (click)="loadUsers()">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
        </div>
      } @else if (users().length === 0) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-slate-300 mb-3" style="font-size:48px;width:48px;height:48px">
            group_off
          </mat-icon>
          <p class="text-slate-500">No users match your current filters.</p>
        </div>
      } @else {
        <div class="lms-card p-0 overflow-hidden">
          <table mat-table [dataSource]="users()" class="w-full">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef class="pl-6 bg-slate-50">Name</th>
              <td mat-cell *matCellDef="let user" class="pl-6">
                <div class="flex items-center gap-3 py-2">
                  <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span class="text-blue-700 text-sm font-medium">{{ initials(user) }}</span>
                  </div>
                  <span class="text-sm font-medium text-slate-800">
                    {{ user.firstName }} {{ user.lastName }}
                  </span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef class="bg-slate-50">Email</th>
              <td mat-cell *matCellDef="let user">
                <span class="text-sm text-slate-600">{{ user.email }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef class="bg-slate-50">Role</th>
              <td mat-cell *matCellDef="let user">
                <span [class]="roleBadgeClass(user.role)">{{ user.role }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef class="bg-slate-50">Status</th>
              <td mat-cell *matCellDef="let user">
                <span [class]="user.isActive ? 'badge badge-success' : 'badge badge-neutral'">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="bg-slate-50"></th>
              <td mat-cell *matCellDef="let user" class="pr-4 text-right">
                <button mat-icon-button [routerLink]="['/users', user.id]"
                  aria-label="View user details"
                  (click)="$event.stopPropagation()">
                  <mat-icon class="text-slate-400">chevron_right</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              class="hover:bg-slate-50 cursor-pointer transition-colors"
              (click)="openDetail(row.id)"></tr>

          </table>

          <mat-paginator
            [length]="totalCount()"
            [pageSize]="pageSize()"
            [pageIndex]="page()"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPage($event)"
            class="border-t border-slate-200" />
        </div>
      }

    </div>
  `,
})
export class UserListComponent implements OnInit {
  filterForm: FormGroup;
  isLoading = signal(true);
  users = signal<User[]>([]);
  totalCount = signal(0);
  error = signal<string | null>(null);
  page = signal(0);
  pageSize = signal(20);
  readonly displayedColumns = ['name', 'email', 'role', 'status', 'actions'];

  private destroyRef = inject(DestroyRef);

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.filterForm = this.fb.group({ search: [''], role: [''] });
  }

  ngOnInit(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.page.set(0);
      this.loadUsers();
    });
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const { search, role } = this.filterForm.value as { search: string; role: string };
    try {
      this.userService.getUsers({
        search: search || undefined,
        role: (role as UserRole) || undefined,
        page: this.page() + 1,
        pageSize: this.pageSize(),
      }).subscribe({
        next: result => {
          this.users.set(result.items);
          this.totalCount.set(result.totalCount);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.error.set('Failed to load users. Please try again.');
        },
      });
    } catch {
      this.isLoading.set(false);
      this.error.set('Failed to load users. Please try again.');
    }
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  openDetail(id: string): void {
    this.router.navigate(['/users', id]);
  }

  initials(user: User): string {
    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  }

  roleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'Admin':    return 'badge badge-danger';
      case 'Lecturer': return 'badge badge-info';
      default:         return 'badge badge-neutral';
    }
  }
}
