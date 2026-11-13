import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { ADMIN_ID, makeInitData, startTestServer, STUDENT_ID } from '../helpers/testApp.js';

describe('Tizim endpointlari', () => {
  let s;
  before(async () => (s = await startTestServer()));
  after(() => s.close());

  test('GET /health', async () => {
    const res = await s.request('GET', '/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { ok: true, data: { status: 'ok', db: 'ok' } });
  });

  test('GET /config maxfiy ma\'lumot qaytarmaydi', async () => {
    const res = await s.request('GET', '/config');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json.data.grades, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    assert.equal(res.json.data.devAuthEnabled, false);
    const text = JSON.stringify(res.json);
    assert.ok(!text.includes(s.config.telegram.botToken));
    assert.ok(!text.includes(s.config.session.secret));
    assert.ok(!text.includes(String(ADMIN_ID)));
  });

  test("noma'lum API manzili standart 404 qaytaradi", async () => {
    const res = await s.request('GET', '/nope');
    assert.equal(res.status, 404);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, 'NOT_FOUND');
  });

  test('xavfsizlik sarlavhalari va statik frontend', async () => {
    const res = await fetch(s.baseUrl + '/');
    assert.equal(res.status, 200);
    assert.match(await res.text(), /PHYSICA/);
    const csp = res.headers.get('content-security-policy');
    assert.match(csp, /script-src 'self' https:\/\/telegram\.org/);
    assert.match(csp, /frame-ancestors[^;]*web\.telegram\.org/);
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  });

  test('server fayllari statik orqali ochilmaydi', async () => {
    for (const p of ['/.env', '/server/server.js', '/package.json', '/../package.json', '/%2e%2e/package.json']) {
      const res = await fetch(s.baseUrl + p);
      assert.equal(res.status, 404, p);
    }
  });
});

describe('Telegram autentifikatsiyasi', () => {
  let s;
  before(async () => (s = await startTestServer()));
  after(() => s.close());

  test("to'g'ri initData bilan kirish va profil yaratish", async () => {
    const res = await s.request('POST', '/auth/telegram', { body: { initData: makeInitData() } });
    assert.equal(res.status, 200);
    const { token, user, isNew, expiresIn } = res.json.data;
    assert.ok(token);
    assert.equal(isNew, true);
    assert.equal(expiresIn, 43200);
    assert.equal(user.id, String(STUDENT_ID));
    assert.equal(user.firstName, 'Ali');
    assert.equal(user.grade, null);
    assert.equal(user.role, 'student');
    assert.equal(res.headers.get('cache-control'), 'no-store');

    const again = await s.request('POST', '/auth/telegram', { body: { initData: makeInitData() } });
    assert.equal(again.json.data.isNew, false);
  });

  test('soxta imzo, boshqa bot va eskirgan initData rad etiladi', async () => {
    const tampered = makeInitData().replace(/hash=[a-f0-9]{4}/, 'hash=0000');
    const cases = [
      tampered,
      makeInitData({}, { botToken: '555:ANOTHER_BOT_TOKEN_aaaaaaaaaaaaaaaaaaaaaaaa' }),
      makeInitData({}, { authDate: Math.floor(Date.now() / 1000) - 2 * 86400 }),
      'user=%7B%22id%22%3A1%7D&auth_date=1&hash=' + 'a'.repeat(64),
    ];
    for (const initData of cases) {
      const res = await s.request('POST', '/auth/telegram', { body: { initData } });
      assert.equal(res.status, 401);
      assert.equal(res.json.error.code, 'INVALID_INIT_DATA');
    }
  });

  test('frontend yuborgan user ID ga ishonilmaydi (validatsiya)', async () => {
    const res = await s.request('POST', '/auth/telegram', { body: { initData: makeInitData(), userId: ADMIN_ID } });
    assert.equal(res.status, 400);
    assert.equal(res.json.error.code, 'VALIDATION_ERROR');
    const empty = await s.request('POST', '/auth/telegram', { body: {} });
    assert.equal(empty.status, 400);
    const bad = await s.request('POST', '/auth/telegram', { raw: '{oops' });
    assert.equal(bad.status, 400);
    assert.equal(bad.json.error.code, 'BAD_REQUEST');
  });

  test("dev kirish o'chirilgan bo'lsa ishlamaydi", async () => {
    const res = await s.request('POST', '/auth/dev', { body: {} });
    assert.equal(res.status, 403);
    assert.equal(res.json.error.code, 'DEV_AUTH_DISABLED');
  });

  test('bloklangan foydalanuvchi kira olmaydi va mavjud sessiyasi ham ishlamaydi', async () => {
    const { token } = await s.login({ id: 333 });
    await s.store.update('users', 333, { blocked: true });
    const me = await s.request('GET', '/me', { token });
    assert.equal(me.status, 403);
    assert.equal(me.json.error.code, 'USER_BLOCKED');
    const login = await s.request('POST', '/auth/telegram', { body: { initData: makeInitData({ id: 333 }) } });
    assert.equal(login.status, 403);
  });
});

