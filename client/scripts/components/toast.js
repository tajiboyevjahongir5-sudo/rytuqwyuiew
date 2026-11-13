import { telegram } from '../telegram.js';
import { h } from '../utils/dom.js';
import { icon } from './icons.js';

const root = () => document.getElementById('toast-root');

function show(type, message, duration = 3000) {
  const el = h('div', { class: `toast toast--${type}`, role: type === 'error' ? 'alert' : 'status', dataset: { testid: `toast-${type}` } },
    icon(type === 'error' ? 'alert' : 'checkCircle', 'icon--sm'), message);
  root().append(el);
  telegram.haptic(type === 'error' ? 'error' : 'success');
  setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 220);
  }, duration);
}

export const toast = {
  success: (message) => show('success', message),
  error: (message) => show('error', message, 4000),
};
