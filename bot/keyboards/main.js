import { InlineKeyboard } from 'grammy';

/** Mini App ni ochuvchi tugma. URL HTTPS bo'lishi shart (Telegram talabi). */
export function openAppKeyboard(miniAppUrl) {
  return new InlineKeyboard().webApp("🚀 PHYSICA ni ochish", miniAppUrl);
}
