import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export function apiNotFound(_req, res) {
  sendError(res, 404, 'NOT_FOUND', 'Bunday API manzili mavjud emas');
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message, err.details);
  }
  if (err?.type === 'entity.parse.failed') {
    return sendError(res, 400, 'BAD_REQUEST', "So'rov tanasi noto'g'ri JSON");
  }
  if (err?.type === 'entity.too.large') {
    return sendError(res, 413, 'PAYLOAD_TOO_LARGE', "So'rov hajmi juda katta");
  }
  // Kutilmagan xato: tafsilotlar faqat logga yoziladi, mijozga chiqarilmaydi
  logger.error('Kutilmagan server xatosi', { requestId: req.id, path: req.path, err });
  sendError(res, 500, 'INTERNAL_ERROR', "Serverda xatolik yuz berdi. Keyinroq urinib ko'ring");
}
