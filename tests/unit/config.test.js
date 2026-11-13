import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConfigError, loadConfig } from '../../server/config/index.js';
import { redact } from '../../server/utils/logger.js';

const base = { SESSION_SECRET: 'x'.repeat(32) };

test('standart qiymatlar', () => {
  const c = loadConfig(base);
  assert.equal(c.env, 'development');
  assert.equal(c.db.driver, 'local');
  assert.equal(c.devAuthEnabled, false);
  assert.equal(c.port, 3000);
});

test('qisqa SESSION_SECRET bilan ishga tushmaydi', () => {
  assert.throws(() => loadConfig({ SESSION_SECRET: 'short' }), ConfigError);
  assert.throws(() => loadConfig({}), ConfigError);
});

test('production: bot token va firestore majburiy, dev kirish har doim o\'chiq', () => {
  assert.throws(() => loadConfig({ ...base, NODE_ENV: 'production' }), /TELEGRAM_BOT_TOKEN/);
  assert.throws(() => loadConfig({ ...base, NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: 't', DB_DRIVER: 'local' }), /firestore/);
  const c = loadConfig({
    ...base, NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: 't', DB_DRIVER: 'firestore',
    FIREBASE_SERVICE_ACCOUNT: '{}', DEV_AUTH_ENABLED: 'true',
  });
  assert.equal(c.devAuthEnabled, false);
});

test("noto'g'ri admin ID va firestore kalitsiz rad etiladi", () => {
  assert.throws(() => loadConfig({ ...base, ADMIN_TELEGRAM_IDS: '12,abc' }), /ADMIN_TELEGRAM_IDS/);
  assert.throws(() => loadConfig({ ...base, DB_DRIVER: 'firestore' }), /FIREBASE_SERVICE_ACCOUNT/);
  assert.deepEqual(loadConfig({ ...base, ADMIN_TELEGRAM_IDS: ' 12 , 34 ' }).telegram.adminIds, ['12', '34']);
});

test('logger maxfiy maydonlarni tozalaydi', () => {
  const out = redact({
    userId: 5,
    token: 'abc',
    headers: { Authorization: 'Bearer x', 'x-ok': 1 },
    initData: 'user=..&hash=..',
    note: 'bot 1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA ishladi',
    nested: [{ apiKey: 'k', SESSION_SECRET: 's' }],
  });
  assert.equal(out.userId, 5);
  assert.equal(out.token, '[REDACTED]');
  assert.equal(out.headers.Authorization, '[REDACTED]');
  assert.equal(out.headers['x-ok'], 1);
  assert.equal(out.initData, '[REDACTED]');
  assert.equal(out.note, 'bot [REDACTED] ishladi');
  assert.deepEqual(out.nested, [{ apiKey: '[REDACTED]', SESSION_SECRET: '[REDACTED]' }]);
});
