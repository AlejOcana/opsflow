// @ts-nocheck - Playwright config uses Node globals (process) not in app tsconfig
import { defineConfig, devices } from '@playwright/test';
declare const process: any;

/**
 * OpsFlow Playwright config — Phase 3 Quality
 * - baseURL: http://localhost:4200 (web)
 * - api:    http://localhost:5000 (api, mocked in most tests, real in CI)
 * - timeout: 30s per test, expect 10s, action 10s, navigation 15s
 * - webServer starts Angular dev server; API is started externally in CI
 *   (see .github/workflows/ci.yml postgres service + dotnet run). For local
 *   dev without API, tests use page.route() mocks so they remain non-flaky.
 *   If you want Playwright to also start the API, replace webServer with the
 *   array form below (commented).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'html',
  outputDir: 'test-results/',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // Web server — starts Angular. API is mocked via page.route() for static tests
  // and hit via APIRequestContext (http://localhost:5000) for integration tests.
  // In CI, the API + Web are started as background processes before `npx playwright test`
  // (see .github/workflows/ci.yml). To avoid double-serve race on :4200 (EADDRINUSE),
  // reuseExistingServer is true in CI — Playwright reuses the already-started `ng serve`.
  // P1.3 Gate3: was `!process.env.CI` (=false in CI) which spawned second server; now true.
  webServer: [
    {
      command: 'npm start',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      // Uncomment to let Playwright also start the API in CI:
      // env: { ASPNETCORE_ENVIRONMENT: 'Development' },
    },
  ],

  // Alternative CI form — starts both API and Web (uncomment if you prefer
  // Playwright to manage both; ensure port 5000 is free and DB is up):
  // webServer: process.env.CI
  //   ? [
  //       {
  //         command: 'dotnet run --project ../opsflow-api/src/OpsFlow.Api.csproj --urls http://localhost:5000',
  //         url: 'http://localhost:5000/health',
  //         reuseExistingServer: false,
  //         timeout: 120_000,
  //         env: {
  //           ASPNETCORE_ENVIRONMENT: 'Development',
  //           ConnectionStrings__DefaultConnection: 'Host=localhost;Port=5432;Database=opsflow;Username=postgres;Password=postgres',
  //           Jwt__Key: 'OpsFlowSecretKey1234567890123456789012345678901234567890',
  //           Jwt__Issuer: 'OpsFlow.Api',
  //           Jwt__Audience: 'OpsFlow.Api',
  //         },
  //       },
  //       {
  //         command: 'npm start',
  //         url: 'http://localhost:4200',
  //         reuseExistingServer: false,
  //         timeout: 120_000,
  //       },
  //     ]
  //   : {
  //       command: 'npm start',
  //       url: 'http://localhost:4200',
  //       reuseExistingServer: true,
  //       timeout: 120_000,
  //     },
});
