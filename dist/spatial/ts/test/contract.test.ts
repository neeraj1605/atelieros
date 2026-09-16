import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { newContract, roomId, CONTRACT_VERSION, COORDINATE_SYSTEM } from '../src/contract.ts';

describe('contract.ts', () => {
  describe('constants', () => {
    it('should export correct contract version', () => {
      assert.equal(CONTRACT_VERSION, '1.0');
    });

    it('should export correct coordinate system', () => {
      assert.equal(COORDINATE_SYSTEM, 'EPSG:Metric_Cartesian_MM');
    });
  });

  describe('roomId()', () => {
    it('should slugify a simple room name', () => {
      assert.equal(roomId('Living Room'), 'room_living_room');
    });

    it('should handle names with special characters', () => {
      assert.equal(roomId("Kids' Room!"), 'room_kids_room');
    });

    it('should use "unnamed" fallback for falsy after slugification', () => {
      assert.equal(roomId(null as unknown as string), 'room_room');
      assert.equal(roomId(undefined as unknown as string), 'room_room');
    });

    it('should handle single character names', () => {
      assert.equal(roomId('A'), 'room_a');
    });

    it('should strip leading/trailing underscores', () => {
      assert.equal(roomId('---Bedroom---'), 'room_bedroom');
    });
  });

  describe('newContract()', () => {
    const baseSource = { kind: 'photos' as const, uri: 'https://example.com/photo.jpg' };
    const baseProvenance = {
      measured_by: 'metric3d_v2' as const,
      confidence: 0.95,
    };
    const baseRoom = {
      id: 'room_living',
      boundary_polygon: [[0, 0], [5000, 0], [5000, 4000], [0, 4000]],
      ceiling_height_mm: 2700,
    };

    it('should create a contract with mandatory envelope', () => {
      const c = newContract({
        source: baseSource,
        provenance: baseProvenance,
        rooms: [baseRoom],
      });

      assert.equal(c.contract_version, '1.0');
      assert.equal(c.coordinate_system, 'EPSG:Metric_Cartesian_MM');
      assert.deepEqual(c.units, { length: 'mm', angle: 'deg' });
      assert.equal(c.source.kind, 'photos');
      assert.ok(c.provenance.created_at, 'should set created_at');
      assert.equal(c.provenance.measured_by, 'metric3d_v2');
      assert.equal(c.rooms.length, 1);
    });

    it('should default created_at to ISO timestamp', () => {
      const c = newContract({
        source: baseSource,
        provenance: baseProvenance,
        rooms: [],
      });
      const d = new Date(c.provenance.created_at!);
      assert.ok(!isNaN(d.getTime()), 'created_at should be valid ISO');
    });

    it('should include optional scene and walls', () => {
      const c = newContract({
        source: baseSource,
        provenance: baseProvenance,
        rooms: [],
        scene: { origin: 'floor-0', transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
        walls: [{ id: 'wall_1', start_mm: [0, 0], end_mm: [5000, 0], thickness_mm: 120 }],
      });

      assert.ok(c.scene);
      assert.equal(c.scene!.origin, 'floor-0');
      assert.ok(c.walls);
      assert.equal(c.walls!.length, 1);
    });

    it('should merge user provenance without clobbering created_at if present', () => {
      const c = newContract({
        source: baseSource,
        provenance: { ...baseProvenance, created_at: '2020-01-01T00:00:00Z' },
        rooms: [],
      });
      assert.equal(c.provenance.created_at, '2020-01-01T00:00:00Z');
    });

    it('should default rooms to empty array when not provided', () => {
      const c = newContract({
        source: baseSource,
        provenance: baseProvenance,
      });
      assert.deepEqual(c.rooms, []);
    });
  });
});
