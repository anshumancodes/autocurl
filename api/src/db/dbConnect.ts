import { prisma } from '../lib/db.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

/**
 * Establishes a connection to the database with exponential back-off retries.
 * Throws if the database is unreachable after all attempts.
 */
export async function connectDB(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected');
      return;
    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES;
      const delay = RETRY_DELAY_MS * attempt;

      console.error(
        `❌ Database connection failed (attempt ${attempt}/${MAX_RETRIES}):`,
        err instanceof Error ? err.message : err,
      );

      if (isLastAttempt) {
        throw new Error(`Could not connect to the database after ${MAX_RETRIES} attempts.`);
      }

      console.log(`   Retrying in ${delay / 1000}s…`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Gracefully disconnects the Prisma client. Safe to call on process exit.
 */
export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
}
