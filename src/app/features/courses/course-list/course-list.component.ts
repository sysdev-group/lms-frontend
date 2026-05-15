import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CourseService } from '@core/services/course.service';
import { AuthService } from '@core/auth/auth.service';
import { Course } from '@shared/models/models';
import { CourseCreateDialogComponent } from '../course-create-dialog/course-create-dialog.component';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="page-container">

      <!-- Page header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold text-slate-900">
            @if (role() === 'Student') { My Modules }
            @else if (role() === 'Lecturer') { My Modules }
            @else { All Modules }
          </h1>
          <p class="text-sm text-slate-500 mt-0.5">
            @if (role() === 'Student') { Modules you're currently enrolled in }
            @else if (role() === 'Lecturer') { Modules you're teaching this semester }
            @else { All modules across the institution }
          </p>
        </div>
        @if (canManageCourses()) {
          <button mat-flat-button color="primary" class="min-h-[44px]"
                  (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Create Module
          </button>
        }
      </div>

      <!-- Search bar -->
      <mat-form-field appearance="outline" class="w-full mb-6">
        <mat-label>Search modules</mat-label>
        <mat-icon matPrefix class="text-slate-400"
                  style="font-size:20px;width:20px;height:20px;margin-right:4px">search</mat-icon>
        <input matInput [formControl]="searchControl"
               placeholder="Search by name or code..." />
      </mat-form-field>

      <!-- Skeleton -->
      @if (isLoading()) {
        <div class="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="lms-card relative overflow-hidden flex flex-col">
              <div class="absolute inset-y-0 left-0 w-1 bg-slate-200"></div>
              <div class="pl-2 space-y-2.5">
                <div class="h-3 bg-slate-200 rounded w-14"></div>
                <div class="h-5 bg-slate-200 rounded w-3/4"></div>
                <div class="space-y-2 pt-1">
                  <div class="h-3 bg-slate-100 rounded w-1/2"></div>
                  <div class="h-3 bg-slate-100 rounded w-2/5"></div>
                  <div class="h-3 bg-slate-100 rounded w-1/3"></div>
                </div>
                <div class="h-9 bg-slate-200 rounded-lg mt-1"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error state -->
      @else if (errorMessage()) {
        <div class="lms-card">
          <div class="flex flex-col items-center py-10 text-center">
            <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <mat-icon class="text-red-400"
                        style="font-size:24px;width:24px;height:24px">error_outline</mat-icon>
            </div>
            <p class="text-sm font-medium text-slate-700">{{ errorMessage() }}</p>
            <p class="text-xs text-slate-400 mt-1">Check your connection and try again.</p>
          </div>
        </div>
      }

      <!-- Empty state -->
      @else if (courses().length === 0) {
        <div class="lms-card">
          <div class="flex flex-col items-center py-12 text-center">
            <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <mat-icon class="text-slate-400"
                        style="font-size:28px;width:28px;height:28px">menu_book</mat-icon>
            </div>
            @if (role() === 'Student') {
              <p class="text-sm font-semibold text-slate-700">
                You're not enrolled in any modules yet.
              </p>
              <p class="text-xs text-slate-400 mt-1">
                Contact your administrator to be enrolled in modules.
              </p>
              <a routerLink="/enrollment" mat-flat-button color="primary"
                 class="mt-5 min-h-[44px]">
                Browse Available Modules
              </a>
            } @else {
              <p class="text-sm font-semibold text-slate-700">No modules found.</p>
              <p class="text-xs text-slate-400 mt-1">Create a module to get started.</p>
              <button mat-flat-button color="primary" class="mt-5 min-h-[44px]"
                      (click)="openCreateDialog()">
                Create Module
              </button>
            }
          </div>
        </div>
      }

      <!-- Module grid -->
      @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (course of courses(); track course.id) {
            <div class="lms-card relative overflow-hidden flex flex-col
                        hover:shadow-md transition-shadow cursor-pointer"
                 (click)="navigateToCourse(course.id)">

              <!-- Left accent bar -->
              <div class="absolute inset-y-0 left-0 w-1 bg-primary-600"></div>

              <div class="pl-3 flex flex-col flex-1">
                <!-- Module code + archived badge -->
                <div class="flex items-start justify-between mb-1.5">
                  <span class="text-xs font-semibold uppercase tracking-wide
                               text-primary-600">
                    {{ course.code }}
                  </span>
                  @if (course.isArchived) {
                    <span class="badge badge-neutral">Archived</span>
                  }
                </div>

                <!-- Module title -->
                <h3 class="font-display font-semibold text-slate-900 text-sm
                           leading-snug mb-3">
                  {{ course.title }}
                </h3>

                <!-- Metadata — role-specific -->
                <div class="space-y-1.5 mb-4 flex-1">
                  @if (role() === 'Student') {
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                        person
                      </mat-icon>
                      <span>{{ course.lecturerName }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                        event_note
                      </mat-icon>
                      <span>{{ course.semesterName }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs mt-2">
                      <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full w-2/3 bg-primary-600 rounded-full"></div>
                      </div>
                      <span class="text-slate-500 font-medium shrink-0">Enrolled</span>
                    </div>
                  } @else if (role() === 'Lecturer') {
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                        groups
                      </mat-icon>
                      <span>{{ course.enrolledStudentCount }} students</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                        event_note
                      </mat-icon>
                      <span>{{ course.semesterName }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                        star_outline
                      </mat-icon>
                      <span>{{ course.creditHours }} credit hours</span>
                    </div>
                  } @else {
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                        person
                      </mat-icon>
                      <span>{{ course.lecturerName }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                        groups
                      </mat-icon>
                      <span>{{ course.enrolledStudentCount }} enrolled</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                        event_note
                      </mat-icon>
                      <span>{{ course.semesterName }}</span>
                    </div>
                  }
                </div>

                <!-- CTA button -->
                @if (role() === 'Student') {
                  <button mat-flat-button color="primary"
                          class="w-full min-h-[40px]"
                          (click)="$event.stopPropagation(); navigateToCourse(course.id)">
                    Open Module
                  </button>
                } @else if (role() === 'Lecturer') {
                  <button mat-flat-button color="primary"
                          class="w-full min-h-[40px]"
                          (click)="$event.stopPropagation(); navigateToCourse(course.id)">
                    Manage Module
                  </button>
                } @else {
                  <button mat-stroked-button color="primary"
                          class="w-full min-h-[40px]"
                          (click)="$event.stopPropagation(); navigateToCourse(course.id)">
                    View Module
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class CourseListComponent implements OnInit {
  courses = signal<Course[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly searchControl = new FormControl('');

  readonly role = computed(() => this.authService.currentUser()?.role);

  readonly canManageCourses = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'Lecturer';
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadCourses();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(search => this.loadCourses(search ?? undefined));
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CourseCreateDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((created: boolean) => {
      if (created) {
        this.snackBar.open('Course created successfully.', 'Dismiss', { duration: 4000 });
        this.loadCourses(this.searchControl.value ?? undefined);
      }
    });
  }

  navigateToCourse(id: string): void {
    this.router.navigate(['/courses', id]);
  }

  private loadCourses(search?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.courseService.getCourses(search ? { search } : undefined).subscribe({
      next: (result) => {
        this.courses.set(result.items);
        this.isLoading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Failed to load courses.';
        this.errorMessage.set(msg);
        this.snackBar.open(msg, 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }
}
