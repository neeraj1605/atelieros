import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMoodboardPrompt, sanitizeMoodboard } from '../src/moodboard.js';

test('sanitizeMoodboard validates hex and roles', () => {
  const out = sanitizeMoodboard({
    themeInterpretation: 'Warm minimal kitchen rooted in oak and stone.',
    palette: [
      { hex: '#c9a27a', name: 'Warm Oak', role: 'wood' },
      { hex: '#8AA4A0', name: 'Sage', role: 'accent' },
      { hex: 'nothex', name: 'Bad', role: 'primary' },
      { hex: '#fff', name: 'Ivory', role: 'bogus' }
    ],
    materials: [{ surface: 'Counter', material: 'Quartz veined', make: 'Kajaria', note: 'avoid marble' }],
    lighting: { cct: '4000K', lux: '300-500', note: 'under-cabinet task light' },
    intent: 'A calm, hard-wearing kitchen.',
    dos: ['Use quartz counters'],
    donts: ['Avoid marble in wet zones']
  });
  assert.ok(out);
  assert.equal(out.palette.length, 3);
  assert.equal(out.palette[2].hex, '#fff');
  assert.equal(out.palette[2].role, 'accent'); // invalid role -> accent
  assert.equal(out.materials[0].make, 'Kajaria');
  assert.equal(out.lighting.cct, '4000K');
});

test('sanitizeMoodboard rejects empty/invalid', () => {
  assert.equal(sanitizeMoodboard(null), null);
  assert.equal(sanitizeMoodboard({}), null);
  assert.equal(sanitizeMoodboard({ palette: [{ hex: 'x' }] }), null);
});

test('buildMoodboardPrompt forbids prices and lists real makes', () => {
  const p = buildMoodboardPrompt({ space: { name: 'Kitchen', kind: 'kitchen' }, quality: 'standard', theme: { directions: ['Japandi'] } });
  assert.match(p, /NEVER include prices/);
  assert.match(p, /Hettich|Asian Paints|Jaquar/);
  assert.match(p, /Kitchen/);
});
