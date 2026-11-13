# Dizayn tizimi

Manba: `client/styles/tokens.css` (tokenlar), `components.css` (komponentlar).

## Ranglar

| Token | Qiymat | Qo'llanishi |
|---|---|---|
| `--navy-950 … --navy-600` | `#060B1A … #24335F` | Fon va qatlamlar (Deep Navy) |
| `--blue-500 / --blue-400` | `#2E6BFF / #5B8CFF` | Asosiy interaktiv rang (Electric Blue) |
| `--violet-500 / --violet-400` | `#7C5CFF / #9D86FF` | AI va texnologik elementlar |
| `--cyan-400` | `#5EE4E8` | Muhim ko'rsatkichlar, fokus |
| `--text / --text-muted / --text-dim` | `#F2F5FB / #A9B3CC / #77829F` | Matn darajalari |
| `--success / --warning / --danger` | `#3DD68C / #FFC857 / #FF6B7A` | Holatlar |
| `--surface`, `--border` | oq 4.5% / 9% | Kartalar (glassmorphism — faqat kerakli joyda) |

## Tipografiya va o'lchamlar

- Shrift: tizim shrifti (tashqi shrift yuklanmaydi — tez ochiladi).
- O'lchamlar: `--fs-xs` 12 → `--fs-2xl` 26 px; oraliqlar 4 px shkalasida (`--sp-1 … --sp-8`).
- Radiuslar: 10 / 14 / 20 px. Minimal bosish maydoni: `--tap` = 48 px.

## Telegram Mini App moslashuvi

- Xavfsiz maydonlar: `--safe-top/bottom/left/right` — Telegram `--tg-safe-area-inset-*` va
  `--tg-content-safe-area-inset-*` o'zgaruvchilari, bo'lmasa `env(safe-area-inset-*)`.
- Sarlavha va fon rangi SDK orqali `#0A1124` ga o'rnatiladi; ichki sahifalarda Telegram BackButton.
- 320 px kenglikda gorizontal toshish yo'q (e2e test bilan tekshiriladi).
- `prefers-reduced-motion` hurmat qilinadi.

## Komponentlar

| Komponent | Fayl | Izoh |
|---|---|---|
| Tugmalar `.btn` (`--primary`, `--light`, `--ghost`, `--sm`, `--block`), `.icon-btn` | components.css | `withLoading()` — loading holati va ikki marta bosishdan himoya |
| Karta `.card`, `.card--glass` | components.css | |
| Chip `.chip` (`--violet`, `--muted`) | components.css | |
| Tabbar | components/tabbar.js | 5 bo'lim |
| Bottom sheet | components/sheet.js | Esc / fon bosilganda yopiladi, fokus qaytariladi |
| Toast | components/toast.js | success / error + haptic |
| Holatlar | components/states.js | `loadingState`, `emptyState`, `errorState` (qayta urinish bilan) |
| Avatar | components/avatar.js | Rasm yuklanmasa bosh harf |
| Sinf tanlagich | components/gradePicker.js | radiogroup |
| Switch, ro'yxat, variant | components.css | |
| Ikonlar | components/icons.js | Ichki SVG to'plam |
