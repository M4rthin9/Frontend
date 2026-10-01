import { recordCookieConsent, type CookieConsentRecord } from '../api/endpoints';
import { i18n } from '../i18n/i18n.svelte';
import { CONSENT_STORAGE_KEY, safeGetItem, safeSetItem, setFunctionalStorageAllowed } from '../utils/storage';
import { ui } from './ui.svelte';

/** A decision is asked for again after a year, as well as on a policy change. */
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

interface StoredConsent {
  id: string;
  version: string;
  preferences: boolean;
  analytics: boolean;
  /** ISO instant of the decision. */
  at: string;
}

function load(): StoredConsent | null {
  try {
    const raw = safeGetItem(window.localStorage, CONSENT_STORAGE_KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (!v || typeof v.id !== 'string' || typeof v.version !== 'string') return null;
    return { id: v.id, version: v.version, preferences: v.preferences === true, analytics: v.analytics === true, at: String(v.at) };
  } catch {
    return null;
  }
}

/**
 * PDPA cookie consent. The decision lives in the browser (that record is
 * strictly necessary); every decision is also logged server-side as evidence.
 */
class ConsentStore {
  record = $state<StoredConsent | null>(load());
  settingsOpen = $state(false);

  /** Answered for the current policy version and not yet a year old. */
  get decided(): boolean {
    const r = this.record;
    if (!r || Date.now() - new Date(r.at).getTime() > MAX_AGE_MS) return false;
    // Until the server answers, trust the stored version so a returning
    // visitor does not see the banner flash on every load.
    return !ui.publicSettingsLoaded || r.version === ui.publicSettings.pdpa.policyVersion;
  }

  /** Banner only once settings are in, so it is never shown for a stale version. */
  get showBanner(): boolean {
    return ui.publicSettingsLoaded && !this.decided && !this.settingsOpen;
  }

  allows(category: 'preferences' | 'analytics'): boolean {
    return this.record?.[category] === true;
  }

  acceptAll(): void {
    this.commit('accept_all', true, true);
  }

  rejectAll(): void {
    this.commit('reject_all', false, false);
  }

  save(preferences: boolean, analytics: boolean): void {
    this.commit('custom', preferences, analytics);
  }

  openSettings(): void {
    this.settingsOpen = true;
  }

  private commit(choice: CookieConsentRecord['choice'], preferences: boolean, analytics: boolean): void {
    const version = ui.publicSettings.pdpa.policyVersion;
    const id = this.record?.id ?? crypto.randomUUID();
    const record: StoredConsent = { id, version, preferences, analytics, at: new Date().toISOString() };
    this.record = record;
    safeSetItem(window.localStorage, CONSENT_STORAGE_KEY, JSON.stringify(record));

    // Withdrawing clears what was stored; granting saves what the visitor
    // already picked this visit, which until now lived only in memory.
    setFunctionalStorageAllowed(preferences);
    if (preferences) {
      safeSetItem(window.localStorage, 'lang', i18n.lang);
      safeSetItem(window.localStorage, 'ccc_dark_mode', ui.darkMode ? '1' : '0');
    }
    this.settingsOpen = false;

    // Evidence only — the choice already applies locally, so a failed log
    // must never block the visitor.
    void recordCookieConsent({ consentId: id, policyVersion: version, choice, preferences, analytics, lang: i18n.lang }).catch(
      () => undefined,
    );
  }
}

export const consent = new ConsentStore();
