import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

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
      imports: [LoginComponent],
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
    component.fillCredentials();
    expect(component.email).toBe('admin@opsflow.io');
    expect(component.password).toBe('admin123');
  });

  it('should clear error message on fillCredentials', () => {
    component.error.set('Some error');
    component.fillCredentials();
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

  it('should set loading to true during login', async () => {
    mockAuthService.login.mockReturnValue(new Promise(() => {}));
    component.email = 'test@test.com';
    component.password = 'password';
    component.login();
    expect(component.loading()).toBe(true);
  });

  it('should navigate to dashboard on successful login', async () => {
    mockAuthService.login.mockResolvedValue({ 
      token: 'mock-token', 
      user: { 
        id: '1', 
        email: 'test@test.com', 
        role: 'Admin', 
        firstName: 'Test', 
        lastName: 'User', 
        organizationId: '1', 
        organizationName: 'Org' 
      } 
    });
    component.email = 'test@test.com';
    component.password = 'password';
    
    await component.login();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set error on login failure', async () => {
    mockAuthService.login.mockRejectedValue({ error: { message: 'Invalid credentials' } });
    component.email = 'test@test.com';
    component.password = 'wrong';
    
    await component.login();
    
    expect(component.error()).toBe('Invalid credentials');
    expect(component.loading()).toBe(false);
  });

  it('should toggle hidePassword signal', () => {
    expect(component.hidePassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBe(true);
  });
});