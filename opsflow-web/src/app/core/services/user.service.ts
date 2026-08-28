import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  members: TeamMember[];
}

export interface TeamMember {
  userId: string;
  userName: string;
  email: string;
  roleInTeam: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`);
  }

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.API_URL}/teams`);
  }

  createTeam(name: string, description?: string): Observable<Team> {
    return this.http.post<Team>(`${this.API_URL}/teams`, { name, description });
  }

  deleteTeam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/teams/${id}`);
  }
}