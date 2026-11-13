// Ilovaning barcha kutilgan xatolari shu klass orqali beriladi.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, 'BAD_REQUEST', message, details);
export const validationError = (details) =>
  new AppError(400, 'VALIDATION_ERROR', "Yuborilgan ma'lumotlar noto'g'ri", details);
export const unauthorized = (message = 'Autentifikatsiya talab qilinadi', code = 'UNAUTHORIZED') =>
  new AppError(401, code, message);
export const forbidden = (message = "Bu amal uchun ruxsat yo'q", code = 'FORBIDDEN') =>
  new AppError(403, code, message);
export const notFound = (message = 'Topilmadi') => new AppError(404, 'NOT_FOUND', message);
export const tooManyRequests = (message = "So'rovlar juda ko'p. Birozdan so'ng urinib ko'ring") =>
  new AppError(429, 'RATE_LIMITED', message);
