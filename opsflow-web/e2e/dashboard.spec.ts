import { test, expect } from '@playwright/test';
import { mockAuthRoutes, mockDashboardStats, mockIncidentsRoutes, setAuthStorage } from './helpers';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthRoutes(page);
    await mockDashboardStats(page);
    await mockIncidentsRoutes(page);
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
    await setAuthStorage(page, 'Admin');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('should display dashboard with title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10000 });
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.locator('.stat-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.stat-label').first()).toContainText('Total Incidents', { timeout: 10000 });
  });

  test('should display priority alerts section', async ({ page }) => {
    await expect(page.locator('.priority-alert')).toBeVisible({ timeout: 10000 });
  });

  test('should have new incident button', async ({ page }) => {
    const newIncidentBtn = page.locator('button:has-text("New Incident")');
    await expect(newIncidentBtn).toBeVisible({ timeout: 10000 });
  });

  test('should display KPI deep dive section (added in Phase2)', async ({ page }) => {
    await expect(page.locator('.kpi-section')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.kpi-header h2')).toContainText(/KPI Deep Dive/i);
  });
});

test.describe('Dashboard Navigation Links', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthRoutes(page);
    await mockDashboardStats(page);
    await mockIncidentsRoutes(page);
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
    await page.route('**/api/teams*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await setAuthStorage(page, 'Admin');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('should navigate to incidents page', async ({ page }) => {
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }
    await page.click('a[href="/incidents"]');
    await expect(page).toHaveURL('/incidents');
    await expect(page.locator('h1')).toContainText('Incidents');
  });

  test('should navigate to teams page', async ({ page }) => {
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }
    await page.click('a[href="/teams"]');
    await expect(page).toHaveURL('/teams');
  });
});
