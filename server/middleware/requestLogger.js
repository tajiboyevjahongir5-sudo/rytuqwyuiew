import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const started = process.hrtime.bigint();
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('http', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl.split('?')[0], // query string loglanmaydi
      status: res.statusCode,
      ms: Math.round(ms * 10) / 10,
      userId: req.user ? String(req.user.telegramId) : undefined,
    });
  });
  next();
}
