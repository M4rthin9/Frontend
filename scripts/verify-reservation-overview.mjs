import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Use the workspace's existing browser tooling; no application dependency.
const require = createRequire('F:/Website/Main CIDA/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const base = 'http://127.0.0.1:5180';
const outputs = fileURLToPath(new URL('../.local/reservation-preview/', import.meta.url));
await mkdir(outputs, { recursive: true });
const errors = [];
const allFull = Object.fromEntries(
  Array.from({ length: 45 }, (_, n) => [
    new Date(Date.UTC(2026, 9, 12 + n)).toISOString().slice(0, 10),
    20,
  ]),
);

async function fixture({
  width = 1440,
  full = false,
  closed = false,
  scheduled = '',
  settingsError = false,
  countsError = false,
} = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 1100 },
    timezoneId: 'Asia/Bangkok',
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() => localStorage.setItem('lang', 'th'));
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-12T03:00:00Z') });
  const state = {
    counts: full ? { ...allFull } : { '2026-10-14': 20, '2026-10-15': 17 },
    countsError,
    settings: {
      status: 'ok',
      paymentEnabled: true,
      tableBooking: {
        enabled: true,
        maintenance: false,
        perDay: 10,
        holdMinutes: 60,
        seatsPerTable: 5,
        opensAt: scheduled,
        serverTime: '2026-10-12T03:00:00Z',
      },
      publicBooking: { perDay: 20 },
      bookingWindow: {
        open: !closed,
        closedMessage: closed ? 'ปิดเพื่อเตรียมกิจกรรม' : '',
        closedDates: {},
        openDates: [],
        openAt: {},
      },
      promo: { popupEnabled: false, ads: [], notice: { enabled: false, title: '', body: '' } },
      frontendContent: {},
      pdpa: { policyVersion: '1', contact: '' },
    },
  };
  await context.route('**/*', async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (!url.hostname.includes('workers.dev')) return route.abort();
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const body = request.method() === 'POST' ? request.postDataJSON() : {};
    let data = { status: 'ok', rows: [], counts: {}, pushEnabled: false, version: 1, scopes: {} };
    if (url.pathname === '/api/public-settings')
      data = settingsError ? { status: 'error', message: 'unavailable' } : state.settings;
    if (body.action === 'getCountsByDate')
      data = state.countsError
        ? { status: 'error', message: 'unavailable' }
        : { status: 'ok', counts: state.counts };
    if (body.action === 'getTableCountsByDate')
      data = { status: 'ok', counts: {}, perDay: 10, holdMinutes: 60, enabled: true };
    await route.fulfill({ json: data, headers });
  });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const panel = page.locator('#reservation-overview');
  await panel.waitFor();
  await panel.locator('.status').filter({ hasNotText: 'กำลังตรวจสอบ' }).waitFor();
  const cookieReject = page.getByRole('button', { name: 'ปฏิเสธที่ไม่จำเป็น', exact: true });
  if (await cookieReject.isVisible()) await cookieReject.click();
  return { context, page, panel, state };
}

