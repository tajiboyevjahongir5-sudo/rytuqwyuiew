import { Bot } from 'grammy';
import { logger } from '../server/utils/logger.js';
import { registerAdmin } from './handlers/admin.js';
import { registerStart } from './handlers/start.js';

/** Bot obyektini yaratadi (tarmoqqa ulanmasdan) — testlarda ham ishlatiladi. */
export function createBot({ config, store }, botOptions = {}) {
  const bot = new Bot(config.telegram.botToken, botOptions);
  registerStart(bot, { config });
  registerAdmin(bot, { config, store });
  bot.catch((err) => logger.error('Telegram bot xatosi', { err: err.error ?? err }));
  return bot;
}

/** Botni long polling rejimida ishga tushiradi. */
export async function startBot(deps) {
  const bot = createBot(deps);
  await bot.api.setMyCommands([{ command: 'start', description: 'PHYSICA ni ochish' }]);
  bot.start({ onStart: (info) => logger.info('Telegram bot ishga tushdi', { username: info.username }) });
  return bot;
}
