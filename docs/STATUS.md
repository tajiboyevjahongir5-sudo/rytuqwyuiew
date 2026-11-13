# Loyiha holati

Oxirgi yangilanish: PHASE 1 yakuni.

## Bosqichlar

| # | Bosqich | Holat |
|---|---|---|
| 1 | Foundation | ✅ Tugallangan |
| 2 | Education system (darsliklar, mavzular, formulalar, video, masalalar, testlar, progress) | ⏳ Keyingi |
| 3 | AI tutor | ⬜ |
| 4 | Telegram admin bot | ⬜ |
| 5 | Gamification va monetizatsiya | ⬜ |
| 6 | 3D laboratoriya | ⬜ |
| 7 | Yakuniy QA va optimallashtirish | ⬜ |

## PHASE 1 — nimalar ishlaydi

- Express server: konfiguratsiya tekshiruvi, standart API javoblari, rate limit, CSP, strukturali loglar.
- Telegram initData ni serverda tekshirish va sessiya tokeni.
- Foydalanuvchi profili: yaratish, yangilash, sinf tanlash, til, bildirishnoma sozlamasi, kunlik faollik seriyasi.
- Admin himoyasi (`ADMIN_TELEGRAM_IDS`) va `GET /admin/system/status`.
- Ma'lumotlar ombori: `firestore` (production), `local` (ishlab chiqish), `memory` (testlar).
- Firestore/Storage xavfsizlik qoidalari va indekslar.
- Mini App: splash, onboarding (sinf tanlash), bosh sahifa, 5 bo'limli navigatsiya, profil, bildirishnomalar oynasi, loading/empty/error holatlari, 404.
- Bot: `/start` (Mini App tugmasi), `/status` (faqat admin).

## Bajarilgan testlar

| Tur | Soni | Nimani qamraydi |
|---|---|---|
| Unit | 30 | initData imzosi, sessiya tokeni, ombor, foydalanuvchi servisi, seriya, konfiguratsiya, log tozalash |
| Integration (API + bot) | 28 | Kirish, soxta/eskirgan initData, profil validatsiyasi, begona admin bo'la olmasligi, rate limit, statik fayllar, baza nosozligi, bot buyruqlari |
| Firestore emulyatori | 4 | Firestore drayveri va foydalanuvchi servisi haqiqiy emulyatorda |
| E2E (Chromium, telefon o'lchami) | 7 | Kirish → sinf tanlash → bosh sahifa → navigatsiya → profil → qayta kirishda saqlanishi; 320 px; xato holatlari |

## Ochiq aytiladigan cheklovlar

- **Haqiqiy Telegram mijozida sinab ko'rilmagan**: bot tokeni va ochiq HTTPS manzil berilmagan. initData
  tekshiruvi rasmiy algoritm bo'yicha test qilingan, Mini App esa brauzerda taqlid qilingan `Telegram.WebApp` bilan.
- **Haqiqiy Firebase loyihasiga ulanmagan**: service account berilmagan. Drayver emulyatorda tekshirilgan.
- Darsliklar, AI ustoz, laboratoriya, formulalar, videolar, testlar bo'limlari hozircha
  "Ishlab chiqilmoqda" holatini ko'rsatadi (soxta kontent yo'q).
- Bosh sahifada "Kunlik vazifa" bloki yo'q — PHASE 5 da haqiqiy tizim bilan qo'shiladi.
- "Ketma-ket kun" hozircha ilovaga kirish kunlarini sanaydi; PHASE 2 da o'qish faolligiga bog'lanadi.
- Bildirishnoma sozlamasi saqlanadi, lekin xabar yuborish PHASE 5 da.
- Bot long polling rejimida; webhook rejimi keyin qo'shilishi mumkin.

## Davom ettirish uchun kerak bo'ladigan ma'lumotlar

| Nima | Qachon kerak |
|---|---|
| `TELEGRAM_BOT_TOKEN` (@BotFather) va admin Telegram ID lar | Telegram ichida sinash uchun (hozir) |
| Firebase loyihasi service account JSON | Production baza uchun (hozir) |
| Deploy manzili (Railway) | Mini App URL uchun (hozir) |
| Darslik kontenti manbasi: sinflar bo'yicha tasdiqlangan mavzular ro'yxati | PHASE 2 |
| AI provayder va API kaliti (multimodal model) | PHASE 3 |
| To'lov provayderi (Click / Payme / Telegram Stars ...) va uning kalitlari | PHASE 5 |

## PHASE 2 rejasi

1. Kontent modeli va servislar: `textbooks`, `topics` (+`sections`), `formulas`, `problems`, `quizzes`, `userProgress`.
2. API: darsliklar, mavzular, formulalar, masalalar (deterministik javob tekshiruvi), testlar (7 tur), progress.
3. `server/physics/`: birliklar konvertatsiyasi va sonli javobni tekshirish moduli (unit testlar bilan).
4. Frontend modullari: darsliklar ro'yxati, mavzu sahifasi (kirish → nazariya → video → formulalar → misollar → mashqlar → test → keyingi mavzu), formula kutubxonasi, test o'tkazish.
5. Kontent: 1–4-sinflarda alohida fizika fani yo'q deb hisoblanadi; mavzular ro'yxati amaldagi dastur bilan
   tekshirilgach kiritiladi. Kontent kiritish vositasi (seed skript yoki PHASE 4 boti) orqali `draft` holatida yuklanadi.
