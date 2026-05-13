import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AssignmentService } from '@core/services/assignment.service';
import { AuthService } from '@core/auth/auth.service';
import { Assignment } from '@shared/models/models';
import { AssignmentListComponent } from './assignment-list.component';

const makeAssignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: 'asgn-1',
  title: 'Test Assignment',
  description: null,
  deadline: '2099-12-31',
  maxMarks: 100,
  allowResubmission: false,
  turnitinEnabled: false,
  courseName: 'Test Course',
  submissionCount: 3,
  ...overrides,
});

describe('AssignmentListComponent', () => {
  let component: AssignmentListComponent;
  let fixture: ComponentFixture<AssignmentListComponent>;
  let assignmentService: jasmine.SpyObj<AssignmentService>;
  let subject: Subject<Assignment[]>;

  beforeEach(async () => {
    subject = new Subject<Assignment[]>();
    assignmentService = jasmine.createSpyObj('AssignmentService', ['getAssignments']);
    assignmentService.getAssignments.and.returnValue(subject.asObservable());

    await TestBed.configureTestingModule({
      imports: [AssignmentListComponent],
      providers: [
        provideRouter([]),
        { provide: AssignmentService, useValue: assignmentService },
        { provide: AuthService, useValue: { userRole: signal(null) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignmentListComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('calls getAssignments without courseId when no query param is present', () => {
    fixture.detectChanges();
    expect(assignmentService.getAssignments).toHaveBeenCalledWith(undefined);
  });

  it('isLoading is true while the request is in flight', () => {
    fixture.detectChanges();
    expect(component.isLoading()).toBeTrue();
  });

  it('sets assignments and clears isLoading on a successful response', () => {
    fixture.detectChanges();
    subject.next([makeAssignment()]);
    subject.complete();
    expect(component.isLoading()).toBeFalse();
    expect(component.assignments().length).toBe(1);
  });

  it('sets error and clears isLoading on failure', () => {
    fixture.detectChanges();
    subject.error({ error: { message: 'Server error' } });
    expect(component.isLoading()).toBeFalse();
    expect(component.error()).toBe('Server error');
  });

  it('uses the fallback error message when the response has no message', () => {
    fixture.detectChanges();
    subject.error({});
    expect(component.error()).toBe('Failed to load assignments.');
  });

  describe('deadlineInfo', () => {
    beforeEach(() => fixture.detectChanges());

    it('returns "Overdue" and red class for a past deadline', () => {
      const info = (component as any).deadlineInfo('2000-01-01');
      expect(info.deadlineLabel).toBe('Overdue');
      expect(info.deadlineCss).toBe('text-red-600');
    });

    it('returns "Due today" and orange class for today\'s date', () => {
      const today = new Date().toISOString().split('T')[0];
      const info = (component as any).deadlineInfo(today);
      expect(info.deadlineLabel).toBe('Due today');
      expect(info.deadlineCss).toBe('text-orange-500');
    });

    it('returns amber class for a deadline within 3 days', () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 2);
      const info = (component as any).deadlineInfo(soon.toISOString().split('T')[0]);
      expect(info.deadlineLabel).toBe('2 days left');
      expect(info.deadlineCss).toBe('text-amber-600');
    });

    it('returns green class for a deadline beyond 3 days', () => {
      const info = (component as any).deadlineInfo('2099-12-31');
      expect(info.deadlineCss).toBe('text-green-600');
      expect(info.deadlineLabel).toContain('days left');
    });

    it('maps deadline info onto each assignment row', () => {
      subject.next([makeAssignment({ deadline: '2000-01-01' })]);
      subject.complete();
      const row = component.assignments()[0];
      expect(row.deadlineLabel).toBe('Overdue');
      expect(row.deadlineCss).toBe('text-red-600');
    });
  });
});
