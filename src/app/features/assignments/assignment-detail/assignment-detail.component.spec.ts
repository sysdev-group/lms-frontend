import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { AssignmentDetailComponent } from './assignment-detail.component';
import { AssignmentService } from '@core/services/assignment.service';
import { SubmissionService } from '@core/services/submission.service';
import { GradeService } from '@core/services/grade.service';
import { AuthService } from '@core/auth/auth.service';
import { Assignment, Grade, Submission } from '@shared/models/models';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const ASSIGNMENT_ID = 'asgn-1';

function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: ASSIGNMENT_ID,
    title: 'Test Assignment',
    description: 'A description',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    maxMarks: 100,
    allowResubmission: false,
    turnitinEnabled: false,
    courseName: 'CS101',
    submissionCount: 0,
    ...overrides,
  };
}

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 'sub-1',
    assignmentId: ASSIGNMENT_ID,
    studentName: 'Alice',
    status: 'Submitted',
    submittedAt: '2024-03-01T10:00:00Z',
    isLate: false,
    fileName: 'essay.pdf',
    isGraded: false,
    ...overrides,
  };
}

function makeGrade(overrides: Partial<Grade> = {}): Grade {
  return {
    id: 'grade-1',
    marksAwarded: 85,
    letterGrade: 'A',
    gradePoints: 4.0,
    isPublished: true,
    assignmentTitle: 'Test Assignment',
    feedback: 'Great work!',
    ...overrides,
  };
}

// ─── Spy factories ────────────────────────────────────────────────────────────

function makeAssignmentService(assignment = makeAssignment()) {
  return {
    getAssignmentById: jasmine.createSpy().and.returnValue(of(assignment)),
  };
}

function makeSubmissionService() {
  return {
    getMySubmissions: jasmine.createSpy().and.returnValue(of([])),
    getByAssignment: jasmine.createSpy().and.returnValue(of([])),
    submit: jasmine.createSpy().and.returnValue(of(makeSubmission())),
  };
}

function makeGradeService() {
  return {
    getGradesByStudent: jasmine.createSpy().and.returnValue(of([])),
    gradeSubmission: jasmine.createSpy().and.returnValue(of(makeGrade())),
    publishGrade: jasmine.createSpy().and.returnValue(of(undefined)),
  };
}

