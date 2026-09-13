"""
Planex Spatial Pipeline API — FastAPI service
Ties Engine 1 (LayoutLens), Engine 2 (Multi-Agent-CAD),
and Engine 3 (OpenConstructionERP BOQ) into a single pipeline.

Endpoints:
  POST /pipeline/process   — full pipeline: image → contract → CAD → BOQ
  POST /pipeline/takeoff   — BOQ only from an existing contract
  GET  /pipeline/status    — service health & engine availability
"""
import io
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Literal

import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from engines.layoutlens import LayoutLensEngine, LayoutLensOutput
from engines.multicadf import MultiAgentCAD, CADEngineOutput
from engines.erp_boq import BOQEngine, BOQSummary
from spatial_contract import MetricSpatialContract

logger = logging.getLogger("planex.spatial")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Planex Spatial Pipeline",
    description="LayoutLens -> Multi-Agent-CAD -> OpenConstructionERP BOQ pipeline",
    version="1.0.0",
)

# CORS: allow the GH Pages frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://neeraj1605.github.io", "https://neeraj1605.github.io/atelieros"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Engine singletons (lazy-loaded on first request)
_layoutlens: Optional[LayoutLensEngine] = None
_cad: Optional[MultiAgentCAD] = None
_boq: Optional[BOQEngine] = None


def get_layoutlens() -> LayoutLensEngine:
    global _layoutlens
    if _layoutlens is None:
        _layoutlens = LayoutLensEngine(model_path=None, device="cpu")
    return _layoutlens


def get_cad() -> MultiAgentCAD:
    global _cad
    if _cad is None:
        _cad = MultiAgentCAD()
    return _cad


def get_boq() -> BOQEngine:
    global _boq
    if _boq is None:
        _boq = BOQEngine()
    return _boq


# --- Pydantic schemas ---

class PipelineRequest(BaseModel):
    """Request for the full pipeline endpoint."""
    dpi: int = Field(default=300, ge=72, le=600)
    project_id: str = Field(default="auto")
    finish_grade: Literal["economy", "standard", "premium"] = Field(default="premium")
    room_labels: Optional[list[str]] = None
    rates: Optional[dict] = None


class PipelineResponse(BaseModel):
    """Full pipeline response."""
    project_id: str
    contract: dict
    validation: dict
    cad: dict
    boq: dict
    processing_time_ms: float


class TakeoffRequest(BaseModel):
    """Request for BOQ-only endpoint."""
    contract: dict
    project_id: str = Field(default="auto")
    finish_grade: Literal["economy", "standard", "premium"] = Field(default="premium")
    rates: Optional[dict] = None


class TakeoffResponse(BaseModel):
    """BOQ takeoff response."""
    project_id: str
    boq: dict
    processing_time_ms: float


class StatusResponse(BaseModel):
    """Service status response."""
    status: str
    version: str
    engines: dict
    timestamp: str


# --- Endpoints ---

