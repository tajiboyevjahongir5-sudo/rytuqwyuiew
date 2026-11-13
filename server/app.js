import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { API_PREFIX } from '../shared/constants.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createApiRouter } from './routes/index.js';
import { createAuthService } from './services/auth.service.js';
import { createSessionService } from './services/session.service.js';
import { createUserService } from './services/user.service.js';

const { version } = createRequire(import.meta.url)('../package.json');
const CLIENT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client');

/** Servislarni yig'adi (dependency injection) — testlarda ham shu ishlatiladi. */
export function createServices({ config, store }) {
  const sessions = createSessionService(config.session);
  const users = createUserService({ store, adminIds: config.telegram.adminIds });
  const auth = createAuthService({ config, users, sessions });
  return { sessions, users, auth };
}

export function createApp({ config, store }) {
  const app = express();
  const services = createServices({ config, store });

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      // Mini App Telegram ichida (shu jumladan web.telegram.org iframe ida) ochiladi
      frameguard: false,
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", 'https://telegram.org'],
          'style-src': ["'self'"],
          'img-src': ["'self'", 'data:', 'blob:', 'https://t.me', 'https://*.telegram.org'],
          'media-src': ["'self'", 'blob:', 'https:'],
          'connect-src': ["'self'"],
          'frame-ancestors': ["'self'", 'https://web.telegram.org', 'https://*.telegram.org'],
          'upgrade-insecure-requests': config.isProd ? [] : null,
        },
      },
    }),
  );

  // Frontend alohida domenda bo'lsa, faqat ruxsat berilgan originlar
  if (config.corsOrigins.length) {
    app.use(API_PREFIX, cors({ origin: config.corsOrigins, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'], maxAge: 600 }));
  }

  app.use(requestLogger);
  app.use(API_PREFIX, createRateLimiter(config.rateLimit));
  app.use(API_PREFIX, express.json({ limit: '100kb' }));
  app.use(API_PREFIX, (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(
    API_PREFIX,
    createApiRouter({ config, services, system: { config, store, users: services.users, version } }),
  );
  app.use(API_PREFIX, apiNotFound);

  // Frontend (statik). Alohida hostingda ham joylashtirish mumkin.
  app.use(express.static(CLIENT_DIR, { extensions: ['html'], maxAge: config.isProd ? '10m' : 0 }));

  app.use(errorHandler);
  return app;
}
