// Ichki SVG ikonlar to'plami (24x24, stroke). Tashqi kutubxona yuklanmaydi.
const PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 21H20"/><path d="M9 7.5h7"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  flask: '<path d="M9 3h6"/><path d="M10 3v6.5L4.6 18.4A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.6L14 9.5V3"/><path d="M7.5 15h9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.500 8 6.500"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 6 2.500 7 2.500 7h-17S6 15 6 9"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  flame: '<path d="M12 3s5 4.200 5 9.500A5 5 0 0 1 7 12.500c0-1.700.8-3 1.800-4 .3 1.500 1.200 2.300 1.200 2.300C10 8 12 3 12 3"/>',
  check: '<path d="M5 12.5l4.500 4.500L19 7.500"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.500l2.800 2.800L16 9.500"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.500v5.500"/><path d="M12 16.500h.01"/>',
  chevronRight: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  formula: '<path d="M18 4H7l6 8-6 8h11"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.500v7l6-3.500z"/>',
  quiz: '<rect x="4" y="3" width="16" height="18" rx="2.500"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  puzzle: '<path d="M9 4h6v3.200a2 2 0 1 0 0 3.600V14h-3.200a2 2 0 1 1-3.600 0H5V8h4z" transform="translate(1 3)"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.800 3 2.800 15 0 18M12 3c-2.800 3-2.800 15 0 18"/>',
  graduation: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.500V16c0 1.500 2.700 3 6 3s6-1.500 6-3v-4.500"/>',
  crown: '<path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.500"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  telegram: '<path d="M21 4 3 11l6 2.200L11 19l3-4 4.500 3.500z"/><path d="M9 13.200 21 4"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.300 6"/><path d="M20 5v6h-6"/>',
  star: '<path d="M12 3.500l2.600 5.300 5.900.9-4.300 4.100 1 5.800L12 16.900l-5.200 2.700 1-5.800-4.300-4.100 5.900-.9z"/>',
};

const NS = 'http://www.w3.org/2000/svg';
const cache = new Map();

/** @returns {SVGElement} */
export function icon(name, extraClass = '') {
  if (!PATHS[name]) throw new Error(`Noma'lum ikon: ${name}`);
  if (!cache.has(name)) {
    // PATHS — faqat shu fayldagi statik, ishonchli satrlar
    const doc = new DOMParser().parseFromString(`<svg xmlns="${NS}" viewBox="0 0 24 24">${PATHS[name]}</svg>`, 'image/svg+xml');
    cache.set(name, doc.documentElement);
  }
  const svg = document.importNode(cache.get(name), true);
  svg.setAttribute('class', `icon ${extraClass}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}
