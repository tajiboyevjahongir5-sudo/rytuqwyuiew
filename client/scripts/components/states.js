import { t } from '../i18n/index.js';
import { h } from '../utils/dom.js';
import { icon } from './icons.js';

export function loadingState(text = t('common.loading')) {
  return h('div', { class: 'state state--full', role: 'status', dataset: { testid: 'state-loading' } },
    h('div', { class: 'spinner' }),
    h('p', { class: 'state__text' }, text));
}

export function emptyState({ iconName = 'star', title, text, action, tone = '' }) {
  return h('div', { class: 'state', dataset: { testid: 'state-empty' } },
    h('div', { class: `state__icon ${tone ? `state__icon--${tone}` : ''}` }, icon(iconName, 'icon--lg')),
    h('h2', { class: 'state__title' }, title),
    text && h('p', { class: 'state__text' }, text),
    action);
}

export function errorState({ title = t('error.title'), text, onRetry, full = true }) {
  return h('div', { class: `state ${full ? 'state--full' : ''}`, role: 'alert', dataset: { testid: 'state-error' } },
    h('div', { class: 'state__icon state__icon--error' }, icon('alert', 'icon--lg')),
    h('h2', { class: 'state__title' }, title),
    text && h('p', { class: 'state__text' }, text),
    onRetry && h('button', { class: 'btn btn--ghost', type: 'button', onClick: onRetry, dataset: { testid: 'retry' } },
      icon('refresh', 'icon--sm'), t('common.retry')));
}
