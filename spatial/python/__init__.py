"""
Metric Spatial Contract — Python mirror of the TypeScript contract.
Provides canonical types and factory functions for spatial data.
"""
from dataclasses import dataclass, field
from typing import Optional, Literal

CONTRACT_VERSION = "1.0"
COORDINATE_SYSTEM = "EPSG:Metric_Cartesian_MM"


PointMm = tuple[float, float]
PolygonMm = list[PointMm]

SourceKind = Literal["photos", "video", "blueprint_pdf", "blueprint_dwg", "blueprint_image", "manual"]
OpeningType = Literal["door", "window", "opening", "arch"]
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
    from datetime import datetime, timezone
    prov_dict = {
        "measured_by": provenance.measured_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if prov_dict.get("created_at") is None:
        pass  # created_at is set above
    
    c = MetricSpatialContract(
        contract_version=CONTRACT_VERSION,
        coordinate_system=COORDINATE_SYSTEM,
        units={"length": "mm", "angle": "deg"},
        source=source,
        provenance=provenance,
        rooms=rooms or []
    )
    if provenance.created_at is None:
        provenance.created_at = prov_dict["created_at"]
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
