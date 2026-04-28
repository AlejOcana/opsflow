import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: number;
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Shared API base URL - use this for all API calls to ensure consistency
  static readonly API_URL = '/api';
  
  currentUser = signal<UserInfo | null>(null);
  isAuthenticated = signal(false);

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.isAuthenticated.set(true);
        this.currentUser.set(user);
      }
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${AuthService.API_URL}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          const roleMap: Record<number, string> = {
            0: 'User',
            1: 'Operator',
            2: 'Manager',
            3: 'Admin'
          };
          const user: UserInfo = {
            id: response.userId.toString(),
            email: response.email,
            fullName: response.fullName,
            role: roleMap[response.role] || 'User',
            username: response.username
          };
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): UserInfo | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }

  hasRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }
}