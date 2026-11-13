# REST API (`/api/v1`)

## Javob formati

```jsonc
{ "ok": true,  "data": { /* ... */ } }
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [/* ixtiyoriy */] } }
```

Himoyalangan endpointlar: `Authorization: Bearer <token>`.

## Xato kodlari

| HTTP | code | Ma'nosi |
|---|---|---|
| 400 | `BAD_REQUEST`, `VALIDATION_ERROR` | Noto'g'ri so'rov; `details` da maydonlar |
| 401 | `UNAUTHORIZED`, `INVALID_SESSION`, `SESSION_EXPIRED`, `INVALID_INIT_DATA` | Autentifikatsiya |
| 403 | `FORBIDDEN`, `ADMIN_ONLY`, `USER_BLOCKED`, `DEV_AUTH_DISABLED` | Ruxsat yo'q |
| 404 | `NOT_FOUND` | |
| 413 | `PAYLOAD_TOO_LARGE` | Tana > 100 KB |
| 429 | `RATE_LIMITED` | |
| 500 | `INTERNAL_ERROR` | Tafsilot faqat server logida |
| 503 | `TELEGRAM_NOT_CONFIGURED` | Bot tokeni yo'q |

## Mavjud endpointlar (PHASE 1)

| Metod | Yo'l | Auth | Tavsif |
|---|---|---|---|
| GET | `/health` | — | Server va baza holati (`503` — baza ishlamayapti) |
| GET | `/config` | — | Ochiq sozlamalar: `version, grades, languages, devAuthEnabled, telegramAuthEnabled` |
| POST | `/auth/telegram` | — | `{ initData }` → `{ token, expiresIn, user, isNew }` |
| POST | `/auth/dev` | — | Faqat `DEV_AUTH_ENABLED` (production da yo'q). `{ profile?: 1..9 }` |
| GET | `/me` | ✔ | `{ user }` |
| PATCH | `/me` | ✔ | `{ grade?: 1..11, language?: 'uz', settings?: { notificationsEnabled?: boolean } }` |
| GET | `/admin/system/status` | admin | Versiya, baza, foydalanuvchilar soni, xotira |

`user` obyekti: `id, firstName, lastName, username, photoUrl, grade, language, role, premium{plan,until}, settings, stats{xp, streakDays, longestStreak, lastActiveDay, topicsCompleted, problemsSolved, quizzesCompleted}, createdAt`.

## Rejalashtirilgan endpoint guruhlari

| Bosqich | Guruh | Endpointlar |
|---|---|---|
| 2 | Textbooks | `GET /textbooks`, `GET /textbooks/:id`, `GET /textbooks/:id/topics`, `GET /topics/:id` |
| 2 | Formulas | `GET /formulas?category&grade&q&cursor` |
| 2 | Problems | `GET /problems`, `GET /problems/:id`, `POST /problems/:id/check`, `GET /problems/:id/solution` |
| 2 | Quizzes | `POST /quizzes/:id/start`, `POST /quiz-attempts/:id/answers`, `GET /quiz-attempts/:id` |
| 2 | Progress | `GET /progress`, `PUT /progress/topics/:topicId`, `GET /progress/stats` |
| 3 | AI | `POST /ai/sessions`, `POST /ai/sessions/:id/messages`, `POST /ai/sessions/:id/image`, `POST /ai/sessions/:id/reexplain`, `POST /ai/sessions/:id/practice`, `POST /ai/sessions/:id/check` |
| 5 | Subscription | `GET /plans`, `GET /subscription`, `POST /payments`, `GET /payments/:id` |
| 6 | Laboratory | `GET /lab/experiments`, `GET /lab/experiments/:id`, `POST /lab/experiments/:id/results` |
| 4 | Admin | `/admin/*` (bot bilan umumiy servislar) |

Ro'yxat endpointlari kursorli pagination ishlatadi: `?limit=20&cursor=<oxirgi id>` → `{ items, nextCursor }`.
Har endpoint: kirish validatsiyasi (zod), autentifikatsiya, avtorizatsiya, rate limit, log.
