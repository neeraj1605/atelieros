"""
Room Contract — Pydantic models for spatial room contracts.
Defines MetricRoomContract and Opening for the LayoutLens extractor
and the broader spatial pipeline.
"""
from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class Opening(BaseModel):
    """A door, window, or other opening in a room boundary."""
    id: str
    type: Literal["door", "window", "opening", "arch", "balcony_slider"]
    wall_index: int
    offset_mm: float
    width_mm: float
    height_mm: float
    sill_height_mm: float = 0.0


class MetricRoomContract(BaseModel):
    """
    Standardized metric room contract for Indian residential construction.
    
    Defines a room boundary polygon in millimetres with openings,
    wall thicknesses, and ceiling height following Indian modular standards.
    """
    project_id: str
    room_type: Literal["living", "modular_kitchen", "master_bed", "pooja"]
    ceiling_height_mm: float = Field(default=2800.0, description="Standard Indian slab height")
    wall_thickness_ext_mm: float = 230.0
    wall_thickness_int_mm: float = 115.0
    perimeter_polygon: List[List[float]]  # [X, Y] coordinates in mm, clockwise
    openings: List[Opening]