function makeAuthService(role: 'Student' | 'Lecturer' | 'Admin' = 'Student') {
  const roleSignal = signal<'Student' | 'Lecturer' | 'Admin'>(role);
  return { userRole: roleSignal };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function createComponent(
  role: 'Student' | 'Lecturer' | 'Admin' = 'Student',
  assignmentSvc = makeAssignmentService(),
  submissionSvc = makeSubmissionService(),
  gradeSvc = makeGradeService(),
) {
  const authSvc = makeAuthService(role);
  await TestBed.configureTestingModule({
    imports: [AssignmentDetailComponent, ReactiveFormsModule, NoopAnimationsModule],
    providers: [
      { provide: AssignmentService, useValue: assignmentSvc },
      { provide: SubmissionService, useValue: submissionSvc },
      { provide: GradeService, useValue: gradeSvc },
      { provide: AuthService, useValue: authSvc },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => ASSIGNMENT_ID } } },
      },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<AssignmentDetailComponent> = TestBed.createComponent(AssignmentDetailComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AssignmentDetailComponent', () => {

  describe('component creation', () => {
    it('creates successfully', async () => {
      const { component } = await createComponent();
      expect(component).toBeTruthy();
    });
  });

  // ── Service call arguments ─────────────────────────────────────────────────

  describe('service call arguments', () => {
    it('calls getAssignmentById with the route param id', async () => {
      const asgSvc = makeAssignmentService();
      await createComponent('Student', asgSvc);
      expect(asgSvc.getAssignmentById).toHaveBeenCalledWith(ASSIGNMENT_ID);
    });

    it('calls getMySubmissions for students', async () => {
      const subSvc = makeSubmissionService();
      await createComponent('Student', makeAssignmentService(), subSvc);
      expect(subSvc.getMySubmissions).toHaveBeenCalled();
    });

    it('calls getByAssignment with the route param id for lecturers', async () => {
      const subSvc = makeSubmissionService();
      await createComponent('Lecturer', makeAssignmentService(), subSvc);
      expect(subSvc.getByAssignment).toHaveBeenCalledWith(ASSIGNMENT_ID);
    });

    it('does NOT call getMySubmissions for lecturers', async () => {
      const subSvc = makeSubmissionService();
      await createComponent('Lecturer', makeAssignmentService(), subSvc);
      expect(subSvc.getMySubmissions).not.toHaveBeenCalled();
    });
  });

  // ── Loading / success / error signals ─────────────────────────────────────

  describe('loading state', () => {
    it('sets isLoading false after student data loads', async () => {
      const { component } = await createComponent('Student');
      expect(component.isLoading()).toBeFalse();
    });

    it('sets isLoading false after lecturer data loads', async () => {
      const { component } = await createComponent('Lecturer');
      expect(component.isLoading()).toBeFalse();
    });

    it('sets error signal and clears isLoading on assignment load failure', async () => {
      const asgSvc = { getAssignmentById: jasmine.createSpy().and.returnValue(throwError(() => ({ error: { message: 'Not found' } }))) };
      const subSvc = makeSubmissionService();
      const { component } = await createComponent('Student', asgSvc as any, subSvc);
      expect(component.isLoading()).toBeFalse();
      expect(component.error()).toBe('Not found');
    });

    it('falls back to default error message when error has no message', async () => {
      const asgSvc = { getAssignmentById: jasmine.createSpy().and.returnValue(throwError(() => ({}))) };
      const { component } = await createComponent('Student', asgSvc as any);
      expect(component.error()).toBe('Failed to load assignment.');
    });
  });

  describe('assignment signal', () => {
    it('populates assignment signal after load', async () => {
      const assignment = makeAssignment({ title: 'Essay One' });
      const { component } = await createComponent('Student', makeAssignmentService(assignment));
      expect(component.assignment()?.title).toBe('Essay One');
    });
  });

  // ── Student — mySubmission signal ─────────────────────────────────────────

  describe('student — mySubmission', () => {
    it('sets mySubmission to null when no matching submission exists', async () => {
      const subSvc = makeSubmissionService();
      subSvc.getMySubmissions.and.returnValue(of([makeSubmission({ assignmentId: 'other' })]));
      const { component } = await createComponent('Student', makeAssignmentService(), subSvc);
      expect(component.mySubmission()).toBeNull();
    });

    it('sets mySubmission when a matching submission exists', async () => {
      const sub = makeSubmission({ assignmentId: ASSIGNMENT_ID });
      const subSvc = makeSubmissionService();
      subSvc.getMySubmissions.and.returnValue(of([sub]));
      const { component } = await createComponent('Student', makeAssignmentService(), subSvc);
      expect(component.mySubmission()?.id).toBe('sub-1');
    });
  });

  // ── Student — grade loading via switchMap ──────────────────────────────────

  describe('student — grade loading', () => {
    it('loads grade when submission isGraded is true', async () => {
      const sub = makeSubmission({ isGraded: true });
      const grade = makeGrade({ isPublished: true });
      const subSvc = makeSubmissionService();
      subSvc.getMySubmissions.and.returnValue(of([sub]));
      const gradeSvc = makeGradeService();
      gradeSvc.getGradesByStudent.and.returnValue(of([grade]));
      const { component } = await createComponent('Student', makeAssignmentService(), subSvc, gradeSvc);
      expect(gradeSvc.getGradesByStudent).toHaveBeenCalledWith('me');
      expect(component.myGrade()?.marksAwarded).toBe(85);
    });

    it('does NOT call getGradesByStudent when submission is not graded', async () => {
      const sub = makeSubmission({ isGraded: false });
      const subSvc = makeSubmissionService();
      subSvc.getMySubmissions.and.returnValue(of([sub]));
      const gradeSvc = makeGradeService();
      const { component } = await createComponent('Student', makeAssignmentService(), subSvc, gradeSvc);
      expect(gradeSvc.getGradesByStudent).not.toHaveBeenCalled();
      expect(component.myGrade()).toBeNull();
    });

    it('does NOT call getGradesByStudent when there is no submission', async () => {
      const gradeSvc = makeGradeService();
      await createComponent('Student', makeAssignmentService(), makeSubmissionService(), gradeSvc);
      expect(gradeSvc.getGradesByStudent).not.toHaveBeenCalled();
    });

    it('keeps assignment and submission visible when grade loading fails', async () => {
      const sub = makeSubmission({ isGraded: true });
      const subSvc = makeSubmissionService();
      subSvc.getMySubmissions.and.returnValue(of([sub]));
      const gradeSvc = makeGradeService();
      gradeSvc.getGradesByStudent.and.returnValue(throwError(() => ({ error: { message: 'Grades unavailable' } })));
      const { component } = await createComponent('Student', makeAssignmentService(), subSvc, gradeSvc);
      expect(component.assignment()).toBeTruthy();
      expect(component.mySubmission()).toBeTruthy();
      expect(component.error()).toBeNull();
      expect(component.isLoading()).toBeFalse();
      expect(component.myGrade()).toBeNull();
    });
  });

  // ── Lecturer — allSubmissions signal ──────────────────────────────────────

  describe('lecturer — allSubmissions', () => {
    it('populates allSubmissions with a gradeForm per row', async () => {
      const sub = makeSubmission();
      const subSvc = makeSubmissionService();
      subSvc.getByAssignment.and.returnValue(of([sub]));
      const { component } = await createComponent('Lecturer', makeAssignmentService(), subSvc);
      expect(component.allSubmissions().length).toBe(1);
      expect(component.allSubmissions()[0].gradeForm).toBeDefined();
    });

    it('initialises gradeId as null for each row', async () => {
      const subSvc = makeSubmissionService();
      subSvc.getByAssignment.and.returnValue(of([makeSubmission()]));
      const { component } = await createComponent('Lecturer', makeAssignmentService(), subSvc);
      expect(component.allSubmissions()[0].gradeId).toBeNull();
    });
  });

  // ── deadlineInfo branches ─────────────────────────────────────────────────

  describe('deadlineInfo branches', () => {
    function makeWithDeadline(daysFromNow: number) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + daysFromNow);
      return makeAssignment({ deadline: deadline.toISOString() });
    }

    it('returns isPast:true and red css when deadline is in the past', async () => {
      const asgSvc = makeAssignmentService(makeWithDeadline(-3));
      const { component } = await createComponent('Student', asgSvc);
      const info = component.deadlineInfo()!;
      expect(info.isPast).toBeTrue();
      expect(info.css).toBe('text-sm font-medium text-red-600');
      expect(info.label).toContain('Overdue');
    });

    it('returns due-today label when deadline is today', async () => {
      const asgSvc = makeAssignmentService(makeWithDeadline(0));
      const { component } = await createComponent('Student', asgSvc);
      expect(component.deadlineInfo()!.label).toBe('Due today');
      expect(component.deadlineInfo()!.css).toBe('text-sm font-medium text-orange-500');
    });

    it('returns amber css when 1-3 days remain', async () => {
      const asgSvc = makeAssignmentService(makeWithDeadline(2));
      const { component } = await createComponent('Student', asgSvc);
      expect(component.deadlineInfo()!.css).toBe('text-sm font-medium text-amber-600');
    });

    it('returns green css when more than 3 days remain', async () => {
      const asgSvc = makeAssignmentService(makeWithDeadline(10));
      const { component } = await createComponent('Student', asgSvc);
      expect(component.deadlineInfo()!.css).toBe('text-sm font-medium text-green-600');
    });
  });

  // ── submitAssignment ──────────────────────────────────────────────────────

  describe('submitAssignment()', () => {
    it('calls submit with assignmentId from route', async () => {
      const subSvc = makeSubmissionService();
      const { component } = await createComponent('Student', makeAssignmentService(), subSvc);
      component.submitAssignment();
      expect(subSvc.submit).toHaveBeenCalledWith(
        jasmine.objectContaining({ assignmentId: ASSIGNMENT_ID }),
      );
    });

    it('sets mySubmission on success', async () => {
      const returnedSub = makeSubmission({ id: 'new-sub' });
      const subSvc = makeSubmissionService();
      subSvc.submit.and.returnValue(of(returnedSub));
      const { component } = await createComponent('Student', makeAssignmentService(), subSvc);
      component.submitAssignment();
      expect(component.mySubmission()?.id).toBe('new-sub');
    });

    it('sets submitError and clears isSubmitting on failure', async () => {
      const subSvc = makeSubmissionService();
      subSvc.submit.and.returnValue(throwError(() => ({ error: { message: 'Upload failed' } })));
      const { component } = await createComponent('Student', makeAssignmentService(), subSvc);
      component.submitAssignment();
      expect(component.submitError()).toBe('Upload failed');
      expect(component.isSubmitting()).toBeFalse();
    });

    it('does nothing if already submitting', async () => {
      const subSvc = makeSubmissionService();
      const { component } = await createComponent('Student', makeAssignmentService(), subSvc);
      component.isSubmitting.set(true);
      component.submitAssignment();
      expect(subSvc.submit).not.toHaveBeenCalled();
    });
  });

  // ── saveGrade ─────────────────────────────────────────────────────────────

  describe('saveGrade()', () => {
    async function createLecturerWithSubmission() {
      const sub = makeSubmission();
      const subSvc = makeSubmissionService();
      subSvc.getByAssignment.and.returnValue(of([sub]));
      const gradeSvc = makeGradeService();
      const { component } = await createComponent('Lecturer', makeAssignmentService(), subSvc, gradeSvc);
      return { component, gradeSvc };
    }

    it('calls gradeSubmission with submissionId and form values', async () => {
      const { component, gradeSvc } = await createLecturerWithSubmission();
      const row = component.allSubmissions()[0];
      row.gradeForm.setValue({ marks: 75, feedback: 'Good effort' });
      component.saveGrade(row);
      expect(gradeSvc.gradeSubmission).toHaveBeenCalledWith('sub-1', { marksAwarded: 75, feedback: 'Good effort' });
    });

    it('does not call gradeSubmission when form is invalid', async () => {
      const { component, gradeSvc } = await createLecturerWithSubmission();
      const row = component.allSubmissions()[0];
      // marks is null — required validator fires
      component.saveGrade(row);
      expect(gradeSvc.gradeSubmission).not.toHaveBeenCalled();
    });

    it('sets gradeId on the row after successful grade save', async () => {
      const grade = makeGrade({ id: 'grade-99' });
      const { component, gradeSvc } = await createLecturerWithSubmission();
      gradeSvc.gradeSubmission.and.returnValue(of(grade));
      const row = component.allSubmissions()[0];
      row.gradeForm.setValue({ marks: 80, feedback: '' });
      component.saveGrade(row);
      expect(component.allSubmissions()[0].gradeId).toBe('grade-99');
    });

    it('removes submissionId from savingIds after save completes', async () => {
      const { component } = await createLecturerWithSubmission();
      const row = component.allSubmissions()[0];
      row.gradeForm.setValue({ marks: 80, feedback: '' });
      component.saveGrade(row);
      expect(component.savingIds().has('sub-1')).toBeFalse();
    });

    it('removes submissionId from savingIds on error', async () => {
      const { component, gradeSvc } = await createLecturerWithSubmission();
      gradeSvc.gradeSubmission.and.returnValue(throwError(() => ({})));
      const row = component.allSubmissions()[0];
      row.gradeForm.setValue({ marks: 80, feedback: '' });
      component.saveGrade(row);
      expect(component.savingIds().has('sub-1')).toBeFalse();
    });
  });

  // ── publishGrade ──────────────────────────────────────────────────────────

  describe('publishGrade()', () => {
    it('calls gradeService.publishGrade with the gradeId', async () => {
      const gradeSvc = makeGradeService();
      const { component } = await createComponent('Lecturer', makeAssignmentService(), makeSubmissionService(), gradeSvc);
      component.publishGrade('grade-1', 'sub-1');
      expect(gradeSvc.publishGrade).toHaveBeenCalledWith('grade-1');
    });

    it('removes submissionId from savingIds after publish completes', async () => {
      const gradeSvc = makeGradeService();
      const { component } = await createComponent('Lecturer', makeAssignmentService(), makeSubmissionService(), gradeSvc);
      component.publishGrade('grade-1', 'sub-1');
      expect(component.savingIds().has('sub-1')).toBeFalse();
    });

    it('does nothing if submissionId is already in savingIds', async () => {
      const gradeSvc = makeGradeService();
      const { component } = await createComponent('Lecturer', makeAssignmentService(), makeSubmissionService(), gradeSvc);
      component.savingIds.set(new Set(['sub-1']));
      component.publishGrade('grade-1', 'sub-1');
      expect(gradeSvc.publishGrade).not.toHaveBeenCalled();
    });
  });
});
