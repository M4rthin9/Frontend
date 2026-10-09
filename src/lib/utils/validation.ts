import { t } from '../i18n/i18n.svelte';
/** Thai national ID (X-XXXX-XXXXX-XX-X) or Passport (alnum 6-20). */
export function validateIdFormat(val: string): { valid: boolean; error?: string } {
  if (!val) return { valid: true };
  if (val.includes('-')) {
    const valid = /^\d{1}-\d{4}-\d{5}-\d{2}-\d{1}$/.test(val);
    return {
      valid,
      error: valid ? undefined : t('textvalidationMessage1'),
    };
  }
  const valid = /^[A-Za-z0-9]{6,20}$/.test(val);
  return {
    valid,
    error: valid ? undefined : t('textvalidationMessage2'),
  };
}

export function normalizePhone(val: string): string {
  return val.replace(/[^0-9]/g, '');
}

/** Thai mobile numbers must have exactly 10 digits. */
export function validatePhone(val: string): { cleaned: string; valid: boolean; error?: string } {
  const cleaned = normalizePhone(val);
  return {
    cleaned,
    valid: cleaned.length === 10,
    error: t('textvalidationMessage3'),
  };
}
