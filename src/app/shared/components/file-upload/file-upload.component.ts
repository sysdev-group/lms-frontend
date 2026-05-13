import { Component, EventEmitter, Input, OnDestroy, Output, signal, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FileService, UploadEvent } from '@core/services/file.service';
import { FileMetadata } from '@shared/models/models';

// Section 21.2 — default allowed file types
const DEFAULT_EXTENSIONS = [
  '.pdf', '.docx', '.pptx',
  '.jpg', '.jpeg', '.png',
  '.zip',
  '.py', '.java', '.cs', '.js', '.ts',
];

type UploadState = 'idle' | 'uploading' | 'success';

/**
 * Reusable file upload component — Section 21.
 *
 * Usage:
 *   <app-file-upload
 *     [relatedEntity]="'assignment'"
 *     [entityId]="assignmentId"
 *     (uploaded)="onFileUploaded($event)" />
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <!-- ── Idle: drop zone ─────────────────────────────────────────────────── -->
    @if (state() === 'idle') {
      <div
        class="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center
               cursor-pointer select-none transition-all duration-200
               hover:border-primary-300 hover:bg-primary-50
               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        [class.!border-primary-400]="isDragOver()"
        [class.!bg-primary-50]="isDragOver()"
        (click)="fileInput.click()"
        (keydown.enter)="fileInput.click()"
        (keydown.space)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        tabindex="0"
        role="button"
        aria-label="Upload a file">

        <!-- Hidden native input — handles both click-to-browse and mobile tap -->
        <input
          #fileInput
          type="file"
          class="hidden"
          [accept]="acceptAttr"
          (change)="onFileSelected($event)" />

        <mat-icon class="!text-5xl !w-12 !h-12 text-slate-300 mb-3 block mx-auto">
          cloud_upload
        </mat-icon>
        <p class="text-slate-600 font-medium">Drag & drop your file here</p>
        <p class="text-slate-400 text-sm mt-1">or tap to browse</p>
        <p class="text-xs text-slate-400 mt-3">
          {{ acceptedHint }} &nbsp;·&nbsp; Max {{ maxSizeMb }} MB
        </p>

        @if (validationError()) {
          <div class="mt-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-left">
            <mat-icon class="!text-base !h-4 !w-4 flex-shrink-0 mt-0.5 text-red-500">error_outline</mat-icon>
            <p class="text-sm text-red-700">{{ validationError() }}</p>
          </div>
        }
      </div>
    }

    <!-- ── Uploading: progress view ─────────────────────────────────────────── -->
    @if (state() === 'uploading') {
      <div class="rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-4">
          <mat-icon class="text-primary-500 flex-shrink-0">insert_drive_file</mat-icon>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-700 truncate">
              {{ selectedFile()?.name }}
            </p>
            <p class="text-xs text-slate-400 mt-0.5">{{ fileSizeLabel() }}</p>
          </div>
          <span class="text-sm font-semibold text-primary-600 flex-shrink-0 tabular-nums">
            {{ uploadProgress() }}%
          </span>
        </div>
        <mat-progress-bar mode="determinate" [value]="uploadProgress()" />
      </div>
    }

    <!-- ── Success ──────────────────────────────────────────────────────────── -->
    @if (state() === 'success') {
      <div class="rounded-xl border border-green-200 bg-green-50/60 p-8 text-center">
        <mat-icon class="!text-5xl !w-12 !h-12 text-green-500 mb-3 block mx-auto">
          check_circle
        </mat-icon>
        <p class="font-medium text-slate-700 truncate px-4">
          {{ uploadedFile()?.originalName }}
        </p>
        <p class="text-sm text-slate-500 mt-1">Uploaded successfully</p>
        <button mat-stroked-button class="mt-5" (click)="reset()">
          <mat-icon>upload</mat-icon>
          Upload another
        </button>
      </div>
    }
  `,
})
export class FileUploadComponent implements OnDestroy {
  @Input() allowedExtensions: string[] = DEFAULT_EXTENSIONS;
  @Input() maxSizeMb: number = 25;
  /** Context for the backend — which entity this file belongs to. */
  @Input() relatedEntity: string = '';
  @Input() entityId: string = '';
  /** Emits the saved file metadata after a successful upload. */
  @Output() uploaded = new EventEmitter<FileMetadata>();

  // ── Internal state ──────────────────────────────────────────────────────────
  state = signal<UploadState>('idle');
  uploadProgress = signal(0);
  validationError = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  uploadedFile = signal<FileMetadata | null>(null);
  isDragOver = signal(false);
  private uploadSub?: Subscription;

  fileSizeLabel = computed(() => {
    const file = this.selectedFile();
    if (!file) return '';
    return file.size < 1_048_576
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / 1_048_576).toFixed(1)} MB`;
  });

  // Derived from @Input — use getters since @Input() fields are not signals
  get acceptAttr(): string {
    return this.allowedExtensions.join(',');
  }

  get acceptedHint(): string {
    return this.allowedExtensions.join(', ');
  }

  constructor(private fileService: FileService) {}

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.handleFile(input.files[0]);
    input.value = ''; // allow re-selecting the same file
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    // Only clear highlight when leaving the drop zone itself, not a child element
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      this.isDragOver.set(false);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    if (event.dataTransfer?.files?.[0]) this.handleFile(event.dataTransfer.files[0]);
  }

  reset(): void {
    this.state.set('idle');
    this.uploadProgress.set(0);
    this.validationError.set(null);
    this.selectedFile.set(null);
    this.uploadedFile.set(null);
  }

  private handleFile(file: File): void {
    const error = this.validate(file);
    if (error) {
      this.validationError.set(error);
      return;
    }

    this.validationError.set(null);
    this.selectedFile.set(file);
    this.state.set('uploading');
    this.uploadProgress.set(0);

    this.uploadSub = this.fileService.uploadFile(file, this.relatedEntity, this.entityId).subscribe({
      next: (event: UploadEvent) => {
        if (event.type === 'progress') {
          this.uploadProgress.set(event.percent);
        } else {
          this.uploadedFile.set(event.file);
          this.uploadProgress.set(100);
          this.state.set('success');
          this.uploaded.emit(event.file);
        }
      },
      error: () => this.reset(),
    });
  }

  private validate(file: File): string | null {
    const parts = file.name.split('.');
    if (parts.length < 2) {
      return 'File has no extension. Please upload a supported file type.';
    }
    const ext = '.' + parts.pop()!.toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      return `File type not allowed. Accepted: ${this.allowedExtensions.join(', ')}`;
    }
    if (file.size > this.maxSizeMb * 1_048_576) {
      return `File exceeds the ${this.maxSizeMb} MB size limit.`;
    }
    return null;
  }
}
