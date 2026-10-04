<script lang="ts">
  import Bell from '@lucide/svelte/icons/bell';
  import BellRing from '@lucide/svelte/icons/bell-ring';
  import BellOff from '@lucide/svelte/icons/bell-off';
  import { getPushPublicKey, subscribePush } from '../../lib/api/endpoints';
  import { shouldRegisterServiceWorker } from '../../lib/env';
  import { t } from '../../lib/i18n/i18n.svelte';
  import Button from './Button.svelte';

  // Opt-in Web Push for one booking: status changes made by staff arrive as
  // browser notifications. Hidden where push cannot work — no service worker
  // (dev/local), or no PushManager (iPhone Safari outside a home-screen app).
  let { ref }: { ref: string } = $props();

  const supported =
    shouldRegisterServiceWorker &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  let state = $state<'idle' | 'busy' | 'on' | 'denied' | 'error'>(
    supported && Notification.permission === 'denied' ? 'denied' : 'idle',
  );

  function keyBytes(b64url: string): Uint8Array<ArrayBuffer> {
    const b64 = (b64url + '='.repeat((4 - (b64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  }

  async function enable(): Promise<void> {
    state = 'busy';
    try {
      if ((await Notification.requestPermission()) !== 'granted') {
        state = Notification.permission === 'denied' ? 'denied' : 'idle';
        return;
      }
      const { publicKey, pushEnabled } = await getPushPublicKey();
      if (!pushEnabled) throw new Error('push disabled');
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      const json = sub.toJSON();
      await subscribePush({
        ref,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
      });
      state = 'on';
    } catch {
      state = 'error';
    }
  }
</script>

{#if supported && ref}
  <div class="mt-3 flex flex-col items-center gap-2 text-center">
    {#if state === 'on'}
      <p class="flex items-center gap-2 text-sm font-medium text-[var(--app-text)]" role="status">
        <BellRing class="h-4 w-4 text-[var(--ct-orange-ink)]" aria-hidden="true" />
        {t('pushOn')}
      </p>
    {:else if state === 'denied'}
      <p class="flex items-center gap-2 text-xs text-[var(--app-text-secondary)]" role="status">
        <BellOff class="h-4 w-4" aria-hidden="true" />
        {t('pushDenied')}
      </p>
    {:else}
      <Button variant="secondary" size="md" disabled={state === 'busy'} onclick={() => void enable()}>
        <Bell class="h-4 w-4" aria-hidden="true" />
        {t('pushEnable')}
      </Button>
      {#if state === 'error'}
        <p class="text-xs text-[var(--app-text-secondary)]" role="alert">{t('pushError')}</p>
      {/if}
    {/if}
  </div>
{/if}
