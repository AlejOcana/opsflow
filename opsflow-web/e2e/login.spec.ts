import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form with title', async ({ page }) => {
    await expect(page.locator('.logo-text')).toContainText('OpsFlow');
    await expect(page.locator('.login-subtitle')).toContainText('Sign in to manage your incidents');
  });

  test('should show validation error for empty credentials', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toContainText('Please enter email and password');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error response
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
  });

  test('should login with demo admin credentials', async ({ page }) => {
    await page.click('button:has-text("Admin")');
    await expect(page.locator('input[name="email"]')).toHaveValue('admin@opsflow.io');
    await expect(page.locator('input[name="password"]')).toHaveValue('admin123');
  });

  test('should login and redirect to dashboard', async ({ page }) => {
    await page.click('button:has-text("Admin")');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});

test.describe('Password Visibility Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@opsflow.io');
    await page.fill('input[name="password"]', 'admin123');
  });

  test('should toggle password visibility', async ({ page }) => {
    // Initially password should be hidden
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
    
    // Click visibility toggle
    await page.click('button[mattooltip="Show password"]');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text');
    
    // Toggle back
    await page.click('button[mattooltip="Hide password"]');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
  });
});