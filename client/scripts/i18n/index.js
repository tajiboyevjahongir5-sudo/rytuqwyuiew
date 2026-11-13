import uz from './uz.js';

// Yangi til qo'shish: i18n/ru.js yarating va shu yerda ro'yxatga oling.
const dictionaries = { uz };
let current = 'uz';

export function setLanguage(code) {
  current = dictionaries[code] ? code : 'uz';
  document.documentElement.lang = current;
}

/** t('home.hello', { name: 'Ali' }) */
export function t(key, params = {}) {
  const template = dictionaries[current][key] ?? dictionaries.uz[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => (params[name] ?? `{${name}}`));
}
