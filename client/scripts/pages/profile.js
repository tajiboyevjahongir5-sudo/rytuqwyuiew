import { updateProfile } from '../auth.js';
import { avatar } from '../components/avatar.js';
import { gradePicker } from '../components/gradePicker.js';
import { icon } from '../components/icons.js';
import { openSheet } from '../components/sheet.js';
import { toast } from '../components/toast.js';
import { t } from '../i18n/index.js';
import { store } from '../store.js';
import { telegram } from '../telegram.js';
import { h, withLoading } from '../utils/dom.js';
import { errorMessage } from '../utils/errors.js';

const PLAN_LABELS = { free: 'profile.planFree', premium: 'profile.planPremium', family: 'profile.planFamily' };

// dd.mm.yyyy — brauzer lokaliga bog'liq bo'lmagan ko'rinish
function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function row({ iconName, label, value, onClick, testid, control }) {
  const children = [
    h('span', { class: 'list__icon' }, icon(iconName, 'icon--sm')),
    h('span', { class: 'list__label' }, label),
    control ?? h('span', { class: 'list__value', dataset: testid ? { testid: `${testid}-value` } : {} }, value, onClick && icon('chevronRight', 'icon--sm')),
  ];
  return onClick
    ? h('button', { class: 'list__row', type: 'button', onClick, dataset: testid ? { testid } : {} }, children)
    : h('div', { class: 'list__row', dataset: testid ? { testid } : {} }, children);
}

function openGradeSheet(rerender) {
  const user = store.user;
  const save = h('button', { class: 'btn btn--primary btn--block', type: 'button', dataset: { testid: 'grade-save' } }, t('common.save'));
  const picker = gradePicker({ value: user.grade });
  const sheet = openSheet({
    title: t('profile.changeGrade'),
    testid: 'sheet-grade',
    content: h('div', { class: 'page' }, picker.element, save),
  });
  save.addEventListener('click', () =>
    withLoading(save, async () => {
      if (picker.value === user.grade) return sheet.close();
      try {
        await updateProfile({ grade: picker.value });
        sheet.close();
        toast.success(t('common.saved'));
        rerender();
      } catch (err) {
        toast.error(errorMessage(err));
      }
    }));
}

function openLanguageSheet(rerender) {
  const user = store.user;
  let sheet;
  const choose = async (lang, btn) => {
    if (lang.code === user.language) return sheet.close();
    await withLoading(btn, async () => {
      try {
        await updateProfile({ language: lang.code });
        sheet.close();
        toast.success(t('common.saved'));
        rerender();
      } catch (err) {
        toast.error(errorMessage(err));
      }
    });
  };
  const options = store.config.languages.map((lang) => {
    const selected = lang.code === user.language;
    const btn = h('button', {
      class: `option ${selected ? 'is-selected' : ''}`,
      type: 'button',
      disabled: !lang.enabled,
      dataset: { testid: `lang-${lang.code}` },
    }, h('span', {}, lang.name), selected ? icon('check', 'icon--sm') : !lang.enabled ? h('span', { class: 'chip chip--muted' }, t('common.soon')) : null);
    btn.addEventListener('click', () => choose(lang, btn));
    return btn;
  });
  sheet = openSheet({ title: t('profile.language'), testid: 'sheet-language', content: h('div', {}, options) });
}

function notificationSwitch() {
  const sw = h('button', {
    class: 'switch',
    type: 'button',
    role: 'switch',
    'aria-checked': String(store.user.settings.notificationsEnabled),
    'aria-label': t('profile.notifications'),
    dataset: { testid: 'notifications-switch' },
  });
  sw.addEventListener('click', async () => {
    const next = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(next)); // optimistik yangilash
    sw.disabled = true;
    telegram.haptic('light');
    try {
      await updateProfile({ settings: { notificationsEnabled: next } });
    } catch (err) {
      sw.setAttribute('aria-checked', String(!next)); // xatoda ortga qaytarish
      toast.error(errorMessage(err));
    } finally {
      sw.disabled = false;
    }
  });
  return sw;
}

export function render({ rerender }) {
  const user = store.user;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const language = store.config.languages.find((l) => l.code === user.language)?.name ?? user.language;

  return h('section', { class: 'page', dataset: { testid: 'page-profile' } },
    h('div', { class: 'profile-head' },
      avatar(user, 'lg'),
      h('h1', { class: 'profile-head__name', dataset: { testid: 'profile-name' } }, fullName),
      user.username && h('div', { class: 'profile-head__username' }, `@${user.username}`),
      h('div', { class: 'profile-head__chips' },
        h('span', { class: 'chip', dataset: { testid: 'profile-grade-chip' } }, icon('graduation', 'icon--sm'), t('common.grade', { n: user.grade })),
        h('span', { class: 'chip chip--violet', dataset: { testid: 'profile-plan' } }, icon('crown', 'icon--sm'), t(PLAN_LABELS[user.premium.plan] ?? PLAN_LABELS.free)),
        user.role === 'admin' && h('span', { class: 'chip chip--muted' }, t('profile.roleAdmin')))),

    h('section', {},
      h('h2', { class: 'section-title' }, t('profile.settings')),
      h('div', { class: 'card list' },
        row({ iconName: 'graduation', label: t('profile.grade'), value: t('common.grade', { n: user.grade }), onClick: () => openGradeSheet(rerender), testid: 'row-grade' }),
        row({ iconName: 'globe', label: t('profile.language'), value: language, onClick: () => openLanguageSheet(rerender), testid: 'row-language' }),
        row({ iconName: 'bell', label: t('profile.notifications'), control: notificationSwitch() }))),

    h('section', {},
      h('h2', { class: 'section-title' }, t('profile.account')),
      h('div', { class: 'card list' },
        row({ iconName: 'crown', label: t('profile.plan'), value: t(PLAN_LABELS[user.premium.plan] ?? PLAN_LABELS.free) }),
        row({ iconName: 'calendar', label: t('profile.joined'), value: formatDate(user.createdAt), testid: 'row-joined' }),
        row({ iconName: 'telegram', label: t('profile.telegramId'), value: user.id }))),

    h('p', { class: 'footnote' }, t('profile.version', { version: store.config.version })));
}
