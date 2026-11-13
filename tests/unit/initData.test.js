import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InitDataError, signInitData, validateInitData } from '../../server/integrations/telegram/initData.js';

const TOKEN = '1234567890:TEST_TOKEN_FOR_UNIT_TESTS_ONLY_aaaaaaaaa';
const now = 1_800_000_000_000;
const nowSec = now / 1000;
const user = { id: 42, first_name: 'Ali', username: 'ali' };
const sign = (fields = {}, token = TOKEN) => signInitData({ user, auth_date: String(nowSec), query_id: 'q', ...fields }, token);
const reason = (fn) => {
  try {
    fn();
  } catch (err) {
    assert.ok(err instanceof InitDataError, `InitDataError kutilgan edi: ${err}`);
    return err.reason;
  }
  assert.fail('xato kutilgan edi');
};

test("to'g'ri imzolangan initData qabul qilinadi", () => {
  const result = validateInitData(sign(), TOKEN, { now });
  assert.equal(result.user.id, 42);
  assert.equal(result.authDate, nowSec);
});

test("Telegram hujjatidagi algoritm bilan mos (mustaqil hisoblangan hash)", async () => {
  const crypto = await import('node:crypto');
  const fields = { auth_date: String(nowSec), query_id: 'abc', user: JSON.stringify(user) };
  const dcs = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(TOKEN).digest();
  const hash = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
  const initData = new URLSearchParams({ ...fields, hash }).toString();
  assert.equal(validateInitData(initData, TOKEN, { now }).user.username, 'ali');
});

test('boshqa bot tokeni bilan imzolangan initData rad etiladi', () => {
  assert.equal(reason(() => validateInitData(sign({}, '999:OTHER_TOKEN_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), TOKEN, { now })), 'imzo mos kelmadi');
});

test("user ID o'zgartirilsa (soxtalashtirish) rad etiladi", () => {
  const params = new URLSearchParams(sign());
  params.set('user', JSON.stringify({ ...user, id: 1 }));
  assert.equal(reason(() => validateInitData(params.toString(), TOKEN, { now })), 'imzo mos kelmadi');
});

test("qo'shimcha maydon qo'shilsa rad etiladi", () => {
  assert.equal(reason(() => validateInitData(`${sign()}&is_admin=1`, TOKEN, { now })), 'imzo mos kelmadi');
});

test("muddati o'tgan initData rad etiladi", () => {
  const old = sign({ auth_date: String(nowSec - 90_000) });
  assert.equal(reason(() => validateInitData(old, TOKEN, { now, maxAgeSeconds: 86_400 })), "muddati o'tgan");
});

test('kelajakdagi auth_date rad etiladi', () => {
  assert.equal(reason(() => validateInitData(sign({ auth_date: String(nowSec + 3600) }), TOKEN, { now })), 'auth_date kelajakda');
});

test("hash yo'q, bo'sh yoki noto'g'ri kirish rad etiladi", () => {
  assert.equal(reason(() => validateInitData('', TOKEN, { now })), "bo'sh yoki juda uzun");
  assert.equal(reason(() => validateInitData(undefined, TOKEN, { now })), "bo'sh yoki juda uzun");
  assert.equal(reason(() => validateInitData('user=%7B%7D&auth_date=1', TOKEN, { now })), "hash yo'q");
  assert.equal(reason(() => validateInitData('hash=zz', TOKEN, { now })), "hash yo'q");
  assert.equal(reason(() => validateInitData(sign(), '', { now })), 'bot token sozlanmagan');
});

test("user maydoni yo'q yoki bot bo'lsa rad etiladi", () => {
  const noUser = signInitData({ auth_date: String(nowSec) }, TOKEN);
  assert.equal(reason(() => validateInitData(noUser, TOKEN, { now })), "user maydoni yo'q");
  assert.equal(reason(() => validateInitData(sign({ user: { id: 5, is_bot: true } }), TOKEN, { now })), 'botlar kira olmaydi');
  assert.equal(reason(() => validateInitData(sign({ user: { id: 'abc' } }), TOKEN, { now })), "user.id noto'g'ri");
});
