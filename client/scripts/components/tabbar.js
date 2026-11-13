import { t } from '../i18n/index.js';
import { telegram } from '../telegram.js';
import { clear, h } from '../utils/dom.js';
import { icon } from './icons.js';

export const TABS = [
  { path: '/', label: 'nav.home', icon: 'home' },
  { path: '/textbooks', label: 'nav.textbooks', icon: 'book' },
  { path: '/ai', label: 'nav.ai', icon: 'sparkles', modifier: 'ai' },
  { path: '/lab', label: 'nav.lab', icon: 'flask' },
  { path: '/profile', label: 'nav.profile', icon: 'user' },
];

export function renderTabbar(container, activePath) {
  clear(container).append(
    ...TABS.map((tab) =>
      h('a', {
        class: `tabbar__item ${tab.modifier ? `tabbar__item--${tab.modifier}` : ''} ${tab.path === activePath ? 'is-active' : ''}`,
        href: `#${tab.path}`,
        'aria-current': tab.path === activePath ? 'page' : null,
        dataset: { testid: `tab-${tab.icon}` },
        onClick: () => telegram.haptic('select'),
      }, icon(tab.icon), h('span', {}, t(tab.label)))),
  );
}
