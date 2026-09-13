/* ============================================================
   Geometry kernel (pure TypeScript)
   Millimetre planar geometry used by the contract validator and by
   every tier. This module is the reference implementation; the WASM
   kernel (spatial/cpp) must produce identical results, and
   kernel.ts selects between them.
   ============================================================ */
import type { PointMm, PolygonMm } from './contract.ts';

export const BOUNDARY_TOL_MM = 2;

export function isFinitePoint(p: unknown): p is PointMm {
  return Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);
}

export function pointsEqual(a: PointMm, b: PointMm, tol = 0): boolean {
  return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol;
}

/** Drop an explicit closing point (first == last) so the ring is implicitly closed. */
export function dropClosingPoint(poly: PolygonMm): PolygonMm {
  if (poly.length > 1 && pointsEqual(poly[0], poly[poly.length - 1], BOUNDARY_TOL_MM)) {
    return poly.slice(0, -1);
  }
  return poly.slice();
}

export function hasConsecutiveDuplicates(poly: PolygonMm, tol = 0): boolean {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (pointsEqual(a, b, tol)) return true;
  }
  return false;
}

export function dedupeConsecutive(poly: PolygonMm, tol = 0): PolygonMm {
  const out: PointMm[] = [];
  for (const p of poly) {
    if (!out.length || !pointsEqual(out[out.length - 1], p, tol)) out.push(p);
  }
  while (out.length > 1 && pointsEqual(out[0], out[out.length - 1], tol)) out.pop();
  return out;
}

/** Shoelace signed area. Positive = counter-clockwise in a Y-up frame. */
export function signedArea(poly: PolygonMm): number {
  const p = dropClosingPoint(poly);
  let sum = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

export function area(poly: PolygonMm): number {
  return Math.abs(signedArea(poly));
}

export function perimeter(poly: PolygonMm): number {
  const p = dropClosingPoint(poly);
  let total = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

export function centroid(poly: PolygonMm): PointMm {
  const p = dropClosingPoint(poly);
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[i];
    const r = p[(i + 1) % p.length];
    const cross = q[0] * r[1] - r[0] * q[1];
    a += cross;
    cx += (q[0] + r[0]) * cross;
    cy += (q[1] + r[1]) * cross;
  }
  if (Math.abs(a) < 1e-9) {
    // Degenerate: fall back to the mean of vertices.
    return [p.reduce((s, v) => s + v[0], 0) / p.length, p.reduce((s, v) => s + v[1], 0) / p.length];
  }
  a *= 0.5;
  return [cx / (6 * a), cy / (6 * a)];
}

export function bbox(poly: PolygonMm): { min: PointMm; max: PointMm; width: number; height: number } {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const min: PointMm = [Math.min(...xs), Math.min(...ys)];
  const max: PointMm = [Math.max(...xs), Math.max(...ys)];
  return { min, max, width: max[0] - min[0], height: max[1] - min[1] };
}

export interface Edge { index: number; a: PointMm; b: PointMm; length: number; }

export function edges(poly: PolygonMm): Edge[] {
  const p = dropClosingPoint(poly);
  const out: Edge[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    out.push({ index: i, a, b, length: Math.hypot(b[0] - a[0], b[1] - a[1]) });
  }
  return out;
}

export function distancePointToSegment(p: PointMm, a: PointMm, b: PointMm): number {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const wx = p[0] - a[0], wy = p[1] - a[1];
  const len2 = vx * vx + vy * vy;
  if (len2 === 0) return Math.hypot(wx, wy);
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
}

export function isPointOnBoundary(poly: PolygonMm, p: PointMm, tol = BOUNDARY_TOL_MM): boolean {
  return edges(poly).some((e) => distancePointToSegment(p, e.a, e.b) <= tol);
}

export function pointInPolygon(poly: PolygonMm, p: PointMm): boolean {
  const ring = dropClosingPoint(poly);
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = (yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function orientation(a: PointMm, b: PointMm, c: PointMm): number {
  const v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(v) < 1e-9) return 0;
  return v > 0 ? 1 : 2;
}

function onSegment(a: PointMm, b: PointMm, c: PointMm): boolean {
  return b[0] <= Math.max(a[0], c[0]) + 1e-9 && b[0] >= Math.min(a[0], c[0]) - 1e-9 &&
    b[1] <= Math.max(a[1], c[1]) + 1e-9 && b[1] >= Math.min(a[1], c[1]) - 1e-9;
}

/** Proper intersection test, treating collinear overlap as intersecting. */
export function segmentsIntersect(p1: PointMm, q1: PointMm, p2: PointMm, q2: PointMm): boolean {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  return false;
}

/** True when any two non-adjacent edges cross (self-intersecting ring). */
export function selfIntersects(poly: PolygonMm): boolean {
  const e = edges(poly);
  for (let i = 0; i < e.length; i++) {
    for (let j = i + 1; j < e.length; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === e.length - 1);
      if (adjacent) continue;
      if (segmentsIntersect(e[i].a, e[i].b, e[j].a, e[j].b)) return true;
    }
  }
  return false;
}

export function isCollinear(a: PointMm, b: PointMm, c: PointMm): boolean {
  return orientation(a, b, c) === 0;
}

export function removeCollinear(poly: PolygonMm): PolygonMm {
  const p = dedupeConsecutive(dropClosingPoint(poly));
  if (p.length <= 3) return p;
  const out: PointMm[] = [];
  for (let i = 0; i < p.length; i++) {
    const prev = p[(i - 1 + p.length) % p.length];
    const cur = p[i];
    const next = p[(i + 1) % p.length];
    if (!isCollinear(prev, cur, next)) out.push(cur);
  }
  return out.length >= 3 ? out : p;
}

/** Normalize a ring: implicit closure, no consecutive duplicates, positive (CCW) winding. */
export function normalizeRing(poly: PolygonMm, clockwise = false): PolygonMm {
  let p = dedupeConsecutive(dropClosingPoint(poly));
  const ccw = signedArea(p) >= 0;
  if (ccw === clockwise) p = p.slice().reverse();
  return p;
}

/** Vertical wall runs (XZ plan lengths) derived from a room polygon. */
export function wallRuns(poly: PolygonMm): number[] {
  return edges(poly).map((e) => e.length);
}

export interface EdgeHit { edgeIndex: number; distAlong: number; edgeLength: number; remaining: number; }

/** Locate the boundary edge containing p and how far along it p sits. */
export function edgeContaining(poly: PolygonMm, p: PointMm, tol = BOUNDARY_TOL_MM): EdgeHit | null {
  const e = edges(poly);
  for (const edge of e) {
    if (distancePointToSegment(p, edge.a, edge.b) <= tol) {
      const distAlong = Math.hypot(p[0] - edge.a[0], p[1] - edge.a[1]);
      return { edgeIndex: edge.index, distAlong, edgeLength: edge.length, remaining: edge.length - distAlong };
    }
  }
  return null;
}
