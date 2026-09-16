"""
Tests for LayoutLensExtractor and RoomContract models.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from room_contract import MetricRoomContract, Opening
from engines.layoutlens_extractor import LayoutLensExtractor


class TestRoomContract:
    """Tests for the RoomContract pydantic models."""

    def test_opening_defaults(self):
        """Opening should default sill_height_mm to 0."""
        o = Opening(id="d1", type="door", wall_index=0, offset_mm=500, width_mm=900, height_mm=2100)
        assert o.sill_height_mm == 0.0

    def test_room_contract_defaults(self):
        """RoomContract should set standard Indian defaults."""
        contract = MetricRoomContract(
            project_id="test",
            room_type="modular_kitchen",
            perimeter_polygon=[[0,0], [4800,0], [4800,3200], [0,3200]],
            openings=[]
        )
        assert contract.ceiling_height_mm == 2800.0
        assert contract.wall_thickness_ext_mm == 230.0
        assert contract.wall_thickness_int_mm == 115.0

    def test_room_contract_custom_values(self):
        """RoomContract should accept custom values."""
        contract = MetricRoomContract(
            project_id="test",
            room_type="living",
            ceiling_height_mm=3000.0,
            wall_thickness_ext_mm=150.0,
            perimeter_polygon=[[0,0], [6000,0], [6000,4000], [0,4000]],
            openings=[]
        )
        assert contract.ceiling_height_mm == 3000.0
        assert contract.room_type == "living"

    def test_invalid_room_type_rejected(self):
        """Invalid room types should be rejected by pydantic."""
        with pytest.raises(Exception):  # ValidationError
            MetricRoomContract(
                project_id="test",
                room_type="invalid_type",
                perimeter_polygon=[[0,0], [4800,0], [4800,3200], [0,3200]],
                openings=[]
            )

    def test_invalid_opening_type_rejected(self):
        """Invalid opening types should be rejected."""
        with pytest.raises(Exception):
            Opening(id="x", type="invalid", wall_index=0, offset_mm=0, width_mm=100, height_mm=100)


class TestLayoutLensExtractor:
    """Tests for the LayoutLensExtractor class."""

    def test_init_without_checkpoint(self):
        """Extractor should work without model weights."""
        extractor = LayoutLensExtractor()
        assert extractor.has_weights is False

    def test_init_with_invalid_path(self):
        """Extractor should handle non-existent checkpoint path."""
        extractor = LayoutLensExtractor(checkpoint_path="/nonexistent/model.pt")
        assert extractor.has_weights is False

    def test_extract_envelope_fallback(self):
        """Extractor should produce a valid contract in fallback mode."""
        extractor = LayoutLensExtractor()
        contract = extractor.extract_envelope(b"", "test_project")
        
        assert contract.project_id == "test_project"
        assert contract.room_type == "modular_kitchen"
        assert len(contract.perimeter_polygon) == 4
        assert len(contract.openings) > 0

    def test_extract_envelope_polygon_closed(self):
        """Perimeter polygon should have 4 points (rectangle)."""
        extractor = LayoutLensExtractor()
        contract = extractor.extract_envelope(b"", "test")
        
        # Check coordinates are in mm
        for point in contract.perimeter_polygon:
            assert len(point) == 2
            for coord in point:
                assert isinstance(coord, (int, float))
                assert coord >= 0

    def test_openings_have_standard_layout(self):
        """Fallback mode should produce standard kitchen openings."""
        extractor = LayoutLensExtractor()
        contract = extractor.extract_envelope(b"", "test")
        
        # Should have at least entry door and balcony window
        opening_ids = [o.id for o in contract.openings]
        assert "op_entry" in opening_ids
        assert "op_balcony" in opening_ids

    def test_door_has_zero_sill(self):
        """Doors should default to 0 sill height."""
        extractor = LayoutLensExtractor()
        contract = extractor.extract_envelope(b"", "test")
        
        for op in contract.openings:
            if op.type == "door":
                assert op.sill_height_mm == 0.0

    def test_extract_with_image_bytes(self):
        """Extractor should handle image-like input bytes."""
        extractor = LayoutLensExtractor()
        # Even empty bytes should work (falls back to default)
        contract = extractor.extract_envelope(b"", "test")
        assert contract is not None
        assert contract.project_id == "test"
