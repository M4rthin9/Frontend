import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

const require = createRequire('F:/Website/Main CIDA/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const errors = [];
const mime = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};
try {
  for (const { width, closed, denied } of [
    { width: 1440, closed: false, denied: false },
    { width: 390, closed: true, denied: false },
    { width: 390, closed: false, denied: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      serviceWorkers: 'block',
    });
    await context.addInitScript(
      ({ denied }) => {
        localStorage.setItem('lang', 'th');
        const subscription = {
          endpoint: 'https://example.test/browser',
          toJSON: () => ({ keys: { p256dh: 'browser-key', auth: 'browser-auth' } }),
        };
        const registration = { pushManager: { getSubscription: async () => subscription } };
        Object.defineProperty(navigator, 'serviceWorker', {
          configurable: true,
          value: { ready: Promise.resolve(registration), register: async () => registration },
        });
        Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} });
        const notification = {
          permission: 'default',
          async requestPermission() {
            notification.permission = denied ? 'denied' : 'granted';
            return notification.permission;
          },
        };
        Object.defineProperty(window, 'Notification', { configurable: true, value: notification });
      },
      { denied },
    );
    const subscriptions = [];
    let settingsRequests = 0;
    await context.route('**/*', async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.hostname === 'cida.dpdns.org') {
        const path = resolve(
          root,
          '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)),
        );
        assert.ok(path.startsWith(resolve(root) + sep));
        try {
          return route.fulfill({
            body: await readFile(path),
            contentType: mime[path.slice(path.lastIndexOf('.'))] ?? 'application/octet-stream',
          });
        } catch {
          return route.fulfill({ status: 404, body: '' });
        }
      }
      if (!url.hostname.includes('workers.dev')) return route.abort();
      const headers = {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
      };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const body = request.method() === 'POST' ? request.postDataJSON() : {};
      let data = { status: 'ok', counts: {}, rows: [], pushEnabled: false, version: 1, scopes: {} };
      if (url.pathname === '/api/public-settings') settingsRequests++;
      if (url.pathname === '/api/public-settings')
        data = {
          status: 'ok',
          paymentEnabled: true,
          tableBooking: {
            enabled: true,
            maintenance: false,
            perDay: 10,
            holdMinutes: 60,
            seatsPerTable: 5,
            opensAt: '',
            serverTime: new Date().toISOString(),
          },
          publicBooking: { perDay: 20 },
          bookingWindow: { open: !closed, closedDates: {}, openDates: [], openAt: {} },
          promo: { popupEnabled: false, ads: [], notice: { enabled: false, title: '', body: '' } },
          frontendContent: {},
          pdpa: { policyVersion: '1', contact: '' },
        };
      if (body.action === 'getPushPublicKey')
        data = {
          status: 'ok',
          pushEnabled: true,
          publicKey: Buffer.alloc(65, 1).toString('base64url'),
        };
      if (body.action === 'subscribe') {
        subscriptions.push(body);
        data = { status: 'ok' };
      }
      await route.fulfill({ json: data, headers });
    });
    const page = await context.newPage();
    await page.clock.install();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('https://cida.dpdns.org/', { waitUntil: 'domcontentloaded' });
    const panel = page.locator('#reservation-overview');
    const enable = panel.getByRole('button', {
      name: 'แจ้งเตือนเปิดจองและเมื่อโต๊ะว่างอีกครั้ง',
      exact: true,
    });
    await enable.waitFor();
    assert.match(await panel.innerText(), /การแจ้งเตือนไม่ใช่การกันโต๊ะ/);
    const rejectCookie = page.getByRole('button', { name: 'ปฏิเสธที่ไม่จำเป็น', exact: true });
    if (await rejectCookie.isVisible()) await rejectCookie.click();
    await enable.click();
    if (denied) {
      await panel
        .getByText('เบราว์เซอร์บล็อกการแจ้งเตือนไว้ เปิดได้ที่การตั้งค่าเว็บไซต์ของเบราว์เซอร์', {
          exact: true,
        })
        .waitFor();
      assert.equal(subscriptions.length, 0, 'permission refusal sends no subscription');
    } else {
      await panel.getByText(/เปิดการแจ้งเตือนแล้ว/).waitFor();
      assert.equal(subscriptions.length, 1);
      assert.equal(subscriptions[0].openingAlerts, true);
      assert.equal(subscriptions[0].ref, undefined);
      assert.equal(subscriptions[0].endpoint, 'https://example.test/browser');
      assert.match(await panel.innerText(), /เมื่อโต๊ะที่เต็มกลับมาว่างอีกครั้ง/);
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    if (width === 1440) {
      const initialRequests = settingsRequests;
      await page.clock.fastForward(15000);
      assert.equal(
        settingsRequests,
        initialRequests,
        'settings are no longer polled every 15 seconds',
      );
      const nextResponse = page.waitForResponse((response) =>
        response.url().includes('/api/public-settings'),
      );
      await page.clock.fastForward(45000);
      await nextResponse;
      assert.equal(
        settingsRequests,
        initialRequests + 1,
        'one settings request per visible minute',
      );
      await page.evaluate(() =>
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }),
      );
      await page.clock.fastForward(180000);
      assert.equal(
        settingsRequests,
        initialRequests + 1,
        'hidden tabs perform no settings polling',
      );
      const restoredResponse = page.waitForResponse((response) =>
        response.url().includes('/api/public-settings'),
      );
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await restoredResponse;
      assert.equal(
        settingsRequests,
        initialRequests + 2,
        'focus refresh is shared rather than duplicated',
      );
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: production bundle opt-in on desktop/mobile, closed gate signup, Thai consent, permission refusal, subscription payload; no live notifications.',
  );
} finally {
  await browser.close();
}
