import { Component, OnInit, signal, computed, effect, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    @if (authService.isAuthenticated()) {
      <!-- Authenticated: Show full layout with sidenav -->
      <mat-sidenav-container class="sidenav-container">
        <!-- Mobile: Sidenav as overlay -->
        <mat-sidenav 
          #sidenav
          [mode]="isMobile() ? 'over' : 'side'" 
          [opened]="!isMobile()"
          [disableClose]="!isMobile()"
          class="sidenav"
          [class.mobile]="isMobile()">
          
          <div class="sidenav-header">
            <div class="logo" routerLink="/dashboard">
              <mat-icon class="logo-icon">bolt</mat-icon>
              <span class="logo-text" [class.hidden-mobile]="isMobile()">OpsFlow</span>
            </div>
          </div>
          
          <mat-nav-list class="nav-list">
            <a 
              mat-list-item 
              routerLink="/dashboard" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{exact: true}"
              (click)="isMobile() && sidenav.close()"
              matTooltip="Dashboard"
              [matTooltipDisabled]="!isMobile()">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            
            <a 
              mat-list-item 
              routerLink="/incidents" 
              routerLinkActive="active"
              (click)="isMobile() && sidenav.close()"
              matTooltip="Incidents"
              [matTooltipDisabled]="!isMobile()">
              <mat-icon matListItemIcon [matBadge]="unreadCount()" [matBadgeHidden]="unreadCount() === 0" matBadgeColor="warn" matBadgeSize="small">bug_report</mat-icon>
              <span matListItemTitle>Incidents</span>
            </a>
            
            <a 
              mat-list-item 
              routerLink="/teams" 
              routerLinkActive="active"
              (click)="isMobile() && sidenav.close()"
              matTooltip="Teams"
              [matTooltipDisabled]="!isMobile()">
              <mat-icon matListItemIcon>groups</mat-icon>
              <span matListItemTitle>Teams</span>
            </a>
          </mat-nav-list>
          
          <div class="sidenav-footer">
            <div class="version">v1.0.0</div>
          </div>
        </mat-sidenav>
        
        <mat-sidenav-content class="main-wrapper">
          <mat-toolbar color="primary" class="toolbar">
            @if (isMobile()) {
              <button mat-icon-button (click)="sidenav.toggle()" aria-label="Toggle menu">
                <mat-icon>menu</mat-icon>
              </button>
            }
            
            <span class="toolbar-title" [class.mobile]="isMobile()">
              {{ pageTitle() }}
            </span>
            
            <span class="spacer"></span>
            
            <button 
              mat-icon-button 
              [matMenuTriggerFor]="userMenu"
              aria-label="User menu">
              <mat-icon>account_circle</mat-icon>
            </button>
            
            <mat-menu #userMenu="matMenu" class="user-menu">
              <div class="user-info">
                <mat-icon class="user-avatar">account_circle</mat-icon>
                <div class="user-details">
                  <strong>{{ getUserDisplayName() }}</strong>
                  <small>{{ authService.currentUser()?.role }}</small>
                </div>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          </mat-toolbar>
          
          <main class="main-content">
            <router-outlet></router-outlet>
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <!-- Not authenticated: Show simplified layout without sidenav -->
      <div class="no-sidenav-container">
        <mat-toolbar color="primary" class="toolbar">
          <mat-icon class="logo-icon">bolt</mat-icon>
          <span class="toolbar-title">OpsFlow</span>
          <span class="spacer"></span>
          <button mat-icon-button routerLink="/login" aria-label="Sign in">
            <mat-icon>login</mat-icon>
          </button>
        </mat-toolbar>
        
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
    
    .sidenav-container {
      height: 100%;
    }
    
    .sidenav {
      width: 260px;
      background: #fff;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease;
    }
    
    .sidenav.mobile {
      width: 280px;
    }
    
    .sidenav-header {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }
    
    .logo:hover {
      opacity: 0.8;
    }
    
    .logo-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }
    
    .logo-text {
      font-size: 24px;
      font-weight: 600;
      color: #1976d2;
      transition: opacity 0.2s ease;
    }
    
    .logo-text.hidden-mobile {
      display: none;
    }
    
    .nav-list {
      flex: 1;
      padding: 8px;
      
      a {
        border-radius: 8px;
        margin-bottom: 4px;
        
        mat-icon {
          color: rgba(0, 0, 0, 0.7);
        }
        
        &.active {
          background: rgba(25, 118, 210, 0.1);
          
          mat-icon {
            color: #1976d2;
          }
          
          span {
            color: #1976d2;
            font-weight: 500;
          }
        }
      }
    }
    
    .sidenav-footer {
      padding: 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .version {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.4);
      text-align: center;
    }
    
    .main-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      background: #f8f9fa;
    }
    
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 56px;
      padding: 0 16px;
      
      .toolbar-title {
        font-size: 18px;
        font-weight: 400;
        margin-left: 8px;
      }
      
      .toolbar-title.mobile {
        font-size: 16px;
      }
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .toolbar button mat-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
    }
    
    mat-icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .main-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
    
    /* Non-authenticated layout */
    .no-sidenav-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f8f9fa;
      
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 100;
        height: 56px;
        padding: 0 16px;
        
        .logo-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          margin-right: 8px;
          color: #fff;
        }
        
        .toolbar-title {
          font-size: 18px;
          font-weight: 400;
        }
      }
      
      .main-content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
      }
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      
      .user-avatar {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: rgba(0, 0, 0, 0.4);
      }
      
      .user-details {
        display: flex;
        flex-direction: column;
        
        strong {
          font-size: 14px;
        }
        
        small {
          color: rgba(0, 0, 0, 0.6);
          font-size: 12px;
        }
      }
    }
    
    @media (max-width: 768px) {
      .main-content {
        padding: 16px;
      }
      
      .nav-list {
        padding: 8px;
      }
    }
    
    @media (max-width: 480px) {
      .main-content {
        padding: 12px;
      }
      
      .logo-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      
      .logo-text {
        font-size: 20px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  unreadCount = signal(0);

  // Use a signal that's updated reactively by BreakpointObserver
  isMobile = signal(false);

  pageTitle = signal('Dashboard');

  constructor(
    public authService: AuthService,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Set up reactive breakpoint observer
    if (isPlatformBrowser(this.platformId)) {
      this.breakpointObserver
        .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
        .subscribe(result => {
          this.isMobile.set(result.matches);
        });
    }
  }

  ngOnInit() {
    // Auth state is already loaded from AuthService constructor via loadStoredAuth()
    // and will update automatically via AuthService signals when login/logout happens
  }

  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}