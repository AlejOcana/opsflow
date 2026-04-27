import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { IncidentService, IncidentList } from '../../core/services/incident.service';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  template: `
    <div class="incidents-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Incidents</h1>
          <span class="incident-count">{{ incidents().length }} total</span>
        </div>
        <button mat-raised-button color="primary" routerLink="/incidents/new" class="new-button">
          <mat-icon>add</mat-icon>
          <span class="button-text">New Incident</span>
        </button>
      </div>

      <mat-card class="filters-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="filters.status" (selectionChange)="loadIncidents()">
              <mat-option value="">All Statuses</mat-option>
              <mat-option value="New">New</mat-option>
              <mat-option value="Assigned">Assigned</mat-option>
              <mat-option value="InProgress">In Progress</mat-option>
              <mat-option value="Resolved">Resolved</mat-option>
              <mat-option value="Closed">Closed</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field search-field">
            <mat-label>Search</mat-label>
            <input 
              matInput 
              [(ngModel)]="filters.search" 
              (keyup.enter)="loadIncidents()"
              placeholder="Search incidents...">
            <mat-icon matSuffix>search</mat-icon>
            @if (filters.search) {
              <button mat-icon-button matSuffix (click)="clearSearch()" matTooltip="Clear search">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
        </div>
      </mat-card>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading incidents...</p>
        </div>
      } @else if (incidents().length === 0) {
        <mat-card class="empty-state">
          <mat-icon>inbox</mat-icon>
          <h3>No incidents found</h3>
          <p>{{ filters.search || filters.status ? 'Try adjusting your filters' : 'Get started by creating a new incident' }}</p>
          <button mat-raised-button color="primary" routerLink="/incidents/new">
            <mat-icon>add</mat-icon>
            Create Incident
          </button>
        </mat-card>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="incidents()" class="incidents-table">
            <!-- Title Column -->
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let incident">
                <a [routerLink]="['/incidents', incident.id]" class="incident-title">
                  {{ incident.title }}
                </a>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let incident">
                <span class="status-chip" [class]="getStatusClass(incident.status)">
                  {{ formatStatus(incident.status) }}
                </span>
              </td>
            </ng-container>

            <!-- Priority Column -->
            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let incident">
                <span class="priority-chip" [class]="incident.priority.toLowerCase()">
                  {{ incident.priority }}
                </span>
              </td>
            </ng-container>

            <!-- Assignee Column -->
            <ng-container matColumnDef="assignee">
              <th mat-header-cell *matHeaderCellDef>Assignee</th>
              <td mat-cell *matCellDef="let incident">
                <div class="assignee">
                  @if (incident.assignedTo) {
                    <mat-icon class="assignee-avatar">person</mat-icon>
                    <span>{{ incident.assignedTo.fullName }}</span>
                  } @else {
                    <span class="unassigned">Unassigned</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Created Column -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let incident">
                <span class="date">{{ incident.createdAt | date:'MMM d, h:mm a' }}</span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let incident">
                <button 
                  mat-icon-button 
                  [routerLink]="['/incidents', incident.id]"
                  matTooltip="View details">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="incident-row"></tr>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .incidents-page {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .header-left {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    
    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }
    
    .incident-count {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      background: #f5f5f5;
      padding: 4px 12px;
      border-radius: 16px;
    }
    
    .new-button {
      mat-icon {
        margin-right: 4px;
      }
    }
    
    .filters-card {
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .filters-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .filter-field {
      min-width: 160px;
    }
    
    .search-field {
      flex: 1;
      min-width: 240px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 64px;
      color: rgba(0, 0, 0, 0.6);
      
      p {
        margin-top: 16px;
      }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px;
      text-align: center;
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: rgba(0, 0, 0, 0.2);
        margin-bottom: 16px;
      }
      
      h3 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }
      
      p {
        margin: 0 0 24px;
        color: rgba(0, 0, 0, 0.6);
      }
    }
    
    .table-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .incidents-table {
      width: 100%;
      
      .incident-title {
        color: #1976d2;
        text-decoration: none;
        font-weight: 500;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      .incident-row {
        cursor: pointer;
        transition: background-color 0.2s ease;
        
        &:hover {
          background: rgba(25, 118, 210, 0.04);
        }
      }
    }
    
    .status-chip {
      display: inline-flex;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      
      &.new { background: #e3f2fd; color: #1976d2; }
      &.assigned { background: #fff3e0; color: #f57c00; }
      &.inprogress { background: #fff8e1; color: #f9a825; }
      &.resolved { background: #e8f5e9; color: #388e3c; }
      &.closed { background: #eceff1; color: #546e7a; }
    }
    
    .priority-chip {
      display: inline-flex;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      
      &.critical { background: #ffebee; color: #c62828; }
      &.high { background: #fff3e0; color: #ef6c00; }
      &.medium { background: #fffde7; color: #f9a825; }
      &.low { background: #e3f2fd; color: #1976d2; }
    }
    
    .assignee {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .assignee-avatar {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: rgba(0, 0, 0, 0.5);
      }
      
      .unassigned {
        color: rgba(0, 0, 0, 0.4);
        font-style: italic;
      }
    }
    
    .date {
      color: rgba(0, 0, 0, 0.6);
      font-size: 13px;
    }
    
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }
      
      .header-left {
        flex-direction: column;
        gap: 4px;
      }
      
      .new-button {
        .button-text {
          display: none;
        }
      }
      
      .filters-row {
        flex-direction: column;
      }
      
      .filter-field, .search-field {
        width: 100%;
        min-width: unset;
      }
      
      .table-container {
        overflow-x: auto;
      }
      
      .incidents-table {
        min-width: 600px;
      }
    }
    
    @media (max-width: 480px) {
      h1 {
        font-size: 24px;
      }
      
      .loading-container, .empty-state {
        padding: 32px;
      }
      
      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }
  `]
})
export class IncidentsComponent implements OnInit {
  incidents = signal<IncidentList[]>([]);
  loading = signal(false);
  displayedColumns = ['title', 'status', 'priority', 'assignee', 'createdAt', 'actions'];

  filters = {
    status: '',
    search: ''
  };

  constructor(private incidentService: IncidentService) {}

  ngOnInit() {
    this.loadIncidents();
  }

  loadIncidents() {
    this.loading.set(true);
    this.incidentService.getIncidents({
      status: this.filters.status || undefined,
      search: this.filters.search || undefined
    }).subscribe({
      next: (data) => {
        this.incidents.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  clearSearch() {
    this.filters.search = '';
    this.loadIncidents();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '');
  }

  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'New': 'New',
      'Assigned': 'Assigned',
      'InProgress': 'In Progress',
      'Resolved': 'Resolved',
      'Closed': 'Closed'
    };
    return statusMap[status] || status;
  }
}