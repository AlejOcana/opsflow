import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IncidentService, IncidentDetail } from '../../core/services/incident.service';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="incident-detail">
      @if (incident()) {
        <div class="page-header">
          <button mat-button routerLink="/incidents">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
        </div>

        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>{{ incident()!.title }}</mat-card-title>
            <mat-card-subtitle>
              <span class="status-badge" [class]="getStatusClass(incident()!.status)">
                {{ incident()!.status }}
              </span>
              <span class="priority-badge" [class]="incident()!.priority.toLowerCase()">
                {{ incident()!.priority }}
              </span>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="detail-row">
              <strong>Description:</strong>
              <p>{{ incident()!.description || 'No description' }}</p>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <strong>Reporter:</strong>
                <span>{{ incident()!.createdBy.fullName }}</span>
              </div>
              <div class="detail-item">
                <strong>Assignee:</strong>
                <span>{{ incident()!.assignedTo?.fullName || 'Unassigned' }}</span>
              </div>
              <div class="detail-item">
                <strong>Team:</strong>
                <span>{{ incident()!.team?.name || 'No team' }}</span>
              </div>
              <div class="detail-item">
                <strong>Created:</strong>
                <span>{{ incident()!.createdAt | date:'medium' }}</span>
              </div>
              @if (incident()!.resolvedAt) {
                <div class="detail-item">
                  <strong>Resolved:</strong>
                  <span>{{ incident()!.resolvedAt | date:'medium' }}</span>
                </div>
              }
              @if (incident()!.closedAt) {
                <div class="detail-item">
                  <strong>Closed:</strong>
                  <span>{{ incident()!.closedAt | date:'medium' }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <p>Loading...</p>
      }
    </div>
  `,
  styles: [`
    .incident-detail { 
      max-width: 1200px; 
      margin: 0 auto;
    }
    .detail-card { margin-top: 16px; padding: 24px; }
    .detail-row { margin-bottom: 16px; p { margin: 8px 0; color: rgba(0,0,0,0.7); } }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; strong { font-size: 12px; color: rgba(0,0,0,0.6); } span { font-size: 14px; } }
    .status-badge, .priority-badge { padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; margin-right: 8px; }
    .status-badge.new { background: #e3f2fd; color: #1976d2; }
    .status-badge.assigned { background: #fff3e0; color: #f57c00; }
    .status-badge.inprogress { background: #fff8e1; color: #f9a825; }
    .status-badge.resolved { background: #e8f5e9; color: #388e3c; }
    .status-badge.closed { background: #eceff1; color: #546e7a; }
    .priority-badge.critical { background: #ffebee; color: #c62828; }
    .priority-badge.high { background: #fff3e0; color: #ef6c00; }
    .priority-badge.medium { background: #fffde7; color: #f9a825; }
    .priority-badge.low { background: #e3f2fd; color: #1976d2; }
  `]
})
export class IncidentDetailComponent implements OnInit {
  incident = signal<IncidentDetail | null>(null);

  constructor(private route: ActivatedRoute, private incidentService: IncidentService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.incidentService.getIncident(id).subscribe({
        next: (incident) => this.incident.set(incident)
      });
    }
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '');
  }
}