@app.get("/pipeline/status", response_model=StatusResponse)
async def pipeline_status():
    """Check pipeline status and engine availability."""
    layoutlens = get_layoutlens()
    cad = get_cad()
    boq = get_boq()
    return StatusResponse(
        status="ok",
        version="1.0.0",
        engines={
            "layoutlens": {"available": True, "method": layoutlens.method_name},
            "cad": {"available": cad._build123d_available, "mode": "real" if cad._build123d_available else "pseudo"},
            "boq": {
                "available": True,
                "categories": [e.value for e in boq.ergs.DEFAULT_RATES.keys()],
            },
        },
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/pipeline/process", response_model=PipelineResponse)
async def process_pipeline(
    file: UploadFile = File(...),
    request: str = Form(default="{}"),
):
    """
    Full pipeline: image -> contract -> CAD -> BOQ.
    """
    start_time = datetime.now()

    try:
        opts = PipelineRequest(**json.loads(request))
    except json.JSONDecodeError:
        opts = PipelineRequest()

    # Read image
    image_bytes = await file.read()
    try:
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        if len(image_array) == 0:
            raise ValueError("Empty image file")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    # Decode image
    try:
        try:
            import cv2
            image_decoded = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            if image_decoded is not None:
                image = cv2.cvtColor(image_decoded, cv2.COLOR_BGR2RGB)
            else:
                raise ImportError("cv2 decode failed")
        except ImportError:
            from PIL import Image
            pil_img = Image.open(io.BytesIO(image_bytes))
            image = np.array(pil_img.convert("RGB"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not decode image: {e}")

    # Engine 1: LayoutLens
    layoutlens = get_layoutlens()
    lens_output = layoutlens.process_image(
        image=image,
        dpi=opts.dpi,
        room_labels=opts.room_labels,
    )

    # Build contract from lens output
    from spatial_contract import new_contract, validate_contract
    room_objs = []
    for det in lens_output.rooms:
        room = {
            "id": det.room_id,
            "boundary_polygon": det.boundary_polygon,
            "ceiling_height_mm": 2700,
            "openings": [
                {
                    "type": o.type,
                    "start_mm": o.start_mm,
                    "width_mm": o.width_mm,
                    "height_mm": o.height_mm,
                    "sill_mm": o.sill_mm,
                    "confidence": o.confidence,
                }
                for o in det.openings
            ],
            "confidence": det.confidence,
        }
        room_objs.append(room)

    contract = new_contract(
        source={"kind": "photos", "uri": file.filename},
        provenance=lens_output.provenance,
        rooms=room_objs,
    )

    # Validate
    validation = validate_contract(contract)

    if not validation["valid"]:
        logger.warning(f"Contract validation failed: {len(validation['errors'])} errors")

    # Engine 2: Multi-Agent-CAD
    cad = get_cad()
    output_dir = f"output/{opts.project_id}"
    cad_output = cad.build_from_contract(
        contract, output_dir=output_dir
    )

    # Engine 3: OpenConstructionERP BOQ
    boq = get_boq()
    if opts.rates:
        boq.rates = opts.rates

    boq_summary = boq.generate_boq(
        contract=contract,
        solids={s.room_id: None for s in cad_output.solids},
        project_id=opts.project_id,
        finish_grade=opts.finish_grade,
    )

    boq_dict = boq.to_dict(boq_summary)

    processing_ms = (datetime.now() - start_time).total_seconds() * 1000

    return PipelineResponse(
        project_id=opts.project_id,
        contract=contract,
        validation=validation,
        cad={
            "solids": [
                {
                    "room_id": s.room_id,
                    "solid_hash": s.solid_hash,
                    "volume_mm3": s.volume_mm3,
                    "surface_area_mm2": s.surface_area_mm2,
                    "wall_volume_mm3": s.wall_volume_mm3,
                    "opening_volume_mm3": s.opening_volume_mm3,
                    "glb_path": s.glb_path,
                }
                for s in cad_output.solids
            ],
            "total_volume_mm3": cad_output.total_volume_mm3,
            "total_surface_mm2": cad_output.total_surface_mm2,
            "assembly_glb_path": cad_output.assembly_glb_path,
            "provenance": cad_output.provenance,
        },
        boq=boq_dict,
        processing_time_ms=round(processing_ms, 2),
    )


@app.post("/pipeline/takeoff", response_model=TakeoffResponse)
async def takeoff_from_contract(contract_data: TakeoffRequest = None):
    """Generate BOQ from an existing spatial contract."""
    start_time = datetime.now()

    boq = get_boq()
    if contract_data.rates:
        boq.rates = contract_data.rates

    from spatial_contract import MetricSpatialContract, Room, Opening
    room_objs = []
    for r in contract_data.contract.get("rooms", []):
        openings = []
        if r.get("openings"):
            for o in r["openings"]:
                openings.append(Opening(
                    type=o["type"],
                    start_mm=tuple(o["start_mm"]),
                    width_mm=o["width_mm"],
                    height_mm=o["height_mm"],
                    sill_mm=o.get("sill_mm", 0),
                    swing_deg=o.get("swing_deg"),
                    confidence=o.get("confidence"),
                ))
        room_objs.append(Room(
            id=r["id"],
            boundary_polygon=r["boundary_polygon"],
            ceiling_height_mm=r["ceiling_height_mm"],
            name=r.get("name"),
            level=r.get("level"),
            kind=r.get("kind"),
            floor_elevation_mm=r.get("floor_elevation_mm"),
            openings=openings,
            confidence=r.get("confidence"),
        ))

    contract = MetricSpatialContract(
        contract_version=contract_data.contract["contract_version"],
        coordinate_system=contract_data.contract["coordinate_system"],
        units=contract_data.contract["units"],
        source=contract_data.contract["source"],
        provenance=contract_data.contract["provenance"],
        rooms=room_objs,
    )

    boq_summary = boq.generate_boq(
        contract=contract,
        project_id=contract_data.project_id,
        finish_grade=contract_data.finish_grade,
    )

    boq_dict = boq.to_dict(boq_summary)
    processing_ms = (datetime.now() - start_time).total_seconds() * 1000

    return TakeoffResponse(
        project_id=contract_data.project_id,
        boq=boq_dict,
        processing_time_ms=round(processing_ms, 2),
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return JSONResponse({"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()})
