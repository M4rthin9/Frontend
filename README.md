# ระบบจองคิวเพื่อร่วมกิจกรรม — Frontend (CC Cafe)

SPA frontend สำหรับโครงการจัดการเรียนรู้ การฝึกวิชาชีพด้านอาหารและงานบริการฯ (ทัณฑสถานบำบัดพิเศษกลาง กรมราชทัณฑ์)
ประกอบด้วย หน้าแรก, การจองคิว (wizard 3 ขั้น), การตรวจสอบสถานะ + ชำระเงิน, และแชตช่วยเหลือ

- **Framework:** Svelte 5 (runes) + TypeScript + Vite
- **Styling:** Tailwind CSS v4 (`@theme` tokens) + `globals.css` (design system + booking/status subdesign)
- **Dark mode:** `.dark` class บน `<html>` — auto ตาม `prefers-color-scheme` + toggle (บันทึกใน `localStorage`)

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run check     # svelte-check + tsc
npm run build     # output → dist/
npm run preview   # preview production build
```

## Configuration (`.env.local`)

| Variable        | Default                               | Description                        |
| --------------- | ------------------------------------- | ---------------------------------- |
| `VITE_API_BASE` | `https://ccc-backend.pongsinbas.workers.dev` | ฐาน URL ของ Worker ฝั่ง backend |
| `VITE_SITE_KEY` | —                                     | Cloudflare Turnstile site key      |

## Backend contract

- ฝั่ง frontend ส่ง `POST {base}/` ด้วยโปรโตคอล `{ action, ...body }` (legacy) ผ่าน `src/lib/api/client.ts` (`callAction`)
- REST alias แบบ GET เช่น `/api/prisoners` ผ่าน `callAction` → `callGet`
- การตอบกลับต้องมีฟิลด์ `status` (`'ok'` / error) — ดู `src/lib/api/errors.ts`
- ตัวอย่าง action: `prisoner_search`, `lookup_by_ref`, `upload_slip`, `update_slip_status`, `public_cancel_booking`, `get_notes`, `booking_submit`

## Project structure

```
src/
  main.ts            # mount + service-worker registration (prod)
  app.svelte         # layout (Header/Footer/Chat/Toast) + router switch
  pages/             # HomePage, BookingPage, StatusPage
  components/
    layout/          # Header, Footer, LangSwitcher (th/en/zh + ธีมสลับสว่าง/มืด)
    ui/              # Button, Input, Select, Modal, Card, Badge, Toast, Stepper, Spinner
    booking/         # PrisonerSearch, Calendar, BookingConfirm, BookingSuccess
    status/          # StatusResult, PaymentForm
    chat/            # ChatWidget (FAQ + ค้นหา Ref)
  lib/
    api/             # client, endpoints, types, errors
    store/           # booking, ui (dark mode + toasts), chat, i18n, router
    utils/           # status, date, currency, validation, turnstile, helpers
  styles/globals.css # tokens + booking/status CSS (รองรับ dark mode)
```

## Deployment (Cloudflare Pages)

1. สร้าง Pages project: `wrangler pages project create ccc-frontend --production-branch=main`
2. เพิ่ม secrets ใน GitHub repo: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
3. push ที่ branch `main` → workflow `.github/workflows/deploy.yml` ทำงานอัตโนมัติ (`npm run check` + `npm run build` + `pages deploy`)

Service worker (`public/sw.js`) ลงทะเบียนเฉพาะ production (`import.meta.env.PROD`) — ใช้ app-shell + stale-while-revalidate สำหรับ static assets, ไม่แตะ `/api/*`
