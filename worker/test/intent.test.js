import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasVisualIntent, contextIsSufficient, synthesizeImageSpec } from '../src/intent.js';
import { sanitizeImageSpec, aspectToSize } from '../src/schema.js';

test('hasVisualIntent detects explicit requests', () => {
  for (const t of [
    'show me what it would look like',
    'let me see the kitchen',
    'can you visualise this',
    'render the living room',
    'make a moodboard',
    'what would it look like',
    'sketch the bedroom',
    'give me a 3d view',
    'image of the dining area'
  ]) {
    assert.equal(hasVisualIntent(t), true, t);
  }
});

test('hasVisualIntent ignores plain turns', () => {
  for (const t of ['hi there', 'what should a sofa cost?', 'thanks!', 'quartz or marble?']) {
    assert.equal(hasVisualIntent(t), false, t);
  }
  assert.equal(hasVisualIntent(''), false);
  assert.equal(hasVisualIntent(null), false);
});

test('contextIsSufficient requires some brief signal', () => {
  assert.equal(contextIsSufficient({}), false);
  assert.equal(contextIsSufficient({ project: { spaceType: '3BHK' } }), true);
  assert.equal(contextIsSufficient({ style: { directions: ['Japandi'] } }), true);
  assert.equal(contextIsSufficient({ spaces: [{ name: 'Living Room' }] }), true);
});

test('synthesizeImageSpec builds a prompt from the brief', () => {
  const spec = synthesizeImageSpec(
    { project: { spaceType: '3BHK', location: 'Mumbai' }, style: { directions: ['Warm Minimal'] } },
    'show me the living room please'
  );
  assert.ok(spec);
  assert.equal(spec.generate, true);
  assert.match(spec.prompt, /Warm Minimal/);
  assert.match(spec.prompt, /living room/i);
  assert.doesNotMatch(spec.prompt, /show me/i);
});

test('synthesizeImageSpec returns null when nothing to render', () => {
  assert.equal(synthesizeImageSpec({}, ''), null);
});

test('sanitizeImageSpec accepts a valid spec', () => {
  const out = sanitizeImageSpec({ generate: true, prompt: 'warm minimal living room, light oak', reason: 'locking the look', aspect: '4:3' });
  assert.ok(out);
  assert.equal(out.aspect, '4:3');
  assert.equal(out.generate, true);
});

test('sanitizeImageSpec rejects invalid specs', () => {
  assert.equal(sanitizeImageSpec(null), null);
  assert.equal(sanitizeImageSpec({ generate: false, prompt: 'x' }), null);
  assert.equal(sanitizeImageSpec({ generate: true, prompt: 'short' }), null);
  const fallbackAspect = sanitizeImageSpec({ generate: true, prompt: 'a warm minimal living room with oak' });
  assert.equal(fallbackAspect.aspect, '16:9');
});

test('aspectToSize maps aspects', () => {
  assert.deepEqual(aspectToSize('16:9'), { width: 1280, height: 720 });
  assert.deepEqual(aspectToSize('4:3'), { width: 1024, height: 768 });
  assert.deepEqual(aspectToSize('unknown'), { width: 1280, height: 720 });
});
