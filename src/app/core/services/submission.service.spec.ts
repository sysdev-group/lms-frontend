import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { SubmissionService } from './submission.service';
import { Submission, CreateSubmissionRequest } from '@shared/models/models';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        SubmissionService,
        { provide: ApiService, useValue: api },
      ],
    });

    service = TestBed.inject(SubmissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('submit calls POST /submissions with the request body', () => {
    const req: CreateSubmissionRequest = { assignmentId: 'asgn-1' };
    api.post.and.returnValue(of({} as Submission));
    service.submit(req).subscribe();
    expect(api.post).toHaveBeenCalledWith('/submissions', req);
  });

  it('getById calls GET /submissions/:id', () => {
    api.get.and.returnValue(of({} as Submission));
    service.getById('sub-1').subscribe();
    expect(api.get).toHaveBeenCalledWith('/submissions/sub-1');
  });

  it('getByAssignment calls GET /submissions/assignment/:assignmentId', () => {
    api.get.and.returnValue(of([] as Submission[]));
    service.getByAssignment('asgn-1').subscribe();
    expect(api.get).toHaveBeenCalledWith('/submissions/assignment/asgn-1');
  });

  it('getMySubmissions calls GET /submissions/my', () => {
    api.get.and.returnValue(of([] as Submission[]));
    service.getMySubmissions().subscribe();
    expect(api.get).toHaveBeenCalledWith('/submissions/my');
  });
});
