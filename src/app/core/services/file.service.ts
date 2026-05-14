import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse } from '@shared/models/api-response.model';
import { FileMetadata } from '@shared/models/models';

export interface UploadProgressEvent {
  type: 'progress';
  percent: number;
}

export interface UploadCompleteEvent {
  type: 'complete';
  file: FileMetadata;
}

export type UploadEvent = UploadProgressEvent | UploadCompleteEvent;

/**
 * File upload, download, and delete service.
 * Uses HttpClient directly (not ApiService) because upload needs
 * reportProgress and download needs responseType: 'blob'.
 * Sections 21 and 25.5.
 */
@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Upload a file with progress reporting.
   * Emits UploadProgressEvent (0–100%) then a final UploadCompleteEvent.
   */
  uploadFile(file: File, relatedEntity: string, entityId: string): Observable<UploadEvent> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('relatedEntity', relatedEntity);
    formData.append('entityId', entityId);

    const req = new HttpRequest('POST', `${this.baseUrl}/files/upload`, formData, {
      reportProgress: true,
    });

    return this.http.request<ApiResponse<FileMetadata>>(req).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const percent = event.total ? Math.round(100 * event.loaded / event.total) : 0;
          return { type: 'progress' as const, percent };
        }
        if (event.type === HttpEventType.Response && event.body) {
          return { type: 'complete' as const, file: event.body.data! };
        }
        return null;
      }),
      filter((e): e is UploadEvent => e !== null),
    );
  }

  /**
   * Download a file by ID — triggers a browser file download.
   * Filename is read from the Content-Disposition response header.
   */
  downloadFile(fileId: string): Observable<void> {
    return this.http
      .get(`${this.baseUrl}/files/${fileId}/download`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map(response => {
          const disposition = response.headers.get('Content-Disposition') ?? '';
          const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          const filename = match ? match[1].replace(/['"]/g, '') : 'download';
          const url = URL.createObjectURL(response.body!);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }),
      );
  }

  /** Delete a file by ID. */
  deleteFile(fileId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/files/${fileId}`)
      .pipe(map(() => void 0));
  }
}
