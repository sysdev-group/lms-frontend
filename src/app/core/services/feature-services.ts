// ─────────────────────────────────────────────────────────────────────────────
// FEATURE SERVICES
//
// One service per module. Each service:
//   - Injects ApiService (not HttpClient directly)
//   - Maps to the correct API endpoint from Section 25.5
//   - Returns typed Observables using the domain models
//
// HOW TO ADD A METHOD:
//   return this.api.get<Course[]>('/courses');
//   return this.api.post<Course>('/courses', request);
//   return this.api.put<Course>(`/courses/${id}`, request);
//   return this.api.delete(`/courses/${id}`);
//
// All methods are stubs — implement by calling the correct api.* method.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { PaginatedResult } from '@shared/models/api-response.model';
import {
  User,
  Course, CreateCourseRequest, UpdateCourseRequest, CourseQueryParams,
  Assignment, CreateAssignmentRequest, UpdateAssignmentRequest,
  Submission, CreateSubmissionRequest, GradeSubmissionRequest,
  Grade,
  Notification, SendNotificationRequest,
  Enrollment, EnrollStudentRequest,
  TimetableSession, CreateSessionRequest,
  AttendanceRecord, MarkAttendanceRequest, StudentAttendanceSummary,
} from '@shared/models/models';

// ─── COURSE SERVICE ───────────────────────────────────────────────────────────
/** Docs: Section 7.4 — Course Module */
@Injectable({ providedIn: 'root' })
export class CourseService {
  constructor(private api: ApiService) {}

  getCourses(params?: CourseQueryParams): Observable<PaginatedResult<Course>> {
    // TODO: return this.api.get<PaginatedResult<Course>>('/courses', params as any);
    throw new Error('CourseService.getCourses — not yet implemented');
  }

  getCourseById(id: string): Observable<Course> {
    // TODO: return this.api.get<Course>(`/courses/${id}`);
    throw new Error('CourseService.getCourseById — not yet implemented');
  }

  getCourseStudents(id: string): Observable<User[]> {
    // TODO: return this.api.get<User[]>(`/courses/${id}/students`);
    throw new Error('CourseService.getCourseStudents — not yet implemented');
  }

  createCourse(request: CreateCourseRequest): Observable<Course> {
    // TODO: return this.api.post<Course>('/courses', request);
    throw new Error('CourseService.createCourse — not yet implemented');
  }

  updateCourse(id: string, request: UpdateCourseRequest): Observable<Course> {
    // TODO: return this.api.put<Course>(`/courses/${id}`, request);
    throw new Error('CourseService.updateCourse — not yet implemented');
  }
}

// ─── ASSIGNMENT SERVICE ───────────────────────────────────────────────────────
/** Docs: Section 7.5 — Assignment Module */
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  constructor(private api: ApiService) {}

  getAssignmentsByCourse(courseId: string): Observable<Assignment[]> {
    // TODO: return this.api.get<Assignment[]>('/assignments', { courseId });
    throw new Error('AssignmentService.getAssignmentsByCourse — not yet implemented');
  }

  getAssignmentById(id: string): Observable<Assignment> {
    // TODO: return this.api.get<Assignment>(`/assignments/${id}`);
    throw new Error('AssignmentService.getAssignmentById — not yet implemented');
  }

  createAssignment(request: CreateAssignmentRequest): Observable<Assignment> {
    // TODO: return this.api.post<Assignment>('/assignments', request);
    throw new Error('AssignmentService.createAssignment — not yet implemented');
  }

  updateAssignment(id: string, request: UpdateAssignmentRequest): Observable<Assignment> {
    // TODO: return this.api.put<Assignment>(`/assignments/${id}`, request);
    throw new Error('AssignmentService.updateAssignment — not yet implemented');
  }

  gradeSubmission(submissionId: string, request: GradeSubmissionRequest): Observable<Submission> {
    // TODO: return this.api.put<Submission>(`/assignments/${submissionId}/grade`, request);
    throw new Error('AssignmentService.gradeSubmission — not yet implemented');
  }
}

// ─── SUBMISSION SERVICE ───────────────────────────────────────────────────────
/** Docs: Section 7.5 — Assignment Module (Submissions) */
@Injectable({ providedIn: 'root' })
export class SubmissionService {
  constructor(private api: ApiService) {}

  submit(request: CreateSubmissionRequest): Observable<Submission> {
    // TODO: return this.api.post<Submission>('/submissions', request);
    throw new Error('SubmissionService.submit — not yet implemented');
  }

  getById(id: string): Observable<Submission> {
    // TODO: return this.api.get<Submission>(`/submissions/${id}`);
    throw new Error('SubmissionService.getById — not yet implemented');
  }

