import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { GradeService } from '@core/services/grade.service';
import { AuthService } from '@core/auth/auth.service';
import { Grade } from '@shared/models/models';
import { GradingComponent } from './grading.component';

type ResultFilter = 'all' | 'passed' | 'failed' | 'pending';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatExpansionModule,
    GradingComponent,
  ],
  template: `
    <div class="page-container">

      <!-- ── Lecturer / Admin → delegate to grading component ─────────── -->
      @if (userRole() === 'Lecturer' || userRole() === 'Admin') {
        <app-grading />

      <!-- ── Student grades view ──────────────────────────────────────── -->
      } @else {

        <!-- Page header -->
        <div class="mb-6">
          <h1 class="font-display text-2xl font-bold text-slate-800">My Grades</h1>
          <p class="text-sm text-slate-500 mt-1">Your published grades across all modules</p>
        </div>

        <!-- ── Loading skeleton ─────────────────────────────────────────── -->
        @if (isLoading()) {
          <!-- Summary card skeleton -->
          <div class="lms-card mb-4 animate-pulse">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              @for (t of [1,2,3,4]; track t) {
                <div class="text-center p-3 rounded-xl bg-slate-50">
                  <div class="h-9 w-12 bg-slate-200 rounded mx-auto mb-2"></div>
                  <div class="h-3 w-16 bg-slate-100 rounded mx-auto"></div>
                </div>
              }
            </div>
            <div class="border-t border-slate-100 mt-4 pt-4 flex items-center gap-3">
              <div class="h-3 w-24 bg-slate-100 rounded"></div>
              <div class="h-9 w-16 bg-slate-200 rounded"></div>
            </div>
          </div>
          <!-- Filter bar skeleton -->
          <div class="flex gap-3 mb-4 animate-pulse">
            <div class="h-10 w-36 bg-slate-200 rounded"></div>
            <div class="h-10 w-64 bg-slate-200 rounded"></div>
          </div>
          <!-- Grade card skeletons -->
          @for (c of [1,2,3,4]; track c) {
            <div class="lms-card relative overflow-hidden mb-3 animate-pulse">
              <div class="absolute inset-y-0 left-0 w-1 bg-slate-200"></div>
              <div class="pl-3 space-y-3">
                <div class="flex items-start justify-between">
                  <div class="h-5 w-2/3 bg-slate-200 rounded"></div>
                  <div class="h-5 w-20 bg-slate-100 rounded-full"></div>
                </div>
                <div class="h-3 w-1/3 bg-slate-100 rounded"></div>
                <div class="h-7 w-24 bg-slate-200 rounded mt-1"></div>
              </div>
            </div>
          }

        <!-- ── Error ─────────────────────────────────────────────────────── -->
        } @else if (error()) {
          <div class="lms-card text-center py-16">
            <mat-icon class="text-slate-200 mb-3" style="font-size:56px;width:56px;height:56px">
              error_outline
            </mat-icon>
            <p class="text-red-600 font-medium">{{ error() }}</p>
          </div>

        <!-- ── Empty state: no grades at all ─────────────────────────────── -->
        } @else if (grades().length === 0) {
          <div class="lms-card text-center py-16">
            <mat-icon class="text-slate-200 mb-4" style="font-size:64px;width:64px;height:64px">
              grade
            </mat-icon>
            <h3 class="font-display font-semibold text-slate-700 mb-2">No grades yet</h3>
            <p class="text-sm text-slate-500 mb-6">
              Grades will appear here once your lecturer publishes them
            </p>
            <a routerLink="/assignments" mat-stroked-button class="min-h-[44px]">
              View Assignments
            </a>
          </div>

        <!-- ── Grades loaded ──────────────────────────────────────────────── -->
        } @else {

          <!-- Summary card -->
          <div class="lms-card mb-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">

              <div class="text-center p-3 rounded-xl bg-white border border-slate-100">
                <p class="font-display text-3xl font-bold text-slate-900">{{ gradedCount() }}</p>
                <p class="text-xs text-slate-500 uppercase tracking-wide mt-1">Graded</p>
              </div>

              <div class="text-center p-3 rounded-xl bg-white border border-slate-100">
                <p class="font-display text-3xl font-bold text-slate-400">{{ pendingCount() }}</p>
                <p class="text-xs text-slate-500 uppercase tracking-wide mt-1">Pending</p>
              </div>

              <div class="text-center p-3 rounded-xl bg-green-50 border border-green-100">
                <p class="font-display text-3xl font-bold text-green-700">{{ passedCount() }}</p>
                <p class="text-xs text-green-600 uppercase tracking-wide mt-1">Passed</p>
              </div>

              <div class="text-center p-3 rounded-xl bg-red-50 border border-red-100">
                <p class="font-display text-3xl font-bold text-red-700">{{ failedCount() }}</p>
                <p class="text-xs text-red-600 uppercase tracking-wide mt-1">Failed</p>
              </div>

            </div>

            <!-- Overall average -->
            @if (gradedCount() > 0) {
              <div class="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between flex-wrap gap-2">
                <span class="text-sm text-slate-500">Overall Average</span>
                <div class="flex items-baseline gap-2">
                  <span [class]="avgMarksCss()" class="font-display text-4xl font-bold leading-none">
                    {{ avgMarks() }}
                  </span>
                  <span class="text-sm text-slate-400">
                    across {{ gradedCount() }} graded
                    {{ gradedCount() === 1 ? 'assignment' : 'assignments' }}
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Filter bar -->
          <div class="flex flex-wrap items-center gap-3 mb-5">

            <!-- Module filter — visual placeholder; Grade model lacks courseName -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40 shrink-0">
              <mat-label>Module</mat-label>
              <mat-select value="all">
                <mat-option value="all">All Modules</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Result filter -->
            <mat-button-toggle-group
              [value]="resultFilter()"
              (change)="resultFilter.set($event.value)"
              aria-label="Filter by result">
              <mat-button-toggle value="all" class="min-h-[44px]">All</mat-button-toggle>
              <mat-button-toggle value="passed" class="min-h-[44px]">Passed</mat-button-toggle>
              <mat-button-toggle value="failed" class="min-h-[44px]">Failed</mat-button-toggle>
              <mat-button-toggle value="pending" class="min-h-[44px]">Pending</mat-button-toggle>
            </mat-button-toggle-group>

          </div>

          <!-- Empty state: filter matches nothing -->
          @if (filteredGrades().length === 0) {
            <div class="lms-card text-center py-12">
              <mat-icon class="text-slate-200 mb-3" style="font-size:48px;width:48px;height:48px">
                filter_list_off
              </mat-icon>
              <p class="font-semibold text-slate-600 mb-1">No grades match your filter</p>
              <p class="text-sm text-slate-400 mb-4">Try adjusting your selection</p>
              <button mat-stroked-button class="min-h-[44px]"
                (click)="resultFilter.set('all')">
                Clear Filters
              </button>
            </div>

          } @else {

            <!-- Grade cards -->
            <div class="space-y-3 max-w-3xl mx-auto">
              @for (g of filteredGrades(); track g.id) {
                <div class="lms-card relative overflow-hidden hover:shadow-md transition-shadow">

                  <!-- Left colour bar -->
                  <div class="absolute inset-y-0 left-0 w-1"
                    [class]="gradeLeftBarCss(g)">
                  </div>

                  <div class="pl-3">

                    <!-- Title + result badge -->
                    <div class="flex items-start justify-between gap-3 mb-2">
                      <h3 class="font-display font-semibold text-slate-800 leading-snug">
                        {{ g.assignmentTitle }}
                      </h3>
                      <span class="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [class]="gradeResultBadgeCss(g)">
                        {{ gradeResultLabel(g) }}
                      </span>
                    </div>

                    <!-- Module row — model gap: courseName not on Grade -->
                    <div class="flex items-center gap-1 text-sm text-slate-500 mb-1">
                      <mat-icon style="font-size:14px;width:14px;height:14px;line-height:1">book</mat-icon>
                      <span class="text-slate-400 italic text-xs">Module data unavailable</span>
                    </div>

                    <!-- Graded state -->
                    @if (g.isPublished) {

                      <!-- Grade display -->
                      <div class="flex items-baseline gap-2 my-3">
                        <span class="font-display text-2xl font-bold text-slate-900">
                          {{ g.marksAwarded }}
                        </span>
                        <span class="text-slate-400 text-sm font-medium">/ —</span>
                        @if (g.letterGrade) {
                          <span class="font-display font-bold text-base"
                            [class]="gradeScoreCss(g)">
                            ({{ g.letterGrade }})
                          </span>
                        }
                      </div>

                      <!-- Feedback expansion -->
                      <mat-accordion>
                        <mat-expansion-panel class="!shadow-none !border !border-slate-100 !rounded-lg !overflow-hidden">
                          <mat-expansion-panel-header class="!bg-slate-50 hover:!bg-slate-100">
                            <mat-panel-title class="text-sm font-medium text-slate-600">
                              <mat-icon class="mr-1.5 text-slate-400"
                                style="font-size:16px;width:16px;height:16px;line-height:1">
                                comment
                              </mat-icon>
                              View Feedback
                            </mat-panel-title>
                          </mat-expansion-panel-header>
                          @if (g.feedback) {
                            <p class="text-slate-600 leading-relaxed text-sm p-1">{{ g.feedback }}</p>
                          } @else {
                            <p class="text-slate-400 italic text-sm p-1">No feedback provided.</p>
                          }
                        </mat-expansion-panel>
                      </mat-accordion>

                    <!-- Pending state -->
                    } @else {
                      <div class="bg-slate-50 rounded-lg p-3 flex items-center gap-2 mt-2">
                        <mat-icon class="text-slate-400 shrink-0"
                          style="font-size:18px;width:18px;height:18px;line-height:1">
                          hourglass_empty
                        </mat-icon>
                        <span class="text-sm text-slate-500">Awaiting grade from lecturer</span>
                      </div>
                    }

                  </div>
                </div>
              }
            </div>

          }
        }
      }
    </div>
  `,
})
export class GradesComponent implements OnInit {
  isLoading = signal(false);
  grades = signal<Grade[]>([]);
  error = signal<string | null>(null);
  resultFilter = signal<ResultFilter>('all');

