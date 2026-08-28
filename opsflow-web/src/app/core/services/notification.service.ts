import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationDto {
  id: number;
  userId: number;
  incidentId?: number | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  // backend may return PascalCase
  Id?: number;
  UserId?: number;
  IncidentId?: number | null;
  Type?: string;
  Title?: string;
  Message?: string;
  IsRead?: boolean;
  CreatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API_URL = environment.apiUrl;

  notifications = signal<NotificationDto[]>([]);
  unreadCount = signal<number>(0);
  loading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  // normalize PascalCase vs camelCase from API
  normalize(n: any): NotificationDto {
    return {
      id: n.id ?? n.Id,
      userId: n.userId ?? n.UserId,
      incidentId: n.incidentId ?? n.IncidentId ?? null,
      type: n.type ?? n.Type ?? '',
      title: n.title ?? n.Title ?? '',
      message: n.message ?? n.Message ?? '',
      isRead: n.isRead ?? n.IsRead ?? false,
      createdAt: n.createdAt ?? n.CreatedAt ?? new Date().toISOString(),
    };
  }

  getNotifications(page = 1, pageSize = 20): Observable<NotificationDto[]> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<any[]>(`${this.API_URL}/notifications`, { params }).pipe(
      tap(raw => {
        const list = (raw || []).map((r: any) => this.normalize(r));
        this.notifications.set(list);
      })
    );
  }

  // fetch last 10 for menu - also updates signal
  fetchLatest(limit = 10): Observable<NotificationDto[]> {
    return this.getNotifications(1, limit);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_URL}/notifications/unread-count`).pipe(
      tap(res => this.unreadCount.set(res.count ?? 0))
    );
  }

  markRead(id: number): Observable<any> {
    return this.http.patch(`${this.API_URL}/notifications/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  markAllRead(): Observable<any> {
    return this.http.post(`${this.API_URL}/notifications/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      })
    );
  }

  refreshUnread(): void {
    this.getUnreadCount().subscribe({ error: () => {} });
  }

  refreshLatest(): void {
    this.fetchLatest(10).subscribe({ error: () => {} });
  }
}
