import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScopeEnrichPrompt, sanitizeScopeEnrichment } from '../src/scope-enrich.js';

test('buildScopeEnrichPrompt forbids prices and lists activities', () => {
  const p = buildScopeEnrichPrompt({
    scopeDoc: { packages: [{ name: 'Flooring', activities: [{ id: 'fl-1', name: 'Vitrified tiles', unit: 'sqft' }] }] },
    quality: 'standard'
  });
  assert.match(p, /NEVER include prices/);
  assert.match(p, /NEVER change quantities/);
  assert.match(p, /fl-1/);
});

test('sanitizeScopeEnrichment keeps only known ids and blocks qty/rate', () => {
  const doc = { packages: [{ name: 'Flooring', activities: [{ id: 'fl-1', name: 'Tiles', unit: 'sqft' }] }] };
  const out = sanitizeScopeEnrichment({
    byActivityId: {
      'fl-1': { detail: 'Kajaria vitrified', make: 'Kajaria', spec: '600x600 matt', qty: 999, rate: 100 },
      ghost: { detail: 'x' }
    }
  }, doc);
  assert.ok(out);
  assert.deepEqual(Object.keys(out.byActivityId), ['fl-1']);
  assert.equal(out.byActivityId['fl-1'].detail, 'Kajaria vitrified');
  assert.equal(out.byActivityId['fl-1'].qty, undefined);
  assert.equal(out.byActivityId['fl-1'].rate, undefined);
});

test('sanitizeScopeEnrichment returns null when nothing valid', () => {
  assert.equal(sanitizeScopeEnrichment({ byActivityId: {} }, { packages: [] }), null);
  assert.equal(sanitizeScopeEnrichment(null, {}), null);
});
