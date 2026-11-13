import { COLLECTIONS } from '../../shared/constants.js';
import { adminOnly } from '../middleware/adminOnly.js';

// PHASE 1: faqat tizim holati. To'liq kontent boshqaruvi PHASE 4 da qo'shiladi.
export function registerAdmin(bot, { config, store }) {
  bot.command('status', adminOnly(config.telegram.adminIds), async (ctx) => {
    let db = 'ok';
    let total = '—';
    try {
      await store.ping();
      total = await store.count(COLLECTIONS.USERS);
    } catch {
      db = 'xato';
    }
    await ctx.reply(
      `🛠 Tizim holati\n\n` +
        `Muhit: ${config.env}\n` +
        `Baza (${store.driver}): ${db}\n` +
        `Foydalanuvchilar: ${total}\n` +
        `Ishlash vaqti: ${Math.round(process.uptime() / 60)} daqiqa`,
    );
  });
}
