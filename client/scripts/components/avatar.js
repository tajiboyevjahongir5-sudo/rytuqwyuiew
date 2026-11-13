import { h } from '../utils/dom.js';

/** Profil rasmi; rasm bo'lmasa yoki yuklanmasa ism bosh harfi ko'rsatiladi. */
export function avatar(user, size = '') {
  const initial = (user.firstName ?? '?').trim().charAt(0).toUpperCase() || '?';
  const el = h('div', { class: `avatar ${size ? `avatar--${size}` : ''}`, dataset: { testid: 'avatar' } }, initial);
  if (user.photoUrl) {
    const img = h('img', { alt: '', referrerPolicy: 'no-referrer', loading: 'lazy' });
    img.addEventListener('load', () => el.replaceChildren(img));
    img.addEventListener('error', () => img.remove());
    img.src = user.photoUrl;
  }
  return el;
}
