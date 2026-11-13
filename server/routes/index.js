import { Router } from 'express';
import { createAuthController } from '../controllers/auth.controller.js';
import { createSystemController } from '../controllers/system.controller.js';
import { createUserController } from '../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import { devAuthSchema, telegramAuthSchema } from '../validators/auth.validators.js';
import { updateProfileSchema } from '../validators/user.validators.js';

/**
 * /api/v1 marshrutlari. Yangi modul (textbooks, ai, quizzes, ...) qo'shilganda
 * shu yerga alohida router sifatida ulanadi.
 */
export function createApiRouter(deps) {
  const { config, services } = deps;
  const router = Router();
  const auth = authenticate(services);
  const authLimiter = createRateLimiter({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.authMax });

  const system = createSystemController(deps.system);
  const authCtl = createAuthController(services);
  const userCtl = createUserController(services);

  // ── Tizim ──
  router.get('/health', system.health);
  router.get('/config', system.publicConfig);

  // ── Autentifikatsiya ──
  router.post('/auth/telegram', authLimiter, validateBody(telegramAuthSchema), authCtl.telegram);
  router.post('/auth/dev', authLimiter, validateBody(devAuthSchema), authCtl.dev);

  // ── Profil ──
  router.get('/me', auth, userCtl.me);
  router.patch('/me', auth, validateBody(updateProfileSchema), userCtl.updateMe);

  // ── Admin (alohida himoyalangan) ──
  const admin = Router();
  admin.use(auth, requireAdmin);
  admin.get('/system/status', system.adminStatus);
  router.use('/admin', admin);

  return router;
}
