/* ============================================================
   Metric Spatial Contract — validator
   Dependency-free structural + geometric validation. Every tier
   (Python service, Next.js client, Three.js viewer) must accept a
   contract only when validateContract().valid is true.
   ============================================================ */
import {
  CONTRACT_VERSION, COORDINATE_SYSTEM,
  type MetricSpatialContract, type Room, type Opening, type PolygonMm
} from './contract.ts';
import {
  area, dropClosingPoint, hasConsecutiveDuplicates, isPointOnBoundary,
  edgeContaining, selfIntersects, normalizeRing, perimeter, BOUNDARY_TOL_MM
} from './geometry.ts';

export type ErrorCode =
  | 'E_NOT_OBJECT'
  | 'E_VERSION'
  | 'E_COORDINATE_SYSTEM'
  | 'E_UNITS'
  | 'E_SOURCE'
  | 'E_PROVENANCE'
  | 'E_NO_ROOMS'
  | 'E_ROOM_ID'
  | 'E_DUP_ROOM'
  | 'E_RING_MIN_POINTS'
  | 'E_RING_DUPLICATE'
  | 'E_RING_AREA'
  | 'E_RING_SELF_INTERSECTS'
  | 'E_POINT_FORMAT'
  | 'E_CEILING_HEIGHT'
  | 'E_FLOOR_ELEVATION'
  | 'E_OPENING_TYPE'
  | 'E_OPENING_DIMS'
  | 'E_OPENING_SILL'
  | 'E_DOOR_SILL'
  | 'E_OPENING_OFF_BOUNDARY'
  | 'E_OPENING_WIDTH';

export type WarningCode =
  | 'W_RING_COLLINEAR'
  | 'W_OPENING_NEAR_CORNER'
  | 'W_OPENING_EXCEEDS_EDGE'
  | 'W_LOW_CONFIDENCE'
  | 'W_NO_CONFIDENCE';

export interface Issue<C extends string> { code: C; path: string; message: string; value?: unknown; }
export interface ValidationResult {
  valid: boolean;
  errors: Issue<ErrorCode>[];
  warnings: Issue<WarningCode>[];
  stats?: { rooms: number; area_mm2: number; openings: number };
}

const ROOM_ID = /^[a-z0-9][a-z0-9_-]*$/;
const OPENING_TYPES = ['door', 'window', 'opening', 'arch'];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isInt(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v) && Math.round(v) === v;
}
function isFiniteNumber(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v);
}
function pointsWellFormed(poly: unknown): boolean {
  return Array.isArray(poly) && poly.every((p) => Array.isArray(p) && p.length === 2 && isFiniteNumber(p[0]) && isFiniteNumber(p[1]));
}

