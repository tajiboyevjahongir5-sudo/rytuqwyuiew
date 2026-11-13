// Ilovaning kichik global holati (foydalanuvchi va server konfiguratsiyasi).
const state = { user: null, config: null };
const listeners = new Set();

export const store = {
  get user() {
    return state.user;
  },
  get config() {
    return state.config;
  },
  setUser(user) {
    state.user = user;
    listeners.forEach((fn) => fn(state));
  },
  setConfig(config) {
    state.config = config;
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
