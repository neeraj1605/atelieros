/* ============================================================
   Spatial Contract Integration
   Bridges the TypeScript spatial contract layer with Three.js viewer.
============================================================ */

import { newContract, validateContract, layoutToContract, createKernel } from '../../spatial/ts/src/index.ts';

// TypeScript type re-export for convenience
export type { MetricSpatialContract, Room, Opening, Wall } from '../../spatial/ts/src/contract.ts';

// Re-export key functions
export { newContract, validateContract, layoutToContract, createKernel };
export { CONTRACT_VERSION, COORDINATE_SYSTEM, M_TO_MM } from '../../spatial/ts/src/contract.ts';
export { area, perimeter, centroid, bbox } from '../../spatial/ts/src/geometry.ts';

/**
 * Convert a Planex layout to a ThreeJS-ready mesh data structure.
 * Returns wall segments and room polygons for visualization.
 */
export function layoutToMeshData(input: {
  widthM: number;
  heightM: number;
  rooms: Array<{
    name: string;
    x: number; y: number;
    w: number; h: number;
    ceilingHeight?: number;
  }>;
  floorElevationM?: number;
  ceilingHeightM?: number;
}) {
  const { contract, validation } = layoutToContract({
    source: { kind: 'manual' },
    provenance: { measured_by: 'hybrid' },
    ...input
  });

  const rooms = contract.rooms.map(room => ({
    id: room.id,
    name: room.name || room.id,
    kind: room.kind,
    polygon: room.boundary_polygon,
    ceilingHeightMm: room.ceiling_height_mm,
    floorElevationMm: room.floor_elevation_mm || 0,
  }));

  // Build wall segments from room boundaries
  const walls = new Map<string, any>();
  const edgeKey = (a: [number, number], b: [number, number]) => {
    const [ax, ay] = a;
    const [bx, by] = b;
    if (ax > bx || (ax === bx && ay > by)) return `${bx},${by}|${ax},${ay}`;
    return `${ax},${ay}|${bx},${by}`;
  };

  for (const room of contract.rooms) {
    const poly = [...room.boundary_polygon];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const key = edgeKey(a, b);
      
      if (!walls.has(key)) {
        walls.set(key, {
          start: { x: a[0] / 1000, y: 0, z: a[1] / 1000 },
          end: { x: b[0] / 1000, y: 0, z: b[1] / 1000 },
          height: (room.ceiling_height_mm || 2700) / 1000,
          thickness: 0.12, // 120mm default
          rooms: [room.id],
        });
      } else {
        const wall = walls.get(key);
        if (!wall.rooms.includes(room.id)) {
          wall.rooms.push(room.id);
        }
      }
    }
  }

  return {
    contract,
    validation,
    rooms,
    walls: Array.from(walls.values()),
  };
}
