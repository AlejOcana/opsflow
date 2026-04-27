import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  template: `
    <div class="teams-page">
      <div class="page-header">
        <h1>Teams</h1>
      </div>

      @if (teams().length === 0) {
        <div class="empty-state">
          <mat-icon>groups</mat-icon>
          <p>No teams found</p>
        </div>
      } @else {
        <div class="teams-grid">
          @for (team of teams(); track team.id) {
            <mat-card class="team-card">
              <mat-card-header>
                <div class="team-header-content">
                  <mat-icon class="team-icon">groups</mat-icon>
                  <div class="team-title-group">
                    <mat-card-title>{{ team.name }}</mat-card-title>
                    <mat-card-subtitle>{{ team.description || 'No description' }}</mat-card-subtitle>
                  </div>
                </div>
              </mat-card-header>
              <mat-card-content>
                @if (team.members && team.members.length > 0) {
                  <div class="members-section">
                    <h4 class="members-header">
                      <mat-icon>people</mat-icon>
                      <span>Members ({{ team.members.length }})</span>
                    </h4>
                    <div class="members-list">
                      @for (member of team.members; track member.id) {
                        <div class="member-item">
                          <mat-icon class="member-avatar">person</mat-icon>
                          <div class="member-info">
                            <span class="member-name">{{ member.fullName }}</span>
                            <span class="member-role">{{ member.role }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <p class="no-members">No members assigned</p>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .teams-page {
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
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      text-align: center;
      background: white;
      border-radius: 12px;
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: rgba(0, 0, 0, 0.2);
        margin-bottom: 16px;
      }
      
      p {
        color: rgba(0, 0, 0, 0.6);
        margin: 0;
      }
    }
    
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    
    .team-card {
      padding: 20px;
      
      .team-header-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        width: 100%;
      }
      
      .team-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #7b1fa2;
      }
      
      .team-title-group {
        flex: 1;
      }
      
      mat-card-title {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      mat-card-subtitle {
        color: rgba(0, 0, 0, 0.6);
        font-size: 13px;
      }
    }
    
    .members-section {
      margin-top: 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      padding-top: 16px;
    }
    
    .members-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
      margin: 0 0 12px;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    
    .members-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .member-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .member-avatar {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: rgba(0, 0, 0, 0.5);
    }
    
    .member-info {
      display: flex;
      flex-direction: column;
    }
    
    .member-name {
      font-weight: 500;
      font-size: 14px;
    }
    
    .member-role {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .no-members {
      color: rgba(0, 0, 0, 0.4);
      font-style: italic;
      padding: 12px 0;
      margin: 0;
    }
    
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }
      
      .page-header h1 {
        font-size: 24px;
      }
      
      .teams-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TeamsComponent implements OnInit {
  teams = signal<any[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('/api/teams').subscribe({
      next: (teams) => this.teams.set(teams)
    });
  }
}