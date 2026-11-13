import { emptyState } from '../components/states.js';
import { t } from '../i18n/index.js';
import { h } from '../utils/dom.js';

export function render() {
  return h('section', { class: 'page', dataset: { testid: 'page-not-found' } },
    emptyState({
      iconName: 'alert',
      title: t('error.notFoundTitle'),
      text: t('error.notFoundText'),
      action: h('a', { class: 'btn btn--ghost', href: '#/' }, t('error.goHome')),
    }));
}
