import { closeActiveSheet } from './components/sheet.js';
import { errorState, loadingState } from './components/states.js';
import { renderTabbar, TABS } from './components/tabbar.js';
import { store } from './store.js';
import { telegram } from './telegram.js';
import { clear } from './utils/dom.js';
import { errorMessage } from './utils/errors.js';

// Hash asosidagi router: #/, #/textbooks, ... Server tomonda qo'shimcha sozlash talab qilmaydi.
// Har bir sahifa moduli: render(ctx) -> HTMLElement | Promise<HTMLElement>;
// element.cleanup() mavjud bo'lsa sahifadan chiqishda chaqiriladi (masalan, 3D resurslarni tozalash).

const TAB_PATHS = new Set(TABS.map((tab) => tab.path));

export function createRouter({ routes, notFound, view, tabbar }) {
  let currentCleanup = null;
  let renderId = 0;

  const currentPath = () => {
    const path = location.hash.replace(/^#/, '').split('?')[0] || '/';
    return path.length > 1 ? path.replace(/\/$/, '') : path;
  };

  function navigate(path, { replace = false } = {}) {
    if (path === currentPath()) return render();
    if (replace) location.replace(`#${path}`);
    else location.hash = path;
  }

  async function render() {
    const id = ++renderId;
    let path = currentPath();

    // Sinf tanlanmaguncha faqat onboarding ochiladi
    const needsOnboarding = !store.user?.grade;
    if (needsOnboarding && path !== '/onboarding') return navigate('/onboarding', { replace: true });
    if (!needsOnboarding && path === '/onboarding') return navigate('/', { replace: true });

    const route = routes[path] ?? notFound;
    const isTab = TAB_PATHS.has(path);
    const showTabbar = path !== '/onboarding';

    closeActiveSheet();
    try {
      currentCleanup?.();
    } finally {
      currentCleanup = null;
    }

    tabbar.hidden = !showTabbar;
    view.classList.toggle('view--no-tabbar', !showTabbar);
    if (showTabbar) renderTabbar(tabbar, isTab ? path : null);
    telegram.setBackButton(showTabbar && !isTab ? () => history.back() : null);

    const ctx = { navigate, rerender: render, path };
    try {
      const result = route(ctx);
      if (result instanceof Promise) clear(view).append(loadingState());
      const element = await result;
      if (id !== renderId) return; // foydalanuvchi boshqa sahifaga o'tib bo'lgan
      clear(view).append(element);
      currentCleanup = typeof element.cleanup === 'function' ? element.cleanup : null;
    } catch (err) {
      if (id !== renderId) return;
      console.error(err);
      clear(view).append(errorState({ text: errorMessage(err), onRetry: render }));
    }
    view.scrollTop = 0;
  }

  return {
    navigate,
    start() {
      window.addEventListener('hashchange', render);
      return render();
    },
  };
}
