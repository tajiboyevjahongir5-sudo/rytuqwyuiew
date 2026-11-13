import { ApiError } from '../api.js';
import { t } from '../i18n/index.js';

/** Xatoni foydalanuvchiga ko'rsatiladigan o'zbekcha matnga aylantiradi. */
export function errorMessage(err) {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR') return t('error.network');
    if (err.code === 'SESSION_EXPIRED' || err.code === 'INVALID_SESSION') return t('error.sessionExpired');
    if (err.status && err.status < 500 && err.message) return err.message; // server xabarlari o'zbek tilida
  }
  return t('error.generic');
}
