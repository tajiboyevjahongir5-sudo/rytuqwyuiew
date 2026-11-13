/** Faqat ruxsat berilgan Telegram ID lar uchun keyingi handlerlarni ishga tushiradi. */
export function isAdmin(adminIds, ctx) {
  return Boolean(ctx.from) && adminIds.map(String).includes(String(ctx.from.id));
}

export function adminOnly(adminIds) {
  return async (ctx, next) => {
    if (!isAdmin(adminIds, ctx)) {
      await ctx.reply("⛔ Bu buyruq faqat adminlar uchun.");
      return;
    }
    await next();
  };
}
