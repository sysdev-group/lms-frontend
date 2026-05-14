import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { GradeService } from './grade.service';
import { Grade, GradeSubmissionRequest } from '@shared/models/models';

describe('GradeService', () => {
  let service: GradeService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        GradeService,
        { provide: ApiService, useValue: api },
      ],
    });

    service = TestBed.inject(GradeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getGradesByCourse calls GET /grades/course/:courseId', () => {
    api.get.and.returnValue(of([] as Grade[]));
    service.getGradesByCourse('course-1').subscribe();
    expect(api.get).toHaveBeenCalledWith('/grades/course/course-1');
  });

  describe('getGradesByStudent', () => {
    it('calls GET /grades/student/:studentId with a specific student ID', () => {
      api.get.and.returnValue(of([] as Grade[]));
      service.getGradesByStudent('student-1').subscribe();
      expect(api.get).toHaveBeenCalledWith('/grades/student/student-1');
    });

    it('calls GET /grades/student/me when passed the literal "me"', () => {
      api.get.and.returnValue(of([] as Grade[]));
      service.getGradesByStudent('me').subscribe();
      expect(api.get).toHaveBeenCalledWith('/grades/student/me');
    });
  });

  it('gradeSubmission calls PUT /grades/:submissionId with the request body', () => {
    const req: GradeSubmissionRequest = { marksAwarded: 85, feedback: 'Good work' };
    api.put.and.returnValue(of({} as Grade));
    service.gradeSubmission('sub-1', req).subscribe();
    expect(api.put).toHaveBeenCalledWith('/grades/sub-1', req);
  });

  it('publishGrade calls POST /grades/:gradeId/publish', () => {
    api.post.and.returnValue(of(void 0));
    service.publishGrade('grade-1').subscribe();
    expect(api.post).toHaveBeenCalledWith('/grades/grade-1/publish', {});
  });
});
