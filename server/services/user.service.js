import { COLLECTIONS, ROLES } from '../../shared/constants.js';
import { newUser, profileFromTelegram } from '../models/user.model.js';
import { DocumentExistsError } from '../db/memoryStore.js';
import { dayDiff, localDay } from '../utils/dates.js';
import { notFound } from '../utils/errors.js';

const USERS = COLLECTIONS.USERS;

/** Kunlik faollik seriyasining keyingi qiymatini hisoblaydi (sof funksiya). */
export function nextStreak(stats, today) {
  const last = stats?.lastActiveDay ?? null;
  if (last === today) return null; // bugun allaqachon hisoblangan
  const gap = last ? dayDiff(last, today) : null;
  const streakDays = gap === 1 ? (stats.streakDays ?? 0) + 1 : 1;
  return {
    streakDays,
    longestStreak: Math.max(stats?.longestStreak ?? 0, streakDays),
    lastActiveDay: today,
  };
}

export function createUserService({ store, adminIds = [], clock = () => new Date() }) {
  const admins = new Set(adminIds.map(String));
  const roleFor = (telegramId) => (admins.has(String(telegramId)) ? ROLES.ADMIN : ROLES.STUDENT);

  async function getById(id) {
    const user = await store.get(USERS, id);
    // Rol har doim server konfiguratsiyasidan olinadi
    return user ? { ...user, role: roleFor(user.telegramId) } : null;
  }

  return {
    roleFor,
    getById,

    /**
     * Tekshirilgan Telegram foydalanuvchisi uchun profilni yaratadi yoki yangilaydi
     * va kunlik faollikni qayd etadi.
     * @returns {{ user: object, isNew: boolean }}
     */
    async upsertFromTelegram(tgUser) {
      const now = clock();
      const iso = now.toISOString();
      const id = String(tgUser.id);
      const role = roleFor(id);
      let existing = await store.get(USERS, id);
      let isNew = false;

      if (!existing) {
        try {
          await store.create(USERS, id, newUser(tgUser, { now: iso, role }));
          isNew = true;
        } catch (err) {
          if (!(err instanceof DocumentExistsError)) throw err; // parallel birinchi kirish
        }
        existing = await store.get(USERS, id);
      }

      const patch = { ...profileFromTelegram(tgUser), role, lastActiveAt: iso };
      const streak = nextStreak(existing.stats, localDay(now));
      if (streak) {
        patch['stats.streakDays'] = streak.streakDays;
        patch['stats.longestStreak'] = streak.longestStreak;
        patch['stats.lastActiveDay'] = streak.lastActiveDay;
      }
      await store.update(USERS, id, patch);
      return { user: await getById(id), isNew };
    },

    /** Foydalanuvchi o'zi o'zgartira oladigan maydonlar: grade, language, settings. */
    async updateProfile(id, { grade, language, settings }) {
      const patch = {};
      if (grade !== undefined) patch.grade = grade;
      if (language !== undefined) patch.language = language;
      if (settings?.notificationsEnabled !== undefined) {
        patch['settings.notificationsEnabled'] = settings.notificationsEnabled;
      }
      if (!(await store.get(USERS, id))) throw notFound('Foydalanuvchi topilmadi');
      if (Object.keys(patch).length) await store.update(USERS, id, patch);
      return getById(id);
    },

    count: () => store.count(USERS),
  };
}
