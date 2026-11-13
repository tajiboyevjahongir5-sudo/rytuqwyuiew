import { DEFAULT_LANGUAGE, ENABLED_LANGUAGE_CODES, PLANS, ROLES } from '../../shared/constants.js';

const str = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

// Telegram profil rasmi faqat Telegram domenlaridan qabul qilinadi
function safePhotoUrl(url) {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    const ok = u.protocol === 'https:' && (u.hostname === 't.me' || u.hostname.endsWith('.telegram.org') || u.hostname.endsWith('.t.me'));
    return ok ? u.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

/** Telegram user obyektidan faqat kerakli (minimal) profil maydonlarini ajratadi. */
export function profileFromTelegram(tgUser) {
  return {
    firstName: str(tgUser.first_name, 64) ?? "O'quvchi",
    lastName: str(tgUser.last_name, 64),
    username: str(tgUser.username, 32),
    photoUrl: safePhotoUrl(tgUser.photo_url),
  };
}

export function newUser(tgUser, { now, role }) {
  const lang = ENABLED_LANGUAGE_CODES.includes(tgUser.language_code) ? tgUser.language_code : DEFAULT_LANGUAGE;
  return {
    telegramId: tgUser.id,
    ...profileFromTelegram(tgUser),
    grade: null, // birinchi kirishda o'quvchi tanlaydi
    language: lang,
    role,
    premium: { plan: PLANS.FREE, until: null },
    blocked: false,
    settings: { notificationsEnabled: true },
    stats: {
      xp: 0,
      streakDays: 0,
      longestStreak: 0,
      lastActiveDay: null,
      topicsCompleted: 0,
      problemsSolved: 0,
      quizzesCompleted: 0,
    },
    createdAt: now,
    lastActiveAt: now,
  };
}

/** API orqali foydalanuvchining o'ziga qaytariladigan ko'rinish. */
export function toPublicUser(user) {
  return {
    id: String(user.telegramId),
    firstName: user.firstName,
    lastName: user.lastName ?? null,
    username: user.username ?? null,
    photoUrl: user.photoUrl ?? null,
    grade: user.grade ?? null,
    language: user.language,
    role: user.role ?? ROLES.STUDENT,
    premium: user.premium ?? { plan: PLANS.FREE, until: null },
    settings: user.settings ?? { notificationsEnabled: true },
    stats: user.stats,
    createdAt: user.createdAt,
  };
}