  readonly userRole = this.authService.userRole;

  readonly gradedCount = computed(() => this.grades().filter(g => g.isPublished).length);
  readonly pendingCount = computed(() => this.grades().filter(g => !g.isPublished).length);
  readonly passedCount = computed(() =>
    this.grades().filter(g => g.isPublished && this.isPassingGrade(g)).length
  );
  readonly failedCount = computed(() =>
    this.grades().filter(g => g.isPublished && !this.isPassingGrade(g)).length
  );
  readonly avgMarks = computed(() => {
    const graded = this.grades().filter(g => g.isPublished);
    if (!graded.length) return 0;
    return Math.round(graded.reduce((s, g) => s + g.marksAwarded, 0) / graded.length);
  });
  readonly filteredGrades = computed(() => {
    const f = this.resultFilter();
    const g = this.grades();
    if (f === 'passed')  return g.filter(x => x.isPublished && this.isPassingGrade(x));
    if (f === 'failed')  return g.filter(x => x.isPublished && !this.isPassingGrade(x));
    if (f === 'pending') return g.filter(x => !x.isPublished);
    return g;
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private gradeService: GradeService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.authService.userRole() === 'Student') {
      this.isLoading.set(true);
      this.loadStudentGrades();
    }
  }

  gradeLeftBarCss(g: Grade): string {
    if (!g.isPublished) return 'bg-slate-300';
    const lg = (g.letterGrade ?? '').trim().toUpperCase();
    if (!lg) return 'bg-slate-400';
    if (lg.startsWith('A')) return 'bg-green-500';
    if (lg.startsWith('B')) return 'bg-blue-500';
    if (lg.startsWith('C')) return 'bg-amber-500';
    return 'bg-red-500';
  }

