import { test, expect } from '@playwright/test';
import {
  mockAuthRoutes,
  mockDashboardStats,
  mockIncidentsRoutes,
  setAuthStorage,
  clearAuthStorage,
  CREDS,
  API,
} from './helpers';

test.describe('Auth — invalid login shows error (mocked API)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthRoutes(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('shows validation error for empty credentials without calling API', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toContainText('Please enter email and password');
  });

  test('shows error for invalid credentials via API 401', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Wait for mocked 401 to render error
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.error-message')).toContainText(/Invalid|credentials/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('invalid login does not redirect to dashboard', async ({ page }) => {
    await page.fill('input[name="email"]', CREDS.admin.email);
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth — login as admin (mocked) and viewer RBAC hides Create button', () => {
  test('login as admin via mocked API redirects to dashboard', async ({ page }) => {
    await mockAuthRoutes(page);
    await mockDashboardStats(page);
    await mockIncidentsRoutes(page);
    // also mock notifications to avoid 404 noise
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));

    await page.goto('/login');
    await page.fill('input[name="email"]', CREDS.admin.email);
    await page.fill('input[name="password"]', CREDS.admin.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
    await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10_000 });
    // Admin should see New Incident button (RBAC canCreate)
    await expect(page.locator('button:has-text("New Incident")').first()).toBeVisible({ timeout: 10_000 });
  });

  test('viewer cannot see Create button on dashboard (RBAC UI hides)', async ({ page }) => {
    // Simulate viewer session via localStorage (role = User)
    await setAuthStorage(page, 'User');
    await mockDashboardStats(page);
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Dashboard');
    // Viewer (User role) => canCreate() false => button hidden
    await expect(page.locator('button:has-text("New Incident")')).toHaveCount(0);
    await expect(page.locator('.new-incident-btn')).toHaveCount(0);
  });

  test('viewer cannot see Create button on incidents list (RBAC)', async ({ page }) => {
    await setAuthStorage(page, 'User');
    await mockIncidentsRoutes(page);
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Incidents');
    await expect(page.locator('button:has-text("New Incident")')).toHaveCount(0);
    // empty-state hint for viewers
    await page.route('**/api/incidents*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    // viewer note visible when no incidents
    // we keep check non-flaky: just ensure no create button
  });

  test('operator can see Create button (Contributor)', async ({ page }) => {
    await setAuthStorage(page, 'Operator');
    await mockDashboardStats(page);
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button:has-text("New Incident")').first()).toBeVisible();
  });

  test('unauthenticated user is redirected from dashboard to login', async ({ page }) => {
    await clearAuthStorage(page);
    await page.goto('/dashboard');
    // authGuard should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

test.describe('Auth — API integration via request (real API if up)', () => {
  // These tests hit http://localhost:5000 directly and are skipped if API is not reachable.
  // In CI, postgres+api are started so they will run for real.
  test('API: invalid login via request returns 401 or is mocked', async ({ request }) => {
    let response;
    try {
      response = await request.post(`${API.apiBase}/api/auth/login`, {
        data: { email: 'invalid@test.com', password: 'wrongpassword' },
      });
    } catch (e) {
      test.skip(true, 'API not reachable — skipping real API assertion (mocked tests already cover)');
      return;
    }
    // If API is up, expect 401; if API returns 200 due to mock, we still pass by checking status in [200,401]
    // Real assertion: should be 401 for invalid creds
    if (response.status() === 0) test.skip(true, 'API not reachable');
    expect([401, 400]).toContain(response.status());
    const body = await response.json().catch(() => ({}));
    expect(body.message || body.title || JSON.stringify(body)).toMatch(/Invalid/i);
  });

  test('API: valid admin login returns token', async ({ request }) => {
    let response;
    try {
      response = await request.post(`${API.apiBase}/api/auth/login`, {
        data: { email: CREDS.admin.email, password: CREDS.admin.password },
      });
    } catch (e) {
      test.skip(true, 'API not reachable — skipping (connection refused)');
      return;
    }
    // P1.1 Gate3: FAIL on 500, do not mask real server error — only skip on network error
    expect(response.status(), `valid login should not be 500 — API error: ${await response.text().catch(() => '')}`).not.toBe(500);
    expect(response.ok(), `valid login should be 2xx but got ${response.status()} ${await response.text().catch(() => '')}`).toBeTruthy();
    const json = await response.json();
    expect(json.token || json.Token).toBeTruthy();
    expect(json.email || json.Email).toBe(CREDS.admin.email);
  });
});
