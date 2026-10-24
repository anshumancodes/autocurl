import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authUser, getStatus, postCancel, postCheckout, postVerify } from './billing.js';

function request(method: string, body?: unknown) {
  return {
    method,
    body,
    header(name: string) {
      return name.toLowerCase() === 'origin' ? 'http://localhost:3000' : undefined;
    },
  } as any;
}

function response() {
  let statusCode = 200;
  let payload: any;
  return {
    status(code: number) { statusCode = code; return this; },
    json(value: unknown) { payload = value; return this; },
    result() { return { statusCode, payload }; },
  } as any;
}

test('authUser rejects requests without Clerk credentials', () => {
  assert.throws(() => authUser(request('POST')), (error: any) => {
    assert.equal(error.status, 401);
    assert.equal(error.code, 'authentication_required');
    return true;
  });
});

test('protected billing handlers return authentication_required when signed out', async () => {
  const cases: Array<[string, (req: any, res: any) => Promise<void>, any]> = [
    ['checkout', postCheckout, request('POST', { plan: 'monthly' })],
    ['verify', postVerify, request('POST', {})],
    ['status', getStatus, request('GET')],
    ['cancel', postCancel, request('POST', {})],
  ];

  for (const [name, handler, req] of cases) {
    const res = response();
    await handler(req, res);
    const result = res.result();
    assert.equal(result.statusCode, 401, name);
    assert.equal(result.payload.error.code, 'authentication_required', name);
  }
});
