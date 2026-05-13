import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AssignmentService } from './assignment.service';
import { Assignment, CreateAssignmentRequest, UpdateAssignmentRequest } from '@shared/models/models';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AssignmentService,
        { provide: ApiService, useValue: api },
      ],
    });

    service = TestBed.inject(AssignmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAssignments', () => {
    it('calls GET /assignments with no params when courseId is omitted', () => {
      api.get.and.returnValue(of([] as Assignment[]));
      service.getAssignments().subscribe();
      expect(api.get).toHaveBeenCalledWith('/assignments', undefined);
    });

    it('calls GET /assignments with courseId query param when provided', () => {
      api.get.and.returnValue(of([] as Assignment[]));
      service.getAssignments('course-1').subscribe();
      expect(api.get).toHaveBeenCalledWith('/assignments', { courseId: 'course-1' });
    });
  });

  it('getAssignmentById calls GET /assignments/:id', () => {
    api.get.and.returnValue(of({} as Assignment));
    service.getAssignmentById('asgn-1').subscribe();
    expect(api.get).toHaveBeenCalledWith('/assignments/asgn-1');
  });

  it('createAssignment calls POST /assignments with the request body', () => {
    const req = { title: 'Test' } as CreateAssignmentRequest;
    api.post.and.returnValue(of({} as Assignment));
    service.createAssignment(req).subscribe();
    expect(api.post).toHaveBeenCalledWith('/assignments', req);
  });

  it('updateAssignment calls PUT /assignments/:id with the request body', () => {
    const req = { title: 'Updated' } as UpdateAssignmentRequest;
    api.put.and.returnValue(of({} as Assignment));
    service.updateAssignment('asgn-1', req).subscribe();
    expect(api.put).toHaveBeenCalledWith('/assignments/asgn-1', req);
  });
});
