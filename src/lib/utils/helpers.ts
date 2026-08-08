import type { Prisoner } from '../api/types';

/** Trailing-edge debounce — fires `ms` after the last call. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
}

export function escHtml(str: string | null | undefined): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Mask a prisoner's surname for privacy (keep first name + 4 chars of last). */
export function maskPrisonerName(name: string | null | undefined): string {
  if (!name || name === '—') return name ?? '';
  const trimmed = name.trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > 0) {
    const firstName = trimmed.substring(0, lastSpace + 1);
    const lastName = trimmed.substring(lastSpace + 1);
    return firstName + lastName.slice(0, 4);
  }
  return trimmed.length > 3 ? trimmed.slice(0, 3) : trimmed;
}

/**
 * Rebuild the minified getPrisoners payload (array of arrays) back into the
 * {prisonerName, prisonerId, wing, status, vinaiDate} objects the UI expects.
 * Legacy payloads (array of objects) pass through unchanged.
 */
export function rebuildPrisonerObjects(rows: string[][] | Prisoner[]): Prisoner[] {
  if (!Array.isArray(rows)) return [];
  if (rows.length > 0 && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
    return rows as Prisoner[];
  }
  return (rows as string[][]).map((r) => ({
    prisonerName: String(r[0] ?? ''),
    prisonerId: String(r[1] ?? ''),
    wing: String(r[2] ?? ''),
    status: String(r[3] ?? ''),
    vinaiDate: String(r[4] ?? ''),
  }));
}

/** Generate a unique VIS-xxxxx ref avoiding the given existing refs. */
export function generateUniqueRef(existingRefs: string[] = []): string {
  const existing = new Set(existingRefs.map((r) => String(r).trim()));
  let ref = '';
  let attempts = 0;
  do {
    ref = 'VIS-' + Math.floor(10000 + Math.random() * 90000);
    attempts++;
  } while (existing.has(ref) && attempts < 100);
  return ref;
}
