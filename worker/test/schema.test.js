import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeContextPatch, sanitizeProposals } from '../src/schema.js';

test('sanitizeContextPatch drops unknown top-level keys', () => {
  const out = sanitizeContextPatch({ notes: 'hi', evil: { x: 1 }, budget: { target: 100 } });
  assert.deepEqual(out, { notes: 'hi', budget: { target: 100 } });
});

test('sanitizeContextPatch rejects non-objects', () => {
  assert.equal(sanitizeContextPatch(null), null);
  assert.equal(sanitizeContextPatch('x'), null);
  assert.equal(sanitizeContextPatch([1, 2]), null);
  assert.equal(sanitizeContextPatch({}), null);
  assert.equal(sanitizeContextPatch({ unknown: 1 }), null);
});

test('sanitizeContextPatch strips functions and non-finite numbers', () => {
  const out = sanitizeContextPatch({ notes: 'ok', budget: { target: Infinity, currency: 'INR' } });
  assert.deepEqual(out, { notes: 'ok', budget: { currency: 'INR' } });
});

test('sanitizeProposals keeps valid boq.add', () => {
  const out = sanitizeProposals([
    { type: 'boq.add', rationale: 'x', payload: { item: 'Sofa', qty: 1, rate: 50000, unit: 'nos', room: 'room-living', category: 'Furniture' } }
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].type, 'boq.add');
  assert.equal(out[0].payload.item, 'Sofa');
  assert.equal(out[0].payload.rate, 50000);
});

test('sanitizeProposals rejects bad numbers and unknown types', () => {
  const out = sanitizeProposals([
    { type: 'boq.add', payload: { item: 'Bad', qty: -1, rate: 10 } },
    { type: 'boq.add', payload: { item: 'Bad2', qty: 1, rate: -5 } },
    { type: 'boq.add', payload: { item: '', qty: 1, rate: 5 } },
    { type: 'danger.delete', payload: { item: 'x' } },
    { type: 'room.upsert', payload: { name: 'Living', lengthM: 5, widthM: 4 } }
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].type, 'room.upsert');
  assert.equal(out[0].payload.lengthM, 5);
});

test('sanitizeProposals round-trips style.apply', () => {
  const out = sanitizeProposals([
    { type: 'style.apply', rationale: 'warm', payload: { directions: ['Japandi'], palette: ['#fff'] } }
  ]);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].payload.directions, ['Japandi']);
});

test('sanitizeProposals ignores non-arrays', () => {
  assert.deepEqual(sanitizeProposals(null), []);
  assert.deepEqual(sanitizeProposals('x'), []);
});
