import { t } from '../i18n/index.js';
import { h } from '../utils/dom.js';
import { icon } from './icons.js';

let active = null;

/**
 * Pastdan chiqadigan modal oyna.
 * @returns {{ close: () => void }}
 */
export function openSheet({ title, content, testid = 'sheet' }) {
  active?.close();
  const previousFocus = document.activeElement;

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    if (active?.close === close) active = null;
    previousFocus?.focus?.();
  };
  const onKey = (e) => e.key === 'Escape' && close();

  const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('common.close'), onClick: close, dataset: { testid: 'sheet-close' } }, icon('close'));
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, dataset: { testid } },
    h('div', { class: 'sheet__handle' }),
    h('div', { class: 'sheet__header' }, h('h2', { class: 'sheet__title' }, title), closeBtn),
    content);
  const overlay = h('div', { class: 'sheet-overlay', onClick: (e) => e.target === overlay && close() }, sheet);

  document.getElementById('sheet-root').append(overlay);
  document.addEventListener('keydown', onKey);
  closeBtn.focus();
  active = { close };
  return active;
}

export const closeActiveSheet = () => active?.close();
