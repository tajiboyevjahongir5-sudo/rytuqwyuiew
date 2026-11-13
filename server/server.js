import 'dotenv/config';
import { ConfigError, loadConfig } from './config/index.js';
import { createApp } from './app.js';
import { createStore } from './db/index.js';
import { logger, setLogLevel } from './utils/logger.js';

async function main() {
  const config = loadConfig();
  setLogLevel(config.logLevel);

  const store = await createStore(config);
  const app = createApp({ config, store });

  const server = app.listen(config.port, () => {
    logger.info('PHYSICA server ishga tushdi', {
      port: server.address().port,
      env: config.env,
      db: store.driver,
      devAuth: config.devAuthEnabled,
    });
    if (!config.telegram.botToken) {
      logger.warn("TELEGRAM_BOT_TOKEN berilmagan: Telegram orqali kirish ishlamaydi (faqat dev kirish)");
    }
  });

  let bot = null;
  if (config.telegram.botEnabled) {
    const { startBot } = await import('../bot/index.js');
    bot = await startBot({ config, store });
  }

  const shutdown = async (signal) => {
    logger.info("To'xtatilmoqda", { signal });
    await bot?.stop();
    server.close(async () => {
      await store.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => logger.error('unhandledRejection', { err }));
}

main().catch((err) => {
  if (err instanceof ConfigError) logger.error(err.message);
  else logger.error("Serverni ishga tushirib bo'lmadi", { err });
  process.exit(1);
});
