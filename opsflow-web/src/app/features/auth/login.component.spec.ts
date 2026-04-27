import { vi } from 'vitest';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService, AuthResponse } from '../../core/services/auth.service';
import { Router } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NoopAnimationsModule,
        LoginComponent
      ],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn().mockReturnValue(Promise.resolve(true)) } }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have email as empty string', () => {
      expect(component.email).toBe('');
    });

    it('should have password as empty string', () => {
      expect(component.password).toBe('');
    });

    it('should have loading signal initialized to false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should have error signal initialized to empty string', () => {
      expect(component.error()).toBe('');
    });

    it('should have hidePassword signal initialized to true', () => {
      expect(component.hidePassword()).toBe(true);
    });
  });

  describe('fillCredentials', () => {
    it('should set email and password', () => {
      component.fillCredentials('admin@opsflow.io', 'admin123');
      expect(component.email).toBe('admin@opsflow.io');
      expect(component.password).toBe('admin123');
    });

    it('should clear error message', () => {
      component.error.set('Some error');
      component.fillCredentials('admin@opsflow.io', 'admin123');
      expect(component.error()).toBe('');
    });
  });

  describe('login', () => {
    it('should show error if email is empty', () => {
      component.email = '';
      component.password = 'password';
      component.login();
      expect(component.error()).toBe('Please enter email and password');
    });

    it('should show error if password is empty', () => {
      component.email = 'admin@opsflow.io';
      component.password = '';
      component.login();
      expect(component.error()).toBe('Please enter email and password');
    });

    it('should show error if both are empty', () => {
      component.email = '';
      component.password = '';
      component.login();
      expect(component.error()).toBe('Please enter email and password');
    });

    it('should set loading to true during login', fakeAsync(() => {
      component.email = 'admin@opsflow.io';
      component.password = 'admin123';
      
      component.login();
      expect(component.loading()).toBe(true);

      tick(100);
    }));

    it('should navigate to dashboard on successful login', fakeAsync(() => {
      component.email = 'admin@opsflow.io';
      component.password = 'admin123';
      
      component.login();
      tick(100);

      const req = TestBed.inject(HttpTestingController);
      req.expectOne('/api/auth/login').flush(mockAuthResponse);
      
      tick(100);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));
  });
});