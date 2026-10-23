import assert from 'node:assert/strict';
import test from 'node:test';
import { validateScanRequest, validateScanResponse } from './contracts.js';

const request = {
  version: 'v1', operation: 'discover_and_enrich', request_id: 'scan-test-1234',
  detection: { languages: ['typescript'], frameworks: ['express'] }, routes: [], warnings: [],
  snippets: [{ file: 'src/routes.ts', start: 1, end: 2, content: "app.get('/health', handler)" }],
};

test('accepts the v1 scan contract and rejects unsafe snippets', () => {
  assert.equal(validateScanRequest(request).version, 'v1');
  assert.throws(() => validateScanRequest({ ...request, snippets: [{ ...request.snippets[0], file: '../secrets.env' }] }));
});

test('validates structured provider output', () => {
  const output = validateScanResponse({ version: 'v1', endpoints: [{ method: 'GET', path: '/health', source: { file: 'src/routes.ts', line: 1 }, path_parameters: [], headers: {}, body: '', has_body: false, auth: null, evidence: ["app.get('/health'"] }] });
  assert.equal(output.endpoints[0].method, 'GET');
  assert.throws(() => validateScanResponse({ version: 'v1', endpoints: [{ method: 'GET', path: '/x', source: { file: 'x', line: 0 }, path_parameters: [], evidence: [] }] }));
});
