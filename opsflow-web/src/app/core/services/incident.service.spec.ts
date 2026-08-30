import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IncidentService, IncidentList, IncidentDetail, UserSummary } from './incident.service';

describe('IncidentService', () => {
  let service: IncidentService;
  let httpMock: HttpTestingController;

  const mockUser: UserSummary = { id: '1', email: 'admin@test.com', fullName: 'Test Admin', role: 'Admin' };

  const mockIncidentList: IncidentList = {
    id: '1', title: 'Incident 1', status: 'Open', priority: 'High',
    createdBy: mockUser, assignedTo: null, createdAt: '2026-01-01T00:00:00Z', commentCount: 0
  };

  const mockIncidentDetail: IncidentDetail = {
    id: '1', title: 'Test Incident', description: 'Test description',
    status: 'Open', priority: 'High', organizationId: '1',
    createdBy: mockUser, assignedTo: null, team: null,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
    resolvedAt: null, closedAt: null, commentCount: 0
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IncidentService]
    });
    
    service = TestBed.inject(IncidentService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'admin@test.com', role: 'Admin' }));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make GET request to /api/incidents', (done) => {
    service.getIncidents().subscribe({
      next: (incidents) => {
        expect(incidents.length).toBe(1);
        expect(incidents[0].title).toBe('Incident 1');
        done();
      },
      error: done
    });

    const req = httpMock.expectOne('/api/incidents');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token');
    req.flush([mockIncidentList]);
  });

  it('should include status parameter when provided', (done) => {
    service.getIncidents({ status: 'Open' }).subscribe({
      next: () => done(),
      error: done
    });

    const req = httpMock.expectOne(r => r.params.get('status') === 'Open');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should make GET request to /api/incidents/{id}', (done) => {
    service.getIncident('1').subscribe({
      next: (incident) => {
        expect(incident.title).toBe('Test Incident');
        done();
      },
      error: done
    });

    const req = httpMock.expectOne('/api/incidents/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockIncidentDetail);
  });

  it('should make POST request to /api/incidents', (done) => {
    const newIncident = { title: 'New Incident', description: 'Description', priority: 'High' };

    service.createIncident(newIncident).subscribe({
      next: (incident) => {
        expect(incident.title).toBe('New Incident');
        done();
      },
      error: done
    });

    const req = httpMock.expectOne('/api/incidents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newIncident);
    req.flush({ id: '1', ...newIncident, status: 'Open' });
  });

  it('should make PUT request to /api/incidents/{id}', (done) => {
    const update = { title: 'Updated Title' };

    service.updateIncident('1', update).subscribe({
      next: (incident) => {
        expect(incident.title).toBe('Updated Title');
        done();
      },
      error: done
    });

    const req = httpMock.expectOne('/api/incidents/1');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: '1', ...update, status: 'Open' });
  });

  it('should make DELETE request to /api/incidents/{id}', (done) => {
    service.deleteIncident('1').subscribe({
      next: () => done(),
      error: done
    });

    const req = httpMock.expectOne('/api/incidents/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
