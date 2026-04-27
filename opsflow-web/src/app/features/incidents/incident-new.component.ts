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
        <button mat-button routerLink="/incidents">
          <mat-icon>arrow_back</mat-icon> Back
        </button>
      </div>

      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>New Incident</mat-card-title>
          <mat-card-subtitle>Report a new incident or issue</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="create()">
            <mat-form-field class="form-field">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="incident.title" name="title" required>
            </mat-form-field>

            <mat-form-field class="form-field">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="incident.description" name="description" rows="4"></textarea>
            </mat-form-field>

            <mat-form-field class="form-field">
              <mat-label>Priority</mat-label>
              <mat-select [(ngModel)]="incident.priority" name="priority" required>
                <mat-option value="Low">Low</mat-option>
                <mat-option value="Medium">Medium</mat-option>
                <mat-option value="High">High</mat-option>
                <mat-option value="Critical">Critical</mat-option>
              </mat-select>
            </mat-form-field>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <div class="actions">
              <button mat-button type="button" routerLink="/incidents">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="loading()">
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Create Incident
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .new-incident { 
      max-width: 1200px; 
      margin: 0 auto;
    }
    .form-card { margin-top: 16px; padding: 24px; }
    .form-field { width: 100%; margin-bottom: 8px; }
    .error-message { color: #f44336; margin-bottom: 16px; }
    .actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
  `]
})
export class IncidentNewComponent {
  incident = { title: '', description: '', priority: 'Medium' };
  loading = signal(false);
  error = signal('');

  constructor(private incidentService: IncidentService, private router: Router) {}

  create() {
    this.loading.set(true);
    this.error.set('');
    this.incidentService.createIncident(this.incident).subscribe({
      next: (created) => { this.router.navigate(['/incidents', created.id]); },
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message || 'Failed to create incident'); }
    });
  }
}