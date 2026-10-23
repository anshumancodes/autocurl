import type { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const buckets = new Map<string, { startedAt: number; count: number }>();

export function scanRateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    next();
    return;
  }
  if (current.count >= MAX_REQUESTS) {
    res.status(429).json({ error: { code: 'quota_exceeded', message: 'Too many scan requests. Please retry later.' } });
    return;
  }
  current.count += 1;
  next();
}
