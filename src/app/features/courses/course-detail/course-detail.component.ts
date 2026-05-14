import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CourseService } from '@core/services/course.service';
import { Course } from '@shared/models/models';

/**
 * Course detail page.
 * See Section 7.4 - Course Module.
 */
@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="mb-6">
        <a mat-stroked-button routerLink="/courses">
          <mat-icon>arrow_back</mat-icon>
          Back to Courses
        </a>
      </div>

      @if (isLoading()) {
        <div class="lms-card flex flex-col items-center justify-center py-14 text-center">
          <mat-spinner diameter="36" />
          <p class="mt-4 text-sm font-medium text-slate-600">Loading course details...</p>
        </div>
      } @else if (errorMessage()) {
        <div class="lms-card text-center py-12">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 mb-4">
            <mat-icon class="text-red-500">error_outline</mat-icon>
          </div>
          <h1 class="text-lg font-semibold text-slate-800 mb-2">Course could not be loaded</h1>
          <p class="text-sm text-slate-500 mb-6">{{ errorMessage() }}</p>
          <button mat-stroked-button color="primary" type="button" (click)="loadCourse()">
            Try again
          </button>
        </div>
      } @else {
        @if (course(); as selectedCourse) {
          <div class="lms-card mb-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                @if (selectedCourse.code) {
                  <p class="text-xs font-semibold uppercase text-primary-600">{{ selectedCourse.code }}</p>
                }
                <h1 class="mt-1 text-2xl font-bold text-slate-900 leading-tight">{{ selectedCourse.title }}</h1>
                @if (selectedCourse.semesterName) {
                  <p class="mt-2 text-sm text-slate-500">{{ selectedCourse.semesterName }}</p>
                }
              </div>
              <span class="badge shrink-0" [class.badge-success]="!selectedCourse.isArchived" [class.badge-neutral]="selectedCourse.isArchived">
                {{ courseStatus(selectedCourse) }}
              </span>
            </div>

            @if (selectedCourse.description) {
              <p class="mt-6 text-sm leading-6 text-slate-600">{{ selectedCourse.description }}</p>
            }
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            @if (selectedCourse.lecturerName) {
              <section class="lms-card">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-slate-400">person</mat-icon>
                  <div>
                    <p class="text-xs font-semibold uppercase text-slate-400">Lecturer</p>
                    <p class="mt-1 text-sm font-medium text-slate-800">{{ selectedCourse.lecturerName }}</p>
                  </div>
                </div>
              </section>
            }

            @if (selectedCourse.semesterName) {
              <section class="lms-card">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-slate-400">event_note</mat-icon>
                  <div>
                    <p class="text-xs font-semibold uppercase text-slate-400">Semester</p>
                    <p class="mt-1 text-sm font-medium text-slate-800">{{ selectedCourse.semesterName }}</p>
                  </div>
                </div>
              </section>
            }

            <section class="lms-card">
              <div class="flex items-center gap-3">
                <mat-icon class="text-slate-400">groups</mat-icon>
                <div>
                  <p class="text-xs font-semibold uppercase text-slate-400">Enrolled</p>
                  <p class="mt-1 text-sm font-medium text-slate-800">{{ selectedCourse.enrolledStudentCount }} students</p>
                </div>
              </div>
            </section>

            <section class="lms-card">
              <div class="flex items-center gap-3">
                <mat-icon class="text-slate-400">schedule</mat-icon>
                <div>
                  <p class="text-xs font-semibold uppercase text-slate-400">Credit Hours</p>
                  <p class="mt-1 text-sm font-medium text-slate-800">{{ selectedCourse.creditHours }}</p>
                </div>
              </div>
            </section>

            @if (createdAt(selectedCourse)) {
              <section class="lms-card">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-slate-400">calendar_today</mat-icon>
                  <div>
                    <p class="text-xs font-semibold uppercase text-slate-400">Created</p>
                    <p class="mt-1 text-sm font-medium text-slate-800">{{ createdAt(selectedCourse) | date:'mediumDate' }}</p>
                  </div>
                </div>
              </section>
            }

            @if (updatedAt(selectedCourse)) {
              <section class="lms-card">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-slate-400">update</mat-icon>
                  <div>
                    <p class="text-xs font-semibold uppercase text-slate-400">Updated</p>
                    <p class="mt-1 text-sm font-medium text-slate-800">{{ updatedAt(selectedCourse) | date:'mediumDate' }}</p>
                  </div>
                </div>
              </section>
            }
          </div>
        }
      }
    </div>
  `,
})
export class CourseDetailComponent implements OnInit {
  course = signal<Course | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  private courseId = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
  ) {}

  ngOnInit(): void {
    this.courseId.set(this.route.snapshot.paramMap.get('id'));
    this.loadCourse();
  }

  loadCourse(): void {
    const id = this.courseId();
    if (!id) {
      this.course.set(null);
      this.errorMessage.set('The course link is missing an ID.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.courseService.getCourseById(id).subscribe({
      next: course => {
        this.course.set(course);
        this.isLoading.set(false);
      },
      error: () => {
        this.course.set(null);
        this.errorMessage.set('Please go back to Courses and open the course again.');
        this.isLoading.set(false);
      },
    });
  }

  courseStatus(course: Course): string {
    return course.isArchived ? 'Archived' : 'Active';
  }

  createdAt(course: Course): string | null {
    return this.optionalDate(course, 'createdAt');
  }

  updatedAt(course: Course): string | null {
    return this.optionalDate(course, 'updatedAt');
  }

  private optionalDate(course: Course, field: 'createdAt' | 'updatedAt'): string | null {
    return (course as Course & Record<typeof field, string | null | undefined>)[field] ?? null;
  }
}