describe('Dev kirish va production himoyasi', () => {
  test('DEV_AUTH_ENABLED=true (production emas) da ishlaydi', async () => {
    const s = await startTestServer({ DEV_AUTH_ENABLED: 'true' });
    const res = await s.request('POST', '/auth/dev', { body: {} });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.user.firstName, 'Sinov');
    assert.equal((await s.request('POST', '/auth/dev', { body: { profile: 99 } })).status, 400);
    await s.close();
  });

  test('bot token sozlanmagan bo\'lsa Telegram kirish 503 qaytaradi', async () => {
    const s = await startTestServer({ TELEGRAM_BOT_TOKEN: '' });
    const res = await s.request('POST', '/auth/telegram', { body: { initData: makeInitData() } });
    assert.equal(res.status, 503);
    assert.equal(res.json.error.code, 'TELEGRAM_NOT_CONFIGURED');
    await s.close();
  });
});

describe('Profil', () => {
  let s;
  let token;
  before(async () => {
    s = await startTestServer();
    ({ token } = await s.login());
  });
  after(() => s.close());

  test('tokensiz yoki yaroqsiz token bilan 401', async () => {
    assert.equal((await s.request('GET', '/me')).status, 401);
    assert.equal((await s.request('GET', '/me', { token: 'abc.def.ghi' })).json.error.code, 'INVALID_SESSION');
    assert.equal((await s.request('GET', '/me', { headers: { authorization: `Basic ${token}` } })).status, 401);
    assert.equal((await s.request('PATCH', '/me', { body: { grade: 7 } })).status, 401);
  });

  test('GET /me joriy foydalanuvchini qaytaradi', async () => {
    const res = await s.request('GET', '/me', { token });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.user.id, String(STUDENT_ID));
    assert.equal(res.json.data.user.stats.streakDays, 1);
  });

  test('sinf tanlash saqlanadi va qayta kirganda qoladi', async () => {
    const res = await s.request('PATCH', '/me', { token, body: { grade: 7 } });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.user.grade, 7);
    const relogin = await s.login();
    assert.equal(relogin.user.grade, 7);
    assert.equal(relogin.isNew, false);
  });

  test('sozlamalarni yangilash', async () => {
    const res = await s.request('PATCH', '/me', { token, body: { settings: { notificationsEnabled: false }, language: 'uz' } });
    assert.equal(res.json.data.user.settings.notificationsEnabled, false);
    assert.equal(res.json.data.user.grade, 7);
  });

  test("noto'g'ri qiymatlar va taqiqlangan maydonlar rad etiladi", async () => {
    const bad = [
      { grade: 0 }, { grade: 12 }, { grade: '7' }, { grade: 7.5 },
      { language: 'ru' }, // hali yoqilmagan
      { language: 'xx' },
      {},
      { role: 'admin' },
      { premium: { plan: 'premium' } },
      { grade: 8, blocked: false },
      { telegramId: 1 },
      { settings: { notificationsEnabled: 'yes' } },
      { stats: { xp: 99999 } },
    ];
    for (const body of bad) {
      const res = await s.request('PATCH', '/me', { token, body });
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.json.error.code, 'VALIDATION_ERROR');
    }
    const me = await s.request('GET', '/me', { token });
    assert.equal(me.json.data.user.role, 'student');
    assert.equal(me.json.data.user.premium.plan, 'free');
  });

  test("foydalanuvchi faqat o'z profilini ko'radi va o'zgartiradi", async () => {
    const other = await s.login({ id: 777, first_name: 'Vali' });
    await s.request('PATCH', '/me', { token: other.token, body: { grade: 10 } });
    const mine = await s.request('GET', '/me', { token });
    assert.equal(mine.json.data.user.id, String(STUDENT_ID));
    assert.equal(mine.json.data.user.grade, 7);
    // boshqa foydalanuvchini ko'rsatuvchi hech qanday endpoint yo'q
    assert.equal((await s.request('GET', '/users/777', { token })).status, 404);
  });

  test('juda katta so\'rov tanasi rad etiladi', async () => {
    const res = await s.request('PATCH', '/me', { token, raw: JSON.stringify({ grade: 7, x: 'a'.repeat(200_000) }) });
    assert.equal(res.status, 413);
  });
});

