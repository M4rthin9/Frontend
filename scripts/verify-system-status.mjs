import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const require = createRequire('F:/Website/Main CIDA/package.json');
const { chromium } = require('playwright');
// Exercise the built service worker: the second document must never overwrite
// the cached booking shell, including when an offline visitor returns home.
const cachedDocuments = new Map([['/index.html', new Response('BOOKING_SHELL')]]);
const handlers = new Map();
let offline = false;
runInNewContext(await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8'), {
  self: {
    location: { origin: 'https://cida.example' },
    addEventListener: (event, handler) => handlers.set(event, handler),
  },
  URL,
  Response,
  fetch: async () => {
    if (offline) throw new Error('offline');
    return new Response('STATUS_DOCUMENT');
  },
  caches: {
    open: async () => ({
      put: async (key, response) => cachedDocuments.set(key, response.clone()),
    }),
    match: async (key) => cachedDocuments.get(key)?.clone(),
  },
});
async function navigateDocument(path) {
  let result;
  handlers.get('fetch')({
    request: { url: `https://cida.example${path}`, method: 'GET', mode: 'navigate' },
    respondWith: (promise) => {
      result = promise;
    },
  });
  return await result;
}
assert.equal(await (await navigateDocument('/system-status.html')).text(), 'STATUS_DOCUMENT');
assert.equal(await cachedDocuments.get('/index.html').clone().text(), 'BOOKING_SHELL');
offline = true;
assert.equal(await (await navigateDocument('/system-status.html')).text(), 'STATUS_DOCUMENT');
assert.equal(await (await navigateDocument('/')).text(), 'BOOKING_SHELL');
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const outputs = fileURLToPath(new URL('../.local/status-preview/', import.meta.url));
await mkdir(outputs, { recursive: true });
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const data = await readFile(path);
    const type =
      {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.webp': 'image/webp',
        '.woff2': 'font/woff2',
      }[extname(path)] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type }).end(data);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(5191, '127.0.0.1', resolve));
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const now = Date.parse('2026-10-12T03:00:00Z');
const ids = ['api', 'database', 'visit', 'table', 'payment', 'files'];
const errors = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      timezoneId: 'Asia/Bangkok',
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.install({ time: new Date(now) });
    let requests = 0;
    let failure = false;
    let snapshot = {
      version: 1,
      checkedAt: new Date(now).toISOString(),
      stale: false,
      services: ids.map((id) => ({ id, state: 'operational' })),
      history: [{ at: now, states: ids.map(() => 'operational') }],
      notice: null,
    };
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') return route.continue();
      assert.equal(
        url.pathname,
        '/api/system-status',
        'Standalone page must not poll app settings/counts',
      );
      requests++;
      if (failure)
        return route.fulfill({
          status: 503,
          body: 'down',
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      await route.fulfill({ json: snapshot, headers: { 'Access-Control-Allow-Origin': '*' } });
    });
    await page.goto('http://127.0.0.1:5191/system-status.html');
    await page.getByText('บริการที่ตรวจสอบพร้อมใช้งาน', { exact: true }).waitFor();
    assert.equal(requests, 1);
    assert.equal(await page.locator('.service').count(), 6);
    assert.equal(await page.locator('.bar.operational').count(), 0, 'No invented passing history');
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    );
    await page.screenshot({ path: resolve(outputs, `status-${width}.png`), fullPage: true });
    snapshot = {
      ...snapshot,
      services: ids.map((id) => ({ id, state: id === 'table' ? 'maintenance' : 'operational' })),
    };
    await page.getByRole('button', { name: 'ตรวจใหม่' }).click();
    await page.getByText('บางบริการปิดชั่วคราว', { exact: true }).waitFor();
    snapshot = {
      ...snapshot,
      services: ids.map((id) => ({ id, state: id === 'database' ? 'outage' : 'operational' })),
      history: [
        {
          at: now - 600_000,
          states: ids.map((id) => (id === 'database' ? 'outage' : 'operational')),
        },
        { at: now, states: ids.map((id) => (id === 'database' ? 'outage' : 'operational')) },
      ],
      notice: { title: '<img src=x onerror=alert(1)>', body: 'ประกาศทดสอบ' },
    };
    await page.getByRole('button', { name: 'ตรวจใหม่' }).click();
    await page.getByText('บางบริการพบปัญหา', { exact: true }).waitFor();
    assert.equal(await page.locator('#notice img').count(), 0, 'Announcements are escaped as text');
    assert.equal(await page.locator('.incident').count(), 1);
    snapshot = {
      ...snapshot,
      services: ids.map((id) => ({ id, state: 'operational' })),
      history: [...snapshot.history, { at: now + 300_000, states: ids.map(() => 'operational') }],
    };
    await page.clock.fastForward(300_000);
    await page.getByText('บริการที่ตรวจสอบพร้อมใช้งาน', { exact: true }).waitFor();
    await page.locator('.incident .badge').getByText('ตรวจผ่านอีกครั้ง', { exact: true }).waitFor();
    const before = requests;
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(600_000);
    assert.equal(requests, before, 'Hidden tabs stop polling');
    snapshot = { ...snapshot, checkedAt: new Date(now + 900_000).toISOString() };
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => document.querySelector('#refresh')?.disabled === false);
    assert.equal(requests, before + 1, 'Returning refreshes once');
    failure = true;
    await page.getByRole('button', { name: 'ตรวจใหม่' }).click();
    await page.getByText('ยังยืนยันสถานะล่าสุดไม่ได้', { exact: true }).waitFor();
    assert.equal(
      await page.locator('.incident').count(),
      1,
      'Failures retain historical observations',
    );
    failure = false;
    snapshot = { ...snapshot, checkedAt: new Date(now - 3600_000).toISOString() };
    await page.getByRole('button', { name: 'ตรวจใหม่' }).click();
    await page.getByText('ยังยืนยันสถานะล่าสุดไม่ได้', { exact: true }).waitFor();
    assert.equal(
      await page.locator('.service .badge.unknown').count(),
      6,
      'Old snapshots cannot show green',
    );
    await page.screenshot({ path: resolve(outputs, `status-stale-${width}.png`), fullPage: true });
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    'Public status browser checks passed: desktop/mobile, real history only, maintenance/outage/recovery, text escaping, failure and stale safety, five-minute polling, hidden tabs, zero app-settings requests.',
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