export function validateContract(input: unknown): ValidationResult {
  const errors: Issue<ErrorCode>[] = [];
  const warnings: Issue<WarningCode>[] = [];
  const err = (code: ErrorCode, path: string, message: string, value?: unknown) => errors.push({ code, path, message, value });
  const warn = (code: WarningCode, path: string, message: string, value?: unknown) => warnings.push({ code, path, message, value });

  if (!isObject(input)) {
    return { valid: false, errors: [{ code: 'E_NOT_OBJECT', path: '$', message: 'Contract must be an object.' }], warnings };
  }
  const c = input as unknown as MetricSpatialContract;

  if (c.contract_version !== CONTRACT_VERSION) err('E_VERSION', '$.contract_version', `Expected "${CONTRACT_VERSION}".`, c.contract_version);
  if (c.coordinate_system !== COORDINATE_SYSTEM) err('E_COORDINATE_SYSTEM', '$.coordinate_system', `Expected "${COORDINATE_SYSTEM}".`, c.coordinate_system);

  if (!isObject(c.units) || c.units.length !== 'mm' || c.units.angle !== 'deg') {
    err('E_UNITS', '$.units', 'units must be { length: "mm", angle: "deg" }.', c.units);
  }
  if (!isObject(c.source) || typeof c.source.kind !== 'string') {
    err('E_SOURCE', '$.source', 'source.kind is required.');
  }
  if (!isObject(c.provenance) || typeof c.provenance.measured_by !== 'string') {
    err('E_PROVENANCE', '$.provenance', 'provenance.measured_by is required.');
  } else if (c.provenance.confidence === undefined) {
    warn('W_NO_CONFIDENCE', '$.provenance.confidence', 'No measurement confidence supplied.');
  }

  if (!Array.isArray(c.rooms) || c.rooms.length === 0) {
    err('E_NO_ROOMS', '$.rooms', 'At least one room is required.');
    return { valid: errors.length === 0, errors, warnings };
  }

  const seen = new Map<string, number>();
  let totalArea = 0;
  let openingCount = 0;

  c.rooms.forEach((room: Room, ri) => {
    const rp = `$.rooms[${ri}]`;
    if (!isObject(room)) { err('E_RING_MIN_POINTS', rp, 'Room must be an object.'); return; }

    if (typeof room.id !== 'string' || !ROOM_ID.test(room.id)) {
      err('E_ROOM_ID', `${rp}.id`, 'Room id must match ^[a-z0-9][a-z0-9_-]*$.', room.id);
    } else if (seen.has(room.id)) {
      err('E_DUP_ROOM', `${rp}.id`, `Duplicate room id "${room.id}" (first at index ${seen.get(room.id)}).`, room.id);
    } else {
      seen.set(room.id, ri);
    }

    if (!pointsWellFormed(room.boundary_polygon)) {
      err('E_POINT_FORMAT', `${rp}.boundary_polygon`, 'Polygon must be an array of [x, y] finite numbers.');
      return;
    }
    const ring: PolygonMm = room.boundary_polygon as PolygonMm;
    const open = dropClosingPoint(ring);

    if (open.length < 3) err('E_RING_MIN_POINTS', `${rp}.boundary_polygon`, 'Polygon needs at least 3 distinct points.', open.length);
    if (hasConsecutiveDuplicates(ring, 0)) err('E_RING_DUPLICATE', `${rp}.boundary_polygon`, 'Polygon has consecutive duplicate points.');
    if (open.length >= 3) {
      const a = area(ring);
      if (a <= 0) err('E_RING_AREA', `${rp}.boundary_polygon`, 'Polygon area must be greater than zero.', a);
      if (selfIntersects(ring)) err('E_RING_SELF_INTERSECTS', `${rp}.boundary_polygon`, 'Polygon is self-intersecting.');
      totalArea += a;
      const normalized = normalizeRing(ring);
      if (perimeter(normalized) - perimeter(ring) > BOUNDARY_TOL_MM) {
        warn('W_RING_COLLINEAR', `${rp}.boundary_polygon`, 'Polygon has redundant collinear points.');
      }
    }

    if (!isInt(room.ceiling_height_mm) || room.ceiling_height_mm <= 0) {
      err('E_CEILING_HEIGHT', `${rp}.ceiling_height_mm`, 'ceiling_height_mm must be a positive integer (mm).', room.ceiling_height_mm);
    }
    if (room.floor_elevation_mm !== undefined && !isInt(room.floor_elevation_mm)) {
      err('E_FLOOR_ELEVATION', `${rp}.floor_elevation_mm`, 'floor_elevation_mm must be an integer (mm).', room.floor_elevation_mm);
    }
    if (room.confidence !== undefined && room.confidence < 0.5) {
      warn('W_LOW_CONFIDENCE', `${rp}.confidence`, 'Room confidence below 0.5 — flag for review.', room.confidence);
    }

    const openings: Opening[] = Array.isArray(room.openings) ? room.openings : [];
    openings.forEach((o, oi) => {
      const op = `${rp}.openings[${oi}]`;
      openingCount++;
      if (!OPENING_TYPES.includes(o.type)) err('E_OPENING_TYPE', `${op}.type`, `Opening type must be one of ${OPENING_TYPES.join(', ')}.`, o.type);
      if (!isInt(o.width_mm) || o.width_mm <= 0) err('E_OPENING_DIMS', `${op}.width_mm`, 'width_mm must be a positive integer.', o.width_mm);
      if (!isInt(o.height_mm) || o.height_mm <= 0) err('E_OPENING_DIMS', `${op}.height_mm`, 'height_mm must be a positive integer.', o.height_mm);
      const sill = o.sill_mm === undefined ? 0 : o.sill_mm;
      if (!isInt(sill) || sill < 0) err('E_OPENING_SILL', `${op}.sill_mm`, 'sill_mm must be an integer >= 0.', o.sill_mm);
      if (o.type === 'door' && sill !== 0) err('E_DOOR_SILL', `${op}.sill_mm`, 'Doors must have sill_mm = 0.', sill);
      if (isInt(room.ceiling_height_mm) && sill + o.height_mm > room.ceiling_height_mm) {
        err('E_OPENING_DIMS', `${op}.height_mm`, 'Opening + sill exceeds the ceiling height.', sill + o.height_mm);
      }
      if (!Array.isArray(o.start_mm) || o.start_mm.length !== 2 || !isFiniteNumber(o.start_mm[0]) || !isFiniteNumber(o.start_mm[1])) {
        err('E_POINT_FORMAT', `${op}.start_mm`, 'start_mm must be [x, y].');
        return;
      }
      if (open.length < 3) return;
      const hit = edgeContaining(ring, o.start_mm);
      if (!hit) {
        err('E_OPENING_OFF_BOUNDARY', `${op}.start_mm`, 'Opening start must lie on the room boundary.', o.start_mm);
        return;
      }
      if (isInt(o.width_mm) && o.width_mm > hit.remaining + BOUNDARY_TOL_MM) {
        err('E_OPENING_WIDTH', `${op}.width_mm`, `Opening width ${o.width_mm}mm exceeds the remaining wall run (${Math.round(hit.remaining)}mm).`, o.width_mm);
      } else if (isInt(o.width_mm) && hit.remaining - o.width_mm < 150) {
        warn('W_OPENING_NEAR_CORNER', `${op}.start_mm`, 'Opening ends within 150mm of a corner — verify against the drawings.');
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: { rooms: c.rooms.length, area_mm2: totalArea, openings: openingCount }
  };
}

export function assertValidContract(input: unknown): MetricSpatialContract {
  const res = validateContract(input);
  if (!res.valid) {
    const detail = res.errors.slice(0, 5).map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Invalid Metric Spatial Contract (${res.errors.length} error(s)) — ${detail}`);
  }
  return input as MetricSpatialContract;
}
