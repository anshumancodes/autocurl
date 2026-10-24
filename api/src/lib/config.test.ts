import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedWebOrigins, billingConfig, validateServerEnv } from './config.js';

function restore(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('monthly billing configuration uses INR minor units for ₹499', () => {
  const previousCurrency = process.env.RAZORPAY_CURRENCY;
  const previousAmount = process.env.PRO_MONTHLY_AMOUNT_MINOR;
  delete process.env.RAZORPAY_CURRENCY;
  delete process.env.PRO_MONTHLY_AMOUNT_MINOR;
  assert.equal(billingConfig.currency(), 'INR');
  assert.equal(billingConfig.monthlyAmount(), 49900);
  restore('RAZORPAY_CURRENCY', previousCurrency);
  restore('PRO_MONTHLY_AMOUNT_MINOR', previousAmount);
});

test('configured monthly amount is accepted as Razorpay minor units', () => {
  const previousAmount = process.env.PRO_MONTHLY_AMOUNT_MINOR;
  process.env.PRO_MONTHLY_AMOUNT_MINOR = '49900';
  assert.equal(billingConfig.monthlyAmount(), 49900);
  restore('PRO_MONTHLY_AMOUNT_MINOR', previousAmount);
});

test('server environment validation accepts local multi-origin configuration', () => {
  const names = ['DATABASE_URL', 'CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY', 'CLERK_WEBHOOK_SECRET', 'GEMINI_API_KEY', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET', 'RAZORPAY_PLAN_ID_MONTHLY', 'APP_BASE_URL', 'WEB_APP_URL'];
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  const previousAmount = process.env.PRO_MONTHLY_AMOUNT_MINOR;
  for (const name of names) process.env[name] = 'configured';
  process.env.APP_BASE_URL = 'http://localhost:3000';
  process.env.WEB_APP_URL = 'http://localhost:3000,https://autocurl.lol';
  process.env.PRO_MONTHLY_AMOUNT_MINOR = '49900';
  validateServerEnv();
  assert.deepEqual(allowedWebOrigins(), ['http://localhost:3000', 'https://autocurl.lol']);
  for (const [name, value] of previous) restore(name, value);
  restore('PRO_MONTHLY_AMOUNT_MINOR', previousAmount);
});
