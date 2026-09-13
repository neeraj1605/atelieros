/* ============================================================
   Metric Spatial Contract — canonical types (v1.0)
   Millimetre cartesian. Single source of truth shared by the
   measurement (Python), design/estimation (Next.js) and execution
   (Web/Three.js) tiers. Mirrors
   spatial/contract/metric-spatial-contract.schema.json
   ============================================================ */

export const CONTRACT_VERSION = '1.0' as const;
export const COORDINATE_SYSTEM = 'EPSG:Metric_Cartesian_MM' as const;

/** [x, y] in millimetres. */
export type PointMm = [number, number];

/** Planar ring of points. Implicitly closed; an explicit repeat of the first point is tolerated. */
export type PolygonMm = PointMm[];

export type SourceKind =
  | 'photos'
  | 'video'
  | 'blueprint_pdf'
  | 'blueprint_dwg'
  | 'blueprint_image'
  | 'manual';

export type OpeningType = 'door' | 'window' | 'opening' | 'arch' | 'balcony_slider';

export type MeasuredBy =
  | 'metric3d_v2'
  | 'droid_slam'
  | 'metric3d_v2+droid_slam'
  | 'polyworld'
  | 'layoutformer_pp'
  | 'manual'
  | 'hybrid';

export interface Opening {
  id?: string;
  type: OpeningType;
  /** Point on the room boundary where the opening starts, following the polygon winding. */
  start_mm: PointMm;
  width_mm: number;
  height_mm: number;
  /** Sill height above floor. Doors are 0. */
  sill_mm?: number;
  sill_height_mm?: number;
  /** Index into the perimeter polygon edges; -1 if not edge-indexed. */
  wall_index?: number;
  /** Offset along the wall (positive = along wall direction). */
  offset_mm?: number;
  swing_deg?: number;
  confidence?: number;
}

export interface Room {
  id: string;
  name?: string;
  level?: number;
  /** Planex room kind: living, dining, kitchen, bedroom, kids, guest, study, bath, foyer, pooja, balcony, utility, other. */
  kind?: string;
  boundary_polygon: PolygonMm;
  ceiling_height_mm: number;
  floor_elevation_mm?: number;
  openings?: Opening[];
  confidence?: number;
  wall_thickness_ext_mm?: number;
  wall_thickness_int_mm?: number;
}

export interface Wall {
  id: string;
  start_mm: PointMm;
  end_mm: PointMm;
  thickness_mm: number;
  height_mm?: number;
  room_ids?: string[];
}

export interface ModelRef {
  name: string;
  version: string;
  weights_sha256?: string;
  [k: string]: unknown;
}

export interface Provenance {
  measured_by: MeasuredBy;
  models?: ModelRef[];
  confidence?: number;
  created_at?: string;
  notes?: string;
}

export interface ContractSource {
  kind: SourceKind;
  uri?: string;
  captured_at?: string;
  device?: string;
}

export interface SceneMeta {
  origin?: string;
  gravity?: [number, number, number];
  /** Column-major 4x4 transform from model space to EPSG:Metric_Cartesian_MM. */
  transform?: number[];
  [k: string]: unknown;
}

export interface MetricSpatialContract {
  contract_version: typeof CONTRACT_VERSION;
  coordinate_system: typeof COORDINATE_SYSTEM;
  units: { length: 'mm'; angle: 'deg' };
  source: ContractSource;
  provenance: Provenance;
  scene?: SceneMeta;
  rooms: Room[];
  walls?: Wall[];
}

export interface NewContractOptions {
  source: ContractSource;
  provenance: Provenance;
  rooms?: Room[];
  scene?: SceneMeta;
  walls?: Wall[];
}

/** Build a contract with the mandatory envelope filled in. */
export function newContract(opts: NewContractOptions): MetricSpatialContract {
  const c: MetricSpatialContract = {
    contract_version: CONTRACT_VERSION,
    coordinate_system: COORDINATE_SYSTEM,
    units: { length: 'mm', angle: 'deg' },
    source: opts.source,
    provenance: Object.assign({ created_at: new Date().toISOString() }, opts.provenance),
    rooms: opts.rooms ?? []
  };
  if (opts.scene) c.scene = opts.scene;
  if (opts.walls) c.walls = opts.walls;
  return c;
}

const SLUG = /[^a-z0-9]+/g;
export function roomId(name: string): string {
  const base = String(name || 'room').toLowerCase().replace(SLUG, '_').replace(/^_+|_+$/g, '');
  return 'room_' + (base || 'unnamed');
}
