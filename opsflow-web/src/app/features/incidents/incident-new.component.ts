import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IncidentService } from '../../core/services/incident.service';

@Component({
  selector: 'app-incident-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="new-incident">
      <div class="page-header">
        <button mat-button routerLink="/incidents" class="back-btn">
          <mat-icon>arrow_back</mat-icon> Back
        </button>
      </div>

      <mat-card class="form-card">
        <div class="form-accent"></div>
        <mat-card-header>
          <div class="title-row">
            <span class="title-icon"><mat-icon>add_circle</mat-icon></span>
            <div>
              <mat-card-title>New Incident</mat-card-title>
              <mat-card-subtitle>Report a new incident or issue — clear details help faster resolution</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="create()" class="form">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="incident.title" name="title" required placeholder="Brief, specific — e.g. Checkout latency spike">
              <mat-icon matSuffix>title</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="incident.description" name="description" rows="4" placeholder="What happened, impact, steps to reproduce — keep it factual"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Priority</mat-label>
              <mat-select [(ngModel)]="incident.priority" name="priority" required>
                <mat-option value="Low">Low</mat-option>
                <mat-option value="Medium">Medium</mat-option>
                <mat-option value="High">High</mat-option>
                <mat-option value="Critical">Critical</mat-option>
              </mat-select>
              <mat-icon matSuffix>flag</mat-icon>
            </mat-form-field>

            @if (error()) {
              <div class="error-message">
                <mat-icon>error_outline</mat-icon>
                <span>{{ error() }}</span>
              </div>
            }

            <div class="actions">
              <button mat-stroked-button type="button" routerLink="/incidents" class="cancel-btn">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="loading()" class="submit-btn">
                @if (loading()) {
                  <mat-spinner diameter="18"></mat-spinner>
                  <span>Creating…</span>
                } @else {
                  <span class="btn-inner"><mat-icon>bolt</mat-icon> Create Incident</span>
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <p class="helper-note">Incidents are visible to your team instantly. You can add timeline notes and attachments after creation.</p>
    </div>
  `,
  styles: [`
    .new-incident {
      max-width: 720px;
      margin: 0 auto;
    }
    .page-header { margin-bottom: 16px; }
    .back-btn {
      border-radius: 999px !important;
      font-weight: 600 !important;
      color: #334155 !important;
      background: white !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 1px 3px rgba(15,23,42,0.06) !important;
      &:hover { background: #f8fafc !important; }
    }
    .form-card {
      margin-top: 8px;
      padding: 28px;
      border-radius: 20px !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 4px 24px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.05) !important;
      background: white !important;
      position: relative;
      overflow: hidden;
      animation: subtleIn 0.44s cubic-bezier(0.2,0.8,0.2,1) both;
    }
    @keyframes subtleIn { from{opacity:0; transform: translateY(8px);} to{opacity:1; transform: translateY(0);} }
    .form-accent {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, #1a237e, #5c4ddb 55%, #06b6d4);
      border-radius: 20px 20px 0 0;
    }
    mat-card-header { padding: 0; margin-bottom: 22px; }
    .title-row {
      display: flex; gap: 14px; align-items: flex-start;
      .title-icon {
        width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0;
        background: linear-gradient(135deg, #1a237e, #5c4ddb);
        box-shadow: 0 4px 12px rgba(26,35,126,0.18);
        border: 1px solid rgba(255,255,255,0.18);
        mat-icon { font-size: 22px; width: 22px; height: 22px; color: white; }
      }
      mat-card-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; line-height: 1.2; }
      mat-card-subtitle { font-size: 13px; color: #64748b; margin-top: 4px; line-height: 1.5; }
    }
    mat-card-content { padding: 0; }
    .form { display: flex; flex-direction: column; gap: 2px; }
    .form-field { width: 100%; margin-bottom: 8px; }
    ::ng-deep .form-field .mdc-notched-outline__notch,
    ::ng-deep .form-field .mdc-notched-outline__leading,
    ::ng-deep .form-field .mdc-notched-outline__trailing { border-color: rgba(15,23,42,0.10) !important; }
    ::ng-deep .form-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .form-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .form-field.mat-focused .mdc-notched-outline__trailing { border-color: #5c4ddb !important; border-width: 1.5px !important; }
    .error-message {
      display: flex; align-items: center; gap: 8px;
      color: #991b1b; background: #fef2f2; border: 1px solid #fecaca;
      padding: 12px 14px; border-radius: 12px; font-size: 13px; font-weight: 500; line-height: 1.4;
      animation: subtleIn 0.24s ease both;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #dc2626; flex-shrink: 0; }
    }
    .actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 18px; align-items: center; }
    .cancel-btn { border-radius: 12px !important; font-weight: 600 !important; height: 44px; padding: 0 18px !important; border-color: rgba(15,23,42,0.14) !important; color: #334155 !important; }
    .submit-btn {
      height: 44px; padding: 0 20px !important; border-radius: 12px !important; font-weight: 600 !important; letter-spacing: -0.01em;
      box-shadow: 0 4px 14px rgba(26,35,126,0.22) !important;
      display: inline-flex; align-items: center; gap: 6px;
      .btn-inner { display: inline-flex; align-items: center; gap: 6px; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(26,35,126,0.26) !important; }
      &:active { transform: scale(0.98); }
    }
    .helper-note {
      text-align: center; margin: 16px 0 0; font-size: 12px; color: #94a3b8; letter-spacing: 0.01em; line-height: 1.5;
    }
    @media (max-width: 600px) {
      .form-card { padding: 20px; border-radius: 16px !important; }
      .title-row { gap: 12px; .title-icon { width: 40px; height: 40px; border-radius: 10px; } }
      .actions { flex-direction: column-reverse; align-items: stretch; .cancel-btn, .submit-btn { width: 100%; justify-content: center; } }
    }
    @media (max-width: 390px) {
      .form-card { padding: 16px; }
    }
  `]
})
export class IncidentNewComponent {
  incident = { title: '', description: '', priority: 'Medium' };
  loading = signal(false);
  error = signal('');

  constructor(private incidentService: IncidentService, private router: Router) {}

  create() {
    if (!this.incident.title.trim()) {
      this.error.set('Title is required');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.incidentService.createIncident(this.incident).subscribe({
      next: (created) => { this.router.navigate(['/incidents', created.id]); },
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message || 'Failed to create incident'); }
    });
  }
}
