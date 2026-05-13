// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN MODELS
// TypeScript interfaces that mirror every backend DTO.
// When a backend DTO changes, update the matching interface here too.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'Student' | 'Lecturer' | 'Admin';
export type SubmissionStatus = 'Draft' | 'Submitted' | 'Late' | 'Graded' | 'Resubmitted';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'NotTaken';
export type NotificationPriority = 'Normal' | 'Important' | 'Urgent';
export type EnrollmentStatus = 'Active' | 'Dropped' | 'Completed';
export type SessionType = 'Lecture' | 'Lab' | 'Tutorial';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserQueryParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface BulkImportResult {
  successCount: number;
  failureCount: number;
  errors: { row: number; message: string }[];
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  creditHours: number;
  isArchived: boolean;
  lecturerName: string;
  semesterName: string;
  enrolledStudentCount: number;
}

export interface CreateCourseRequest {
  code: string;
  title: string;
  description?: string;
  lecturerId: string;
  semesterId: string;
  creditHours: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  lecturerId?: string;
  isArchived?: boolean;
}

export interface CourseQueryParams {
  search?: string;
  semesterId?: string;
  isArchived?: boolean;
  page?: number;
  pageSize?: number;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  maxMarks: number;
  allowResubmission: boolean;
  turnitinEnabled: boolean;
  courseName: string;
  submissionCount: number;
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  deadline: string;
  courseId: string;
  maxMarks: number;
  allowResubmission: boolean;
  turnitinEnabled: boolean;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  deadline?: string;
  allowResubmission?: boolean;
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export interface Submission {
  id: string;
  studentName: string;
  status: SubmissionStatus;
  submittedAt: string;
  isLate: boolean;
  fileName: string | null;
  isGraded: boolean;
}

export interface CreateSubmissionRequest {
  assignmentId: string;
  fileId?: string;
}

export interface GradeSubmissionRequest {
  marksAwarded: number;
  feedback?: string;
}

// ─── Grades ───────────────────────────────────────────────────────────────────

export interface Grade {
  id: string;
  marksAwarded: number;
  letterGrade: string | null;
  gradePoints: number | null;
  isPublished: boolean;
  assignmentTitle: string;
  feedback: string | null;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
}

export interface SendNotificationRequest {
  title: string;
  body: string;
  priority: NotificationPriority;
  recipientIds: string[];
  scheduledAt?: string;
  expiresAt?: string;
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export interface Enrollment {
  id: string;
  studentName: string;
  courseName: string;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface EnrollStudentRequest {
  studentId: string;
  courseId: string;
  semesterId: string;
}

// ─── Timetable ────────────────────────────────────────────────────────────────

export interface TimetableSession {
  id: string;
  courseTitle: string;
  lecturerName: string;
  room: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: SessionType;
  isPublished: boolean;
}

export interface CreateSessionRequest {
  courseId: string;
  lecturerId: string;
  semesterId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  type: SessionType;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  notes: string | null;
}

export interface MarkAttendanceRequest {
  timetableSessionId: string;
  date: string;
  records: { studentId: string; status: AttendanceStatus; notes?: string }[];
}

export interface StudentAttendanceSummary {
  courseId: string;
  courseName: string;
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  belowWarningThreshold: boolean;
}
