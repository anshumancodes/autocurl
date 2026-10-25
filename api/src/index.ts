import { createApp } from './app.js';
import { validateServerEnv } from './lib/config.js';
import { connectDB, disconnectDB } from './db/dbConnect.js';

async function main() {
  validateServerEnv();

  const port = Number(process.env.PORT || 8000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be an integer between 1 and 65535');

  await connectDB();

  const server = createApp().listen(port, () =>
    console.log(`autocurl API listening on ${port}`),
  );

  async function shutdown(signal: string) {
    console.log(`\n${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
