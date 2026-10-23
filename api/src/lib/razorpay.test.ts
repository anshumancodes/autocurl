import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyCheckoutSignature, verifySignature } from './razorpay.js';

test('Razorpay signatures accept the exact signed body and reject changes', () => {
  const body = Buffer.from('{"id":"evt_test"}');
  const secret = 'webhook-secret';
  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifySignature(body, signature, secret), true);
  assert.equal(verifySignature(Buffer.from('{"id":"evt_other"}'), signature, secret), false);
  assert.equal(verifySignature(body, `${signature}0`, secret), false);
});

test('checkout signatures cover payment and subscription IDs', () => {
  process.env.RAZORPAY_KEY_SECRET = 'checkout-secret';
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update('pay_test|sub_test').digest('hex');
  assert.equal(verifyCheckoutSignature('sub_test', 'pay_test', signature), true);
  assert.equal(verifyCheckoutSignature('sub_other', 'pay_test', signature), false);
});
