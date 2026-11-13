import { toPublicUser } from '../models/user.model.js';
import { asyncHandler, sendOk } from '../utils/apiResponse.js';

export function createUserController({ users }) {
  return {
    me: asyncHandler(async (req, res) => {
      sendOk(res, { user: toPublicUser(req.user) });
    }),
    updateMe: asyncHandler(async (req, res) => {
      const user = await users.updateProfile(String(req.user.telegramId), req.valid);
      sendOk(res, { user: toPublicUser(user) });
    }),
  };
}