describe('Admin himoyasi', () => {
  let s;
  before(async () => (s = await startTestServer()));
  after(() => s.close());

  test('autentifikatsiyasiz 401, oddiy o\'quvchiga 403', async () => {
    assert.equal((await s.request('GET', '/admin/system/status')).status, 401);
    const { token } = await s.login();
    const res = await s.request('GET', '/admin/system/status', { token });
    assert.equal(res.status, 403);
    assert.equal(res.json.error.code, 'ADMIN_ONLY');
  });

  test("bazada rolni o'zgartirish adminlik bermaydi", async () => {
    const { token } = await s.login({ id: 888 });
    await s.store.update('users', 888, { role: 'admin' });
    assert.equal((await s.request('GET', '/admin/system/status', { token })).status, 403);
  });

  test("ruxsat berilgan admin tizim holatini ko'radi", async () => {
    const { token, user } = await s.login({ id: ADMIN_ID, first_name: 'Admin' });
    assert.equal(user.role, 'admin');
    const res = await s.request('GET', '/admin/system/status', { token });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.db.status, 'ok');
    assert.ok(res.json.data.users.total >= 1);
    assert.ok(!JSON.stringify(res.json).includes(s.config.telegram.botToken));
  });
});

describe('Rate limit', () => {
  test('auth endpointlari cheklangan', async () => {
    const s = await startTestServer({ AUTH_RATE_LIMIT_MAX: '3' });
    const statuses = [];
    for (let i = 0; i < 5; i++) {
      statuses.push((await s.request('POST', '/auth/telegram', { body: { initData: 'x' } })).status);
    }
    assert.deepEqual(statuses, [401, 401, 401, 429, 429]);
    const last = await s.request('POST', '/auth/telegram', { body: { initData: 'x' } });
    assert.equal(last.json.error.code, 'RATE_LIMITED');
    await s.close();
  });

  test('umumiy API limiti', async () => {
    const s = await startTestServer({ RATE_LIMIT_MAX: '2' });
    const statuses = [];
    for (let i = 0; i < 3; i++) statuses.push((await s.request('GET', '/config')).status);
    assert.deepEqual(statuses, [200, 200, 429]);
    await s.close();
  });
});

describe("Ma'lumotlar bazasi nosozligi", () => {
  test('baza xatosi 500 qaytaradi va ichki tafsilotlarni oshkor qilmaydi', async () => {
    const { MemoryStore } = await import('../../server/db/memoryStore.js');
    const store = new MemoryStore();
    store.get = async () => {
      throw new Error('SECRET_INTERNAL_DETAIL connection refused');
    };
    store.ping = async () => {
      throw new Error('down');
    };
    const s = await startTestServer({}, store);
    const res = await s.request('POST', '/auth/telegram', { body: { initData: makeInitData() } });
    assert.equal(res.status, 500);
    assert.equal(res.json.error.code, 'INTERNAL_ERROR');
    assert.ok(!JSON.stringify(res.json).includes('SECRET_INTERNAL_DETAIL'));
    const health = await s.request('GET', '/health');
    assert.equal(health.status, 503);
    await s.close();
  });
});
