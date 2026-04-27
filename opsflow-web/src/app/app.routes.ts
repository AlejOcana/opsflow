import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'incidents', 
    loadComponent: () => import('./features/incidents/incidents.component').then(m => m.IncidentsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'incidents/new', 
    loadComponent: () => import('./features/incidents/incident-new.component').then(m => m.IncidentNewComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'incidents/:id', 
    loadComponent: () => import('./features/incidents/incident-detail.component').then(m => m.IncidentDetailComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'teams', 
    loadComponent: () => import('./features/teams/teams.component').then(m => m.TeamsComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];