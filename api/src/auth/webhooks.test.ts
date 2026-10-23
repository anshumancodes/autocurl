import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyClerkWebhookSignature } from './webhooks.js';

test('Clerk webhook verification signs the exact Svix payload and enforces freshness', () => {
  process.env.CLERK_WEBHOOK_SECRET = `whsec_${Buffer.from('clerk-test-secret').toString('base64')}`;
  const raw = Buffer.from('{"type":"user.created","data":{"id":"user_test"}}');
  const id = 'msg_test';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHmac('sha256', Buffer.from('clerk-test-secret')).update(`${id}.${timestamp}.${raw}`).digest('base64');
  const req = { header(name: string) { return ({ 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` } as Record<string, string>)[name.toLowerCase()]; } } as any;
  assert.equal(verifyClerkWebhookSignature(raw, req), true);
  assert.equal(verifyClerkWebhookSignature(Buffer.from('{"type":"user.deleted"}'), req), false);
  const stale = { header(name: string) { return ({ 'svix-id': id, 'svix-timestamp': String(Number(timestamp) - 301), 'svix-signature': `v1,${signature}` } as Record<string, string>)[name.toLowerCase()]; } } as any;
  assert.equal(verifyClerkWebhookSignature(raw, stale), false);
});
