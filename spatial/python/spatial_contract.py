"""
Metric Spatial Contract — Python implementation.
Mirrors the TypeScript contract at spatial/ts/src/contract.ts and
the JSON schema at spatial/contract/metric-spatial-contract.schema.json.
"""
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional, Literal, Any


CONTRACT_VERSION = "1.0"
COORDINATE_SYSTEM = "EPSG:Metric_Cartesian_MM"

PointMm = tuple[float, float]
PolygonMm = list[PointMm]

SourceKind = Literal["photos", "video", "blueprint_pdf", "blueprint_dwg", "blueprint_image", "manual"]
OpeningType = Literal["door", "window", "opening", "arch", "balcony_slider"]
MeasuredBy = Literal[
    "metric3d_v2", "droid_slam", "metric3d_v2+droid_slam",
    "polyworld", "layoutformer_pp", "manual", "hybrid"
]


@dataclass
class Opening:
    type: OpeningType
    start_mm: PointMm
    width_mm: float
    height_mm: float
    sill_mm: Optional[float] = None
    sill_height_mm: Optional[float] = None  # Alias for sill_mm (Pydantic schema compatibility)
    wall_index: Optional[int] = None
    offset_mm: Optional[float] = None
    swing_deg: Optional[float] = None
    confidence: Optional[float] = None


@dataclass
class Room:
    id: str
    boundary_polygon: PolygonMm
    ceiling_height_mm: int
    name: Optional[str] = None
    level: Optional[int] = None
    kind: Optional[str] = None
    floor_elevation_mm: Optional[int] = None
    openings: Optional[list[Opening]] = None
    confidence: Optional[float] = None
    wall_thickness_ext_mm: Optional[float] = None
    wall_thickness_int_mm: Optional[float] = None


@dataclass
class Wall:
    id: str
    start_mm: PointMm
    end_mm: PointMm
    thickness_mm: float
    height_mm: Optional[float] = None
    room_ids: Optional[list[str]] = None


@dataclass
class ModelRef:
    name: str
    version: str
    weights_sha256: Optional[str] = None


@dataclass
class Provenance:
    measured_by: MeasuredBy
    models: Optional[list[ModelRef]] = None
    confidence: Optional[float] = None
    created_at: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class ContractSource:
    kind: SourceKind
    uri: Optional[str] = None
    captured_at: Optional[str] = None
    device: Optional[str] = None


@dataclass
class SceneMeta:
    origin: Optional[str] = None
    gravity: Optional[tuple[float, float, float]] = None
    transform: Optional[list[float]] = None


@dataclass
class MetricSpatialContract:
    contract_version: str
    coordinate_system: str
    units: dict[str, str]
    source: ContractSource
    provenance: Provenance
    rooms: list[Room]
    scene: Optional[SceneMeta] = None
    walls: Optional[list[Wall]] = None


def new_contract(
    source: ContractSource,
    provenance: Provenance,
    rooms: Optional[list[Room]] = None,
    scene: Optional[SceneMeta] = None,
    walls: Optional[list[Wall]] = None,
) -> MetricSpatialContract:
    """Build a contract with the mandatory envelope filled in."""
    c = MetricSpatialContract(
        contract_version=CONTRACT_VERSION,
        coordinate_system=COORDINATE_SYSTEM,
        units={"length": "mm", "angle": "deg"},
        source=source,
        provenance=provenance,
        rooms=rooms or []
    )
    if provenance.created_at is None:
        provenance.created_at = datetime.now(timezone.utc).isoformat()
    if scene:
        c.scene = scene
    if walls:
        c.walls = walls
    return c


def room_id(name: str) -> str:
    """Generate a valid room id from a human-readable name."""
    import re
    slug = re.sub(r'[^a-z0-9]+', '_', name.lower().strip()).strip('_')
    return f"room_{slug}" if slug else "room_unnamed"


