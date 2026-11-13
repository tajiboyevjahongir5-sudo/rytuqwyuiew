# PHYSICA

**Fizikani o'rganma, uni his qil!** — 1–11-sinf o'quvchilari uchun AI asosidagi fizika ta'lim platformasi (Telegram Mini App).

> Holat: **PHASE 1 (Foundation) tugallangan.** Keyingi bosqichlar va aniq holat: [docs/STATUS.md](docs/STATUS.md)

## Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES modullar, frameworksiz), Telegram Mini Apps SDK |
| Backend | Node.js 20+, Express, REST API (`/api/v1`) |
| Ma'lumotlar bazasi | Cloud Firestore (Firebase Admin SDK) |
| Bot | grammY (Telegram Bot API) |
| Testlar | `node:test`, Playwright (e2e), Firestore emulyatori |

## Tez ishga tushirish (lokal)

```bash
npm install
cp .env.example .env
# .env ichida kamida SESSION_SECRET ni to'ldiring:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run dev
```

`http://localhost:3000` ni oching. `.env` da `DEV_AUTH_ENABLED=true` va `DB_DRIVER=local` bo'lsa,
ilova oddiy brauzerda sinov foydalanuvchisi bilan ishlaydi, ma'lumotlar `.data/db.json` da saqlanadi.

## Telegram ichida ishga tushirish

1. [@BotFather](https://t.me/BotFather) da bot yarating, tokenni `TELEGRAM_BOT_TOKEN` ga yozing.
2. Serverni ochiq **HTTPS** manzilga joylashtiring (Railway) va manzilni `MINI_APP_URL` ga yozing.
3. `BOT_ENABLED=true` qiling — bot `/start` buyrug'iga Mini App tugmasi bilan javob beradi.
4. `ADMIN_TELEGRAM_IDS` ga o'z Telegram ID ingizni yozing (`/status` buyrug'i va admin API uchun).

## Production (Railway)

Majburiy o'zgaruvchilar: `NODE_ENV=production`, `SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`,
`DB_DRIVER=firestore`, `FIREBASE_SERVICE_ACCOUNT` (JSON yoki base64), `TRUST_PROXY=1`, `MINI_APP_URL`.
Server noto'g'ri yoki xavfli konfiguratsiya bilan ishga tushmaydi. To'liq ro'yxat: [.env.example](.env.example).

Firestore qoidalari va indekslarini joylash:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project <PROJECT_ID>
```

## Testlar

```bash
npm test            # unit + integration
npm run test:e2e    # haqiqiy brauzerda (Playwright kerak)
# Firestore drayverini haqiqiy emulyatorda tekshirish (Java kerak):
npx firebase-tools emulators:exec --only firestore --project demo-physica "npm run test:integration"
```

## Tuzilma

```
client/   Mini App frontend (statik; alohida hostingga ham qo'yish mumkin)
server/   Express REST API
bot/      Telegram bot
shared/   Server va bot uchun umumiy konstantalar
tests/    unit / integration / e2e
docs/     Arxitektura, API, ma'lumotlar bazasi, dizayn tizimi, holat hisoboti
```

## Hujjatlar

- [Arxitektura](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Ma'lumotlar bazasi](docs/DATABASE.md)
- [Dizayn tizimi](docs/DESIGN_SYSTEM.md)
- [Holat va keyingi qadamlar](docs/STATUS.md)
