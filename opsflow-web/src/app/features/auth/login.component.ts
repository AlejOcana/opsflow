import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="login-container">
      <div class="login-background">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
      </div>
      
      <mat-card class="login-card" [@fadeInUp]>
        <div class="login-header">
          <div class="logo">
            <mat-icon class="logo-icon">bolt</mat-icon>
            <span class="logo-text">OpsFlow</span>
          </div>
          <p class="login-subtitle">Sign in to manage your incidents</p>
        </div>
        
        <mat-card-content>
          <form (ngSubmit)="login()" class="login-form">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Email</mat-label>
              <input 
                matInput 
                type="email" 
                [(ngModel)]="email" 
                name="email" 
                required
                autocomplete="email">
              <mat-icon matSuffix>email</mat-icon>
              @if (email && email.length > 0) {
                <button mat-icon-button matSuffix type="button" (click)="email = ''" matTooltip="Clear">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Password</mat-label>
              <input 
                matInput 
                [type]="hidePassword() ? 'password' : 'text'" 
                [(ngModel)]="password" 
                name="password" 
                required
                autocomplete="current-password">
              <button 
                mat-icon-button 
                matSuffix 
                type="button"
                (click)="hidePassword.set(!hidePassword())"
                [matTooltip]="hidePassword() ? 'Show password' : 'Hide password'"
                [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>
            
            @if (error()) {
              <div class="error-message" role="alert">
                <mat-icon>error_outline</mat-icon>
                <span>{{ error() }}</span>
              </div>
            }
            
            <button 
              mat-raised-button 
              color="primary" 
              type="submit" 
              [disabled]="loading()"
              class="login-button">
              @if (loading()) {
                <mat-spinner diameter="24"></mat-spinner>
                <span>Signing in...</span>
              } @else {
                <ng-container>
                  <mat-icon>login</mat-icon>
                  <span>Sign In</span>
                </ng-container>
              }
            </button>
          </form>
        </mat-card-content>
        
        <mat-card-footer class="demo-credentials">
          <div class="credentials-header">
            <mat-icon>info</mat-icon>
            <span>Demo Credentials</span>
          </div>
          <div class="credentials-list">
            <button mat-button (click)="fillCredentials('admin@opsflow.io', 'admin123')">
              <mat-icon>person</mat-icon>
              <span>Admin</span>
            </button>
            <button mat-button (click)="fillCredentials('manager@opsflow.io', 'manager123')">
              <mat-icon>supervised_user_circle</mat-icon>
              <span>Manager</span>
            </button>
          </div>
        </mat-card-footer>
      </mat-card>
      
      <footer class="login-footer">
        <p>&copy; 2024 OpsFlow. Incident Management System.</p>
      </footer>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #1565c0 100%);
      position: relative;
      overflow: hidden;
      padding: 24px;
    }
    
    .login-background {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    
    .bg-shape {
      position: absolute;
      border-radius: 50%;
      opacity: 0.1;
      animation: float 20s infinite ease-in-out;
    }
    
    .shape-1 {
      width: 600px;
      height: 600px;
      background: white;
      top: -200px;
      right: -100px;
      animation-delay: 0s;
    }
    
    .shape-2 {
      width: 400px;
      height: 400px;
      background: white;
      bottom: -150px;
      left: -100px;
      animation-delay: -5s;
    }
    
    .shape-3 {
      width: 300px;
      height: 300px;
      background: white;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: -10s;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      25% { transform: translateY(-20px) rotate(5deg); }
      50% { transform: translateY(0) rotate(0deg); }
      75% { transform: translateY(20px) rotate(-5deg); }
    }
    
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 0;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      animation: slideUp 0.5s ease-out;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .login-header {
      text-align: center;
      padding: 32px 24px 16px;
    }
    
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .logo-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #1976d2;
    }
    
    .logo-text {
      font-size: 32px;
      font-weight: 600;
      color: #1976d2;
    }
    
    .login-subtitle {
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
      font-size: 14px;
    }
    
    .login-form {
      padding: 0 24px;
    }
    
    .form-field {
      width: 100%;
      margin-bottom: 8px;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #d32f2f;
      background: #ffebee;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
    
    .login-button {
      width: 100%;
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .demo-credentials {
      margin: 24px 0 0;
      padding: 16px 24px;
      background: #f5f5f5;
      border-radius: 0 0 16px 16px;
    }
    
    .credentials-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(0, 0, 0, 0.6);
      font-size: 12px;
      margin-bottom: 12px;
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    .credentials-list {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
    
    .credentials-list button {
      color: #1976d2;
    }
    
    .login-footer {
      margin-top: 24px;
      text-align: center;
      
      p {
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        margin: 0;
      }
    }
    
    @media (max-width: 480px) {
      .login-card {
        border-radius: 12px;
      }
      
      .login-header {
        padding: 24px 16px 8px;
      }
      
      .login-form {
        padding: 0 16px;
      }
      
      .demo-credentials {
        padding: 12px 16px;
      }
      
      .credentials-list {
        flex-direction: column;
      }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  hidePassword = signal(true);

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  fillCredentials(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.error.set('');
  }

  login() {
    if (!this.email || !this.password) {
      this.error.set('Please enter email and password');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid credentials. Please try again.');
      }
    });
  }
}