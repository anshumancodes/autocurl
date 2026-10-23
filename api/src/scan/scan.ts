import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db.js';
import { ApiError, sendError } from '../lib/errors.js';
import { analyzeWithGemini } from '../lib/gemini.js';
import { validateScanRequest, validateScanResponse, type ScanRequest } from './contracts.js';

const PRICING_URL = 'https://autocurl.lol/pricing';

function quotaFor(plan: 'FREE' | 'PRO'): number {
  return plan === 'PRO' ? 100 : 10;
}

function periodFor(plan: 'FREE' | 'PRO', now: Date, trialStartedAt: Date | null, periodStartsAt: Date | null, periodEndsAt: Date | null) {
  if (plan === 'FREE') {
    const start = trialStartedAt ?? now;
    return { start, end: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000) };
  }
  if (periodStartsAt && periodEndsAt && periodEndsAt > now) return { start: periodStartsAt, end: periodEndsAt };
  const start = periodStartsAt ?? now;
  return { start, end: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000) };
}

async function reserve(clerkUserId: string, requestId: string, requestHash: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.upsert({ where: { clerkUserId }, create: { clerkUserId }, update: {} , include: { entitlement: true } });
        const existing = await tx.scanRequest.findUnique({ where: { userId_idempotencyKey: { userId: user.id, idempotencyKey: requestId } } });
        if (existing?.responseJson) {
          if (existing.requestHash !== requestHash) throw new ApiError(400, 'invalid_request', 'The idempotency key was reused with a different request.');
          return { user, existing };
        }
        const entitlement = user.entitlement ?? await tx.entitlement.create({ data: { userId: user.id, trialStartedAt: new Date() } });
        const now = new Date();
        const period = periodFor(entitlement.plan, now, entitlement.trialStartedAt, entitlement.periodStartsAt, entitlement.periodEndsAt);
        const used = await tx.scanUsage.count({ where: { userId: user.id, status: 'SUCCEEDED', createdAt: { gte: period.start, lt: period.end } } });
        if (used >= quotaFor(entitlement.plan)) throw new ApiError(entitlement.plan === 'FREE' ? 403 : 429, entitlement.plan === 'FREE' ? 'upgrade_required' : 'quota_exceeded', `AI scan quota reached. Upgrade at ${PRICING_URL}`);
        const request = await tx.scanRequest.create({ data: { userId: user.id, idempotencyKey: requestId, requestHash } });
        await tx.scanUsage.create({ data: { idempotencyKey: requestId, userId: user.id, status: 'PENDING' } });
        return { user, request };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') continue;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ApiError(409, 'invalid_request', 'A scan with this request ID is already in progress.');
      throw error;
    }
  }
  throw new ApiError(503, 'provider_unavailable', 'The scan could not be reserved. Please retry.');
}

export async function postScan(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const clerkUserId = req.authenticatedUserId || (auth.isAuthenticated ? auth.userId : null);
  if (!clerkUserId) { sendError(res, new ApiError(401, 'authentication_required', 'Sign in to use managed AI scans.')); return; }
  let input: ScanRequest;
  try { input = validateScanRequest(req.body); } catch { sendError(res, new ApiError(400, 'invalid_request', 'The scan request is invalid or too large.')); return; }
  const requestId = req.header('Idempotency-Key') || input.request_id;
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  try {
    const reservation = await reserve(clerkUserId, requestId, requestHash);
    if ('existing' in reservation && reservation.existing?.responseJson) { res.json(reservation.existing.responseJson); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.GEMINI_TIMEOUT_MS || 25000));
    let result;
    try { result = validateScanResponse(await analyzeWithGemini(input, controller.signal)); }
    catch { await prisma.$transaction([prisma.scanUsage.delete({ where: { userId_idempotencyKey: { userId: reservation.user.id, idempotencyKey: requestId } } }), prisma.scanRequest.delete({ where: { userId_idempotencyKey: { userId: reservation.user.id, idempotencyKey: requestId } } })]); sendError(res, new ApiError(503, 'provider_unavailable', 'Managed AI is temporarily unavailable. Please retry.')); return; }
    finally { clearTimeout(timeout); }
    const response = { ...result, version: 'v1' as const };
    await prisma.$transaction([
      prisma.scanUsage.update({ where: { userId_idempotencyKey: { userId: reservation.user.id, idempotencyKey: requestId } }, data: { status: 'SUCCEEDED', charged: true, completedAt: new Date() } }),
      prisma.scanRequest.update({ where: { userId_idempotencyKey: { userId: reservation.user.id, idempotencyKey: requestId } }, data: { responseJson: response, requestHash } }),
    ]);
    res.json(response);
  } catch (error) {
    if (error instanceof ApiError) { sendError(res, error); return; }
    console.error('Scan request failed');
    sendError(res, new ApiError(500, 'internal_error', 'The scan could not be completed.'));
  }
}
