import type { Prisma, SubscriptionStatus } from '@prisma/client';

export const LIVE_STATUSES: SubscriptionStatus[] = ['CREATED', 'AUTHENTICATED', 'ACTIVE', 'PENDING'];

export function isPaidThrough(subscription: { status: SubscriptionStatus; currentPeriodEndsAt: Date | null; graceUntil: Date | null }, now = new Date()): boolean {
  if (subscription.status === 'HALTED' || subscription.status === 'CANCELLED' || subscription.status === 'COMPLETED' || subscription.status === 'EXPIRED') return false;
  return Boolean(subscription.currentPeriodEndsAt && subscription.currentPeriodEndsAt > now) || Boolean(subscription.graceUntil && subscription.graceUntil > now);
}

export async function syncEntitlement(tx: Prisma.TransactionClient, userId: string, now = new Date()): Promise<void> {
  const subscription = await tx.subscription.findFirst({ where: { userId, status: { in: LIVE_STATUSES } }, orderBy: { currentPeriodEndsAt: 'desc' } });
  const paid = subscription ? isPaidThrough(subscription, now) : false;
  await tx.entitlement.upsert({
    where: { userId },
    create: paid ? { userId, plan: 'PRO', periodStartsAt: subscription?.currentPeriodStartsAt, periodEndsAt: subscription?.currentPeriodEndsAt } : { userId, trialStartedAt: now },
    update: paid ? { plan: 'PRO', periodStartsAt: subscription?.currentPeriodStartsAt, periodEndsAt: subscription?.currentPeriodEndsAt } : { plan: 'FREE' },
  });
  await tx.user.update({ where: { id: userId }, data: { plan: paid ? 'PRO' : 'FREE' } });
}
