import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { IncidentService, IncidentDetail, TimelineEntryDto, AttachmentDto } from '../../core/services/incident.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatTooltipModule,
    MatSelectModule
  ],
  template: `
    <div class="incident-detail">
      @if (incident()) {
        <div class="page-header">
          <button mat-button routerLink="/incidents" class="back-btn">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
          <div class="header-actions">
            @if (auth.canAssign()) {
              <button mat-stroked-button color="primary" (click)="assignToMe()" [disabled]="assigning()" class="action-btn">
                <mat-icon>person_add</mat-icon> Assign to me
              </button>
            }
            @if (auth.canDelete()) {
              <button mat-stroked-button color="warn" (click)="deleteIncident()" matTooltip="Delete incident" class="action-btn">
                <mat-icon>delete</mat-icon> Delete
              </button>
            }
          </div>
        </div>

        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>{{ incident()!.title }}</mat-card-title>
            <mat-card-subtitle>
              <span class="status-badge" [class]="getStatusClass(incident()!.status)">
                {{ incident()!.status }}
              </span>
              <span class="priority-badge" [class]="incident()!.priority.toLowerCase()">
                {{ incident()!.priority }}
              </span>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="detail-row">
              <strong>Description</strong>
              <p>{{ incident()!.description || 'No description' }}</p>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <strong>Reporter</strong>
                <span>{{ incident()!.createdBy.fullName }}</span>
              </div>
              <div class="detail-item">
                <strong>Assignee</strong>
                <span>{{ incident()!.assignedTo?.fullName || 'Unassigned' }}</span>
              </div>
              <div class="detail-item">
                <strong>Team</strong>
                <span>{{ incident()!.team?.name || 'No team' }}</span>
              </div>
              <div class="detail-item">
                <strong>Created</strong>
                <span>{{ incident()!.createdAt | date:'medium' }}</span>
              </div>
              @if (incident()!.resolvedAt) {
                <div class="detail-item">
                  <strong>Resolved</strong>
                  <span>{{ incident()!.resolvedAt | date:'medium' }}</span>
                </div>
              }
              @if (incident()!.closedAt) {
                <div class="detail-item">
                  <strong>Closed</strong>
                  <span>{{ incident()!.closedAt | date:'medium' }}</span>
                </div>
              }
            </div>

            <!-- Status quick update -->
            @if (auth.canCreate()) {
              <div class="status-actions">
                <mat-form-field appearance="outline" class="status-select">
                  <mat-label>Update status</mat-label>
                  <mat-select [(ngModel)]="selectedStatus" (selectionChange)="updateStatus()">
                    <mat-option value="Open">Open</mat-option>
                    <mat-option value="InProgress">In Progress</mat-option>
                    <mat-option value="Resolved">Resolved</mat-option>
                    <mat-option value="Closed">Closed</mat-option>
                  </mat-select>
                </mat-form-field>
                @if (statusUpdating()) {
                  <mat-spinner diameter="20"></mat-spinner>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Tabs: Timeline / Comments -->
        <mat-card class="tabs-card">
          <mat-tab-group animationDuration="220ms" color="primary">
            <!-- Timeline Tab -->
            <mat-tab label="Timeline">
              <div class="tab-content">
                @if (timelineLoading()) {
                  <div class="loading-row">
                    <mat-spinner diameter="28"></mat-spinner>
                    <span>Loading timeline...</span>
                  </div>
                } @else if (timeline().length === 0) {
                  <div class="empty-timeline">
                    <div class="empty-illustration">
                      <mat-icon>history</mat-icon>
                    </div>
                    <p>No timeline events yet</p>
                    <small>Comments, status changes and attachments will appear here chronologically</small>
                  </div>
                } @else {
                  <div class="timeline">
                    @for (entry of timeline(); track $index) {
                      <div class="timeline-entry" [class]="'type-' + getTimelineType(entry)">
                        <div class="timeline-left">
                          <div class="timeline-icon" [class]="'icon-' + getTimelineType(entry)">
                            <mat-icon>{{ getTimelineIcon(entry) }}</mat-icon>
                          </div>
                          @if (!$last) {
                            <div class="timeline-line"></div>
                          }
                        </div>
                        <div class="timeline-body">
                          <div class="timeline-header">
                            <span class="timeline-actor">{{ getTimelineActor(entry) }}</span>
                            <span class="timeline-dot">•</span>
                            <span class="timeline-time">{{ getTimelineAt(entry) | date:'medium' }}</span>
                            <span class="timeline-type-chip" [class]="'chip-' + getTimelineType(entry)">{{ getTimelineType(entry) }}</span>
                          </div>
                          <div class="timeline-content">{{ getTimelineContent(entry) }}</div>
                          @if (getTimelineMetadataSummary(entry)) {
                            <div class="timeline-meta">{{ getTimelineMetadataSummary(entry) }}</div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Comments Tab -->
            <mat-tab [label]="'Comments (' + comments().length + ')'">
              <div class="tab-content">
                @if (commentsLoading()) {
                  <div class="loading-row">
                    <mat-spinner diameter="28"></mat-spinner>
                    <span>Loading comments...</span>
                  </div>
                } @else {
                  @if (comments().length === 0) {
                    <div class="empty-timeline">
                      <div class="empty-illustration">
                        <mat-icon>chat_bubble_outline</mat-icon>
                      </div>
                      <p>No comments yet</p>
                      <small>Start the conversation — add the first comment.</small>
                    </div>
                  } @else {
                    <div class="comments-list">
                      @for (c of comments(); track c.id || $index) {
                        <div class="comment-item">
                          <div class="comment-avatar">
                            <mat-icon>person</mat-icon>
                          </div>
                          <div class="comment-bubble">
                            <div class="comment-header">
                              <strong>{{ c.authorName || c.AuthorName || c.actor || 'User' }}</strong>
                              <span class="comment-time">{{ (c.createdAt || c.CreatedAt || c.at) | date:'medium' }}</span>
                            </div>
                            <div class="comment-content">{{ c.content || c.Content || c.message }}</div>
                          </div>
                        </div>
                      }
                    </div>
                  }

                  @if (auth.canCreate()) {
                    <mat-divider></mat-divider>
                    <div class="add-comment">
                      <mat-form-field appearance="outline" class="comment-field">
                        <mat-label>Add a comment</mat-label>
                        <textarea matInput [(ngModel)]="newComment" rows="3" placeholder="Write a comment..."></textarea>
                      </mat-form-field>
                      <div class="comment-actions">
                        <button mat-raised-button color="primary" (click)="postComment()" [disabled]="!newComment.trim() || postingComment()">
                          @if (postingComment()) {
                            <mat-spinner diameter="18"></mat-spinner>
                          } @else {
                            <mat-icon>send</mat-icon>
                          }
                          Post comment
                        </button>
                      </div>
                    </div>
                  }
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>

        <!-- Attachments Section -->
        <mat-card class="attachments-card">
          <mat-card-header>
            <mat-card-title class="attachments-title">
              <mat-icon>attach_file</mat-icon>
              Attachments
              <span class="count-badge">{{ attachments().length }}</span>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (attachmentsLoading()) {
              <div class="loading-row">
                <mat-spinner diameter="24"></mat-spinner>
                <span>Loading attachments...</span>
              </div>
            } @else {
              @if (attachments().length === 0) {
                <div class="empty-attachments">
                  <div class="empty-illustration">
                    <mat-icon>cloud_upload</mat-icon>
                  </div>
                  <p>No attachments yet</p>
                  <small>Upload images or share links to add context.</small>
                </div>
              } @else {
                <div class="attachments-grid">
                  @for (att of attachments(); track attId(att)) {
                    <div class="attachment-item">
                      <div class="attachment-thumb">
                        @if (isImageAttachment(att)) {
                          <img [src]="getAttachmentUrl(att)" [alt]="getAttachmentFileName(att)" class="thumb-image" (error)="onImgError($event)" />
                        } @else {
                          <div class="thumb-placeholder">
                            <mat-icon>{{ getFileIcon(getAttachmentFileName(att), getAttachmentContentType(att)) }}</mat-icon>
                          </div>
                        }
                      </div>
                      <div class="attachment-info">
                        <div class="attachment-name" [matTooltip]="getAttachmentFileName(att)">{{ getAttachmentFileName(att) }}</div>
                        <div class="attachment-meta">
                          <span class="content-type-chip">{{ getAttachmentContentType(att) }}</span>
                          <span class="size">{{ formatSize(getAttachmentSize(att)) }}</span>
                        </div>
                        <div class="attachment-url">
                          <a [href]="getAttachmentUrl(att)" target="_blank" rel="noopener" class="url-link">
                            <mat-icon>open_in_new</mat-icon> Open
                          </a>
                        </div>
                        <div class="attachment-foot">
                          <span class="uploaded-by">{{ getAttachmentUploader(att) }}</span>
                          <span class="dot">•</span>
                          <span class="uploaded-at">{{ getAttachmentAt(att) | date:'short' }}</span>
                        </div>
                      </div>
                      @if (auth.canDeleteAttachment()) {
                        <button mat-icon-button color="warn" class="delete-attachment" matTooltip="Delete attachment" (click)="deleteAttachment(att)">
                          <mat-icon>close</mat-icon>
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            }

            <!-- Upload Form (Operator+ can upload) -->
            @if (auth.canUploadAttachment()) {
              <mat-divider class="upload-divider"></mat-divider>
              <div class="upload-zone">
                <h4><mat-icon>cloud_upload</mat-icon> Add attachment</h4>
                <p class="upload-hint">Upload an image (converted to data URI) or paste a URL.</p>

                <div class="upload-form">
                  <!-- File picker -->
                  <div class="file-picker">
                    <input #fileInput type="file" hidden (change)="onFileSelected($event)" accept="image/*,.pdf,.txt,.log,.json,.zip" />
                    <button mat-stroked-button type="button" (click)="fileInput.click()">
                      <mat-icon>folder_open</mat-icon> Choose file
                    </button>
                    @if (selectedFileName) {
                      <span class="selected-file">
                        <mat-icon>description</mat-icon> {{ selectedFileName }} — {{ formatSize(selectedFileSize || 0) }}
                      </span>
                    }
                    @if (previewDataUrl && isPreviewImage) {
                      <div class="preview-thumb">
                        <img [src]="previewDataUrl" alt="preview" />
                      </div>
                    }
                  </div>

                  <div class="or-divider"><span>or</span></div>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>File name *</mat-label>
                    <input matInput [(ngModel)]="uploadForm.fileName" placeholder="example.png" />
                    <mat-icon matSuffix>description</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Url * (https:// or data:image/*)</mat-label>
                    <input matInput [(ngModel)]="uploadForm.url" placeholder="https://... or data:image/png;base64,..." />
                    <mat-icon matSuffix>link</mat-icon>
                    @if (uploadForm.url && isImageUrl(uploadForm.url)) {
                      <mat-hint>Image URL detected — thumbnail will be shown</mat-hint>
                    }
                  </mat-form-field>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field half">
                      <mat-label>Content type (auto)</mat-label>
                      <input matInput [(ngModel)]="uploadForm.contentType" placeholder="image/png" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="form-field half">
                      <mat-label>Size bytes (auto)</mat-label>
                      <input matInput type="number" [(ngModel)]="uploadForm.sizeBytes" placeholder="1024" />
                    </mat-form-field>
                  </div>

                  @if (uploadForm.url && isImageUrl(uploadForm.url)) {
                    <div class="url-preview">
                      <img [src]="uploadForm.url" alt="url preview" class="url-thumb" (error)="onImgError($event)" />
                      <span>Preview</span>
                    </div>
                  }

                  @if (uploadError()) {
                    <div class="error-message">{{ uploadError() }}</div>
                  }

                  <div class="upload-actions">
                    <button mat-raised-button color="primary" (click)="uploadAttachment()" [disabled]="uploading() || !uploadForm.fileName.trim() || !uploadForm.url.trim()">
                      @if (uploading()) {
                        <mat-spinner diameter="18"></mat-spinner>
                      } @else {
                        <mat-icon>upload</mat-icon>
                      }
                      Upload
                    </button>
                    <button mat-button type="button" (click)="clearUploadForm()">Clear</button>
                  </div>
                </div>
              </div>
            } @else {
              <div class="viewer-note">
                <mat-icon>visibility</mat-icon> Viewers cannot upload or delete attachments.
              </div>
            }
          </mat-card-content>
        </mat-card>

      } @else if (loading()) {
        <div class="loading-container">
          <div class="shimmer" style="height: 320px; border-radius: 20px; margin-bottom: 16px;"></div>
          <div class="shimmer" style="height: 240px; border-radius: 20px;"></div>
        </div>
      } @else if (errorMsg()) {
        <mat-card class="error-card">
          <mat-icon>error</mat-icon>
          <p>{{ errorMsg() }}</p>
          <button mat-raised-button routerLink="/incidents">Back to list</button>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .incident-detail {
      max-width: 880px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .back-btn {
      border-radius: 999px !important;
      font-weight: 600 !important;
      letter-spacing: -0.01em;
      color: #334155 !important;
      background: white !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 1px 3px rgba(15,23,42,0.06) !important;
      &:hover { background: #f8fafc !important; }
    }
    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .action-btn {
      border-radius: 12px !important;
      font-weight: 600 !important;
      height: 40px;
      box-shadow: 0 1px 3px rgba(15,23,42,0.06);
      transition: transform 0.14s ease, box-shadow 0.18s ease;
      &:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(15,23,42,0.08); }
      &:active { transform: scale(0.98); }
    }
    .detail-card {
      margin-top: 0;
      padding: 28px;
      border-radius: 20px !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 4px 24px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.05) !important;
      background: white !important;
      animation: subtleIn 0.42s cubic-bezier(0.2,0.8,0.2,1) both;
      overflow: hidden;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, #1a237e, #5c4ddb, #06b6d4);
        opacity: 0.9;
      }
      mat-card-header { padding: 0; margin-bottom: 18px; }
      mat-card-title {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.2;
        color: #0f172a;
        margin-bottom: 10px;
      }
      mat-card-subtitle {
        display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
        margin: 0;
      }
      mat-card-content { padding: 0; }
    }
    @keyframes subtleIn { from{opacity:0; transform: translateY(8px);} to{opacity:1; transform: translateY(0);} }
    .detail-row {
      margin-bottom: 18px;
      strong { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
      p { margin: 0; color: #334155; line-height: 1.6; font-size: 14.5px; background: #f8fafc; border: 1px solid rgba(15,23,42,0.06); border-radius: 12px; padding: 14px 16px; }
    }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin: 18px 0; }
    .detail-item {
      display: flex; flex-direction: column; gap: 5px;
      background: white; border: 1px solid rgba(15,23,42,0.06); border-radius: 12px; padding: 12px 14px;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
      &:hover { border-color: rgba(92,77,219,0.12); box-shadow: 0 2px 10px rgba(15,23,42,0.04); }
      strong { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; line-height: 1; }
      span { font-size: 13.5px; font-weight: 600; color: #0f172a; letter-spacing: -0.01em; }
    }
    // status + priority badges — use global but refine size here
    .status-badge, .priority-badge { padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid transparent; line-height: 1; }
    .status-badge.open { background: #eef2ff; color: #4338ca; border-color: rgba(67,56,202,0.12); }
    .status-badge.inprogress { background: #fffbeb; color: #92400e; border-color: rgba(180,83,9,0.12); }
    .status-badge.resolved { background: #f5f3ff; color: #6d28d9; border-color: rgba(109,40,217,0.12); }
    .status-badge.closed { background: #f1f5f9; color: #475569; border-color: rgba(15,23,42,0.08); }
    .priority-badge.critical { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
    .priority-badge.high { background: #fffbeb; color: #92400e; border-color: #fde68a; }
    .priority-badge.medium { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .priority-badge.low { background: #ecfeff; color: #0e7490; border-color: #a5f3fc; }

    .status-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 18px;
      flex-wrap: wrap;
      padding-top: 16px;
      border-top: 1px solid rgba(15,23,42,0.06);
    }
    .status-select { max-width: 240px; flex: 1; }

    .tabs-card {
      margin-top: 16px;
      padding: 0;
      overflow: hidden;
      border-radius: 20px !important;
      border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 4px 24px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04) !important;
      background: white !important;
      animation: subtleIn 0.42s ease 80ms both;
    }
    ::ng-deep .tabs-card .mat-mdc-tab-header { border-bottom: 1px solid rgba(15,23,42,0.06); }
    ::ng-deep .tabs-card .mdc-tab { font-family: var(--font-sans); font-weight: 600; letter-spacing: -0.01em; }
    ::ng-deep .tabs-card .mat-mdc-tab-body-content { overflow: hidden; }
    .tab-content {
      padding: 22px;
    }
    .loading-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 28px;
      color: #64748b;
      justify-content: center;
      font-size: 13px;
      font-weight: 500;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }
    .empty-timeline, .empty-attachments {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 36px 20px;
      text-align: center;
      gap: 6px;
      .empty-illustration {
        width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center;
        background: #f8fafc; border: 1px solid rgba(15,23,42,0.06); margin-bottom: 8px;
        mat-icon { font-size: 28px; width: 28px; height: 28px; color: #cbd5e1; }
      }
      p { margin: 0; font-weight: 700; font-size: 14px; color: #334155; letter-spacing: -0.01em; }
      small { color: #94a3b8; font-size: 13px; line-height: 1.5; max-width: 360px; }
    }

    /* Timeline — vertical line with dot pulses */
    .timeline {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0;
      padding-left: 2px;
    }
    .timeline-entry {
      display: flex;
      gap: 14px;
      position: relative;
      padding-bottom: 18px;
      animation: subtleIn 0.34s ease both;
      &:nth-child(1){ animation-delay: 0ms; }
      &:nth-child(2){ animation-delay: 60ms; }
      &:nth-child(3){ animation-delay: 120ms; }
      &:nth-child(4){ animation-delay: 180ms; }
    }
    .timeline-entry:last-child { padding-bottom: 0; }
    .timeline-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 36px;
      flex-shrink: 0;
      position: relative;
    }
    .timeline-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: #eef2ff;
      color: #4338ca;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.06);
      z-index: 1;
      position: relative;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 1px solid rgba(92,77,219,0.14);
        opacity: 0;
        transform: scale(0.9);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
    }
    .timeline-entry:hover .timeline-icon {
      transform: scale(1.04);
      box-shadow: 0 4px 14px rgba(15,23,42,0.10), 0 0 0 1px rgba(92,77,219,0.12);
      &::after { opacity: 1; transform: scale(1); }
      animation: pulseDot 1.6s ease infinite;
    }
    @keyframes pulseDot {
      0%, 100% { box-shadow: 0 2px 8px rgba(15,23,42,0.08), 0 0 0 0 rgba(92,77,219,0.22); }
      50% { box-shadow: 0 2px 8px rgba(15,23,42,0.08), 0 0 0 6px rgba(92,77,219,0); }
    }
    .timeline-icon.icon-comment { background: #eef2ff; color: #4338ca; }
    .timeline-icon.icon-status { background: #fffbeb; color: #b45309; }
    .timeline-icon.icon-audit { background: #f5f3ff; color: #6d28d9; }
    .timeline-icon.icon-attachment { background: #ecfeff; color: #0e7490; }
    .timeline-line {
      flex: 1;
      width: 2px;
      background: linear-gradient(180deg, #e2e8f0, #e2e8f0 70%, transparent);
      margin-top: 6px;
      min-height: 22px;
      border-radius: 1px;
      opacity: 0.9;
    }
    .timeline-body {
      flex: 1;
      background: white;
      border: 1px solid rgba(15,23,42,0.07);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 1px 6px rgba(15,23,42,0.04);
      transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
      position: relative;
      &:hover { border-color: rgba(92,77,219,0.12); box-shadow: 0 6px 20px rgba(15,23,42,0.06); transform: translateY(-1px); }
      // subtle left accent per type
      .timeline-entry.type-comment & { border-left: 3px solid rgba(67,56,202,0.18); }
      .timeline-entry.type-status & { border-left: 3px solid rgba(180,83,9,0.18); }
      .timeline-entry.type-attachment & { border-left: 3px solid rgba(6,182,214,0.18); }
    }
    .timeline-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .timeline-actor { font-weight: 700; font-size: 13px; color: #0f172a; letter-spacing: -0.01em; }
    .timeline-dot { color: #cbd5e1; font-size: 10px; }
    .timeline-time { font-size: 12px; color: #94a3b8; font-family: var(--font-mono); letter-spacing: -0.01em; }
    .timeline-type-chip {
      margin-left: auto;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border: 1px solid transparent;
      line-height: 1;
    }
    .timeline-type-chip.chip-comment { background: #eef2ff; color: #4338ca; border-color: rgba(67,56,202,0.14); }
    .timeline-type-chip.chip-status { background: #fffbeb; color: #92400e; border-color: rgba(180,83,9,0.14); }
    .timeline-type-chip.chip-audit { background: #f5f3ff; color: #6d28d9; border-color: rgba(109,40,217,0.12); }
    .timeline-type-chip.chip-attachment { background: #ecfeff; color: #0e7490; border-color: rgba(6,182,214,0.18); }
    .timeline-content { font-size: 14px; color: #334155; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
    .timeline-meta { margin-top: 10px; font-size: 11px; color: #64748b; font-family: var(--font-mono); background: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px dashed #e2e8f0; }

    /* Comments — bubbles with tail */
    .comments-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px; }
    .comment-item { display: flex; gap: 12px; align-items: flex-start; animation: subtleIn 0.32s ease both; }
    .comment-avatar {
      width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #eef2ff, #e0e7ff); border: 1px solid rgba(67,56,202,0.12);
      display: grid; place-items: center; flex-shrink: 0; margin-top: 2px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #4338ca; }
    }
    .comment-bubble {
      flex: 1; min-width: 0;
      background: #f8fafc; border: 1px solid rgba(15,23,42,0.07); border-radius: 16px; padding: 14px 16px;
      position: relative; box-shadow: 0 1px 4px rgba(15,23,42,0.03);
      transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.16s ease;
      &::before {
        content: '';
        position: absolute;
        left: -6px; top: 14px;
        width: 10px; height: 10px;
        background: #f8fafc;
        border-left: 1px solid rgba(15,23,42,0.07);
        border-bottom: 1px solid rgba(15,23,42,0.07);
        transform: rotate(45deg);
        border-radius: 0 0 0 2px;
      }
      &:hover { border-color: rgba(92,77,219,0.14); box-shadow: 0 4px 14px rgba(15,23,42,0.06); transform: translateY(-1px); }
    }
    .comment-header { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; strong { font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; } }
    .comment-time { font-size: 11px; color: #94a3b8; font-family: var(--font-mono); }
    .comment-content { font-size: 14px; color: #334155; white-space: pre-wrap; word-break: break-word; line-height: 1.6; }
    .add-comment { margin-top: 16px; }
    .comment-field { width: 100%; }
    .comment-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
    .comment-actions button { border-radius: 12px !important; font-weight: 600 !important; height: 40px; padding: 0 18px !important; box-shadow: 0 4px 14px rgba(26,35,126,0.18) !important; }

    /* Attachments */
    .attachments-card { margin-top: 16px; padding: 0; border-radius: 20px !important; border: 1px solid rgba(15,23,42,0.08) !important; box-shadow: 0 4px 24px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04) !important; background: white !important; overflow: hidden; animation: subtleIn 0.42s ease 120ms both;
      mat-card-header { padding: 18px 22px 0; margin: 0; }
      mat-card-content { padding: 16px 22px 22px !important; }
    }
    .attachments-title { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: #0f172a; mat-icon { color: #5c4ddb; font-size: 20px; width: 20px; height: 20px; background: #eef2ff; border-radius: 8px; padding: 4px; width: 28px; height: 28px; border: 1px solid rgba(67,56,202,0.12); } }
    .count-badge { background: #eef2ff; color: #4338ca; border: 1px solid rgba(67,56,202,0.14); padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: -0.01em; }
    .attachments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-top: 14px; }
    .attachment-item {
      position: relative; display: flex; gap: 14px; padding: 14px; border: 1px solid rgba(15,23,42,0.08); border-radius: 14px; background: white;
      transition: transform 0.18s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.18s ease, border-color 0.18s ease;
      overflow: hidden;
      &:hover { border-color: rgba(92,77,219,0.18); box-shadow: 0 8px 22px rgba(15,23,42,0.07); transform: translateY(-1.5px); }
      &:hover .thumb-image { transform: scale(1.04); }
      &:hover .attachment-thumb { border-color: rgba(92,77,219,0.18); }
    }
    .attachment-thumb {
      width: 84px; height: 84px; flex-shrink: 0; border-radius: 12px; overflow: hidden; background: #f8fafc; display: grid; place-items: center; border: 1px solid rgba(15,23,42,0.06);
      position: relative; transition: border-color 0.18s ease;
    }
    .thumb-image { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.32s cubic-bezier(0.2,0.8,0.2,1); }
    .thumb-placeholder { color: #94a3b8; mat-icon { font-size: 28px; width: 28px; height: 28px; } }
    .attachment-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
    .attachment-name { font-weight: 700; font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
    .attachment-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .content-type-chip { padding: 3px 8px; border-radius: 999px; background: #f5f3ff; color: #6d28d9; border: 1px solid rgba(109,40,217,0.14); font-size: 11px; font-weight: 700; letter-spacing: 0.02em; }
    .size { font-size: 12px; color: #64748b; font-family: var(--font-mono); }
    .attachment-url { margin-top: 2px; }
    .url-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #4338ca; text-decoration: none; padding: 4px 8px; background: #eef2ff; border-radius: 999px; border: 1px solid rgba(67,56,202,0.12); transition: background 0.16s ease, transform 0.14s ease; mat-icon { font-size: 14px; width: 14px; height: 14px; } &:hover { background: #e0e7ff; transform: translateY(-0.5px); } }
    .attachment-foot { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; margin-top: 2px; font-weight: 500; .dot { color: #cbd5e1; } }
    .delete-attachment {
      position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; background: white !important; border: 1px solid rgba(15,23,42,0.08) !important;
      box-shadow: 0 2px 8px rgba(15,23,42,0.08) ; border-radius: 999px !important;
      transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease;
      &:hover { background: #fef2f2 !important; border-color: #fecaca !important; transform: scale(1.06); }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .upload-divider { margin: 20px 0; opacity: 0.6; }
    .upload-zone {
      background: linear-gradient(180deg, #f8faff 0%, #f8fafc 100%);
      border: 1.5px dashed #cbd5e1; border-radius: 16px; padding: 18px;
      transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
      &:hover { border-color: #a5b4fc; background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%); box-shadow: 0 4px 16px rgba(92,77,219,0.06); }
    }
    .upload-zone h4 { margin: 0 0 4px; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; letter-spacing: -0.01em; color: #1e1b4b; mat-icon { font-size: 18px; width: 18px; height: 18px; color: #5c4ddb; background: white; border-radius: 8px; padding: 3px; width: 24px; height: 24px; border: 1px solid rgba(67,56,202,0.12); } }
    .upload-hint { margin: 0 0 14px; font-size: 12px; color: #64748b; line-height: 1.5; }
    .upload-form { display: flex; flex-direction: column; gap: 12px; }
    .file-picker { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px; background: white; border-radius: 12px; border: 1px solid rgba(15,23,42,0.06); box-shadow: 0 1px 3px rgba(15,23,42,0.04); }
    .selected-file { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #0f172a; background: #ecfeff; border: 1px solid #a5f3fc; padding: 6px 10px; border-radius: 999px; font-weight: 600; mat-icon { font-size: 14px; width: 14px; height: 14px; color: #0e7490; } }
    .preview-thumb { width: 72px; height: 72px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(15,23,42,0.08); box-shadow: 0 2px 8px rgba(15,23,42,0.06); img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.28s ease; &:hover{ transform: scale(1.05);} } }
    .or-divider { display: flex; align-items: center; gap: 12px; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; &::before, &::after { content: ''; flex: 1; height: 1px; background: rgba(15,23,42,0.08); } }
    .form-field { width: 100%; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; .half { flex: 1; min-width: 160px; } }
    .url-preview { display: flex; align-items: center; gap: 12px; padding: 12px; background: white; border: 1px solid rgba(15,23,42,0.06); border-radius: 12px; box-shadow: 0 1px 6px rgba(15,23,42,0.04); }
    .url-thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(15,23,42,0.08); display: block; transition: transform 0.28s ease; &:hover{ transform: scale(1.03);} }
    .error-message { color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; padding: 10px 12px; border-radius: 10px; font-size: 13px; font-weight: 500; }
    .upload-actions { display: flex; gap: 10px; align-items: center; button[color="primary"] { border-radius: 12px !important; font-weight: 600 !important; height: 40px; padding: 0 18px !important; box-shadow: 0 4px 14px rgba(26,35,126,0.18) !important; } }

    .viewer-note { display: flex; align-items: center; gap: 8px; padding: 14px 16px; background: #fffbeb; color: #92400e; border: 1px solid #fde68a; border-radius: 12px; font-size: 13px; font-weight: 500; margin-top: 12px; mat-icon { font-size: 18px; width: 18px; height: 18px; color: #f59e0b; } }

    .error-card { padding: 32px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; border-radius: 20px !important; border: 1px solid rgba(15,23,42,0.08) !important; box-shadow: 0 4px 24px rgba(15,23,42,0.06) !important; mat-icon { font-size: 36px; width: 36px; height: 36px; color: #dc2626; background: #fef2f2; border-radius: 12px; padding: 8px; width: 52px; height: 52px; border: 1px solid #fecaca; } }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .attachments-grid { grid-template-columns: 1fr; }
      .form-row { flex-direction: column; }
      .timeline-body { padding: 12px; }
      .detail-card { padding: 20px; border-radius: 16px !important; }
      .tabs-card, .attachments-card { border-radius: 16px !important; }
      .tab-content { padding: 16px; }
    }
    @media (max-width: 390px) {
      .detail-card { padding: 16px; }
      .detail-grid { gap: 10px; }
      .detail-item { padding: 10px 12px; }
      .tab-content { padding: 14px; }
      .attachments-grid { gap: 10px; }
    }
  `]
})
export class IncidentDetailComponent implements OnInit {
  incident = signal<IncidentDetail | null>(null);
  loading = signal(true);
  errorMsg = signal('');

