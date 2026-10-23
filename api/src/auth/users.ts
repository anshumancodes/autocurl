import { prisma } from '../lib/db.js';

export type ClerkUser = { id: string; email?: string | null };

export async function syncClerkUser(user: ClerkUser, client: any = prisma) {
  return client.user.upsert({
    where: { clerkUserId: user.id },
    create: { clerkUserId: user.id },
    update: { deletedAt: null },
  });
}

export async function markClerkUserDeleted(clerkUserId: string, client: any = prisma) {
  return client.user.updateMany({ where: { clerkUserId }, data: { deletedAt: new Date() } });
}

