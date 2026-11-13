import { store } from '../store.js';
import { telegram } from '../telegram.js';
import { h } from '../utils/dom.js';

/**
 * Sinf tanlash paneli (1–11).
 * @returns {{ element: HTMLElement, get value(): number|null }}
 */
export function gradePicker({ value = null, onChange } = {}) {
  let selected = value;
  const buttons = new Map();

  const select = (grade) => {
    selected = grade;
    for (const [g, btn] of buttons) {
      btn.classList.toggle('is-selected', g === grade);
      btn.setAttribute('aria-checked', String(g === grade));
    }
    telegram.haptic('select');
    onChange?.(grade);
  };

  const element = h('div', { class: 'grade-grid', role: 'radiogroup', dataset: { testid: 'grade-picker' } },
    store.config.grades.map((grade) => {
      const btn = h('button', {
        class: `grade-option ${grade === selected ? 'is-selected' : ''}`,
        type: 'button',
        role: 'radio',
        'aria-checked': String(grade === selected),
        dataset: { testid: `grade-${grade}` },
        onClick: () => select(grade),
      }, h('span', { class: 'grade-option__num' }, grade), h('span', { class: 'grade-option__label' }, 'sinf'));
      buttons.set(grade, btn);
      return btn;
    }));

  return {
    element,
    get value() {
      return selected;
    },
  };
}
