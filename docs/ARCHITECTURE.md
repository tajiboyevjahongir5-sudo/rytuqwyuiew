# Arxitektura

## Umumiy sxema

```
Telegram mijozi
   │  Mini App (WebView)                     Bot chat
   ▼                                            ▼
client/ (HTML+CSS+ES modullar)            bot/ (grammY)
   │  HTTPS, Authorization: Bearer <sessiya>    │
   ▼                                            │
server/ (Express, /api/v1) ◄────────────────────┘ (bir xil servis va ombor qatlami)
   │
   ├─ integrations/telegram  — initData imzosini tekshirish
   ├─ integrations/firebase  — Firestore (Admin SDK)
   ├─ integrations/ai        — (PHASE 3) AI provayder, faqat serverda
   └─ integrations/payments  — (PHASE 5) to'lov provayderi
```

Frontend hech qachon Firestore, AI yoki Telegram Bot API ga to'g'ridan-to'g'ri murojaat qilmaydi.

## Backend qatlamlari

`routes → middleware (rate limit, auth, validate) → controllers → services → db store`

| Papka | Vazifa |
|---|---|
| `config/` | `.env` ni zod bilan tekshiradi; xato konfiguratsiyada server ishga tushmaydi |
| `routes/` | Endpointlar jadvali; har modul alohida router |
| `middleware/` | `authenticate`, `requireAdmin`, `validateBody`, rate limit, log, xatolar |
| `controllers/` | HTTP ↔ servis; biznes mantiq yo'q |
| `services/` | Biznes mantiq (`auth`, `user`, `session`); bog'liqliklar konstruktor orqali beriladi |
| `models/` | Hujjat shakli va tashqariga chiqariladigan ko'rinish |
| `validators/` | zod sxemalari (`strictObject` — ortiqcha maydonlar rad etiladi) |
| `db/` | Ombor interfeysi va `memory` / `local` drayverlari |
| `integrations/` | Tashqi servislar (Firebase, Telegram, keyin AI va to'lovlar) |

### Ma'lumotlar ombori (store)

Barcha servislar bitta interfeys orqali ishlaydi:
`get, create, set, update (nuqtali yo'llar), delete, query (where/orderBy/limit/startAfterId), count, ping`.

| Drayver | Qayerda | Izoh |
|---|---|---|
| `firestore` | production (majburiy) | Firebase Admin SDK |
| `local` | lokal ishlab chiqish | `.data/db.json`, qayta ishga tushganda saqlanadi |
| `memory` | avtomatik testlar | |

`local`/`memory` — soxta API emas, balki bir xil shartnomali saqlash drayverlari. Firestore drayveri
xuddi shu testlar bilan Firestore emulyatorida tekshiriladi.

## Autentifikatsiya oqimi

1. Mini App `Telegram.WebApp.initData` ni `POST /auth/telegram` ga yuboradi.
2. Server imzoni bot tokeni bilan tekshiradi (HMAC-SHA256, doimiy vaqtli solishtirish), `auth_date` muddatini tekshiradi.
3. Foydalanuvchi **faqat imzolangan** `user.id` bo'yicha yaratiladi/yangilanadi.
4. Server qisqa muddatli sessiya tokeni (JWT HS256, faqat `sub`) qaytaradi; frontend uni faqat xotirada saqlaydi.
5. Har so'rovda foydalanuvchi bazadan yuklanadi: bloklash holati va rol (`ADMIN_TELEGRAM_IDS` dan) shu paytda aniqlanadi — tokenga yoki bazadagi `role` ga ishonilmaydi.

Brauzerda ishlab chiqish uchun `POST /auth/dev` mavjud; `NODE_ENV=production` da majburan o'chiq.

## Xavfsizlik choralari

- initData serverda tekshiriladi; frontenddan kelgan ID qabul qilinmaydi.
- `PATCH /me` faqat `grade`, `language`, `settings` ni qabul qiladi (`role`, `premium`, `stats` rad etiladi).
- Rate limit: umumiy va auth uchun alohida (qat'iyroq).
- Helmet + CSP: skriptlar faqat `self` va `telegram.org`; inline skript/stil yo'q.
- Firestore va Storage qoidalari mijozlar uchun to'liq yopiq (faqat Admin SDK).
- Loglarda token, initData, kalitlar avtomatik `[REDACTED]` qilinadi; 5xx tafsilotlari mijozga chiqmaydi.
- Minimal shaxsiy ma'lumot: Telegram ID, ism, familiya, username, rasm URL (faqat Telegram domenlari).

## Frontend

- `app.js` — yuklash: Telegram init → `/config` → autentifikatsiya → router.
- `router.js` — hash router; sahifa `render(ctx)` funksiyasi DOM element qaytaradi; `element.cleanup` sahifadan chiqishda chaqiriladi (3D sahnalar uchun tayyor).
- `api.js` — yagona API mijozi (standart xatolar, timeout, sessiya tugasa avtomatik qayta kirish).
- `telegram.js` — SDK o'rami (BackButton, haptic, ranglar); SDK bo'lmasa ham xavfsiz.
- `components/` — tabbar, sheet, toast, holatlar (loading/empty/error), avatar, sinf tanlagich, ikonlar.
- `pages/` — har sahifa alohida modul. `modules/<nom>/` papkalari tegishli bosqichda qo'shiladi.
- `i18n/` — barcha matnlar lug'atda; yangi til = yangi fayl.
- Foydalanuvchi ma'lumotlari DOM ga faqat matn tuguni sifatida qo'yiladi (`innerHTML` ishlatilmaydi).

## Bot

`bot/index.js` → `createBot` (handlerlarni ro'yxatga oladi). PHASE 1: `/start` (Mini App tugmasi) va
`/status` (faqat admin). To'liq kontent boshqaruvi — PHASE 4. Bot server bilan bitta jarayonda
(`BOT_ENABLED=true`, long polling) ishlaydi va o'sha ombor/servislardan foydalanadi.

## 3D laboratoriya arxitekturasi (PHASE 6 uchun oldindan qaror)

- Katalog: `#/lab`; har tajriba alohida sahifa: `#/lab/<experimentId>`.
- Har tajriba = alohida modul `client/scripts/modules/laboratory/experiments/<id>/` ichida:
  `physics.js` (sof hisoblash funksiyalari, unit test qilinadi), `scene.js` (Three.js sahnasi), `index.js` (sahifa + boshqaruv paneli).
- Three.js faqat tajriba sahifasi ochilganda dinamik `import()` qilinadi.
- Sahifa `cleanup()` da render loop to'xtatiladi, geometriya/material/renderer `dispose()` qilinadi.
- FPS kuzatuvchisi piksellar nisbatini va effektlarni avtomatik pasaytiradi.
