// Barcha API javoblari bir xil ko'rinishda:
//   muvaffaqiyat: { ok: true,  data: ... }
//   xato:         { ok: false, error: { code, message, details? } }

export const sendOk = (res, data = null, status = 200) => res.status(status).json({ ok: true, data });

export const sendError = (res, status, code, message, details) => {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return res.status(status).json({ ok: false, error });
};

// async controllerlarni Express xato zanjiriga ulaydi
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
