import { Page, expect } from '@playwright/test';

/**
 * OpsFlow E2E helpers — Phase 3 Quality
 * Provides lightweight mocks and storage helpers so tests remain non-flaky
 * without requiring a running API+DB. For CI, real API tests use APIRequestContext
 * directly (http://localhost:5000) and will pass when postgres+api are up.
 */

export const API = {
  webBase: 'http://localhost:4200',
  apiBase: 'http://localhost:5000',
  apiPrefix: '/api', // Angular uses relative /api (env.apiUrl)
};

// Demo credentials seeded in DataSeeder.cs
export const CREDS = {
  admin: { email: 'admin@opsflow.io', password: 'Admin123!' },
  manager: { email: 'platformmgr@opsflow.io', password: 'Manager123!' },
  operator: { email: 'dev1@opsflow.io', password: 'Developer123!' },
  // viewer = User role; not seeded by default but we simulate via localStorage mock
  viewerEmail: 'viewer@opsflow.io',
};

// Minimal JWT payload — not validated by UI, only stored
function fakeJwt(role: string) {
  // Use simple base64-like encoding without Node Buffer to keep tsc happy (no @types/node needed)
  // UI only stores token string, never decodes it for e2e; role is encoded in localStorage user object instead.
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'; // {"alg":"HS256","typ":"JWT"}
  const payloadJson = JSON.stringify({ sub: '99', email: 'test@opsflow.io', role, exp: Math.floor(Date.now() / 1000) + 3600 });
  // btoa available in browser and Node 16+ (via globalThis); fallback to simple
  let payload: string;
  try {
    const g: any = globalThis as any;
    if (g.btoa) {
      payload = g.btoa(payloadJson).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } else if (g.Buffer && g.Buffer.from) {
      payload = g.Buffer.from(payloadJson).toString('base64url');
    } else {
      payload = 'eyJzdWIiOiI5OSIsInJvbGUiOiJ' + role;
    }
  } catch {
    payload = 'eyJzdWIiOiI5OSIsInJvbGUiOiJ' + role;
  }
  return `${header}.${payload}.fake-signature`;
}

export type MockRole = 'Admin' | 'Manager' | 'Operator' | 'User';

export function makeUser(role: MockRole, overrides: Partial<Record<string, any>> = {}) {
  const base: Record<MockRole, any> = {
    Admin: { id: '1', email: CREDS.admin.email, fullName: 'Alice Admin', role: 'Admin', username: 'admin' },
    Manager: { id: '2', email: CREDS.manager.email, fullName: 'Bob Platform', role: 'Manager', username: 'platformmgr' },
    Operator: { id: '10', email: CREDS.operator.email, fullName: 'Charlie Developer', role: 'Operator', username: 'dev1' },
    User: { id: '99', email: CREDS.viewerEmail, fullName: 'Victor Viewer', role: 'User', username: 'viewer' },
  };
  return { ...base[role], ...overrides };
}

export function mockLoginResponse(role: MockRole) {
  const user = makeUser(role);
  return {
    token: fakeJwt(role),
    userId: parseInt(user.id, 10),
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: role === 'Admin' ? 3 : role === 'Manager' ? 2 : role === 'Operator' ? 1 : 0,
  };
}

// Store auth in localStorage as AuthService does (token + user JSON)
export async function setAuthStorage(page: Page, role: MockRole) {
  const res = mockLoginResponse(role);
  const user = makeUser(role);
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token: res.token, user }
  );
}

export async function clearAuthStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
}

// Common route mocks
export async function mockAuthRoutes(page: Page) {
  // Login: succeed for admin/manager/operator with seeded passwords, 401 otherwise
  await page.route('**/api/auth/login', async (route) => {
    const req = route.request();
    let body: any = {};
    try {
      body = req.postDataJSON() ?? JSON.parse(req.postData() || '{}');
    } catch {}
    const email = body.email ?? body.Email ?? body.username ?? body.Username ?? '';
    const password = body.password ?? body.Password ?? '';
    const isValid =
      (email === CREDS.admin.email && password === CREDS.admin.password) ||
      (email === CREDS.manager.email && password === CREDS.manager.password) ||
      (email === CREDS.operator.email && password === CREDS.operator.password);
    if (email === CREDS.admin.email || email === CREDS.manager.email || email === CREDS.operator.email) {
      if (isValid) {
        const role: MockRole =
          email === CREDS.admin.email ? 'Admin' : email === CREDS.manager.email ? 'Manager' : 'Operator';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLoginResponse(role)),
        });
        return;
      }
    }
    // Invalid
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Invalid username or password' }),
    });
  });

  // /api/auth/me — return current user if token present
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, username: 'admin', email: CREDS.admin.email, fullName: 'Alice Admin', role: 'Admin' }),
    });
  });
}

