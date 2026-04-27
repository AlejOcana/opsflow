import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IncidentService, IncidentList, IncidentDetail, CreateIncidentRequest } from './incident.service';

describe('IncidentService', () => {
  let service: IncidentService;
  let httpMock: HttpTestingController;

  const mockUser = {
    id: '1',
    email: 'admin@opsflow.io',
    fullName: 'Admin User',
    role: 'Admin'
  };

  const mockIncidentList: IncidentList[] = [
    {
      id: '1',
      title: 'Test Incident 1',
      status: 'New',
      priority: 'High',
      createdBy: mockUser,
      assignedTo: null,
      createdAt: '2024-01-01T00:00:00Z',
      commentCount: 0
    },
    {
      id: '2',
      title: 'Test Incident 2',
      status: 'Assigned',
      priority: 'Medium',
      createdBy: mockUser,
      assignedTo: mockUser,
      createdAt: '2024-01-02T00:00:00Z',
      commentCount: 2
    }
  ];

  const mockIncidentDetail: IncidentDetail = {
    id: '1',
    title: 'Test Incident 1',
    description: 'Test description',
    status: 'New',
    priority: 'High',
    organizationId: 'org-1',
    createdBy: mockUser,
    assignedTo: null,
    team: { id: 'team-1', name: 'Team 1', memberCount: 5 },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null,
    resolvedAt: null,
    closedAt: null,
    commentCount: 0
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IncidentService]
    });

    service = TestBed.inject(IncidentService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('token', mockToken);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('getIncidents', () => {
    it('should make GET request to /api/incidents', (done) => {
      service.getIncidents().subscribe((incidents) => {
        expect(incidents).toEqual(mockIncidentList);
        done();
      });

      const req = httpMock.expectOne('/api/incidents');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockIncidentList);
    });

    it('should include status parameter when provided', (done) => {
      service.getIncidents({ status: 'New' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/incidents?status=New');
      req.flush(mockIncidentList);
    });

    it('should include search parameter when provided', (done) => {
      service.getIncidents({ search: 'test' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/incidents?search=test');
      req.flush(mockIncidentList);
    });

    it('should include both status and search parameters', (done) => {
      service.getIncidents({ status: 'New', search: 'bug' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/incidents?status=New&search=bug');
      req.flush(mockIncidentList);
    });
  });

  describe('getIncident', () => {
    it('should make GET request to /api/incidents/{id}', (done) => {
      service.getIncident('1').subscribe((incident) => {
        expect(incident).toEqual(mockIncidentDetail);
        done();
      });

      const req = httpMock.expectOne('/api/incidents/1');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockIncidentDetail);
    });

    it('should use correct ID in URL', (done) => {
      service.getIncident('abc-123').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/incidents/abc-123');
      req.flush(mockIncidentDetail);
    });
  });

  describe('createIncident', () => {
    it('should make POST request to /api/incidents', (done) => {
      const request: CreateIncidentRequest = {
        title: 'New Incident',
        description: 'Description here',
        priority: 'High'
      };

      service.createIncident(request).subscribe((incident) => {
        expect(incident).toEqual(mockIncidentDetail);
        done();
      });

      const req = httpMock.expectOne('/api/incidents');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockIncidentDetail);
    });

    it('should send assignedToUserId when provided', (done) => {
      const request: CreateIncidentRequest = {
        title: 'New Incident',
        description: 'Description',
        priority: 'Medium',
        assignedToUserId: 'user-123'
      };

      service.createIncident(request).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/incidents');
      expect(req.request.body).toEqual(request);
      req.flush(mockIncidentDetail);
    });

    it('should send teamId when provided', (done) => {
      const request: CreateIncidentRequest = {
        title: 'New Incident',
        description: 'Description',
        priority: 'Low',
        teamId: 'team-456'
      };

      service.createIncident(request).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/incidents');
      expect(req.request.body).toEqual(request);
      req.flush(mockIncidentDetail);
    });
  });

  describe('updateIncident', () => {
    it('should make PUT request to /api/incidents/{id}', (done) => {
      const update = { status: 'Resolved', priority: 'Low' };

      service.updateIncident('1', update).subscribe((incident) => {
        expect(incident).toEqual(mockIncidentDetail);
        done();
      });

      const req = httpMock.expectOne('/api/incidents/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush(mockIncidentDetail);
    });

    it('should handle partial update', (done) => {
      service.updateIncident('1', { title: 'Updated Title' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/incidents/1');
      expect(req.request.body).toEqual({ title: 'Updated Title' });
      req.flush(mockIncidentDetail);
    });
  });

  describe('deleteIncident', () => {
    it('should make DELETE request to /api/incidents/{id}', (done) => {
      service.deleteIncident('1').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/incidents/1');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(null);
    });
  });

  describe('getComments', () => {
    it('should make GET request to /api/incidents/{id}/comments', (done) => {
      const mockComments = [{ id: '1', content: 'Comment 1' }];

      service.getComments('1').subscribe((comments) => {
        expect(comments).toEqual(mockComments);
        done();
      });

      const req = httpMock.expectOne('/api/incidents/1/comments');
      expect(req.request.method).toBe('GET');
      req.flush(mockComments);
    });
  });

  describe('addComment', () => {
    it('should make POST request to /api/incidents/{id}/comments', (done) => {
      service.addComment('1', 'New comment').subscribe((comment) => {
        expect(comment).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('/api/incidents/1/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ content: 'New comment' });
      req.flush({ id: '3', content: 'New comment' });
    });
  });
});