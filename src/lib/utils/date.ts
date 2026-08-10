/** Local (non-UTC) YYYY-MM-DD string — matches visitDateISO on the backend. */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string as a *local* date (never through UTC). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr(): string {
  return toLocalDateStr(new Date());
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toThaiLong(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const TH_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

/** Best-effort Thai Buddhist date ("วันจันทร์ที่ 25 พฤษภาคม พ.ศ. 2569") → ISO. */
export function parseThaiDateToISO(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const match = String(dateStr).match(/(\d+)\s*(?:วัน)?\s*([^\s]+)\s*(?:พ\.ศ\.|พศ\.|)\s*(\d+)/);
  if (match) {
    const day = String(match[1]).padStart(2, '0');
    const monthName = match[2];
    const year = parseInt(match[3], 10) - 543; // Buddhist era → AD
    const month = String(TH_MONTHS.indexOf(monthName) + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(dateStr).trim();
}
