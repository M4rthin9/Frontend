/** Safe storage accessors — never throw (private mode, blocked cookies, etc.). */

/** Where the visitor's cookie-banner decision lives (strictly necessary itself). */
export const CONSENT_STORAGE_KEY = 'ccc_cookie_consent';

/**
 * PDPA "functional" storage: remembered preferences and caches that outlive the
 * tab. Written only once the visitor allows the functional category; until
 * then the app keeps these values in memory for the current visit. Session
 * data the booking, status and chat flows need to work stays outside this list.
 */
export const FUNCTIONAL_STORAGE_KEYS = ['lang', 'ccc_dark_mode', 'cc_prisoner_cache', 'ccc_promo_hidden_on'];

function storedFunctionalConsent(): boolean {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.preferences === true : false;
  } catch {
    return false;
  }
}

// Read straight from storage at load so the gate is right before any store
// writes, whatever order the modules initialise in.
let functionalAllowed = typeof window !== 'undefined' && storedFunctionalConsent();

export function setFunctionalStorageAllowed(allowed: boolean): void {
  functionalAllowed = allowed;
  if (!allowed) {
    for (const key of FUNCTIONAL_STORAGE_KEYS) safeRemoveItem(window.localStorage, key);
  }
}

export function safeGetItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(storage: Storage, key: string, value: string): void {
  if (!functionalAllowed && FUNCTIONAL_STORAGE_KEYS.includes(key)) return;
  try {
    storage.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function safeRemoveItem(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    /* storage unavailable — ignore */
  }
}
