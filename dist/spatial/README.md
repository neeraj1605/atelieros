# Planex Spatial Pipeline (Tier-1)

**Live:** https://neeraj1605.github.io/atelieros/

Tier-1 pipeline combining:

| Engine | Purpose | Technology |
|--------|---------|------------|
| **1. LayoutLens** | Amodal boundary extraction from floor plans | LayoutFormer++/PolyWorld (GPU) or OpenCV/numpy heuristic (CPU) |
| **2. Multi-Agent-CAD** | B-Rep solid construction + GLB export | build123d + OpenCASCADE |
| **3. OpenConstructionERP** | Indian-standard takeoff & GST-ready BOQ | INR rates, IS 456 standards |
| **Client** | Real-time Three.js viewer | Next.js + Three.js GLTF |

## Architecture

```
spatial/
├── ts/                          # TypeScript contract layer (browser-ready)
│   ├── src/
│   │   ├── contract.ts          # Canonical types + factory
│   │   ├── geometry.ts          # Geometry kernel (pure TS)
│   │   ├── validate.ts          # Validator (error/warning codes)
│   │   ├── kernel.ts            # SpatialKernel (WASM fallback to TS)
│   │   ├── planex-bridge.ts     # Layout → Contract converter
│   │   └── index.ts             # Public API
│   ├── test/                    # 86 tests (all passing)
│   ├── package.json
│   └── tsconfig.json
├── js/
│   └── spatial-contract.js      # UMD browser bundle (auto-generated from TS)
├── python/                      # Python pipeline (FastAPI)
│   ├── spatial_contract.py      # Python mirror of the contract
│   ├── engines/
│   │   ├── layoutlens.py        # Engine 1
│   │   ├── multicadf.py         # Engine 2
│   │   └── erp_boq.py           # Engine 3
│   ├── services/
│   │   └── pipeline.py          # FastAPI service (3 endpoints)
│   ├── tests/                    # pytest test suite
│   ├── requirements.txt
│   └── pytest.ini
├── cpp/                         # WASM kernel (stub — toolchain unavailable)
└── contract/
    └── metric-spatial-contract.schema.json  # Canonical JSON schema
```

## Pipeline API

### POST `/pipeline/process`
Full pipeline: image → contract → CAD → BOQ

```bash
curl -X POST http://localhost:8000/pipeline/process \
  -F "file=@floorplan.jpg" \
  -F 'request={"project_id":"my-home","finish_grade":"premium"}'
```

### POST `/pipeline/takeoff`
BOQ from an existing spatial contract

### GET `/pipeline/status`
Health check + engine availability

## Client Integration

The browser bundle exposes `window.PlanexSpatial`:

```js
const { contract, validation } = PlanexSpatial.layoutToContract({
  source: { kind: 'photos', uri: 'upload://floorplan.jpg' },
  provenance: { measured_by: 'hybrid', confidence: 0.9 },
  widthM: 10,
  heightM: 8,
  rooms: [{
    name: 'Living Room',
    x: 0, y: 0, w: 6, h: 4,
    ceilingHeight: 2.7,
    openings: [{ type: 'door', x: 0, y: 2, width: 0.9, height: 2.1 }]
  }]
});

if (!validation.valid) {
  console.error('Invalid contract:', validation.errors);
}
```

## Testing

TypeScript (Node 22 native):
```bash
node --test --experimental-strip-types spatial/ts/test/**/*.test.ts
```

Python:
```bash
cd spatial/python
pip install -r requirements.txt
pip install pytest
pytest
```

## Data Contract

All engines exchange data via `MetricSpatialContract` (v1.0, EPSG:Metric_Cartesian_MM):
- Units: millimetres (length), degrees (angle)
- Rooms: polygon boundary + ceiling height + openings
- Walls: line segments with thickness
- Provenance: measurement method, models, confidence
