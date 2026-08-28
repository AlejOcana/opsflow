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
        <h1>Dashboard</h1>
        @if (auth.canCreate()) {
          <button mat-raised-button color="primary" routerLink="/incidents/new" class="new-incident-btn">
            <mat-icon>add</mat-icon>
            <span class="btn-text">New Incident</span>
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Loading dashboard...</span>
        </div>
      } @else {
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="stat-icon">bug_report</mat-icon>
              <div class="stat-value">{{ s().totalIncidents }}</div>
              <div class="stat-label">Total Incidents</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card new">
            <mat-card-content>
              <mat-icon class="stat-icon">fiber_new</mat-icon>
              <div class="stat-value">{{ s().openIncidents }}</div>
              <div class="stat-label">Open</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card in-progress">
            <mat-card-content>
              <mat-icon class="stat-icon">engineering</mat-icon>
              <div class="stat-value">{{ s().inProgressIncidents }}</div>
              <div class="stat-label">In Progress</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card resolved">
            <mat-card-content>
              <mat-icon class="stat-icon">check_circle</mat-icon>
              <div class="stat-value">{{ s().resolvedIncidents }}</div>
              <div class="stat-label">Resolved</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card closed">
            <mat-card-content>
              <mat-icon class="stat-icon">task_alt</mat-icon>
              <div class="stat-value">{{ s().closedIncidents }}</div>
              <div class="stat-label">Closed</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card teams">
            <mat-card-content>
              <mat-icon class="stat-icon">groups</mat-icon>
              <div class="stat-value">{{ s().totalTeams }}</div>
              <div class="stat-label">Teams</div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="priority-alert">
          <h3>Attention Required</h3>
          @if (s().criticalCount > 0) {
            <div class="alert-item critical">
              <mat-icon>error</mat-icon>
              <span>{{ s().criticalCount }} critical incidents</span>
            </div>
          }
          @if (s().highCount > 0) {
            <div class="alert-item high">
              <mat-icon>warning</mat-icon>
              <span>{{ s().highCount }} high priority incidents</span>
            </div>
          }
          @if (s().criticalCount === 0 && s().highCount === 0) {
            <div class="alert-item success">
              <mat-icon>check_circle</mat-icon>
              <span>No critical or high priority incidents</span>
            </div>
          }
        </div>

        <!-- KPI Deep Dive -->
        <div class="kpi-section">
          <div class="kpi-header">
            <h2><mat-icon>insights</mat-icon> KPI Deep Dive</h2>
            <span class="kpi-subtitle">Extended metrics from the API — MTBF, lead time, SLA and throughput</span>
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
                  <div class="kpi-empty">No open incidents</div>
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
                <div class="tile-body">
                  <div class="tile-value">{{ mtbfHours().toFixed(1) }}<small>h</small></div>
                  <div class="tile-label">MTBF</div>
                  <div class="tile-hint">Mean time between failures</div>
                </div>
              </mat-card>

              <mat-card class="kpi-tile">
                <div class="tile-icon lead"><mat-icon>timer</mat-icon></div>
                <div class="tile-body">
                  <div class="tile-value">{{ leadTime().toFixed(1) }}<small>d</small></div>
                  <div class="tile-label">Lead time avg</div>
                  <div class="tile-hint">Open → Resolved</div>
                </div>
              </mat-card>

              <mat-card class="kpi-tile" [class.warn]="slaAtRisk() > 0">
                <div class="tile-icon sla" [class.warn-icon]="slaAtRisk() > 0"><mat-icon>warning</mat-icon></div>
                <div class="tile-body">
                  <div class="tile-value">{{ slaAtRisk() }}</div>
                  <div class="tile-label">SLA at risk</div>
                  <div class="tile-hint">
                    @if (slaAtRisk() > 0) {
                      <span class="warn-chip">Action needed</span>
                    } @else {
                      All within SLA
                    }
                  </div>
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
                  <div class="kpi-empty">No throughput data</div>
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
      align-items: center;
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 28px; font-weight: 500; color: rgba(0, 0, 0, 0.87); }
    }
    .new-incident-btn mat-icon { margin-right: 4px; }
    .btn-text { display: inline; }
    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: stretch; gap: 16px; }
      .new-incident-btn .btn-text { display: none; }
    }
    @media (max-width: 480px) { .page-header h1 { font-size: 24px; } }

    .loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px; color: rgba(0,0,0,0.6); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card { text-align: center; padding: 24px 16px; mat-icon.stat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 12px; } }
    .stat-card.new { border-left: 4px solid #1976d2; }
    .stat-card.in-progress { border-left: 4px solid #f57c00; }
    .stat-card.resolved { border-left: 4px solid #388e3c; }
    .stat-card.closed { border-left: 4px solid #546e7a; }
    .stat-card.teams { border-left: 4px solid #7b1fa2; }
    .stat-value { font-size: 36px; font-weight: 500; margin-bottom: 4px; }
    .stat-label { color: rgba(0,0,0,0.6); font-size: 14px; }
    .priority-alert {
      background: white; padding: 24px; border-radius: 8px; margin-bottom: 24px;
      h3 { margin: 0 0 16px; }
    }
    .alert-item {
      display: flex; align-items: center; gap: 8px; padding: 12px; margin-bottom: 8px; border-radius: 4px;
      &.critical { background: #ffebee; color: #c62828; }
      &.high { background: #fff3e0; color: #ef6c00; }
      &.success { background: #e8f5e9; color: #2e7d32; }
    }

    /* KPI Deep Dive */
    .kpi-section { margin-top: 8px; }
    .kpi-header {
      display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px;
      h2 { margin: 0; font-size: 20px; font-weight: 600; color: rgba(0,0,0,0.87); display: flex; align-items: center; gap: 8px; mat-icon { color: #1976d2; } }
      .kpi-subtitle { font-size: 13px; color: rgba(0,0,0,0.55); }
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: 1.4fr 0.9fr;
      gap: 16px;
    }
    @media (max-width: 960px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
    .kpi-card {
      padding: 16px;
      mat-card-header { margin-bottom: 12px; }
      mat-card-title { font-size: 15px; display: flex; align-items: center; gap: 8px; mat-icon { font-size: 18px; width: 18px; height: 18px; color: #1976d2; } }
      mat-card-subtitle { font-size: 12px; color: rgba(0,0,0,0.55); }
    }
    .kpi-empty { padding: 24px; text-align: center; color: rgba(0,0,0,0.5); font-size: 13px; }

    /* severity bars */
    .severity-bars { display: flex; flex-direction: column; gap: 12px; }
    .severity-row { display: grid; grid-template-columns: 80px 1fr 32px; align-items: center; gap: 10px; }
    .severity-label {
      font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; padding: 4px 8px; border-radius: 6px; text-align: center;
      &.sev-critical { background: #ffebee; color: #c62828; }
      &.sev-high { background: #fff3e0; color: #ef6c00; }
      &.sev-medium { background: #fffde7; color: #f9a825; }
      &.sev-low { background: #e3f2fd; color: #1976d2; }
    }
    .bar-track { height: 10px; background: #f0f0f0; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
    .bar-fill.fill-critical { background: linear-gradient(90deg, #ef5350, #c62828); }
    .bar-fill.fill-high { background: linear-gradient(90deg, #ff9800, #ef6c00); }
    .bar-fill.fill-medium { background: linear-gradient(90deg, #ffca28, #f9a825); }
    .bar-fill.fill-low { background: linear-gradient(90deg, #64b5f6, #1976d2); }
    .severity-count { font-size: 13px; font-weight: 600; text-align: right; }

    /* KPI tiles column */
    .kpi-tiles { display: flex; flex-direction: column; gap: 16px; }
    .kpi-tile {
      display: flex; align-items: center; gap: 16px; padding: 18px; flex: 1;
      &.warn { border-left: 4px solid #ef6c00; }
    }
    .tile-icon {
      width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 22px; width: 22px; height: 22px; color: white; }
      &.mtbf { background: linear-gradient(135deg, #42a5f5, #1976d2); }
      &.lead { background: linear-gradient(135deg, #66bb6a, #388e3c); }
      &.sla { background: #eceff1; mat-icon { color: #607d8b; } }
      &.warn-icon { background: linear-gradient(135deg, #ffa726, #ef6c00); mat-icon { color: white; } }
    }
    .tile-body { display: flex; flex-direction: column; }
    .tile-value { font-size: 24px; font-weight: 700; line-height: 1; display: flex; align-items: baseline; gap: 2px; small { font-size: 13px; font-weight: 500; color: rgba(0,0,0,0.55); } }
    .tile-label { font-size: 12px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; color: rgba(0,0,0,0.65); margin-top: 2px; }
    .tile-hint { font-size: 12px; color: rgba(0,0,0,0.5); margin-top: 2px; }
    .warn-chip { background: #fff3e0; color: #ef6c00; padding: 2px 8px; border-radius: 10px; font-weight: 700; font-size: 11px; }

    /* Throughput */
    .throughput-card { grid-column: 1 / -1; }
    .throughput-chart {
      display: flex; align-items: end; gap: 8px; height: 140px; padding-top: 12px;
    }
    .throughput-bar-col {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0;
    }
    .bar-wrapper {
      flex: 1; width: 100%; max-width: 48px; background: #f5f5f5; border-radius: 6px 6px 0 0; display: flex; align-items: end; overflow: hidden; height: 100px;
    }
    .throughput-bar {
      width: 100%; background: linear-gradient(180deg, #42a5f5, #1976d2); border-radius: 6px 6px 0 0; min-height: 4px; transition: height 0.6s ease;
    }
    .bar-count { font-size: 12px; font-weight: 700; color: rgba(0,0,0,0.75); }
    .bar-date { font-size: 10px; color: rgba(0,0,0,0.55); text-align: center; line-height: 1.2; word-break: break-all; }

    @media (max-width: 600px) {
      .throughput-chart { gap: 6px; height: 120px; }
      .bar-wrapper { height: 80px; }
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
