import { Component, OnInit, OnDestroy, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
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
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav
          #sidenav
          [mode]="isMobile() ? 'over' : 'side'"
          [opened]="!isMobile()"
          [disableClose]="!isMobile()"
          class="sidenav"
          [class.mobile]="isMobile()"
          fixedInViewport
          [fixedTopGap]="0">

          <div class="sidenav-shell">
            <!-- Header: logo + notifications bell -->
            <div class="sidenav-header">
              <a class="logo" routerLink="/dashboard" (click)="isMobile() && sidenav.close()" aria-label="Go to dashboard">
                <span class="logo-mark">
                  <mat-icon>bolt</mat-icon>
                </span>
                <span class="logo-text-wrap">
                  <span class="logo-text">OpsFlow</span>
                  <span class="logo-sub">INCIDENT OPS</span>
                </span>
              </a>

              <button
                mat-icon-button
                class="notif-bell"
                [matMenuTriggerFor]="notifMenu"
                (menuOpened)="onNotifMenuOpened()"
                aria-label="Notifications"
                matTooltip="Notifications"
                [class.has-unread]="notifService.unreadCount() > 0">
                <mat-icon
                  [matBadge]="notifService.unreadCount()"
                  [matBadgeHidden]="notifService.unreadCount() === 0"
                  matBadgeColor="warn"
                  matBadgeSize="small"
                  [class.has-unread]="notifService.unreadCount() > 0">notifications</mat-icon>
              </button>
            </div>

            <div class="nav-label">Platform</div>

            <mat-nav-list class="nav-list">
              <a mat-list-item routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="isMobile() && sidenav.close()">
                <mat-icon matListItemIcon>dashboard</mat-icon><span matListItemTitle>Dashboard</span>
              </a>
              <a mat-list-item routerLink="/incidents" routerLinkActive="active" (click)="isMobile() && sidenav.close()">
                <mat-icon matListItemIcon>bug_report</mat-icon><span matListItemTitle>Incidents</span>
              </a>
              <a mat-list-item routerLink="/teams" routerLinkActive="active" (click)="isMobile() && sidenav.close()">
                <mat-icon matListItemIcon>groups</mat-icon><span matListItemTitle>Teams</span>
              </a>
            </mat-nav-list>

            <div class="sidenav-spacer"></div>

            <!-- Bottom: user card + version -->
            <div class="sidenav-bottom">
              <button class="user-card" [matMenuTriggerFor]="userMenu" aria-label="Open user menu">
                <span class="avatar-wrap">
                  <span class="avatar-initials">{{ getUserInitials() }}</span>
                  <span class="online-dot" aria-hidden="true"></span>
                </span>
                <span class="user-meta">
                  <span class="user-name">{{ getUserDisplayName() }}</span>
                  <span class="user-role">{{ authService.currentUser()?.role || 'Member' }}</span>
                </span>
                <mat-icon class="user-chevron">expand_more</mat-icon>
              </button>
              <div class="version-row"><span class="version-dot"></span><span>OpsFlow v2.4 — Operational</span></div>
            </div>
          </div>
        </mat-sidenav>

        <mat-menu #notifMenu="matMenu" class="notif-menu-panel" xPosition="after">
          <div class="notif-header" (click)="$event.stopPropagation()">
            <div class="notif-title"><mat-icon>notifications</mat-icon> Notifications @if (notifService.unreadCount() > 0) {<span class="unread-chip">{{ notifService.unreadCount() }} unread</span>}</div>
            <button mat-button color="primary" (click)="markAllRead($event)" [disabled]="notifService.unreadCount() === 0">Mark all read</button>
          </div><mat-divider></mat-divider>
          <div class="notif-list" (click)="$event.stopPropagation()">
            @if (notifService.notifications().length === 0) {
              <div class="notif-empty"><mat-icon>notifications_none</mat-icon><p>No notifications</p><small>You're all caught up</small></div>
            } @else {
              @for (n of notifService.notifications(); track n.id) {
                <button mat-menu-item class="notif-item" [class.unread]="!n.isRead" (click)="openNotification(n)">
                  <div class="notif-item-row"><span class="notif-dot" [class.read]="n.isRead"></span>
                    <div class="notif-content"><div class="notif-item-title">{{ n.title }}</div><div class="notif-item-msg">{{ n.message }}</div><div class="notif-item-time">{{ n.createdAt | date:'short' }}</div></div>
                  </div>
                </button>
              }
            }
          </div><mat-divider></mat-divider>
          <div class="notif-footer" (click)="$event.stopPropagation()"><small>Polls every 30s • updates on navigation</small></div>
        </mat-menu>

        <mat-menu #notifMenuMobile="matMenu" class="notif-menu-panel" xPosition="before">
          <div class="notif-header" (click)="$event.stopPropagation()">
            <div class="notif-title"><mat-icon>notifications</mat-icon> Notifications @if (notifService.unreadCount() > 0) {<span class="unread-chip">{{ notifService.unreadCount() }} unread</span>}</div>
            <button mat-button color="primary" (click)="markAllRead($event)" [disabled]="notifService.unreadCount() === 0">Mark all read</button>
          </div><mat-divider></mat-divider>
          <div class="notif-list" (click)="$event.stopPropagation()">
            @if (notifService.notifications().length === 0) {
              <div class="notif-empty"><mat-icon>notifications_none</mat-icon><p>No notifications</p><small>You're all caught up</small></div>
            } @else {
              @for (n of notifService.notifications(); track n.id) {
                <button mat-menu-item class="notif-item" [class.unread]="!n.isRead" (click)="openNotification(n)">
                  <div class="notif-item-row"><span class="notif-dot" [class.read]="n.isRead"></span>
                    <div class="notif-content"><div class="notif-item-title">{{ n.title }}</div><div class="notif-item-msg">{{ n.message }}</div><div class="notif-item-time">{{ n.createdAt | date:'short' }}</div></div>
                  </div>
                </button>
              }
            }
          </div><mat-divider></mat-divider>
          <div class="notif-footer" (click)="$event.stopPropagation()"><small>Polls every 30s • updates on navigation</small></div>
        </mat-menu>

        <mat-menu #userMenu="matMenu" class="user-menu-panel" xPosition="after">
          <div class="user-menu-head" (click)="$event.stopPropagation()">
            <span class="avatar-wrap lg"><span class="avatar-initials">{{ getUserInitials() }}</span></span>
            <div class="user-details"><strong>{{ getUserDisplayName() }}</strong><small class="role-pill">{{ authService.currentUser()?.role }}</small><small class="user-email">{{ authService.currentUser()?.email }}</small></div>
          </div><mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon><span>Logout</span></button>
        </mat-menu>

        <mat-sidenav-content class="main-wrapper">
          <main class="main-content"><router-outlet></router-outlet></main>
          @if (isMobile()) {
            <button mat-fab class="fab-menu" (click)="sidenav.toggle()" [attr.aria-label]="sidenav.opened ? 'Close navigation' : 'Open navigation'"><mat-icon>{{ sidenav.opened ? 'close' : 'menu' }}</mat-icon></button>
            <button mat-fab class="fab-notif" [matMenuTriggerFor]="notifMenuMobile" (menuOpened)="onNotifMenuOpened()" aria-label="Notifications">
              <mat-icon [matBadge]="notifService.unreadCount()" [matBadgeHidden]="notifService.unreadCount() === 0" matBadgeColor="warn" matBadgeSize="small" [class.has-unread]="notifService.unreadCount() > 0">notifications</mat-icon>
            </button>
          }
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else { <router-outlet></router-outlet> }
  `,
  styles: [`
    :host { display: block; height: 100vh; font-family: var(--font-sans); }
    .sidenav-container { height: 100%; }
    .sidenav { width: 264px; background: #ffffff; border-right: 1px solid rgba(15, 23, 42, 0.06); display: flex; flex-direction: column; box-shadow: 1px 0 24px rgba(15, 23, 42, 0.04); }
    .sidenav.mobile { width: 300px; box-shadow: 16px 0 48px rgba(15, 23, 42, 0.16); border-right: none; }
    .sidenav-shell { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .sidenav-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 14px 18px 16px; background: radial-gradient(420px 120px at 20% 0%, rgba(92,77,219,0.08) 0%, transparent 70%), linear-gradient(180deg, rgba(248,250,252,0.85) 0%, rgba(255,255,255,1) 100%); border-bottom: 1px solid rgba(15, 23, 42, 0.06); flex-shrink: 0; }
    .logo { display: flex; align-items: center; gap: 12px; cursor: pointer; text-decoration: none; user-select: none; transition: transform 0.16s ease, opacity 0.16s ease; min-width: 0; }
    .logo:hover { transform: translateY(-0.5px); opacity: 0.96; } .logo:active { transform: scale(0.98); } .logo:focus-visible { outline: 2px solid #5c4ddb; outline-offset: 3px; border-radius: 10px; }
    .logo-mark { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: linear-gradient(135deg, #1a237e 0%, #3949ab 45%, #5c4ddb 100%); box-shadow: 0 4px 14px rgba(26,35,126,0.22), inset 0 1px 0 rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.18); flex-shrink: 0; position: relative; overflow: hidden; }
    .logo-mark::after { content: ''; position: absolute; inset: -20px; background: radial-gradient(120px 60px at 30% 20%, rgba(255,255,255,0.18) 0%, transparent 60%); pointer-events: none; }
    .logo-mark mat-icon { color: white; font-size: 20px; width: 20px; height: 20px; line-height: 20px; }
    .logo-text-wrap { display: flex; flex-direction: column; line-height: 1; min-width: 0; }
    .logo-text { font-family: var(--font-display); font-size: 21px; font-weight: 700; letter-spacing: -0.03em; background: linear-gradient(135deg, #1a237e 0%, #5c4ddb 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .logo-sub { font-family: var(--font-sans); font-size: 10px; font-weight: 700; letter-spacing: 0.14em; color: #94a3b8; margin-top: 2px; text-transform: uppercase; }
    .notif-bell { width: 38px !important; height: 38px !important; border-radius: 12px !important; background: #f8fafc; border: 1px solid rgba(15,23,42,0.06); flex-shrink: 0; transition: background 0.16s ease, border-color 0.16s ease, transform 0.14s ease, box-shadow 0.16s ease; --mat-icon-button-state-layer-size: 38px; position: relative; display: flex !important; align-items: center !important; justify-content: center !important; padding: 0 !important; }
    .notif-bell:hover { background: #eef2ff; border-color: rgba(92,77,219,0.16); transform: translateY(-1px); box-shadow: 0 2px 10px rgba(92,77,219,0.08); }
    .notif-bell:active { transform: scale(0.96); } .notif-bell:focus-visible { outline: 2px solid #5c4ddb; outline-offset: 2px; }
    .notif-bell.has-unread { background: #eef2ff; border-color: rgba(92,77,219,0.14); animation: bellPop 0.4s ease; }
    .notif-bell mat-icon { font-size: 20px; width: 20px; height: 20px; color: #475569; transition: color 0.16s ease; }
    .notif-bell:hover mat-icon { color: #1a237e; } .notif-bell mat-icon.has-unread { color: #1a237e; }
    :host ::ng-deep .notif-bell .mat-badge-content { font-family: var(--font-sans); font-weight: 700; font-size: 10px; letter-spacing: -0.02em; animation: badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .nav-label { padding: 14px 20px 6px; font-family: var(--font-sans); font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; flex-shrink: 0; }
    .nav-list { flex: 1 1 auto; padding: 6px 12px !important; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; overflow-x: hidden;
      a { border-radius: 12px; margin: 0; font-family: var(--font-sans); font-size: 14px; font-weight: 500; letter-spacing: -0.01em; min-height: 44px; height: 44px; border: 1px solid transparent; transition: background 0.18s ease, border-color 0.18s ease, transform 0.14s ease, box-shadow 0.18s ease, color 0.18s ease; animation: navIn 0.4s ease both; &:nth-child(1){animation-delay:0.05s} &:nth-child(2){animation-delay:0.10s} &:nth-child(3){animation-delay:0.15s}
        mat-icon { color: #64748b; font-size: 20px; width: 20px; height: 20px; transition: color 0.18s ease, transform 0.18s ease; }
        &:hover { background: #f8fafc; border-color: rgba(15, 23, 42, 0.06); transform: translateY(-0.5px); mat-icon { color: #334155; transform: scale(1.04); } }
        &:active { transform: scale(0.98); } &:focus-visible { outline: 2px solid #5c4ddb; outline-offset: 1px; }
        &.active { background: linear-gradient(135deg, rgba(26,35,126,0.08) 0%, rgba(92,77,219,0.10) 100%); border-color: rgba(92, 77, 219, 0.14); box-shadow: 0 1px 8px rgba(92,77,219,0.08), inset 0 1px 0 rgba(255,255,255,0.7); position: relative; &::before { content: ''; position: absolute; left: -12px; top: 50%; transform: translateY(-50%); width: 3px; height: 22px; border-radius: 999px; background: linear-gradient(180deg, #1a237e, #5c4ddb); } mat-icon { color: #1a237e; } span { color: #1a237e; font-weight: 600; } }
      }
    }
    .sidenav-spacer { flex: 1 1 auto; min-height: 16px; }
    .sidenav-bottom { flex-shrink: 0; padding: 14px 12px 12px; border-top: 1px solid rgba(15, 23, 42, 0.06); background: linear-gradient(180deg, rgba(248,250,252,0.0) 0%, rgba(248,250,252,0.65) 100%); display: flex; flex-direction: column; gap: 10px; }
    .user-card { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px; border-radius: 16px; border: 1px solid rgba(15,23,42,0.07); background: #f8fafc; cursor: pointer; text-align: left; transition: background 0.16s ease, border-color 0.16s ease, transform 0.14s ease, box-shadow 0.16s ease; font-family: var(--font-sans); }
    .user-card:hover { background: #ffffff; border-color: rgba(92,77,219,0.16); box-shadow: 0 4px 16px rgba(15,23,42,0.06); transform: translateY(-1px); }
    .user-card:active { transform: scale(0.98); } .user-card:focus-visible { outline: 2px solid #5c4ddb; outline-offset: 2px; }
    .avatar-wrap { width: 40px; height: 40px; border-radius: 999px; background: linear-gradient(135deg, #1a237e 0%, #5c4ddb 100%); display: grid; place-items: center; position: relative; flex-shrink: 0; box-shadow: 0 2px 10px rgba(92,77,219,0.24), inset 0 1px 0 rgba(255,255,255,0.2); border: 2px solid white; }
    .avatar-wrap.lg { width: 44px; height: 44px; } .avatar-initials { color: white; font-family: var(--font-display); font-weight: 700; font-size: 13px; letter-spacing: -0.02em; line-height: 1; text-transform: uppercase; } .avatar-wrap.lg .avatar-initials { font-size: 14px; }
    .online-dot { position: absolute; right: -1px; bottom: -1px; width: 12px; height: 12px; border-radius: 50%; background: #10b981; border: 2px solid white; box-shadow: 0 1px 4px rgba(16,185,129,0.4); }
    .user-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .user-name { font-size: 13.5px; font-weight: 600; letter-spacing: -0.015em; color: #0f172a; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 12px; font-weight: 500; color: #64748b; line-height: 1.2; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-chevron { font-size: 20px !important; width: 20px !important; height: 20px !important; color: #94a3b8 !important; flex-shrink: 0; transition: transform 0.18s ease, color 0.18s ease; }
    .user-card:hover .user-chevron { color: #475569 !important; transform: translateY(0.5px); }
    .version-row { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 2px 0 0; font-size: 11px; font-weight: 500; letter-spacing: 0.02em; color: #94a3b8; font-family: var(--font-sans); }
    .version-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.14); flex-shrink: 0; animation: pulseDot 2.2s infinite; }
    .main-wrapper { display: flex; flex-direction: column; min-height: 100%; background: #f8f9fc; background-image: radial-gradient(1100px 520px at 12% -8%, rgba(92,77,219,0.06) 0%, transparent 60%), radial-gradient(900px 480px at 92% 0%, rgba(6,182,214,0.05) 0%, transparent 60%); position: relative; }
    .main-content { flex: 1; padding: 28px; padding-bottom: 36px; overflow-y: auto; max-width: 1280px; width: 100%; margin: 0 auto; box-sizing: border-box; animation: contentIn 0.4s ease both; animation-delay: 0.08s; }
    .fab-menu { position: fixed !important; left: max(16px, env(safe-area-inset-left)); bottom: max(16px, env(safe-area-inset-bottom)); z-index: 400; width: 56px !important; height: 56px !important; border-radius: 16px !important; background: linear-gradient(135deg, #1a237e 0%, #3949ab 45%, #5c4ddb 100%) !important; color: white !important; box-shadow: 0 8px 24px rgba(26,35,126,0.28), 0 4px 12px rgba(26,35,126,0.18) !important; border: 1px solid rgba(255,255,255,0.16) !important; transition: transform 0.16s ease, box-shadow 0.2s ease !important; }
    .fab-menu:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 12px 32px rgba(26,35,126,0.34), 0 6px 16px rgba(26,35,126,0.2) !important; } .fab-menu:active { transform: scale(0.96); } .fab-menu mat-icon { color: white; }
    .fab-notif { position: fixed !important; right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom)); z-index: 400; width: 56px !important; height: 56px !important; border-radius: 16px !important; background: rgba(255,255,255,0.92) !important; backdrop-filter: blur(12px) saturate(1.2); -webkit-backdrop-filter: blur(12px) saturate(1.2); color: #0f172a !important; box-shadow: 0 8px 24px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.08) !important; border: 1px solid rgba(15,23,42,0.08) !important; transition: transform 0.16s ease, box-shadow 0.2s ease, background 0.16s ease !important; }
    .fab-notif:hover { background: #ffffff !important; transform: translateY(-1px) scale(1.02); box-shadow: 0 12px 32px rgba(15,23,42,0.14), 0 6px 16px rgba(15,23,42,0.10) !important; } .fab-notif:active { transform: scale(0.96); } .fab-notif mat-icon { color: #334155; } .fab-notif mat-icon.has-unread { color: #1a237e; }
    :host ::ng-deep .user-menu-panel .mat-mdc-menu-content { padding: 0 !important; } :host ::ng-deep .user-menu-panel { min-width: 280px !important; }
    .user-menu-head { display: flex; align-items: center; gap: 14px; padding: 16px; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
    .user-details { display: flex; flex-direction: column; gap: 2px; min-width: 0; } .user-details strong { font-family: var(--font-sans); font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: #0f172a; line-height: 1.2; }
    .role-pill { display: inline-flex; align-self: flex-start; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; background: #eef2ff; color: #4338ca; border: 1px solid rgba(67,56,202,0.12); margin: 2px 0; }
    .user-email { font-size: 12px; color: #64748b !important; font-weight: 450; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
    ::ng-deep .notif-menu-panel { max-width: 380px !important; width: 380px !important; } ::ng-deep .notif-menu-panel .mat-mdc-menu-content { padding: 0 !important; }
    .notif-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 14px 14px 16px; gap: 12px; background: #f8fafc; border-bottom: 1px solid rgba(15,23,42,0.06); }
    .notif-title { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-weight: 700; font-size: 13px; letter-spacing: -0.01em; color: #0f172a; mat-icon { font-size: 16px; width: 16px; height: 16px; color: #5c4ddb; } }
    .unread-chip { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; }
    .notif-list { max-height: 360px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; } .notif-list::-webkit-scrollbar { width: 6px; } .notif-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
    .notif-empty { display: flex; flex-direction: column; align-items: center; padding: 36px 16px; color: #64748b; mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 10px; color: #cbd5e1; } p { margin: 0; font-size: 13px; font-weight: 600; color: #334155; } small { font-size: 12px; color: #94a3b8; margin-top: 2px; } }
    .notif-item { height: auto !important; line-height: normal !important; padding: 12px 16px !important; white-space: normal !important; border-bottom: 1px solid rgba(15,23,42,0.04); transition: background 0.16s ease; &.unread { background: #eef2ff !important; border-left: 3px solid #5c4ddb; } &:hover { background: #f8fafc !important; } }
    .notif-item-row { display: flex; gap: 10px; align-items: flex-start; width: 100%; }
    .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #5c4ddb; margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 0 4px rgba(92,77,219,0.12); &.read { background: #cbd5e1; box-shadow: none; } }
    .notif-content { flex: 1; min-width: 0; } .notif-item-title { font-weight: 600; font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; } .notif-item-msg { font-size: 12px; color: #64748b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 3px; line-height: 1.5; } .notif-item-time { font-size: 11px; color: #94a3b8; margin-top: 5px; font-family: var(--font-mono, ui-monospace, monospace); }
    .notif-footer { padding: 10px 16px; text-align: center; color: #94a3b8; font-size: 11px; background: #f8fafc; border-top: 1px solid rgba(15,23,42,0.06); letter-spacing: 0.02em; }
    @keyframes pulseDot { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.22)} 50%{box-shadow:0 0 0 6px rgba(16,185,129,0)} } @keyframes badgePop{0%{transform:scale(0.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}} @keyframes bellPop{0%{transform:scale(1)}35%{transform:scale(1.06)}100%{transform:scale(1)}} @keyframes navIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}} @keyframes contentIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @media (max-width: 768px) { .main-content { padding: 16px; padding-bottom: 86px; } .sidenav-header { padding: 18px 14px 16px; } .logo-text { font-size: 20px; } .nav-label { padding: 12px 16px 6px; } }
    @media (max-width: 390px) { .main-content { padding: 12px; padding-bottom: 84px; } .logo-mark { width: 32px; height: 32px; border-radius: 10px; } .logo-mark mat-icon { font-size: 18px; width: 18px; height: 18px; } .logo-text { font-size: 18px; } .logo-sub { font-size: 9px; } .sidenav.mobile { width: 86vw; max-width: 320px; } .fab-menu, .fab-notif { width: 52px !important; height: 52px !important; bottom: 14px; } .fab-menu { left: 14px; } .fab-notif { right: 14px; } ::ng-deep .notif-menu-panel { max-width: calc(100vw - 24px) !important; width: calc(100vw - 24px) !important; } }
    @media (prefers-reduced-motion: reduce) { *,*::before,*::after{animation-duration:0.01ms !important;transition-duration:0.01ms !important} }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isMobile = signal(false);
  private pollTimer: any = null;
  private routerSub: any = null;
  constructor(public authService: AuthService, public notifService: NotificationService, private breakpointObserver: BreakpointObserver, private router: Router, @Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) { this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait]).subscribe(result => { this.isMobile.set(result.matches); }); }
  }
  ngOnInit() { if (isPlatformBrowser(this.platformId) && this.authService.isAuthenticated()) { this.refreshNotifications(); this.pollTimer = setInterval(() => this.refreshNotifications(), 30000); this.routerSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.refreshNotifications()); } }
  ngOnDestroy() { if (this.pollTimer) clearInterval(this.pollTimer); if (this.routerSub) this.routerSub.unsubscribe(); }
  private refreshNotifications() { if (!this.authService.isAuthenticated()) return; this.notifService.getUnreadCount().subscribe({ error: () => {} }); this.notifService.fetchLatest(10).subscribe({ error: () => {} }); }
  onNotifMenuOpened() { this.refreshNotifications(); }
  markAllRead(event: Event) { event.stopPropagation(); this.notifService.markAllRead().subscribe({ next: () => {}, error: () => {} }); }
  openNotification(n: any) { const id = n.id ?? n.Id; const incidentId = n.incidentId ?? n.IncidentId; if (!n.isRead && !n.IsRead) { this.notifService.markRead(id).subscribe({ error: () => {} }); } if (incidentId) { this.router.navigate(['/incidents', incidentId.toString()]); } }
  getUserDisplayName(): string { const user = this.authService.currentUser(); return user ? user.fullName : ''; }
  getUserInitials(): string { const name = this.getUserDisplayName()?.trim(); if (!name) return '?'; const parts = name.split(/\s+/).filter(Boolean); if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase(); return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); }
  logout() { if (this.pollTimer) clearInterval(this.pollTimer); this.authService.logout(); window.location.href = '/login'; }
}
