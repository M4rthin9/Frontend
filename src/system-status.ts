import './system-status.css';
import { LINE_ADD_URL } from './lib/line';

type State = 'operational' | 'maintenance' | 'outage' | 'unknown';
interface Sample {
  at: number;
  states: State[];
}
interface Snapshot {
  version: number;
  checkedAt: string | null;
  stale: boolean;
  services: { id: string; state: State }[];
  history: Sample[];
  notice: { title: string; body: string } | null;
}
const definitions = [
  ['api', 'ระบบประมวลผล', 'ตรวจว่าระบบยังทำงานและบันทึกผลตรวจได้'],
  ['database', 'ข้อมูลการจอง', 'ตรวจการอ่านการตั้งค่าที่ระบบจองใช้'],
  ['visit', 'การจองเยี่ยมญาติ', 'ตรวจการเชื่อมต่อข้อมูลและการเปิดบริการ ไม่ใช่จำนวนวันว่าง'],
  ['table', 'การจองโต๊ะ', 'ตรวจการเชื่อมต่อข้อมูลและการเปิดบริการ ไม่ใช่จำนวนโต๊ะว่าง'],
  [
    'payment',
    'การรับแจ้งชำระเงิน',
    'ตรวจการเชื่อมต่อข้อมูลและการเปิดรับชำระ ไม่ได้ทดสอบการโอนเงิน',
  ],
  [
    'files',
    'การเชื่อมต่อไฟล์แนบ',
    'ตรวจการเชื่อมต่อพื้นที่เก็บไฟล์ด้วยคำขออ่าน ไม่ได้อัปโหลดสลิปทดสอบ',
  ],
] as const;
const labels: Record<State, string> = {
  operational: 'ตรวจผ่าน',
  maintenance: 'ปิดบริการชั่วคราว',
  outage: 'พบปัญหา',
  unknown: 'ยังตรวจสอบไม่ได้',
};
const STALE_AFTER = 15 * 60_000;
const INTERVAL = 5 * 60_000;
const HOUR = 60 * 60_000;
const formatter = new Intl.DateTimeFormat('th-TH', {
  timeZone: 'Asia/Bangkok',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const apiBase =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  'https://ccc-backend.pongsinbas.workers.dev';
const el = (id: string) => document.getElementById(id)!;
const text = (id: string, value: string) => {
  el(id).textContent = value;
};
function node(tag: string, className: string, value?: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  if (value) element.textContent = value;
  return element;
}
const contact = el('contact') as HTMLAnchorElement;
contact.href = LINE_ADD_URL;
contact.target = '_blank';
contact.rel = 'noopener noreferrer';
let snapshot: Snapshot | null = null;
let pending = false;
let failed = false;
let controller: AbortController | null = null;

function valid(data: unknown): data is Snapshot {
  if (!data || typeof data !== 'object') return false;
  const value = data as Snapshot;
  return (
    value.version === 1 &&
    typeof value.stale === 'boolean' &&
    (value.checkedAt === null ||
      (typeof value.checkedAt === 'string' && Number.isFinite(Date.parse(value.checkedAt)))) &&
    Array.isArray(value.services) &&
    value.services.length === definitions.length &&
    definitions.every(([id]) =>
      value.services.some((s) => s.id === id && Object.hasOwn(labels, s.state)),
    ) &&
    Array.isArray(value.history) &&
    value.history.length <= 2016 &&
    value.history.every(
      (s) =>
        Number.isFinite(s.at) &&
        Array.isArray(s.states) &&
        s.states.length === definitions.length &&
        s.states.every((state) => Object.hasOwn(labels, state)),
    ) &&
    (value.notice === null ||
      (typeof value.notice?.title === 'string' && typeof value.notice?.body === 'string'))
  );
}
function render(): void {
  const now = Date.now();
  const checkedAt = snapshot?.checkedAt ? Date.parse(snapshot.checkedAt) : null;
  const stale =
    !checkedAt || snapshot?.stale || now - checkedAt > STALE_AFTER || checkedAt > now + INTERVAL;
  const current: State[] = definitions.map(([id]) =>
    failed || stale ? 'unknown' : (snapshot?.services.find((s) => s.id === id)?.state ?? 'unknown'),
  );
  const overall: State = current.includes('outage')
    ? 'outage'
    : current.includes('unknown')
      ? 'unknown'
      : current.includes('maintenance')
        ? 'maintenance'
        : 'operational';
  el('summary').className = `summary ${overall}`;
  text(
    'overall-title',
    {
      operational: 'บริการที่ตรวจสอบพร้อมใช้งาน',
      maintenance: 'บางบริการปิดชั่วคราว',
      outage: 'บางบริการพบปัญหา',
      unknown: 'ยังยืนยันสถานะล่าสุดไม่ได้',
    }[overall],
  );
  text(
    'overall-description',
    {
      operational: 'ผลตรวจการเชื่อมต่อและการเปิดบริการล่าสุดผ่านครบทุกส่วน',
      maintenance: 'ดูรายละเอียดบริการด้านล่างก่อนทำรายการ',
      outage: 'หากทำรายการไม่สำเร็จ กรุณาลองใหม่ภายหลังหรือติดต่อร้าน',
      unknown: 'ผลตรวจยังไม่พร้อม เก่าเกิน 15 นาที หรือเชื่อมต่อไม่ได้',
    }[overall],
  );
  text(
    'checked-at',
    checkedAt ? `ตรวจล่าสุด ${formatter.format(checkedAt)} น.` : 'ยังไม่มีผลตรวจล่าสุด',
  );
  text(
    'connection-note',
    failed
      ? 'เชื่อมต่อข้อมูลสถานะไม่ได้ ผลก่อนหน้ายังคงแสดงเป็นประวัติ'
      : stale
        ? 'กำลังรอผลตรวจใหม่ จึงยังไม่แสดงว่าระบบปกติ'
        : '',
  );
  el('notice').hidden = !snapshot?.notice;
  text('notice-title', snapshot?.notice?.title ?? '');
  text('notice-body', snapshot?.notice?.body ?? '');
  const history = snapshot?.history ?? [];
  const end = Math.ceil(now / (2 * HOUR)) * 2 * HOUR;
  const start = end - 7 * 24 * HOUR;
  const services = el('services');
  services.replaceChildren();
  definitions.forEach(([, name, description], index) => {
    const row = node('article', 'service');
    const heading = node('div', 'service-heading');
    heading.append(
      node('h3', '', name),
      node('span', `badge ${current[index]}`, labels[current[index]]),
    );
    row.append(heading, node('p', 'service-description', description));
    const bars = node('div', 'bars');
    bars.setAttribute('role', 'img');
    bars.setAttribute(
      'aria-label',
      `ประวัติการตรวจ ${name} ย้อนหลัง 7 วัน ช่วงข้อมูลไม่ครบเป็นสีเทา`,
    );
    for (let at = start; at < end; at += 2 * HOUR) {
      const samples = history.filter((s) => s.at >= at && s.at < at + 2 * HOUR);
      const states = samples.map((s) => s.states[index]);
      // A passing observation cannot turn an unobserved two-hour period green.
      const complete = samples.length >= 23;
      const state: State = states.includes('outage')
        ? 'outage'
        : states.includes('maintenance')
          ? 'maintenance'
          : !complete || states.includes('unknown')
            ? 'unknown'
            : 'operational';
      const bar = node('span', `bar ${state}`);
      bar.title = `${formatter.format(at)} – ${formatter.format(at + 2 * HOUR)}: ${labels[state]} (${samples.length} ผลตรวจ)`;
      bars.append(bar);
    }
    const axis = node('div', 'history-axis');
    axis.append(node('span', '', '7 วันที่ผ่านมา'), node('span', '', 'ตอนนี้'));
    row.append(bars, axis);
    services.append(row);
  });
  renderIncidents(history);
}
function renderIncidents(history: Sample[]): void {
  const container = el('incidents');
  container.replaceChildren();
  const events: {
    start: number;
    last: number;
    recovered: number | null;
    ids: Set<number>;
    gap: boolean;
  }[] = [];
  let active: (typeof events)[number] | null = null;
  for (const sample of [...history].sort((a, b) => a.at - b.at)) {
    if (active && sample.at - active.last > INTERVAL * 2) {
      active.gap = true;
      active = null;
    }
    const affected = sample.states.flatMap((state, index) => (state === 'outage' ? [index] : []));
    if (affected.length) {
      if (!active) {
        active = { start: sample.at, last: sample.at, recovered: null, ids: new Set(), gap: false };
        events.push(active);
      }
      affected.forEach((id) => active!.ids.add(id));
      active.last = sample.at;
    } else if (active) {
      if (sample.states.some((s) => s === 'unknown')) active.gap = true;
      else active.recovered = sample.at;
      active = null;
    }
  }
  if (!events.length) {
    container.append(
      node(
        'p',
        'empty-history',
        history.length
          ? 'ไม่พบความผิดปกติในผลตรวจที่บันทึกไว้'
          : 'ยังไม่มีประวัติ ระบบจะเริ่มบันทึกหลังเปิดการตรวจสอบ',
      ),
    );
    return;
  }
  for (const event of events.slice(-10).reverse()) {
    const item = node('article', 'incident');
    const head = node('div', 'incident-head');
    const unresolved = !event.recovered && !event.gap && Date.now() - event.last <= STALE_AFTER;
    head.append(
      node('h3', '', [...event.ids].map((id) => definitions[id][1]).join(' · ')),
      node(
        'span',
        `badge ${event.recovered ? 'operational' : unresolved ? 'outage' : 'unknown'}`,
        event.recovered
          ? 'ตรวจผ่านอีกครั้ง'
          : unresolved
            ? 'ยังพบปัญหา'
            : 'ยังยืนยันการฟื้นตัวไม่ได้',
      ),
    );
    item.append(
      head,
      node(
        'p',
        '',
        `ตรวจพบ ${formatter.format(event.start)} น.${event.recovered ? ` · ตรวจผ่านอีกครั้ง ${formatter.format(event.recovered)} น.` : ` · ผลที่พบปัญหาล่าสุด ${formatter.format(event.last)} น.`}`,
      ),
    );
    container.append(item);
  }
}
async function refresh(): Promise<void> {
  if (pending || document.visibilityState === 'hidden') return;
  pending = true;
  const button = el('refresh') as HTMLButtonElement;
  button.disabled = true;
  controller = new AbortController();
  const timeout = window.setTimeout(() => controller?.abort(), 12_000);
  try {
    const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/system-status`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Status endpoint unavailable');
    const data: unknown = await response.json();
    if (!valid(data)) throw new Error('Invalid status data');
    snapshot = data;
    failed = false;
  } catch {
    failed = true;
  } finally {
    clearTimeout(timeout);
    pending = false;
    button.disabled = false;
    render();
  }
}
el('refresh').addEventListener('click', () => void refresh());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void refresh();
});
window.addEventListener('pagehide', () => controller?.abort());
window.setInterval(() => {
  if (document.visibilityState === 'visible') {
    render();
    void refresh();
  }
}, INTERVAL);
render();
void refresh();
