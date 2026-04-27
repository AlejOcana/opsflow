import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('should display dashboard with title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.locator('.stat-card').first()).toBeVisible();
    await expect(page.locator('.stat-label')).toContainText('Total Incidents');
  });

  test('should display priority alerts section', async ({ page }) => {
    await expect(page.locator('.priority-alert')).toBeVisible();
  });

  test('should have new incident button', async ({ page }) => {
    const newIncidentBtn = page.locator('button:has-text("New Incident")');
    await expect(newIncidentBtn).toBeVisible();
  });
});

test.describe('Dashboard Navigation Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('should navigate to incidents page', async ({ page }) => {
    await page.click('a[href="/incidents"]');
    await expect(page).toHaveURL('/incidents');
    await expect(page.locator('h1')).toContainText('Incidents');
  });

  test('should navigate to teams page', async ({ page }) => {
    await page.click('a[href="/teams"]');
    await expect(page).toHaveURL('/teams');
  });
});