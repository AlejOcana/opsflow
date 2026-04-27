import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IncidentService } from './incident.service';

describe('IncidentService', () => {
  let service: IncidentService;
  let httpMock: HttpTestingController;

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
    const mockIncidents = [
      { id: '1', title: 'Incident 1', status: 'New' },
      { id: '2', title: 'Incident 2', status: 'Assigned' }
    ];

    service.getIncidents().subscribe({
      next: (incidents) => {
        expect(incidents).toEqual(mockIncidents);
        done();
      },
      error: done
    });

    const req = httpMock.expectOne('/api/incidents');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token');
    req.flush(mockIncidents);
  });

  it('should include status parameter when provided', (done) => {
    service.getIncidents({ status: 'New' }).subscribe({
      next: () => done(),
      error: done
    });

    const req = httpMock.expectOne(r => r.url.includes('status=New'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should make GET request to /api/incidents/{id}', (done) => {
    const mockIncident = { id: '1', title: 'Test Incident', status: 'New', description: 'Test description' };

    service.getIncident('1').subscribe({
      next: (incident) => {
        expect(incident).toEqual(mockIncident);
        done();
      },
      error: done
    });

    const req = httpMock.expectOne('/api/incidents/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockIncident);
  });

  it('should make POST request to /api/incidents', (done) => {
    const newIncident = { title: 'New Incident', description: 'Description', priority: 'High' };
    const mockResponse = { id: '1', ...newIncident, status: 'New' };

    service.createIncident(newIncident).subscribe({
      next: (incident) => {
        expect(incident).toEqual(mockResponse);
        done();
      },
      error: done
    });

    const req = httpMock.expectOne('/api/incidents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newIncident);
    req.flush(mockResponse);
  });

  it('should make PUT request to /api/incidents/{id}', (done) => {
    const update = { title: 'Updated Title' };
    const mockResponse = { id: '1', ...update, status: 'Assigned' };

    service.updateIncident('1', update).subscribe({
      next: (incident) => {
        expect(incident).toEqual(mockResponse);
        done();
      },
      error: done
    });

    const req = httpMock.expectOne('/api/incidents/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
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