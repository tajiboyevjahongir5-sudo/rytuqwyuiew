import { updateProfile } from '../auth.js';
import { gradePicker } from '../components/gradePicker.js';
import { toast } from '../components/toast.js';
import { t } from '../i18n/index.js';
import { h, withLoading } from '../utils/dom.js';
import { errorMessage } from '../utils/errors.js';

// Birinchi kirish: o'quvchi sinfini tanlaydi.
export function render({ navigate }) {
  const start = h('button', { class: 'btn btn--primary btn--block', type: 'button', disabled: true, dataset: { testid: 'onboarding-start' } }, t('onboarding.start'));
  const picker = gradePicker({ onChange: () => (start.disabled = false) });

  start.addEventListener('click', () =>
    withLoading(start, async () => {
      try {
        await updateProfile({ grade: picker.value });
        navigate('/', { replace: true });
      } catch (err) {
        toast.error(errorMessage(err));
      }
    }));

  return h('section', { class: 'page onboarding', dataset: { testid: 'page-onboarding' } },
    h('div', { class: 'onboarding__hero' },
      h('img', { src: 'assets/logo.svg', alt: '', width: 72, height: 72 }),
      h('h1', { class: 'onboarding__title' }, t('onboarding.title')),
      h('p', { class: 'onboarding__text' }, t('onboarding.text'))),
    h('div', { class: 'card card--glass' },
      h('h2', { class: 'section-title' }, t('onboarding.pick')),
      picker.element),
    start,
    h('p', { class: 'footnote' }, t('onboarding.note')));
}
