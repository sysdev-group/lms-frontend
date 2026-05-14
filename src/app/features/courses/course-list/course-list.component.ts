import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CourseService } from '@core/services/course.service';
import { AuthService } from '@core/auth/auth.service';
import { Course } from '@shared/models/models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <h1 class="section-title mb-0">Courses</h1>
        @if (canManageCourses()) {
          <button mat-flat-button color="primary" class="min-h-[44px]"
            routerLink="/courses/new">+ Create Course</button>
        }
      </div>

      <mat-form-field appearance="outline" class="w-full mb-4">
        <mat-label>Search courses</mat-label>
        <input matInput [formControl]="searchControl" placeholder="Search by name or code..." />
      </mat-form-field>

      @if (isLoading()) {
        <div class="flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>
      } @else if (errorMessage()) {
        <div class="lms-card text-center py-12">
          <p class="text-red-600">{{ errorMessage() }}</p>
        </div>
      } @else if (courses().length === 0) {
        <div class="lms-card text-center py-12">
          <p class="text-slate-500">No courses found.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (course of courses(); track course.id) {
            <mat-card class="cursor-pointer hover:shadow-md transition-shadow"
              (click)="navigateToCourse(course.id)">
              <mat-card-header>
                <mat-card-title>{{ course.code }}</mat-card-title>
                <mat-card-subtitle>{{ course.title }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content class="mt-3">
                <p class="text-sm text-slate-600">
                  <span class="font-medium">Lecturer:</span> {{ course.lecturerName }}
                </p>
                <p class="text-sm text-slate-600 mt-1">
                  <span class="font-medium">Students:</span> {{ course.enrolledStudentCount }}
                </p>
              </mat-card-content>
            </mat-card>
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

  readonly canManageCourses = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'Lecturer';
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

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
