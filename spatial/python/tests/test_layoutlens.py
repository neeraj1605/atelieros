"""
Tests for Engine 1: LayoutLens amodal boundary extraction.
"""
import sys
import os
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from spatial_contract import ContractSource, Provenance
from engines.layoutlens import LayoutLensEngine


def make_test_image(width=500, height=500, rooms=None):
    """Create a simple synthetic floor plan test image."""
    img = np.ones((height, width, 3), dtype=np.uint8) * 255  # White background
    
    if rooms is None:
        rooms = [
            {"x": 50, "y": 50, "w": 200, "h": 200, "color": (0, 0, 0)},
            {"x": 300, "y": 50, "w": 150, "h": 200, "color": (0, 0, 0)},
        ]
    
    for room in rooms:
        x, y, w, h = room["x"], room["y"], room["w"], room["h"]
        img[y:y+h, x:x+w] = room["color"]
    
    return img


class TestLayoutLens:
    """Tests for LayoutLens boundary extraction engine."""

    def test_engine_initialization_cpu(self):
        """LayoutLens should initialize in CPU/heuristic mode."""
        engine = LayoutLensEngine(device="cpu")
        assert engine.device == "cpu"
        assert engine._use_heuristic is True

    def test_engine_initialization_no_model(self):
        """LayoutLens should default to heuristic when no model is provided."""
        engine = LayoutLensEngine()
        assert engine._use_heuristic is True
        assert engine.method_name == "heuristic"

    def test_process_image_returns_output(self):
        """process_image should return a LayoutLensOutput."""
        engine = LayoutLensEngine(device="cpu")
        img = make_test_image()
        output = engine.process_image(
            image=img,
            dpi=300,
            room_labels=["Living Room", "Kitchen"]
        )
        assert output is not None
        assert hasattr(output, 'rooms')
        assert hasattr(output, 'scale_mm_per_px')
        assert output.scale_mm_per_px == 25.4 / 300.0

    def test_process_image_detects_rooms(self):
        """LayoutLens should detect room boundaries in a simple floor plan."""
        engine = LayoutLensEngine(device="cpu")
        img = make_test_image()
        output = engine.process_image(image=img, dpi=300)
        
        assert len(output.rooms) > 0
        for room in output.rooms:
            assert len(room.boundary_polygon) >= 3
            assert room.confidence > 0
            assert room.boundary_polygon[0][0] > 0  # mm coordinates

    def test_scale_conversion(self):
        """Scale conversion should be correct for the given DPI."""
        engine = LayoutLensEngine(device="cpu")
        img = make_test_image()
        output = engine.process_image(image=img, dpi=150)
        assert output.scale_mm_per_px == 25.4 / 150.0

    def test_provenance_output(self):
        """Provenance should include measurement method."""
        engine = LayoutLensEngine(device="cpu")
        img = make_test_image()
        output = engine.process_image(image=img, dpi=300)
        assert 'measured_by' in output.provenance
        assert 'confidence' in output.provenance

    def test_room_id_generation(self):
        """room_id should slugify names correctly."""
        assert room_id("Living Room") == "room_living_room"
        assert room_id("Kids' Bedroom") == "room_kids_bedroom"
        assert room_id("Kitchen") == "room_kitroom"[:6] + "room_kitchen"[-8:]  # "room_kitchen"
        assert room_id("kitchen") == "room_kitchen"

    def test_heuristic_method_name(self):
        """Heuristic mode should report the correct method name."""
        engine = LayoutLensEngine(device="cpu")
        assert engine.method_name == "heuristic"
