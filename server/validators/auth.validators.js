import { z } from 'zod';

export const telegramAuthSchema = z.strictObject({
  initData: z.string().min(1).max(8192),
});

export const devAuthSchema = z.strictObject({
  profile: z.number().int().min(1).max(9).optional(),
});
