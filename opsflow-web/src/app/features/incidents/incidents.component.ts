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
import { AuthService } from '../../core/services/auth.service';

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
          <div>
            <h1>Incidents</h1>
            <p class="page-subtitle">Track, triage and resolve — all in one place</p>
          </div>
          <span class="incident-count">{{ incidents().length }} total</span>
        </div>
        @if (auth.canCreate()) {
          <button mat-raised-button color="primary" routerLink="/incidents/new" class="new-button new-incident-btn">
            <mat-icon>add</mat-icon>
            <span class="button-text">New Incident</span>
          </button>
        }
      </div>

      <mat-card class="filters-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="filters.status" (selectionChange)="loadIncidents()">
              <mat-option value="">All Statuses</mat-option>
              <mat-option value="Open">Open</mat-option>
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

          @if (filters.status || filters.search) {
            <button mat-stroked-button class="clear-filters" (click)="filters.status=''; filters.search=''; loadIncidents()">
              <mat-icon>filter_alt_off</mat-icon> Clear
            </button>
          }
        </div>
        @if (filters.status || filters.search) {
          <div class="active-chips">
            @if (filters.status) {
              <span class="filter-chip">
                <mat-icon>circle</mat-icon> {{ filters.status }}
                <button mat-icon-button (click)="filters.status=''; loadIncidents()"><mat-icon>close</mat-icon></button>
              </span>
            }
            @if (filters.search) {
              <span class="filter-chip">
                <mat-icon>search</mat-icon> "{{ filters.search }}"
                <button mat-icon-button (click)="clearSearch()"><mat-icon>close</mat-icon></button>
              </span>
            }
          </div>
        }
      </mat-card>

      @if (loading()) {
        <div class="skeleton-table">
          <div class="shimmer" style="height: 56px; border-radius: 16px 16px 0 0;"></div>
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row">
              <div class="shimmer-line" style="width: 28%"></div>
              <div class="shimmer-line" style="width: 14%"></div>
              <div class="shimmer-line" style="width: 12%"></div>
              <div class="shimmer-line" style="width: 16%"></div>
              <div class="shimmer-line" style="width: 12%"></div>
              <div class="shimmer-line" style="width: 6%"></div>
            </div>
          }
        </div>
      } @else if (incidents().length === 0) {
        <mat-card class="empty-state">
          <div class="empty-illustration">
            <mat-icon>inbox</mat-icon>
          </div>
          <h3>No incidents found</h3>
          <p>{{ filters.search || filters.status ? 'Try adjusting your filters' : 'Get started by creating a new incident' }}</p>
          @if (auth.canCreate()) {
            <button mat-raised-button color="primary" routerLink="/incidents/new">
              <mat-icon>add</mat-icon>
              Create Incident
            </button>
          } @else {
            <small style="color: #94a3b8">Viewers cannot create incidents</small>
          }
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
                <span class="priority-chip priority-badge" [class]="incident.priority.toLowerCase()">
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
                    <span class="assignee-avatar"><mat-icon>person</mat-icon></span>
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
                  matTooltip="View details"
                  class="row-action">
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
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-left {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
      h1 { margin: 0; font-family: var(--font-display); font-size: 32px; font-weight: 700; letter-spacing: -0.025em; line-height: 1.1; color: #0f172a; }
      .page-subtitle { margin: 6px 0 0; color: #64748b; font-size: 14px; line-height: 1.5; }
    }

    .incident-count {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #475569;
      background: white;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid rgba(15,23,42,0.08);
      box-shadow: 0 1px 3px rgba(15,23,42,0.06);
      align-self: center;
      white-space: nowrap;
    }

    .new-button {
      height: 44px;
      padding: 0 18px !important;
      border-radius: 12px !important;
      font-weight: 600 !important;
      letter-spacing: -0.01em;
      box-shadow: 0 4px 14px rgba(26,35,126,0.22) !important;
      transition: transform 0.14s ease, box-shadow 0.2s ease, filter 0.2s ease;
      mat-icon { margin-right: 6px; font-size: 18px; width: 18px; height: 18px; }
      &:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(26,35,126,0.26) !important; filter: brightness(1.04); }
      &:active { transform: scale(0.98); }
    }

    .filters-card {
      padding: 18px;
      margin-bottom: 16px;
      border-radius: 16px !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 4px 24px rgba(15,23,42,0.05), 0 1px 3px rgba(15,23,42,0.04) !important;
      background: white !important;
      animation: subtleIn 0.4s ease both;
    }
    @keyframes subtleIn { from{opacity:0; transform: translateY(6px);} to{opacity:1; transform: translateY(0);} }

    .filters-row {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-field {
      min-width: 168px;
    }

    .search-field {
      flex: 1;
      min-width: 240px;
    }
    .clear-filters {
      height: 40px;
      border-radius: 12px !important;
      font-weight: 600 !important;
      border-color: rgba(15,23,42,0.12) !important;
      color: #475569 !important;
    }

    .active-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 14px;
      animation: chipIn 0.28s ease both;
    }
    @keyframes chipIn { from{opacity:0; transform: translateY(4px);} to{opacity:1; transform: translateY(0);} }
    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 4px 4px 12px;
      background: #eef2ff;
      border: 1px solid rgba(67,56,202,0.14);
      color: #4338ca;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: -0.01em;
      line-height: 1;
      animation: chipIn 0.28s ease both;
      mat-icon { font-size: 10px; width: 10px; height: 10px; color: #4338ca; }
      button {
        width: 24px;
        height: 24px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        mat-icon { font-size: 14px; width: 14px; height: 14px; color: #4338ca; }
      }
    }

    .skeleton-table {
      background: white;
      border-radius: 20px;
      border: 1px solid rgba(15,23,42,0.08);
      box-shadow: 0 4px 24px rgba(15,23,42,0.06);
      overflow: hidden;
      padding: 0;
    }
    .skeleton-row {
      display: grid;
      grid-template-columns: 1.6fr 0.8fr 0.7fr 0.9fr 0.8fr 40px;
      gap: 16px;
      padding: 18px 24px;
      border-top: 1px solid rgba(15,23,42,0.06);
      align-items: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 56px 32px;
      text-align: center;
      border-radius: 20px !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 4px 24px rgba(15,23,42,0.06) !important;

      .empty-illustration {
        width: 72px; height: 72px; border-radius: 20px; display: grid; place-items: center;
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border: 1px solid rgba(15,23,42,0.06);
        margin-bottom: 16px;
        mat-icon { font-size: 36px; width: 36px; height: 36px; color: #cbd5e1; }
      }

      h3 {
        margin: 0 0 8px;
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: #0f172a;
      }

      p {
        margin: 0 0 20px;
        color: #64748b;
        font-size: 14px;
        line-height: 1.5;
        max-width: 360px;
      }
    }

    .table-container {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid rgba(15,23,42,0.08);
      box-shadow: 0 4px 24px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.05);
    }

    .incidents-table {
      width: 100%;

      .incident-title {
        color: #1a237e;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        letter-spacing: -0.01em;
        transition: color 0.16s ease;
        &:hover { color: #5c4ddb; }
      }

      .incident-row {
        cursor: pointer;
        transition: background-color 0.16s ease, transform 0.12s ease;
        animation: rowIn 0.36s ease both;
        &:nth-child(1) { animation-delay: 0ms; }
        &:nth-child(2) { animation-delay: 40ms; }
        &:nth-child(3) { animation-delay: 80ms; }
        &:nth-child(4) { animation-delay: 120ms; }
        &:nth-child(5) { animation-delay: 160ms; }
        &:hover {
          background: rgba(92, 77, 219, 0.05) !important;
        }
        &:active { background: rgba(92,77,219,0.08) !important; }
      }
      @keyframes rowIn { from{opacity:0; transform: translateY(4px);} to{opacity:1; transform: translateY(0);} }
      .row-action {
        transition: transform 0.16s ease, background 0.16s ease;
        &:hover { background: #eef2ff !important; transform: translateX(2px); }
      }
    }
    @keyframes shimmer { 0%{transform:translateX(-100%);} 100%{transform:translateX(100%);} }

    .status-chip {
      display: inline-flex;
      align-items: center;
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid transparent;
      line-height: 1;

      &.open { background: #eef2ff; color: #4338ca; border-color: rgba(67,56,202,0.12); }
      &.inprogress { background: #fffbeb; color: #92400e; border-color: rgba(180,83,9,0.12); }
      &.resolved { background: #f5f3ff; color: #6d28d9; border-color: rgba(109,40,217,0.12); }
      &.closed { background: #f1f5f9; color: #475569; border-color: rgba(15,23,42,0.08); }
    }

    .priority-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border: 1px solid transparent;
      line-height: 1;
      &::before {
        content: '';
        width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
      }

      &.critical { background: #fef2f2; color: #991b1b; border-color: #fecaca; &::before{ background:#dc2626; box-shadow: 0 0 0 4px rgba(220,38,38,0.12);} }
      &.high { background: #fffbeb; color: #92400e; border-color: #fde68a; &::before{ background:#f59e0b; } }
      &.medium { background: #fffbeb; color: #b45309; border-color: #fde68a; &::before{ background:#f59e0b; opacity: 0.9;} }
      &.low { background: #ecfeff; color: #0e7490; border-color: #a5f3fc; &::before{ background:#06b6d4; } }
    }

    .assignee {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: -0.01em;
      color: #334155;

      .assignee-avatar {
        width: 28px; height: 28px; border-radius: 50%; background: #f1f5f9; border: 1px solid rgba(15,23,42,0.06);
        display: grid; place-items: center; flex-shrink: 0;
        mat-icon { font-size: 16px; width: 16px; height: 16px; color: #64748b; }
      }

      .unassigned {
        color: #94a3b8;
        font-style: italic;
        font-weight: 500;
        font-size: 13px;
      }
    }

    .date {
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: -0.01em;
      font-family: var(--font-mono);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-field, .search-field {
        width: 100%;
        min-width: unset;
      }

      .table-container {
        overflow-x: auto;
        border-radius: 16px;
      }

      .incidents-table {
        min-width: 680px;
      }
      .skeleton-row { grid-template-columns: 1fr; gap: 8px; }
    }

    @media (max-width: 390px) {
      h1 { font-size: 24px !important; }
      .incident-count { align-self: flex-start; }
      .filters-card { padding: 14px; border-radius: 14px !important; }
      .table-container { border-radius: 14px; }
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

  constructor(private incidentService: IncidentService, public auth: AuthService) {}

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
      'Open': 'Open',
      'InProgress': 'In Progress',
      'Resolved': 'Resolved',
      'Closed': 'Closed'
    };
    return statusMap[status] || status;
  }
}
