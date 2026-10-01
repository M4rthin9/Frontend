import { safeGetItem, safeSetItem } from '../utils/storage';
import {
  DEFAULT_BOOKING_WINDOW,
  DEFAULT_PDPA,
  DEFAULT_PUBLIC_BOOKING,
  EMPTY_PROMO,
  getPublicSettings,
  type PublicSettings,
} from '../api/endpoints';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const EMPTY_SETTINGS: PublicSettings = {
  paymentEnabled: true,
  paymentClosedMessage: '',
  tableBooking: {
    enabled: true,
    perDay: 10,
    holdMinutes: 60,
    seatsPerTable: 5,
    maintenance: true,
  },
  publicBooking: DEFAULT_PUBLIC_BOOKING,
  bookingWindow: DEFAULT_BOOKING_WINDOW,
  promo: EMPTY_PROMO,
  pdpa: DEFAULT_PDPA,
};

class UIStore {
  darkMode = $state(false);
  toasts = $state<Toast[]>([]);
  publicSettings = $state<PublicSettings>(EMPTY_SETTINGS);
  /** True once the server answered (or failed) — the promo popup waits for it. */
  publicSettingsLoaded = $state(false);
  private toastSeq = 0;

  initDarkMode(): void {
    const saved = safeGetItem(window.localStorage, 'ccc_dark_mode');
    this.darkMode = saved === '1';
    this.applyDarkClass();
  }

  async loadPublicSettings(): Promise<void> {
    try {
      this.publicSettings = await getPublicSettings();
    } catch {
      this.publicSettings = EMPTY_SETTINGS;
    } finally {
      this.publicSettingsLoaded = true;
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    safeSetItem(window.localStorage, 'ccc_dark_mode', this.darkMode ? '1' : '0');
    this.applyDarkClass();
  }

  private applyDarkClass(): void {
    document.documentElement.classList.toggle('dark', this.darkMode);
  }

  showToast(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = ++this.toastSeq;
    this.toasts = [...this.toasts, { id, message, type }];
    setTimeout(() => {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
    }, duration);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }
}

export const ui = new UIStore();
