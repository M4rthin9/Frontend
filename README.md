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
npm run lint      # ESLint (svelte + typescript)
npm run format    # Prettier (write)
npm run build     # output → dist/
npm run preview   # preview production build
```

## Configuration (`.env.local`)

| Variable                 | Default                                      | Description                     |
| ------------------------ | -------------------------------------------- | ------------------------------- |
| `VITE_API_BASE`          | `https://ccc-backend.pongsinbas.workers.dev` | ฐาน URL ของ Worker ฝั่ง backend |
| `VITE_TURNSTILE_SITEKEY` | —                                            | Cloudflare Turnstile site key   |

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
    utils/           # status, date, currency, validation, turnstile, storage, helpers
  styles/globals.css # tokens + booking/status CSS (รองรับ dark mode)
plugins/
  sw-stamp.ts        # stamp service worker (version + precache) ตอน build
scripts/
  sw.template.js     # template ของ service worker
public/              # static files (รวม _headers สำหรับ Cloudflare Pages)
```

## Deployment (Cloudflare Pages)

Deploy ทำโดย **Cloudflare Pages native GitHub integration** ไม่ใช่ GitHub Actions —
workflow `.github/workflows/deploy.yml` ทำแค่ `check` / `lint` / `build` เป็น CI gate
(step `pages deploy` ถูกถอดออกตั้งแต่ commit `6195623`)

| Environment | Branch | URL                                         | Pages environment |
| ----------- | ------ | ------------------------------------------- | ----------------- |
| Production  | `main` | `ccc-frontend.pages.dev` / `cida.dpdns.org` | Production        |
| Development | `dev`  | `dev.ccc-frontend.pages.dev`                | Preview           |

Push ที่ branch ไหน Pages ก็ build branch นั้นให้อัตโนมัติ

**Environment variables** ตั้งใน Cloudflare dashboard → Pages → `ccc-frontend` → Settings →
Environment variables เป็น **build-time** variables (Vite inline ค่า `VITE_*` ตอน build —
Pages _runtime_ variables ใช้ไม่ได้กับ static SPA)

| Variable                 | Production                                   | Preview (dev)                                    |
| ------------------------ | -------------------------------------------- | ------------------------------------------------ |
| `VITE_API_BASE`          | `https://ccc-backend.pongsinbas.workers.dev` | `https://ccc-backend-dev.pongsinbas.workers.dev` |
| `VITE_TURNSTILE_SITEKEY` | production site key                          | `1x00000000000000000000AA` (test key)            |

ถ้าไม่ตั้ง `VITE_API_BASE` โค้ดจะ fallback ไปที่ **production** worker เงียบ ๆ
(`src/lib/api/client.ts`) — ตรวจใน Network tab เสมอว่ายิงไป `ccc-backend-dev` จริง
ดูค่าตัวอย่างที่ `.env.development.example`

Service worker (`dist/sw.js`) ลงทะเบียนเฉพาะ production เท่านั้น — `src/lib/env.ts`
กัน dev deployment ไว้ด้วย (`import.meta.env.PROD` เป็น true ทั้ง prod และ dev build จึงใช้แยกไม่ได้)
ถูก stamp ด้วย version + รายการ asset จริงตอน build (`plugins/sw-stamp.ts`)
ใช้ app-shell + stale-while-revalidate สำหรับ static assets, ไม่แตะ `/api/*`
