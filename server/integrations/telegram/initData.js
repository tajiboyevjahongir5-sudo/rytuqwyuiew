import crypto from 'node:crypto';

// Telegram Mini App initData ni rasmiy algoritm bo'yicha tekshiradi:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//   secret_key = HMAC_SHA256(key="WebAppData", data=bot_token)
//   hash       = hex(HMAC_SHA256(key=secret_key, data=data_check_string))

export class InitDataError extends Error {
  constructor(reason) {
    super(`initData yaroqsiz: ${reason}`);
    this.reason = reason;
  }
}

function secretKey(botToken) {
  return crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
}

function dataCheckString(params) {
  return [...params.entries()]
    .filter(([k]) => k !== 'hash')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

/**
 * @returns {{ user: object, authDate: number, raw: Record<string,string> }}
 * @throws {InitDataError}
 */
export function validateInitData(initData, botToken, { maxAgeSeconds = 86400, now = Date.now() } = {}) {
  if (!botToken) throw new InitDataError('bot token sozlanmagan');
  if (typeof initData !== 'string' || !initData || initData.length > 8192) throw new InitDataError('bo\'sh yoki juda uzun');

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) throw new InitDataError('hash yo\'q');

  const expected = crypto.createHmac('sha256', secretKey(botToken)).update(dataCheckString(params)).digest();
  const received = Buffer.from(hash, 'hex');
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new InitDataError('imzo mos kelmadi');
  }

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || authDate <= 0) throw new InitDataError('auth_date yo\'q');
  const ageSeconds = Math.floor(now / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds) throw new InitDataError('muddati o\'tgan');
  if (ageSeconds < -300) throw new InitDataError('auth_date kelajakda');

  let user;
  try {
    user = JSON.parse(params.get('user') ?? '');
  } catch {
    throw new InitDataError('user maydoni yo\'q');
  }
  if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) throw new InitDataError('user.id noto\'g\'ri');
  if (user.is_bot) throw new InitDataError('botlar kira olmaydi');

  return { user, authDate, raw: Object.fromEntries(params) };
}

/** Berilgan maydonlardan imzolangan initData satrini yasaydi (testlar va dev vositalari uchun). */
export function signInitData(fields, botToken) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) params.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  const hash = crypto.createHmac('sha256', secretKey(botToken)).update(dataCheckString(params)).digest('hex');
  params.set('hash', hash);
  return params.toString();
}
