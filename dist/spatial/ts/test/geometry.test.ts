import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  area, perimeter, centroid, bbox, wallRuns, edges, edgeContaining,
  distancePointToSegment, isPointOnBoundary, pointInPolygon,
  segmentsIntersect, selfIntersects, normalizeRing, dedupeConsecutive,
  hasConsecutiveDuplicates, dropClosingPoint, pointsEqual, isFinitePoint,
  BOUNDARY_TOL_MM
} from '../src/geometry.ts';
import type { PointMm, PolygonMm } from '../src/contract.ts';

describe('geometry.ts', () => {
  const square: PolygonMm = [[0, 0], [100, 0], [100, 100], [0, 100]];
  const squareClosed: PolygonMm = [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]];
  const triangle: PolygonMm = [[0, 0], [4, 0], [2, 3]];

  describe('isFinitePoint()', () => {
    it('should accept valid [x, y] points', () => {
      assert.equal(isFinitePoint([1, 2]), true);
      assert.equal(isFinitePoint([0, 0]), true);
      assert.equal(isFinitePoint([-5, 3.2]), true);
    });

    it('should reject invalid values', () => {
      assert.equal(isFinitePoint([1]), false);
      assert.equal(isFinitePoint([1, 'a']), false);
      assert.equal(isFinitePoint('not a point'), false);
      assert.equal(isFinitePoint(null), false);
      assert.equal(isFinitePoint([NaN, 1]), false);
      assert.equal(isFinitePoint([Infinity, 1]), false);
    });
  });

  describe('pointsEqual()', () => {
    it('should compare points with tolerance', () => {
      assert.equal(pointsEqual([0, 0], [0, 0]), true);
      assert.equal(pointsEqual([0, 0], [1, 1], 1), true);
      assert.equal(pointsEqual([0, 0], [1, 1], 0), false);
    });
  });

  describe('dropClosingPoint()', () => {
    it('should remove explicit closing point when duplicate', () => {
      const result = dropClosingPoint(squareClosed);
      assert.equal(result.length, 4);
    });

    it('should return polygon unchanged when no closing point', () => {
      const result = dropClosingPoint(square);
      assert.equal(result.length, 4);
    });
  });

  describe('hasConsecutiveDuplicates()', () => {
    it('should detect consecutive duplicates', () => {
      assert.equal(hasConsecutiveDuplicates([[0, 0], [0, 0], [1, 1], [2, 2]]), true);
    });

    it('should return false for clean polygons', () => {
      assert.equal(hasConsecutiveDuplicates(square), false);
    });
  });

  describe('dedupeConsecutive()', () => {
    it('should remove consecutive duplicates', () => {
      const result = dedupeConsecutive([[0, 0], [0, 0], [1, 1], [1, 1], [2, 2]]);
      assert.deepEqual(result, [[0, 0], [1, 1], [2, 2]]);
    });
  });

  describe('area()', () => {
    it('should compute area of a square', () => {
      assert.equal(area(square), 10000);
    });

    it('should compute area of a triangle', () => {
      assert.equal(area(triangle), 6);
    });

    it('should handle closed polygons with implicit closure', () => {
      assert.equal(area(squareClosed), 10000);
    });

    it('should return 0 for degenerate polygons', () => {
      assert.equal(area([[0, 0], [0, 0], [0, 0]]), 0);
    });
  });

  describe('perimeter()', () => {
    it('should compute perimeter of a square', () => {
      assert.equal(perimeter(square), 400);
    });

    it('should compute perimeter of a triangle', () => {
      const p = perimeter(triangle);
      const expected = 4 + 2 * Math.sqrt(13);
      assert.ok(Math.abs(p - expected) < 0.0001);
    });
  });

  describe('centroid()', () => {
    it('should compute centroid of a square', () => {
      const c = centroid(square);
      assert.equal(c[0], 50);
      assert.equal(c[1], 50);
    });

    it('should compute centroid of a triangle', () => {
      const c = centroid(triangle);
      assert.equal(c[0], 2);
      assert.equal(c[1], 1);
    });

    it('should fall back to mean for degenerate polygon', () => {
      const c = centroid([[0, 0], [0, 0], [0, 0]]);
      assert.equal(c[0], 0);
      assert.equal(c[1], 0);
    });
  });

  describe('bbox()', () => {
    it('should compute bounding box', () => {
      const b = bbox(square);
      assert.deepEqual(b.min, [0, 0]);
      assert.deepEqual(b.max, [100, 100]);
      assert.equal(b.width, 100);
      assert.equal(b.height, 100);
    });
  });

  describe('wallRuns()', () => {
    it('should return edge lengths', () => {
      const runs = wallRuns(square);
      assert.equal(runs.length, 4);
      assert.equal(runs[0], 100);
    });
  });

  describe('edges()', () => {
    it('should return edge objects', () => {
      const e = edges(square);
      assert.equal(e.length, 4);
      assert.deepEqual(e[0].a, [0, 0]);
      assert.deepEqual(e[0].b, [100, 0]);
      assert.equal(e[0].length, 100);
    });
  });

  describe('distancePointToSegment()', () => {
    it('should compute distance to segment endpoint', () => {
      const dist = distancePointToSegment([0, 0], [0, 0], [100, 0]);
      assert.equal(dist, 0);
    });

    it('should compute perpendicular distance', () => {
      const dist = distancePointToSegment([50, 50], [0, 0], [100, 0]);
      assert.equal(dist, 50);
    });

    it('should handle point beyond segment (clamped)', () => {
      const dist = distancePointToSegment([150, 0], [0, 0], [100, 0]);
      assert.equal(dist, 50);
    });

    it('should handle degenerate segment', () => {
      const dist = distancePointToSegment([10, 10], [0, 0], [0, 0]);
      assert.equal(dist, Math.sqrt(200));
    });
  });

  describe('isPointOnBoundary()', () => {
    it('should detect points on boundary', () => {
      assert.equal(isPointOnBoundary(square, [50, 0]), true);
      assert.equal(isPointOnBoundary(square, [0, 50]), true);
    });

    it('should reject points outside boundary', () => {
      assert.equal(isPointOnBoundary(square, [200, 200]), false);
      assert.equal(isPointOnBoundary(square, [50, 50]), false);
    });
  });

  describe('pointInPolygon()', () => {
    it('should detect interior points', () => {
      assert.equal(pointInPolygon(square, [50, 50]), true);
      assert.equal(pointInPolygon(square, [1, 1]), true);
    });

    it('should reject exterior points', () => {
      assert.equal(pointInPolygon(square, [200, 200]), false);
      assert.equal(pointInPolygon(square, [-1, -1]), false);
    });
  });

  describe('segmentsIntersect()', () => {
    it('should detect intersecting segments', () => {
      assert.equal(segmentsIntersect([0, 0], [10, 10], [0, 10], [10, 0]), true);
    });

    it('should detect non-intersecting segments', () => {
      assert.equal(segmentsIntersect([0, 0], [0, 10], [10, 0], [10, 10]), false);
    });
  });

  describe('selfIntersects()', () => {
    it('should detect self-intersecting polygon', () => {
      const bowtie: PolygonMm = [[0, 0], [10, 10], [10, 0], [0, 10]];
      assert.equal(selfIntersects(bowtie), true);
    });

    it('should return false for clean polygon', () => {
      assert.equal(selfIntersects(square), false);
    });
  });

  describe('normalizeRing()', () => {
    it('should close ring implicitly', () => {
      const n = normalizeRing(square);
      assert.equal(n.length, 4);
    });

    it('should produce CCW winding by default', () => {
      const cw: PolygonMm = [[0, 0], [0, 10], [10, 10], [10, 0]];
      const n = normalizeRing(cw);
      assert.ok(n.length === 4);
    });
  });

  describe('edgeContaining()', () => {
    it('should find edge containing a point', () => {
      const hit = edgeContaining(square, [50, 0]);
      assert.ok(hit);
      assert.equal(hit.distAlong, 50);
      assert.equal(hit.edgeLength, 100);
      assert.equal(hit.remaining, 50);
    });

    it('should return null for point not on boundary', () => {
      assert.equal(edgeContaining(square, [50, 50]), null);
    });
  });

  describe('BOUNDARY_TOL_MM constant', () => {
    it('should be 2 (millimetre tolerance)', () => {
      assert.equal(BOUNDARY_TOL_MM, 2);
    });
  });
});
