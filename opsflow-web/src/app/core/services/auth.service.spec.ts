import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have isAuthenticated signal initialized to false', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should have currentUser signal initialized to null', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should make POST request to /api/auth/login', (done) => {
    const mockResponse = { 
      token: 'mock-jwt-token', 
      user: { 
        id: '1', 
        email: 'admin@test.com', 
        role: 'Admin', 
        firstName: 'Admin', 
        lastName: 'User', 
        organizationId: '1', 
        organizationName: 'Org' 
      } 
    };
    
    service.login('admin@test.com', 'password123').subscribe({
      next: () => done(),
      error: done
    });
    
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'password123' });
    req.flush(mockResponse);
  });

  it('should set token and user in localStorage on successful login', (done) => {
    const mockResponse = { 
      token: 'mock-jwt-token', 
      user: { 
        id: '1', 
        email: 'admin@test.com', 
        role: 'Admin', 
        firstName: 'Admin', 
        lastName: 'User', 
        organizationId: '1', 
        organizationName: 'Org' 
      } 
    };
    
    service.login('admin@test.com', 'password123').subscribe({
      next: () => {
        expect(localStorage.getItem('token')).toBe('mock-jwt-token');
        expect(localStorage.getItem('user')).toBeDefined();
        done();
      },
      error: done
    });
    
    const req = httpMock.expectOne('/api/auth/login');
    req.flush(mockResponse);
  });

  it('should clear token and user from localStorage on logout', () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@test.com' }));
    
    service.logout();
    
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return null when no token stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should return token when stored', () => {
    localStorage.setItem('token', 'mock-jwt-token');
    expect(service.getToken()).toBe('mock-jwt-token');
  });

  it('should return null when no user stored', () => {
    expect(service.getUser()).toBeNull();
  });

  it('should return parsed user when stored', () => {
    const mockUser = { id: '1', email: 'test@test.com', role: 'Admin', firstName: 'Test', lastName: 'User', organizationId: '1', organizationName: 'Org' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    expect(service.getUser()).toEqual(mockUser);
  });
});