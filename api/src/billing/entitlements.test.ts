import test from 'node:test';
import assert from 'node:assert/strict';
import { isPaidThrough } from './entitlements.js';
import { mapRazorpayStatus, parseCheckoutPlan, safeSubscriptionTransition } from './billing.js';

test('an unsuccessful first payment does not create paid entitlement', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  assert.equal(isPaidThrough({ status: 'PENDING', currentPeriodEndsAt: null, graceUntil: null }, now), false);
  assert.equal(isPaidThrough({ status: 'HALTED', currentPeriodEndsAt: new Date('2026-02-01T00:00:00Z'), graceUntil: null }, now), false);
});

test('Razorpay lifecycle statuses map correctly and terminal states cannot revive', () => {
  assert.equal(mapRazorpayStatus('authenticated'), 'AUTHENTICATED');
  assert.equal(mapRazorpayStatus('charged'), 'CREATED');
  assert.equal(mapRazorpayStatus('cancelled'), 'CANCELLED');
  assert.equal(safeSubscriptionTransition('CANCELLED', 'ACTIVE'), 'CANCELLED');
  assert.equal(safeSubscriptionTransition('PENDING', 'ACTIVE'), 'ACTIVE');
});

test('checkout accepts monthly only', () => {
  assert.equal(parseCheckoutPlan('monthly'), 'monthly');
  assert.equal(parseCheckoutPlan('yearly'), null);
  assert.equal(parseCheckoutPlan(undefined), null);
});
