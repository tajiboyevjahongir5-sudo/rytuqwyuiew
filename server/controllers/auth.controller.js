import { asyncHandler, sendOk } from '../utils/apiResponse.js';

export function createAuthController({ auth }) {
  return {
    telegram: asyncHandler(async (req, res) => {
      sendOk(res, await auth.loginWithTelegram(req.valid.initData));
    }),
    dev: asyncHandler(async (req, res) => {
      sendOk(res, await auth.loginAsDevUser(req.valid.profile));
    }),
  };
}
