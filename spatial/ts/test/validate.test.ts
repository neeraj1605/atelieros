import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateContract, assertValidContract } from '../src/validate.ts';
import { newContract } from '../src/contract.ts';
import type { MetricSpatialContract } from '../src/contract.ts';

describe('validate.ts', () => {
  function makeValidContract(overrides: Partial<MetricSpatialContract> = {}): MetricSpatialContract {
    return newContract({
      source: { kind: 'photos', captured_at: '2024-01-15T10:00:00Z' },
      provenance: {
        measured_by: 'metric3d_v2',
        confidence: 0.92,
        models: [{ name: 'Metric-3D-v2', version: '1.0' }],
      },
      rooms: [
        {
          id: 'room_living',
          name: 'Living Room',
          boundary_polygon: [
            [0, 0], [5000, 0], [5000, 4000], [0, 4000]
          ],
          ceiling_height_mm: 2700,
          floor_elevation_mm: 0,
          openings: [
            {
              type: 'door',
              start_mm: [0, 2000],
              width_mm: 900,
              height_mm: 2100,
              sill_mm: 0,
              confidence: 0.9,
            },
            {
              type: 'window',
              start_mm: [3000, 0],
              width_mm: 1500,
              height_mm: 1200,
              sill_mm: 900,
              confidence: 0.85,
            }
          ],
          confidence: 0.95,
        }
      ],
    });
  }

  describe('valid contract', () => {
    it('should pass validation for a well-formed contract', () => {
      const c = makeValidContract();
      const result = validateContract(c);
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
      assert.equal(result.stats.rooms, 1);
      assert.equal(result.stats.openings, 2);
      assert.ok(result.stats.area_mm2 > 0);
    });
  });

  describe('error codes', () => {
    it('should reject non-objects', () => {
      const result = validateContract('not an object');
      assert.equal(result.valid, false);
      assert.equal(result.errors[0].code, 'E_NOT_OBJECT');
    });

    it('should reject wrong contract version', () => {
      const c = makeValidContract();
      c.contract_version = '0.9';
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_VERSION');
    });

    it('should reject wrong coordinate system', () => {
      const c = makeValidContract();
      c.coordinate_system = 'WGS84';
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_COORDINATE_SYSTEM');
    });

    it('should reject wrong units', () => {
      const c = makeValidContract();
      c.units = { length: 'm', angle: 'deg' };
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_UNITS');
    });

    it('should require source.kind', () => {
      const c = makeValidContract();
      c.source = {} as never;
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_SOURCE');
    });

    it('should require provenance.measured_by', () => {
      const c = makeValidContract();
      c.provenance = { measured_by: undefined } as never;
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_PROVENANCE');
    });

    it('should require at least one room', () => {
      const c = makeValidContract();
      c.rooms = [];
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_NO_ROOMS');
    });

    it('should validate room id format', () => {
      const c = makeValidContract();
      c.rooms[0].id = 'Invalid Room ID!';
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_ROOM_ID');
    });

    it('should detect duplicate room ids', () => {
      const c = makeValidContract();
      c.rooms[0].id = 'room_dup';
      c.rooms.push({
        id: 'room_dup',
        boundary_polygon: [[10000, 0], [11000, 0], [11000, 1000], [10000, 1000]],
        ceiling_height_mm: 2500,
      });
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_DUP_ROOM');
    });

    it('should require minimum polygon points', () => {
      const c = makeValidContract();
      c.rooms[0].boundary_polygon = [[0, 0], [100, 0]];
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_RING_MIN_POINTS');
    });

    it('should detect zero-area polygons', () => {
      const c = makeValidContract();
      c.rooms[0].boundary_polygon = [[0, 0], [100, 0], [200, 0]];
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_RING_AREA');
    });

    it('should detect self-intersecting polygons', () => {
      const c = makeValidContract();
      c.rooms[0].boundary_polygon = [[0, 0], [4000, 4000], [4000, 0], [0, 4000]];
      const result = validateContract(c);
      assert.ok(result.errors.some(e => e.code === 'E_RING_SELF_INTERSECTS'));
    });

    it('should require positive ceiling height', () => {
      const c = makeValidContract();
      c.rooms[0].ceiling_height_mm = -100;
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_CEILING_HEIGHT');
    });

    it('should validate opening types', () => {
      const c = makeValidContract();
      c.rooms[0].openings![0].type = 'window_invalid' as never;
      const result = validateContract(c);
      assert.equal(result.errors.find(e => e.code === 'E_OPENING_TYPE')?.code, 'E_OPENING_TYPE');
    });

    it('should require positive opening dimensions', () => {
      const c = makeValidContract();
      c.rooms[0].openings![0].width_mm = 0;
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_OPENING_DIMS');
    });

    it('should require door sill to be 0', () => {
      const c = makeValidContract();
      c.rooms[0].openings![0].sill_mm = 500;
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_DOOR_SILL');
    });

    it('should reject openings off boundary', () => {
      const c = makeValidContract();
      c.rooms[0].openings![0].start_mm = [2000, 2000];
      const result = validateContract(c);
      assert.equal(result.errors[0].code, 'E_OPENING_OFF_BOUNDARY');
    });

    it('should reject openings wider than wall run', () => {
      const c = makeValidContract();
      c.rooms[0].openings![0].type = 'window';
      c.rooms[0].openings![0].start_mm = [500, 4000];
      c.rooms[0].openings![0].sill_mm = 900;
      c.rooms[0].openings![0].width_mm = 10000;
      const result = validateContract(c);
      assert.equal(result.errors.find(e => e.code === 'E_OPENING_WIDTH')?.code, 'E_OPENING_WIDTH');
    });
  });

  describe('warnings', () => {
    it('should warn about missing confidence', () => {
      const c = makeValidContract();
      delete c.provenance.confidence;
      const result = validateContract(c);
      const warning = result.warnings.find((w) => w.code === 'W_NO_CONFIDENCE');
      assert.ok(warning);
    });

    it('should warn about low room confidence', () => {
      const c = makeValidContract();
      c.rooms[0].confidence = 0.3;
      const result = validateContract(c);
      const warning = result.warnings.find((w) => w.code === 'W_LOW_CONFIDENCE');
      assert.ok(warning);
    });

    it('should warn about opening near corner', () => {
      const c = makeValidContract();
      c.rooms[0].openings![0].start_mm = [100, 0];
      c.rooms[0].openings![0].width_mm = 4850;
      const result = validateContract(c);
      const warning = result.warnings.find((w) => w.code === 'W_OPENING_NEAR_CORNER');
      assert.ok(warning);
    });
  });

  describe('assertValidContract()', () => {
    it('should throw on invalid contract', () => {
      assert.throws(() => assertValidContract({}), /Invalid Metric Spatial Contract/);
    });

    it('should return the contract when valid', () => {
      const c = makeValidContract();
      const result = assertValidContract(c);
      assert.equal(result, c);
    });
  });
});
