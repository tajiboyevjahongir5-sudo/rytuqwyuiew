import { api, ApiError, onSessionExpired, setToken } from './api.js';
import { store } from './store.js';
import { telegram } from './telegram.js';

export class NotInTelegramError extends Error {}

/**
 * Foydalanuvchini aniqlaydi:
 *  1) Telegram ichida — imzolangan initData serverda tekshiriladi;
 *  2) oddiy brauzerda — faqat server DEV_AUTH_ENABLED bo'lsa sinov foydalanuvchisi.
 * Foydalanuvchi ID si hech qachon frontenddan yuborilmaydi.
 */
export async function authenticate() {
  let session;
  if (telegram.isAvailable) {
    session = await api.post('/auth/telegram', { initData: telegram.initData });
  } else if (store.config?.devAuthEnabled) {
    session = await api.post('/auth/dev', {});
  } else {
    throw new NotInTelegramError();
  }
  setToken(session.token); // token faqat xotirada saqlanadi
  store.setUser(session.user);
  return session;
}

onSessionExpired(authenticate);

export async function updateProfile(patch) {
  const { user } = await api.patch('/me', patch);
  store.setUser(user);
  return user;
}

export { ApiError };
