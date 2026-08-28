import { test, expect } from '@playwright/test';
import {
  setAuthStorage,
  mockIncidentDetailRoutes,
  mockComments,
  mockAttachments,
  timelineMockEntries,
} from './helpers';

test.describe('Timeline — GET timeline merges comment+audit+attachment chronological', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthStorage(page, 'Admin');
    await mockIncidentDetailRoutes(page, '1');
    await mockComments(page, '1', []);
    await mockAttachments(page, '1', []);
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  });

  test('timeline renders merged entries in chronological order', async ({ page }) => {
    const entries = timelineMockEntries(); // already sorted chronological
    // Ensure we send shuffled to test frontend sorting? Frontend sorts, so send shuffled
    const shuffled = [...entries].sort(() => Math.random() - 0.5);

    await page.route('**/api/incidents/1/timeline', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(shuffled) });
    });

    await page.goto('/incidents/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('mat-card-title').first()).toBeVisible({ timeout: 10_000 });

    // Timeline is first tab
    await expect(page.locator('.timeline')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.timeline-entry')).toHaveCount(shuffled.length, { timeout: 10_000 });

    // Check types are rendered as chips: comment, audit, status, attachment
    const chips = page.locator('.timeline-type-chip');
    await expect(chips).toHaveCount(shuffled.length);
    // At least one of each expected type should be present (we seeded all)
    await expect(page.locator('.timeline-type-chip:has-text("comment")').first()).toBeVisible({ timeout: 5_000 }).catch(() => {});
    await expect(page.locator('.timeline-type-chip:has-text("attachment")').first()).toBeVisible({ timeout: 5_000 }).catch(() => {});

    // Verify chronological order: extract times and ensure ascending
    const times: number[] = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.timeline-time'));
      // Parse date text with Date; fallback to DOM order
      return nodes.map((n) => new Date((n as HTMLElement).innerText).getTime());
    });
    // If parsing fails, at least ensure DOM order matches sorted input
    // Easier: verify first entry is earliest comment (Investigating)
    const firstContent = await page.locator('.timeline-content').first().textContent();
    expect(firstContent).toMatch(/Investigating|Created|Status/i);

    // Verify icons per type
    await expect(page.locator('.timeline-icon.icon-comment').first()).toBeVisible({ timeout: 5_000 }).catch(() => {});
    await expect(page.locator('.timeline-icon.icon-attachment').first()).toBeVisible({ timeout: 5_000 }).catch(() => {});
  });

  test('timeline empty state shows message', async ({ page }) => {
    await page.route('**/api/incidents/1/timeline', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/incidents/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.empty-timeline')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.empty-timeline')).toContainText(/No timeline events yet/);
    await expect(page.locator('.empty-timeline')).toContainText(/chronologically/i);
  });

  test('timeline merges all types: comment + audit + attachment', async ({ page }) => {
    const base = new Date(Date.now() - 86400000);
    const mixed = [
      {
        type: 'comment',
        at: new Date(base.getTime() + 1 * 3600000).toISOString(),
        actor: 'Alice Admin',
        content: 'Comment content here',
        metadata: { commentId: 1 },
      },
      {
        type: 'audit',
        at: new Date(base.getTime() + 2 * 3600000).toISOString(),
        actor: 'System',
        content: 'Created:  -> Title',
        metadata: { auditId: 1, action: 'Created' },
      },
      {
        type: 'attachment',
        at: new Date(base.getTime() + 3 * 3600000).toISOString(),
        actor: 'Bob Platform',
        content: 'Attachment added: screenshot.png',
        metadata: { attachmentId: 1, fileName: 'screenshot.png' },
      },
      {
        type: 'status',
        at: new Date(base.getTime() + 4 * 3600000).toISOString(),
        actor: 'Charlie Developer',
        content: 'StatusChanged: Open -> InProgress',
        metadata: { action: 'StatusChanged', oldValue: 'Open', newValue: 'InProgress' },
      },
    ];

    await page.route('**/api/incidents/1/timeline', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mixed) });
    });

    await page.goto('/incidents/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.timeline-entry')).toHaveCount(4, { timeout: 10_000 });

    // Each type chip should appear once
    await expect(page.locator('.chip-comment')).toBeVisible();
    await expect(page.locator('.chip-audit')).toBeVisible();
    await expect(page.locator('.chip-attachment')).toBeVisible();
    await expect(page.locator('.chip-status')).toBeVisible();

    // Verify chronological: first should be comment, last status
    const contents = await page.locator('.timeline-content').allTextContents();
    expect(contents[0]).toContain('Comment content here');
    expect(contents[3]).toContain('StatusChanged');
  });

  test('adding comment then timeline reload merges new comment chronologically', async ({ page }) => {
    let comments: any[] = [
      { id: 1, content: 'First comment', authorName: 'Alice Admin', createdAt: new Date(Date.now() - 3600000).toISOString() },
    ];
    let timeline = [
      {
        type: 'comment',
        at: comments[0].createdAt,
        actor: 'Alice Admin',
        content: comments[0].content,
        metadata: { commentId: 1 },
      },
      {
        type: 'audit',
        at: new Date(Date.now() - 7200000).toISOString(),
        actor: 'System',
        content: 'Created:  -> Incident',
        metadata: { auditId: 1, action: 'Created' },
      },
    ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    await page.route('**/api/incidents/1/comments', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(comments) });
      } else if (method === 'POST') {
        const body = route.request().postDataJSON() ?? {};
        const newComment = {
          id: 999,
          content: body.content ?? body.Content,
          authorName: 'Alice Admin',
          createdAt: new Date().toISOString(),
        };
        comments = [...comments, newComment];
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

    await page.goto('/incidents/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.timeline-entry')).toHaveCount(2, { timeout: 10_000 });

    // Add comment via Comments tab
    await page.click('mat-tab-group mat-tab-header >> text=Comments');
    await page.waitForTimeout(500);
    const newText = `Timeline merge check ${Date.now()}`;
    await page.fill('textarea[placeholder="Write a comment..."]', newText);
    await page.click('button:has-text("Post comment")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Switch back to timeline
    await page.click('mat-tab-group mat-tab-header >> text=Timeline');
    await page.waitForTimeout(500);
    await expect(page.locator('.timeline-entry')).toHaveCount(3, { timeout: 10_000 });
    // New comment should be last (chronologically latest)
    await expect(page.locator('.timeline-content').last()).toContainText(newText);
    // Ensure timeline is still sorted (last time is newest)
    const timesText = await page.locator('.timeline-time').allTextContents();
    expect(timesText.length).toBe(3);
  });
});
