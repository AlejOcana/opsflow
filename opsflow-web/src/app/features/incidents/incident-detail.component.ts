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
          <button mat-button routerLink="/incidents">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
          <div class="header-actions">
            @if (auth.canAssign()) {
              <button mat-stroked-button color="primary" (click)="assignToMe()" [disabled]="assigning()">
                <mat-icon>person_add</mat-icon> Assign to me
              </button>
            }
            @if (auth.canDelete()) {
              <button mat-stroked-button color="warn" (click)="deleteIncident()" matTooltip="Delete incident">
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
              <strong>Description:</strong>
              <p>{{ incident()!.description || 'No description' }}</p>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <strong>Reporter:</strong>
                <span>{{ incident()!.createdBy.fullName }}</span>
              </div>
              <div class="detail-item">
                <strong>Assignee:</strong>
                <span>{{ incident()!.assignedTo?.fullName || 'Unassigned' }}</span>
              </div>
              <div class="detail-item">
                <strong>Team:</strong>
                <span>{{ incident()!.team?.name || 'No team' }}</span>
              </div>
              <div class="detail-item">
                <strong>Created:</strong>
                <span>{{ incident()!.createdAt | date:'medium' }}</span>
              </div>
              @if (incident()!.resolvedAt) {
                <div class="detail-item">
                  <strong>Resolved:</strong>
                  <span>{{ incident()!.resolvedAt | date:'medium' }}</span>
                </div>
              }
              @if (incident()!.closedAt) {
                <div class="detail-item">
                  <strong>Closed:</strong>
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
          <mat-tab-group animationDuration="200ms" color="primary">
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
                    <mat-icon>history</mat-icon>
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
                      <mat-icon>chat_bubble_outline</mat-icon>
                      <p>No comments yet</p>
                    </div>
                  } @else {
                    <div class="comments-list">
                      @for (c of comments(); track c.id || $index) {
                        <div class="comment-item">
                          <div class="comment-avatar">
                            <mat-icon>person</mat-icon>
                          </div>
                          <div class="comment-body">
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
                  <mat-icon>cloud_upload</mat-icon>
                  <p>No attachments yet</p>
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
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading incident...</p>
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
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .header-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .detail-card {
      margin-top: 8px;
      padding: 24px;
    }
    .detail-row { margin-bottom: 16px; p { margin: 8px 0; color: rgba(0,0,0,0.7); line-height: 1.5; } }
    .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; strong { font-size: 12px; color: rgba(0,0,0,0.6); text-transform: uppercase; letter-spacing: 0.4px; } span { font-size: 14px; } }
    .status-badge, .priority-badge { padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; margin-right: 8px; text-transform: capitalize; }
    .status-badge.open { background: #e3f2fd; color: #1976d2; }
    .status-badge.inprogress { background: #fff8e1; color: #f9a825; }
    .status-badge.resolved { background: #e8f5e9; color: #388e3c; }
    .status-badge.closed { background: #eceff1; color: #546e7a; }
    .priority-badge.critical { background: #ffebee; color: #c62828; }
    .priority-badge.high { background: #fff3e0; color: #ef6c00; }
    .priority-badge.medium { background: #fffde7; color: #f9a825; }
    .priority-badge.low { background: #e3f2fd; color: #1976d2; }

    .status-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .status-select { max-width: 220px; flex: 1; }

    .tabs-card {
      margin-top: 16px;
      padding: 0;
      overflow: hidden;
    }
    .tab-content {
      padding: 20px;
    }
    .loading-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      color: rgba(0,0,0,0.6);
      justify-content: center;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      color: rgba(0,0,0,0.6);
      gap: 16px;
    }
    .empty-timeline, .empty-attachments {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
      color: rgba(0,0,0,0.55);
      mat-icon { font-size: 40px; width: 40px; height: 40px; color: rgba(0,0,0,0.18); margin-bottom: 8px; }
      p { margin: 0 0 4px; font-weight: 500; }
      small { color: rgba(0,0,0,0.45); }
    }

    /* Timeline */
    .timeline {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .timeline-entry {
      display: flex;
      gap: 16px;
      position: relative;
      padding-bottom: 20px;
    }
    .timeline-entry:last-child { padding-bottom: 0; }
    .timeline-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 36px;
      flex-shrink: 0;
    }
    .timeline-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e3f2fd;
      color: #1976d2;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      z-index: 1;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .timeline-icon.icon-comment { background: #e3f2fd; color: #1976d2; }
    .timeline-icon.icon-status { background: #fff3e0; color: #ef6c00; }
    .timeline-icon.icon-audit { background: #f3e5f5; color: #7b1fa2; }
    .timeline-icon.icon-attachment { background: #e8f5e9; color: #2e7d32; }
    .timeline-line {
      flex: 1;
      width: 2px;
      background: #e0e0e0;
      margin-top: 4px;
      min-height: 24px;
      border-radius: 1px;
    }
    .timeline-body {
      flex: 1;
      background: white;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 10px;
      padding: 14px 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .timeline-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .timeline-actor { font-weight: 600; font-size: 13px; color: rgba(0,0,0,0.87); }
    .timeline-dot { color: rgba(0,0,0,0.25); }
    .timeline-time { font-size: 12px; color: rgba(0,0,0,0.55); }
    .timeline-type-chip {
      margin-left: auto;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .timeline-type-chip.chip-comment { background: #e3f2fd; color: #1565c0; }
    .timeline-type-chip.chip-status { background: #fff3e0; color: #ef6c00; }
    .timeline-type-chip.chip-audit { background: #f3e5f5; color: #6a1b9a; }
    .timeline-type-chip.chip-attachment { background: #e8f5e9; color: #2e7d32; }
    .timeline-content { font-size: 14px; color: rgba(0,0,0,0.78); line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .timeline-meta { margin-top: 8px; font-size: 11px; color: rgba(0,0,0,0.45); font-family: monospace; background: #fafafa; padding: 6px 8px; border-radius: 6px; border: 1px dashed #eee; }

    /* Comments */
    .comments-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .comment-item { display: flex; gap: 12px; padding: 14px; background: #fafafa; border-radius: 10px; border: 1px solid rgba(0,0,0,0.06); }
    .comment-avatar { width: 32px; height: 32px; border-radius: 50%; background: #e3f2fd; display: flex; align-items: center; justify-content: center; flex-shrink: 0; mat-icon { font-size: 18px; width: 18px; height: 18px; color: #1976d2; } }
    .comment-body { flex: 1; min-width: 0; }
    .comment-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; strong { font-size: 13px; } }
    .comment-time { font-size: 12px; color: rgba(0,0,0,0.5); }
    .comment-content { font-size: 14px; color: rgba(0,0,0,0.75); white-space: pre-wrap; word-break: break-word; line-height: 1.5; }
    .add-comment { margin-top: 16px; }
    .comment-field { width: 100%; }
    .comment-actions { display: flex; justify-content: flex-end; margin-top: 8px; }

    /* Attachments */
    .attachments-card { margin-top: 16px; padding: 16px 0 0; }
    .attachments-title { display: flex; align-items: center; gap: 8px; font-size: 16px; mat-icon { color: #1976d2; } }
    .count-badge { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
    .attachments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-top: 12px; }
    .attachment-item { position: relative; display: flex; gap: 14px; padding: 14px; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; background: white; transition: box-shadow 0.2s, border-color 0.2s; }
    .attachment-item:hover { border-color: rgba(25,118,210,0.25); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .attachment-thumb { width: 80px; height: 80px; flex-shrink: 0; border-radius: 8px; overflow: hidden; background: #f5f5f5; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.06); }
    .thumb-image { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumb-placeholder { color: rgba(0,0,0,0.35); mat-icon { font-size: 28px; width: 28px; height: 28px; } }
    .attachment-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .attachment-name { font-weight: 600; font-size: 13px; color: rgba(0,0,0,0.87); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .attachment-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .content-type-chip { padding: 2px 8px; border-radius: 10px; background: #f3e5f5; color: #6a1b9a; font-size: 11px; font-weight: 600; }
    .size { font-size: 12px; color: rgba(0,0,0,0.55); }
    .url-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #1976d2; text-decoration: none; mat-icon { font-size: 14px; width: 14px; height: 14px; } }
    .url-link:hover { text-decoration: underline; }
    .attachment-foot { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(0,0,0,0.5); margin-top: 2px; .dot { color: rgba(0,0,0,0.25); } }
    .delete-attachment { position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; }
    .upload-divider { margin: 18px 0; }
    .upload-zone { background: #fafcff; border: 1px dashed #c5cae9; border-radius: 12px; padding: 18px; }
    .upload-zone h4 { margin: 0 0 4px; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #283593; mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    .upload-hint { margin: 0 0 14px; font-size: 12px; color: rgba(0,0,0,0.55); }
    .upload-form { display: flex; flex-direction: column; gap: 12px; }
    .file-picker { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 10px; background: white; border-radius: 8px; border: 1px solid rgba(0,0,0,0.06); }
    .selected-file { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(0,0,0,0.7); background: #e8f5e9; padding: 6px 10px; border-radius: 16px; mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    .preview-thumb { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); img { width: 100%; height: 100%; object-fit: cover; display: block; } }
    .or-divider { display: flex; align-items: center; gap: 12px; color: rgba(0,0,0,0.35); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; &::before, &::after { content: ''; flex: 1; height: 1px; background: rgba(0,0,0,0.08); } }
    .form-field { width: 100%; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; .half { flex: 1; min-width: 180px; } }
    .url-preview { display: flex; align-items: center; gap: 12px; padding: 10px; background: white; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; }
    .url-thumb { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); display: block; }
    .error-message { color: #c62828; background: #ffebee; padding: 10px 12px; border-radius: 8px; font-size: 13px; }
    .upload-actions { display: flex; gap: 10px; align-items: center; }
    .viewer-note { display: flex; align-items: center; gap: 8px; padding: 14px; background: #fff8e1; color: #795548; border-radius: 8px; font-size: 13px; margin-top: 12px; mat-icon { font-size: 18px; width: 18px; height: 18px; } }

    .error-card { padding: 32px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; mat-icon { font-size: 36px; width: 36px; height: 36px; color: #c62828; } }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .attachments-grid { grid-template-columns: 1fr; }
      .form-row { flex-direction: column; }
      .timeline-body { padding: 12px; }
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
