import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScopeSheetEnrichPrompt, sanitizeScopeSheetEnrichment } from '../src/scope-sheet.js';

test('buildScopeSheetEnrichPrompt forbids prices/quantities and lists line ids', () => {
  const p = buildScopeSheetEnrichPrompt({
    sheet: { packageId: 'joinery', trade: 'Millwork', title: 'x', lines: [{ id: 'joinery:a', description: 'TV unit', qty: 1, unit: 'nos' }] },
    quality: 'standard'
  });
  assert.match(p, /Do NOT change quantities/);
  assert.match(p, /NEVER include prices/);
  assert.match(p, /joinery:a/);
});

test('sanitizeScopeSheetEnrichment keeps known ids and blocks qty/rate', () => {
  const sheet = { lines: [{ id: 'joinery:a' }] };
  const out = sanitizeScopeSheetEnrichment({
    byLineId: {
      'joinery:a': { spec: '18mm BWP ply', make: 'Century', size: '1800x450x1800', finish: 'Laminate', qty: 99, rate: 100 },
      ghost: { spec: 'x' }
    },
    inclusions: ['Site protection'],
    assumptions: ['Plaster complete']
  }, sheet);
  assert.ok(out);
  assert.deepEqual(Object.keys(out.byLineId), ['joinery:a']);
  assert.equal(out.byLineId['joinery:a'].qty, undefined);
  assert.equal(out.byLineId['joinery:a'].rate, undefined);
  assert.equal(out.byLineId['joinery:a'].spec, '18mm BWP ply');
  assert.deepEqual(out.inclusions, ['Site protection']);
});

test('sanitizeScopeSheetEnrichment returns null when nothing valid', () => {
  assert.equal(sanitizeScopeSheetEnrichment({ byLineId: {} }, { lines: [] }), null);
  assert.equal(sanitizeScopeSheetEnrichment(null, {}), null);
});
