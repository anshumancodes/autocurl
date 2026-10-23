import test from 'node:test';
import assert from 'node:assert/strict';
import { billingConfig } from './config.js';

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