def validate_contract(contract: MetricSpatialContract) -> dict[str, Any]:
    """
    Validate a spatial contract.
    Returns {valid: bool, errors: [...], warnings: [...], stats: {...}}
    """
    errors = []
    warnings = []
    
    # Basic checks
    if not isinstance(contract, MetricSpatialContract):
        return {"valid": False, "errors": [{"code": "E_NOT_OBJECT", "path": "$", "message": "Contract must be an object."}], "warnings": [], "stats": {}}
    
    if contract.contract_version != CONTRACT_VERSION:
        errors.append({"code": "E_VERSION", "path": "$.contract_version", "message": f"Expected '{CONTRACT_VERSION}'."})
    if contract.coordinate_system != COORDINATE_SYSTEM:
        errors.append({"code": "E_COORDINATE_SYSTEM", "path": "$.coordinate_system", "message": f"Expected '{COORDINATE_SYSTEM}'."})
    
    # Units
    if not isinstance(contract.units, dict) or contract.units.get("length") != "mm" or contract.units.get("angle") != "deg":
        errors.append({"code": "E_UNITS", "path": "$.units", "message": "units must be { length: 'mm', angle: 'deg' }."})
    
    # Source
    if not isinstance(contract.source, ContractSource) or not contract.source.kind:
        errors.append({"code": "E_SOURCE", "path": "$.source", "message": "source.kind is required."})
    
    # Provenance
    if not isinstance(contract.provenance, Provenance) or not contract.provenance.measured_by:
        errors.append({"code": "E_PROVENANCE", "path": "$.provenance", "message": "provenance.measured_by is required."})
    elif contract.provenance.confidence is None:
        warnings.append({"code": "W_NO_CONFIDENCE", "path": "$.provenance.confidence", "message": "No measurement confidence supplied."})
    
    # Rooms
    if not isinstance(contract.rooms, list) or len(contract.rooms) == 0:
        errors.append({"code": "E_NO_ROOMS", "path": "$.rooms", "message": "At least one room is required."})
        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings, "stats": {"rooms": 0, "area_mm2": 0, "openings": 0}}
    
    room_id_regex = re.compile(r'^[a-z0-9][a-z0-9_-]*$')
    opening_types = ['door', 'window', 'opening', 'arch', 'balcony_slider']
    seen_ids = {}
    total_area = 0.0
    total_openings = 0
    
    for ri, room in enumerate(contract.rooms):
        rp = f"$.rooms[{ri}]"
        
        if not isinstance(room, Room):
            errors.append({"code": "E_ROOM_ID", "path": rp, "message": "Room must be an object."})
            continue
        
        if not isinstance(room.id, str) or not room_id_regex.match(room.id):
            errors.append({"code": "E_ROOM_ID", "path": f"{rp}.id", "message": "Room id must match ^[a-z0-9][a-z0-9_-]*$."})
        elif room.id in seen_ids:
            errors.append({"code": "E_DUP_ROOM", "path": f"{rp}.id", "message": f"Duplicate room id '{room.id}'."})
        else:
            seen_ids[room.id] = ri
        
        poly = room.boundary_polygon
        if not isinstance(poly, list) or len(poly) < 3:
            errors.append({"code": "E_RING_MIN_POINTS", "path": f"{rp}.boundary_polygon", "message": "Polygon needs at least 3 distinct points."})
            continue
        
        # Check polygon validity
        area_mm2 = abs(sum(
            poly[i][0] * poly[(i+1) % len(poly)][1] -
            poly[(i+1) % len(poly)][0] * poly[i][1]
            for i in range(len(poly))
        )) / 2.0
        
        if area_mm2 <= 0:
            errors.append({"code": "E_RING_AREA", "path": f"{rp}.boundary_polygon", "message": "Polygon area must be greater than zero."})
        
        total_area += area_mm2
        
        # Ceiling height
        if not isinstance(room.ceiling_height_mm, int) or room.ceiling_height_mm <= 0:
            errors.append({"code": "E_CEILING_HEIGHT", "path": f"{rp}.ceiling_height_mm", "message": "ceiling_height_mm must be a positive integer."})
        
        # Room confidence
        if room.confidence is not None and room.confidence < 0.5:
            warnings.append({"code": "W_LOW_CONFIDENCE", "path": f"{rp}.confidence", "message": "Room confidence below 0.5."})
        
        # Openings
        if room.openings:
            for oi, opening in enumerate(room.openings):
                op = f"{rp}.openings[{oi}]"
                total_openings += 1
                
                if opening.type not in opening_types:
                    errors.append({"code": "E_OPENING_TYPE", "path": f"{op}.type", "message": f"Opening type must be one of {', '.join(opening_types)}."})
                
                if not isinstance(opening.width_mm, (int, float)) or opening.width_mm <= 0:
                    errors.append({"code": "E_OPENING_DIMS", "path": f"{op}.width_mm", "message": "width_mm must be a positive number."})
                if not isinstance(opening.height_mm, (int, float)) or opening.height_mm <= 0:
                    errors.append({"code": "E_OPENING_DIMS", "path": f"{op}.height_mm", "message": "height_mm must be a positive number."})
                
                sill = opening.sill_mm if opening.sill_mm is not None else (opening.sill_height_mm if opening.sill_height_mm is not None else 0)
                if not isinstance(sill, (int, float)) or sill < 0:
                    errors.append({"code": "E_OPENING_SILL", "path": f"{op}.sill_mm", "message": "sill_mm must be >= 0."})
                if opening.type == "door" and sill != 0:
                    errors.append({"code": "E_DOOR_SILL", "path": f"{op}.sill_mm", "message": "Doors must have sill_mm = 0."})
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "stats": {"rooms": len(contract.rooms), "area_mm2": total_area, "openings": total_openings}
    }


import re

def to_dict(contract: MetricSpatialContract) -> dict[str, Any]:
    """Serialize contract to a plain dict (JSON-compatible)."""
    return asdict(contract)
