"""
Pydantic models for the spatial pipeline API.
Mirrors the MetricSpatialContract with Pydantic validation.
"""
from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class Opening(BaseModel):
    id: str
    type: Literal["door", "window", "opening", "arch", "balcony_slider"]
    wall_index: int
    offset_mm: float
    width_mm: float
    height_mm: float
    sill_height_mm: float = 0.0


class MetricRoomContract(BaseModel):
    project_id: str
    room_type: Literal["living", "modular_kitchen", "master_bed", "pooja"]
    ceiling_height_mm: float = Field(default=2800.0, description="Standard Indian slab height")
    wall_thickness_ext_mm: float = 230.0
    wall_thickness_int_mm: float = 115.0
    perimeter_polygon: List[List[float]]  # [X, Y] coordinates in mm, clockwise
    openings: List[Opening]


class PipelineInput(BaseModel):
    """Input for the full spatial pipeline."""
    image_base64: Optional[str] = Field(None, description="Base64-encoded floor plan image")
    rooms: Optional[List[MetricRoomContract]] = None
    dpi: int = Field(default=300, ge=72, le=600)
    finish_grade: Literal["economy", "standard", "premium"] = "premium"
    project_id: str = "auto"
    output_dir: Optional[str] = None


class PipelineOutput(BaseModel):
    """Output from the full spatial pipeline."""
    contract: dict
    validation: dict
    cad: dict
    boq: dict
    processing_time_ms: float
