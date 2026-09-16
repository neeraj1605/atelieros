"""
Tests for ParametricCADRunner.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from room_contract import MetricRoomContract, Opening
from engines.parametric_cad import ParametricCADRunner


def make_test_contract():
    """Create a test kitchen contract."""
    return MetricRoomContract(
        project_id="test_kitchen",
        room_type="modular_kitchen",
        perimeter_polygon=[[0.0, 0.0], [4800.0, 0.0], [4800.0, 3200.0], [0.0, 3200.0]],
        openings=[
            Opening(id="op_entry", type="door", wall_index=0, offset_mm=600.0, width_mm=900.0, height_mm=2100.0),
            Opening(id="op_balcony", type="window", wall_index=2, offset_mm=1000.0, width_mm=1800.0, height_mm=1400.0, sill_height_mm=900.0),
        ]
    )


class TestParametricCADRunner:
    """Tests for the ParametricCADRunner class."""

    def test_initialization(self):
        """Runner should initialize correctly."""
        runner = ParametricCADRunner()
        assert runner is not None
        assert hasattr(runner, '_build123d_available')

    def test_build_kitchen_pseudo_mode(self):
        """Kitchen should build in pseudo mode when build123d unavailable."""
        runner = ParametricCADRunner()
        contract = make_test_contract()
        result = runner.build_kitchen(contract, output_dir="test_output/models")
        
        assert result is not None
        assert "gltf_url" in result
        assert "metrics" in result

    def test_kitchen_metrics(self):
        """Kitchen build should produce correct takeoff metrics."""
        runner = ParametricCADRunner()
        contract = make_test_contract()
        result = runner.build_kitchen(contract, output_dir="test_output/models")
        
        metrics = result["metrics"]
        assert "marine_ply_sqm" in metrics
        assert "quartz_counter_sqm" in metrics
        assert "base_length_mm" in metrics
        
        # Check ply calculation (2 walls of length x height, 2 walls of depth x height)
        # For 3000mm base: (2 * 3000 * 740 + 2 * 580 * 740) / 1e6
        expected_ply = (2 * 3000 * 740 + 2 * 580 * 740) / 1e6
        assert abs(metrics["marine_ply_sqm"] - expected_ply) < 0.01

    def test_kitchen_output_directory(self):
        """Output directory should be created if it doesn't exist."""
        runner = ParametricCADRunner()
        contract = make_test_contract()
        output_dir = "test_cad_output/models"
        result = runner.build_kitchen(contract, output_dir=output_dir)
        
        assert os.path.exists(output_dir)

    def test_kitchen_different_base_lengths(self):
        """Kitchen build should handle different base lengths."""
        runner = ParametricCADRunner()
        contract = make_test_contract()
        
        result1 = runner.build_kitchen(contract, output_dir="test_output/models", base_length_mm=2000.0)
        result2 = runner.build_kitchen(contract, output_dir="test_output/models", base_length_mm=4000.0)
        
        assert result1["metrics"]["base_length_mm"] != result2["metrics"]["base_length_mm"]
        assert result2["metrics"]["marine_ply_sqm"] > result1["metrics"]["marine_ply_sqm"]

    def test_kitchen_mode_indication(self):
        """Result should indicate whether real CAD or pseudo mode was used."""
        runner = ParametricCADRunner()
        contract = make_test_contract()
        result = runner.build_kitchen(contract, output_dir="test_output/models")
        
        assert result["metrics"]["mode"] in ("build123d", "pseudo")

    def test_gltf_url_when_available(self):
        """GLTF URL should be set when build123d is available."""
        runner = ParametricCADRunner()
        contract = make_test_contract()
        result = runner.build_kitchen(contract, output_dir="test_output/models")
        
        if runner._build123d_available:
            assert result["gltf_url"] is not None
            assert result["gltf_url"].startswith("/static/models/")
            assert result["gltf_url"].endswith(".glb")
        else:
            # Pseudo mode doesn't produce GLTF
            assert result["gltf_url"] is None
