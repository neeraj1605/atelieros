/* ============================================================
   Spatial Kernel — abstraction over WASM + TypeScript geometry.
   
   In production, load the compiled WASM kernel (spatial/cpp) which
   provides faster, identical geometry operations. If WASM is not
   available (e.g. during development or in environments where the
   toolchain couldn't compile it), fall back to the pure TypeScript
   geometry kernel.
   
   The WASM module interface (when loaded) must satisfy:
   - init(): Promise<void>
   - parseLayout(input: LayoutInput): LayoutResult
   - computeArea(points: PointMm[]): number
   - computePerimeter(points: PointMm[]): number
   
   The TypeScript fallback implements the same contract using
   spatial/ts/src/geometry.ts, ensuring deterministic parity.
   ============================================================ */
import type {
  MetricSpatialContract, Room, Opening, PointMm, PolygonMm,
  ContractSource, Provenance, MeasuredBy
} from './contract.ts';
import { validateContract, type ValidationResult } from './validate.ts';
import {
  area, perimeter, centroid, bbox, wallRuns, edges,
  type Edge, type EdgeHit, edgeContaining, selfIntersects,
  hasConsecutiveDuplicates, dropClosingPoint
} from './geometry.ts';

export interface LayoutRoom {
  id: string;
  name?: string;
  kind?: string;
  level?: number;
  polygon_mm: PolygonMm;
  ceiling_height_mm: number;
  floor_elevation_mm?: number;
  openings?: Opening[];
  confidence?: number;
}

export interface LayoutInput {
  source: ContractSource;
  provenance: Provenance;
  rooms: LayoutRoom[];
  walls?: Wall[];
  scene?: SceneMeta;
}

export interface Wall {
  id: string;
  start_mm: PointMm;
  end_mm: PointMm;
  thickness_mm: number;
  height_mm?: number;
  room_ids?: string[];
}

export interface SceneMeta {
  origin?: string;
  gravity?: [number, number, number];
  transform?: number[];
}

export interface LayoutResult {
  contract: MetricSpatialContract;
  valid: boolean;
  validation?: ValidationResult;
  stats: {
    rooms: number;
    walls: number;
    total_area_mm2: number;
    total_perimeter_mm: number;
  };
}

/** Abstract WASM module interface — filled by the compiled spatial/cpp kernel. */
export interface WasmModule {
  init?(): Promise<void>;
  computeArea?(points: PointMm[]): number;
  computePerimeter?(points: PointMm[]): number;
  computeWalls?(rooms: LayoutRoom[]): Wall[];
}

export class SpatialKernel {
  private wasm: WasmModule | null = null;
  private initialized = false;

  async init(wasmModule?: WasmModule): Promise<void> {
    if (wasmModule) {
      this.wasm = wasmModule;
      if (typeof this.wasm.init === 'function') {
        await this.wasm.init();
      }
    }
    this.initialized = true;
  }

  private get wasmReady(): boolean {
    return this.wasm !== null && this.initialized;
  }

  computeArea(polygon: PolygonMm): number {
    if (this.wasmReady && this.wasm!.computeArea) {
      return this.wasm!.computeArea(polygon);
    }
    return area(polygon);
  }

  computePerimeter(polygon: PolygonMm): number {
    if (this.wasmReady && this.wasm!.computePerimeter) {
      return this.wasm!.computePerimeter(polygon);
    }
    return perimeter(polygon);
  }

  computeWalls(rooms: LayoutRoom[]): Wall[] {
    if (this.wasmReady && this.wasm!.computeWalls) {
      return this.wasm!.computeWalls(rooms);
    }
    return this.tsWalls(rooms);
  }

  private tsWalls(rooms: LayoutRoom[]): Wall[] {
    const walls: Wall[] = [];
    const wallMap = new Map<string, Wall>();

    for (const room of rooms) {
      const roomEdges = edges(room.polygon_mm);
      for (const e of roomEdges) {
        const key = this.edgeKey(e.a, e.b);
        const existing = wallMap.get(key);
        if (existing) {
          existing.room_ids = existing.room_ids ?? [];
          if (!existing.room_ids.includes(room.id)) {
            existing.room_ids.push(room.id);
          }
        } else {
          const wall: Wall = {
            id: `wall_${walls.length + 1}`,
            start_mm: e.a,
            end_mm: e.b,
            thickness_mm: 120,
            room_ids: [room.id]
          };
          wallMap.set(key, wall);
          walls.push(wall);
        }
      }
    }
    return walls;
  }

  private edgeKey(a: PointMm, b: PointMm): string {
    const [ax, ay] = a;
    const [bx, by] = b;
    if (ax > bx || (ax === bx && ay > by)) {
      return `${bx},${by}|${ax},${ay}`;
    }
    return `${ax},${ay}|${bx},${by}`;
  }

  parseLayout(input: LayoutInput): LayoutResult {
    const walls = input.walls ?? this.computeWalls(input.rooms);

    const contract: MetricSpatialContract = {
      contract_version: '1.0',
      coordinate_system: 'EPSG:Metric_Cartesian_MM',
      units: { length: 'mm', angle: 'deg' },
      source: input.source,
      provenance: input.provenance,
      rooms: input.rooms.map((r): Room => ({
        id: r.id,
        name: r.name,
        level: r.level,
        kind: r.kind,
        boundary_polygon: dropClosingPoint(r.polygon_mm),
        ceiling_height_mm: r.ceiling_height_mm,
        floor_elevation_mm: r.floor_elevation_mm,
        openings: r.openings,
        confidence: r.confidence
      })),
      walls,
      scene: input.scene
    };

    const validation = validateContract(contract);

    let totalArea = 0;
    let totalPerimeter = 0;
    for (const room of input.rooms) {
      totalArea += this.computeArea(room.polygon_mm);
      totalPerimeter += this.computePerimeter(room.polygon_mm);
    }

    return {
      contract,
      valid: validation.valid,
      validation,
      stats: {
        rooms: input.rooms.length,
        walls: walls.length,
        total_area_mm2: totalArea,
        total_perimeter_mm: totalPerimeter
      }
    };
  }
}

export function createKernel(): SpatialKernel {
  const kernel = new SpatialKernel();
  return kernel;
}

export {
  area, perimeter, centroid, bbox, wallRuns, edges, selfIntersects,
  hasConsecutiveDuplicates, dropClosingPoint, edgeContaining
};

export type {
  Edge, EdgeHit, PolygonMm, PointMm
};
