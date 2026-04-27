import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AuthResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser = {
    id: '1',
    email: 'admin@opsflow.io',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
    organizationId: 'org-1',
    organizationName: 'Test Org'
  };

  const mockAuthResponse: AuthResponse = {
    token: 'mock-jwt-token',
    user: mockUser
  };

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

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have isAuthenticated signal initialized to false', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should have currentUser signal initialized to null', () => {
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('login', () => {
    it('should make POST request to /api/auth/login', (done) => {
      service.login('admin@opsflow.io', 'admin123').subscribe((response) => {
        expect(response).toEqual(mockAuthResponse);
        done();
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'admin@opsflow.io',
        password: 'admin123'
      });
      req.flush(mockAuthResponse);
    });

    it('should set token and user in localStorage on successful login', (done) => {
      service.login('admin@opsflow.io', 'admin123').subscribe(() => {
        expect(localStorage.getItem('token')).toBe('mock-jwt-token');
        expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockAuthResponse);
    });

    it('should update isAuthenticated signal on successful login', (done) => {
      service.login('admin@opsflow.io', 'admin123').subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockAuthResponse);
    });

    it('should update currentUser signal on successful login', (done) => {
      service.login('admin@opsflow.io', 'admin123').subscribe(() => {
        expect(service.currentUser()).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockAuthResponse);
    });

    it('should handle login error', (done) => {
      service.login('invalid@test.com', 'wrong').subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      service.isAuthenticated.set(true);
      service.currentUser.set(mockUser);
    });

    it('should clear token from localStorage', () => {
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should clear user from localStorage', () => {
      service.logout();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should set currentUser to null', () => {
      service.logout();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return token when stored', () => {
      localStorage.setItem('token', 'mock-jwt-token');
      expect(service.getToken()).toBe('mock-jwt-token');
    });
  });

  describe('getUser', () => {
    it('should return null when no user stored', () => {
      expect(service.getUser()).toBeNull();
    });

    it('should return parsed user when stored', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.getUser()).toEqual(mockUser);
    });
  });

  describe('hasRole', () => {
    beforeEach(() => {
      localStorage.setItem('user', JSON.stringify(mockUser));
    });

    it('should return true when user has matching role', () => {
      expect(service.hasRole(['Admin', 'Manager'])).toBe(true);
    });

    it('should return false when user does not have matching role', () => {
      expect(service.hasRole(['User', 'Guest'])).toBe(false);
    });

    it('should return false when user is null', () => {
      localStorage.removeItem('user');
      expect(service.hasRole(['Admin'])).toBe(false);
    });
  });

  describe('loadStoredAuth', () => {
    it('should load auth from localStorage on initialization', () => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      const newService = TestBed.inject(AuthService);
      
      expect(newService.isAuthenticated()).toBe(true);
      expect(newService.currentUser()).toEqual(mockUser);
    });

    it('should not set authenticated when token exists but user is missing', () => {
      localStorage.setItem('token', 'mock-jwt-token');

      const newService = TestBed.inject(AuthService);
      
      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should not set authenticated when user exists but token is missing', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));

      const newService = TestBed.inject(AuthService);
      
      expect(newService.isAuthenticated()).toBe(false);
    });
  });
});