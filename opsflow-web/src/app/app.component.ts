import { Component, OnInit, OnDestroy, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
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
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

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
              <mat-icon matListItemIcon>bug_report</mat-icon>
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
            
            <!-- Notifications bell -->
            <button
              mat-icon-button
              [matMenuTriggerFor]="notifMenu"
              (menuOpened)="onNotifMenuOpened()"
              aria-label="Notifications"
              matTooltip="Notifications">
              <mat-icon [matBadge]="notifService.unreadCount()"
                        [matBadgeHidden]="notifService.unreadCount() === 0"
                        matBadgeColor="warn"
                        matBadgeSize="small">notifications</mat-icon>
            </button>

            <mat-menu #notifMenu="matMenu" class="notif-menu-panel" xPosition="before">
              <div class="notif-header" (click)="$event.stopPropagation()">
                <div class="notif-title">
                  <mat-icon>notifications</mat-icon>
                  Notifications
                  @if (notifService.unreadCount() > 0) {
                    <span class="unread-chip">{{ notifService.unreadCount() }} unread</span>
                  }
                </div>
                <button mat-button color="primary" (click)="markAllRead($event)" [disabled]="notifService.unreadCount() === 0">
                  Mark all read
                </button>
              </div>
              <mat-divider></mat-divider>
              <div class="notif-list" (click)="$event.stopPropagation()">
                @if (notifService.notifications().length === 0) {
                  <div class="notif-empty">
                    <mat-icon>notifications_none</mat-icon>
                    <p>No notifications</p>
                  </div>
                } @else {
                  @for (n of notifService.notifications(); track n.id) {
                    <button mat-menu-item class="notif-item" [class.unread]="!n.isRead" (click)="openNotification(n)">
                      <div class="notif-item-row">
                        <span class="notif-dot" [class.read]="n.isRead"></span>
                        <div class="notif-content">
                          <div class="notif-item-title">{{ n.title }}</div>
                          <div class="notif-item-msg">{{ n.message }}</div>
                          <div class="notif-item-time">{{ n.createdAt | date:'short' }}</div>
                        </div>
                      </div>
                    </button>
                  }
                }
              </div>
              <mat-divider></mat-divider>
              <div class="notif-footer" (click)="$event.stopPropagation()">
                <small>Polls every 30s • updates on navigation</small>
              </div>
            </mat-menu>

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

    /* Notifications menu */
    ::ng-deep .notif-menu-panel {
      max-width: 380px !important;
      width: 380px !important;
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      gap: 12px;
    }
    .notif-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #1976d2; }
    }
    .unread-chip {
      background: #ffebee;
      color: #c62828;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
    }
    .notif-list {
      max-height: 360px;
      overflow-y: auto;
    }
    .notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      color: rgba(0,0,0,0.45);
      mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 8px; color: rgba(0,0,0,0.2); }
      p { margin: 0; font-size: 13px; }
    }
    .notif-item {
      height: auto !important;
      line-height: normal !important;
      padding: 10px 16px !important;
      white-space: normal !important;
      &.unread { background: #e3f2fd !important; }
    }
    .notif-item-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      width: 100%;
    }
    .notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #1976d2;
      margin-top: 6px;
      flex-shrink: 0;
      &.read { background: #e0e0e0; }
    }
    .notif-content { flex: 1; min-width: 0; }
    .notif-item-title { font-weight: 600; font-size: 13px; color: rgba(0,0,0,0.87); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-item-msg { font-size: 12px; color: rgba(0,0,0,0.6); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 2px; line-height: 1.4; }
    .notif-item-time { font-size: 11px; color: rgba(0,0,0,0.45); margin-top: 4px; }
    .notif-footer {
      padding: 8px 16px;
      text-align: center;
      color: rgba(0,0,0,0.4);
      font-size: 11px;
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
export class AppComponent implements OnInit, OnDestroy {
  isMobile = signal(false);
  pageTitle = signal('Dashboard');

  private pollTimer: any = null;
  private routerSub: any = null;

  constructor(
    public authService: AuthService,
    public notifService: NotificationService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.breakpointObserver
        .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
        .subscribe(result => {
          this.isMobile.set(result.matches);
        });
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId) && this.authService.isAuthenticated()) {
      // initial fetch
      this.refreshNotifications();
      // poll every 30s
      this.pollTimer = setInterval(() => this.refreshNotifications(), 30000);
      // refresh on navigation
      this.routerSub = this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => this.refreshNotifications());
    }
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  private refreshNotifications() {
    if (!this.authService.isAuthenticated()) return;
    this.notifService.getUnreadCount().subscribe({ error: () => {} });
    this.notifService.fetchLatest(10).subscribe({ error: () => {} });
  }

  onNotifMenuOpened() {
    this.refreshNotifications();
  }

  markAllRead(event: Event) {
    event.stopPropagation();
    this.notifService.markAllRead().subscribe({
      next: () => {},
      error: () => {}
    });
  }

  openNotification(n: any) {
    const id = n.id ?? n.Id;
    const incidentId = n.incidentId ?? n.IncidentId;
    // mark read
    if (!n.isRead && !n.IsRead) {
      this.notifService.markRead(id).subscribe({ error: () => {} });
    }
    // navigate to incident if available
    if (incidentId) {
      this.router.navigate(['/incidents', incidentId.toString()]);
    }
  }

  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    return user ? user.fullName : '';
  }

  logout() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.authService.logout();
    window.location.href = '/login';
  }
}