export async function mockDashboardStats(page: Page, overrides: Partial<Record<string, any>> = {}) {
  const base = {
    totalIncidents: 12,
    openIncidents: 3,
    inProgressIncidents: 4,
    resolvedIncidents: 3,
    closedIncidents: 2,
    criticalCount: 2,
    highCount: 3,
    mediumCount: 4,
    lowCount: 3,
    totalUsers: 10,
    totalTeams: 3,
    totalOrganizations: 1,
    openBySeverity: [
      { severity: 'Critical', count: 2 },
      { severity: 'High', count: 2 },
      { severity: 'Medium', count: 2 },
      { severity: 'Low', count: 1 },
    ],
    mtbfHours: 42.5,
    leadTimeAvgDays: 3.2,
    slaAtRisk: 1,
    throughputLast7Days: [
      { date: new Date(Date.now() - 6 * 86400000).toISOString(), count: 2 },
      { date: new Date(Date.now() - 5 * 86400000).toISOString(), count: 1 },
      { date: new Date(Date.now() - 4 * 86400000).toISOString(), count: 3 },
      { date: new Date(Date.now() - 3 * 86400000).toISOString(), count: 0 },
      { date: new Date(Date.now() - 2 * 86400000).toISOString(), count: 2 },
      { date: new Date(Date.now() - 1 * 86400000).toISOString(), count: 1 },
      { date: new Date(Date.now()).toISOString(), count: 4 },
    ],
    ...overrides,
  };
  await page.route('**/api/dashboard/stats*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(base) });
  });
  await page.route('**/api/dashboard/trend*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(base.throughputLast7Days ?? []),
    });
  });
}

export function incidentsMockList(count = 3) {
  const now = new Date().toISOString();
  return Array.from({ length: count }, (_, i) => ({
    id: (i + 1).toString(),
    title: `Mock Incident ${i + 1}`,
    status: i === 0 ? 'Open' : i === 1 ? 'InProgress' : 'Resolved',
    priority: i === 0 ? 'Critical' : i === 1 ? 'High' : 'Medium',
    createdBy: { id: '1', email: CREDS.admin.email, fullName: 'Alice Admin', role: 'Admin' },
    assignedTo: i === 0 ? null : { id: '10', email: CREDS.operator.email, fullName: 'Charlie Developer', role: 'Operator' },
    createdAt: now,
    commentCount: 1,
  }));
}

export async function mockIncidentsRoutes(page: Page, list = incidentsMockList()) {
  await page.route('**/api/incidents?*', async (route) => {
    if (route.request().method() === 'GET') {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      let filtered = list;
      if (status) filtered = list.filter((x) => x.status.toLowerCase() === status.toLowerCase());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(filtered) });
    } else {
      await route.continue();
    }
  });
  // exact /api/incidents without query (Angular may call without params)
  await page.route('**/api/incidents', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(list) });
    } else if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() ?? {};
      const created = {
        id: '999',
        title: body.title ?? body.Title ?? 'New Incident',
        description: body.description ?? body.Description ?? '',
        status: 'Open',
        priority: body.priority ?? body.Priority ?? 'Medium',
        organizationId: '1',
        createdBy: { id: '1', email: CREDS.admin.email, fullName: 'Alice Admin', role: 'Admin' },
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
}

export function mockIncidentDetail(id = '1', overrides: any = {}) {
  return {
    id: id.toString(),
    title: `Incident #${id} — Database connection timeout`,
    description: 'Users experiencing timeouts when connecting to the database',
    status: 'Open',
    priority: 'High',
    organizationId: '1',
    createdBy: { id: '1', email: CREDS.admin.email, fullName: 'Alice Admin', role: 'Admin' },
    assignedTo: null,
    team: { id: '1', name: 'Platform Team', memberCount: 3 },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: null,
    resolvedAt: null,
    closedAt: null,
    commentCount: 1,
    ...overrides,
  };
}

export async function mockIncidentDetailRoutes(page: Page, id = '1') {
  const detail = mockIncidentDetail(id);
  await page.route(`**/api/incidents/${id}`, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail) });
    } else if (method === 'PUT') {
      const body = route.request().postDataJSON() ?? {};
      const updated = { ...detail, ...body, status: body.status ?? body.Status ?? detail.status };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
    } else {
      await route.continue();
    }
  });

  // PATCH assign
  await page.route(`**/api/incidents/${id}/assign`, async (route) => {
    const body = route.request().postDataJSON() ?? {};
    const assigneeId = body.assigneeId ?? body.AssigneeId ?? 1;
    const updated = { ...detail, assignedTo: { id: assigneeId.toString(), email: 'dev1@opsflow.io', fullName: 'Charlie Developer', role: 'Operator' } };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
  });

  // PATCH status
  await page.route(`**/api/incidents/${id}/status`, async (route) => {
    const body = route.request().postDataJSON() ?? {};
    const status = body.status ?? body.Status ?? 'InProgress';
    const updated = { ...detail, status };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
  });
}

