import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { GradeService } from '@core/services/grade.service';
import { AuthService } from '@core/auth/auth.service';
import { Grade } from '@shared/models/models';

/**
 * Grades page — Section 7.6 + Section 27.
 * Students see only published grades for all their assignments.
 * Lecturers and Admins see all grades for a course; pass ?courseId in the URL.
 * See Section 27 — Grading Module.
 */
@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="page-container">
      <h1 class="section-title">Grades</h1>

      @if (isLoading()) {
        <div class="flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>

      } @else if (error()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-red-400 mb-3">error_outline</mat-icon>
          <p class="text-red-600">{{ error() }}</p>
        </div>

      } @else if (noCourseSelected()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-slate-300 mb-3">school</mat-icon>
          <p class="text-slate-500">Navigate here from a course page to view its grades.</p>
        </div>

      } @else if (grades().length === 0) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-slate-300 mb-3">grade</mat-icon>
          <p class="text-slate-500">
            @if (userRole() === 'Student') {
              No grades have been published yet.
            } @else {
              No grades found for this course.
            }
          </p>
        </div>

      } @else if (userRole() === 'Student') {

        <!-- Student grades table -->
        <!-- Model gap: Grade lacks courseName and maxMarks — those columns show — until the API adds them -->
        <div class="lms-card overflow-x-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Module / Course
                </th>
                <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Assignment
                </th>
                <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Mark
                </th>
                <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Max Mark
                </th>
                <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Letter Grade
                </th>
                <th class="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Feedback
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (g of grades(); track g.id) {
                <tr>
                  <td class="py-4 pr-4 text-slate-400">—</td>
                  <td class="py-4 pr-4 font-medium text-slate-800">{{ g.assignmentTitle }}</td>
                  <td class="py-4 pr-4 font-semibold text-slate-900">{{ g.marksAwarded }}</td>
                  <td class="py-4 pr-4 text-slate-400">—</td>
                  <td class="py-4 pr-4">
                    @if (g.letterGrade) {
                      <span class="font-semibold text-primary-600">{{ g.letterGrade }}</span>
                    } @else {
                      <span class="text-slate-400">—</span>
                    }
                  </td>
                  <td class="py-4 text-slate-600">{{ g.feedback ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

      } @else {

        <!-- Lecturer / Admin grades table -->
        <!-- Model gap: Grade lacks studentName — that column shows — until the API adds it -->
        <div class="lms-card overflow-x-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Student
                </th>
                <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Assignment
                </th>
                <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Mark
                </th>
                <th class="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Letter Grade
                </th>
                <th class="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (g of grades(); track g.id) {
                <tr>
                  <td class="py-4 pr-4 text-slate-400">—</td>
                  <td class="py-4 pr-4 font-medium text-slate-800">{{ g.assignmentTitle }}</td>
                  <td class="py-4 pr-4 font-semibold text-slate-900">{{ g.marksAwarded }}</td>
                  <td class="py-4 pr-4">
                    @if (g.letterGrade) {
                      <span class="font-semibold text-primary-600">{{ g.letterGrade }}</span>
                    } @else {
                      <span class="text-slate-400">—</span>
                    }
                  </td>
                  <td class="py-4">
                    @if (g.isPublished) {
                      <span class="badge badge-success">Published</span>
                    } @else {
                      <span class="badge badge-warning">Pending</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

      }
    </div>
  `,
})
export class GradesComponent implements OnInit {
  isLoading = signal(false);
  grades = signal<Grade[]>([]);
  error = signal<string | null>(null);
  noCourseSelected = signal(false);

  readonly userRole = this.authService.userRole;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private gradeService: GradeService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.authService.userRole() === 'Student') {
      this.isLoading.set(true);
      this.loadStudentGrades();
    } else {
      const courseId = this.route.snapshot.queryParamMap.get('courseId');
      if (!courseId) {
        this.noCourseSelected.set(true);
        return;
      }
      this.isLoading.set(true);
      this.loadLecturerGrades(courseId);
    }
  }

  private loadStudentGrades(): void {
    this.gradeService.getGradesByStudent('me')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          // Backend returns only published grades for 'me'; filter defensively so the
          // template never needs to check isPublished.
          this.grades.set(data.filter(g => g.isPublished));
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load grades.');
          this.isLoading.set(false);
        },
      });
  }

  private loadLecturerGrades(courseId: string): void {
    this.gradeService.getGradesByCourse(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.grades.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to load grades.');
          this.isLoading.set(false);
        },
      });
  }
}
