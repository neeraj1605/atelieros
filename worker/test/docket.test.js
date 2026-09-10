import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDocketPrompt, sanitizeDocketEnrichment } from '../src/docket.js';

const DOCKET = {
  id: 'lighting',
  name: 'Lighting Docket',
  sections: [
    { key: 'fixtures', title: 'Fixture Schedule', columns: ['Mark', 'Fixture', 'Make / Spec', 'Qty'], rows: [['L1', 'Cove profile', '', 42], ['L2', 'Spot', '', 6]] }
  ]
};

test('sanitizeDocketEnrichment keeps known sections/columns and aligns rows', () => {
  const out = sanitizeDocketEnrichment({
    notes: 'Use 24V profiles; drivers in the ceiling void.',
    sections: {
      fixtures: {
        'Make / Spec': ['Philips 24V profile', 'Wipro 24 deg spot'],
        'Unknown Column': ['x'],
        'Qty': [999, 999]
      },
      nope: { 'Make / Spec': ['x'] }
    }
  }, DOCKET);
  assert.ok(out);
  assert.equal(out.sections.fixtures['Make / Spec'].length, 2);
  assert.equal(out.sections.fixtures['Make / Spec'][0], 'Philips 24V profile');
  assert.equal(out.sections.fixtures['Unknown Column'], undefined);
  assert.equal(out.sections.nope, undefined);
  // Quantity columns are immutable — enrichment must not change them.
  assert.equal(out.sections.fixtures['Qty'], undefined);
});

test('sanitizeDocketEnrichment rejects empty/invalid', () => {
  assert.equal(sanitizeDocketEnrichment(null, DOCKET), null);
  assert.equal(sanitizeDocketEnrichment({}, DOCKET), null);
  assert.equal(sanitizeDocketEnrichment({ sections: {} }, DOCKET), null);
});

test('dump prompt forbids prices and lists real makes', () => {
  const p = buildDocketPrompt(DOCKET, { projectType: 'ready', quality: 'standard' });
  assert.match(p, /NEVER include prices/i);
  assert.match(p, /Hettich|Hafele/);
  assert.match(p, /fixtures/);
});
