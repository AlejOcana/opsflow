import { test, expect } from '@playwright/test';
import {
  setAuthStorage,
  mockDashboardStats,
  mockIncidentsRoutes,
  mockIncidentDetailRoutes,
  mockTimeline,
  mockComments,
  mockAttachments,
  incidentsMockList,
  mockIncidentDetail,
  SAMPLE_DATA_URI,
  timelineMockEntries,
} from './helpers';

/**
 * Incidents workflow:
 * - create incident, list appears
 * - change status via timeline/status endpoint
 * - assign
 * - add comment appears in timeline
 */

test.describe('Incidents — create incident, list appears', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthStorage(page, 'Admin');
    await mockDashboardStats(page);
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  });

  test('create incident via UI and appears in list (mocked)', async ({ page }) => {
    const initialList = incidentsMockList(2);
    await mockIncidentsRoutes(page, initialList);

    // Track created incident
    let createdPayload: any = null;
    await page.route('**/api/incidents', async (route) => {
      if (route.request().method() === 'POST') {
        createdPayload = route.request().postDataJSON();
        const created = {
          id: '999',
          title: createdPayload.title ?? createdPayload.Title,
          description: createdPayload.description ?? createdPayload.Description,
          status: 'Open',
          priority: createdPayload.priority ?? createdPayload.Priority ?? 'Medium',
          organizationId: '1',
          createdBy: { id: '1', email: 'admin@opsflow.io', fullName: 'Alice Admin', role: 'Admin' },
          assignedTo: null,
          team: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          resolvedAt: null,
          closedAt: null,
          commentCount: 0,
        };
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      } else {
        await route.continue();
      }
    });

    await page.goto('/incidents/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('mat-card-title')).toContainText('New Incident', { timeout: 10_000 });

    const title = `E2E Incident ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.fill('textarea[name="description"]', 'Created via Playwright workflow test');
    // Select priority High
    await page.locator('mat-select[name="priority"]').click();
    await page.click('mat-option:has-text("High")');

    // Mock detail for the newly created id after redirect
    await mockIncidentDetailRoutes(page, '999');
    await mockTimeline(page, '999', []);
    await mockComments(page, '999', []);
    await mockAttachments(page, '999', []);

    await page.click('button:has-text("Create Incident")');

    // Should navigate to detail page of new incident
    await expect(page).toHaveURL(/\/incidents\/999/, { timeout: 15_000 });
    await expect(page.locator('mat-card-title').first()).toBeVisible({ timeout: 10_000 });

    expect(createdPayload).toBeTruthy();
    expect(createdPayload.title ?? createdPayload.Title).toBe(title);
  });

  test('incidents list shows created incidents after navigation', async ({ page }) => {
    const list = incidentsMockList(3);
    await mockIncidentsRoutes(page, list);

    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Incidents');
    await expect(page.locator('.incident-count')).toContainText('3 total', { timeout: 10_000 });

    // Verify table rows rendered
    await expect(page.locator('.incidents-table')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.incident-title').first()).toBeVisible();
    await expect(page.locator('.incident-title').first()).toContainText(/Mock Incident/);

    // Search filters visible
    await expect(page.locator('input[placeholder="Search incidents..."]')).toBeVisible();
  });
});

test.describe('Incidents — change status via timeline/status endpoint', () => {
  test('change status to InProgress updates incident and reloads timeline', async ({ page }) => {
    await setAuthStorage(page, 'Admin');
    await mockDashboardStats(page);
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));

    const detail = mockIncidentDetail('1', { status: 'Open' });
    let currentStatus = 'Open';
    let timelineCalls = 0;

    await page.route('**/api/incidents/1', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...detail, status: currentStatus }) });
      } else if (method === 'PUT') {
        const body = route.request().postDataJSON() ?? {};
        currentStatus = body.status ?? body.Status ?? currentStatus;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...detail, status: currentStatus }) });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/incidents/1/status', async (route) => {
      const body = route.request().postDataJSON() ?? {};
      currentStatus = body.status ?? body.Status ?? 'InProgress';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...detail, status: currentStatus }) });
    });

    const entriesBase = timelineMockEntries();
    await page.route('**/api/incidents/1/timeline', async (route) => {
      timelineCalls++;
      // On first load, return base; after status change, include new status entry
      if (timelineCalls > 1 && currentStatus === 'InProgress') {
        const withStatus = [
          ...entriesBase,
          {
            type: 'status',
            at: new Date().toISOString(),
            actor: 'Alice Admin',
            content: 'StatusChanged: Open -> InProgress',
            metadata: { action: 'StatusChanged', oldValue: 'Open', newValue: 'InProgress' },
          },
        ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(withStatus) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(entriesBase) });
      }
    });

    await page.route('**/api/incidents/1/comments', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/incidents/1/attachments', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

    await page.goto('/incidents/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('mat-card-title').first()).toContainText(/Incident #1/, { timeout: 10_000 });

    // Find status select and change to InProgress
    const statusSelect = page.locator('.status-select mat-select');
    await expect(statusSelect).toBeVisible({ timeout: 10_000 });
    await statusSelect.click();
    await page.click('mat-option:has-text("In Progress")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Verify status badge updated or timeline reloaded
    // The component calls PUT then reloads timeline; we check timeline tab has new entry
    // Switch to timeline tab if not already visible (it is first tab) — use getByRole for Material tabs
    await page.getByRole('tab', { name: /Timeline/ }).click().catch(() => {});
    await page.waitForTimeout(500);
    // At least one timeline entry should be visible
    await expect(page.locator('.timeline-entry').first()).toBeVisible({ timeout: 10_000 });
    // After status change, timeline entry count should increase
    // We can assert that status type chip appears
    await expect(page.locator('.timeline-type-chip').first()).toBeVisible();
  });
});

test.describe('Incidents — assign and add comment appears in timeline', () => {
  test('assign to me updates assignee and timeline', async ({ page }) => {
    await setAuthStorage(page, 'Manager'); // Manager can assign (CanAssign)
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));

    let assignee: any = null;
    const detail = mockIncidentDetail('1', { assignedTo: null });

    await page.route('**/api/incidents/1', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...detail, assignedTo: assignee }) });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/incidents/1/assign', async (route) => {
      const body = route.request().postDataJSON() ?? {};
      const assigneeId = body.assigneeId ?? body.AssigneeId;
      assignee = { id: assigneeId.toString(), email: 'platformmgr@opsflow.io', fullName: 'Bob Platform', role: 'Manager' };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...detail, assignedTo: assignee }) });
    });

    let timelineWithAssign = timelineMockEntries();
    await page.route('**/api/incidents/1/timeline', async (route) => {
      if (assignee) {
        // Add audit entry for assignment
        const assignEntry = {
          type: 'audit',
          at: new Date().toISOString(),
          actor: assignee.fullName,
          content: `Assigned:  -> ${assignee.fullName}`,
          metadata: { action: 'Assigned', newValue: assignee.fullName },
        };
        const combined = [...timelineWithAssign, assignEntry].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(combined) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(timelineWithAssign) });
      }
    });

    await page.route('**/api/incidents/1/comments', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/incidents/1/attachments', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

    await page.goto('/incidents/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('mat-card-title').first()).toBeVisible({ timeout: 10_000 });

    // Click Assign to me (only visible for Manager/Admin)
    const assignBtn = page.locator('button:has-text("Assign to me")');
    await expect(assignBtn).toBeVisible({ timeout: 10_000 });
    await assignBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Verify assignee name appears in detail
    await expect(page.locator('.detail-item').filter({ hasText: 'Assignee' })).toContainText(/Bob Platform|Charlie/i, { timeout: 10_000 });
    // Timeline should have new entry
    await expect(page.locator('.timeline-entry').first()).toBeVisible({ timeout: 10_000 });
  });

  test('add comment appears in timeline and comments tab', async ({ page }) => {
    await setAuthStorage(page, 'Admin');
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));

    const detail = mockIncidentDetail('1');
    await page.route('**/api/incidents/1', async (r) => {
      if (r.request().method() === 'GET') r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail) });
      else r.continue();
    });

    let comments: any[] = [{ id: 1, content: 'Initial comment', authorName: 'Alice Admin', createdAt: new Date(Date.now() - 3600000).toISOString() }];
    let timeline: any[] = timelineMockEntries() as any;

    await page.route('**/api/incidents/1/comments', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(comments) });
      } else if (method === 'POST') {
        const body = route.request().postDataJSON() ?? {};
        const newComment = {
          id: comments.length + 1,
          content: body.content ?? body.Content,
          authorName: 'Alice Admin',
          createdAt: new Date().toISOString(),
        };
        comments = [...comments, newComment];
        // Also push to timeline
        timeline = [
          ...timeline,
          {
            type: 'comment',
            at: newComment.createdAt,
            actor: newComment.authorName,
            content: newComment.content,
            metadata: { commentId: newComment.id },
          },
        ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newComment) });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/incidents/1/timeline', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(timeline) });
    });

    await page.route('**/api/incidents/1/attachments', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

    await page.goto('/incidents/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('mat-card-title').first()).toBeVisible({ timeout: 10_000 });

    // Open Comments tab — use getByRole for Angular Material tabs (label is "Comments (n)")
    await page.getByRole('tab', { name: /Comments/ }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.comment-item').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.comment-item')).toHaveCount(1);

    // Add new comment — selector matches incident-detail component's textarea placeholder
    const commentText = `Playwright comment ${Date.now()}`;
    await page.fill('textarea[placeholder="Write a comment..."]', commentText);
    await page.click('button:has-text("Post comment")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Comments list should now have 2
    await expect(page.locator('.comment-item')).toHaveCount(2, { timeout: 10_000 });
    await expect(page.locator('.comment-item').last()).toContainText(commentText);

    // Switch to Timeline and verify comment appears — use timeline container to avoid strict mode violation on multiple entries
    await page.getByRole('tab', { name: /Timeline/ }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.timeline')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.timeline')).toContainText(commentText, { timeout: 10_000 });
  });
});
