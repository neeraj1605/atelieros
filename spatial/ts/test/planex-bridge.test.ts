import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { layoutToContract, roomToContract, M_TO_MM } from '../src/planex-bridge.ts';
import { newContract } from '../src/contract.ts';
import { validateContract } from '../src/validate.ts';

describe('planex-bridge.ts', () => {
  const baseSource = { kind: 'manual' as const, uri: 'test://localroom' };
  const baseProvenance = {
    measured_by: 'hybrid' as const,
    confidence: 0.88,
  };

  describe('M_TO_MM constant', () => {
    it('should be 1000', () => {
      assert.equal(M_TO_MM, 1000);
    });
  });

  describe('layoutToContract()', () => {
    it('should convert meters to millimetres', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 5,
        heightM: 3,
        rooms: [{
          id: 'room_living',
          name: 'Living Room',
          x: 0,
          y: 0,
          w: 5,
          h: 3,
          ceilingHeight: 2.7,
        }],
      });

      const room = result.contract.rooms[0];
      assert.deepEqual(room.boundary_polygon, [[0, 0], [5000, 0], [5000, 3000], [0, 3000]]);
      assert.equal(room.ceiling_height_mm, 2700);
    });

    it('should use roomId() when id is not provided', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 3,
        heightM: 3,
        rooms: [{
          name: 'Kitchen',
          x: 0,
          y: 0,
          w: 3,
          h: 3,
        }],
      });

      assert.equal(result.contract.rooms[0].id, 'room_kitchen');
    });

    it('should set floor elevation from floorElevationM', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 3,
        heightM: 3,
        floorElevationM: 1.2,
        rooms: [{
          name: 'Test',
          x: 0,
          y: 0,
          w: 3,
          h: 3,
          floorElevation: 0.5,
        }],
      });

      assert.equal(result.contract.rooms[0].floor_elevation_mm, 500);
    });

    it('should convert Planex openings to contract openings', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 5,
        heightM: 3,
        rooms: [{
          name: 'Living',
          x: 0,
          y: 0,
          w: 5,
          h: 3,
          ceilingHeight: 2.7,
          openings: [
            {
              type: 'door',
              x: 0,
              y: 2,
              width: 0.9,
              height: 2.1,
              confidence: 0.9,
            },
          ],
        }],
      });

      const opening = result.contract.rooms[0].openings![0];
      assert.equal(opening.type, 'door');
      assert.deepEqual(opening.start_mm, [0, 2000]);
      assert.equal(opening.width_mm, 900);
      assert.equal(opening.height_mm, 2100);
      assert.equal(opening.sill_mm, 0);
    });

    it('should default door sill to 0', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 5,
        heightM: 3,
        rooms: [{
          name: 'Living',
          x: 0,
          y: 0,
          w: 5,
          h: 3,
          ceilingHeight: 2.7,
          openings: [
            {
              type: 'door',
              x: 1,
              y: 0,
              width: 0.8,
              height: 2.0,
            },
          ],
        }],
      });

      assert.equal(result.contract.rooms[0].openings![0].sill_mm, 0);
    });

    it('should preserve window sill height', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 5,
        heightM: 3,
        rooms: [{
          name: 'Living',
          x: 0,
          y: 0,
          w: 5,
          h: 3,
          ceilingHeight: 2.7,
          openings: [
            {
              type: 'window',
              x: 3,
              y: 0,
              width: 1.5,
              height: 1.2,
              sill: 0.9,
            },
          ],
        }],
      });

      assert.equal(result.contract.rooms[0].openings![0].sill_mm, 900);
    });

    it('should produce a valid contract', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 5,
        heightM: 3,
        rooms: [{
          name: 'Living',
          x: 0,
          y: 0,
          w: 5,
          h: 3,
          ceilingHeight: 2.7,
          openings: [
            {
              type: 'door',
              start_mm: [0, 1500],
              width: 0.9,
              height: 2.1,
            },
          ],
        }],
      });

      assert.equal(result.validation.valid, true);
      assert.equal(result.validation.stats.rooms, 1);
    });

    it('should handle multiple rooms', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 10,
        heightM: 5,
        rooms: [
          { name: 'Living', x: 0, y: 0, w: 6, h: 3, ceilingHeight: 2.7 },
          { name: 'Kitchen', x: 6, y: 0, w: 4, h: 2.5, ceilingHeight: 2.7 },
        ],
      });

      assert.equal(result.contract.rooms.length, 2);
      assert.equal(result.contract.rooms[0].id, 'room_living');
      assert.equal(result.contract.rooms[1].id, 'room_kitchen');
    });

    it('should use default ceiling height when not specified', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 3,
        heightM: 3,
        ceilingHeightM: 2.8,
        rooms: [{
          name: 'Test',
          x: 0,
          y: 0,
          w: 3,
          h: 3,
        }],
      });

      assert.equal(result.contract.rooms[0].ceiling_height_mm, 2800);
    });

    it('should pass through scene metadata', () => {
      const result = layoutToContract({
        source: baseSource,
        provenance: baseProvenance,
        widthM: 3,
        heightM: 3,
        rooms: [{ name: 'Test', x: 0, y: 0, w: 3, h: 3 }],
        scene: { origin: 'floor_0', gravity: [0, 0, -9.81] },
      });

      assert.ok(result.contract.scene);
      assert.equal(result.contract.scene!.origin, 'floor_0');
    });
  });

  describe('roomToContract()', () => {
    it('should create a contract from a single room', () => {
      const room = {
        name: 'Study',
        x: 1,
        y: 1,
        w: 2,
        h: 3,
        ceilingHeight: 2.5,
      };
      const result = roomToContract(room, baseSource, baseProvenance);

      assert.equal(result.contract.rooms.length, 1);
      assert.equal(result.contract.rooms[0].id, 'room_study');
      assert.deepEqual(result.contract.rooms[0].boundary_polygon, [[1000, 1000], [3000, 1000], [3000, 4000], [1000, 4000]]);
    });

    it('should set floor elevation from parameter', () => {
      const room = { name: 'Test', x: 0, y: 0, w: 1, h: 1 };
      const result = roomToContract(room, baseSource, baseProvenance, 0.3);

      assert.equal(result.contract.rooms[0].floor_elevation_mm, 300);
    });
  });
});
