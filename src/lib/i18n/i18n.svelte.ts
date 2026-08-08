import th from './locales/th.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

export type Lang = 'th' | 'en' | 'zh';

const dictionaries: Record<Lang, Record<string, string>> = { th, en, zh };
const langNames: Record<Lang, string> = { th: 'ไทย', en: 'EN', zh: '中文' };

function detectInitial(): Lang {
  const stored = localStorage.getItem('lang');
  if (stored === 'th' || stored === 'en' || stored === 'zh') return stored;
  const browser = (navigator.language || '').toLowerCase();
  if (browser.startsWith('zh')) return 'zh';
  if (browser.startsWith('en')) return 'en';
  return 'th';
}

class I18nStore {
  lang = $state<Lang>(detectInitial());

  setLanguage(next: Lang): void {
    if (!dictionaries[next]) return;
    this.lang = next;
    localStorage.setItem('lang', next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: next } }));
  }

  toggleLanguage(): void {
    const order: Lang[] = ['th', 'en', 'zh'];
    const i = order.indexOf(this.lang);
    this.setLanguage(order[(i + 1) % order.length]);
  }

  langName(l: Lang = this.lang): string {
    return langNames[l] || l;
  }

  /** Translate a key for the current language (falls back to Thai). */
  t(key: string): string {
    const dict = dictionaries[this.lang];
    return (dict && dict[key]) || dictionaries.th[key] || key;
  }

  /** Translate + interpolate `{param}` placeholders. */
  tc(key: string, params: Record<string, string | number> = {}): string {
    let str = this.t(key);
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
    return str;
  }
}

export const i18n = new I18nStore();

export const t = (key: string): string => i18n.t(key);
export const tc = (key: string, params: Record<string, string | number> = {}): string => i18n.tc(key, params);
export const setLanguage = (next: Lang): void => i18n.setLanguage(next);
export const langName = (l: Lang = i18n.lang): string => i18n.langName(l);
