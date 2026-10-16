import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire('F:/Website/Main CIDA/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const base = process.env.VISITOR_STATUS_BASE ?? 'http://127.0.0.1:5182';
const errors = [];
const context = await browser.newContext({ viewport: { width: 390, height: 1000 } });
await context.addInitScript(() => {
  if (location.protocol === 'http:' || location.protocol === 'https:')
    localStorage.setItem('lang', 'th');
});
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));

// VIS-98133's public response has this status/count/approval shape. Use synthetic names.
let row = {
  ref: 'VIS-98133',
  status: 'เสร็จสิ้น',
  bookingType: 'prisoner',
  visitDateISO: '2026-10-19',
  visitorName: 'Test main visitor',
  extraVisitorNames: 'Test extra visitor',
  visitorCount: 2,
  totalPersons: 3,
  total: 2500,
};
await context.route('**/*', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (url.origin === base) return route.continue();
  const headers = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': '*',
  };
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
  if (!url.hostname.includes('workers.dev')) return route.abort();
  const body = request.method() === 'POST' ? request.postDataJSON() : {};
  const data =
    body.action === 'lookupByRef'
      ? { status: 'ok', rows: [row] }
      : { status: 'ok', rows: [], notes: [], frontendContent: {}, paymentEnabled: true };
  return route.fulfill({ json: data, headers });
});

const cases = [
  { status: 'เสร็จสิ้น', expected: ['เข้าได้', 'เข้าได้'] },
  { status: 'ชำระแล้ว', expected: ['เข้าได้', 'เข้าได้'] },
  { status: 'done', expected: ['เข้าได้', 'เข้าได้'] },
  { status: 'paid', expected: ['เข้าได้', 'เข้าได้'] },
  { status: 'รอตรวจสอบผู้เข้าร่วม', expected: ['รอตรวจสอบ', 'รอตรวจสอบ'] },
  { status: 'รอชำระเงิน', expected: ['รอตรวจสอบ', 'รอตรวจสอบ'] },
  { status: 'ยกเลิก', expected: ['รอตรวจสอบ', 'รอตรวจสอบ'] },
  { status: 'คืนเงินแล้ว', expected: ['รอตรวจสอบ', 'รอตรวจสอบ'] },
  { status: 'เสร็จสิ้น', visitorApproved: 'no', expected: ['เข้าไม่ได้', 'เข้าได้'] },
  { status: 'ชำระแล้ว', extraVisitorApproved: 'no', expected: ['เข้าได้', 'เข้าไม่ได้'] },
  {
    status: 'เสร็จสิ้น',
    visitorApproved: 'pending',
    extraVisitorApproved: 'pending',
    expected: ['รอตรวจสอบ', 'รอตรวจสอบ'],
  },
  {
    status: 'รอตรวจสอบผู้เข้าร่วม',
    visitorApproved: 'YES',
    extraVisitorApproved: 'yes',
    expected: ['เข้าได้', 'เข้าได้'],
  },
];

try {
  for (const { expected, ...fixture } of cases) {
    row = { ...row, visitorApproved: '', extraVisitorApproved: '', ...fixture };
    await page.goto('about:blank');
    await page.goto(`${base}/#/status?ref=VIS-98133`);
    await page.locator('#status-ref').waitFor();
    assert.deepEqual(await page.locator('li.person .chip').allTextContents(), expected);
  }
  assert.deepEqual(errors, []);
  console.log(
    `Visitor badges passed: ${cases.length} completed, paid, pending and rejected scenarios.`,
  );
} finally {
  await browser.close();
}
