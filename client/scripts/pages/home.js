import { avatar } from '../components/avatar.js';
import { icon } from '../components/icons.js';
import { openSheet } from '../components/sheet.js';
import { emptyState } from '../components/states.js';
import { t } from '../i18n/index.js';
import { store } from '../store.js';
import { h } from '../utils/dom.js';

function header(user) {
  const openNotifications = () =>
    openSheet({
      title: t('home.notifications'),
      testid: 'sheet-notifications',
      content: emptyState({ iconName: 'bell', title: t('home.notificationsEmptyTitle'), text: t('home.notificationsEmptyText') }),
    });

  return h('header', { class: 'home-header' },
    h('div', { class: 'home-header__main' },
      h('div', { class: 'home-header__brand' }, h('img', { src: 'assets/logo.svg', alt: '', width: 20, height: 20 }), 'PHYSICA'),
      h('h1', { class: 'home-header__hello', dataset: { testid: 'greeting' } }, t('home.hello', { name: user.firstName })),
      h('div', { class: 'home-header__meta' },
        h('span', { class: 'chip', dataset: { testid: 'home-grade' } }, icon('graduation', 'icon--sm'), t('common.grade', { n: user.grade })))),
    h('div', { class: 'home-header__actions' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('home.notifications'), onClick: openNotifications, dataset: { testid: 'notifications-btn' } }, icon('bell')),
      h('a', { class: 'avatar-link', href: '#/profile', 'aria-label': t('nav.profile') }, avatar(user))));
}

function aiHero() {
  return h('section', { class: 'ai-hero', dataset: { testid: 'ai-hero' } },
    h('span', { class: 'ai-hero__badge' }, icon('sparkles', 'icon--sm'), t('home.aiBadge')),
    h('h2', { class: 'ai-hero__title' }, t('home.aiTitle')),
    h('p', { class: 'ai-hero__text' }, t('home.aiText')),
    h('a', { class: 'btn btn--light', href: '#/ai', dataset: { testid: 'ai-cta' } }, t('home.aiCta'), icon('chevronRight', 'icon--sm')));
}

// PHASE 2 da oxirgi o'qilgan mavzu shu yerda ko'rsatiladi; hozircha progress yo'q.
function continueCard() {
  return h('section', {},
    h('h2', { class: 'section-title' }, t('home.continueTitle')),
    h('div', { class: 'card continue-card', dataset: { testid: 'continue-empty' } },
      h('div', { class: 'list__icon' }, icon('book')),
      h('div', { class: 'continue-card__body' },
        h('div', { class: 'continue-card__title' }, t('home.continueEmptyTitle')),
        h('div', { class: 'continue-card__text' }, t('home.continueEmptyText'))),
      h('a', { class: 'btn btn--ghost btn--sm', href: '#/textbooks' }, t('home.continueEmptyCta'))));
}

function stats(user) {
  const s = user.stats ?? {};
  const items = [
    ['flame', s.streakDays ?? 0, 'home.statStreak', 'stat-streak'],
    ['book', s.topicsCompleted ?? 0, 'home.statTopics', 'stat-topics'],
    ['puzzle', s.problemsSolved ?? 0, 'home.statProblems', 'stat-problems'],
    ['quiz', s.quizzesCompleted ?? 0, 'home.statQuizzes', 'stat-quizzes'],
  ];
  return h('section', {},
    h('h2', { class: 'section-title' }, t('home.stats')),
    h('div', { class: 'stats-grid' },
      items.map(([ic, value, label, testid]) =>
        h('div', { class: 'card stat' },
          h('div', { class: 'stat__icon' }, icon(ic)),
          h('div', { class: 'stat__value', dataset: { testid } }, value),
          h('div', { class: 'stat__label' }, t(label))))));
}

function quickAccess() {
  const items = [
    ['/formulas', 'formula', 'home.quickFormulas'],
    ['/videos', 'play', 'home.quickVideos'],
    ['/quizzes', 'quiz', 'home.quickQuizzes'],
    ['/lab', 'flask', 'home.quickLab'],
  ];
  return h('section', {},
    h('h2', { class: 'section-title' }, t('home.quick')),
    h('div', { class: 'quick-grid' },
      items.map(([path, ic, label]) => h('a', { class: 'quick', href: `#${path}`, dataset: { testid: `quick-${ic}` } }, icon(ic), t(label)))));
}

export function render() {
  const user = store.user;
  return h('section', { class: 'page', dataset: { testid: 'page-home' } },
    header(user), aiHero(), continueCard(), stats(user), quickAccess());
}
