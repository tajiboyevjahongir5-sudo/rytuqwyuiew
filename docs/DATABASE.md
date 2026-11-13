# Ma'lumotlar bazasi (Cloud Firestore)

Umumiy qoidalar:
- Barcha kirish backend (Admin SDK) orqali; `firestore.rules` mijozlar uchun to'liq yopiq.
- Vaqtlar ISO-8601 satr (UTC). Kunlik hisob-kitoblar `Asia/Tashkent` bo'yicha (`YYYY-MM-DD`).
- Katta massivlar hujjat ichiga solinmaydi (1 MiB limit): xabarlar, urinishlar — alohida hujjat/subkolleksiya.
- Kontent hujjatlarida `status: draft | review | published | archived`; o'quvchilarga faqat `published`.
- Ro'yxatlar kursorli pagination bilan o'qiladi; kerakli kompozit indekslar `firestore.indexes.json` da.

## Amalda (PHASE 1)

### `users/{telegramId}`
| Maydon | Tur | Izoh |
|---|---|---|
| telegramId | number | Hujjat ID si ham shu |
| firstName, lastName, username, photoUrl | string \| null | Har kirishda Telegram dan yangilanadi |
| grade | number \| null | 1–11; `null` — hali tanlanmagan |
| language | string | `uz` (keyin `ru`, `en`) |
| role | `student` \| `admin` | Ma'lumot uchun; haqiqiy rol `ADMIN_TELEGRAM_IDS` dan |
| premium | `{ plan, until }` | Faqat to'lov tasdiqlangach server o'zgartiradi |
| blocked | boolean | Admin bloklashi |
| settings | `{ notificationsEnabled }` | |
| stats | `{ xp, streakDays, longestStreak, lastActiveDay, topicsCompleted, problemsSolved, quizzesCompleted }` | Denormalizatsiya qilingan hisoblagichlar |
| createdAt, lastActiveAt | string | |

## Rejalashtirilgan kolleksiyalar

| Kolleksiya | Hujjat ID | Asosiy maydonlar | Bosqich |
|---|---|---|---|
| `textbooks` | auto | title, grade, subject, description, coverUrl, status, order, topicCount, createdAt, updatedAt | 2 |
| `topics` | auto | textbookId, grade, title, introduction, status, order, video{fileId,url,duration}, formulaIds[], quizIds[] | 2 |
| `topics/{id}/sections` | auto | type (`theory`\|`example`\|`exercise`), order, content — nazariya va misollar bo'laklarga bo'linadi | 2 |
| `formulas` | auto | title, expression (LaTeX), variables[], units, explanation, conditions, variants[], category, grade, topicId, free | 2 |
| `problems` | auto | title, description, imageUrl, grade, topicId, difficulty, givenValues[], unknown, formula, solution[], finalAnswer{value,unit,tolerance}, status | 2 |
| `quizzes` | auto | title, grade, topicId, difficulty, timeLimit, status, questionCount | 2 |
| `quizzes/{id}/questions` | auto | type, text, options[], order — **to'g'ri javob alohida** `answerKey` hujjatida, mijozga yuborilmaydi | 2 |
| `quizAttempts` | auto | userId, quizId, answers[], score, startedAt, finishedAt | 2 |
| `userProgress` | `{userId}_{topicId}` | userId, topicId, completion, score, attempts, mastered, videoWatched, lastActivityAt | 2 |
| `aiSessions` | auto | userId, grade, topicId, problemImage, solutionState, understandingState, createdAt | 3 |
| `aiSessions/{id}/messages` | auto | role, content, structured, tokens, createdAt | 3 |
| `aiUsage` | `{userId}_{YYYY-MM-DD}` | requestCount, imageRequestCount, tokenUsage | 3 |
| `settings` | `ai`, `plans`, `limits` | Bot orqali o'zgartiriladigan sozlamalar (narxlar, limitlar, prompt versiyasi) | 3–5 |
| `contentVersions` | auto | contentId, contentType, version, data, createdAt, createdBy | 4 |
| `subscriptions` | `{userId}` | plan, status, startAt, endAt, paymentId | 5 |
| `payments` | auto | userId, provider, transactionId, amount, currency, status, createdAt | 5 |
| `achievements` | slug | title, description, condition, reward | 5 |
| `userAchievements` | `{userId}_{achievementId}` | userId, achievementId, unlockedAt | 5 |
| `laboratoryExperiments` | slug | title, category, description, theory, sceneConfig, parameters[], formulas[], questions[], status, free | 6 |
| `labResults` | auto | userId, experimentId, parameters, measurements, createdAt | 6 |

Prompt talabidagi sxemadan ongli farqlar:
- `topics.theory/examples/exercises` → `sections` subkolleksiyasi (hujjat hajmi limiti).
- `aiSessions.messages` → subkolleksiya (suhbat o'sib boradi).
- `quizzes.questions` → subkolleksiya, javob kalitlari alohida (test javoblari mijozga sizib chiqmasligi uchun).
- `userProgress` va `aiUsage` da kompozit ID — bitta o'qish bilan topiladi, dublikat bo'lmaydi.

Aniq maydonlar tegishli bosqichda validatorlar bilan birga yakunlanadi.
