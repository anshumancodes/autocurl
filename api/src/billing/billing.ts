import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { Prisma, type SubscriptionStatus } from '@prisma/client';
import { prisma } from '../lib/db.js';
import { ApiError, sendError } from '../lib/errors.js';
import { billingConfig } from '../lib/config.js';
import { cancelSubscription, createSubscription, getSubscription, verifyCheckoutSignature, verifySignature } from '../lib/razorpay.js';
import { syncEntitlement } from './entitlements.js';
import { hasClerkCredentials } from '../lib/clerk-auth.js';

const idFrom = (value: unknown): string | null => typeof value === 'string' && value ? value : null;
const dateFromUnix = (value: unknown): Date | null => typeof value === 'number' ? new Date(value * 1000) : null;
export function authUser(req: Request): string {
  if (!hasClerkCredentials(req)) throw new ApiError(401, 'authentication_required', 'Sign in to manage billing.');
  const auth = getAuth(req);
  if (!auth.isAuthenticated || !auth.userId) throw new ApiError(401, 'authentication_required', 'Sign in to manage billing.');
  return auth.userId;
}
export function mapRazorpayStatus(value: string): SubscriptionStatus { return ({created: 'CREATED', authenticated: 'AUTHENTICATED', active: 'ACTIVE', pending: 'PENDING', paused: 'PENDING', halted: 'HALTED', cancelled: 'CANCELLED', completed: 'COMPLETED', expired: 'EXPIRED'} as Record<string, SubscriptionStatus>)[value] || 'CREATED'; }
export function safeSubscriptionTransition(current: SubscriptionStatus, proposed: SubscriptionStatus): SubscriptionStatus {
  if (['HALTED', 'CANCELLED', 'COMPLETED', 'EXPIRED'].includes(current) && !['HALTED', 'CANCELLED', 'COMPLETED', 'EXPIRED'].includes(proposed)) return current;
  return proposed;
}
export function parseCheckoutPlan(value: unknown): 'monthly' | null { return value === 'monthly' ? 'monthly' : null; }

export async function postCheckout(req: Request, res: Response): Promise<void> {
  try {
    const clerkUserId = authUser(req); const plan = parseCheckoutPlan(req.body?.plan);
    if (!plan) throw new ApiError(400, 'invalid_request', 'Choose the monthly Pro plan.');
    const user = await prisma.user.upsert({ where: { clerkUserId }, create: { clerkUserId }, update: {} });
    const existing = await prisma.subscription.findFirst({ where: { userId: user.id, status: { in: ['CREATED', 'AUTHENTICATED', 'ACTIVE', 'PENDING'] } } });
    if (existing) throw new ApiError(409, 'invalid_request', 'You already have an active or pending Pro subscription.');
    const remote = await createSubscription(billingConfig.monthlyPlanId(), 120, { user_id: user.id, plan });
    try {
      await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
        const concurrent = await tx.subscription.findFirst({ where: { userId: user.id, status: { in: ['CREATED', 'AUTHENTICATED', 'ACTIVE', 'PENDING'] } } });
        if (concurrent) throw new ApiError(409, 'invalid_request', 'You already have an active or pending Pro subscription.');
        await tx.subscription.create({ data: { userId: user.id, razorpaySubscriptionId: remote.id, razorpayPlanId: remote.plan_id, status: mapRazorpayStatus(remote.status), currentPeriodStartsAt: dateFromUnix(remote.current_start), currentPeriodEndsAt: dateFromUnix(remote.current_end), chargeAt: dateFromUnix(remote.charge_at), startAt: dateFromUnix(remote.start_at), endAt: dateFromUnix(remote.end_at) } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      try { await cancelSubscription(remote.id, false); } catch { console.error('Failed to cancel unpersisted Razorpay subscription'); }
      throw error;
    }
    res.status(201).json({ key_id: billingConfig.keyId(), subscription_id: remote.id, currency: billingConfig.currency(), plan });
  } catch (error) { if (error instanceof ApiError) sendError(res, error); else { console.error('Billing checkout failed'); sendError(res, new ApiError(503, 'provider_unavailable', 'Checkout is temporarily unavailable.')); } }
}

export async function postVerify(req: Request, res: Response): Promise<void> {
  try {
    const clerkUserId = authUser(req); const subscriptionId = idFrom(req.body?.razorpay_subscription_id); const paymentId = idFrom(req.body?.razorpay_payment_id); const signature = idFrom(req.body?.razorpay_signature);
    if (!subscriptionId || !paymentId || !signature) throw new ApiError(400, 'invalid_request', 'Incomplete payment verification data.');
    const sub = await prisma.subscription.findFirst({ where: { razorpaySubscriptionId: subscriptionId, user: { clerkUserId } } });
    if (!sub || !verifyCheckoutSignature(subscriptionId, paymentId, signature)) throw new ApiError(400, 'invalid_request', 'Payment verification failed.');
    const remote = await getSubscription(subscriptionId);
    if (remote.id !== subscriptionId || !['authenticated', 'active'].includes(remote.status)) throw new ApiError(400, 'invalid_request', 'Payment verification is pending Razorpay subscription confirmation.');
    await prisma.$transaction(async tx => {
      const current = await tx.subscription.findUnique({ where: { id: sub.id } });
      if (!current) throw new ApiError(400, 'invalid_request', 'Payment verification failed.');
      await tx.subscription.update({ where: { id: sub.id }, data: { status: safeSubscriptionTransition(current.status, mapRazorpayStatus(remote.status)), currentPeriodStartsAt: dateFromUnix(remote.current_start) || undefined, currentPeriodEndsAt: dateFromUnix(remote.current_end) || undefined, chargeAt: dateFromUnix(remote.charge_at) || undefined, startAt: dateFromUnix(remote.start_at) || undefined, endAt: dateFromUnix(remote.end_at) || undefined } });
      await syncEntitlement(tx, sub.userId);
    });
    res.json({ verified: true, entitlementConfirmed: true });
  } catch (error) { if (error instanceof ApiError) sendError(res, error); else sendError(res, new ApiError(500, 'internal_error', 'Payment verification failed.')); }
}

export async function getStatus(req: Request, res: Response): Promise<void> {
  try { const auth = hasClerkCredentials(req) ? getAuth(req) : null; const clerkUserId = req.authenticatedUserId || (auth?.isAuthenticated ? auth.userId : null); if (!clerkUserId) throw new ApiError(401, 'authentication_required', 'Sign in to view billing status.'); const user = await prisma.user.findUnique({ where: { clerkUserId }, include: { entitlement: true, subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } } }); if (!user) { res.json({ plan: 'FREE', usage: { used: 0, limit: 10 } }); return; } const e = user.entitlement; const start = e?.plan === 'PRO' ? e.periodStartsAt : e?.trialStartedAt; const end = e?.plan === 'PRO' ? e.periodEndsAt : start ? new Date(start.getTime() + 30 * 86400000) : new Date(); const used = start && end ? await prisma.scanUsage.count({ where: { userId: user.id, status: 'SUCCEEDED', createdAt: { gte: start, lt: end } } }) : 0; const subscription = user.subscriptions[0]; res.json({ plan: e?.plan || 'FREE', usage: { used, limit: e?.plan === 'PRO' ? 100 : 10, periodEndsAt: end }, subscription: subscription && { status: subscription.status, renewalAt: subscription.currentPeriodEndsAt, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd } }); }
  catch (error) { if (error instanceof ApiError) sendError(res, error); else sendError(res, new ApiError(500, 'internal_error', 'Billing status unavailable.')); }
}

export async function postCancel(req: Request, res: Response): Promise<void> {
  try { const clerkUserId = authUser(req); const sub = await prisma.subscription.findFirst({ where: { user: { clerkUserId }, status: { in: ['CREATED', 'AUTHENTICATED', 'ACTIVE', 'PENDING'] } }, orderBy: { createdAt: 'desc' } }); if (!sub) throw new ApiError(404, 'invalid_request', 'No active Pro subscription found.'); await cancelSubscription(sub.razorpaySubscriptionId, true); await prisma.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true } }); res.json({ cancelAtPeriodEnd: true, accessUntil: sub.currentPeriodEndsAt }); }
  catch (error) { if (error instanceof ApiError) sendError(res, error); else sendError(res, new ApiError(503, 'provider_unavailable', 'Cancellation is temporarily unavailable.')); }
}

