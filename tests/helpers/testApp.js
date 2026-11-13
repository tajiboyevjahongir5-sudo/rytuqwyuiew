import { createApp } from '../../server/app.js';
import { loadConfig } from '../../server/config/index.js';
import { MemoryStore } from '../../server/db/memoryStore.js';
import { signInitData } from '../../server/integrations/telegram/initData.js';
import { setLogLevel } from '../../server/utils/logger.js';

// Test uchun to'qilgan bot tokeni (haqiqiy emas, faqat imzo algoritmini tekshirish uchun)
export const TEST_BOT_TOKEN = '1234567890:TEST_TOKEN_FOR_UNIT_TESTS_ONLY_aaaaaaaaa';
export const ADMIN_ID = 111111;
export const STUDENT_ID = 222222;

export function testConfig(overrides = {}) {
  return loadConfig({
    NODE_ENV: 'test',
    PORT: '0',
    SESSION_SECRET: 'test-secret-test-secret-test-secret-1234',
    TELEGRAM_BOT_TOKEN: TEST_BOT_TOKEN,
    ADMIN_TELEGRAM_IDS: String(ADMIN_ID),
    DB_DRIVER: 'memory',
    DEV_AUTH_ENABLED: 'false',
    LOG_LEVEL: 'silent',
    ...overrides,
  });
}

export function makeInitData(user = {}, { botToken = TEST_BOT_TOKEN, authDate = Math.floor(Date.now() / 1000) } = {}) {
  return signInitData(
    {
      query_id: 'AATestQuery',
      user: { id: STUDENT_ID, first_name: 'Ali', last_name: 'Valiyev', username: 'ali_v', language_code: 'uz', ...user },
      auth_date: String(authDate),
    },
    botToken,
  );
}

/** Ilovani tasodifiy portda ishga tushiradi va qulay HTTP yordamchilarini qaytaradi. */
export async function startTestServer(overrides = {}, store = new MemoryStore()) {
  setLogLevel('silent');
  const config = testConfig(overrides);
  const app = createApp({ config, store });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, { body, token, headers = {}, raw } = {}) {
    const res = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers: {
        ...(body !== undefined || raw !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* bo'sh javob */
    }
    return { status: res.status, json, headers: res.headers };
  }

  async function login(user) {
    const res = await request('POST', '/auth/telegram', { body: { initData: makeInitData(user) } });
    return res.json.data;
  }

  return {
    baseUrl,
    config,
    store,
    request,
    login,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
