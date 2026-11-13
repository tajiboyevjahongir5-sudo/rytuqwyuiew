// Server va bot uchun umumiy konstantalar. Frontend bularni /api/v1/config orqali oladi.

export const GRADES = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

// Hozircha faqat o'zbek tili faol. Rus va ingliz tillari kontent tayyor bo'lganda yoqiladi.
export const LANGUAGES = Object.freeze([
  { code: 'uz', name: "O'zbekcha", enabled: true },
  { code: 'ru', name: 'Русский', enabled: false },
  { code: 'en', name: 'English', enabled: false },
]);
export const DEFAULT_LANGUAGE = 'uz';
export const ENABLED_LANGUAGE_CODES = Object.freeze(LANGUAGES.filter((l) => l.enabled).map((l) => l.code));

export const ROLES = Object.freeze({ STUDENT: 'student', ADMIN: 'admin' });

export const PLANS = Object.freeze({ FREE: 'free', PREMIUM: 'premium', FAMILY: 'family' });

export const CONTENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

export const COLLECTIONS = Object.freeze({
  USERS: 'users',
  TEXTBOOKS: 'textbooks',
  TOPICS: 'topics',
  FORMULAS: 'formulas',
  PROBLEMS: 'problems',
  QUIZZES: 'quizzes',
  USER_PROGRESS: 'userProgress',
  AI_SESSIONS: 'aiSessions',
  AI_USAGE: 'aiUsage',
  LAB_EXPERIMENTS: 'laboratoryExperiments',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS: 'payments',
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'userAchievements',
  CONTENT_VERSIONS: 'contentVersions',
  SETTINGS: 'settings',
});

export const API_PREFIX = '/api/v1';