export async function postWebhook(req: Request, res: Response): Promise<void> {
  const raw = req.body as Buffer; const signature = req.header('X-Razorpay-Signature') || ''; if (!Buffer.isBuffer(raw) || !verifySignature(raw, signature, billingConfig.webhookSecret())) { res.status(400).json({ error: 'invalid signature' }); return; }
  let body: any; try { body = JSON.parse(raw.toString('utf8')); } catch { res.status(400).json({ error: 'invalid payload' }); return; }
  const eventId = req.header('x-razorpay-event-id') || idFrom(body?.id); if (!eventId || !body?.event) { res.status(400).json({ error: 'missing event id' }); return; }
  try { await prisma.$transaction(async tx => { const event = await tx.webhookEvent.create({ data: { eventId, event: body.event, payload: body } }).catch(error => { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null; throw error; }); if (!event || event.processedAt) return; const entity = body?.payload?.subscription?.entity; const subId = idFrom(entity?.id); const sub = subId ? await tx.subscription.findUnique({ where: { razorpaySubscriptionId: subId } }) : null; if (sub) { const nextStatus = safeSubscriptionTransition(sub.status, mapRazorpayStatus(entity.status || body.event.split('.').pop() || 'created')); const pending = nextStatus === 'PENDING'; const graceUntil = pending ? new Date(Date.now() + 3 * 86400000) : nextStatus === 'ACTIVE' ? null : undefined; await tx.subscription.update({ where: { id: sub.id }, data: { status: nextStatus, currentPeriodStartsAt: dateFromUnix(entity.current_start) || undefined, currentPeriodEndsAt: dateFromUnix(entity.current_end) || undefined, chargeAt: dateFromUnix(entity.charge_at) || undefined, graceUntil } }); const paymentEntity = body?.payload?.payment?.entity; if (paymentEntity?.id) await tx.payment.upsert({ where: { razorpayPaymentId: paymentEntity.id }, create: { userId: sub.userId, subscriptionId: sub.id, razorpayPaymentId: paymentEntity.id, amount: Number(paymentEntity.amount || 0), currency: String(paymentEntity.currency || billingConfig.currency()), status: body.event === 'subscription.charged' ? 'CAPTURED' : 'AUTHORIZED', capturedAt: dateFromUnix(paymentEntity.created_at) }, update: { status: body.event === 'subscription.charged' ? 'CAPTURED' : undefined, capturedAt: dateFromUnix(paymentEntity.created_at) || undefined } }); await syncEntitlement(tx, sub.userId); } await tx.webhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date(), processingError: null } }); }); res.json({ received: true }); }
  catch (error) { console.error('Razorpay webhook processing failed'); res.status(500).json({ error: 'retryable processing failure' }); }
}
