import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { GradeService } from '@core/services/grade.service';
import { AuthService } from '@core/auth/auth.service';
import { Grade } from '@shared/models/models';
import { GradesComponent } from './grades.component';
import { GradingComponent } from './grading.component';

// Stub replaces GradingComponent so its full DI tree is not required in these tests
@Component({ selector: 'app-grading', standalone: true, template: '' })
class GradingStub {}

const makeGrade = (overrides: Partial<Grade> = {}): Grade => ({
  id: 'grade-1',
  marksAwarded: 85,
  letterGrade: 'A',
  gradePoints: 4.0,
  isPublished: true,
  assignmentTitle: 'Test Assignment',
  feedback: 'Good work',
  ...overrides,
});

const configureStudentTB = (gradeService: jasmine.SpyObj<GradeService>) =>
  TestBed.configureTestingModule({
    imports: [GradesComponent],
    providers: [
      provideRouter([]),
      { provide: GradeService, useValue: gradeService },
      { provide: AuthService, useValue: { userRole: signal('Student') } },
    ],
  }).overrideComponent(GradesComponent, {
    remove: { imports: [GradingComponent] },
    add: { imports: [GradingStub] },
  });

const configureLecturerTB = (gradeService: jasmine.SpyObj<GradeService>) =>
  TestBed.configureTestingModule({
    imports: [GradesComponent],
    providers: [
      provideRouter([]),
      { provide: GradeService, useValue: gradeService },
      { provide: AuthService, useValue: { userRole: signal('Lecturer') } },
    ],
  }).overrideComponent(GradesComponent, {
    remove: { imports: [GradingComponent] },
    add: { imports: [GradingStub] },
  });

// ─── Student view ──────────────────────────────────────────────────────────────

describe('GradesComponent — Student view', () => {
  let component: GradesComponent;
  let fixture: ComponentFixture<GradesComponent>;
  let gradeService: jasmine.SpyObj<GradeService>;
  let subject: Subject<Grade[]>;

  beforeEach(async () => {
    subject = new Subject<Grade[]>();
    gradeService = jasmine.createSpyObj('GradeService', ['getGradesByStudent', 'getGradesByCourse']);
    gradeService.getGradesByStudent.and.returnValue(subject.asObservable());

    await configureStudentTB(gradeService).compileComponents();

    fixture = TestBed.createComponent(GradesComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('calls getGradesByStudent with "me"', () => {
    fixture.detectChanges();
    expect(gradeService.getGradesByStudent).toHaveBeenCalledWith('me');
  });

  it('isLoading is true while request is in flight', () => {
    fixture.detectChanges();
    expect(component.isLoading()).toBeTrue();
  });

  it('sets grades and clears isLoading on success', () => {
    fixture.detectChanges();
    subject.next([makeGrade()]);
    subject.complete();
    expect(component.isLoading()).toBeFalse();
    expect(component.grades().length).toBe(1);
  });

  it('stores all returned grades, including unpublished (pending state displayed in template)', () => {
    fixture.detectChanges();
    subject.next([
      makeGrade({ id: 'g1', isPublished: true }),
      makeGrade({ id: 'g2', isPublished: false }),
    ]);
    subject.complete();
    expect(component.grades().length).toBe(2);
  });

  it('gradedCount reflects only published grades', () => {
    fixture.detectChanges();
    subject.next([
      makeGrade({ id: 'g1', isPublished: true }),
      makeGrade({ id: 'g2', isPublished: false }),
    ]);
    subject.complete();
    expect(component.gradedCount()).toBe(1);
    expect(component.pendingCount()).toBe(1);
  });

  it('sets error and clears isLoading on failure', () => {
    fixture.detectChanges();
    subject.error({ error: { message: 'Server error' } });
    expect(component.isLoading()).toBeFalse();
    expect(component.error()).toBe('Server error');
  });

  it('uses fallback message when the response has no message', () => {
    fixture.detectChanges();
    subject.error({});
    expect(component.error()).toBe('Failed to load grades.');
  });

  it('passedCount counts A-grade (non-F) grades among published ones', () => {
    fixture.detectChanges();
    subject.next([
      makeGrade({ id: 'g1', isPublished: true, letterGrade: 'A' }),
      makeGrade({ id: 'g2', isPublished: true, letterGrade: 'F' }),
    ]);
    subject.complete();
    expect(component.passedCount()).toBe(1);
    expect(component.failedCount()).toBe(1);
  });
});

// ─── Lecturer view ────────────────────────────────────────────────────────────

describe('GradesComponent — Lecturer view', () => {
  let component: GradesComponent;
  let fixture: ComponentFixture<GradesComponent>;
  let gradeService: jasmine.SpyObj<GradeService>;

  beforeEach(async () => {
    gradeService = jasmine.createSpyObj('GradeService', ['getGradesByStudent', 'getGradesByCourse']);

    await configureLecturerTB(gradeService).compileComponents();

    fixture = TestBed.createComponent(GradesComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('does not call grade service for Lecturer (grading is handled by GradingComponent)', () => {
    fixture.detectChanges();
    expect(gradeService.getGradesByStudent).not.toHaveBeenCalled();
    expect(gradeService.getGradesByCourse).not.toHaveBeenCalled();
  });

  it('isLoading stays false for Lecturer', () => {
    fixture.detectChanges();
    expect(component.isLoading()).toBeFalse();
  });
});
