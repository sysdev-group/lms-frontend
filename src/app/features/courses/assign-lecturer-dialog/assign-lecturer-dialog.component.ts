import { Component, DestroyRef, Inject, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '@core/services/user.service';
import { CourseService } from '@core/services/course.service';
import { User } from '@shared/models/models';

export interface AssignLecturerDialogData {
  courseId: string;
  lecturerName: string | null;
}

@Component({
  selector: 'app-assign-lecturer-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="p-6 w-full" style="min-width:380px;max-width:480px">

      <!-- Heading -->
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <mat-icon class="text-blue-600" style="font-size:22px;width:22px;height:22px">
            person_add
          </mat-icon>
        </div>
        <h2 class="font-display text-lg font-bold text-slate-900 leading-tight m-0">
          Assign Lecturer
        </h2>
      </div>

      <!-- Current lecturer -->
      <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-5">
        <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center
                    justify-center shrink-0">
          @if (data.lecturerName) {
            <span class="text-xs font-bold text-blue-700">
              {{ data.lecturerName[0].toUpperCase() }}
            </span>
          } @else {
            <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px">
              person_outline
            </mat-icon>
          }
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium uppercase tracking-wide leading-none mb-0.5">
            Currently assigned
          </p>
          <p class="text-sm font-semibold text-slate-800">
            {{ data.lecturerName ?? 'No lecturer assigned' }}
          </p>
        </div>
      </div>

      <!-- Lecturer select -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-6">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else {
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Select Lecturer</mat-label>
          <mat-select [formControl]="lecturerControl">
            @for (lecturer of lecturers(); track lecturer.id) {
              <mat-option [value]="lecturer.id">
                {{ lecturer.firstName }} {{ lecturer.lastName }}
                <span class="text-slate-400 text-xs ml-1">· {{ lecturer.email }}</span>
              </mat-option>
            }
          </mat-select>
          @if (lecturers().length === 0) {
            <mat-hint>No active lecturers found.</mat-hint>
          }
        </mat-form-field>
      }

      <!-- Error -->
      @if (errorMessage()) {
        <div class="flex items-center gap-2 p-3 rounded-lg bg-red-50 mb-4 mt-1">
          <mat-icon class="text-red-500 shrink-0" style="font-size:18px;width:18px;height:18px">
            error_outline
          </mat-icon>
          <p class="text-sm text-red-700 m-0">{{ errorMessage() }}</p>
        </div>
      }

      <!-- Actions -->
      <div class="flex justify-end gap-3 mt-5">
        <button mat-stroked-button class="min-h-[44px]" type="button"
                (click)="cancel()" [disabled]="isSaving()">
          Cancel
        </button>
        <button mat-flat-button color="primary" class="min-h-[44px]" type="button"
                (click)="assign()"
                [disabled]="lecturerControl.invalid || isSaving() || isLoading()">
          @if (isSaving()) {
            <mat-spinner diameter="18" style="display:inline-block"></mat-spinner>
          } @else {
            Assign
          }
        </button>
      </div>

    </div>
  `,
})
export class AssignLecturerDialogComponent implements OnInit {
  lecturers = signal<User[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  readonly lecturerControl = new FormControl<string | null>(null, Validators.required);

  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(UserService);
  private readonly courseService = inject(CourseService);

  constructor(
    public dialogRef: MatDialogRef<AssignLecturerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignLecturerDialogData,
  ) {}

  ngOnInit(): void {
    this.loadLecturers();
  }

  private loadLecturers(): void {
    this.isLoading.set(true);
    this.userService.getUsers({ role: 'Lecturer', pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.lecturers.set(result.items);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load lecturers.');
          this.isLoading.set(false);
        },
      });
  }

  assign(): void {
    const lecturerId = this.lecturerControl.value;
    if (!lecturerId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.courseService.updateCourse(this.data.courseId, { lecturerId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.dialogRef.close(true);
        },
        error: () => {
          this.errorMessage.set('Failed to assign lecturer. Please try again.');
          this.isSaving.set(false);
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
