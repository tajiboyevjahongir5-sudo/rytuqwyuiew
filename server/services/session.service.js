import jwt from 'jsonwebtoken';
import { unauthorized } from '../utils/errors.js';

const ISSUER = 'physica';
const ALGORITHM = 'HS256';

// Sessiya tokeni faqat foydalanuvchi ID sini saqlaydi. Rol va bloklash holati
// har so'rovda bazadan/konfiguratsiyadan olinadi, tokenga ishonilmaydi.
export function createSessionService({ secret, ttlSeconds }) {
  return {
    issue(userId) {
      const token = jwt.sign({}, secret, {
        algorithm: ALGORITHM,
        subject: String(userId),
        issuer: ISSUER,
        expiresIn: ttlSeconds,
      });
      return { token, expiresIn: ttlSeconds };
    },
    verify(token) {
      try {
        const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM], issuer: ISSUER });
        if (!payload.sub) throw new Error('sub yo\'q');
        return { userId: payload.sub };
      } catch (err) {
        if (err.name === 'TokenExpiredError') throw unauthorized('Sessiya muddati tugagan', 'SESSION_EXPIRED');
        throw unauthorized('Sessiya tokeni yaroqsiz', 'INVALID_SESSION');
      }
    },
  };
}
