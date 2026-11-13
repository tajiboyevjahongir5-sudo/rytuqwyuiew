import { ApiError, api } from './api.js';
import { authenticate, NotInTelegramError } from './auth.js';
import { emptyState, errorState } from './components/states.js';
import { setLanguage, t } from './i18n/index.js';
import * as home from './pages/home.js';
import * as notFound from './pages/notFound.js';
import * as onboarding from './pages/onboarding.js';
import * as profile from './pages/profile.js';
import { upcomingPage } from './pages/upcoming.js';
import { createRouter } from './router.js';
import { store } from './store.js';
import { telegram } from './telegram.js';
import { clear } from './utils/dom.js';
import { errorMessage } from './utils/errors.js';

// Yangi modul sahifasi tayyor bo'lganda shu jadvalda upcomingPage(...) o'rniga ulanadi.
const routes = {
  '/': home.render,
  '/onboarding': onboarding.render,
  '/profile': profile.render,
  '/textbooks': upcomingPage('textbooks'), // PHASE 2
  '/formulas': upcomingPage('formulas'), // PHASE 2
  '/videos': upcomingPage('videos'), // PHASE 2
  '/quizzes': upcomingPage('quizzes'), // PHASE 2
  '/ai': upcomingPage('ai'), // PHASE 3
  '/lab': upcomingPage('lab'), // PHASE 6
};

const splash = document.getElementById('splash');
const appEl = document.getElementById('app');
const view = document.getElementById('view');
const tabbar = document.getElementById('tabbar');

function showFatal(element) {
  splash.hidden = true;
  appEl.hidden = false;
  tabbar.hidden = true;
  clear(view).append(element);
}

async function boot() {
  splash.hidden = false;
  appEl.hidden = true;
  try {
    telegram.init();
    store.setConfig(await api.get('/config'));
    await authenticate();
    setLanguage(store.user.language);

    const router = createRouter({ routes, notFound: notFound.render, view, tabbar });
    splash.hidden = true;
    appEl.hidden = false;
    await router.start();
  } catch (err) {
    if (err instanceof NotInTelegramError) {
      return showFatal(emptyState({ iconName: 'telegram', title: t('auth.telegramOnlyTitle'), text: t('auth.telegramOnlyText') }));
    }
    if (err instanceof ApiError && err.code === 'USER_BLOCKED') {
      return showFatal(errorState({ title: t('auth.blockedTitle'), text: t('auth.blockedText') }));
    }
    console.error(err);
    showFatal(errorState({ title: t('auth.failedTitle'), text: errorMessage(err), onRetry: boot }));
  }
}

boot();
