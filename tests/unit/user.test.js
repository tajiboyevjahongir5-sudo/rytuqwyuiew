import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MemoryStore } from '../../server/db/memoryStore.js';
import { toPublicUser } from '../../server/models/user.model.js';
import { createUserService, nextStreak } from '../../server/services/user.service.js';
import { dayDiff, localDay } from '../../server/utils/dates.js';

const tg = { id: 500, first_name: 'Laylo', last_name: 'Karimova', username: 'laylo', language_code: 'ru', photo_url: 'https://t.me/i/userpic/320/x.jpg' };

function setup(start = '2026-03-10T08:00:00Z') {
  let now = new Date(start);
  const store = new MemoryStore();
  const users = createUserService({ store, adminIds: ['900'], clock: () => now });
  return { store, users, setNow: (iso) => (now = new Date(iso)) };
}

test('sanalar Toshkent vaqti bo\'yicha hisoblanadi', () => {
  assert.equal(localDay(new Date('2026-03-10T18:59:00Z')), '2026-03-10');
  assert.equal(localDay(new Date('2026-03-10T19:00:00Z')), '2026-03-11'); // UTC+5
  assert.equal(dayDiff('2026-02-28', '2026-03-01'), 1);
  assert.equal(dayDiff('2026-03-10', '2026-03-10'), 0);
});

test('nextStreak: seriya qoidalari', () => {
  assert.deepEqual(nextStreak({}, '2026-03-10'), { streakDays: 1, longestStreak: 1, lastActiveDay: '2026-03-10' });
  assert.equal(nextStreak({ lastActiveDay: '2026-03-10', streakDays: 3 }, '2026-03-10'), null);
  assert.equal(nextStreak({ lastActiveDay: '2026-03-10', streakDays: 3, longestStreak: 3 }, '2026-03-11').streakDays, 4);
  const broken = nextStreak({ lastActiveDay: '2026-03-10', streakDays: 6, longestStreak: 6 }, '2026-03-13');
  assert.equal(broken.streakDays, 1);
  assert.equal(broken.longestStreak, 6);
});

test('birinchi kirishda profil yaratiladi, minimal maydonlar bilan', async () => {
  const { users, store } = setup();
  const { user, isNew } = await users.upsertFromTelegram({ ...tg, is_premium: true, allows_write_to_pm: true });
  assert.equal(isNew, true);
  assert.equal(user.grade, null);
  assert.equal(user.language, 'uz', "yoqilmagan til o'rniga standart til");
  assert.equal(user.role, 'student');
  assert.equal(user.premium.plan, 'free', "Telegram Premium PHYSICA Premium ni bermaydi");
  assert.equal(user.stats.streakDays, 1);
  const raw = await store.get('users', 500);
  assert.equal('is_premium' in raw, false);
  assert.equal('allows_write_to_pm' in raw, false);
});

test("qayta kirishda sinf va progress saqlanadi, profil yangilanadi", async () => {
  const { users, setNow } = setup();
  await users.upsertFromTelegram(tg);
  await users.updateProfile('500', { grade: 8 });
  setNow('2026-03-11T08:00:00Z');
  const { user, isNew } = await users.upsertFromTelegram({ ...tg, first_name: 'Layloxon' });
  assert.equal(isNew, false);
  assert.equal(user.grade, 8);
  assert.equal(user.firstName, 'Layloxon');
  assert.equal(user.stats.streakDays, 2);
  assert.equal(user.createdAt, '2026-03-10T08:00:00.000Z');
});

test('admin roli faqat server konfiguratsiyasidan aniqlanadi', async () => {
  const { users, store } = setup();
  const admin = await users.upsertFromTelegram({ id: 900, first_name: 'Admin' });
  assert.equal(admin.user.role, 'admin');
  // bazada rol qo'lda o'zgartirilsa ham konfiguratsiya ustun turadi
  await users.upsertFromTelegram(tg);
  await store.update('users', 500, { role: 'admin' });
  assert.equal((await users.getById('500')).role, 'student');
});

test("xavfli photo_url saqlanmaydi", async () => {
  const { users } = setup();
  const a = await users.upsertFromTelegram({ ...tg, photo_url: 'https://evil.example/x.jpg' });
  assert.equal(a.user.photoUrl, null);
  const b = await users.upsertFromTelegram({ ...tg, photo_url: 'javascript:alert(1)' });
  assert.equal(b.user.photoUrl, null);
  const c = await users.upsertFromTelegram(tg);
  assert.equal(c.user.photoUrl, tg.photo_url);
});

test('updateProfile faqat ruxsat etilgan maydonlarni o\'zgartiradi', async () => {
  const { users } = setup();
  await users.upsertFromTelegram(tg);
  const user = await users.updateProfile('500', { grade: 5, role: 'admin', premium: { plan: 'premium' }, settings: { notificationsEnabled: false } });
  assert.equal(user.grade, 5);
  assert.equal(user.role, 'student');
  assert.equal(user.premium.plan, 'free');
  assert.equal(user.settings.notificationsEnabled, false);
  await assert.rejects(users.updateProfile('404', { grade: 5 }), { code: 'NOT_FOUND' });
});

test("toPublicUser ichki maydonlarni chiqarmaydi", async () => {
  const { users } = setup();
  const { user } = await users.upsertFromTelegram(tg);
  const pub = toPublicUser(user);
  assert.equal(pub.id, '500');
  assert.equal('blocked' in pub, false);
  assert.equal('lastActiveAt' in pub, false);
});