try {
  for (const width of [1440, 390]) {
    const { context, page, panel, state } = await fixture({ width });
    await assert.equal(await panel.locator('.status').innerText(), 'ยังจองได้');
    assert.match(await panel.locator('.current-card').innerText(), /เหลือ 3 รายการ/);
    await panel.getByRole('button', { name: /14 ต.ค./ }).waitFor();
    assert.equal(await panel.getByRole('button', { name: /14 ต.ค./ }).isDisabled(), true);
    assert.match(await panel.locator('.next-time').innerText(), /13 ตุลาคม 2569.*07:00/);
    assert.match(await panel.locator('.opening-dates').innerText(), /2 พ.ย./);
    assert.match(await panel.locator('.rules').innerText(), /20 รายการ\s*ต่อวัน/);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      'responsive viewport has no horizontal overflow',
    );
    await panel.screenshot({
      path: `${outputs}/overview-${width}.png`,
      style: '.fixed { visibility: hidden !important; }',
    });
    await panel.getByRole('button', { name: 'จองโต๊ะ · บุคคลภายนอก', exact: true }).click();
    assert.match(await panel.locator('.current-card').innerText(), /เหลือ 10 โต๊ะ/);
    assert.match(await panel.locator('.rules').innerText(), /60 นาที/);
    assert.match(await panel.locator('.rules').innerText(), /5 คนต่อโต๊ะ/);
    await panel
      .getByRole('button', { name: 'จองเยี่ยม · มีผู้ต้องขังร่วมโต๊ะ', exact: true })
      .click();
    state.countsError = true;
    await panel.getByRole('button', { name: 'อัปเดตสถานะ', exact: true }).click();
    await panel.locator('.status').filter({ hasText: 'ตรวจสอบสถานะไม่ได้' }).waitFor();
    assert.equal(
      await panel.locator('.date-list').count(),
      0,
      'stale availability hidden after refresh failure',
    );
    state.countsError = false;
    state.counts = {};
    await panel.getByRole('button', { name: 'อัปเดตสถานะ', exact: true }).click();
    await panel.locator('.status').filter({ hasText: 'ยังจองได้' }).waitFor();
    await panel.getByRole('button', { name: 'เลือกวันและจอง', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#/booking');
    await context.close();
  }
  for (const scenario of [
    { full: true, expected: 'เต็มแล้ว' },
    { closed: true, expected: 'ปิดรับจองชั่วคราว' },
    { settingsError: true, expected: 'ตรวจสอบสถานะไม่ได้' },
    { countsError: true, expected: 'ตรวจสอบสถานะไม่ได้' },
  ]) {
    const { context, panel } = await fixture(scenario);
    assert.equal(await panel.locator('.status').innerText(), scenario.expected);
    assert.equal(
      await panel.getByRole('button', { name: 'เลือกวันและจอง', exact: true }).isDisabled(),
      true,
    );
    if (scenario.closed)
      assert.match(await panel.locator('.next-time').innerText(), /ยังไม่ประกาศวันเปิดจอง/);
    await context.close();
  }
  const { context, page, panel, state } = await fixture({ scheduled: '2026-10-12T03:01:00Z' });
  await panel.getByRole('button', { name: 'จองโต๊ะ · บุคคลภายนอก', exact: true }).click();
  assert.equal(await panel.locator('.status').innerText(), 'ยังไม่เปิดรับจอง');
  assert.match(await panel.locator('.next-time').innerText(), /12 ตุลาคม 2569.*10:01/);
  // The settings response's server clock must advance with the fixture's clock.
  state.settings.tableBooking.serverTime = '2026-10-12T03:01:01Z';
  await page.clock.fastForward(61_000);
  await panel.locator('.status').filter({ hasText: 'ยังจองได้' }).waitFor();
  const dates = await page.evaluate(async () => {
    const { nextOpening, buildCalendarCells } = await import('/src/lib/utils/calendar.ts');
    const now = new Date('2026-10-12T03:00:00Z');
    const regular = nextOpening(now);
    const far = nextOpening(now, {
      closedDates: {},
      openDates: [],
      openAt: { '2026-11-16': '2026-10-12T04:00:00Z' },
    });
    const special = nextOpening(now, {
      closedDates: {},
      openDates: ['2026-10-18'],
      openAt: { '2026-10-18': '2026-10-12T05:00:00Z' },
    });
    const cells = buildCalendarCells(
      2026,
      9,
      null,
      {},
      20,
      { closedDates: {}, openDates: [] },
      new Date('2026-10-12T18:00:00Z'),
    );
    return {
      regular: regular.at.toISOString(),
      far: far.at.toISOString(),
      special: special.at.toISOString(),
      todayBlocked: cells.find((d) => d.date === '2026-10-13').blocked,
    };
  });
  assert.equal(dates.regular, '2026-10-13T00:00:00.000Z');
  assert.equal(
    dates.far,
    dates.regular,
    'out-of-window scheduled date must not advertise an early opening',
  );
  assert.equal(dates.special, '2026-10-12T05:00:00.000Z');
  assert.equal(dates.todayBlocked, true, 'same-day booking is blocked after Bangkok midnight');
  await context.close();
  const imagePage = await browser.newPage({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 1,
  });
  await imagePage.goto(`${base}/reservation-guide-th.svg`);
  await imagePage.locator('svg').screenshot({
    path: fileURLToPath(new URL('../public/reservation-guide-th.png', import.meta.url)),
  });
  await imagePage.close();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: desktop/mobile, separate quotas, full/closed/scheduled, API failures/retry, opening boundary, booking handoff, Bangkok dates, Thai poster.',
  );
} finally {
  await browser.close();
}
