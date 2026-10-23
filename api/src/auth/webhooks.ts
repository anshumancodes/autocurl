import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';
import { authConfig } from '../lib/config.js';
import { syncClerkUser, markClerkUserDeleted } from './users.js';

export function verifyClerkWebhookSignature(raw: Buffer, req: Request): boolean {
  const id = req.header('svix-id'); const timestamp = req.header('svix-timestamp'); const signatures = req.header('svix-signature');
  if (!id || !timestamp || !signatures) return false;
  const age = Math.abs(Date.now() - Number(timestamp) * 1000); if (!Number.isFinite(age) || age > 5 * 60 * 1000) return false;
  const secret = authConfig.clerkWebhookSecret().replace(/^whsec_/, '');
  const key = Buffer.from(secret, 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${raw.toString('utf8')}`).digest('base64');
  return signatures.split(' ').some(value => { const candidate = value.replace(/^v1,/, ''); return candidate.length === expected.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected)); });
}

export async function postClerkWebhook(req: Request, res: Response): Promise<void> {
  const raw = req.body as Buffer;
  if (!Buffer.isBuffer(raw) || !verifyClerkWebhookSignature(raw, req)) { res.status(400).json({ error: 'invalid signature' }); return; }
  let body: any; try { body = JSON.parse(raw.toString('utf8')); } catch { res.status(400).json({ error: 'invalid payload' }); return; }
  const eventId = req.header('svix-id'); const event = body?.type; const clerkUserId = body?.data?.id;
  if (!eventId || !event || !clerkUserId) { res.status(400).json({ error: 'invalid event' }); return; }
  try {
    await prisma.$transaction(async tx => {
      const stored = await tx.webhookEvent.create({ data: { eventId, event: `clerk.${event}`, payload: body } }).catch(error => {
        if (error?.code === 'P2002') return null; throw error;
      });
      if (!stored || stored.processedAt) return;
      if (event === 'user.created' || event === 'user.updated') await syncClerkUser({ id: clerkUserId }, tx);
      if (event === 'user.deleted') await markClerkUserDeleted(clerkUserId, tx);
      await tx.webhookEvent.update({ where: { id: stored.id }, data: { processedAt: new Date(), processingError: null } });
    });
    res.json({ received: true });
  } catch { res.status(500).json({ error: 'retryable processing failure' }); }
}
