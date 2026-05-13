import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { GradeService } from '@core/services/grade.service';
import { AuthService } from '@core/auth/auth.service';
import { Grade } from '@shared/models/models';
import { GradesComponent } from './grades.component';

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

const routeWithCourse = (courseId: string | null) => ({
  snapshot: { queryParamMap: { get: () => courseId } },
});

describe('GradesComponent — Student view', () => {
  let component: GradesComponent;
  let fixture: ComponentFixture<GradesComponent>;
  let gradeService: jasmine.SpyObj<GradeService>;
  let subject: Subject<Grade[]>;

  beforeEach(async () => {
    subject = new Subject<Grade[]>();
    gradeService = jasmine.createSpyObj('GradeService', ['getGradesByStudent', 'getGradesByCourse']);
    gradeService.getGradesByStudent.and.returnValue(subject.asObservable());

    await TestBed.configureTestingModule({
      imports: [GradesComponent],
      providers: [
        provideRouter([]),
        { provide: GradeService, useValue: gradeService },
        { provide: AuthService, useValue: { userRole: signal('Student') } },
        { provide: ActivatedRoute, useValue: routeWithCourse(null) },
      ],
    }).compileComponents();

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

  it('filters out unpublished grades', () => {
    fixture.detectChanges();
    subject.next([
      makeGrade({ id: 'g1', isPublished: true }),
      makeGrade({ id: 'g2', isPublished: false }),
    ]);
    subject.complete();
    expect(component.grades().length).toBe(1);
    expect(component.grades()[0].id).toBe('g1');
  });

  it('keeps no grades when all are unpublished', () => {
    fixture.detectChanges();
    subject.next([makeGrade({ isPublished: false })]);
    subject.complete();
    expect(component.grades().length).toBe(0);
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

  it('noCourseSelected stays false for students', () => {
    fixture.detectChanges();
    expect(component.noCourseSelected()).toBeFalse();
  });
});

describe('GradesComponent — Lecturer view with courseId', () => {
  let component: GradesComponent;
  let fixture: ComponentFixture<GradesComponent>;
  let gradeService: jasmine.SpyObj<GradeService>;
  let subject: Subject<Grade[]>;

  beforeEach(async () => {
    subject = new Subject<Grade[]>();
    gradeService = jasmine.createSpyObj('GradeService', ['getGradesByStudent', 'getGradesByCourse']);
    gradeService.getGradesByCourse.and.returnValue(subject.asObservable());

    await TestBed.configureTestingModule({
      imports: [GradesComponent],
      providers: [
        provideRouter([]),
        { provide: GradeService, useValue: gradeService },
        { provide: AuthService, useValue: { userRole: signal('Lecturer') } },
        { provide: ActivatedRoute, useValue: routeWithCourse('course-abc') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GradesComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('calls getGradesByCourse with the courseId from the query param', () => {
    fixture.detectChanges();
    expect(gradeService.getGradesByCourse).toHaveBeenCalledWith('course-abc');
  });

  it('isLoading is true while request is in flight', () => {
    fixture.detectChanges();
    expect(component.isLoading()).toBeTrue();
  });

  it('sets grades and clears isLoading on success', () => {
    fixture.detectChanges();
    subject.next([makeGrade(), makeGrade({ id: 'grade-2', isPublished: false })]);
    subject.complete();
    expect(component.isLoading()).toBeFalse();
    expect(component.grades().length).toBe(2);
  });

  it('does not filter out unpublished grades in lecturer view', () => {
    fixture.detectChanges();
    subject.next([makeGrade({ isPublished: false })]);
    subject.complete();
    expect(component.grades()[0].isPublished).toBeFalse();
  });

  it('sets error and clears isLoading on failure', () => {
    fixture.detectChanges();
    subject.error({ error: { message: 'Not found' } });
    expect(component.isLoading()).toBeFalse();
    expect(component.error()).toBe('Not found');
  });

  it('noCourseSelected stays false when courseId is present', () => {
    fixture.detectChanges();
    expect(component.noCourseSelected()).toBeFalse();
  });
});

describe('GradesComponent — Lecturer view without courseId', () => {
  let component: GradesComponent;
  let fixture: ComponentFixture<GradesComponent>;
  let gradeService: jasmine.SpyObj<GradeService>;

  beforeEach(async () => {
    gradeService = jasmine.createSpyObj('GradeService', ['getGradesByStudent', 'getGradesByCourse']);

    await TestBed.configureTestingModule({
      imports: [GradesComponent],
      providers: [
        provideRouter([]),
        { provide: GradeService, useValue: gradeService },
        { provide: AuthService, useValue: { userRole: signal('Lecturer') } },
        { provide: ActivatedRoute, useValue: routeWithCourse(null) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GradesComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('sets noCourseSelected when no courseId query param is present', () => {
    fixture.detectChanges();
    expect(component.noCourseSelected()).toBeTrue();
  });

  it('does not call getGradesByCourse when courseId is absent', () => {
    fixture.detectChanges();
    expect(gradeService.getGradesByCourse).not.toHaveBeenCalled();
  });

  it('isLoading stays false when courseId is absent', () => {
    fixture.detectChanges();
    expect(component.isLoading()).toBeFalse();
  });
});