  getByAssignment(assignmentId: string): Observable<Submission[]> {
    // TODO: return this.api.get<Submission[]>(`/submissions/assignment/${assignmentId}`);
    throw new Error('SubmissionService.getByAssignment — not yet implemented');
  }
}

// ─── GRADE SERVICE ────────────────────────────────────────────────────────────
/** Docs: Section 7.6 + Section 27 — Grading Module */
@Injectable({ providedIn: 'root' })
export class GradeService {
  constructor(private api: ApiService) {}

  getMyGrades(courseId?: string): Observable<Grade[]> {
    // TODO: return this.api.get<Grade[]>('/grades/student/me', courseId ? { courseId } : undefined);
    throw new Error('GradeService.getMyGrades — not yet implemented');
  }

  getGradesByCourse(courseId: string): Observable<Grade[]> {
    // TODO: return this.api.get<Grade[]>(`/grades/course/${courseId}`);
    throw new Error('GradeService.getGradesByCourse — not yet implemented');
  }

  publishGrade(gradeId: string): Observable<void> {
    // TODO: return this.api.patch<void>(`/grades/${gradeId}/publish`);
    throw new Error('GradeService.publishGrade — not yet implemented');
  }
}

// ─── NOTIFICATION SERVICE ─────────────────────────────────────────────────────
/** Docs: Section 7.7 + Section 23 — Notification System */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private api: ApiService) {}

  getMyNotifications(unreadOnly = false): Observable<Notification[]> {
    // TODO: return this.api.get<Notification[]>('/notifications', { unreadOnly });
    throw new Error('NotificationService.getMyNotifications — not yet implemented');
  }

  send(request: SendNotificationRequest): Observable<void> {
    // TODO: return this.api.post<void>('/notifications', request);
    throw new Error('NotificationService.send — not yet implemented');
  }

  markAsRead(id: string): Observable<void> {
    // TODO: return this.api.patch<void>(`/notifications/${id}/read`);
    throw new Error('NotificationService.markAsRead — not yet implemented');
  }
}

// ─── ENROLLMENT SERVICE ───────────────────────────────────────────────────────
/** Docs: Section 28 — Enrollment Workflow */
@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  constructor(private api: ApiService) {}

  enroll(request: EnrollStudentRequest): Observable<Enrollment> {
    // TODO: return this.api.post<Enrollment>('/enrollment', request);
    throw new Error('EnrollmentService.enroll — not yet implemented');
  }

  drop(enrollmentId: string): Observable<void> {
    // TODO: return this.api.delete(`/enrollment/${enrollmentId}`);
    throw new Error('EnrollmentService.drop — not yet implemented');
  }

  getMyEnrollments(): Observable<Enrollment[]> {
    // TODO: return this.api.get<Enrollment[]>('/enrollment/student/me');
    throw new Error('EnrollmentService.getMyEnrollments — not yet implemented');
  }
}

// ─── TIMETABLE SERVICE ────────────────────────────────────────────────────────
/** Docs: Section 24 — Timetable Management Module */
@Injectable({ providedIn: 'root' })
export class TimetableService {
  constructor(private api: ApiService) {}

  getSessionsBySemester(semesterId: string): Observable<TimetableSession[]> {
    // TODO: return this.api.get<TimetableSession[]>(`/timetable/batch/${semesterId}`);
    throw new Error('TimetableService.getSessionsBySemester — not yet implemented');
  }

  createSession(request: CreateSessionRequest): Observable<TimetableSession> {
    // TODO: return this.api.post<TimetableSession>('/timetable', request);
    throw new Error('TimetableService.createSession — not yet implemented');
  }

  publishSession(id: string): Observable<void> {
    // TODO: return this.api.put<void>(`/timetable/${id}/publish`, {});
    throw new Error('TimetableService.publishSession — not yet implemented');
  }
}

// ─── ATTENDANCE SERVICE ───────────────────────────────────────────────────────
/** Docs: Section 26 — Attendance Management Module */
@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(private api: ApiService) {}

  markAttendance(sessionId: string, request: MarkAttendanceRequest): Observable<void> {
    // TODO: return this.api.post<void>(`/attendance/session/${sessionId}`, request);
    throw new Error('AttendanceService.markAttendance — not yet implemented');
  }

  getMyAttendanceSummary(): Observable<StudentAttendanceSummary[]> {
    // TODO: return this.api.get<StudentAttendanceSummary[]>('/attendance/student/me');
    throw new Error('AttendanceService.getMyAttendanceSummary — not yet implemented');
  }
}
