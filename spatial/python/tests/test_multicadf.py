"""
Tests for Engine 2: Multi-Agent-CAD with build123d.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from spatial_contract import Room, Opening, new_contract, ContractSource, Provenance
from engines.multicadf import MultiAgentCAD


def make_test_contract():
    """Create a test spatial contract."""
    return new_contract(
        source=ContractSource(kind="manual", uri="test://test"),
        provenance=Provenance(measured_by="hybrid", confidence=0.9),
        rooms=[
            Room(
                id="room_living",
                boundary_polygon=[[0, 0], [5000, 0], [5000, 4000], [0, 4000]],
                ceiling_height_mm=2700,
                name="Living Room",
                kind="living",
                openings=[
                    Opening(
                        type="door",
                        start_mm=[0, 2000],
                        width_mm=900,
                        height_mm=2100,
                        sill_mm=0,
                        confidence=0.9,
                    ),
                ],
                confidence=0.95,
            ),
        ],
    )


class TestMultiAgentCAD:
    """Tests for the CAD engine."""

    def test_cad_initialization(self):
        """CAD engine should initialize correctly."""
        cad = MultiAgentCAD()
        assert cad is not None
        assert hasattr(cad, 'wall_thickness_mm')
        assert cad.wall_thickness_mm == 120  # default

    def test_build_from_contract_pseudo_mode(self):
        """CAD should work in pseudo mode without build123d."""
        cad = MultiAgentCAD()
        contract = make_test_contract()
        
        result = cad.build_from_contract(contract, output_dir="test_output")
        
        assert result is not None
        assert len(result.solids) > 0
        assert result.solids[0].room_id == "room_living"
        
        # Pseudo mode estimates
        assert result.solids[0].volume_mm3 > 0
        assert result.solids[0].surface_area_mm2 > 0
        
        # Provenance should indicate pseudo mode
        assert result.provenance.get("method") == "volume-estimation"

    def test_solid_hash_deterministic(self):
        """Solid hash should be deterministic for the same room."""
        cad = MultiAgentCAD()
        contract = make_test_contract()
        result1 = cad.build_from_contract(contract, output_dir="test_output")
        result2 = cad.build_from_contract(contract, output_dir="test_output")
        
        assert result1.solids[0].solid_hash == result2.solids[0].solid_hash

    def test_volume_calculation(self):
        """Volume should be floor_area × ceiling_height minus openings."""
        cad = MultiAgentCAD()
        contract = make_test_contract()
        result = cad.build_from_contract(contract, output_dir="test_output")
        
        # Room: 5000x4000mm = 20,000,000 mm², height 2700mm
        expected_volume = 20_000_000 * 2700  # 54,000,000,000 mm³
        actual = result.solids[0].volume_mm3
        
        # Opening volume subtracted
        opening_vol = 900 * 2100 * 120  # 226,800,000 mm³
        expected_volume -= opening_vol
        
        assert abs(actual - expected_volume) < 1.0

    def test_opening_volume_deducted(self):
        """Opening volumes should be deducted from wall volume."""
        cad = MultiAgentCAD()
        contract = make_test_contract()
        result = cad.build_from_contract(contract, output_dir="test_output")
        
        # Opening: 900mm × 2100mm × 120mm wall
        expected_opening_vol = 900 * 2100 * 120
        assert result.solids[0].opening_volume_mm3 == expected_opening_vol
