import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBot } from '../../bot/index.js';
import { MemoryStore } from '../../server/db/memoryStore.js';
import { ADMIN_ID, testConfig } from '../helpers/testApp.js';

// Bot handlerlari Telegram tarmog'iga chiqmasdan tekshiriladi: chiquvchi Bot API
// chaqiruvlari transformer orqali ushlab olinadi, kiruvchi update lar qo'lda beriladi.
function setup(overrides = {}) {
  const config = testConfig({ MINI_APP_URL: 'https://physica.example.com', ...overrides });
  const store = new MemoryStore();
  const bot = createBot({ config, store }, {
    botInfo: { id: 1, is_bot: true, first_name: 'PHYSICA', username: 'physica_test_bot', can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false },
  });
  const calls = [];
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload });
    return { ok: true, result: true };
  });
  let updateId = 1;
  const send = (text, fromId) =>
    bot.handleUpdate({
      update_id: updateId++,
      message: {
        message_id: updateId, date: Math.floor(Date.now() / 1000), text,
        chat: { id: fromId, type: 'private' },
        from: { id: fromId, is_bot: false, first_name: 'Ali' },
        entities: [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }],
      },
    });
  return { bot, calls, send, store };
}

test('/start Mini App ni ochuvchi tugma yuboradi', async () => {
  const { calls, send } = setup();
  await send('/start', 555);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'sendMessage');
  assert.match(calls[0].payload.text, /Salom, Ali/);
  const button = calls[0].payload.reply_markup.inline_keyboard[0][0];
  assert.deepEqual(button.web_app, { url: 'https://physica.example.com' });
});

test('/start: Mini App manzili sozlanmagan bo\'lsa ochiq aytiladi', async () => {
  const { calls, send } = setup({ MINI_APP_URL: '' });
  await send('/start', 555);
  assert.match(calls[0].payload.text, /sozlanmagan/);
  assert.equal(calls[0].payload.reply_markup, undefined);
});

test('/status faqat adminlar uchun', async () => {
  const { calls, send, store } = setup();
  await store.create('users', 1, {});
  await send('/status', 555);
  assert.match(calls[0].payload.text, /faqat adminlar/);
  await send('/status', ADMIN_ID);
  assert.match(calls[1].payload.text, /Tizim holati/);
  assert.match(calls[1].payload.text, /Foydalanuvchilar: 1/);
});
