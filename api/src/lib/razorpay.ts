import crypto from 'node:crypto';
import { billingConfig } from './config.js';

const API = 'https://api.razorpay.com/v1';

export type RazorpaySubscription = {
  id: string; plan_id: string; status: string; current_start?: number; current_end?: number;
  charge_at?: number; start_at?: number; end_at?: number; [key: string]: unknown;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = Buffer.from(`${billingConfig.keyId()}:${billingConfig.keySecret()}`).toString('base64');
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Razorpay request failed with status ${response.status}`);
  return JSON.parse(body) as T;
}

export function verifySignature(payload: string | Buffer, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const actual = Buffer.from(signature || '');
  const expectedBuffer = Buffer.from(expected);
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

export function verifyCheckoutSignature(subscriptionId: string, paymentId: string, signature: string): boolean {
  return verifySignature(`${paymentId}|${subscriptionId}`, signature, billingConfig.keySecret());
}

export function createSubscription(planId: string, totalCount: number, notes: Record<string, string>) {
  return request<RazorpaySubscription>('/subscriptions', {
    method: 'POST', body: JSON.stringify({ plan_id: planId, total_count: totalCount, customer_notify: 1, notes }),
  });
}

export function getSubscription(id: string) {
  return request<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(id)}`);
}

export function cancelSubscription(id: string, cancelAtCycleEnd = true) {
  return request<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(id)}/cancel`, {
    method: 'POST', body: JSON.stringify({ cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }),
  });
}

