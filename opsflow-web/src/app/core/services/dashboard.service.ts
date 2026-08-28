import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OpenBySeverity {
  severity: string;
  count: number;
}

export interface ThroughputPoint {
  date: string;
  count: number;
}

export interface DashboardStats {
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
  // Phase 2 additive KPIs (optional for backward compat)
  openBySeverity?: OpenBySeverity[];
  mtbfHours?: number;
  leadTimeAvgDays?: number;
  slaAtRisk?: number;
  throughputLast7Days?: ThroughputPoint[];
  // backend uses PascalCase, but frontend may receive same keys - handle both via mapping if needed
  OpenBySeverity?: OpenBySeverity[];
  MtbfHours?: number;
  LeadTimeAvgDays?: number;
  SlaAtRisk?: number;
  ThroughputLast7Days?: ThroughputPoint[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/dashboard/stats`);
  }

  getTrend(days = 30): Observable<{ date: string; count: number }[]> {
    return this.http.get<{ date: string; count: number }[]>(`${this.API_URL}/dashboard/trend`, {
      params: { days: days.toString() }
    });
  }
}
