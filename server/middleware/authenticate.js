import { forbidden, unauthorized } from '../utils/errors.js';
import { asyncHandler } from '../utils/apiResponse.js';

// Authorization: Bearer <sessiya tokeni> ni tekshiradi va req.user ni bazadan yuklaydi.
// Foydalanuvchi ID si hech qachon so'rov tanasi yoki parametrlaridan olinmaydi.
export function authenticate({ sessions, users }) {
  return asyncHandler(async (req, _res, next) => {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthorized();
    const { userId } = sessions.verify(token);
    const user = await users.getById(userId);
    if (!user) throw unauthorized('Foydalanuvchi topilmadi', 'INVALID_SESSION');
    if (user.blocked) throw forbidden('Hisobingiz bloklangan', 'USER_BLOCKED');
    req.user = user;
    next();
  });
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(forbidden('Faqat adminlar uchun', 'ADMIN_ONLY'));
  next();
}
