import { Component, OnInit, signal, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '@core/services/user.service';
import { User, UserRole, UserQueryParams, CreateUserRequest, BulkImportResult } from '@shared/models/models';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Add User</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-2 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>First name</mat-label>
          <input matInput formControlName="firstName" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Last name</mat-label>
          <input matInput formControlName="lastName" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="Student">Student</mat-option>
            <mat-option value="Lecturer">Lecturer</mat-option>
            <mat-option value="Admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary"
        [disabled]="form.invalid || saving()"
        (click)="submit()">
        @if (saving()) { <mat-spinner diameter="18" class="inline-block mr-1" /> Saving... }
        @else { Create User }
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateUserDialogComponent {
  saving = signal(false);
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      role:      ['Student', Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.userService.createUser(this.form.value as CreateUserRequest).subscribe({
      next: user => this.dialogRef.close(user),
      error: () => this.saving.set(false),
    });
  }
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">

      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p class="text-slate-500 mt-1 text-sm">{{ totalCount() }} users registered</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <input #csvInput type="file" accept=".csv" class="hidden" (change)="onCsvSelected($event)" />
          <button mat-stroked-button class="min-h-[44px]" (click)="csvInput.click()" [disabled]="isBulkImporting()">
            @if (isBulkImporting()) { <mat-spinner diameter="18" class="inline-block mr-1" /> Importing... }
            @else { <mat-icon>upload</mat-icon> Bulk Import }
          </button>
          <button mat-flat-button color="primary" class="min-h-[44px]" (click)="openCreateUserDialog()">
            <mat-icon>add</mat-icon>
            Add User
          </button>
        </div>
      </div>

      <!-- Search + Filter bar -->
      <div class="lms-card mb-4">
        <form [formGroup]="filterForm" class="flex flex-col gap-4">

          <mat-form-field appearance="outline" class="w-full">
            <mat-icon matPrefix class="text-slate-400 mr-1">search</mat-icon>
            <input matInput formControlName="search"
              placeholder="Search by name or email..." />
          </mat-form-field>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <mat-button-toggle-group formControlName="role"
              aria-label="Filter by role">
              <mat-button-toggle value="" class="min-h-[36px]">All</mat-button-toggle>
              <mat-button-toggle value="Admin" class="min-h-[36px]">Admin</mat-button-toggle>
              <mat-button-toggle value="Lecturer" class="min-h-[36px]">Lecturer</mat-button-toggle>
              <mat-button-toggle value="Student" class="min-h-[36px]">Student</mat-button-toggle>
            </mat-button-toggle-group>
            <span class="text-sm text-slate-500">
              Showing {{ users().length }} of {{ totalCount() }} users
            </span>
          </div>

        </form>
      </div>

      <!-- Table card -->
      <div class="lms-card p-0 overflow-hidden">

        <!-- Skeleton loading -->
        @if (isLoading()) {
          <div class="overflow-x-auto">
            <div class="flex items-center gap-6 px-6 py-3 border-b border-slate-200 bg-slate-50">
              <div class="w-10 h-3 bg-slate-200 rounded animate-pulse"></div>
              <div class="flex-1 h-3 bg-slate-200 rounded animate-pulse max-w-[160px]"></div>
              <div class="w-14 h-3 bg-slate-200 rounded animate-pulse"></div>
              <div class="w-20 h-3 bg-slate-200 rounded animate-pulse hidden sm:block"></div>
              <div class="w-16 h-3 bg-slate-200 rounded animate-pulse ml-auto"></div>
            </div>
            @for (i of [1,2,3,4,5]; track i) {
              <div class="flex items-center gap-6 px-6 py-4 border-b border-slate-100">
                <div class="w-10 h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0"></div>
                <div class="flex-1 min-w-0 space-y-2">
                  <div class="h-4 bg-slate-200 rounded animate-pulse w-36"></div>
                  <div class="h-3 bg-slate-100 rounded animate-pulse w-52"></div>
                </div>
                <div class="h-5 w-16 bg-slate-200 rounded-full animate-pulse"></div>
                <div class="h-4 w-24 bg-slate-200 rounded animate-pulse hidden sm:block"></div>
                <div class="flex gap-1 ml-auto">
                  <div class="w-9 h-9 rounded bg-slate-200 animate-pulse"></div>
                  <div class="w-9 h-9 rounded bg-slate-200 animate-pulse"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Empty state -->
        @if (!isLoading() && users().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 gap-3">
            <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <mat-icon class="!text-3xl text-slate-400">people</mat-icon>
            </div>
            <p class="font-semibold text-slate-700">No users found</p>
            <p class="text-sm text-slate-400">Try adjusting your search or filters</p>
            @if (totalCount() === 0) {
              <button mat-flat-button color="primary" class="mt-2 min-h-[44px]">
                <mat-icon>add</mat-icon>
                Add User
              </button>
            }
          </div>
        }

        <!-- Table -->
        @if (!isLoading() && users().length > 0) {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="users()" class="w-full">

              <!-- Avatar column -->
              <ng-container matColumnDef="avatar">
                <th mat-header-cell *matHeaderCellDef
                  class="!pl-6 bg-slate-50 w-14 !border-b-0">
                </th>
                <td mat-cell *matCellDef="let user" class="!pl-6 !py-3 w-14">
                  <div class="w-10 h-10 rounded-full bg-slate-200 text-slate-700
                    flex items-center justify-center flex-shrink-0
                    font-semibold text-sm select-none">
                    {{ user.firstName[0] }}{{ user.lastName[0] }}
                  </div>
                </td>
              </ng-container>

              <!-- Name + Email column -->
              <ng-container matColumnDef="nameEmail">
                <th mat-header-cell *matHeaderCellDef
                  class="bg-slate-50 font-semibold text-slate-500 text-xs uppercase tracking-wide !py-3">
                  User
                </th>
                <td mat-cell *matCellDef="let user" class="!py-3">
                  <span class="font-semibold text-slate-900 block leading-tight">
                    {{ user.firstName }} {{ user.lastName }}
                  </span>
                  <span class="text-sm text-slate-500 block mt-0.5">{{ user.email }}</span>
                </td>
              </ng-container>

              <!-- Role column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef
                  class="bg-slate-50 font-semibold text-slate-500 text-xs uppercase tracking-wide !py-3">
                  Role
                </th>
                <td mat-cell *matCellDef="let user" class="!py-3">
                  <span [class]="roleBadgeClass(user.role)">{{ user.role }}</span>
                </td>
              </ng-container>

              <!-- Joined column -->
              <ng-container matColumnDef="joined">
                <th mat-header-cell *matHeaderCellDef
                  class="bg-slate-50 font-semibold text-slate-500 text-xs uppercase tracking-wide hidden sm:table-cell !py-3">
                  Joined
                </th>
                <td mat-cell *matCellDef="let user"
                  class="text-sm text-slate-500 hidden sm:table-cell !py-3">
                  {{ user.createdAt | date:'d MMM y' }}
                </td>
              </ng-container>

              <!-- Actions column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="!pr-4 bg-slate-50 w-24 !border-b-0"></th>
                <td mat-cell *matCellDef="let user" class="!pr-4 !py-3">
                  <div class="flex items-center justify-end gap-0.5">
                    <button mat-icon-button
                      matTooltip="View profile"
                      (click)="$event.stopPropagation(); editUser(user)"
                      aria-label="View user profile"
                      class="!w-9 !h-9">
                      <mat-icon class="text-slate-400 text-[18px]">visibility</mat-icon>
                    </button>
                    <button mat-icon-button
                      matTooltip="Edit user"
                      (click)="$event.stopPropagation(); editUser(user)"
                      aria-label="Edit user"
                      class="!w-9 !h-9">
                      <mat-icon class="text-slate-400 text-[18px]">edit</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns" class="h-11"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                (click)="editUser(row)">
              </tr>

            </table>
          </div>

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
  isBulkImporting = signal(false);
  totalCount = signal(0);
  page = signal(0);
  pageSize = signal(10);

  filterForm: FormGroup;
  readonly displayedColumns = ['avatar', 'nameEmail', 'role', 'joined', 'actions'];

  constructor(
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
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
      page: this.page() + 1,
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

  openCreateUserDialog(): void {
    this.dialog.open(CreateUserDialogComponent, { width: '420px' })
      .afterClosed()
      .subscribe(created => { if (created) this.loadUsers(); });
  }

  onCsvSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.isBulkImporting.set(true);
    this.userService.bulkImport(file).subscribe({
      next: (result: BulkImportResult) => {
        this.isBulkImporting.set(false);
        (event.target as HTMLInputElement).value = '';
        const msg = `Import complete: ${result.created} created, ${result.skipped} skipped.` +
          (result.errors.length ? `\n\nErrors:\n${result.errors.join('\n')}` : '');
        alert(msg);
        this.loadUsers();
      },
      error: () => {
        this.isBulkImporting.set(false);
        (event.target as HTMLInputElement).value = '';
        alert('Bulk import failed. Please check the file format and try again.');
      },
    });
  }

  roleBadgeClass(role: UserRole): string {
    const base = 'text-xs font-medium px-2 py-1 rounded-full';
    const map: Record<UserRole, string> = {
      Admin:    `${base} bg-red-100 text-red-700`,
      Lecturer: `${base} bg-blue-100 text-blue-700`,
      Student:  `${base} bg-green-100 text-green-700`,
    };
    return map[role] ?? `${base} bg-slate-100 text-slate-700`;
  }
}
