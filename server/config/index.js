import { z } from 'zod';

const bool = (def) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

const int = (def, min = 0) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : Number(v)))
    .pipe(z.number().int().min(min));

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: int(3000, 0),
  TRUST_PROXY: int(0, 0),
  CORS_ORIGINS: csv,
  SESSION_SECRET: z.string().optional().default(''),
  SESSION_TTL_SECONDS: int(43200, 60),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_INITDATA_MAX_AGE: int(86400, 60),
  ADMIN_TELEGRAM_IDS: csv,
  MINI_APP_URL: z.string().optional().default(''),
  BOT_ENABLED: bool(false),
  DB_DRIVER: z.enum(['firestore', 'local', 'memory']).default('local'),
  LOCAL_DB_FILE: z.string().optional().default('.data/db.json'),
  FIREBASE_SERVICE_ACCOUNT: z.string().optional().default(''),
  FIREBASE_PROJECT_ID: z.string().optional().default(''),
  FIREBASE_STORAGE_BUCKET: z.string().optional().default(''),
  DEV_AUTH_ENABLED: bool(false),
  RATE_LIMIT_WINDOW_MS: int(60000, 1000),
  RATE_LIMIT_MAX: int(120, 1),
  AUTH_RATE_LIMIT_MAX: int(20, 1),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
});

export class ConfigError extends Error {}

/**
 * Muhit o'zgaruvchilaridan tekshirilgan konfiguratsiya yaratadi.
 * Noto'g'ri yoki xavfli sozlamada ishga tushmaydi (fail fast).
 */
export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ConfigError(`Konfiguratsiya xatosi — ${issues}`);
  }
  const e = parsed.data;
  const isProd = e.NODE_ENV === 'production';
  const problems = [];

  if (e.SESSION_SECRET.length < 32) {
    problems.push("SESSION_SECRET kamida 32 belgidan iborat bo'lishi kerak");
  }
  if (e.ADMIN_TELEGRAM_IDS.some((id) => !/^\d+$/.test(id))) {
    problems.push("ADMIN_TELEGRAM_IDS faqat raqamli Telegram ID lardan iborat bo'lishi kerak");
  }
  if (isProd) {
    if (!e.TELEGRAM_BOT_TOKEN) problems.push('production uchun TELEGRAM_BOT_TOKEN majburiy');
    if (e.DB_DRIVER !== 'firestore') problems.push("production uchun DB_DRIVER=firestore bo'lishi kerak");
  }
  if (e.DB_DRIVER === 'firestore' && !e.FIREBASE_SERVICE_ACCOUNT && !env.GOOGLE_APPLICATION_CREDENTIALS && !env.FIRESTORE_EMULATOR_HOST) {
    problems.push('DB_DRIVER=firestore uchun FIREBASE_SERVICE_ACCOUNT yoki GOOGLE_APPLICATION_CREDENTIALS kerak');
  }
  if (e.BOT_ENABLED && !e.TELEGRAM_BOT_TOKEN) problems.push('BOT_ENABLED=true uchun TELEGRAM_BOT_TOKEN kerak');
  if (problems.length) throw new ConfigError(`Konfiguratsiya xatosi — ${problems.join('; ')}`);

  return Object.freeze({
    env: e.NODE_ENV,
    isProd,
    port: e.PORT,
    trustProxy: e.TRUST_PROXY,
    corsOrigins: e.CORS_ORIGINS,
    session: { secret: e.SESSION_SECRET, ttlSeconds: e.SESSION_TTL_SECONDS },
    telegram: {
      botToken: e.TELEGRAM_BOT_TOKEN,
      initDataMaxAge: e.TELEGRAM_INITDATA_MAX_AGE,
      adminIds: e.ADMIN_TELEGRAM_IDS,
      miniAppUrl: e.MINI_APP_URL,
      botEnabled: e.BOT_ENABLED,
    },
    db: { driver: e.DB_DRIVER, localFile: e.LOCAL_DB_FILE },
    firebase: {
      serviceAccount: e.FIREBASE_SERVICE_ACCOUNT,
      projectId: e.FIREBASE_PROJECT_ID,
      storageBucket: e.FIREBASE_STORAGE_BUCKET,
    },
    // Dev kirish production da hech qachon yoqilmaydi
    devAuthEnabled: e.DEV_AUTH_ENABLED && !isProd,
    rateLimit: { windowMs: e.RATE_LIMIT_WINDOW_MS, max: e.RATE_LIMIT_MAX, authMax: e.AUTH_RATE_LIMIT_MAX },
    logLevel: e.LOG_LEVEL,
  });
}
