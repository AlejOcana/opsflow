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
import { trigger, transition, style, animate } from '@angular/animations';
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
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(18px)' }),
        animate('520ms cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="login-container">
      <div class="login-background" aria-hidden="true">
        <div class="mesh"></div>
        <div class="noise"></div>
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="grid-pattern"></div>
      </div>

      <mat-card class="login-card" [@fadeInUp]>
        <div class="card-glow"></div>
        <div class="login-header">
          <div class="logo">
            <span class="logo-mark">
              <mat-icon class="logo-icon">bolt</mat-icon>
            </span>
            <span class="logo-text">OpsFlow</span>
          </div>
          <p class="login-subtitle">Incident management — calm, fast, reliable.</p>
          <p class="login-tagline">Sign in to continue to your workspace</p>
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
                autocomplete="email"
                placeholder="you@company.io">
              @if (email && email.length > 0) {
                <button mat-icon-button matSuffix type="button" (click)="email = ''" matTooltip="Clear" tabindex="-1">
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
                autocomplete="current-password"
                placeholder="••••••••">
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
                <mat-spinner diameter="20"></mat-spinner>
                <span>Signing in…</span>
              } @else {
                <ng-container>
                  <mat-icon>login</mat-icon>
                  <span>Sign in</span>
                </ng-container>
              }
            </button>

            <div class="form-foot">
              <span class="foot-hint">Secure workspace • SSO ready</span>
            </div>
          </form>
        </mat-card-content>

        <mat-card-footer class="demo-credentials">
          <div class="credentials-header">
            <mat-icon>verified_user</mat-icon>
            <span>Demo access</span>
            <span class="header-line"></span>
          </div>
          <div class="credentials-list">
            <button class="pill-btn" type="button" (click)="fillCredentials('admin@opsflow.io', 'Admin123!')">
              <mat-icon>shield_person</mat-icon>
              <span>Admin</span>
              <small>admin@opsflow.io</small>
            </button>
            <button class="pill-btn" type="button" (click)="fillCredentials('platformmgr@opsflow.io', 'Manager123!')">
              <mat-icon>supervised_user_circle</mat-icon>
              <span>Manager</span>
              <small>platformmgr@opsflow.io</small>
            </button>
          </div>
          <p class="demo-note">One click to fill — no extra setup.</p>
        </mat-card-footer>
      </mat-card>

      <footer class="login-footer">
        <p>&copy; 2026 OpsFlow. Incident Management System. Crafted for reliability.</p>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .login-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      min-height: 100dvh;
      height: 100%;
      background: #0b1026;
      position: relative;
      overflow: hidden;
      padding: 24px;
      isolation: isolate;
    }

    // Background mesh + orbs + noise
    .login-background {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    .mesh {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(900px 600px at 18% 18%, rgba(92, 77, 219, 0.92) 0%, rgba(26, 35, 126, 0.9) 38%, transparent 74%),
        radial-gradient(900px 600px at 82% 12%, rgba(6, 182, 214, 0.22) 0%, transparent 62%),
        linear-gradient(135deg, #0b1026 0%, #1a237e 42%, #2a2a8a 62%, #5c4ddb 100%);
    }
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(900px 600px at 50% 30%, black 40%, transparent 75%);
      opacity: 0.5;
    }
    .noise {
      position: absolute;
      inset: 0;
      opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      mix-blend-mode: soft-light;
    }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(42px);
      opacity: 0.9;
      will-change: transform;
      animation: floatOrb 18s infinite ease-in-out;
    }
    .orb-1 {
      width: 560px; height: 560px;
      background: radial-gradient(circle at 30% 30%, #7c86ff 0%, #5c4ddb 42%, #1a237e 78%);
      top: -160px; right: -120px;
      animation-delay: 0s;
      opacity: 0.52;
    }
    .orb-2 {
      width: 520px; height: 520px;
      background: radial-gradient(circle at 30% 30%, #22d3ee 0%, #06b6d4 42%, #1e40af 82%);
      bottom: -180px; left: -120px;
      animation-delay: -6s;
      opacity: 0.32;
    }
    .orb-3 {
      width: 420px; height: 420px;
      background: radial-gradient(circle at 50% 50%, #a78bfa 0%, #5c4ddb 55%, transparent 75%);
      top: 48%; left: 54%;
      transform: translate(-50%, -50%);
      animation-delay: -11s;
      opacity: 0.18;
      filter: blur(64px);
    }
    @keyframes floatOrb {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      33% { transform: translate3d(14px, -18px, 0) scale(1.02); }
      66% { transform: translate3d(-10px, 16px, 0) scale(0.99); }
    }

    // Card — glass + inner shadow + gradient border
    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 0;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(18px) saturate(1.1);
      -webkit-backdrop-filter: blur(18px) saturate(1.1);
      border: 1px solid rgba(255, 255, 255, 0.55);
      box-shadow:
        0 24px 48px -12px rgba(10, 14, 48, 0.45),
        0 12px 24px -8px rgba(10, 14, 48, 0.2),
        inset 0 1px 0 rgba(255,255,255,0.9),
        inset 0 -1px 0 rgba(15, 23, 42, 0.04);
      position: relative;
      z-index: 1;
      overflow: hidden;
      animation: cardIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(18px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .card-glow {
      position: absolute;
      top: -1px; left: -1px; right: -1px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(92,77,219,0.5), transparent);
      opacity: 0.9;
    }

    .login-header {
      text-align: center;
      padding: 32px 28px 18px;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .logo-mark {
      width: 48px; height: 48px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #5c4ddb 100%);
      box-shadow: 0 8px 20px rgba(26, 35, 126, 0.28), 0 2px 8px rgba(26, 35, 126, 0.18);
      border: 1px solid rgba(255,255,255,0.18);
    }
    .logo-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: white !important;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
    }
    .logo-text {
      font-family: var(--font-display);
      font-size: 34px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1;
      background: linear-gradient(135deg, #1a237e 0%, #5c4ddb 62%, #06b6d4 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .login-subtitle {
      margin: 0;
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #0f172a;
      line-height: 1.4;
    }
    .login-tagline {
      margin: 4px 0 0;
      font-size: 13px;
      color: #64748b;
      letter-spacing: 0.01em;
      line-height: 1.5;
    }

    .login-form {
      padding: 0 28px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .form-field {
      width: 100%;
      margin-bottom: 6px;
    }
    // refine Material outline a bit
    ::ng-deep .mat-mdc-form-field .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field .mdc-notched-outline__trailing {
      border-color: rgba(15, 23, 42, 0.10) !important;
    }
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #5c4ddb !important;
      border-width: 1.5px !important;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #991b1b;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 12px 14px;
      border-radius: 12px;
      margin: 4px 0 10px;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      animation: subtleIn 0.28s ease both;
      @keyframes subtleIn { from{opacity:0; transform: translateY(6px);} to{opacity:1; transform: translateY(0);} }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #dc2626;
        flex-shrink: 0;
      }
    }

    .login-button {
      width: 100%;
      height: 48px;
      font-size: 15px;
      font-weight: 600;
      margin-top: 8px;
      border-radius: 12px !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      letter-spacing: -0.01em;
      box-shadow: 0 8px 18px rgba(26, 35, 126, 0.22), 0 2px 6px rgba(26, 35, 126, 0.16);
      transition: transform 0.14s ease, box-shadow 0.2s ease, filter 0.2s ease;
    }
    .login-button:hover { filter: brightness(1.05); transform: translateY(-1px); }
    .login-button:active { transform: scale(0.98); }

    .form-foot {
      text-align: center;
      padding: 10px 0 2px;
    }
    .foot-hint {
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 600;
      color: #94a3b8;
    }

    .demo-credentials {
      margin: 22px 0 0;
      padding: 18px 20px 16px;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border-top: 1px solid rgba(15, 23, 42, 0.06);
      border-radius: 0 0 20px 20px;
      display: block;
    }

    .credentials-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 14px;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: #5c4ddb;
      }
      .header-line {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, rgba(15,23,42,0.08), transparent);
        margin-left: 4px;
      }
    }

    .credentials-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .pill-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 14px 10px 12px;
      border-radius: 14px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      background: white;
      cursor: pointer;
      transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      box-shadow: 0 1px 3px rgba(16,24,40,0.06);
      text-align: center;
      font-family: var(--font-sans);

      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #1a237e; }
      span { font-size: 13px; font-weight: 700; letter-spacing: -0.01em; color: #0f172a; line-height: 1; }
      small { font-size: 11px; color: #64748b; font-weight: 500; letter-spacing: 0; }

      &:hover {
        transform: translateY(-2px);
        border-color: rgba(92, 77, 219, 0.22);
        box-shadow: 0 8px 18px rgba(16,24,40,0.08), 0 2px 6px rgba(16,24,40,0.06);
        background: #f8f9ff;
      }
      &:active { transform: scale(0.98); }
      &:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(92,77,219,0.2); }
    }
    .demo-note {
      margin: 12px 0 0;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      letter-spacing: 0.02em;
    }

    .login-footer {
      margin-top: 24px;
      text-align: center;
      position: relative;
      z-index: 1;
      p {
        color: rgba(255, 255, 255, 0.62);
        font-size: 12px;
        margin: 0;
        letter-spacing: 0.02em;
        font-weight: 400;
      }
    }

    // Responsive
    @media (max-width: 480px) {
      .login-container { padding: 16px; }
      .login-card { border-radius: 16px; max-width: 100%; }
      .login-header { padding: 24px 20px 14px; }
      .login-form { padding: 0 20px; }
      .demo-credentials { padding: 16px; }
      .credentials-list { grid-template-columns: 1fr; }
      .logo-text { font-size: 30px; }
      .logo-mark { width: 44px; height: 44px; border-radius: 12px; }
    }
    @media (max-width: 390px) {
      .login-container { padding: 12px; }
      .login-card { border-radius: 14px; }
      .login-header { padding: 20px 16px 10px; }
      .login-form { padding: 0 16px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .orb { animation: none !important; }
      .login-card { animation: none !important; }
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
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid credentials. Please try again.');
      }
    });
  }
}
