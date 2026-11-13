import { rateLimit } from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';

export function createRateLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
      sendError(res, 429, 'RATE_LIMITED', "So'rovlar juda ko'p. Birozdan so'ng urinib ko'ring"),
  });
}
