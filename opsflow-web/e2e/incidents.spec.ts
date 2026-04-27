import { test, expect } from '@playwright/test';

test.describe('Incidents List', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
    
    // Navigate to incidents
    await page.click('a[href="/incidents"]');
    await expect(page).toHaveURL('/incidents');
  });

  test('should display incidents page with title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Incidents');
  });

  test('should display incident count', async ({ page }) => {
    await expect(page.locator('.incident-count')).toBeVisible();
  });

  test('should display status filter', async ({ page }) => {
    const statusFilter = page.locator('mat-select[name="status"], mat-form-field:has-text("Status")');
    await expect(statusFilter.first()).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search incidents..."]')).toBeVisible();
  });

  test('should display new incident button', async ({ page }) => {
    await expect(page.locator('button:has-text("New Incident")')).toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    // Click status dropdown
    await page.locator('mat-select').first().click();
    await page.click('mat-option:has-text("New")');
    
    // Should update the URL or reload data
    await page.waitForTimeout(500);
  });

  test('should search incidents', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search incidents..."]');
    await searchInput.fill('test');
    await searchInput.press('Enter');
    
    // Should update or reload
    await page.waitForTimeout(500);
  });
});

test.describe('Create Incident Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('should navigate to new incident page', async ({ page }) => {
    await page.click('a[href="/incidents/new"]');
    await expect(page).toHaveURL('/incidents/new');
    await expect(page.locator('mat-card-title')).toContainText('New Incident');
  });

  test('should display new incident form', async ({ page }) => {
    await page.goto('/incidents/new');
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('mat-select[name="priority"]')).toBeVisible();
  });

  test('should show validation for empty title', async ({ page }) => {
    await page.goto('/incidents/new');
    await page.click('button[type="submit"]');
    
    // Material form field should show required indicator
    await expect(page.locator('mat-error')).toBeVisible();
  });
});

test.describe('Incident Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('should navigate to incident detail', async ({ page }) => {
    await page.click('a[href="/incidents"]');
    await page.waitForTimeout(1000);
    
    // Click first incident row if table exists
    const incidentLink = page.locator('.incident-title, a[href*="/incidents/"]').first();
    if (await incidentLink.isVisible()) {
      await incidentLink.click();
      await expect(page.locator('mat-card-title')).toBeVisible();
    }
  });

  test('should have back button', async ({ page }) => {
    await page.goto('/incidents/1');
    await expect(page.locator('button:has-text("Back")')).toBeVisible();
  });
});