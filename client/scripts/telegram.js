// Telegram Mini Apps SDK ustidagi yupqa qatlam. SDK yuklanmagan yoki ilova
// oddiy brauzerda ochilgan bo'lsa ham barcha funksiyalar xavfsiz ishlaydi.

const wa = () => window.Telegram?.WebApp ?? null;

const supports = (version) => {
  try {
    return Boolean(wa()?.isVersionAtLeast?.(version));
  } catch {
    return false;
  }
};

const safe = (fn) => {
  try {
    fn();
  } catch {
    /* eski Telegram mijozlari ba'zi metodlarni qo'llab-quvvatlamaydi */
  }
};

export const telegram = {
  /** Ilova haqiqatan Telegram ichida ochilganmi (imzolangan initData bormi) */
  get isAvailable() {
    return Boolean(wa()?.initData);
  },

  /** Serverda tekshiriladigan xom initData satri */
  get initData() {
    return wa()?.initData ?? '';
  },

  init() {
    const app = wa();
    if (!app) return;
    safe(() => app.ready());
    safe(() => app.expand());
    if (supports('6.1')) {
      safe(() => app.setHeaderColor('#0A1124'));
      safe(() => app.setBackgroundColor('#0A1124'));
    }
    if (supports('7.10')) safe(() => app.setBottomBarColor('#080E20'));
    if (supports('7.7')) safe(() => app.disableVerticalSwipes());
  },

  haptic(type = 'light') {
    const hf = wa()?.HapticFeedback;
    if (!hf || !supports('6.1')) return;
    safe(() => {
      if (type === 'success' || type === 'error' || type === 'warning') hf.notificationOccurred(type);
      else if (type === 'select') hf.selectionChanged();
      else hf.impactOccurred(type);
    });
  },

  /** Telegram sarlavhasidagi "Orqaga" tugmasi. handler=null bo'lsa yashiriladi. */
  setBackButton(handler) {
    const bb = wa()?.BackButton;
    if (!bb || !supports('6.1')) return;
    safe(() => {
      if (telegram._backHandler) bb.offClick(telegram._backHandler);
      telegram._backHandler = handler;
      if (handler) {
        bb.onClick(handler);
        bb.show();
      } else {
        bb.hide();
      }
    });
  },
  _backHandler: null,
};
