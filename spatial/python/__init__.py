"""
Planex Spatial Pipeline — Python Package

Tier-1 pipeline combining:
1. LayoutLens (Boundary Extraction)
2. Multi-Agent-CAD (build123d / OpenCascade)
3. OpenConstructionERP (BOQ / Takeoff)
"""
from .spatial_contract import (
    CONTRACT_VERSION, COORDINATE_SYSTEM,
    MetricSpatialContract, Room, Opening, Wall,
    ContractSource, Provenance, SceneMeta,
    new_contract, room_id, validate_contract,
)

from .engines import (
    LayoutLensEngine, LayoutLensOutput, DetectionResult,
    MultiAgentCAD, CADEngineOutput, SolidResult,
    BOQEngine, BOQSummary, BOQLineItem,
    TakeoffEngine, TakeoffResult,
    IndianErgonomics, BOQCategory, BOQUnit,
)

__all__ = [
    "CONTRACT_VERSION", "COORDINATE_SYSTEM",
    "MetricSpatialContract", "Room", "Opening", "Wall",
    "ContractSource", "Provenance", "SceneMeta",
    "new_contract", "room_id", "validate_contract",
    "LayoutLensEngine", "LayoutLensOutput", "DetectionResult",
    "MultiAgentCAD", "CADEngineOutput", "SolidResult",
    "BOQEngine", "BOQSummary", "BOQLineItem",
    "TakeoffEngine", "TakeoffResult",
    "IndianErgonomics", "BOQCategory", "BOQUnit",
]
