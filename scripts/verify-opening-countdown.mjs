import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const require = createRequire('F:/Website/Main CIDA/package.json');
const { chromium } = require('playwright');
const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const outputs = fileURLToPath(new URL('../.local/countdown-preview/', import.meta.url));
await mkdir(outputs, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const errors = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 1100 },
      timezoneId: 'Asia/Bangkok',
      serviceWorkers: 'block',
    });
    await context.addInitScript(() => localStorage.setItem('lang', 'th'));
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const at = Date.parse('2026-10-12T03:00:00Z');
    await page.clock.install({ time: new Date(at - 1000) });
    await page.clock.pauseAt(new Date(at));
    let requests = 0,
      closed = false,
      settingsError = false;
    const settings = {
      status: 'ok',
      paymentEnabled: true,
      tableBooking: {
        enabled: true,
        maintenance: false,
        perDay: 10,
        holdMinutes: 60,
        seatsPerTable: 5,
        opensAt: '2026-10-12T03:01:00Z',
      },
      publicBooking: { perDay: 20 },
      bookingWindow: { open: true, closedDates: {}, openDates: [], openAt: {} },
      promo: { popupEnabled: false, ads: [], notice: { enabled: false, title: '', body: '' } },
      frontendContent: {},
      pdpa: { policyVersion: '1', contact: '' },
    };
    await context.route('**/*', async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.hostname === 'cida.dpdns.org') {
        const path = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
        assert.ok(path.startsWith(root + sep));
        try {
          await route.fulfill({
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
          await route.fulfill({ status: 404 });
        }
        return;
      }
      if (!url.hostname.includes('workers.dev')) return route.abort();
      requests++;
      const action =
        request.method() === 'POST' ? JSON.parse(request.postData() ?? '{}').action : '';
      let data = { status: 'ok', counts: {} };
      if (url.pathname === '/api/public-settings') {
        if (settingsError)
          return route.fulfill({
            status: 503,
            body: '{}',
            headers: { 'Access-Control-Allow-Origin': '*' },
          });
        data = {
          ...settings,
          bookingWindow: { ...settings.bookingWindow, open: !closed },
          tableBooking: {
            ...settings.tableBooking,
            serverTime: new Date(await page.evaluate(() => Date.now())).toISOString(),
          },
        };
      }
      if (action === 'getPushPublicKey') data = { status: 'ok', pushEnabled: false };
      await route.fulfill({ json: data, headers: { 'Access-Control-Allow-Origin': '*' } });
    });
    await page.goto('https://cida.dpdns.org/');
    const panel = page.locator('#reservation-overview');
    const timer = panel.getByRole('timer');
    await timer.waitFor();
    const values = () => timer.locator('strong').allTextContents();
    assert.deepEqual(await values(), ['00', '21', '00', '00']);
    assert.deepEqual(await timer.locator('.countdown-part span').allTextContents(), [
      'วัน',
      'ชั่วโมง',
      'นาที',
      'วินาที',
    ]);
    const before = requests;
    await page.clock.fastForward(1000);
    assert.deepEqual(await values(), ['00', '20', '59', '59']);
    await page.clock.fastForward(4000);
    assert.deepEqual(await values(), ['00', '20', '59', '55']);
    assert.equal(requests, before, 'Second ticks must not make any API requests');
    await panel.getByRole('button', { name: 'จองโต๊ะ · บุคคลภายนอก', exact: true }).click();
    assert.deepEqual(await values(), ['00', '00', '00', '55']);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await panel
      .locator('.next-card')
      .screenshot({ path: resolve(outputs, `next-opening-${width}.png`) });
    await page.clock.fastForward(55_000);
    await panel.locator('.status').filter({ hasText: 'ยังจองได้' }).waitFor();
    assert.deepEqual(
      await values(),
      ['00', '20', '59', '00'],
      'Reached TBL opening switches to the next real opening',
    );
    assert.doesNotMatch(await timer.innerText(), /NaN|-\d/);
    settingsError = true;
    await panel.getByRole('button', { name: 'อัปเดตสถานะ', exact: true }).click();
    await panel.locator('.status').filter({ hasText: 'ตรวจสอบสถานะไม่ได้' }).waitFor();
    assert.equal(
      await panel.getByRole('timer').count(),
      0,
      'Unverified settings suppress the countdown',
    );
    settingsError = false;
    closed = true;
    await panel.getByRole('button', { name: 'อัปเดตสถานะ', exact: true }).click();
    await panel.locator('.next-time').filter({ hasText: 'ยังไม่ประกาศวันเปิดจอง' }).waitFor();
    assert.equal(
      await panel.getByRole('timer').count(),
      0,
      'Closed/unannounced bookings have no invented countdown',
    );
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    'Countdown passed: desktop/mobile, Thai units, clock rollover, zero API calls on ticks, scheduled TBL opening, next opening, settings failures, closed dates.',
  );
} finally {
  await browser.close();
}
