<script lang="ts">
  import { t, i18n } from '../../lib/i18n/i18n.svelte';
  import { chat } from '../../lib/store/chat.svelte';

  let inputValue = $state('');

  const quickQuestions = $derived([
    { label: t('price'), question: i18n.lang === 'th' ? 'ค่าใช้จ่ายเท่าไหร่' : i18n.lang === 'zh' ? '费用多少钱' : 'How much does it cost' },
    { label: t('stepBooking'), question: i18n.lang === 'th' ? 'จองยังไง' : i18n.lang === 'zh' ? '怎么预约' : 'How to book' },
    { label: t('step2'), question: i18n.lang === 'th' ? 'เช็คสถานะยังไง' : i18n.lang === 'zh' ? '怎么查询状态' : 'How to check status' },
    { label: t('rules'), question: i18n.lang === 'th' ? 'ติดต่อเจ้าหน้าที่' : i18n.lang === 'zh' ? '联系工作人员' : 'Contact officers' },
  ]);

  function ask(question: string) {
    chat.send(question);
  }

  function onSend() {
    const value = inputValue;
    inputValue = '';
    chat.send(value);
  }
</script>

<svelte:window onkeydown={(e) => {
  if (e.key === 'Escape' && chat.open) chat.close();
}} />

{#if !chat.open}
  <button
    type="button"
    class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg shadow-indigo-600/30 transition hover:scale-105 hover:bg-indigo-700"
    aria-label="เปิดแชทบอท"
    onclick={() => chat.toggle()}
  >
    💬
  </button>
{:else}
  <div class="fixed bottom-4 right-4 z-50 flex h-[min(560px,calc(100dvh-5rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-indigo-950 text-white shadow-2xl ring-1 ring-white/10">
    <div class="flex items-center justify-between border-b border-white/10 bg-indigo-900 px-4 py-3">
      <div class="flex items-center gap-2">
        <span class="text-lg">🤖</span>
        <h3 class="text-sm font-bold">M4RTHIN9 AI</h3>
      </div>
      <button
        type="button"
        class="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
        aria-label={chat.closeLabel()}
        onclick={() => chat.close()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>

    <div
      class="chat-scroll flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm leading-relaxed"
    >
      {#each chat.messages as msg (msg.id)}
        <div class="chat-msg {msg.sender === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}">
          {#if msg.sender === 'user'}
            {msg.text}
          {:else}
            {@html msg.text}
          {/if}
        </div>
      {/each}
      {#if chat.typing}
        <div class="chat-typing">
          <span></span><span></span><span></span>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-2 px-3 pb-2">
      {#each quickQuestions as q (q.question)}
        <button
          type="button"
          class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
          onclick={() => ask(q.question)}
        >
          {q.label}
        </button>
      {/each}
    </div>

    <div class="flex items-center gap-2 border-t border-white/10 bg-indigo-900 px-3 py-3">
      <input
        type="text"
        class="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
        placeholder={chat.placeholder()}
        autocomplete="off"
        bind:value={inputValue}
        onkeydown={(e) => {
          if (e.key === 'Enter') onSend();
        }}
      />
      <button
        type="button"
        class="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-indigo-950 transition hover:bg-amber-300"
        aria-label="ส่ง"
        onclick={onSend}
      >
        ➤
      </button>
    </div>
  </div>
{/if}
