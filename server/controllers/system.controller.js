import { GRADES, LANGUAGES } from '../../shared/constants.js';
import { asyncHandler, sendOk } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export function createSystemController({ config, store, users, version }) {
  async function dbStatus() {
    try {
      await store.ping();
      return 'ok';
    } catch (err) {
      logger.error("Ma'lumotlar bazasiga ulanib bo'lmadi", { err });
      return 'error';
    }
  }

  return {
    health: asyncHandler(async (_req, res) => {
      const db = await dbStatus();
      res.status(db === 'ok' ? 200 : 503).json({ ok: db === 'ok', data: { status: db === 'ok' ? 'ok' : 'degraded', db } });
    }),

    // Frontend uchun ochiq (maxfiy bo'lmagan) sozlamalar
    publicConfig: (_req, res) =>
      sendOk(res, {
        version,
        grades: GRADES,
        languages: LANGUAGES,
        devAuthEnabled: config.devAuthEnabled,
        telegramAuthEnabled: Boolean(config.telegram.botToken),
      }),

    adminStatus: asyncHandler(async (_req, res) => {
      const db = await dbStatus();
      sendOk(res, {
        version,
        env: config.env,
        uptimeSeconds: Math.round(process.uptime()),
        db: { driver: store.driver, status: db },
        telegram: { configured: Boolean(config.telegram.botToken), botEnabled: config.telegram.botEnabled },
        users: { total: db === 'ok' ? await users.count() : null },
        memoryMb: Math.round(process.memoryUsage().rss / 1048576),
      });
    }),
  };
}
