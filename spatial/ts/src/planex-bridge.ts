/* ============================================================
   Planex Bridge — converts Planex layout data into the
   Metric Spatial Contract format.
   
   Planex layouts use meters with {x, y, w, h} rectangles per room.
   The contract uses millimetres with [x,y] polygon boundaries.
   
   This bridge maps Planex's rectangular room layout to the
   contract's polygon representation, converting meters → mm.
   ============================================================ */
import type {
  MetricSpatialContract, Room, Opening, PointMm, PolygonMm,
  ContractSource, Provenance, MeasuredBy, SceneMeta
} from './contract.ts';
import { newContract, roomId } from './contract.ts';
import { validateContract, type ValidationResult } from './validate.ts';

export interface PlanexRoom {
  id?: string;
  name: string;
  kind?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ceilingHeight?: number;
  floorElevation?: number;
  confidence?: number;
  openings?: PlanexOpening[];
}

export interface PlanexOpening {
  type: 'door' | 'window' | 'opening' | 'arch';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  sill?: number;
  swing_deg?: number;
  confidence?: number;
}

export interface PlanexLayoutInput {
  source: ContractSource;
  provenance: Provenance;
  widthM: number;
  heightM: number;
  rooms: PlanexRoom[];
  floorElevationM?: number;
  ceilingHeightM?: number;
  scene?: SceneMeta;
}

export interface PlanexBridgeResult {
  contract: MetricSpatialContract;
  validation: ValidationResult;
}

const M_TO_MM = 1000;

function rectToPolygonMm(
  xM: number, yM: number, wM: number, hM: number
): PolygonMm {
  const x = Math.round(xM * M_TO_MM);
  const y = Math.round(yM * M_TO_MM);
  const w = Math.round(wM * M_TO_MM);
  const h = Math.round(hM * M_TO_MM);
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h]
  ];
}

function mapOpening(opening: PlanexOpening, roomPolygon: PolygonMm): Opening | null {
  if (!opening.type || !opening.width || !opening.height) {
    return null;
  }

  let startPoint: PointMm;

  if (opening.x !== undefined && opening.y !== undefined) {
    const x = Math.round(opening.x * M_TO_MM);
    const y = Math.round(opening.y * M_TO_MM);
    startPoint = [x, y];
  } else if (opening.x !== undefined) {
    const x = Math.round(opening.x * M_TO_MM);
    const bottom = roomPolygon.find(
      (p) => p[1] === Math.max(...roomPolygon.map((r) => r[1]))
    );
    startPoint = [x, bottom ? bottom[1] : 0];
  } else {
    const bottomLeft = roomPolygon[0];
    startPoint = [bottomLeft[0], bottomLeft[1]];
  }

  const result: Opening = {
    type: opening.type,
    start_mm: startPoint,
    width_mm: Math.round(opening.width * M_TO_MM),
    height_mm: Math.round(opening.height * M_TO_MM),
  };

  if (opening.sill !== undefined) {
    result.sill_mm = Math.round(opening.sill * M_TO_MM);
  }
  if (opening.type === 'door') {
    result.sill_mm = 0;
  }
  if (opening.swing_deg !== undefined) {
    result.swing_deg = opening.swing_deg;
  }
  if (opening.confidence !== undefined) {
    result.confidence = opening.confidence;
  }

  return result;
}

export function layoutToContract(input: PlanexLayoutInput): PlanexBridgeResult {
  const roomObjs: Room[] = input.rooms.map((r): Room => {
    const polygon = rectToPolygonMm(r.x, r.y, r.w, r.h);
    const id = r.id ?? roomId(r.name);

    const room: Room = {
      id,
      name: r.name,
      kind: r.kind,
      boundary_polygon: polygon,
      ceiling_height_mm: r.ceilingHeight
        ? Math.round(r.ceilingHeight * M_TO_MM)
        : Math.round((input.ceilingHeightM ?? 2.7) * M_TO_MM),
      floor_elevation_mm: r.floorElevation
        ? Math.round(r.floorElevation * M_TO_MM)
        : input.floorElevationM
          ? Math.round(input.floorElevationM * M_TO_MM)
          : 0,
    };

    if (r.confidence !== undefined) {
      room.confidence = r.confidence;
    }

    if (r.openings && r.openings.length > 0) {
      const openings: Opening[] = [];
      for (const o of r.openings) {
        const mapped = mapOpening(o, polygon);
        if (mapped) openings.push(mapped);
      }
      if (openings.length > 0) {
        room.openings = openings;
      }
    }

    return room;
  });

  const contract = newContract({
    source: input.source,
    provenance: input.provenance,
    rooms: roomObjs,
    scene: input.scene,
  });

  const validation = validateContract(contract);

  return { contract, validation };
}

export function roomToContract(
  room: PlanexRoom,
  source: ContractSource,
  provenance: Provenance,
  floorElevationM: number = 0,
  ceilingHeightM: number = 2.7
): { contract: MetricSpatialContract; validation: ValidationResult } {
  return layoutToContract({
    source,
    provenance,
    widthM: room.w,
    heightM: room.h,
    floorElevationM,
    ceilingHeightM,
    rooms: [room],
  });
}

export { M_TO_MM };
