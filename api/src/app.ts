import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { postScan } from './scan/scan.js';
import { errorHandler } from './lib/errors.js';
import { scanRateLimit } from './middleware/rate-limit.js';
import { getStatus, postCancel, postCheckout, postVerify, postWebhook } from './billing/billing.js';
import { postCliExchange, postCliRevoke, requireCliSession } from './auth/cli.js';
import { postClerkWebhook } from './auth/webhooks.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    const origin = req.header('Origin');
    const allowed = process.env.WEB_APP_URL?.trim() || 'http://localhost:3000';
    if (origin === allowed || origin === 'https://autocurl.lol') {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
      res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    }
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });
  app.use(clerkMiddleware());
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
