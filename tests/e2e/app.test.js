import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, before, describe, test } from 'node:test';
import { makeInitData, startTestServer } from '../helpers/testApp.js';

// Haqiqiy brauzerda (Chromium, telefon o'lchami) to'liq foydalanuvchi oqimi.
// Ishga tushirish: npm run test:e2e  (Playwright o'rnatilgan bo'lishi kerak)
const { chromium } = createRequire(import.meta.url)('playwright');
const SHOTS = process.env.E2E_SCREENSHOT_DIR;
const tid = (id) => `[data-testid="${id}"]`;

let browser;
before(async () => (browser = await chromium.launch()));
after(() => browser?.close());

async function openApp(server, { telegramUser, width = 390, height = 844 } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
  page.on('pageerror', (e) => problems.push(String(e)));
  // Telegram SDK tashqi tarmoqdan yuklanmaydi; kerak bo'lsa pastda WebApp obyekti taqlid qilinadi
  await page.route('https://telegram.org/**', (route) => route.abort());
  if (telegramUser) {
    await page.addInitScript((initData) => {
      const calls = [];
      window.__tgCalls = calls;
      const rec = (name) => (...args) => void calls.push([name, ...args.filter((a) => typeof a !== 'function')]);
      window.Telegram = {
        WebApp: {
          initData,
          version: '8.0',
          isVersionAtLeast: () => true,
          ready: rec('ready'), expand: rec('expand'),
          setHeaderColor: rec('setHeaderColor'), setBackgroundColor: rec('setBackgroundColor'),
          setBottomBarColor: rec('setBottomBarColor'), disableVerticalSwipes: rec('disableVerticalSwipes'),
          HapticFeedback: { impactOccurred: rec('haptic'), notificationOccurred: rec('haptic'), selectionChanged: rec('haptic') },
          BackButton: { show: rec('back.show'), hide: rec('back.hide'), onClick: rec('back.onClick'), offClick: rec('back.offClick') },
        },
      };
    }, makeInitData(telegramUser));
  }
  await page.goto(server.baseUrl);
  const realProblems = () => problems.filter((p) => !p.includes('telegram.org') && !p.includes('ERR_FAILED'));
  return { page, context, problems: realProblems };
}

async function shot(page, name) {
  if (!SHOTS) return;
  await page.waitForTimeout(400); // sahifa animatsiyasi tugashini kutamiz
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `gorizontal toshib ketish: ${overflow}px`);
}

