import { z } from 'zod';
import { ENABLED_LANGUAGE_CODES, GRADES } from '../../shared/constants.js';

export const updateProfileSchema = z
  .strictObject({
    grade: z.number().int().refine((g) => GRADES.includes(g), "Sinf 1 dan 11 gacha bo'lishi kerak").optional(),
    language: z.enum(ENABLED_LANGUAGE_CODES).optional(),
    settings: z.strictObject({ notificationsEnabled: z.boolean().optional() }).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Kamida bitta maydon yuborilishi kerak");
