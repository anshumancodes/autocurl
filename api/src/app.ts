import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { postScan } from './scan/scan.js';
import { errorHandler } from './lib/errors.js';
import { scanRateLimit } from './middleware/rate-limit.js';
import { getStatus, postCancel, postCheckout, postVerify, postWebhook } from './billing/billing.js';
import { postCliExchange, postCliRevoke, requireCliSession } from './auth/cli.js';
import { postClerkWebhook } from './auth/webhooks.js';
import { hasClerkCredentials } from './lib/clerk-auth.js';
import { allowedWebOrigins } from './lib/config.js';
import { prisma } from './lib/db.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'autocurl-api' }));
  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, service: 'autocurl-api', database: 'reachable' });
    } catch {
      res.status(503).json({ ok: false, service: 'autocurl-api', database: 'unavailable' });
    }
  });
  const allowedOrigins = new Set(allowedWebOrigins());
  app.use((req, res, next) => {
    const origin = req.header('Origin');
    if (origin && allowedOrigins.has(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
      res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    }
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });
  const authenticateWithClerk = clerkMiddleware();
  app.use((req, res, next) => {
    if (!hasClerkCredentials(req)) return next();
    return authenticateWithClerk(req, res, next);
  });
  app.post('/api/webhooks/clerk', express.raw({ type: 'application/json', limit: '256kb' }), postClerkWebhook);
  app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json', limit: '256kb' }), postWebhook);
  app.use(express.json({ limit: '64kb' }));
  app.post('/api/cli/exchange', postCliExchange);
  app.post('/api/cli/revoke', postCliRevoke);
  app.post('/api/billing/checkout', postCheckout);
  app.post('/api/billing/verify', postVerify);
  app.get('/api/billing/status', getStatus);
  app.post('/api/billing/cancel', postCancel);
  app.get('/api/cli/billing/status', requireCliSession, getStatus);
  app.post('/v1/scan', requireCliSession, scanRateLimit, postScan);
  app.use(errorHandler);
  return app;
}
