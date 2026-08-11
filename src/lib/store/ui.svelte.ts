import { safeGetItem, safeSetItem } from '../utils/storage';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

class UIStore {
  darkMode = $state(false);
  toasts = $state<Toast[]>([]);
  private toastSeq = 0;

  initDarkMode(): void {
    const saved = safeGetItem(window.localStorage, 'ccc_dark_mode');
    this.darkMode = saved === '1';
    this.applyDarkClass();
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
