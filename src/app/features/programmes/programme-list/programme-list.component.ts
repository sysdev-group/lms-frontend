import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '@core/auth/auth.service';
import { ProgrammeService } from '../programme.service';
import { ProgrammeList } from '@shared/models/models';
import { ProgrammeCreateDialogComponent } from '../programme-create-dialog/programme-create-dialog.component';

@Component({
  selector: 'app-programme-list',
  standalone: true,
  imports: [
    MatButtonModule,
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
            @if (role() === 'Admin') { All Programmes } @else { My Programmes }
          </h1>
          <p class="text-sm text-slate-500 mt-0.5">
            @if (role() === 'Student') { Your enrolled programmes and their modules }
            @else if (role() === 'Lecturer') { Programmes you are teaching in }
            @else { All programmes offered by the institution }
          </p>
        </div>
        @if (role() === 'Admin') {
          <button mat-flat-button color="primary" class="min-h-[44px]"
                  (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Create Programme
          </button>
        }
      </div>

      <!-- Skeleton -->
      @if (isLoading()) {
        <div class="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="lms-card relative overflow-hidden flex flex-col">
              <div class="absolute inset-y-0 left-0 w-1 bg-slate-200"></div>
              <div class="pl-3 space-y-3">
                <div class="flex gap-2">
                  <div class="h-5 bg-slate-200 rounded w-16"></div>
                  <div class="h-5 bg-blue-100 rounded w-12"></div>
                </div>
                <div class="h-5 bg-slate-200 rounded w-3/4"></div>
                <div class="space-y-2 pt-1">
                  <div class="h-3 bg-slate-100 rounded w-1/2"></div>
                  <div class="h-3 bg-slate-100 rounded w-2/5"></div>
                </div>
                <div class="h-9 bg-slate-200 rounded-lg mt-2"></div>
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
      @else if (programmes().length === 0) {
        <div class="lms-card">
          <div class="flex flex-col items-center py-12 text-center">
            <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <mat-icon class="text-slate-400"
                        style="font-size:28px;width:28px;height:28px">school</mat-icon>
            </div>
            @if (role() === 'Student') {
              <p class="text-sm font-semibold text-slate-700">
                You are not enrolled in any programmes yet.
              </p>
              <p class="text-xs text-slate-400 mt-1">
                Contact your administrator to be enrolled in a programme.
              </p>
            } @else if (role() === 'Lecturer') {
              <p class="text-sm font-semibold text-slate-700">
                You are not assigned to any programmes yet.
              </p>
              <p class="text-xs text-slate-400 mt-1">
                Contact your administrator.
              </p>
            } @else {
              <p class="text-sm font-semibold text-slate-700">No programmes yet.</p>
              <p class="text-xs text-slate-400 mt-1">
                Create a programme to get started.
              </p>
              <button mat-flat-button color="primary" class="mt-5 min-h-[44px]"
                      (click)="openCreateDialog()">
                Create Programme
              </button>
            }
          </div>
        </div>
      }

      <!-- Programme grid -->
      @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (prog of programmes(); track prog.id) {
            <div class="lms-card relative overflow-hidden flex flex-col
                        hover:shadow-md transition-shadow cursor-pointer"
                 (click)="navigateToProgramme(prog.id)">

              <!-- Left accent bar -->
              <div class="absolute inset-y-0 left-0 w-1 bg-primary-600"></div>

              <div class="pl-3 flex flex-col flex-1">

                <!-- Code + Year badges -->
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs
                               font-mono font-semibold rounded">
                    {{ prog.code }}
                  </span>
                  <span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs
                               font-medium rounded">
                    Year {{ prog.year }}
                  </span>
                </div>

                <!-- Programme title -->
                <h3 class="font-display font-semibold text-slate-900 text-sm
                           leading-snug mb-3">
                  {{ prog.title }}
                </h3>

                <!-- Metadata -->
                <div class="space-y-1.5 mb-4 flex-1">
                  <div class="flex items-center gap-2 text-sm text-slate-500">
                    <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                      business
                    </mat-icon>
                    <span>{{ prog.department }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm text-slate-500">
                    <mat-icon style="font-size:14px;width:14px;height:14px;line-height:14px">
                      book
                    </mat-icon>
                    <span>{{ prog.courseCount }} Module{{ prog.courseCount === 1 ? '' : 's' }}</span>
                  </div>
                </div>

                <!-- CTA -->
                <button mat-flat-button color="primary"
                        class="w-full min-h-[40px]"
                        (click)="$event.stopPropagation(); navigateToProgramme(prog.id)">
                  View Modules
                </button>

              </div>
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class ProgrammeListComponent implements OnInit {
  programmes = signal<ProgrammeList[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly role = computed(() => this.authService.currentUser()?.role);

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly programmeService = inject(ProgrammeService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadProgrammes();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ProgrammeCreateDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((created: boolean) => {
      if (created) {
        this.snackBar.open('Programme created successfully.', 'Dismiss', { duration: 4000 });
        this.loadProgrammes();
      }
    });
  }

  navigateToProgramme(id: string): void {
    this.router.navigate(['/programmes', id]);
  }

  private loadProgrammes(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.programmeService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: programmes => {
          this.programmes.set(programmes);
          this.isLoading.set(false);
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to load programmes.';
          this.errorMessage.set(msg);
          this.snackBar.open(msg, 'Dismiss', { duration: 4000 });
          this.isLoading.set(false);
        },
      });
  }
}