describe('Telegram ichida: birinchi kirishdan profilgacha', () => {
  let server;
  before(async () => (server = await startTestServer()));
  after(() => server.close());

  test('kirish → sinf tanlash → bosh sahifa → navigatsiya → profil → qayta kirish', async () => {
    const user = { id: 4242, first_name: 'Dilnoza', last_name: 'Rahimova', username: 'dilnoza_r' };
    const { page, context, problems } = await openApp(server, { telegramUser: user });

    // 1) Birinchi kirish: onboarding, tabbar yashirin, tugma sinf tanlanmaguncha o'chiq
    await page.waitForSelector(tid('page-onboarding'));
    assert.equal(await page.isVisible('#tabbar'), false);
    assert.equal(await page.isDisabled(tid('onboarding-start')), true);
    assert.equal(await page.locator('.grade-option').count(), 11);
    await shot(page, '01-onboarding');

    // sinf tanlanmaguncha boshqa sahifaga o'tib bo'lmaydi
    await page.evaluate(() => (location.hash = '#/profile'));
    await page.waitForFunction(() => location.hash === '#/onboarding');

    // 2) Sinf tanlash
    await page.click(tid('grade-7'));
    assert.equal(await page.getAttribute(tid('grade-7'), 'aria-checked'), 'true');
    await page.click(tid('onboarding-start'));

    // 3) Bosh sahifa
    await page.waitForSelector(tid('page-home'));
    assert.equal(await page.textContent(tid('greeting')), 'Salom, Dilnoza!');
    assert.match(await page.textContent(tid('home-grade')), /7-sinf/);
    assert.equal(await page.textContent(tid('stat-streak')), '1');
    assert.equal(await page.textContent(tid('stat-topics')), '0');
    assert.equal(await page.isVisible('#tabbar'), true);
    assert.equal(await page.locator('.tabbar__item').count(), 5);
    await assertNoHorizontalOverflow(page);
    await shot(page, '02-home');

    // Server haqiqatan saqlaganini tekshiramiz
    assert.equal((await server.store.get('users', 4242)).grade, 7);

    // 4) Bildirishnomalar oynasi ochiladi va yopiladi
    await page.click(tid('notifications-btn'));
    await page.waitForSelector(tid('sheet-notifications'));
    await page.click(tid('sheet-close'));
    await page.waitForSelector(tid('sheet-notifications'), { state: 'detached' });

    // 5) Barcha tablar ishlaydi
    for (const [tab, pageId] of [['book', 'page-textbooks'], ['sparkles', 'page-ai'], ['flask', 'page-lab'], ['user', 'page-profile'], ['home', 'page-home']]) {
      await page.click(tid(`tab-${tab}`));
      await page.waitForSelector(tid(pageId));
      assert.equal(await page.getAttribute(tid(`tab-${tab}`), 'aria-current'), 'page');
    }

    // 6) AI tugmasi va tezkor kirish havolalari haqiqiy sahifalarga olib boradi
    await page.click(tid('ai-cta'));
    await page.waitForSelector(tid('page-ai'));
    await page.click(tid('tab-home'));
    await page.click(tid('quick-formula'));
    await page.waitForSelector(tid('page-formulas'));
    const backShown = await page.evaluate(() => window.__tgCalls.some(([n]) => n === 'back.show'));
    assert.ok(backShown, 'ichki sahifada Telegram BackButton ko\'rsatilishi kerak');
    await page.goBack();
    await page.waitForSelector(tid('page-home'));

    // 7) Profil: ma'lumotlar va sinfni o'zgartirish
    await page.click(tid('tab-user'));
    await page.waitForSelector(tid('page-profile'));
    assert.equal(await page.textContent(tid('profile-name')), 'Dilnoza Rahimova');
    assert.match(await page.textContent(tid('profile-plan')), /Bepul/);
    await shot(page, '03-profile');
    await page.click(tid('row-grade'));
    await page.waitForSelector(tid('sheet-grade'));
    await shot(page, '04-grade-sheet');
    await page.click(`${tid('sheet-grade')} ${tid('grade-9')}`);
    await page.click(tid('grade-save'));
    await page.waitForSelector(tid('toast-success'));
    await page.waitForFunction(() => document.querySelector('[data-testid="profile-grade-chip"]')?.textContent.includes('9-sinf'));
    assert.match(await page.textContent(tid('row-grade-value')), /9-sinf/);

    // 8) Til: faqat o'zbek tili faol, boshqalari o'chirilgan
    await page.click(tid('row-language'));
    await page.waitForSelector(tid('sheet-language'));
    assert.equal(await page.isDisabled(tid('lang-ru')), true);
    assert.equal(await page.isDisabled(tid('lang-uz')), false);
    await page.click(tid('sheet-close'));

    // 9) Bildirishnoma sozlamasi saqlanadi
    await page.click(tid('notifications-switch'));
    await page.waitForFunction(() => !document.querySelector('[data-testid="notifications-switch"]').disabled);
    assert.equal(await page.getAttribute(tid('notifications-switch'), 'aria-checked'), 'false');
    assert.equal((await server.store.get('users', 4242)).settings.notificationsEnabled, false);

    // 10) Qayta kirish: onboarding ko'rsatilmaydi, hammasi saqlangan
    await page.goto(server.baseUrl + '/#/');
    await page.reload();
    await page.waitForSelector(tid('page-home'));
    assert.match(await page.textContent(tid('home-grade')), /9-sinf/);
    await page.click(tid('tab-user'));
    assert.equal(await page.getAttribute(tid('notifications-switch'), 'aria-checked'), 'false');

    // Telegram SDK to'g'ri ishga tushirilgan
    const calls = await page.evaluate(() => window.__tgCalls.map(([n]) => n));
    assert.ok(calls.includes('ready') && calls.includes('expand'));

    // Token doimiy xotiraga yozilmaydi
    const stored = await page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie]));
    assert.ok(!stored.includes('eyJ'), 'sessiya tokeni storage/cookie da saqlanmasligi kerak');

    assert.deepEqual(problems(), [], 'konsolda xato yoki CSP buzilishi bo\'lmasligi kerak');
    await context.close();
  });

  test("noma'lum sahifa uchun 404 holati", async () => {
    const { page, context } = await openApp(server, { telegramUser: { id: 4242 } });
    await page.waitForSelector(tid('page-home'));
    await page.evaluate(() => (location.hash = '#/yoq-sahifa'));
    await page.waitForSelector(tid('page-not-found'));
    await context.close();
  });

  test('kichik ekran (320px) da elementlar kesilmaydi', async () => {
    const { page, context } = await openApp(server, { telegramUser: { id: 5151, first_name: 'Juda-uzun-ismli-foydalanuvchi-Abdurahmonjon' }, width: 320, height: 568 });
    await page.waitForSelector(tid('page-onboarding'));
    await assertNoHorizontalOverflow(page);
    await shot(page, '05-onboarding-320');
    await page.click(tid('grade-11'));
    await page.click(tid('onboarding-start'));
    await page.waitForSelector(tid('page-home'));
    await assertNoHorizontalOverflow(page);
    await shot(page, '06-home-320');
    // bosish maydonlari yetarli kattalikda
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('button, a.btn, .tabbar__item, .quick')]
        .map((el) => ({ t: el.dataset.testid ?? el.textContent.trim().slice(0, 20), r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && (r.height < 40 || r.width < 40))
        .map(({ t }) => t));
    assert.deepEqual(small, []);
    await page.click(tid('tab-user'));
    await page.waitForSelector(tid('page-profile'));
    await assertNoHorizontalOverflow(page);
    await context.close();
  });

  test('soxta initData bilan kirish rad etiladi va xato holati ko\'rsatiladi', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route('https://telegram.org/**', (route) => route.abort());
    await page.addInitScript(() => {
      window.Telegram = { WebApp: { initData: 'user=%7B%22id%22%3A1%7D&auth_date=1&hash=' + 'a'.repeat(64), ready() {}, expand() {}, isVersionAtLeast: () => false } };
    });
    await page.goto(server.baseUrl);
    await page.waitForSelector(tid('state-error'));
    assert.equal(await page.isVisible(tid('retry')), true);
    assert.equal(await page.isVisible('#tabbar'), false);
    await shot(page, '07-auth-error');
    await context.close();
  });

  test("server ishlamay qolsa xato holati va 'Qayta urinish' ishlaydi", async () => {
    const { page, context } = await openApp(server, { telegramUser: { id: 4242 } });
    await page.waitForSelector(tid('page-home'));
    let fail = true;
    await page.route('**/api/v1/**', (route) => (fail ? route.abort() : route.continue()));
    await page.reload();
    await page.waitForSelector(tid('state-error'));
    fail = false;
    await page.click(tid('retry'));
    await page.waitForSelector(tid('page-home'));
    await context.close();
  });
});

describe('Telegram dan tashqarida', () => {
  test("dev kirish o'chiq bo'lsa 'Telegram orqali oching' ko'rsatiladi", async () => {
    const server = await startTestServer();
    const { page, context } = await openApp(server);
    await page.waitForSelector(tid('state-empty'));
    assert.match(await page.textContent('#view'), /Telegram ichida ishlaydi/);
    await shot(page, '08-not-in-telegram');
    await context.close();
    await server.close();
  });

  test('dev kirish yoqilgan bo\'lsa brauzerda sinov foydalanuvchisi bilan ishlaydi', async () => {
    const server = await startTestServer({ DEV_AUTH_ENABLED: 'true' });
    const { page, context, problems } = await openApp(server);
    await page.waitForSelector(tid('page-onboarding'));
    await page.click(tid('grade-5'));
    await page.click(tid('onboarding-start'));
    await page.waitForSelector(tid('page-home'));
    assert.equal(await page.textContent(tid('greeting')), 'Salom, Sinov!');
    assert.deepEqual(problems(), []);
    await context.close();
    await server.close();
  });
});
