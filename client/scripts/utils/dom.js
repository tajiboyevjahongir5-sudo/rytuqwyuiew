// Xavfsiz DOM yaratish yordamchilari. Foydalanuvchi ma'lumotlari hech qachon
// innerHTML orqali qo'yilmaydi — faqat matn tugunlari sifatida.

/**
 * h('button', { class: 'btn', onClick: fn, dataset: { testid: 'x' } }, 'Matn', childEl)
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in el && key !== 'list' && key !== 'form') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function clear(el) {
  el.replaceChildren();
  return el;
}

/** Tugmani async amal davomida loading holatiga o'tkazadi (ikki marta bosishdan himoya). */
export async function withLoading(button, action) {
  if (button.disabled) return undefined;
  const spinner = h('span', { class: 'spinner spinner--sm' });
  button.disabled = true;
  button.classList.add('is-loading');
  button.prepend(spinner);
  try {
    return await action();
  } finally {
    spinner.remove();
    button.classList.remove('is-loading');
    button.disabled = false;
  }
}
