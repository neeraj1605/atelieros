"""
Tests for Engine 3: OpenConstructionERP Takeoff & BOQ.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from spatial_contract import (
    Room, Opening, new_contract, ContractSource, Provenance, validate_contract
)
from engines.multicadf import MultiAgentCAD
from engines.erp_boq import BOQEngine, BOQCategory, BOQUnit, IndianErgonomics


def make_test_contract_with_rooms():
    """Create a test spatial contract with multiple rooms."""
    return new_contract(
        source=ContractSource(kind="manual", uri="test://test"),
        provenance=Provenance(measured_by="hybrid", confidence=0.92),
        rooms=[
            Room(
                id="room_living",
                boundary_polygon=[[0, 0], [5000, 0], [5000, 4000], [0, 4000]],
                ceiling_height_mm=2700,
                name="Living Room",
                kind="living",
                openings=[
                    Opening(type="door", start_mm=[0, 2000], width_mm=900, height_mm=2100, sill_mm=0),
                    Opening(type="window", start_mm=[3000, 0], width_mm=1500, height_mm=1200, sill_mm=900),
                ],
                confidence=0.95,
            ),
            Room(
                id="room_kitchen",
                boundary_polygon=[[5000, 0], [8000, 0], [8000, 3000], [5000, 3000]],
                ceiling_height_mm=2700,
                name="Kitchen",
                kind="kitchen",
                openings=[
                    Opening(type="door", start_mm=[5000, 1500], width_mm=800, height_mm=2100, sill_mm=0),
                ],
                confidence=0.9,
            ),
        ],
    )


class TestIndianErgonomics:
    """Test Indian ergonomic standards."""

    def test_brick_size_standard(self):
        """Standard Indian brick size should be 190x90x57mm."""
        e = IndianErgonomics()
        assert e.BRICK_SIZE_MM == (190, 90, 57)

    def test_door_standard_widths(self):
        """Standard Indian door widths should include common sizes."""
        e = IndianErgonomics()
        assert 825 in e.DOOR_STANDARD_WIDTHS_MM
        assert 900 in e.DOOR_STANDARD_WIDTHS_MM

    def test_default_rates_exist(self):
        """Default rates should be defined for all categories."""
        e = IndianErgonomics()
        assert BOQCategory.BRICKWORK in e.DEFAULT_RATES
        assert BOQCategory.PLASTER in e.DEFAULT_RATES
        assert BOQCategory.FLOORING in e.DEFAULT_RATES
        assert BOQCategory.PAINTING in e.DEFAULT_RATES
        assert BOQCategory.CEILING in e.DEFAULT_RATES


class TestTakeoffEngine:
    """Tests for the takeoff engine."""

    def test_takeoff_room(self):
        """Takeoff should calculate surface areas and volumes correctly."""
        from engines.erp_boq import TakeoffEngine
        takeoff = TakeoffEngine()
        
        room = Room(
            id="room_test",
            boundary_polygon=[[0, 0], [5000, 0], [5000, 4000], [0, 4000]],
            ceiling_height_mm=2700,
        )
        
        result = takeoff.takeoff_room(room)
        
        expected_floor_area_sqft = (5000 * 4000) * 0.0000107639
        assert abs(result.surface_areas["floor_sqft"] - expected_floor_area_sqft) < 0.01

    def test_openings_takeoff(self):
        """Takeoff should count doors and windows."""
        from engines.erp_boq import TakeoffEngine
        takeoff = TakeoffEngine()
        
        room = Room(
            id="room_test",
            boundary_polygon=[[0, 0], [5000, 0], [5000, 4000], [0, 4000]],
            ceiling_height_mm=2700,
            openings=[
                Opening(type="door", start_mm=[0, 2000], width_mm=900, height_mm=2100, sill_mm=0),
                Opening(type="window", start_mm=[3000, 0], width_mm=1500, height_mm=1200, sill_mm=900),
            ],
        )
        
        result = takeoff.takeoff_room(room)
        
        door_groups = [g for g in result.openings_takeoff if g["type"] == "doors"]
        window_groups = [g for g in result.openings_takeoff if g["type"] == "windows"]
        
        assert len(door_groups) == 1
        assert door_groups[0]["count"] == 1
        assert len(window_groups) == 1
        assert window_groups[0]["count"] == 1


class TestBOQEngine:
    """Tests for the BOQ engine."""

    def test_generate_boq(self):
        """BOQ generation should produce valid line items."""
        boq = BOQEngine()
        contract = make_test_contract_with_rooms()
        
        summary = boq.generate_boq(
            contract=contract,
            project_id="test_project",
            finish_grade="premium"
        )
        
        assert summary.project_id == "test_project"
        assert len(summary.items) > 0
        assert summary.total_incl_gst > 0
        assert all(item.total_inr > 0 for item in summary.items)

    def test_boq_gst_calculation(self):
        """GST should be calculated correctly (18% default)."""
        boq = BOQEngine()
        contract = make_test_contract_with_rooms()
        
        summary = boq.generate_boq(contract=contract, project_id="test", finish_grade="standard")
        
        calculated_gst = sum(item.gst_amount for item in summary.items)
        assert abs(summary.total_gst - calculated_gst) < 0.02

    def test_boq_total_incl_gst(self):
        """Total should include GST."""
        boq = BOQEngine()
        contract = make_test_contract_with_rooms()
        
        summary = boq.generate_boq(contract=contract, project_id="test", finish_grade="standard")
        
        assert abs(summary.total_incl_gst - (summary.subtotal_excl_gst + summary.total_gst)) < 0.02

    def test_boq_categories(self):
        """BOQ should include all expected categories."""
        boq = BOQEngine()
        contract = make_test_contract_with_rooms()
        
        summary = boq.generate_boq(contract=contract, project_id="test", finish_grade="standard")
        
        categories = {item.category for item in summary.items}
        assert BOQCategory.FLOORING in categories
        assert BOQCategory.PLASTER in categories
        assert BOQCategory.PAINTING in categories
        assert BOQCategory.CEILING in categories
        assert BOQCategory.JOINERY in categories

    def test_boq_finish_grades(self):
        """Premium grade should cost more than economy."""
        boq = BOQEngine()
        contract = make_test_contract_with_rooms()
        
        econ = boq.generate_boq(contract=contract, project_id="test", finish_grade="economy")
        prem = boq.generate_boq(contract=contract, project_id="test", finish_grade="premium")
        
        assert prem.total_incl_gst > econ.total_incl_gst

    def test_to_dict_serialization(self):
        """BOQ should serialize to JSON-compatible dict."""
        boq = BOQEngine()
        contract = make_test_contract_with_rooms()
        
        summary = boq.generate_boq(contract=contract, project_id="test", finish_grade="standard")
        d = boq.to_dict(summary)
        
        # Should be JSON serializable
        json_str = json.dumps(d)
        parsed = json.loads(json_str)
        assert "items" in parsed
        assert "total_incl_gst" in parsed

    def test_boq_currency(self):
        """BOQ currency should be INR."""
        boq = BOQEngine()
        contract = make_test_contract_with_rooms()
        
        summary = boq.generate_boq(contract=contract, project_id="test", finish_grade="standard")
        
        assert summary.currency == "INR"

    def test_validation_passes(self):
        """Test contract should pass validation."""
        contract = make_test_contract_with_rooms()
        result = validate_contract(contract)
        assert result["valid"] is True

    def test_room_id_slugify(self):
        """room_id should create valid slugs."""
        assert room_id("Living Room") == "room_living_room"
        assert room_id("Kids' Bedroom") == "room_kids_bedroom"