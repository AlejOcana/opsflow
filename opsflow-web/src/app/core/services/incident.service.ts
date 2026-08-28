import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TimelineEntryDto {
  type: 'comment' | 'audit' | 'status' | 'attachment' | string;
  at: string;
  actor: string;
  content: string;
  metadata?: Record<string, any> | null;
  // backend may send PascalCase
  Type?: string;
  At?: string;
  Actor?: string;
  Content?: string;
  Metadata?: Record<string, any> | null;
}

export interface AttachmentDto {
  id: number;
  incidentId: number;
  fileName: string;
  contentType: string;
  url: string;
  uploadedById: number;
  uploadedByName: string;
  uploadedAt: string;
  sizeBytes: number;
  // backend PascalCase variants
  Id?: number;
  IncidentId?: number;
  FileName?: string;
  ContentType?: string;
  Url?: string;
  UploadedById?: number;
  UploadedByName?: string;
  UploadedAt?: string;
  SizeBytes?: number;
}

export interface CreateAttachmentRequest {
  fileName: string;
  url: string;
  contentType?: string;
  sizeBytes?: number;
  // also support PascalCase for API
  FileName?: string;
  Url?: string;
  ContentType?: string;
  SizeBytes?: number;
}

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
  private readonly API_URL = environment.apiUrl;

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

  // Phase 2: Timeline
  getTimeline(incidentId: string): Observable<TimelineEntryDto[]> {
    return this.http.get<TimelineEntryDto[]>(`${this.API_URL}/incidents/${incidentId}/timeline`, {
      headers: this.getHeaders()
    });
  }

  // Phase 2: Attachments
  getAttachments(incidentId: string): Observable<AttachmentDto[]> {
    return this.http.get<AttachmentDto[]>(`${this.API_URL}/incidents/${incidentId}/attachments`, {
      headers: this.getHeaders()
    });
  }

  createAttachment(incidentId: string, data: CreateAttachmentRequest): Observable<AttachmentDto> {
    // API expects PascalCase but also handles camelCase via JSON; send PascalCase for safety
    const payload: any = {
      FileName: data.fileName ?? (data as any).FileName,
      Url: data.url ?? (data as any).Url,
      ContentType: data.contentType ?? (data as any).ContentType ?? null,
      SizeBytes: data.sizeBytes ?? (data as any).SizeBytes ?? null
    };
    return this.http.post<AttachmentDto>(`${this.API_URL}/incidents/${incidentId}/attachments`, payload, {
      headers: this.getHeaders()
    });
  }

  deleteAttachment(incidentId: string, attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/incidents/${incidentId}/attachments/${attachmentId}`, {
      headers: this.getHeaders()
    });
  }

  assignIncident(incidentId: string, assigneeId: number | string): Observable<IncidentDetail> {
    const payload = { assigneeId: typeof assigneeId === 'string' ? parseInt(assigneeId as string, 10) : assigneeId };
    return this.http.patch<IncidentDetail>(`${this.API_URL}/incidents/${incidentId}/assign`, payload, {
      headers: this.getHeaders()
    });
  }

  updateStatus(incidentId: string, status: string): Observable<IncidentDetail> {
    return this.http.patch<IncidentDetail>(`${this.API_URL}/incidents/${incidentId}/status`, { status }, {
      headers: this.getHeaders()
    });
  }
}