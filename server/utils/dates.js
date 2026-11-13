// Kunlik faollik O'zbekiston vaqti bo'yicha hisoblanadi.
export const APP_TIMEZONE = 'Asia/Tashkent';

const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/** YYYY-MM-DD (Toshkent vaqti) */
export const localDay = (date = new Date()) => formatter.format(date);

/** Ikki YYYY-MM-DD sana orasidagi kunlar farqi (b - a) */
export function dayDiff(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
