"""
Parametric CAD Runner — Constructs watertight B-Rep geometry and exports GLTF models.

Builds Indian-standard modular kitchen geometry using build123d + OpenCascade.
Outputs GLTF binaries for Three.js web rendering and metric takeoff data for the BOQ.
"""
import os
import sys

# Ensure parent package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from room_contract import MetricRoomContract
from typing import Dict, Any


class ParametricCADRunner:
    """
    Constructs watertight B-Rep CAD geometry and exports renderable GLTF models.
    
    Uses build123d + OpenCascade for real CAD; falls back to pseudo-mode
    when build123d is not installed.
    """
    
    def __init__(self):
        self._check_build123d()
    
    def _check_build123d(self) -> bool:
        """Check if build123d is available in the environment."""
        try:
            import build123d
            self._build123d_available = True
            return True
        except ImportError:
            self._build123d_available = False
            return False
    
    def build_kitchen(
        self,
        contract: MetricRoomContract,
        base_length_mm: float = 3000.0,
        output_dir: str = "static/models"
    ) -> Dict[str, Any]:
        """
        Build a modular kitchen assembly and export to GLTF.
        
        Args:
            contract: The room contract with openings and dimensions
            base_length_mm: Base cabinet length (default 3000mm = 3m)
            output_dir: Directory for exported GLTF files
            
        Returns:
            Dict with GLTF URL and metric takeoff data
        """
        os.makedirs(output_dir, exist_ok=True)
        gltf_filename = f"{contract.project_id}_kitchen.glb"
        gltf_path = os.path.join(output_dir, gltf_filename)

        if self._build123d_available:
            return self._build_real(contract, base_length_mm, gltf_path, gltf_filename)
        return self._build_pseudo(contract, base_length_mm, gltf_filename)
    
    def _build_real(
        self,
        contract: MetricRoomContract,
        base_length_mm: float,
        gltf_path: str,
        gltf_filename: str
    ) -> Dict[str, Any]:
        """Build with full build123d + OpenCascade (real CAD)."""
        import build123d as bd
        from build123d import export_gltf, Unit

        # 1. Indian Standard Dimensions: 860mm finished counter, 100mm toe-kick, 20mm quartz
        carcass_depth = 580.0
        carcass_height = 740.0
        counter_thickness = 20.0
        
        # Adjust base length based on room width if larger
        actual_base = min(base_length_mm, max(
            contract.perimeter_polygon[1][0] - contract.perimeter_polygon[0][0],
            3000.0
        ))

        # 2. Parametric Solid Assembly
        base_carcass = bd.Box(actual_base, carcass_depth, carcass_height)
        base_carcass = base_carcass.move(bd.Location((actual_base/2, carcass_depth/2, carcass_height/2 + 100)))

        countertop = bd.Box(actual_base + 40, carcass_depth + 20, counter_thickness)
        countertop = countertop.move(bd.Location((actual_base/2, carcass_depth/2, carcass_height + 100 + counter_thickness/2)))

        assembly = bd.Compound(children=[base_carcass, countertop])

        # 3. Export binary GLTF for Three.js web rendering
        export_gltf(
            to_export=assembly,
            file_path=gltf_path,
            unit=Unit.MM,
            binary=True
        )

        # 4. Metric Takeoff Calculations
        ply_sqm = (2 * (actual_base * carcass_height) + 2 * (carcass_depth * carcass_height)) / 1e6
        quartz_sqm = ((actual_base + 40) * (carcass_depth + 20)) / 1e6

        return {
            "gltf_url": f"/static/models/{gltf_filename}",
            "metrics": {
                "marine_ply_sqm": float(round(ply_sqm, 2)),
                "quartz_counter_sqm": float(round(quartz_sqm, 2)),
                "base_length_mm": actual_base,
                "mode": "build123d"
            }
        }
    
    def _build_pseudo(
        self,
        contract: MetricRoomContract,
        base_length_mm: float,
        gltf_filename: str
    ) -> Dict[str, Any]:
        """
        Pseudo-CAD mode: calculate metrics without GLTF export.
        Used when build123d is not available.
        """
        # 1. Indian Standard Dimensions
        carcass_depth = 580.0
        carcass_height = 740.0
        counter_thickness = 20.0

        # 2. Use base length from contract or default
        actual_base = min(base_length_mm, max(
            contract.perimeter_polygon[1][0] - contract.perimeter_polygon[0][0],
            3000.0
        ))

        # 3. Metric Takeoff Calculations (same math, no GLTF export)
        ply_sqm = (2 * (actual_base * carcass_height) + 2 * (carcass_depth * carcass_height)) / 1e6
        quartz_sqm = ((actual_base + 40) * (carcass_depth + 20)) / 1e6

        return {
            "gltf_url": None,
            "metrics": {
                "marine_ply_sqm": float(round(ply_sqm, 2)),
                "quartz_counter_sqm": float(round(quartz_sqm, 2)),
                "base_length_mm": actual_base,
                "mode": "pseudo"
            }
        }


if __name__ == "__main__":
    # Quick smoke test
    from room_contract import Opening
    
    contract = MetricRoomContract(
        project_id="kitchen_test",
        room_type="modular_kitchen",
        perimeter_polygon=[[0.0, 0.0], [4800.0, 0.0], [4800.0, 3200.0], [0.0, 3200.0]],
        openings=[
            Opening(id="op_entry", type="door", wall_index=0, offset_mm=600.0, width_mm=900.0, height_mm=2100.0),
            Opening(id="op_balcony", type="window", wall_index=2, offset_mm=1000.0, width_mm=1800.0, height_mm=1400.0, sill_height_mm=900.0),
        ]
    )
    
    runner = ParametricCADRunner()
    print(f"build123d available: {runner._build123d_available}")
    
    result = runner.build_kitchen(contract, output_dir="test_output/models")
    print(f"GLTF URL: {result['gltf_url']}")
    print(f"Metrics: {result['metrics']}")
    print("\nParametricCADRunner smoke test PASSED")
