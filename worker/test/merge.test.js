import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergePatch } from '../src/merge.js';

test('mergePatch replaces scalars', () => {
  assert.equal(mergePatch('a', 'b'), 'b');
  assert.equal(mergePatch(1, 2), 2);
});

test('mergePatch merges nested objects', () => {
  const target = { a: 1, b: { c: 2, d: 3 } };
  const patch = { b: { c: 9 } };
  assert.deepEqual(mergePatch(target, patch), { a: 1, b: { c: 9, d: 3 } });
});

test('mergePatch null deletes keys', () => {
  const target = { a: 1, b: { c: 2 } };
  assert.deepEqual(mergePatch(target, { b: null }), { a: 1 });
  assert.deepEqual(mergePatch(target, { b: { c: null } }), { a: 1, b: {} });
});

test('mergePatch replaces arrays wholesale', () => {
  const target = { list: [1, 2, 3] };
  assert.deepEqual(mergePatch(target, { list: [9] }), { list: [9] });
});

test('mergePatch handles object root onto non-object target', () => {
  assert.deepEqual(mergePatch(null, { a: 1 }), { a: 1 });
  assert.deepEqual(mergePatch(5, { a: 1 }), { a: 1 });
});
