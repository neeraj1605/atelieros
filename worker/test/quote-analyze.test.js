import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuoteAnalyzePrompt, sanitizeQuoteAnalysis } from '../src/quote-analyze.js';

test('buildQuoteAnalyzePrompt includes sheet line ids and rules', () => {
  const p = buildQuoteAnalyzePrompt({
    sheet: { packageId: 'lighting', trade: 'Lighting', lines: [{ id: 'lighting:x', description: 'Spot light', qty: 6, unit: 'nos' }] }
  });
  assert.match(p, /NEVER invent a rate/);
  assert.match(p, /lighting:x/);
});

test('sanitizeQuoteAnalysis coerces numbers, keeps known ids, defaults confidence', () => {
  const sheet = { lines: [{ id: 'lighting:x' }] };
  const out = sanitizeQuoteAnalysis({
    vendorName: 'Acme',
    currency: 'INR',
    total: '123456',
    lineItems: [
      { description: 'Spot light', qty: '6', unit: 'nos', rate: '1200', amount: '7200', sheetLineId: 'lighting:x', confidence: 'HIGH' },
      { description: 'Mystery', sheetLineId: 'ghost' }
    ],
    coverage: { quoted: ['lighting:x', 'ghost'], missing: ['lighting:y'], extra: ['Freight'] },
    compliance: { deviations: [{ sheetLineId: 'lighting:x', field: 'spec', expected: 'Philips', found: 'Generic', severity: 'high' }] },
    summary: 'ok'
  }, sheet);
  assert.ok(out);
  assert.equal(out.total, 123456);
  assert.equal(out.lineItems.length, 2);
  assert.equal(out.lineItems[0].sheetLineId, 'lighting:x');
  assert.equal(out.lineItems[0].confidence, 'high');
  assert.equal(out.lineItems[1].sheetLineId, null);
  assert.deepEqual(out.coverage.quoted, ['lighting:x']);
  assert.equal(out.compliance.deviations.length, 1);
});

test('sanitizeQuoteAnalysis returns null for empty', () => {
  assert.equal(sanitizeQuoteAnalysis({}, { lines: [] }), null);
  assert.equal(sanitizeQuoteAnalysis(null, {}), null);
});
