import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Stats {
  totalIncidents: number;
  openIncidents: number;
  inProgressIncidents: number;
  resolvedIncidents: number;
  closedIncidents: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalUsers: number;
  totalTeams: number;
  totalOrganizations: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1>Dashboard</h1>
        <button mat-raised-button color="primary" routerLink="/incidents/new" class="new-incident-btn">
          <mat-icon>add</mat-icon>
          <span class="btn-text">New Incident</span>
        </button>
      </div>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon">bug_report</mat-icon>
            <div class="stat-value">{{ stats().totalIncidents }}</div>
            <div class="stat-label">Total Incidents</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card new">
          <mat-card-content>
            <mat-icon class="stat-icon">fiber_new</mat-icon>
            <div class="stat-value">{{ stats().openIncidents }}</div>
            <div class="stat-label">Open</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card in-progress">
          <mat-card-content>
            <mat-icon class="stat-icon">engineering</mat-icon>
            <div class="stat-value">{{ stats().inProgressIncidents }}</div>
            <div class="stat-label">In Progress</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card resolved">
          <mat-card-content>
            <mat-icon class="stat-icon">check_circle</mat-icon>
            <div class="stat-value">{{ stats().resolvedIncidents }}</div>
            <div class="stat-label">Resolved</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card closed">
          <mat-card-content>
            <mat-icon class="stat-icon">task_alt</mat-icon>
            <div class="stat-value">{{ stats().closedIncidents }}</div>
            <div class="stat-label">Closed</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card teams">
          <mat-card-content>
            <mat-icon class="stat-icon">groups</mat-icon>
            <div class="stat-value">{{ stats().totalTeams }}</div>
            <div class="stat-label">Teams</div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="priority-alert">
        <h3>Attention Required</h3>
        @if (stats().criticalCount > 0) {
          <div class="alert-item critical">
            <mat-icon>error</mat-icon>
            <span>{{ stats().criticalCount }} critical incidents</span>
          </div>
        }
        @if (stats().highCount > 0) {
          <div class="alert-item high">
            <mat-icon>warning</mat-icon>
            <span>{{ stats().highCount }} high priority incidents</span>
          </div>
        }
        @if (stats().criticalCount === 0 && stats().highCount === 0) {
          <div class="alert-item success">
            <mat-icon>check_circle</mat-icon>
            <span>No critical or high priority incidents</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard { 
      max-width: 1200px; 
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }
    }
    
    .new-incident-btn {
      mat-icon {
        margin-right: 4px;
      }
      
      .btn-text {
        display: inline;
      }
    }
    
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }
      
      .new-incident-btn .btn-text {
        display: none;
      }
    }
    
    @media (max-width: 480px) {
      .page-header h1 {
        font-size: 24px;
      }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      text-align: center;
      padding: 24px 16px;
      
      mat-icon.stat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        margin-bottom: 12px;
      }
    }
    .stat-card.new { border-left: 4px solid #1976d2; }
    .stat-card.in-progress { border-left: 4px solid #f57c00; }
    .stat-card.resolved { border-left: 4px solid #388e3c; }
    .stat-card.closed { border-left: 4px solid #546e7a; }
    .stat-card.teams { border-left: 4px solid #7b1fa2; }

    .stat-value {
      font-size: 36px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .stat-label {
      color: rgba(0,0,0,0.6);
      font-size: 14px;
    }
    .priority-alert {
      background: white;
      padding: 24px;
      border-radius: 8px;

      h3 { margin: 0 0 16px; }
    }
    .alert-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 4px;

      &.critical {
        background: #ffebee;
        color: #c62828;
      }
      &.high {
        background: #fff3e0;
        color: #ef6c00;
      }
      &.success {
        background: #e8f5e9;
        color: #2e7d32;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal<Stats>({
    totalIncidents: 0,
    openIncidents: 0,
    inProgressIncidents: 0,
    resolvedIncidents: 0,
    closedIncidents: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    totalUsers: 0,
    totalTeams: 0,
    totalOrganizations: 0
  });

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<Stats>('/api/dashboard/stats', { headers }).subscribe({
      next: (data) => this.stats.set(data),
      error: () => {}
    });
  }
}