  timeline = signal<TimelineEntryDto[]>([]);
  timelineLoading = signal(true);

  attachments = signal<AttachmentDto[]>([]);
  attachmentsLoading = signal(true);

  comments = signal<any[]>([]);
  commentsLoading = signal(true);
  newComment = '';
  postingComment = signal(false);

  selectedStatus = '';
  statusUpdating = signal(false);
  assigning = signal(false);

  // upload form
  uploadForm = { fileName: '', url: '', contentType: '', sizeBytes: null as number | null };
  selectedFileName = '';
  selectedFileSize: number | null = null;
  previewDataUrl = '';
  isPreviewImage = false;
  uploading = signal(false);
  uploadError = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private incidentService: IncidentService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadIncident(id);
      this.loadTimeline(id);
      this.loadAttachments(id);
      this.loadComments(id);
    } else {
      this.loading.set(false);
      this.errorMsg.set('Invalid incident id');
    }
  }

  loadIncident(id: string) {
    this.loading.set(true);
    this.incidentService.getIncident(id).subscribe({
      next: (inc) => {
        this.incident.set(inc);
        this.selectedStatus = inc.status;
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Failed to load incident');
      }
    });
  }

  loadTimeline(id: string) {
    this.timelineLoading.set(true);
    this.incidentService.getTimeline(id).subscribe({
      next: (data) => {
        const normalized = (data || []).map(e => this.normalizeTimeline(e));
        // ensure chronological order
        normalized.sort((a, b) => new Date(this.getTimelineAt(a)).getTime() - new Date(this.getTimelineAt(b)).getTime());
        this.timeline.set(normalized);
        this.timelineLoading.set(false);
      },
      error: () => {
        this.timeline.set([]);
        this.timelineLoading.set(false);
      }
    });
  }

  loadAttachments(id: string) {
    this.attachmentsLoading.set(true);
    this.incidentService.getAttachments(id).subscribe({
      next: (data) => {
        const list = (data || []).map(a => this.normalizeAttachment(a));
        this.attachments.set(list);
        this.attachmentsLoading.set(false);
      },
      error: () => {
        this.attachments.set([]);
        this.attachmentsLoading.set(false);
      }
    });
  }

  loadComments(id: string) {
    this.commentsLoading.set(true);
    this.incidentService.getComments(id).subscribe({
      next: (data) => {
        this.comments.set(data || []);
        this.commentsLoading.set(false);
      },
      error: () => {
        this.comments.set([]);
        this.commentsLoading.set(false);
      }
    });
  }

  normalizeTimeline(e: any): TimelineEntryDto {
    return {
      type: (e.type ?? e.Type ?? 'audit').toString().toLowerCase(),
      at: e.at ?? e.At ?? new Date().toISOString(),
      actor: e.actor ?? e.Actor ?? 'System',
      content: e.content ?? e.Content ?? '',
      metadata: e.metadata ?? e.Metadata ?? null
    };
  }

  normalizeAttachment(a: any): AttachmentDto {
    return {
      id: a.id ?? a.Id,
      incidentId: a.incidentId ?? a.IncidentId,
      fileName: a.fileName ?? a.FileName ?? 'file',
      contentType: a.contentType ?? a.ContentType ?? 'application/octet-stream',
      url: a.url ?? a.Url ?? '',
      uploadedById: a.uploadedById ?? a.UploadedById ?? 0,
      uploadedByName: a.uploadedByName ?? a.UploadedByName ?? 'Unknown',
      uploadedAt: a.uploadedAt ?? a.UploadedAt ?? new Date().toISOString(),
      sizeBytes: a.sizeBytes ?? a.SizeBytes ?? 0
    };
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '');
  }

  // Timeline helpers
  getTimelineType(e: TimelineEntryDto): string {
    return (e.type || 'audit').toLowerCase();
  }
  getTimelineIcon(e: TimelineEntryDto): string {
    const t = this.getTimelineType(e);
    if (t === 'comment') return 'chat';
    if (t === 'status') return 'change_circle';
    if (t === 'attachment') return 'attach_file';
    return 'history';
  }
  getTimelineActor(e: TimelineEntryDto): string { return (e as any).actor || 'System'; }
  getTimelineAt(e: TimelineEntryDto): string { return (e as any).at || new Date().toISOString(); }
  getTimelineContent(e: TimelineEntryDto): string { return (e as any).content || ''; }
  getTimelineMetadataSummary(e: TimelineEntryDto): string {
    const m = (e as any).metadata;
    if (!m) return '';
    try {
      // compact JSON for display
      const keys = Object.keys(m);
      if (keys.length === 0) return '';
      if (keys.length === 1 && m[keys[0]] !== undefined) return '';
      return JSON.stringify(m);
    } catch { return ''; }
  }

  // Attachments helpers
  attId(a: AttachmentDto): number { return (a as any).id; }
  getAttachmentFileName(a: AttachmentDto): string { return (a as any).fileName; }
  getAttachmentUrl(a: AttachmentDto): string { return (a as any).url; }
  getAttachmentContentType(a: AttachmentDto): string { return (a as any).contentType; }
  getAttachmentSize(a: AttachmentDto): number { return (a as any).sizeBytes || 0; }
  getAttachmentUploader(a: AttachmentDto): string { return (a as any).uploadedByName; }
  getAttachmentAt(a: AttachmentDto): string { return (a as any).uploadedAt; }

  isImageAttachment(a: AttachmentDto): boolean {
    const ct = this.getAttachmentContentType(a) || '';
    const url = this.getAttachmentUrl(a) || '';
    return ct.toLowerCase().startsWith('image/') || this.isImageUrl(url);
  }
  isImageUrl(url: string): boolean {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    return /\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(url) || url.includes('image');
  }
  getFileIcon(fileName: string, contentType: string): string {
    const ct = (contentType || '').toLowerCase();
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
    if (ct.startsWith('image/') || ['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return 'image';
    if (ct.includes('pdf') || ext === 'pdf') return 'picture_as_pdf';
    if (['zip','rar','7z'].includes(ext)) return 'folder_zip';
    if (['txt','log'].includes(ext)) return 'article';
    if (['json'].includes(ext)) return 'code';
    return 'description';
  }
  formatSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1024/1024).toFixed(2) + ' MB';
  }
  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.style.display = 'none';
  }

  // Comments
  postComment() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.newComment.trim()) return;
    this.postingComment.set(true);
    this.incidentService.addComment(id, this.newComment.trim()).subscribe({
      next: (created) => {
        this.newComment = '';
        this.postingComment.set(false);
        this.loadComments(id);
        this.loadTimeline(id);
      },
      error: () => this.postingComment.set(false)
    });
  }

  // Status
  updateStatus() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.selectedStatus) return;
    this.statusUpdating.set(true);
    this.incidentService.updateIncident(id, { status: this.selectedStatus }).subscribe({
      next: (updated) => {
        this.incident.set(updated);
        this.statusUpdating.set(false);
        this.loadTimeline(id);
      },
      error: () => this.statusUpdating.set(false)
    });
  }

  assignToMe() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const user = this.auth.getUser();
    if (!user) return;
    this.assigning.set(true);
    // P1.5 fix: backend DTO expects AssigneeId via PATCH /assign, not assignedToUserId via PUT
    this.incidentService.assignIncident(id, user.id).subscribe({
      next: (updated) => {
        this.incident.set(updated);
        this.assigning.set(false);
        this.loadTimeline(id);
        this.loadAttachments(id);
      },
      error: () => this.assigning.set(false)
    });
  }

  deleteIncident() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (!confirm('Delete this incident? This cannot be undone.')) return;
    this.incidentService.deleteIncident(id).subscribe({
      next: () => this.router.navigate(['/incidents']),
      error: (err) => alert(err.error?.message || 'Failed to delete')
    });
  }

  // Attachments upload/delete
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedFileName = file.name;
    this.selectedFileSize = file.size;
    this.uploadForm.fileName = file.name;
    this.uploadForm.contentType = file.type || this.inferContentType(file.name);
    this.uploadForm.sizeBytes = file.size;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.previewDataUrl = result;
      this.isPreviewImage = file.type.startsWith('image/');
      // Use data URI as Url for API (supports data:image/* base64)
      this.uploadForm.url = result;
    };
    reader.readAsDataURL(file);
  }

  inferContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'log': return 'text/plain';
      case 'json': return 'application/json';
      case 'zip': return 'application/zip';
      default: return 'application/octet-stream';
    }
  }

  clearUploadForm() {
    this.uploadForm = { fileName: '', url: '', contentType: '', sizeBytes: null };
    this.selectedFileName = '';
    this.selectedFileSize = null;
    this.previewDataUrl = '';
    this.isPreviewImage = false;
    this.uploadError.set('');
  }

  uploadAttachment() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (!this.uploadForm.fileName.trim() || !this.uploadForm.url.trim()) {
      this.uploadError.set('File name and Url are required');
      return;
    }
    const url = this.uploadForm.url.trim();
    if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/'))) {
      // still allow but warn; backend validator allows http(s) or data:image
      // we enforce hint only
    }
    this.uploading.set(true);
    this.uploadError.set('');
    const payload: any = {
      fileName: this.uploadForm.fileName.trim(),
      url: url,
      contentType: this.uploadForm.contentType?.trim() || undefined,
      sizeBytes: this.uploadForm.sizeBytes ? Number(this.uploadForm.sizeBytes) : undefined
    };
    this.incidentService.createAttachment(id, payload).subscribe({
      next: () => {
        this.uploading.set(false);
        this.clearUploadForm();
        this.loadAttachments(id);
        this.loadTimeline(id);
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadError.set(err.error?.message || err.error?.title || 'Upload failed');
      }
    });
  }

  deleteAttachment(att: AttachmentDto) {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const fileName = this.getAttachmentFileName(att);
    if (!confirm(`Delete attachment "${fileName}"?`)) return;
    const attId = this.attId(att);
    this.incidentService.deleteAttachment(id, attId).subscribe({
      next: () => {
        this.loadAttachments(id);
        this.loadTimeline(id);
      },
      error: (err) => alert(err.error?.message || 'Failed to delete attachment')
    });
  }
}
