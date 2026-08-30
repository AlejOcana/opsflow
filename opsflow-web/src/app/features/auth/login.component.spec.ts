import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';
import { of, throwError, NEVER } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      isAuthenticated: signal(false),
      currentUser: signal(null)
    };
    
    mockRouter = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

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

  it('should set email and password on fillCredentials', () => {
    component.fillCredentials('admin@opsflow.io', 'Admin123!');
    expect(component.email).toBe('admin@opsflow.io');
    expect(component.password).toBe('Admin123!');
  });

  it('should clear error message on fillCredentials', () => {
    component.error.set('Some error');
    component.fillCredentials('admin@opsflow.io', 'Admin123!');
    expect(component.error()).toBe('');
  });

  it('should show error if email is empty', () => {
    component.email = '';
    component.password = 'password';
    component.login();
    expect(component.error()).toBe('Please enter email and password');
  });

  it('should show error if password is empty', () => {
    component.email = 'test@test.com';
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

  it('should set loading to true during login', () => {
    mockAuthService.login.mockReturnValue(NEVER);
    component.email = 'test@test.com';
    component.password = 'password';
    component.login();
    expect(component.loading()).toBe(true);
  });

  it('should navigate to dashboard on successful login', () => {
    mockAuthService.login.mockReturnValue(of({ 
      token: 'mock-token', 
      userId: 1,
      username: 'test',
      email: 'test@test.com',
      fullName: 'Test User',
      role: 3
    }));
    component.email = 'test@test.com';
    component.password = 'password';
    
    component.login();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading()).toBe(false);
  });

  it('should set error on login failure', () => {
    mockAuthService.login.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    component.email = 'test@test.com';
    component.password = 'wrong';
    
    component.login();
    
    expect(component.error()).toBe('Invalid credentials');
    expect(component.loading()).toBe(false);
  });

  it('should toggle hidePassword signal', () => {
    expect(component.hidePassword()).toBe(true);
    component.hidePassword.set(!component.hidePassword());
    expect(component.hidePassword()).toBe(false);
    component.hidePassword.set(!component.hidePassword());
    expect(component.hidePassword()).toBe(true);
  });
});
