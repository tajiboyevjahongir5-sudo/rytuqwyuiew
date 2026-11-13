import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { DocumentExistsError, DocumentNotFoundError } from '../../server/db/memoryStore.js';

// Firestore drayverini HAQIQIY Firestore emulyatorida tekshiradi.
// Ishga tushirish:
//   npx firebase-tools emulators:exec --only firestore --project demo-physica "npm run test:integration"
// Emulyator bo'lmasa (FIRESTORE_EMULATOR_HOST yo'q) bu testlar o'tkazib yuboriladi.
const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe('FirestoreStore (emulyator)', { skip: !enabled && 'FIRESTORE_EMULATOR_HOST berilmagan' }, () => {
  let store;
  const col = `test_${Date.now()}`;

  before(async () => {
    const { initFirestore } = await import('../../server/integrations/firebase/admin.js');
    const { FirestoreStore } = await import('../../server/integrations/firebase/firestoreStore.js');
    store = new FirestoreStore(initFirestore({ projectId: 'demo-physica', serviceAccount: '', storageBucket: '' }));
  });
  after(() => store?.close());

  test('ping', async () => assert.equal(await store.ping(), true));

  test('create / get / update (nuqtali yo\'l) / delete', async () => {
    await store.create(col, 1, { name: 'Ali', stats: { xp: 0, streak: 1 }, grade: null });
    assert.deepEqual(await store.get(col, '1'), { id: '1', name: 'Ali', stats: { xp: 0, streak: 1 }, grade: null });
    await assert.rejects(store.create(col, 1, {}), DocumentExistsError);
    await store.update(col, 1, { 'stats.xp': 50, grade: 7 });
    const doc = await store.get(col, 1);
    assert.deepEqual(doc.stats, { xp: 50, streak: 1 });
    assert.equal(doc.grade, 7);
    await assert.rejects(store.update(col, 'missing', { a: 1 }), DocumentNotFoundError);
    await store.set(col, 1, { extra: true }, { merge: true });
    assert.equal((await store.get(col, 1)).name, 'Ali');
    await store.delete(col, 1);
    assert.equal(await store.get(col, 1), null);
  });

  test('query, pagination va count', async () => {
    const c = `${col}_q`;
    for (let i = 1; i <= 5; i++) await store.create(c, `t${i}`, { grade: i <= 3 ? 7 : 8, order: 6 - i });
    const page1 = await store.query(c, { orderBy: [['order', 'desc']], limit: 2 });
    assert.deepEqual(page1.map((d) => d.id), ['t1', 't2']);
    const page2 = await store.query(c, { orderBy: [['order', 'desc']], limit: 2, startAfterId: 't2' });
    assert.deepEqual(page2.map((d) => d.id), ['t3', 't4']);
    assert.deepEqual((await store.query(c, { where: [['grade', '==', 8]] })).map((d) => d.id), ['t4', 't5']);
    assert.equal(await store.count(c, { where: [['grade', '==', 7]] }), 3);
    assert.equal(await store.count(c), 5);
  });

  test("foydalanuvchi servisi Firestore ustida to'liq ishlaydi", async () => {
    const { createUserService } = await import('../../server/services/user.service.js');
    const users = createUserService({ store, adminIds: [] });
    const id = Date.now();
    const first = await users.upsertFromTelegram({ id, first_name: 'Test' });
    assert.equal(first.isNew, true);
    assert.equal(first.user.stats.streakDays, 1);
    await users.updateProfile(String(id), { grade: 9, settings: { notificationsEnabled: false } });
    const again = await users.upsertFromTelegram({ id, first_name: 'Test2' });
    assert.equal(again.isNew, false);
    assert.equal(again.user.grade, 9);
    assert.equal(again.user.firstName, 'Test2');
    assert.equal(again.user.settings.notificationsEnabled, false);
    await store.delete('users', id);
  });
});
