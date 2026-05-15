import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse } from '@shared/models/api-response.model';
import { ApiService } from './api.service';
import { FileUploadResult } from '@shared/models/models';

@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private api: ApiService,
  ) {}

  /** Upload a file to Cloudinary — returns metadata including the secure URL. */
  uploadFile(file: File): Observable<FileUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<FileUploadResult>('/files/upload', formData);
  }

  /** Download a file by ID — triggers a browser download via blob. */
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
