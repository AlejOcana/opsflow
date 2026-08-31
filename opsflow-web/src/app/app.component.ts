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
      <!-- Not authenticated: no outer toolbar — login page owns its full layout -->
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      font-family: var(--font-sans);
    }

    .sidenav-container {
      height: 100%;
    }

    .sidenav {
      width: 264px;
      background: #ffffff;
      border-right: 1px solid rgba(15, 23, 42, 0.07);
      display: flex;
      flex-direction: column;
      transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.32s ease;
      box-shadow: 1px 0 16px rgba(15, 23, 42, 0.04);
    }

    .sidenav.mobile {
      width: 288px;
      box-shadow: 16px 0 40px rgba(15, 23, 42, 0.14);
    }

    .sidenav-header {
      padding: 18px 18px 16px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.07);
      background: linear-gradient(180deg, rgba(248, 250, 252, 0.9) 0%, rgba(255,255,255,1) 100%);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: transform 0.16s ease, opacity 0.2s ease;
      user-select: none;
    }

    .logo:hover {
      opacity: 0.92;
      transform: translateY(-0.5px);
    }
    .logo:active { transform: scale(0.98); }

    .logo-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
      color: #1a237e;
      background: linear-gradient(135deg, #1a237e 0%, #5c4ddb 100%);
      -webkit-background-clip: text;
      background-clip: text;
      display: grid;
      place-items: center;
      filter: drop-shadow(0 1px 2px rgba(26,35,126,0.12));
    }

    .logo-text {
      font-family: var(--font-display);
      font-size: 23px;
      font-weight: 700;
      letter-spacing: -0.025em;
      background: linear-gradient(135deg, #1a237e 0%, #5c4ddb 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      transition: opacity 0.2s ease;
      line-height: 1;
    }

    .logo-text.hidden-mobile {
      display: none;
    }

    .nav-list {
      flex: 1;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;

      a {
        border-radius: 12px;
        margin: 0;
        font-family: var(--font-sans);
        font-size: 14px;
        font-weight: 500;
        letter-spacing: -0.01em;
        min-height: 44px;
        border: 1px solid transparent;
        transition: background 0.18s ease, border-color 0.18s ease, transform 0.14s ease, box-shadow 0.18s ease;

        mat-icon {
          color: #64748b;
          font-size: 20px;
          width: 20px;
          height: 20px;
          transition: color 0.18s ease, transform 0.18s ease;
        }

        &:hover {
          background: #f8fafc;
          border-color: rgba(15, 23, 42, 0.06);
          transform: translateY(-0.5px);
          mat-icon { color: #334155; }
        }
        &:active { transform: scale(0.98); }

        &.active {
          background: linear-gradient(135deg, rgba(26,35,126,0.08) 0%, rgba(92,77,219,0.10) 100%);
          border-color: rgba(92, 77, 219, 0.14);
          box-shadow: 0 1px 8px rgba(92,77,219,0.08), inset 0 1px 0 rgba(255,255,255,0.7);
          position: relative;

          &::before {
            content: '';
            position: absolute;
            left: -10px;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 20px;
            border-radius: 999px;
            background: linear-gradient(180deg, #1a237e, #5c4ddb);
          }

          mat-icon {
            color: #1a237e;
          }

          span {
            color: #1a237e;
            font-weight: 600;
          }
        }
      }
    }

    .sidenav-footer {
      padding: 14px 16px;
      border-top: 1px solid rgba(15, 23, 42, 0.07);
      background: #f8fafc;
    }

    .version {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #94a3b8;
      text-align: center;
    }

    .main-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      background: #f8f9fc;
      background-image:
        radial-gradient(1200px 600px at 12% -8%, rgba(92,77,219,0.06) 0%, transparent 60%),
        radial-gradient(800px 400px at 88% 0%, rgba(6,182,214,0.05) 0%, transparent 60%);
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 60px;
      padding: 0 20px;
      background: rgba(255, 255, 255, 0.82) !important;
      backdrop-filter: blur(18px) saturate(1.25);
      -webkit-backdrop-filter: blur(18px) saturate(1.25);
      border-bottom: 1px solid rgba(15, 23, 42, 0.07);
      box-shadow: 0 1px 12px rgba(15, 23, 42, 0.06) !important;
      color: var(--text-primary) !important;

      .toolbar-title {
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin-left: 6px;
        color: #0f172a;
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
      padding: 28px;
      overflow-y: auto;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;

      .user-avatar {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #64748b;
        background: #f1f5f9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .user-details {
        display: flex;
        flex-direction: column;

        strong {
          font-size: 14px;
          font-family: var(--font-sans);
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #0f172a;
        }

        small {
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
        }
      }
    }

    /* Notifications menu */
    ::ng-deep .notif-menu-panel {
      max-width: 380px !important;
      width: 380px !important;
    }
    ::ng-deep .notif-menu-panel .mat-mdc-menu-content {
      padding: 0 !important;
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      gap: 12px;
      background: #f8fafc;
      border-bottom: 1px solid rgba(15,23,42,0.06);
    }
    .notif-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 13px;
      letter-spacing: -0.01em;
      color: #0f172a;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #5c4ddb; }
    }
    .unread-chip {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .notif-list {
      max-height: 360px;
      overflow-y: auto;
    }
    .notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 36px 16px;
      color: #64748b;
      mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 10px; color: #cbd5e1; }
      p { margin: 0; font-size: 13px; font-weight: 500; }
    }
    .notif-item {
      height: auto !important;
      line-height: normal !important;
      padding: 12px 16px !important;
      white-space: normal !important;
      border-bottom: 1px solid rgba(15,23,42,0.04);
      transition: background 0.16s ease;
      &.unread { background: #eef2ff !important; border-left: 3px solid #5c4ddb; }
      &:hover { background: #f8fafc !important; }
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
      background: #5c4ddb;
      margin-top: 6px;
      flex-shrink: 0;
      box-shadow: 0 0 0 4px rgba(92,77,219,0.12);
      &.read { background: #cbd5e1; box-shadow: none; }
    }
    .notif-content { flex: 1; min-width: 0; }
    .notif-item-title { font-weight: 600; font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
    .notif-item-msg { font-size: 12px; color: #64748b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 3px; line-height: 1.5; }
    .notif-item-time { font-size: 11px; color: #94a3b8; margin-top: 5px; font-family: var(--font-mono); }
    .notif-footer {
      padding: 10px 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
      background: #f8fafc;
      border-top: 1px solid rgba(15,23,42,0.06);
      letter-spacing: 0.02em;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 16px;
      }

      .nav-list {
        padding: 10px;
      }
      .toolbar { padding: 0 12px; height: 56px; }
    }

    @media (max-width: 390px) {
      .main-content {
        padding: 12px;
      }
      .toolbar { padding: 0 10px; }
      .logo-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
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
