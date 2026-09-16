/* ============================================================
   Planex Spatial Contract — public API
   
   This is the entry point for the spatial contract layer.
   It exports the canonical types, geometry helpers, validator,
   kernel abstraction, and the Planex bridge.
   ============================================================ */

// Contract types and factory
export {
  CONTRACT_VERSION,
  COORDINATE_SYSTEM,
  newContract,
  roomId,
} from './contract.ts';

export type {
  PointMm,
  PolygonMm,
  Opening,
  Room,
  Wall,
  ModelRef,
  Provenance,
  ContractSource,
  SceneMeta,
  MetricSpatialContract,
  NewContractOptions,
  SourceKind,
  OpeningType,
  MeasuredBy,
} from './contract.ts';

// Geometry kernel
export {
  area,
  perimeter,
  centroid,
  bbox,
  wallRuns,
  edges,
  edgeContaining,
  distancePointToSegment,
  isPointOnBoundary,
  pointInPolygon,
  segmentsIntersect,
  selfIntersects,
  isCollinear,
  removeCollinear,
  normalizeRing,
  dedupeConsecutive,
  hasConsecutiveDuplicates,
  dropClosingPoint,
  pointsEqual,
  isFinitePoint,
  BOUNDARY_TOL_MM,
} from './geometry.ts';

export type {
  Edge,
  EdgeHit,
} from './geometry.ts';

// Validator
export {
  validateContract,
  assertValidContract,
} from './validate.ts';

export type {
  ErrorCode,
  WarningCode,
  Issue,
  ValidationResult,
} from './validate.ts';

// Kernel abstraction (WASM + TypeScript fallback)
export {
  SpatialKernel,
  createKernel,
} from './kernel.ts';

export type {
  LayoutInput,
  LayoutRoom,
  LayoutResult,
  Wall as KernelWall,
  WasmModule,
} from './kernel.ts';

// Planex bridge
export {
  layoutToContract,
  roomToContract,
  M_TO_MM,
} from './planex-bridge.ts';

export type {
  PlanexLayoutInput,
  PlanexRoom,
  PlanexOpening,
  PlanexBridgeResult,
} from './planex-bridge.ts';