export function timelineMockEntries() {
  const base = new Date(Date.now() - 86400000);
  return [
    {
      type: 'comment',
      at: new Date(base.getTime() + 1 * 3600000).toISOString(),
      actor: 'Alice Admin',
      content: 'Investigating the issue, will update soon.',
      metadata: { commentId: 1, authorId: 1 },
    },
    {
      type: 'audit',
      at: new Date(base.getTime() + 2 * 3600000).toISOString(),
      actor: 'Bob Platform',
      content: 'Created:  -> Database connection timeout',
      metadata: { auditId: 1, action: 'Created' },
    },
    {
      type: 'status',
      at: new Date(base.getTime() + 3 * 3600000).toISOString(),
      actor: 'Charlie Developer',
      content: 'StatusChanged: Open -> InProgress',
      metadata: { auditId: 2, action: 'StatusChanged', oldValue: 'Open', newValue: 'InProgress' },
    },
    {
      type: 'attachment',
      at: new Date(base.getTime() + 4 * 3600000).toISOString(),
      actor: 'Diana DevOps',
      content: 'Attachment added: screenshot.png',
      metadata: { attachmentId: 1, fileName: 'screenshot.png', url: 'https://example.com/screenshot.png' },
    },
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export async function mockTimeline(page: Page, id = '1', entries = timelineMockEntries()) {
  await page.route(`**/api/incidents/${id}/timeline`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(entries) });
  });
}

export async function mockComments(page: Page, id = '1', comments = [{ id: 1, content: 'Investigating', authorName: 'Alice Admin', createdAt: new Date().toISOString() }]) {
  await page.route(`**/api/incidents/${id}/comments`, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(comments) });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON() ?? {};
      const created = { id: 999, content: body.content ?? body.Content, authorName: 'Alice Admin', createdAt: new Date().toISOString() };
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
    } else {
      await route.continue();
    }
  });
}

export const SAMPLE_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

export async function mockAttachments(page: Page, id = '1', attachments: any[] = []) {
  const defaultAttachments =
    attachments.length === 0
      ? [
          {
            id: 1,
            incidentId: parseInt(id, 10),
            fileName: 'screenshot.png',
            contentType: 'image/png',
            url: SAMPLE_DATA_URI,
            uploadedById: 1,
            uploadedByName: 'Alice Admin',
            uploadedAt: new Date().toISOString(),
            sizeBytes: 1024,
          },
        ]
      : attachments;

  let current = [...defaultAttachments];

  await page.route(`**/api/incidents/${id}/attachments`, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(current) });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON() ?? {};
      const created = {
        id: 999,
        incidentId: parseInt(id, 10),
        fileName: body.FileName ?? body.fileName ?? 'upload.png',
        contentType: body.ContentType ?? body.contentType ?? 'image/png',
        url: body.Url ?? body.url ?? SAMPLE_DATA_URI,
        uploadedById: 1,
        uploadedByName: 'Alice Admin',
        uploadedAt: new Date().toISOString(),
        sizeBytes: body.SizeBytes ?? body.sizeBytes ?? 2048,
      };
      current = [...current, created];
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
    } else {
      await route.continue();
    }
  });

  // DELETE
  await page.route(`**/api/incidents/${id}/attachments/*`, async (route) => {
    if (route.request().method() === 'DELETE') {
      const url = route.request().url();
      const match = url.match(/attachments\/(\d+)/);
      const attId = match ? parseInt(match[1], 10) : null;
      if (attId) current = current.filter((a) => a.id !== attId);
      await route.fulfill({ status: 204, body: '' });
    } else {
      await route.continue();
    }
  });

  return () => current;
}

// RBAC 403 mocks
export async function mockForbiddenOnCreate(page: Page) {
  await page.route('**/api/incidents', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Forbidden' }) });
    } else {
      await route.continue();
    }
  });
}

// Wait helper that respects network idle without hard timeout
export async function waitForStable(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  // small settle for animations
  await page.waitForTimeout(150);
}

// Login via UI helper (fills form, submits, waits)
export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page.locator('.logo-text')).toContainText('OpsFlow');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
}

// Assert viewer cannot see create button
export async function expectNoCreateButton(page: Page) {
  await expect(page.locator('button:has-text("New Incident")')).toHaveCount(0);
  // also check incidents page empty state hint
}

export async function expectCreateButtonVisible(page: Page) {
  await expect(page.locator('button:has-text("New Incident")').first()).toBeVisible({ timeout: 10_000 });
}
