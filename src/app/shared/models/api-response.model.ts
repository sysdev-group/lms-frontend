/**
 * Standard API response envelope — mirrors ApiResponse<T> from the backend.
 * Every HTTP response from the LMS API will have this shape. See Section 25.3.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: string[] | null;
  pagination: PaginationMeta | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
