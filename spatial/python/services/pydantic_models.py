"""
Pydantic models for the spatial pipeline API.
Reuses RoomContract models and extends for pipeline input/output.
"""
import os
import sys
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from room_contract import MetricRoomContract, Opening


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


__all__ = ["MetricRoomContract", "Opening", "PipelineInput", "PipelineOutput"]
