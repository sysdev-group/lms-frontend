import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/auth/auth.service';
import { ProgrammeService } from '../programme.service';
import { Course, Programme } from '@shared/models/models';

@Component({
  selector: 'app-programme-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <div class="max-w-5xl mx-auto">

        <!-- Breadcrumb -->
        <div class="mb-5">
          <a routerLink="/programmes"
             class="inline-flex items-center gap-1.5 text-sm text-slate-500
                    hover:text-slate-700 transition-colors no-underline cursor-pointer">
            <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
            @if (role() === 'Admin') { All Programmes } @else { My Programmes }
          </a>
        </div>

        <!-- Skeleton -->
        @if (isLoading()) {
          <div class="animate-pulse space-y-6">

            <!-- Header card skeleton -->
            <div class="lms-card relative overflow-hidden">
              <div class="absolute inset-y-0 left-0 w-1 bg-slate-200"></div>
              <div class="pl-3 space-y-3">
                <div class="flex gap-2">
                  <div class="h-5 bg-slate-200 rounded w-20"></div>
                  <div class="h-5 bg-blue-100 rounded w-14"></div>
                </div>
                <div class="h-7 bg-slate-200 rounded w-2/3"></div>
                <div class="flex gap-4 pt-1">
                  <div class="h-3 bg-slate-100 rounded w-32"></div>
                  <div class="h-3 bg-slate-100 rounded w-20"></div>
                </div>
              </div>
            </div>

            <!-- Module cards skeleton -->
            <div>
              <div class="h-5 bg-slate-200 rounded w-48 mb-4"></div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                @for (_ of [1,2,3,4]; track $index) {
                  <div class="lms-card relative overflow-hidden flex flex-col">
                    <div class="absolute inset-y-0 left-0 w-1 bg-slate-200"></div>
                    <div class="pl-3 space-y-2.5">
                      <div class="h-3 bg-slate-200 rounded w-14"></div>
                      <div class="h-5 bg-slate-200 rounded w-3/4"></div>
                      <div class="space-y-2 pt-1">
                        <div class="h-3 bg-slate-100 rounded w-1/2"></div>
                        <div class="h-3 bg-slate-100 rounded w-2/5"></div>
                      </div>
                      <div class="h-9 bg-slate-200 rounded-lg mt-1"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

          </div>
        } @else if (errorMessage()) {
          <div class="lms-card text-center py-14">
            <div class="inline-flex items-center justify-center w-12 h-12
                        rounded-full bg-red-50 mb-4">
              <mat-icon class="text-red-400"
                        style="font-size:24px;width:24px;height:24px">error_outline</mat-icon>
            </div>
            <h2 class="font-display text-base font-semibold text-slate-800 mb-1.5">
              Programme could not be loaded
            </h2>
            <p class="text-sm text-slate-500 mb-6">{{ errorMessage() }}</p>
            <button mat-stroked-button color="primary" class="min-h-[44px]"
                    type="button" (click)="loadData()">
              Try again
            </button>
          </div>
        } @else { @if (programme(); as p) {

          <!-- Header card -->
          <div class="lms-card mb-6 relative overflow-hidden">
            <div class="absolute inset-y-0 left-0 w-1 bg-primary-600"></div>
            <div class="pl-3">

              <!-- Badges -->
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs
                             font-mono font-semibold rounded">
                  {{ p.code }}
                </span>
                <span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs
                             font-medium rounded">
                  Year {{ p.year }}
                </span>
              </div>

              <!-- Title -->
              <h1 class="font-display text-2xl font-bold text-slate-900
                         leading-tight mb-3">
                {{ p.title }}
              </h1>

              <!-- Meta row -->
              <div class="flex flex-wrap items-center gap-4">
                <div class="flex items-center gap-1.5 text-sm text-slate-500">
                  <mat-icon style="font-size:16px;width:16px;height:16px">business</mat-icon>
                  <span>{{ p.department }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-sm text-slate-500">
                  <mat-icon style="font-size:16px;width:16px;height:16px">book</mat-icon>
                  <span>{{ p.courseCount }} Module{{ p.courseCount === 1 ? '' : 's' }}</span>
                </div>
              </div>

              <!-- Description -->
              @if (p.description) {
                <p class="mt-4 text-sm text-slate-600 leading-relaxed
                          border-t border-slate-100 pt-4">
                  {{ p.description }}
                </p>
              }

            </div>
          </div>

          <!-- Modules section -->
          <div>
            <h2 class="font-display text-lg font-semibold text-slate-900 mb-4">
              Modules in this Programme
            </h2>

            @if (courses().length === 0) {
              <div class="lms-card">
                <div class="flex flex-col items-center py-10 text-center">
                  <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center
                              justify-center mb-3">
                    <mat-icon class="text-slate-400"
                              style="font-size:24px;width:24px;height:24px">menu_book</mat-icon>
                  </div>
                  <p class="text-sm font-medium text-slate-700">
                    No modules in this programme yet.
                  </p>
                </div>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                @for (course of courses(); track course.id) {
                  <div class="lms-card relative overflow-hidden flex flex-col
                              hover:shadow-md transition-shadow cursor-pointer"
                       (click)="navigateToModule(course.id)">

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

                      <!-- Metadata -->
                      <div class="space-y-1.5 mb-4 flex-1">
                        @if (course.lecturerName) {
                          <div class="flex items-center gap-2 text-xs text-slate-500">
                            <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                              person
                            </mat-icon>
                            <span>{{ course.lecturerName }}</span>
                          </div>
                        }
                        @if (course.semesterName) {
                          <div class="flex items-center gap-2 text-xs text-slate-500">
                            <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                              event_note
                            </mat-icon>
                            <span>{{ course.semesterName }}</span>
                          </div>
                        }
                        <div class="flex items-center gap-2 text-xs text-slate-500">
                          <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                            star_outline
                          </mat-icon>
                          <span>{{ course.creditHours }} credit hours</span>
                        </div>
                      </div>

                      <!-- CTA — role-specific label -->
                      @if (role() === 'Student') {
                        <button mat-flat-button color="primary"
                                class="w-full min-h-[40px]"
                                (click)="$event.stopPropagation(); navigateToModule(course.id)">
                          Open Module
                        </button>
                      } @else if (role() === 'Lecturer') {
                        <button mat-flat-button color="primary"
                                class="w-full min-h-[40px]"
                                (click)="$event.stopPropagation(); navigateToModule(course.id)">
                          Manage Module
                        </button>
                      } @else {
                        <button mat-stroked-button color="primary"
                                class="w-full min-h-[40px]"
                                (click)="$event.stopPropagation(); navigateToModule(course.id)">
                          View Module
                        </button>
                      }

                    </div>
                  </div>
                }
              </div>
            }
          </div>

        } }

      </div>
    </div>
  `,
})
export class ProgrammeDetailComponent implements OnInit {
  programme = signal<Programme | null>(null);
  courses = signal<Course[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly role = computed(() => this.authService.currentUser()?.role);

  private programmeId = signal<string | null>(null);

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly programmeService = inject(ProgrammeService);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.programmeId.set(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  loadData(): void {
    const id = this.programmeId();
    if (!id) {
      this.errorMessage.set('The programme link is missing an ID.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      programme: this.programmeService.getById(id),
      courses:   this.programmeService.getCourses(id).pipe(catchError(() => of<Course[]>([]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ programme, courses }) => {
          this.programme.set(programme);
          this.courses.set(courses);
          this.isLoading.set(false);
        },
        error: () => {
          this.programme.set(null);
          this.errorMessage.set('Please go back to Programmes and open the programme again.');
          this.isLoading.set(false);
        },
      });
  }

  navigateToModule(courseId: string): void {
    this.router.navigate(['/courses', courseId]);
  }
}
