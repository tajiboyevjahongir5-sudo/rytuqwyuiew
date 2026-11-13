import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { createSessionService } from '../../server/services/session.service.js';

const secret = 'a'.repeat(40);
const sessions = createSessionService({ secret, ttlSeconds: 60 });
const code = (fn) => {
  try {
    fn();
  } catch (err) {
    return err.code;
  }
  return null;
};

test('berilgan token tekshiruvdan o\'tadi', () => {
  const { token, expiresIn } = sessions.issue(42);
  assert.equal(expiresIn, 60);
  assert.deepEqual(sessions.verify(token), { userId: '42' });
});

test("boshqa kalit bilan imzolangan token rad etiladi", () => {
  const forged = createSessionService({ secret: 'b'.repeat(40), ttlSeconds: 60 }).issue(42).token;
  assert.equal(code(() => sessions.verify(forged)), 'INVALID_SESSION');
});

test('muddati tugagan token SESSION_EXPIRED qaytaradi', () => {
  const expired = jwt.sign({}, secret, { subject: '42', issuer: 'physica', expiresIn: -10 });
  assert.equal(code(() => sessions.verify(expired)), 'SESSION_EXPIRED');
});

test('alg=none va buzilgan tokenlar rad etiladi', () => {
  const none = jwt.sign({ sub: '42', iss: 'physica' }, '', { algorithm: 'none' });
  assert.equal(code(() => sessions.verify(none)), 'INVALID_SESSION');
  assert.equal(code(() => sessions.verify('not.a.token')), 'INVALID_SESSION');
  const noSub = jwt.sign({}, secret, { issuer: 'physica' });
  assert.equal(code(() => sessions.verify(noSub)), 'INVALID_SESSION');
});
