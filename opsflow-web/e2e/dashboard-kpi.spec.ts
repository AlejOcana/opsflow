import { test, expect } from '@playwright/test';
import { setAuthStorage, mockDashboardStats } from './helpers';

/**
 * Dashboard — stats load, KPI deep dive renders mtbf/leadTime/sla/throughput, openBySeverity bars
 */

test.describe('Dashboard — stats load and KPI deep dive', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthStorage(page, 'Admin');
    await page.route('**/api/notifications*', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/notifications/unread-count', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  });

  test('stats load renders total and status cards', async ({ page }) => {
    await mockDashboardStats(page, {
      totalIncidents: 12,
      openIncidents: 3,
      inProgressIncidents: 4,
      resolvedIncidents: 3,
      closedIncidents: 2,
      criticalCount: 2,
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10_000 });

    // Stats grid
    await expect(page.locator('.stat-card').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.stat-label').first()).toContainText('Total Incidents');

    // Verify counts are rendered (stat-value)
    const values = await page.locator('.stat-value').allTextContents();
    expect(values.length).toBeGreaterThanOrEqual(5);
    // First card should be 12 (total)
    expect(values.join(' ')).toMatch(/12/);

    // Priority alert section
    await expect(page.locator('.priority-alert')).toBeVisible();
    await expect(page.locator('.alert-item.critical')).toContainText(/2 critical/);
  });

  test('KPI deep dive renders mtbf/leadTime/sla tiles', async ({ page }) => {
    await mockDashboardStats(page, {
      mtbfHours: 42.5,
      leadTimeAvgDays: 3.2,
      slaAtRisk: 2,
      openBySeverity: [
        { severity: 'Critical', count: 2 },
        { severity: 'High', count: 3 },
        { severity: 'Medium', count: 2 },
        { severity: 'Low', count: 1 },
      ],
      throughputLast7Days: [
        { date: new Date().toISOString(), count: 4 },
        { date: new Date(Date.now() - 86400000).toISOString(), count: 2 },
      ],
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.kpi-section')).toBeVisible({ timeout: 10_000 });

    // Header
    await expect(page.locator('.kpi-header h2')).toContainText('KPI Deep Dive');
    await expect(page.locator('.kpi-subtitle')).toContainText(/MTBF|lead time/i);

    // Tiles: MTBF, Lead time, SLA
    await expect(page.locator('.kpi-tile').first()).toBeVisible({ timeout: 10_000 });
    const mtbfTile = page.locator('.kpi-tile').filter({ hasText: 'MTBF' });
    await expect(mtbfTile).toBeVisible();
    await expect(mtbfTile.locator('.tile-value')).toContainText('42.5');
    await expect(mtbfTile.locator('.tile-label')).toContainText('MTBF');

    const leadTile = page.locator('.kpi-tile').filter({ hasText: 'Lead time' });
    await expect(leadTile).toBeVisible();
    await expect(leadTile.locator('.tile-value')).toContainText('3.2');

    const slaTile = page.locator('.kpi-tile').filter({ hasText: 'SLA at risk' });
    await expect(slaTile).toBeVisible();
    await expect(slaTile.locator('.tile-value')).toContainText('2');
    // slaAtRisk >0 should have warn class and chip
    await expect(slaTile).toHaveClass(/warn/);
    await expect(page.locator('.warn-chip')).toContainText('Action needed');
  });

  test('openBySeverity bars render per severity with correct counts', async ({ page }) => {
    const openBySeverity = [
      { severity: 'Critical', count: 5 },
      { severity: 'High', count: 3 },
      { severity: 'Medium', count: 2 },
      { severity: 'Low', count: 0 },
    ];
    await mockDashboardStats(page, { openBySeverity });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.severity-card')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.severity-card mat-card-title')).toContainText('Open by Severity');

    // Each severity row should be visible with label and count
    for (const item of openBySeverity) {
      const row = page.locator('.severity-row').filter({ hasText: item.severity });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row.locator('.severity-count')).toContainText(item.count.toString());
      // bar-fill should have width % (max is 5 => 100%, 3 => 60%)
      // Low count 0 results in width 0% which Playwright considers hidden (zero size), so check attached + width instead
      const bar = row.locator('.bar-fill');
      if (item.count === 0) {
        await expect(bar).toBeAttached();
        const width = await bar.evaluate((el) => (el as HTMLElement).style.width);
        expect(width).toBe('0%');
      } else {
        await expect(bar).toBeVisible();
        // Check that bar has style width
        const width = await bar.evaluate((el) => (el as HTMLElement).style.width);
        expect(width).toMatch(/%$/);
      }
    }

    // Ensure 4 rows (all severities) rendered
    await expect(page.locator('.severity-row')).toHaveCount(4);
  });

  test('throughput last 7 days renders bars with dates', async ({ page }) => {
    const throughputLast7Days = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
      count: i % 2 === 0 ? 2 : 5,
    }));
    await mockDashboardStats(page, { throughputLast7Days });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.throughput-card')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.throughput-card mat-card-title')).toContainText('Throughput');

    // Verify 7 bars
    await expect(page.locator('.throughput-bar-col')).toHaveCount(7, { timeout: 10_000 });
    // Each bar should have count and date
    const counts = await page.locator('.bar-count').allTextContents();
    expect(counts.length).toBe(7);
    expect(counts.join(',')).toMatch(/2|5/);

    const dates = await page.locator('.bar-date').allTextContents();
    expect(dates.length).toBe(7);
    // Dates should be non-empty short format
    for (const d of dates) {
      expect(d.trim().length).toBeGreaterThan(0);
    }

    // Bar height should be % based on max (5)
    const firstBar = page.locator('.throughput-bar').first();
    const heightPct = await firstBar.evaluate((el) => (el as HTMLElement).style.height);
    expect(heightPct).toMatch(/%$/);
  });

  test('KPI section handles empty state gracefully', async ({ page }) => {
    await mockDashboardStats(page, {
      openBySeverity: [],
      throughputLast7Days: [],
      mtbfHours: 0,
      leadTimeAvgDays: 0,
      slaAtRisk: 0,
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.kpi-empty').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.kpi-empty').first()).toContainText(/No open incidents/);
    // Second empty for throughput
    await expect(page.locator('.kpi-empty').nth(1)).toContainText(/No throughput data/);

    // SLA at risk 0 should show "All within SLA" not warn
    const slaTile = page.locator('.kpi-tile').filter({ hasText: 'SLA at risk' });
    await expect(slaTile).not.toHaveClass(/warn/);
    await expect(slaTile).toContainText('All within SLA');
  });

  test('dashboard stats survive API PascalCase keys (backend compat)', async ({ page }) => {
    // Simulate backend returning PascalCase (TotalIncidents etc.) — frontend computed handles both
    await page.route('**/api/dashboard/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          TotalIncidents: 10,
          OpenIncidents: 2,
          InProgressIncidents: 3,
          ResolvedIncidents: 3,
          ClosedIncidents: 2,
          CriticalCount: 1,
          HighCount: 2,
          MediumCount: 3,
          LowCount: 4,
          TotalUsers: 10,
          TotalTeams: 3,
          TotalOrganizations: 1,
          OpenBySeverity: [{ Severity: 'Critical', Count: 1 }, { Severity: 'High', Count: 2 }],
          MtbfHours: 30.1,
          LeadTimeAvgDays: 2.5,
          SlaAtRisk: 0,
          ThroughputLast7Days: [{ Date: new Date().toISOString(), Count: 2 }],
        }),
      });
    });
    await page.route('**/api/dashboard/trend*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Should still render without crash
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('.kpi-section')).toBeVisible({ timeout: 10_000 });
  });
});
