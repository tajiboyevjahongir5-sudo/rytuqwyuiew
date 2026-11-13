import { emptyState } from '../components/states.js';
import { h } from '../utils/dom.js';
import { t } from '../i18n/index.js';

const ICONS = { textbooks: 'book', ai: 'sparkles', lab: 'flask', formulas: 'formula', videos: 'play', quizzes: 'quiz' };

/**
 * Hali ishlab chiqilmagan modul sahifasi. Soxta kontent ko'rsatilmaydi —
 * faqat bo'lim nima uchun mo'ljallangani va holati ochiq aytiladi.
 */
export function upcomingPage(module) {
  return () =>
    h('section', { class: 'page', dataset: { testid: `page-${module}` } },
      h('h1', { class: 'page-title' }, t(`upcoming.${module}.title`)),
      h('div', { class: 'card card--glass' },
        emptyState({
          iconName: ICONS[module],
          tone: module === 'ai' ? 'violet' : '',
          title: t('common.inDevelopment'),
          text: t(`upcoming.${module}.text`),
          action: h('span', { class: 'chip chip--muted' }, t('common.soon')),
        })),
      h('p', { class: 'footnote' }, t('upcoming.note')));
}
