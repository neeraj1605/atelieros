import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSheetsPrompt, sanitizeSheetNotes } from '../src/sheets.js';

test('sanitizeSheetNotes keeps known sheets and clamps notes', () => {
  const out = sanitizeSheetNotes({
    sheets: {
      main: { notes: ['Cluster wet areas to share one shaft.', '', '  '] },
      furniture: { notes: ['Anchor the sofa on the long wall with 900 mm circulation.'] },
      lighting: { notes: ['Living 3000K ambient; kitchen 4000K task.'] },
      bogus: { notes: ['should be dropped'] }
    }
  });
  assert.ok(out);
  assert.deepEqual(Object.keys(out).sort(), ['furniture', 'lighting', 'main']);
  assert.equal(out.main.notes.length, 1);
  assert.equal(out.bogus, undefined);
});

test('sanitizeSheetNotes rejects empty/invalid', () => {
  assert.equal(sanitizeSheetNotes(null), null);
  assert.equal(sanitizeSheetNotes({}), null);
  assert.equal(sanitizeSheetNotes({ sheets: {} }), null);
  assert.equal(sanitizeSheetNotes({ sheets: { main: { notes: [] } } }), null);
});

test('buildSheetsPrompt forbids dimensions/prices and lists rooms', () => {
  const p = buildSheetsPrompt({
    projectType: 'ready', quality: 'standard',
    rooms: [{ name: 'Living Room', kind: 'living', length: 5.4, width: 4.2 }],
    envelope: { widthM: 7.6, heightM: 7.6 }
  });
  assert.match(p, /Never state dimensions, quantities or rates/);
  assert.match(p, /Living Room/);
  assert.match(p, /ceiling/);
});
