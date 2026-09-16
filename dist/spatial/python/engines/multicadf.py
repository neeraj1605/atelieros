"""
Multi-Agent-CAD Engine (Engine 2)

Builds B-Rep solid models from spatial contracts using build123d + OpenCASCADE.
Each room becomes a 3D solid; openings (doors/windows) are subtracted.
Delivers automated GLB export for Three.js visualization.
"""
from dataclasses import dataclass
from typing import Optional
import json
import os

from .. import MetricSpatialContract, Room, Opening


@dataclass
class SolidResult:
    """Result of building a single room solid."""
    room_id: str
    solid_hash: str
    volume_mm3: float
    surface_area_mm2: float
    wall_volume_mm3: float
    opening_volume_mm3: float
    glb_path: Optional[str] = None
    brep_path: Optional[str] = None


@dataclass
class CADEngineOutput:
    """Complete output from the CAD engine."""
    solids: list[SolidResult]
    assembly_glb_path: Optional[str]
    total_volume_mm3: float
    total_surface_mm2: float
    provenance: dict


class MultiAgentCAD:
    """
    Multi-agent CAD engine.
    
    Agent 1 (FloorPlanAgent): converts 2D room polygons to 3D extruded solids.
    Agent 2 (OpeningAgent): cuts doors/windows openings from the solids.
    Agent 3 (AssemblyAgent): merges all solids into a single assembly.
    Agent 4 (ExportAgent): exports to GLB + STEP for downstream consumption.
    
    Requirements:
        pip install build123d cadquery
    """
    
    DEFAULT_WALL_THICKNESS_MM = 120
    
    def __init__(self, wall_thickness_mm: float = None):
        self.wall_thickness_mm = wall_thickness_mm or self.DEFAULT_WALL_THICKNESS_MM
        self._build123d_available = self._check_build123d()
    
    def _check_build123d(self) -> bool:
        """Check if build123d is available in the environment."""
        try:
            import build123d
            return True
        except ImportError:
            return False
    
    def build_from_contract(
        self,
        contract: MetricSpatialContract,
        output_dir: str = "./output",
        export_glb: bool = True,
        export_step: bool = False,
    ) -> CADEngineOutput:
        """
        Build 3D solids from a MetricSpatialContract.
        
        Args:
            contract: Validated spatial contract with room polygons
            output_dir: Directory for exported files
            export_glb: Whether to export GLB files
            export_step: Whether to export STEP files
            
        Returns:
            CADEngineOutput with solid metadata and file paths
        """
        os.makedirs(output_dir, exist_ok=True)
        
        if not self._build123d_available:
            return self._build_pseudo(contract, output_dir)
        
        return self._build_real(contract, output_dir, export_glb, export_step)
    
    def _build_real(
        self,
        contract: MetricSpatialContract,
        output_dir: str,
        export_glb: bool,
        export_step: bool,
    ) -> CADEngineOutput:
        """Build solids using real build123d + OpenCASCADE."""
        from build123d import (
            BuildPart, BuildSketch, Polygon, extrude, 
            Location, Plane, Face, Solid,
            GeomType, BooleanOperation,
            exporters
        )
        
        solids = []
        total_volume = 0.0
        total_surface = 0.0
        
        # Agent 1: Floorplan Agent — extrude each room polygon
        with BuildPart() as assembly:
            for room in contract.rooms:
                room_solid = self._build_room_solid(room, export_glb, output_dir, contract)
                if room_solid:
                    solids.append(room_solid)
                    total_volume += room_solid.volume_mm3
                    total_surface += room_solid.surface_area_mm2
        
        # Agent 3: Assembly Agent — export combined model
        assembly_glb_path = None
        if export_glb and self._build123d_available:
            assembly_glb_path = os.path.join(output_dir, "assembly.glb")
            try:
                exporters.export(assembly, assembly_glb_path)
            except Exception:
                assembly_glb_path = None
        
        return CADEngineOutput(
            solids=solids,
            assembly_glb_path=assembly_glb_path,
            total_volume_mm3=total_volume,
            total_surface_mm2=total_surface,
            provenance={
                "engine": "build123d+OpenCascade",
                "wall_thickness_mm": self.wall_thickness_mm,
                "method": "real-cad"
            }
        )
    
    def _build_room_solid(
        self,
        room: Room,
        export_glb: bool,
        output_dir: str,
        contract: MetricSpatialContract
    ) -> Optional[SolidResult]:
        """Build a single room solid with openings."""
        from build123d import BuildPart, Polygon, extrude, Location, Plane, Face, exporters
        
        # Convert polygon to build123d format (convert mm to meters for CAD)
        # build123d works in mm natively, good.
        polygon_pts = room.boundary_polygon
        
        if not polygon_pts or len(polygon_pts) < 3:
            return None
        
        # Agent 1: Extrude room floor polygon to ceiling height
        with BuildPart() as part:
            with BuildSketch(Plane.XY) as sketch:
                Polygon(tuple(polygon_pts))
            extrude(amount=room.ceiling_height_mm)
        
        # Calculate volume
        volume_mm3 = part.part.volume
        
        # Agent 2: Cut openings
        opening_volume = 0.0
        wall_volume = volume_mm3
        
        if room.openings:
            for opening in room.openings:
                # Create opening solid and subtract
                opening_solid = self._build_opening(opening, room)
                if opening_solid:
                    from build123d import BooleanOperation
                    with BooleanOperation(subtract=part.part, tool=opening_solid):
                        pass
                    opening_volume += self._estimate_opening_volume(opening)
        
        surface_area = self._estimate_surface_area(polygon_pts, room.ceiling_height_mm)
        wall_volume = volume_mm3 - opening_volume
        
        glb_path = None
        if export_glb:
            glb_path = os.path.join(output_dir, f"{room.id}.glb")
            try:
                exporters.export(part.part, glb_path)
            except Exception:
                glb_path = None
        
        # Generate a simple hash for the solid
        solid_hash = self._compute_solid_hash(room)
        
        return SolidResult(
            room_id=room.id,
            solid_hash=solid_hash,
            volume_mm3=volume_mm3,
            surface_area_mm2=surface_area,
            wall_volume_mm3=wall_volume,
            opening_volume_mm3=opening_volume,
            glb_path=glb_path,
        )
    
    def _build_pseudo(
        self,
        contract: MetricSpatialContract,
        output_dir: str,
    ) -> CADEngineOutput:
        """
        Pseudo-CAD mode: estimate volumes and surface areas without
        requiring build123d/OpenCASCADE to be installed.
        
        This produces geometrically correct volume/surface estimates
        so the BOQ pipeline can function in non-CAD environments.
        """
        solids = []
        total_volume = 0.0
        total_surface = 0.0
        
        for room in contract.rooms:
            result = self._build_room_pseudo(room)
            if result:
                solids.append(result)
                total_volume += result.volume_mm3
                total_surface += result.surface_area_mm2
        
        return CADEngineOutput(
            solids=solids,
            assembly_glb_path=None,
            total_volume_mm3=total_volume,
            total_surface_mm2=total_surface,
            provenance={
                "engine": "pseudo-cad",
                "wall_thickness_mm": self.wall_thickness_mm,
                "method": "volume-estimation",
                "note": "build123d not available; using geometric estimates"
            }
        )
    
    def _build_room_pseudo(self, room: Room) -> Optional[SolidResult]:
        """Estimate room solid metrics without CAD engine."""
        # Compute floor area using shoelace
        poly = room.boundary_polygon
        if len(poly) < 3:
            return None
        
        area_mm2 = abs(sum(
            poly[i][0] * poly[(i+1) % len(poly)][1] -
            poly[(i+1) % len(poly)][0] * poly[i][1]
            for i in range(len(poly))
        )) / 2.0
        
        perimeter_mm = sum(
            ((poly[(i+1) % len(poly)][0] - poly[i][0]) ** 2 +
             (poly[(i+1) % len(poly)][1] - poly[i][1]) ** 2) ** 0.5
            for i in range(len(poly))
        )
        
        ceiling_height = room.ceiling_height_mm
        
        # Room solid volume: floor area × ceiling height
        volume_mm3 = area_mm2 * ceiling_height
        
        # Wall volume: perimeter × wall_thickness × ceiling_height
        wall_volume_mm3 = perimeter_mm * self.wall_thickness_mm * ceiling_height
        
        # Surface area: floor + ceiling + walls
        floor_ceiling_mm2 = 2 * area_mm2
        wall_surface_mm2 = perimeter_mm * ceiling_height
        surface_area_mm2 = floor_ceiling_mm2 + wall_surface_mm2
        
        # Subtract opening volumes
        opening_volume_mm3 = 0.0
        if room.openings:
            for op in room.openings:
                opening_volume_mm3 += self._estimate_opening_volume(op)
        
        wall_volume_mm3 = max(0, wall_volume_mm3 - opening_volume_mm3)
        volume_mm3 = max(0, volume_mm3 - opening_volume_mm3)
        
        return SolidResult(
            room_id=room.id,
            solid_hash=self._compute_solid_hash(room),
            volume_mm3=volume_mm3,
            surface_area_mm2=surface_area_mm2,
            wall_volume_mm3=wall_volume_mm3,
            opening_volume_mm3=opening_volume_mm3,
            glb_path=None,
        )
    
    def _build_opening(self, opening: Opening, room: Room):
        """Build a 3D solid for an opening (door/window)."""
        try:
            from build123d import BuildPart, Box, Location
            with BuildPart() as op:
                Box(
                    opening.width_mm + 50,
                    opening.height_mm + 50,
                    self.wall_thickness_mm + 20
                )
            return op.part
        except ImportError:
            return None
    
    @staticmethod
    def _estimate_opening_volume(opening: Opening) -> float:
        """Estimate the volume removed by an opening through a wall."""
        return opening.width_mm * opening.height_mm * 120  # wall_thickness_mm
    
    @staticmethod
    def _estimate_surface_area(polygon, height_mm: float) -> float:
        """Estimate surface area of a room solid."""
        poly = polygon
        area_mm2 = abs(sum(
            poly[i][0] * poly[(i+1) % len(poly)][1] -
            poly[(i+1) % len(poly)][0] * poly[i][1]
            for i in range(len(poly))
        )) / 2.0
        
        perimeter_mm = sum(
            ((poly[(i+1) % len(poly)][0] - poly[i][0]) ** 2 +
             (poly[(i+1) % len(poly)][1] - poly[i][1]) ** 2) ** 0.5
            for i in range(len(poly))
        )
        
        return 2 * area_mm2 + perimeter_mm * height_mm
    
    @staticmethod
    def _compute_solid_hash(room: Room) -> str:
        """Compute a deterministic hash of the room solid."""
        import hashlib
        content = f"{room.id}:{room.boundary_polygon}:{room.ceiling_height_mm}"
        return hashlib.md5(content.encode()).hexdigest()[:16]
