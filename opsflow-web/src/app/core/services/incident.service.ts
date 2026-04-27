import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface IncidentList {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
  createdAt: string;
  commentCount: number;
}

export interface IncidentDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  organizationId: string;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
  team: { id: string; name: string; memberCount: number } | null;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  commentCount: number;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  priority: string;
  assignedToUserId?: string;
  teamId?: string;
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedToUserId?: string;
  teamId?: string;
}

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private readonly API_URL = '/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getIncidents(params?: { status?: string; search?: string }): Observable<IncidentList[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<IncidentList[]>(`${this.API_URL}/incidents`, {
      params: httpParams,
      headers: this.getHeaders()
    });
  }

  getIncident(id: string): Observable<IncidentDetail> {
    return this.http.get<IncidentDetail>(`${this.API_URL}/incidents/${id}`, {
      headers: this.getHeaders()
    });
  }

  createIncident(data: CreateIncidentRequest): Observable<IncidentDetail> {
    return this.http.post<IncidentDetail>(`${this.API_URL}/incidents`, data, {
      headers: this.getHeaders()
    });
  }

  updateIncident(id: string, data: UpdateIncidentRequest): Observable<IncidentDetail> {
    return this.http.put<IncidentDetail>(`${this.API_URL}/incidents/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteIncident(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/incidents/${id}`, {
      headers: this.getHeaders()
    });
  }

  getComments(incidentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/incidents/${incidentId}/comments`, {
      headers: this.getHeaders()
    });
  }

  addComment(incidentId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/incidents/${incidentId}/comments`, { content }, {
      headers: this.getHeaders()
    });
  }
}