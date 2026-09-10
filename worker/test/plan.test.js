import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRooms, buildRoomsPrompt } from '../src/plan.js';

test('normalizeRooms accepts valid rooms and assigns ids', () => {
  const out = normalizeRooms({
    rooms: [
      { name: 'Living Room', lengthM: 5.4, widthM: 3.9, confidence: 'high' },
      { name: 'Master Bedroom', lengthM: 4.5, widthM: 3.6 }
    ]
  });
  assert.ok(out);
  assert.equal(out.rooms.length, 2);
  assert.equal(out.rooms[0].id, 'room-living-room');
  assert.equal(out.rooms[0].confidence, 'high');
  assert.equal(out.rooms[1].confidence, 'low');
  assert.equal(out.rooms[1].source, 'ai-plan');
});

test('normalizeRooms rejects bad dimensions and duplicates', () => {
  const out = normalizeRooms({
    rooms: [
      { name: 'Kitchen', lengthM: 0, widthM: 3 },
      { name: 'Kitchen', lengthM: 99, widthM: 3 },
      { name: 'Living Room', lengthM: 5, widthM: 4 },
      { name: 'living room', lengthM: 6, widthM: 4 }
    ]
  });
  assert.ok(out);
  assert.equal(out.rooms.length, 1);
  assert.equal(out.rooms[0].name, 'Living Room');
});

test('normalizeRooms rejects empty / invalid payloads', () => {
  assert.equal(normalizeRooms(null), null);
  assert.equal(normalizeRooms({}), null);
  assert.equal(normalizeRooms({ rooms: [] }), null);
  assert.equal(normalizeRooms({ rooms: [{ name: '', lengthM: 4, widthM: 3 }] }), null);
});

test('buildRoomsPrompt includes the instruction and plan cue', () => {
  const p = buildRoomsPrompt({ project: { spaceType: '3BHK' } }, true);
  assert.match(p, /floor plan/i);
  assert.match(p, /length and width in metres/i);
  assert.match(p, /3BHK/);
});
