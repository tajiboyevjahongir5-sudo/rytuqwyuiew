import { validationError } from '../utils/errors.js';

/** zod sxemasi bo'yicha req.body ni tekshiradi; natijani req.valid ga yozadi. */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return next(
      validationError(result.error.issues.map((i) => ({ field: i.path.join('.') || '(body)', message: i.message }))),
    );
  }
  req.valid = result.data;
  next();
};
