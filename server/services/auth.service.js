import { InitDataError, validateInitData } from '../integrations/telegram/initData.js';
import { toPublicUser } from '../models/user.model.js';
import { AppError, forbidden, unauthorized } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

// Brauzerda ishlab chiqish uchun sinov foydalanuvchilari (faqat DEV_AUTH_ENABLED bo'lganda)
const DEV_USER_BASE_ID = 999_000_000;

export function createAuthService({ config, users, sessions }) {
  async function login(tgUser) {
    const { user, isNew } = await users.upsertFromTelegram(tgUser);
    if (user.blocked) throw forbidden('Hisobingiz bloklangan', 'USER_BLOCKED');
    return { ...sessions.issue(user.telegramId), user: toPublicUser(user), isNew };
  }

  return {
    async loginWithTelegram(initData) {
      if (!config.telegram.botToken) {
        throw new AppError(503, 'TELEGRAM_NOT_CONFIGURED', 'Telegram autentifikatsiyasi serverda sozlanmagan');
      }
      let verified;
      try {
        verified = validateInitData(initData, config.telegram.botToken, {
          maxAgeSeconds: config.telegram.initDataMaxAge,
        });
      } catch (err) {
        if (err instanceof InitDataError) {
          logger.warn('initData rad etildi', { reason: err.reason });
          throw unauthorized("Telegram ma'lumotlari tasdiqlanmadi", 'INVALID_INIT_DATA');
        }
        throw err;
      }
      return login(verified.user);
    },

    async loginAsDevUser(profile = 1) {
      if (!config.devAuthEnabled) throw forbidden("Dev kirish o'chirilgan", 'DEV_AUTH_DISABLED');
      return login({
        id: DEV_USER_BASE_ID + profile,
        first_name: 'Sinov',
        last_name: `O'quvchi ${profile}`,
        username: `physica_dev_${profile}`,
        language_code: 'uz',
      });
    },
  };
}
