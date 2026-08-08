declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Load the Turnstile script once (explicit render). */
export function loadTurnstileScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('Failed to load Turnstile'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export function turnstileReady(): boolean {
  return typeof window !== 'undefined' && typeof window.turnstile === 'object';
}

export function renderTurnstile(
  el: HTMLElement,
  sitekey: string,
  onToken: (token: string) => void
): string {
  if (!window.turnstile) return '';
  return window.turnstile.render(el, {
    sitekey,
    action: 'booking',
    callback: onToken,
  });
}

export function resetTurnstile(widgetId?: string): void {
  if (window.turnstile) {
    try {
      window.turnstile.reset(widgetId);
    } catch {
      /* ignore */
    }
  }
}

export function getTurnstileResponse(widgetId?: string): string {
  if (!window.turnstile) return '';
  try {
    return window.turnstile.getResponse(widgetId) || '';
  } catch {
    return '';
  }
}