  gradeResultBadgeCss(g: Grade): string {
    if (!g.isPublished) return 'bg-slate-100 text-slate-500';
    const lg = (g.letterGrade ?? '').trim().toUpperCase();
    if (!lg) return 'bg-slate-100 text-slate-500';
    if (lg.startsWith('A')) return 'bg-green-100 text-green-700';
    if (lg.startsWith('B')) return 'bg-blue-100 text-blue-700';
    if (lg.startsWith('C')) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  }

  gradeResultLabel(g: Grade): string {
    if (!g.isPublished) return 'Pending';
    const lg = (g.letterGrade ?? '').trim().toUpperCase();
    if (!lg) return 'Pending';
    if (lg.startsWith('A')) return 'Distinction';
    if (lg.startsWith('B')) return 'Merit';
    if (lg.startsWith('C')) return 'Pass';
    return 'Fail';
  }

  gradeScoreCss(g: Grade): string {
    const lg = (g.letterGrade ?? '').trim().toUpperCase();
    if (lg.startsWith('A')) return 'text-green-600';
    if (lg.startsWith('B')) return 'text-blue-600';
    if (lg.startsWith('C')) return 'text-amber-600';
    return 'text-red-600';
  }

  avgMarksCss(): string {
    const avg = this.avgMarks();
    if (avg >= 70) return 'text-green-600';
    if (avg >= 60) return 'text-blue-600';
    if (avg >= 40) return 'text-amber-600';
    return 'text-red-600';
  }

  private isPassingGrade(g: Grade): boolean {
    const lg = (g.letterGrade ?? '').trim().toUpperCase();
    if (!lg) return false;
    return !lg.startsWith('F') && !lg.startsWith('D');
  }

  private loadStudentGrades(): void {
    this.gradeService.getGradesByStudent('me')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.grades.set(data);
          this.isLoading.set(false);
        },
        error: err => {
          this.error.set(err?.error?.message ?? 'Failed to load grades.');
          this.isLoading.set(false);
        },
      });
  }
}
