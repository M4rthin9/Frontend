<script lang="ts">
  import { manageVis, type VisGuest, type VisManageResult } from '../../lib/api/endpoints';
  import type { PublicReservation } from '../../lib/api/types';

  let { booking }: { booking: PublicReservation } = $props();
  let opened = $state(false);
  let document = $state('');
  let owner = $state<VisManageResult | null>(null);
  let main = $state<VisGuest>({ name: '', id: '', relation: '', age: '' });
  let guests = $state<VisGuest[]>([]);
  let date = $state('');
  let busy = $state(false);
  let error = $state('');

  async function run(operation: 'open' | 'edit' | 'rebook') {
    if (busy) return;
    busy = true;
    error = '';
    try {
      const result = await manageVis({ ref: booking.ref, visitorId: document, operation, version: owner?.version,
        ...(operation === 'edit' ? { main, guests } : {}), ...(operation === 'rebook' ? { visitDateISO: date } : {}),
      });
      if (operation === 'open') {
        owner = result;
        main = { ...result.main! };
        guests = [...(result.guests ?? [])];
      } else {
        window.location.hash = '#/status?ref=' + encodeURIComponent(booking.ref);
        window.location.reload();
      }
    } catch (reason) {
      error = reason instanceof Error ? reason.message : 'ไม่สามารถบันทึกข้อมูลได้';
    } finally {
      busy = false;
    }
  }
</script>

<section class="rounded-xl border border-current/20 p-4" aria-label="จัดการรายการ VIS">
  {#if !opened}
    <button type="button" class="ct-link" onclick={() => (opened = true)}>{booking.visitDateISO ? 'แก้ไขผู้เข้าเยี่ยม' : 'เลือกวันใหม่ด้วย VIS เดิม'}</button>
  {:else if !owner}
    <form class="flex flex-wrap items-end gap-3" onsubmit={(event) => { event.preventDefault(); void run('open'); }}>
      <label class="grid gap-1 text-sm">เลขบัตรประชาชนหรือหนังสือเดินทางของผู้จองหลัก
        <input class="rounded border px-3 py-2" type="password" autocomplete="off" maxlength="64" bind:value={document} required />
      </label>
      <button type="submit" disabled={busy} class="ct-link">ยืนยันข้อมูลผู้จอง</button>
    </form>
  {:else if owner.canChooseDate}
    <form class="flex flex-wrap items-end gap-3" onsubmit={(event) => { event.preventDefault(); void run('rebook'); }}>
      <label class="grid gap-1 text-sm">เลือกวันเยี่ยมใหม่ <input class="rounded border px-3 py-2" type="date" bind:value={date} required /></label>
      <button type="submit" disabled={busy} class="ct-link">ยืนยันวันใหม่</button>
    </form>
  {:else}
    <form class="grid gap-4" onsubmit={(event) => { event.preventDefault(); void run('edit'); }}>
      <fieldset class="grid gap-2 sm:grid-cols-2">
        <legend class="font-medium">ผู้จองหลัก</legend>
        <label class="grid gap-1 text-sm">ชื่อเต็ม <input class="rounded border px-2 py-1" bind:value={main.name} maxlength="160" required /></label>
        <label class="grid gap-1 text-sm">เลขเอกสาร <input class="rounded border px-2 py-1" bind:value={main.id} maxlength="30" required /></label>
        <label class="grid gap-1 text-sm">ความสัมพันธ์ <input class="rounded border px-2 py-1" bind:value={main.relation} maxlength="60" required /></label>
        <label class="grid gap-1 text-sm">อายุ <input class="rounded border px-2 py-1" bind:value={main.age} inputmode="numeric" pattern={'[0-9]{1,3}'} required /></label>
      </fieldset>
      {#each guests as guest, i (i)}
        <fieldset class="grid gap-2 sm:grid-cols-2">
          <legend class="font-medium">ผู้เข้าเยี่ยมเพิ่มเติม {i + 1}</legend>
          <label class="grid gap-1 text-sm">ชื่อเต็ม <input class="rounded border px-2 py-1" bind:value={guest.name} maxlength="160" required /></label>
          <label class="grid gap-1 text-sm">เลขเอกสาร <input class="rounded border px-2 py-1" bind:value={guest.id} maxlength="30" required /></label>
          <label class="grid gap-1 text-sm">ความสัมพันธ์ <input class="rounded border px-2 py-1" bind:value={guest.relation} maxlength="60" required /></label>
          <label class="grid gap-1 text-sm">อายุ <input class="rounded border px-2 py-1" bind:value={guest.age} inputmode="numeric" pattern={'[0-9]{1,3}'} required /></label>
          <button class="ct-link justify-self-start" type="button" onclick={() => (guests = guests.filter((_, index) => index !== i))}>ลบผู้เข้าเยี่ยมคนนี้</button>
        </fieldset>
      {/each}
      <div class="flex flex-wrap gap-4">
        <button type="button" class="ct-link" disabled={guests.length >= 9} onclick={() => guests.push({ name: '', id: '', relation: '', age: '' })}>เพิ่มผู้เข้าเยี่ยม</button>
        <button type="submit" class="ct-link" disabled={busy}>บันทึกข้อมูล</button>
      </div>
    </form>
  {/if}
  {#if error}<p class="mt-2 text-sm text-red-700" role="alert">{error}</p>{/if}
</section>
