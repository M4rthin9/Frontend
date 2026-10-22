import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('F:/Website/Main CIDA/package.json');
const { chromium } = require('playwright');
const roots = {
  'dashboard.cida.dpdns.org': fileURLToPath(new URL('../../Dashboard/dist/', import.meta.url)),
  'cida.dpdns.org': fileURLToPath(new URL('../dist/', import.meta.url)),
};
const outputs = fileURLToPath(new URL('../.local/special-opening-preview/', import.meta.url));
await mkdir(outputs, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const errors = [];
const start = new Date('2026-10-22T03:00:00Z');
let settings = {
  payment: { enabled: true },
  promptpay: { billerId: 'private' },
  promo: { popupEnabled: false, ads: [], notice: { enabled: false } },
  bookingWindow: { open: true, closedDates: {}, openDates: [] },
  tableBooking: {
    enabled: true,
    maintenance: false,
    perDay: 10,
    holdMinutes: 60,
    seatsPerTable: 5,
  },
  scheduledOpenings: {},
};
let saves = 0;
async function fixture(width, timezoneId = 'Asia/Bangkok', admin = false) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    timezoneId,
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
  });
  await context.addInitScript((isAdmin) => {
    localStorage.setItem('lang', 'th');
    if (isAdmin) {
      localStorage.setItem('ccc_access_token', 'test-only');
      localStorage.setItem(
        'ccc_user',
        JSON.stringify({ username: 'manager', role: 'Superadmin', displayName: 'Manager' }),
      );
    }
  }, admin);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.install({ time: new Date(start.getTime() - 1000) });
  await page.clock.pauseAt(start);
  await context.route('**/*', async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const root = roots[url.hostname];
    if (root) {
      const path = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      assert.ok(path.startsWith(resolve(root) + sep));
      try {
        return await route.fulfill({
          body: await readFile(path),
          contentType:
            {
              '.html': 'text/html',
              '.js': 'text/javascript',
              '.css': 'text/css',
              '.woff2': 'font/woff2',
              '.webp': 'image/webp',
              '.png': 'image/png',
              '.svg': 'image/svg+xml',
            }[extname(path)] ?? 'application/octet-stream',
        });
      } catch {
        return route.fulfill({ status: 404 });
      }
    }
    if (!url.hostname.includes('workers.dev')) return route.abort();
    const body = request.method() === 'POST' ? JSON.parse(request.postData() || '{}') : {};
    let data = { status: 'ok', rows: [], counts: {}, version: 0, scopes: {}, pushEnabled: false };
    if (body.action === 'getSettings') data = { status: 'ok', settings };
    if (body.action === 'saveSettings') {
      settings = body.settings;
      saves++;
      data = { status: 'ok' };
    }
    if (url.pathname === '/api/public-settings')
      data = {
        status: 'ok',
        paymentEnabled: true,
        tableBooking: {
          ...settings.tableBooking,
          opensAt: '',
          serverTime: new Date(await page.evaluate(() => Date.now())).toISOString(),
        },
        publicBooking: { perDay: 20 },
        bookingWindow: { ...settings.bookingWindow, openAt: settings.scheduledOpenings },
        promo: settings.promo,
        frontendContent: {},
        pdpa: { policyVersion: '1', contact: '' },
      };
    await route.fulfill({
      json: data,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  });
  return { context, page };
}
async function save(page) {
  await Promise.all([
    page.waitForResponse(
      (response) => response.request().postData()?.includes('"action":"saveSettings"') ?? false,
    ),
    page.getByRole('button', { name: 'บันทึกวันที่ เวลา และข้อความ', exact: true }).click(),
  ]);
}
try {
  // The editor's datetime input always means Bangkok time, even on a foreign device.
  const admin = await fixture(1440, 'America/New_York', true);
  await admin.page.goto('https://dashboard.cida.dpdns.org/#/booking-settings');
  const day = admin.page.getByRole('button', { name: /25.*2569: / });
  await day.click();
  await day.click();
  const input = admin.page.locator('#special-opening-2026-10-25');
  await input.fill('2026-10-22T10:01');
  await save(admin.page);
  assert.equal(settings.scheduledOpenings['2026-10-25'], '2026-10-22T03:01:00.000Z');
  assert.ok(settings.bookingWindow.openDates.includes('2026-10-25'));
  assert.equal(settings.promptpay.billerId, 'private');
  assert.equal(settings.tableBooking.perDay, 10);
  await admin.page.reload();
  await input.waitFor();
  assert.equal(await input.inputValue(), '2026-10-22T10:01');
  await input.screenshot({ path: resolve(outputs, 'admin-time.png') });

  for (const width of [1440, 390]) {
    const guest = await fixture(width);
    await guest.page.goto('https://cida.dpdns.org/');
    const panel = guest.page.getByRole('complementary', { name: 'นับถอยหลังเปิดจองรอบพิเศษ' });
    await panel.waitFor();
    assert.match(await panel.innerText(), /10:01/);
    assert.match(await panel.getByRole('timer').innerText(), /00:01:00/);
    await guest.page.clock.fastForward(5000);
    assert.match(await panel.getByRole('timer').innerText(), /00:00:55/);
    assert.equal(
      await guest.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await panel.screenshot({ path: resolve(outputs, `public-${width}.png`) });
    await guest.page.goto('https://cida.dpdns.org/#/booking');
    const calendarDay = guest.page.getByRole('button', { name: '2026-10-25', exact: true });
    await calendarDay.waitFor();
    assert.equal(await calendarDay.getAttribute('aria-disabled'), 'true');
    await guest.page.clock.fastForward(55_000);
    await guest.page.waitForFunction(
      () =>
        document.querySelector('[aria-label="2026-10-25"]')?.getAttribute('aria-disabled') ===
        'false',
    );
    assert.equal(
      await guest.page.getByRole('complementary', { name: 'นับถอยหลังเปิดจองรอบพิเศษ' }).count(),
      0,
    );
    await guest.context.close();
  }

  // Clearing just the time opens the special date immediately.
  await admin.page
    .getByRole('button', { name: 'ยกเลิกนับถอยหลัง / เปิดทันที', exact: true })
    .click();
  await save(admin.page);
  assert.equal(settings.scheduledOpenings['2026-10-25'], undefined);
  assert.ok(settings.bookingWindow.openDates.includes('2026-10-25'));
  const immediate = await fixture(390);
  await immediate.page.goto('https://cida.dpdns.org/#/booking');
  const immediateDay = immediate.page.getByRole('button', { name: '2026-10-25', exact: true });
  await immediateDay.waitFor();
  assert.equal(await immediateDay.getAttribute('aria-disabled'), 'false');
  await immediate.context.close();

  // Removing the special date removes its override; a fresh guest sees no stale banner.
  await admin.page.getByRole('button', { name: /ล้างวันที่.*25/ }).click();
  await save(admin.page);
  assert.equal(settings.scheduledOpenings['2026-10-25'], undefined);
  assert.equal(settings.bookingWindow.openDates.includes('2026-10-25'), false);
  const cleared = await fixture(390);
  await cleared.page.goto('https://cida.dpdns.org/');
  await cleared.page.locator('#reservation-overview').waitFor();
  assert.equal(
    await cleared.page.getByRole('complementary', { name: 'นับถอยหลังเปิดจองรอบพิเศษ' }).count(),
    0,
  );
  assert.equal(saves, 3);
  await cleared.context.close();
  await admin.context.close();
  assert.deepEqual(errors, []);
  console.log(
    'Special openings passed: Bangkok-time save/reload, preserved settings, desktop/mobile countdown, blocked-before/open-at-deadline calendar, and removal.',
  );
} finally {
  await browser.close();
}
