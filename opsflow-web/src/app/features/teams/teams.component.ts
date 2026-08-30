import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  template: `
    <div class="teams-page">
      <div class="page-header">
        <div>
          <h1>Teams</h1>
          <p class="page-subtitle">Squads that own incidents and run the response</p>
        </div>
        <span class="teams-count">{{ teams().length }} teams</span>
      </div>

      @if (teams().length === 0) {
        <div class="empty-state">
          <div class="empty-illustration">
            <mat-icon>groups</mat-icon>
          </div>
          <h3>No teams yet</h3>
          <p>Teams will appear here once created by your organization.</p>
        </div>
      } @else {
        <div class="teams-grid">
          @for (team of teams(); track team.id) {
            <mat-card class="team-card" [style.animation-delay.ms]="$index * 60">
              <mat-card-header>
                <div class="team-header-content">
                  <span class="team-icon-wrap">
                    <mat-icon class="team-icon">groups</mat-icon>
                  </span>
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
                      <span>Members</span>
                      <span class="members-count">{{ team.members.length }}</span>
                    </h4>
                    <div class="members-list">
                      @for (member of team.members; track member.userId) {
                        <div class="member-item">
                          <span class="member-avatar"><mat-icon>person</mat-icon></span>
                          <div class="member-info">
                            <span class="member-name">{{ member.userName }}</span>
                            <span class="member-role">{{ member.roleInTeam }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <p class="no-members">No members assigned — add collaborators to this team.</p>
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
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;

      h1 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 32px;
        font-weight: 700;
        letter-spacing: -0.025em;
        line-height: 1.1;
        color: #0f172a;
      }
      .page-subtitle { margin: 6px 0 0; color: #64748b; font-size: 14px; line-height: 1.5; }
    }
    .teams-count {
      align-self: center;
      font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
      color: #475569; background: white; padding: 6px 12px; border-radius: 999px;
      border: 1px solid rgba(15,23,42,0.08); box-shadow: 0 1px 3px rgba(15,23,42,0.06);
      white-space: nowrap;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 32px;
      text-align: center;
      background: white;
      border-radius: 20px;
      border: 1px solid rgba(15,23,42,0.08);
      box-shadow: 0 4px 24px rgba(15,23,42,0.06);

      .empty-illustration {
        width: 72px; height: 72px; border-radius: 20px; display: grid; place-items: center;
        background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid rgba(15,23,42,0.06);
        margin-bottom: 16px;
        mat-icon { font-size: 36px; width: 36px; height: 36px; color: #cbd5e1; }
      }
      h3 { margin: 0 0 6px; font-family: var(--font-display); font-size: 18px; font-weight: 700; letter-spacing: -0.01em; color: #0f172a; }
      p { color: #64748b; margin: 0; font-size: 14px; line-height: 1.5; max-width: 360px; }
    }

    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 18px;
    }

    .team-card {
      padding: 22px;
      border-radius: 20px !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 4px 24px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04) !important;
      background: white !important;
      transition: transform 0.20s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.20s ease, border-color 0.20s ease;
      animation: subtleIn 0.42s cubic-bezier(0.2,0.8,0.2,1) both;
      overflow: hidden;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(92,77,219,0.14), transparent);
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(15,23,42,0.09), 0 4px 12px rgba(15,23,42,0.05) !important;
        border-color: rgba(92,77,219,0.12) !important;
        &::before { opacity: 1; }
      }
      &:active { transform: scale(0.99); }

      .team-header-content {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        width: 100%;
      }

      .team-icon-wrap {
        width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0;
        background: linear-gradient(135deg, #1a237e, #5c4ddb);
        box-shadow: 0 4px 12px rgba(26,35,126,0.18);
        border: 1px solid rgba(255,255,255,0.18);
      }
      .team-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: white;
      }

      .team-title-group {
        flex: 1;
        min-width: 0;
      }

      mat-card-title {
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.015em;
        margin-bottom: 4px;
        color: #0f172a;
        line-height: 1.25;
      }

      mat-card-subtitle {
        color: #64748b;
        font-size: 13px;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      mat-card-header { padding: 0; margin-bottom: 6px; }
      mat-card-content { padding: 0; }
    }
    @keyframes subtleIn { from{opacity:0; transform: translateY(8px);} to{opacity:1; transform: translateY(0);} }

    .members-section {
      margin-top: 16px;
      border-top: 1px solid rgba(15, 23, 42, 0.07);
      padding-top: 16px;
    }

    .members-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #475569;
      margin: 0 0 12px;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: #94a3b8;
      }
      .members-count {
        margin-left: auto;
        background: #f1f5f9;
        color: #475569;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        border: 1px solid rgba(15,23,42,0.06);
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
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid rgba(15,23,42,0.06);
      border-radius: 12px;
      transition: background 0.16s ease, border-color 0.16s ease, transform 0.14s ease;
      &:hover { background: #f1f5f9; border-color: rgba(15,23,42,0.08); transform: translateY(-0.5px); }
    }

    .member-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: white; border: 1px solid rgba(15,23,42,0.08);
      display: grid; place-items: center; flex-shrink: 0; box-shadow: 0 1px 3px rgba(15,23,42,0.05);
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #64748b; }
    }

    .member-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .member-name {
      font-weight: 600;
      font-size: 13px;
      letter-spacing: -0.01em;
      color: #0f172a;
      line-height: 1.2;
    }

    .member-role {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .no-members {
      color: #94a3b8;
      font-style: italic;
      padding: 12px 0 4px;
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .page-header h1 {
        font-size: 26px;
      }
      .teams-count { align-self: flex-start; }

      .teams-grid {
        grid-template-columns: 1fr;
        gap: 14px;
      }
    }
    @media (max-width: 390px) {
      .team-card { padding: 16px; border-radius: 16px !important; }
      .teams-grid { gap: 12px; }
      h1 { font-size: 24px !important; }
    }
  `]
})
export class TeamsComponent implements OnInit {
  teams = signal<any[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/teams`).subscribe({
      next: (teams) => this.teams.set(teams)
    });
  }
}
