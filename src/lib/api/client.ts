import { ApiError } from './errors';

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  'https://ccc-backend.pongsinbas.workers.dev';

export const API_TIMEOUT = 30000;

export interface ApiResult {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

interface CallOptions {
  timeoutMs?: number;
}

/**
 * POST / with the legacy `{ action, ...body }` protocol used by the
 * Cloudflare Worker backend (ccc-backend).
 */
export async function callAction<T extends object = ApiResult>(
  action: string,
  body: Record<string, unknown> = {},
  opts: CallOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? API_TIMEOUT);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('เซิร์ฟเวอร์ไม่ตอบกลับภายในเวลาที่กำหนด — กรุณาลองใหม่อีกครั้ง');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  const data = (await res.json().catch(() => ({}))) as ApiResult;
  if (typeof data !== 'object' || data === null || !('status' in data)) {
    throw new ApiError('การตอบสนองจากเซิร์ฟเวอร์ไม่ถูกต้อง');
  }
  return data as T;
}

/** GET a REST alias endpoint (e.g. /api/prisoners). */
export async function callGet<T extends object = ApiResult>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_BASE}${path}${qs}`, {
    method: 'GET',
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as ApiResult;
  if (typeof data !== 'object' || data === null || !('status' in data)) {
    throw new ApiError('การตอบสนองจากเซิร์ฟเวอร์ไม่ถูกต้อง');
  }
  return data as T;
}

/** Throw if the backend replied with status !== 'ok'. */
export function assertOk<T extends { status?: string }>(data: T): void {
  if (data?.status !== 'ok') {
    throw new ApiError(String((data as { message?: unknown })?.message ?? 'Unknown server error'));
  }
}
