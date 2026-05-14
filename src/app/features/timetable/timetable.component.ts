import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TimetableService } from '@core/services/timetable.service';
import { AuthService } from '@core/auth/auth.service';
import { TimetableSession, CreateSessionRequest, SessionType } from '@shared/models/models';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <h1 class="section-title mb-0">Timetable</h1>
        @if (canManage()) {
          <button mat-flat-button color="primary" class="min-h-[44px]"
            [disabled]="isLoading()"
            (click)="toggleCreateForm()">
            {{ showCreateForm() ? 'Cancel' : '+ Create Session' }}
          </button>
        }
      </div>

      @if (showCreateForm()) {
        <mat-card class="mb-6">
          <mat-card-content>
            <form #createForm="ngForm" (ngSubmit)="createSession(createForm.valid)">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <mat-form-field appearance="outline">
                  <mat-label>Course ID</mat-label>
                  <input matInput [(ngModel)]="newSession.courseId" name="courseId" required />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Semester ID</mat-label>
                  <input matInput [(ngModel)]="newSession.semesterId" name="semesterId" required />
                </mat-form-field>

                @if (authService.currentUser()?.role === 'Admin') {
                  <mat-form-field appearance="outline">
                    <mat-label>Lecturer ID</mat-label>
                    <input matInput [(ngModel)]="newSession.lecturerId" name="lecturerId" required />
                  </mat-form-field>
                }

                <mat-form-field appearance="outline">
                  <mat-label>Day</mat-label>
                  <mat-select [(ngModel)]="newSession.dayOfWeek" name="dayOfWeek" required>
                    @for (day of days; track $index) {
                      <mat-option [value]="$index">{{ day }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Start Time</mat-label>
                  <input matInput type="time" [(ngModel)]="newSession.startTime" name="startTime" required />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>End Time</mat-label>
                  <input matInput type="time" [(ngModel)]="newSession.endTime" name="endTime" required />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Room</mat-label>
                  <input matInput [(ngModel)]="newSession.room" name="room" required />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Type</mat-label>
                  <mat-select [(ngModel)]="newSession.type" name="type" required>
                    @for (t of sessionTypes; track t) {
                      <mat-option [value]="t">{{ t }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="flex justify-end gap-3 mt-4">
                <button mat-stroked-button type="button" (click)="toggleCreateForm()">Cancel</button>
                <button mat-flat-button color="primary" type="submit"
                  [disabled]="createForm.invalid || isSaving()">
                  Create Session
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      @if (isLoading() && sessions().length === 0 && !errorMessage()) {
        <div class="flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>
      } @else if (errorMessage()) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-red-400 mb-3">error_outline</mat-icon>
          <p class="text-red-600">{{ errorMessage() }}</p>
        </div>
      } @else if (sessions().length === 0) {
        <div class="lms-card text-center py-12">
          <mat-icon class="text-slate-300 mb-3">schedule</mat-icon>
          <p class="text-slate-500">No timetable sessions available.</p>
        </div>
      } @else {
        <mat-card>
          <mat-card-content class="!p-0">
            <table mat-table [dataSource]="sessions()" class="w-full">
              <ng-container matColumnDef="course">
                <th mat-header-cell *matHeaderCellDef>Course</th>
                <td mat-cell *matCellDef="let s">{{ s.courseTitle }}</td>
              </ng-container>

              <ng-container matColumnDef="day">
                <th mat-header-cell *matHeaderCellDef>Day</th>
                <td mat-cell *matCellDef="let s">{{ s.dayOfWeek }}</td>
              </ng-container>

              <ng-container matColumnDef="time">
                <th mat-header-cell *matHeaderCellDef>Time</th>
                <td mat-cell *matCellDef="let s">{{ s.startTime }} – {{ s.endTime }}</td>
              </ng-container>

              <ng-container matColumnDef="room">
                <th mat-header-cell *matHeaderCellDef>Room</th>
                <td mat-cell *matCellDef="let s">{{ s.room }}</td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let s">{{ s.type }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let s">
                  <span [class]="s.isPublished
                    ? 'text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full'
                    : 'text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full'">
                    {{ s.isPublished ? 'Published' : 'Draft' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let s" class="text-right">
                  @if (!s.isPublished) {
                    <button mat-stroked-button color="primary" class="mr-2"
                      [disabled]="isLoading()"
                      (click)="publishSession(s)">
                      Publish
                    </button>
                  }
                  <button mat-stroked-button color="warn"
                    [disabled]="isLoading()"
                    (click)="deleteSession(s)">
                    Delete
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class TimetableComponent implements OnInit {
  sessions = signal<TimetableSession[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isSaving = signal(false);
  showCreateForm = signal(false);

  newSession: CreateSessionRequest = this.emptySession();

  readonly days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  readonly sessionTypes: SessionType[] = ['Lecture', 'Lab', 'Tutorial'];

  readonly canManage = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Lecturer' || role === 'Admin';
  });

  readonly displayedColumns = computed(() => {
    const base = ['course', 'day', 'time', 'room', 'type', 'status'];
    return this.canManage() ? [...base, 'actions'] : base;
  });

  readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly timetableService = inject(TimetableService);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadSessions();
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    if (!this.showCreateForm()) {
      this.newSession = this.emptySession();
    }
  }

  createSession(valid: boolean | null): void {
    if (!valid) return;

    const user = this.authService.currentUser();
    const request: CreateSessionRequest = {
      ...this.newSession,
      lecturerId: user?.role === 'Lecturer' ? (user.id ?? this.newSession.lecturerId) : this.newSession.lecturerId,
    };

    this.isSaving.set(true);
    this.timetableService.createSession(request).subscribe({
      next: (session) => {
        this.sessions.update(s => [...s, session]);
        this.snackBar.open('Session created successfully.', 'Dismiss', { duration: 4000 });
        this.showCreateForm.set(false);
        this.newSession = this.emptySession();
        this.isSaving.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to create session.', 'Dismiss', { duration: 4000 });
        this.isSaving.set(false);
      },
    });
  }

  publishSession(session: TimetableSession): void {
    this.isLoading.set(true);
    this.timetableService.publishSession(session.id).subscribe({
      next: () => {
        this.sessions.update(s => s.map(item =>
          item.id === session.id ? { ...item, isPublished: true } : item,
        ));
        this.snackBar.open('Session published.', 'Dismiss', { duration: 3000 });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to publish session.', 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }

  deleteSession(session: TimetableSession): void {
    this.isLoading.set(true);
    this.timetableService.deleteSession(session.id).subscribe({
      next: () => {
        this.sessions.update(s => s.filter(item => item.id !== session.id));
        this.snackBar.open('Session deleted.', 'Dismiss', { duration: 3000 });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to delete session.', 'Dismiss', { duration: 4000 });
        this.isLoading.set(false);
      },
    });
  }

  private loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.timetableService.getSessions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.sessions.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load timetable.');
          this.isLoading.set(false);
        },
      });
  }

  private emptySession(): CreateSessionRequest {
    return {
      courseId: '',
      lecturerId: '',
      semesterId: '',
      dayOfWeek: 1,
      startTime: '',
      endTime: '',
      room: '',
      type: 'Lecture',
    };
  }
}
