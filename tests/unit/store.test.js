import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { LocalStore } from '../../server/db/localStore.js';
import { DocumentExistsError, DocumentNotFoundError, MemoryStore } from '../../server/db/memoryStore.js';

test('create / get / update / delete', async () => {
  const s = new MemoryStore();
  await s.create('users', 1, { name: 'Ali', stats: { xp: 0, streak: 1 } });
  assert.deepEqual(await s.get('users', '1'), { id: '1', name: 'Ali', stats: { xp: 0, streak: 1 } });
  await assert.rejects(s.create('users', 1, {}), DocumentExistsError);

  await s.update('users', 1, { 'stats.xp': 50, grade: 7 });
  const u = await s.get('users', 1);
  assert.equal(u.stats.xp, 50);
  assert.equal(u.stats.streak, 1, 'nuqtali yo\'l boshqa maydonlarni o\'chirmasligi kerak');
  assert.equal(u.grade, 7);

  await assert.rejects(s.update('users', 404, { a: 1 }), DocumentNotFoundError);
  await s.delete('users', 1);
  assert.equal(await s.get('users', 1), null);
});

test("qaytarilgan hujjatni o'zgartirish omborga ta'sir qilmaydi", async () => {
  const s = new MemoryStore();
  await s.create('users', 1, { tags: ['a'] });
  const doc = await s.get('users', 1);
  doc.tags.push('b');
  assert.deepEqual((await s.get('users', 1)).tags, ['a']);
});

test('query: where, orderBy, limit, pagination va count', async () => {
  const s = new MemoryStore();
  for (let i = 1; i <= 5; i++) await s.create('topics', `t${i}`, { grade: i <= 3 ? 7 : 8, order: 6 - i, status: 'published' });
  const g7 = await s.query('topics', { where: [['grade', '==', 7]], orderBy: [['order', 'asc']] });
  assert.deepEqual(g7.map((d) => d.id), ['t3', 't2', 't1']);

  const page1 = await s.query('topics', { orderBy: [['order', 'desc']], limit: 2 });
  assert.deepEqual(page1.map((d) => d.id), ['t1', 't2']);
  const page2 = await s.query('topics', { orderBy: [['order', 'desc']], limit: 2, startAfterId: page1.at(-1).id });
  assert.deepEqual(page2.map((d) => d.id), ['t3', 't4']);

  assert.equal(await s.count('topics', { where: [['grade', '==', 8]] }), 2);
  assert.equal(await s.count('topics'), 5);
  assert.equal((await s.query('topics', { where: [['grade', 'in', [8]], ['order', '>=', 2]] })).length, 1);
});

test('LocalStore ma\'lumotni faylga saqlaydi va qayta yuklaydi', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'physica-'));
  const file = path.join(dir, 'nested', 'db.json');
  const a = new LocalStore(file);
  await a.create('users', 7, { grade: 9 });
  await a.update('users', 7, { grade: 10 });
  const b = new LocalStore(file);
  assert.equal((await b.get('users', 7)).grade, 10);
  fs.rmSync(dir, { recursive: true });
});
