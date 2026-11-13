import { openAppKeyboard } from '../keyboards/main.js';

export function registerStart(bot, { config }) {
  bot.command('start', async (ctx) => {
    const name = ctx.from?.first_name ?? "o'quvchi";
    const text =
      `Salom, ${name}! 👋\n\n` +
      `PHYSICA — fizikani hayotiy hodisalar orqali tushuntiradigan ta'lim platformasi.\n` +
      `Fizikani o'rganma, uni his qil!`;
    if (!config.telegram.miniAppUrl) {
      await ctx.reply(`${text}\n\n⚠️ Mini App manzili hali sozlanmagan.`);
      return;
    }
    await ctx.reply(text, { reply_markup: openAppKeyboard(config.telegram.miniAppUrl) });
  });
}
