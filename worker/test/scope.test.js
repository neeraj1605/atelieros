import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScope, buildScopePrompt, SCOPE_CATEGORIES, ROOM_TYPES } from '../src/scope.js';

test('taxonomy has the expected work packages and rooms', () => {
  const names = SCOPE_CATEGORIES.map((c) => c.name);
  for (const required of ['Flooring', 'Painting & Polishing', 'Electrical & Wiring', 'Plumbing & Sanitary (WC)', 'False Ceiling', 'Lighting', 'Civil & Masonry', 'Kitchen Systems']) {
    assert.ok(names.includes(required), required);
  }
  assert.ok(names.length >= 20);
  assert.ok(ROOM_TYPES.includes('Living Room'));
});

test('normalizeScope accepts a valid payload and assigns ids', () => {
  const scope = normalizeScope({
    rooms: [
      {
        name: 'Living Room',
        type: 'living',
        categories: [
          { name: 'Flooring', items: [{ name: 'Vitrified tiles 600x600', unit: 'sqft', qty: 230, note: 'incl wastage' }] },
          { name: 'Painting & Polishing', items: [{ name: 'Interior emulsion', unit: 'sqft', qty: 600 }] }
        ]
      }
    ]
  });
  assert.ok(scope);
  assert.equal(scope.rooms.length, 1);
  assert.equal(scope.rooms[0].id, 'living-room');
  assert.equal(scope.rooms[0].categories.length, 2);
  assert.equal(scope.rooms[0].categories[0].items[0].unit, 'sqft');
  assert.equal(scope.rooms[0].categories[0].items[0].included, true);
  assert.equal(scope.rooms[0].categories[0].known, true);
});

test('normalizeScope rejects empty/invalid payloads', () => {
  assert.equal(normalizeScope(null), null);
  assert.equal(normalizeScope('x'), null);
  assert.equal(normalizeScope({}), null);
  assert.equal(normalizeScope({ rooms: [] }), null);
  assert.equal(normalizeScope({ rooms: [{ name: '', categories: [] }] }), null);
  assert.equal(normalizeScope({ rooms: [{ name: 'Room', categories: [] }] }), null);
});

test('normalizeScope makes duplicate room ids unique', () => {
  const scope = normalizeScope({
    rooms: [
      { name: 'Bedroom', categories: [{ name: 'Flooring', items: [{ name: 'Laminate', unit: 'sqft', qty: 100 }] }] },
      { name: 'Bedroom', categories: [{ name: 'Flooring', items: [{ name: 'Laminate', unit: 'sqft', qty: 120 }] }] }
    ]
  });
  assert.ok(scope);
  assert.equal(scope.rooms.length, 2);
  assert.notEqual(scope.rooms[0].id, scope.rooms[1].id);
});

test('normalizeScope clamps unknown units and bad quantities', () => {
  const scope = normalizeScope({
    rooms: [{ name: 'Kitchen', categories: [{ name: 'Kitchen Systems', items: [
      { name: 'Base units', unit: 'weird', qty: -5 },
      { name: 'Sink', unit: 'nos', qty: '3' }
    ] }] }]
  });
  assert.ok(scope);
  const items = scope.rooms[0].categories[0].items;
  assert.equal(items[0].unit, 'weird'); // preserved but qty defaulted
  assert.equal(items[0].qty, 1);
  assert.equal(items[1].qty, 3);
});

test('buildScopePrompt includes rooms and forbids prices', () => {
  const prompt = buildScopePrompt(
    { project: { spaceType: '3BHK' } },
    { rooms: [{ name: 'Living Room', lengthM: 5.4, widthM: 3.9 }] },
    true
  );
  assert.match(prompt, /Living Room/);
  assert.match(prompt, /5\.4 x 3\.9/);
  assert.match(prompt, /NEVER include prices/);
  assert.match(prompt, /floor plan/i);
});
