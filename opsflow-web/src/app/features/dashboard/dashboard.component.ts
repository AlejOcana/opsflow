import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

interface Stats extends DashboardStats {}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, MatTooltipModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="page-subtitle">Operational overview — incidents, teams and service health</p>
        </div>
        @if (auth.canCreate()) {
          <button mat-raised-button color="primary" routerLink="/incidents/new" class="new-incident-btn">
            <mat-icon>add</mat-icon>
            <span class="btn-text">New Incident</span>
          </button>
        }
      </div>

      @if (loading()) {
        <div class="skeleton-grid">
          <div class="skeleton shimmer" style="height: 118px; border-radius: 20px;"></div>
          <div class="skeleton shimmer" style="height: 118px; border-radius: 20px;"></div>
          <div class="skeleton shimmer" style="height: 118px; border-radius: 20px;"></div>
          <div class="skeleton shimmer" style="height: 118px; border-radius: 20px;"></div>
          <div class="skeleton shimmer" style="height: 118px; border-radius: 20px;"></div>
          <div class="skeleton shimmer" style="height: 118px; border-radius: 20px;"></div>
        </div>
        <div class="skeleton shimmer" style="height: 160px; border-radius: 20px; margin-top: 16px;"></div>
        <div class="skeleton shimmer" style="height: 280px; border-radius: 20px; margin-top: 16px;"></div>
      } @else {
        <div class="stats-grid">
          <mat-card class="stat-card stagger-1">
            <mat-card-content>
              <div class="stat-top">
                <span class="icon-badge total"><mat-icon>bug_report</mat-icon></span>
                <span class="stat-trend neutral"><mat-icon>trending_up</mat-icon> all time</span>
              </div>
              <div class="stat-value">{{ s().totalIncidents }}</div>
              <div class="stat-label">Total Incidents</div>
              <div class="stat-foot">Across all teams</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card new stagger-2">
            <mat-card-content>
              <div class="stat-top">
                <span class="icon-badge open"><mat-icon>fiber_new</mat-icon></span>
                <span class="stat-trend up"><mat-icon>arrow_outward</mat-icon> active</span>
              </div>
              <div class="stat-value gradient-indigo">{{ s().openIncidents }}</div>
              <div class="stat-label">Open</div>
              <div class="stat-foot">Awaiting triage</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card in-progress stagger-3">
            <mat-card-content>
              <div class="stat-top">
                <span class="icon-badge progress"><mat-icon>engineering</mat-icon></span>
                <span class="stat-trend warn"><mat-icon>pace</mat-icon> working</span>
              </div>
              <div class="stat-value gradient-amber">{{ s().inProgressIncidents }}</div>
              <div class="stat-label">In Progress</div>
              <div class="stat-foot">Being handled</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card resolved stagger-1">
            <mat-card-content>
              <div class="stat-top">
                <span class="icon-badge resolved"><mat-icon>check_circle</mat-icon></span>
                <span class="stat-trend good"><mat-icon>verified</mat-icon> done</span>
              </div>
              <div class="stat-value gradient-violet">{{ s().resolvedIncidents }}</div>
              <div class="stat-label">Resolved</div>
              <div class="stat-foot">Ready to close</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card closed stagger-2">
            <mat-card-content>
              <div class="stat-top">
                <span class="icon-badge closed"><mat-icon>task_alt</mat-icon></span>
                <span class="stat-trend neutral"><mat-icon>archive</mat-icon> archived</span>
              </div>
              <div class="stat-value">{{ s().closedIncidents }}</div>
              <div class="stat-label">Closed</div>
              <div class="stat-foot">Completed lifecycle</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card teams stagger-3">
            <mat-card-content>
              <div class="stat-top">
                <span class="icon-badge teams"><mat-icon>groups</mat-icon></span>
                <span class="stat-trend neutral"><mat-icon>hub</mat-icon> org</span>
              </div>
              <div class="stat-value">{{ s().totalTeams }}</div>
              <div class="stat-label">Teams</div>
              <div class="stat-foot">Active squads</div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="priority-alert">
          <div class="alert-head">
            <h3><mat-icon>priority_high</mat-icon> Attention Required</h3>
            <span class="alert-sub">Focus on what needs action first</span>
          </div>
          @if (s().criticalCount > 0) {
            <div class="alert-item critical">
              <span class="dot"></span>
              <mat-icon>error</mat-icon>
              <span>{{ s().criticalCount }} critical incidents</span>
              <a routerLink="/incidents" class="alert-link">View →</a>
            </div>
          }
          @if (s().highCount > 0) {
            <div class="alert-item high">
              <span class="dot amber"></span>
              <mat-icon>warning</mat-icon>
              <span>{{ s().highCount }} high priority incidents</span>
              <a routerLink="/incidents" class="alert-link">View →</a>
            </div>
          }
          @if (s().criticalCount === 0 && s().highCount === 0) {
            <div class="alert-item success">
              <span class="dot green"></span>
              <mat-icon>check_circle</mat-icon>
              <span>No critical or high priority incidents — all clear</span>
            </div>
          }
        </div>

        <!-- KPI Deep Dive -->
        <div class="kpi-section">
          <div class="kpi-header">
            <h2><span class="kpi-icon"><mat-icon>insights</mat-icon></span> KPI Deep Dive</h2>
            <span class="kpi-subtitle">Extended metrics from the platform — MTBF, lead time, SLA and throughput</span>
          </div>

          <div class="kpi-grid">
            <!-- Open by Severity bar -->
            <mat-card class="kpi-card severity-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>bar_chart</mat-icon> Open by Severity
                </mat-card-title>
                <mat-card-subtitle>Open + In Progress grouped by priority</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (!openBySeverity().length) {
                  <div class="kpi-empty">
                    <div class="empty-illustration">
                      <mat-icon>inbox</mat-icon>
                    </div>
                    <p>No open incidents</p>
                    <small>All clear — enjoy the quiet.</small>
                  </div>
                } @else {
                  <div class="severity-bars">
                    @for (item of openBySeverity(); track item.severity) {
                      <div class="severity-row">
                        <span class="severity-label" [class]="'sev-' + item.severity.toLowerCase()">{{ item.severity }}</span>
                        <div class="bar-track">
                          <div class="bar-fill" [class]="'fill-' + item.severity.toLowerCase()" [style.width.%]="severityPct(item.count)"></div>
                        </div>
                        <span class="severity-count">{{ item.count }}</span>
                      </div>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>

            <!-- KPI Tiles -->
            <div class="kpi-tiles">
              <mat-card class="kpi-tile">
                <div class="tile-icon mtbf"><mat-icon>schedule</mat-icon></div>
                <div class="tile-value">{{ mtbfHours().toFixed(1) }}<small>h</small></div>
                <div class="tile-label">MTBF</div>
                <div class="tile-hint">Mean time between failures</div>
              </mat-card>

              <mat-card class="kpi-tile">
                <div class="tile-icon lead"><mat-icon>timer</mat-icon></div>
                <div class="tile-value">{{ leadTime().toFixed(1) }}<small>d</small></div>
                <div class="tile-label">Lead time avg</div>
                <div class="tile-hint">Open → Resolved</div>
              </mat-card>

              <mat-card class="kpi-tile" [class.warn]="slaAtRisk() > 0">
                <div class="tile-icon sla" [class.warn-icon]="slaAtRisk() > 0"><mat-icon>warning</mat-icon></div>
                <div class="tile-value">{{ slaAtRisk() }}</div>
                <div class="tile-label">SLA at risk</div>
                <div class="tile-hint">
                  @if (slaAtRisk() > 0) {
                    <span class="warn-chip">Action needed</span>
                  } @else {
                    All within SLA
                  }
                </div>
              </mat-card>
            </div>

            <!-- Throughput last 7 days -->
            <mat-card class="kpi-card throughput-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>show_chart</mat-icon> Throughput — Last 7 Days
                </mat-card-title>
                <mat-card-subtitle>Incidents created per day</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (!throughput().length) {
                  <div class="kpi-empty">
                    <div class="empty-illustration small"><mat-icon>show_chart</mat-icon></div>
                    <p>No throughput data</p>
                    <small>Incidents per day will appear here.</small>
                  </div>
                } @else {
                  <div class="throughput-chart">
                    @for (pt of throughput(); track pt.date) {
                      <div class="throughput-bar-col">
                        <div class="bar-wrapper">
                          <div class="throughput-bar" [style.height.%]="throughputPct(pt.count)" [matTooltip]="pt.date + ': ' + pt.count"></div>
                        </div>
                        <div class="bar-count">{{ pt.count }}</div>
                        <div class="bar-date">{{ formatDateShort(pt.date) }}</div>
                      </div>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
      h1 { margin: 0; font-family: var(--font-display); font-size: 32px; font-weight: 700; letter-spacing: -0.025em; color: #0f172a; line-height: 1.1; }
      .page-subtitle { margin: 6px 0 0; color: #64748b; font-size: 14px; line-height: 1.5; letter-spacing: 0; }
    }
    .new-incident-btn {
      white-space: nowrap;
      height: 44px;
      padding: 0 18px !important;
      border-radius: 12px !important;
      font-weight: 600 !important;
      letter-spacing: -0.01em;
      box-shadow: 0 4px 14px rgba(26,35,126,0.22) !important;
      transition: transform 0.14s ease, box-shadow 0.2s ease, filter 0.2s ease;
      mat-icon { margin-right: 6px; font-size: 18px; width: 18px; height: 18px; }
      &:hover { transform: translateY(-1px); filter: brightness(1.04); box-shadow: 0 8px 22px rgba(26,35,126,0.28) !important; }
      &:active { transform: scale(0.98); }
    }
    .btn-text { display: inline; }
    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: stretch; }
    }
    @media (max-width: 480px) { .page-header h1 { font-size: 26px; } }
    @media (max-width: 390px) { .page-header h1 { font-size: 24px; } }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(184px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .stat-card {
      border-radius: 20px !important;
      padding: 20px 18px !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 4px 24px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.05) !important;
      background: white !important;
      overflow: hidden;
      position: relative;
      animation: subtleIn 0.45s cubic-bezier(0.2,0.8,0.2,1) both;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      &::after {
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
        box-shadow: 0 12px 32px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.06) !important;
        border-color: rgba(92,77,219,0.12) !important;
        &::after { opacity: 1; }
      }
      &:active { transform: scale(0.99); }
      mat-card-content { padding: 0 !important; display: flex; flex-direction: column; gap: 0; }
    }
    @keyframes subtleIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .stat-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .icon-badge {
      width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0;
      border: 1px solid rgba(15,23,42,0.06);
      box-shadow: 0 2px 8px rgba(15,23,42,0.06);
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: white; }
      &.total { background: linear-gradient(135deg, #0f172a, #334155); }
      &.open { background: linear-gradient(135deg, #1a237e, #5c4ddb); }
      &.progress { background: linear-gradient(135deg, #b45309, #f59e0b); }
      &.resolved { background: linear-gradient(135deg, #4c1d95, #7c3aed); }
      &.closed { background: linear-gradient(135deg, #334155, #64748b); }
      &.teams { background: linear-gradient(135deg, #0e7490, #06b6d4); }
    }
    .stat-trend {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
      padding: 4px 8px; border-radius: 999px; line-height: 1;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
      &.neutral { background: #f8fafc; color: #64748b; border: 1px solid rgba(15,23,42,0.06); }
      &.up { background: #eef2ff; color: #4338ca; border: 1px solid rgba(67,56,202,0.12); }
      &.warn { background: #fffbeb; color: #b45309; border: 1px solid rgba(180,83,9,0.14); }
      &.good { background: #f5f3ff; color: #6d28d9; border: 1px solid rgba(109,40,217,0.14); }
    }
    .stat-value {
      font-family: var(--font-mono);
      font-size: 34px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin-bottom: 6px; color: #0f172a;
      &.gradient-indigo { background: linear-gradient(135deg, #1a237e, #5c4ddb); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
      &.gradient-amber { background: linear-gradient(135deg, #92400e, #f59e0b); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
      &.gradient-violet { background: linear-gradient(135deg, #4c1d95, #7c3aed); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    }
    .stat-label { color: #0f172a; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.2; }
    .stat-foot { color: #94a3b8; font-size: 12px; margin-top: 2px; letter-spacing: 0.01em; }
    .stat-card.new { border-left: 3px solid rgba(26,35,126,0.16) !important; }
    .stat-card.in-progress { border-left: 3px solid rgba(245,158,11,0.22) !important; }
    .stat-card.resolved { border-left: 3px solid rgba(124,58,237,0.18) !important; }
    .stat-card.closed { border-left: 3px solid rgba(100,116,139,0.18) !important; }
    .stat-card.teams { border-left: 3px solid rgba(6,182,214,0.20) !important; }

    .priority-alert {
      background: white; padding: 22px 20px; border-radius: 20px; margin-bottom: 20px;
      border: 1px solid rgba(15,23,42,0.08);
      box-shadow: 0 4px 24px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04);
      display: flex; flex-direction: column; gap: 12px;
    }
    .alert-head {
      display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      h3 { margin: 0; font-family: var(--font-display); font-size: 16px; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; display: flex; align-items: center; gap: 8px; mat-icon { font-size: 18px; width: 18px; height: 18px; color: #f59e0b; background: #fffbeb; border-radius: 8px; padding: 4px; width: 28px; height: 28px; border: 1px solid #fde68a; } }
      .alert-sub { font-size: 12px; color: #64748b; }
    }
    .alert-item {
      display: flex; align-items: center; gap: 10px; padding: 14px 14px; border-radius: 12px; font-size: 14px; font-weight: 500; line-height: 1.3;
      border: 1px solid transparent;
      transition: transform 0.16s ease, box-shadow 0.16s ease;
      .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: #ef4444; box-shadow: 0 0 0 6px rgba(239,68,68,0.10); }
      .dot.amber { background: #f59e0b; box-shadow: 0 0 0 6px rgba(245,158,11,0.12); }
      .dot.green { background: #06b6d4; box-shadow: 0 0 0 6px rgba(6,182,214,0.12); }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      .alert-link { margin-left: auto; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; color: inherit; opacity: 0.8; text-decoration: none; &:hover { opacity: 1; text-decoration: underline; } }
      &:hover { transform: translateY(-0.5px); }
      &.critical { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
      &.high { background: #fffbeb; color: #92400e; border-color: #fde68a; }
      &.success { background: #ecfeff; color: #0e7490; border-color: #a5f3fc; }
    }

    /* KPI Deep Dive */
    .kpi-section { margin-top: 6px; }
    .kpi-header {
      display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px;
      h2 { margin: 0; font-family: var(--font-display); font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; display: flex; align-items: center; gap: 10px;
        .kpi-icon { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: linear-gradient(135deg, #1a237e, #5c4ddb); box-shadow: 0 4px 12px rgba(26,35,126,0.18); mat-icon { font-size: 18px; width: 18px; height: 18px; color: white; } }
      }
      .kpi-subtitle { font-size: 13px; color: #64748b; line-height: 1.5; }
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .kpi-card {
      padding: 18px 18px 16px !important;
      border-radius: 20px !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 4px 24px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04) !important;
      background: white !important;
      mat-card-header { margin-bottom: 14px; padding: 0; }
      mat-card-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; letter-spacing: -0.01em; display: flex; align-items: center; gap: 8px; color: #0f172a; mat-icon { font-size: 18px; width: 18px; height: 18px; color: #5c4ddb; } }
      mat-card-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
      mat-card-content { padding: 0 !important; }
    }
    .kpi-empty { padding: 28px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px;
      .empty-illustration { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; background: #f8fafc; border: 1px solid rgba(15,23,42,0.06); mat-icon { font-size: 28px; width: 28px; height: 28px; color: #cbd5e1; } &.small { width: 44px; height: 44px; border-radius: 12px; mat-icon { font-size: 20px; width: 20px; height: 20px; } } }
      p { margin: 0; font-weight: 600; color: #334155; font-size: 14px; }
      small { color: #94a3b8; font-size: 12px; }
    }

    /* severity bars */
    .severity-bars { display: flex; flex-direction: column; gap: 14px; }
    .severity-row { display: grid; grid-template-columns: 88px 1fr 32px; align-items: center; gap: 12px; }
    .severity-label {
      font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 6px 8px; border-radius: 999px; text-align: center; border: 1px solid transparent; line-height: 1;
      &.sev-critical { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
      &.sev-high { background: #fffbeb; color: #92400e; border-color: #fde68a; }
      &.sev-medium { background: #fffbeb; color: #b45309; border-color: #fde68a; }
      &.sev-low { background: #ecfeff; color: #0e7490; border-color: #a5f3fc; }
    }
    .bar-track { height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; border: 1px solid rgba(15,23,42,0.04); position: relative; }
    .bar-fill { height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(0.2,0.8,0.2,1); position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.06); }
    .bar-fill.fill-critical { background: linear-gradient(90deg, #ef4444, #991b1b); box-shadow: 0 0 12px rgba(239,68,68,0.28); }
    .bar-fill.fill-high { background: linear-gradient(90deg, #f59e0b, #d97706); box-shadow: 0 0 12px rgba(245,158,11,0.22); }
    .bar-fill.fill-medium { background: linear-gradient(90deg, #fde68a, #f59e0b); }
    .bar-fill.fill-low { background: linear-gradient(90deg, #22d3ee, #0e7490); box-shadow: 0 0 10px rgba(6,182,214,0.18); }
    .severity-count { font-family: var(--font-mono); font-size: 13px; font-weight: 700; text-align: right; color: #0f172a; }

    /* KPI tiles column */
    .kpi-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 960px) { .kpi-tiles { grid-template-columns: 1fr; } }
    .kpi-tile {
      display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px 16px !important; flex: 1;
      border-radius: 20px !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 4px 24px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04) !important;
      background: white !important;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      animation: subtleIn 0.45s ease both;
      &:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(15,23,42,0.08) !important; border-color: rgba(92,77,219,0.14) !important; }
      &.warn { border-left: 3px solid #f59e0b !important; }
    }
    .tile-icon {
      width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.6);
      box-shadow: 0 4px 14px rgba(15,23,42,0.08); margin-bottom: 14px;
      mat-icon { font-size: 22px; width: 22px; height: 22px; color: white; }
      &.mtbf { background: linear-gradient(135deg, #1a237e, #5c4ddb); }
      &.lead { background: linear-gradient(135deg, #0e7490, #06b6d4); }
      &.sla { background: #f1f5f9; border-color: rgba(15,23,42,0.06); mat-icon { color: #64748b; } }
      &.warn-icon { background: linear-gradient(135deg, #f59e0b, #d97706); mat-icon { color: white; } }
    }
    .tile-value { font-family: var(--font-mono); font-size: 26px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; display: flex; align-items: baseline; justify-content: center; gap: 3px; color: #0f172a; margin-bottom: 4px; small { font-size: 13px; font-weight: 600; color: #64748b; letter-spacing: -0.02em; } }
    .tile-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; margin-bottom: 4px; }
    .tile-hint { font-size: 12px; color: #94a3b8; line-height: 1.4; }
    .warn-chip { background: #fffbeb; color: #92400e; padding: 3px 8px; border-radius: 999px; font-weight: 700; font-size: 11px; border: 1px solid #fde68a; }

    /* Throughput */
    .throughput-card { grid-column: 1 / -1; }
    .throughput-chart {
      display: flex; align-items: end; gap: 10px; height: 148px; padding-top: 12px;
    }
    .throughput-bar-col {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0;
    }
    .bar-wrapper {
      flex: 1; width: 100%; max-width: 52px; background: #f1f5f9; border-radius: 12px 12px 8px 8px; display: flex; align-items: end; overflow: hidden; height: 100px; border: 1px solid rgba(15,23,42,0.04); position: relative;
      &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.35), transparent 40%); pointer-events: none; }
    }
    .throughput-bar {
      width: 100%; background: linear-gradient(180deg, #818cf8 0%, #5c4ddb 55%, #1a237e 100%); border-radius: 12px 12px 8px 8px; min-height: 4px; transition: height 0.9s cubic-bezier(0.2,0.8,0.2,1), filter 0.2s ease, transform 0.2s ease;
      box-shadow: 0 -2px 10px rgba(92,77,219,0.18);
      &:hover { filter: brightness(1.06); transform: scaleX(1.03); }
    }
    .bar-count { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: #0f172a; }
    .bar-date { font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.2; word-break: break-all; font-weight: 500; letter-spacing: 0.02em; }

    @media (max-width: 600px) {
      .throughput-chart { gap: 6px; height: 122px; }
      .bar-wrapper { height: 84px; max-width: 44px; border-radius: 10px 10px 6px 6px; }
      .stats-grid { gap: 12px; }
      .priority-alert { padding: 16px; border-radius: 16px; }
      .kpi-card { border-radius: 16px !important; }
    }
    @media (max-width: 390px) {
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .stat-value { font-size: 28px; }
      .stat-top { margin-bottom: 10px; }
      .icon-badge { width: 40px; height: 40px; border-radius: 12px; }
      .kpi-header h2 { font-size: 18px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats>({
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
  loading = signal(true);

  // expose auth for template RBAC
  constructor(private dashboardService: DashboardService, public auth: AuthService) {}

  s = computed(() => this.stats());

  openBySeverity = computed(() => {
    const s = this.s();
    const raw = s.openBySeverity ?? (s as any).OpenBySeverity ?? s.OpenBySeverity ?? [];
    // ensure consistent shape: severity,count / Severity,Count
    return (raw as any[]).map((r: any) => ({
      severity: r.severity ?? r.Severity ?? r.severity ?? '',
      count: r.count ?? r.Count ?? 0
    })) as { severity: string; count: number }[];
  });

  mtbfHours = computed(() => {
    const s = this.s() as any;
    return s.mtbfHours ?? s.MtbfHours ?? 0;
  });
  leadTime = computed(() => {
    const s = this.s() as any;
    return s.leadTimeAvgDays ?? s.LeadTimeAvgDays ?? 0;
  });
  slaAtRisk = computed(() => {
    const s = this.s() as any;
    return s.slaAtRisk ?? s.SlaAtRisk ?? 0;
  });
  throughput = computed(() => {
    const s = this.s() as any;
    const raw = s.throughputLast7Days ?? s.ThroughputLast7Days ?? [];
    return (raw as any[]).map((r: any) => ({
      date: r.date ?? r.Date ?? '',
      count: r.count ?? r.Count ?? 0
    })) as { date: string; count: number }[];
  });

  ngOnInit() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        // normalize keys to lowerCamel for ease (keep original too)
        this.stats.set(data as DashboardStats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  severityPct(count: number): number {
    const max = Math.max(1, ...this.openBySeverity().map(o => o.count));
    return Math.round((count / max) * 100);
  }

  throughputPct(count: number): number {
    const max = Math.max(1, ...this.throughput().map(t => t.count));
    return Math.round((count / max) * 100);
  }

  formatDateShort(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch { return dateStr.slice(0, 10); }
  }
}
