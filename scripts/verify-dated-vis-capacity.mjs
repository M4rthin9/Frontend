import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire('F:/Website/Main CIDA/package.json');
const { chromium } = require('playwright');
const root = new URL('../dist/', import.meta.url);
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const errors = [];
try {
  for (const timezoneId of ['Asia/Bangkok', 'America/Los_Angeles']) {
    const context = await browser.newContext({
      timezoneId,
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-11-05T03:00:00Z') });
    await context.addInitScript(() => localStorage.setItem('lang', 'th'));
    await context.route('**/*', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.hostname === 'cida.dpdns.org') {
        const path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        try {
          const body = await readFile(new URL(path, root));
          return route.fulfill({
            body,
            contentType: path.endsWith('.js')
              ? 'application/javascript'
              : path.endsWith('.css')
                ? 'text/css'
                : path.endsWith('.html')
                  ? 'text/html'
                  : 'application/octet-stream',
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
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const action =
        req.method() === 'POST' ? req.postDataJSON()?.action : url.searchParams.get('action');
      let data = { status: 'ok', rows: [], counts: {}, pushEnabled: false };
      if (url.pathname === '/api/public-settings')
        data = {
          status: 'ok',
          publicBooking: { perDay: 25, previousPerDay: 20, effectiveFrom: '2026-11-09' },
          tableBooking: {
            enabled: true,
            maintenance: false,
            perDay: 10,
            seatsPerTable: 5,
            holdMinutes: 60,
          },
          bookingWindow: { open: true, closedDates: {}, openDates: [], openAt: {} },
          promo: { popupEnabled: false, ads: [], notice: { enabled: false } },
        };
      if (action === 'getCountsByDate')
        data.counts = { '2026-11-06': 20, '2026-11-09': 24, '2026-11-10': 25 };
      if (action === 'getTableCountsByDate')
        data = { status: 'ok', counts: { '2026-11-09': 8 }, perDay: 10, holdMinutes: 60 };
      return route.fulfill({ json: data, headers });
    });
    await page.goto('https://cida.dpdns.org', { waitUntil: 'networkidle' });
    const overview = page.locator('#reservation-overview');
    const ninth = overview.getByRole('button', { name: /จันทร์ 9 พ.ย./ });
    await ninth.waitFor();
    assert.equal(await ninth.isDisabled(), false);
    assert.match(await ninth.innerText(), /1 รายการ/);
    assert.equal(await overview.getByRole('button', { name: /ศุกร์ 6 พ.ย./ }).isDisabled(), true);
    assert.equal(await overview.getByRole('button', { name: /10 พ.ย./ }).isDisabled(), true);
    await page.goto('https://cida.dpdns.org/#/booking', { waitUntil: 'networkidle' });
    const day = (date) => page.locator(`.day-btn[aria-label="${date}"]`);
    await day('2026-11-09').waitFor();
    assert.equal(await day('2026-11-06').getAttribute('aria-disabled'), 'true');
    assert.match(await day('2026-11-09').innerText(), /24\/25/);
    assert.equal(await day('2026-11-09').getAttribute('aria-disabled'), 'false');
    assert.equal(await day('2026-11-10').getAttribute('aria-disabled'), 'true');
    await day('2026-11-09').click();
    assert.match(await page.locator('.quota-info').innerText(), /25\/25/);
    if (timezoneId === 'Asia/Bangkok') {
      const output = new URL('../.local/dated-vis-capacity/', import.meta.url);
      await mkdir(output, { recursive: true });
      await page
        .locator('.calendar-wrap')
        .screenshot({ path: fileURLToPath(new URL('calendar.png', output)) });
    }
    await page.goto('https://cida.dpdns.org/#/table-booking', { waitUntil: 'networkidle' });
    await day('2026-11-09').waitFor();
    assert.match(await day('2026-11-09').innerText(), /8\/10/);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    'VIS calendar and home availability honor 20/25 visit-date limits in Bangkok and Los Angeles; TBL remains 10.',
  );
} finally {
  await browser.close();
}
