"""
OpenConstructionERP Takeoff & BOQ Engine (Engine 3)

Indian modular ergonomics-based material takeoff and
GST-ready Bill of Quantities (BOQ) generation.

Produces line-item BOQs in INR with Indian standard sizes
for brickwork, plaster, flooring, false ceiling, joinery, etc.
"""
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
import json

from .. import MetricSpatialContract, Room
from ..engines.multicadf import SolidResult


class BOQCategory(Enum):
    BRICKWORK = "brickwork"
    PLASTER = "plaster"
    FLOORING = "flooring"
    CEILING = "ceiling"
    PAINTING = "painting"
    JOINERY = "joinery"
    ELECTRICAL = "electrical"
    PLUMBING = "plumbing"
    HVAC = "hvac"
    FIXTURES = "fixtures"


class BOQUnit(Enum):
    SQFT = "sqft"
    SQMT = "sqm"
    CUM = "cum"
    EA = "ea"
    LM = "lm"  # linear metre


@dataclass
class BOQLineItem:
    """A single line item in the BOQ."""
    category: BOQCategory
    description: str
    unit: str
    quantity: float
    unit_rate_inr: float
    total_inr: float
   gst_rate: float = 18.0  # Default 18% GST
    gst_amount: float = 0.0
    metadata: dict = field(default_factory=dict)
    
    def __post_init__(self):
        self.gst_amount = self.total_inr * self.gst_rate / 100.0
        if self.gst_amount == 0:
            self.gst_amount = self.total_inr * 18.0 / 100.0


@dataclass
class TakeoffResult:
    """Material takeoff for a single room."""
    room_id: str
    surface_areas: dict  # wall, floor, ceiling, ceiling_drop
    volumes: dict  # brickwork, plaster, concrete
    linear_runs: dict  # skirting, dado, cornice
    openings_takeoff: list  # door/window count + sizes


@dataclass
class BOQSummary:
    """Complete BOQ output."""
    project_id: str
    items: list[BOQLineItem]
    subtotal_excl_gst: float
    total_gst: float
    total_incl_gst: float
    currency: str
    takeoffs: dict  # room_id -> TakeoffResult
    metadata: dict


class IndianErgonomics:
    """
    Indian modular construction standards & ergonomics.
    
    Reference dimensions (mm) from IS 456, IS 2526, IS 14863,
    and standard Indian architectural practices:
    """
    
    # Wall construction
    WALL_THICKNESS_OPTIONS = [100, 115, 150, 200, 230, 300]  # mm brick/module sizes
    BRICK_SIZE_MM = (190, 90, 57)  # Standard modular brick 190x90x57mm
    BRICK_MORTAR_JOINT = 10  # mm
    
    # Plaster
    PLASTER_THICKNESS_MM = 12  # mm (internal)
    PLASTER_EXTERNAL_MM = 18  # mm (external)
    
    # Flooring
    TILE_SIZES_MM = [300, 600, 900]  # Common tile sizes
    VINYL_PLANK_MM = (100, 1200, 1810)  # Thickness x Width x Length
    
    # Ceiling
    FALSE_CEILING_GRID_MM = 600  # Module grid
    CEILING_DROP_MM = 2400  # Standard false ceiling height from floor
    
    # Openings
    DOOR_STANDARD_HEIGHT_MM = 2100
    DOOR_STANDARD_WIDTHS_MM = [750, 800, 825, 900]
    WINDOW_STANDARD_HEIGHTS_MM = [1200, 1500, 1800]
    WINDOW_SILL_HEIGHT_MM = 900  # From floor to window sill
    
    # Indian room proportions
    MIN_CORRIDOR_WIDTH_MM = 900
    MIN_ROOM_WIDTH_MM = 2400
    
    # Rates (INR per unit) - indicative; override per project
    DEFAULT_RATES = {
        BOQCategory.BRICKWORK: {
            "9\"x4.5\"x230mm": 115.0,  # INR per cum
            "4\"x4.5\"x115mm": 75.0,
        },
        BOQCategory.PLASTER: {
            "12mm internal": 28.0,  # INR per sqft
            "18mm external": 38.0,
        },
        BOQCategory.FLOORING: {
            "vitrified 24x24": 180.0,  # INR per sqft
            "vitrified 12x12": 160.0,
            "vinyl plank": 320.0,
        },
        BOQCategory.CEILING: {
            "gypsum 2ftx2ft": 120.0,  # INR per sqft
        },
        BOQCategory.PAINTING: {
            "emulsion internal": 32.0,  # INR per sqft
            "acrylic external": 45.0,
        },
        BOQCategory.JOINERY: {
            "flush door": 3200.0,  # INR per ea
            "frameless glass": 4500.0,  # INR per sqft
        },
        BOQCategory.ELECTRICAL: {
            "light point": 1600.0,  # INR per point
            "socket": 950.0,
            "switch": 350.0,
        },
        BOQCategory.PLUMBING: {
            "fixture": 5000.0,  # INR per ea
        },
        BOQCategory.FIXTURES: {
            "vanity": 8000.0,
            "mirror": 2500.0,
        },
    }


class TakeoffEngine:
    """
    Takeoff engine: converts spatial contract + CAD solids into
    material quantities using Indian modular standards.
    """
    
    MM2_TO_SQFT = 0.0000107639
    MM3_TO_CUM = 1e-9
    
    def __init__(self, ergonomics: Optional[IndianErgonomics] = None):
        self.ergs = ergonomics or IndianErgonomics()
    
    def takeoff_room(
        self,
        room: Room,
        solid: Optional[SolidResult] = None
    ) -> TakeoffResult:
        """Calculate material takeoff for a single room."""
        poly = room.boundary_polygon
        ceil_h = room.ceiling_height_mm
        floor_elev = room.floor_elevation_mm or 0
        
        # Compute room metrics
        floor_area_mm2 = abs(sum(
            poly[i][0] * poly[(i+1) % len(poly)][1] -
            poly[(i+1) % len(poly)][0] * poly[i][1]
            for i in range(len(poly))
        )) / 2.0
        
        perimeter_mm = sum(
            ((poly[(i+1) % len(poly)][0] - poly[i][0]) ** 2 +
             (poly[(i+1) % len(poly)][1] - poly[i][1]) ** 2) ** 0.5
            for i in range(len(poly))
        )
        
        wall_area_mm2 = perimeter_mm * ceil_h
        
        # Convert to sqft
        floor_area_sqft = floor_area_mm2 * self.MM2_TO_SQFT
        wall_area_sqft = wall_area_mm2 * self.MM2_TO_SQFT
        
        # Volumes
        brickwork_volume = (perimeter_mm - 900) * ceil_h * \
            self.ergs.BRICK_MORTAR_JOINT * self.MM3_TO_CUM if perimeter_mm > 900 else 0
        
        # Ceiling area (same as floor for rooms with flat ceiling)
        ceiling_area_sqft = floor_area_sqft
        ceiling_area_mm2 = floor_area_mm2
        
        # Openings takeoff
        door_count = 0
        window_count = 0
        opening_areas = {"doors": 0.0, "windows": 0.0}
        door_list = []
        window_list = []
        
        if room.openings:
            for op in room.openings:
                if op.type == "door":
                    door_count += 1
                    door_list.append({"w": op.width_mm, "h": op.height_mm})
                    opening_areas["doors"] += op.width_mm * op.height_mm
                elif op.type == "window":
                    window_count += 1
                    window_list.append({"w": op.width_mm, "h": op.height_mm})
                    opening_areas["windows"] += op.width_mm * op.height_mm
        
        # Deduct openings from wall area
        net_wall_area_sqft = wall_area_sqft - opening_areas["doors"] * self.MM2_TO_SQFT - \
                             opening_areas["windows"] * self.MM2_TO_SQFT
        
        return TakeoffResult(
            room_id=room.id,
            surface_areas={
                "floor_mm2": floor_area_mm2,
                "floor_sqft": floor_area_sqft,
                "wall_mm2": wall_area_mm2,
                "wall_sqft": wall_area_sqft,
                "net_wall_sqft": net_wall_area_sqft,
                "ceiling_mm2": ceiling_area_mm2,
                "ceiling_sqft": ceiling_area_sqft,
            },
            volumes={
                "brickwork_cum": brickwork_volume,
                "plaster_cum": brickwork_volume * 0.012,  # 12mm plaster
            },
            linear_runs={
                "perimeter_mm": perimeter_mm,
                "skirting_lm": perimeter_mm * 0.001,
                "wall_run_mm": perimeter_mm,
            },
            openings_takeoff=[
                {"type": "doors", "count": door_count, "items": door_list},
                {"type": "windows", "count": window_count, "items": window_list},
            ]
        )


class BOQEngine:
    """
    Generates GST-ready Bill of Quantities from takeoffs.
    """
    
    def __init__(self, rates: Optional[dict] = None):
        self.ergs = IndianErgonomics()
        self.takeoff = TakeoffEngine(self.ergs)
        self.rates = rates or IndianErgonomics.DEFAULT_RATES
    
    def generate_boq(
        self,
        contract: MetricSpatialContract,
        solids: Optional[dict] = None,
        project_id: str = "default",
        finish_grade: str = "premium",
    ) -> BOQSummary:
        """
        Generate a complete BOQ from a spatial contract.
        
        Args:
            contract: Validated spatial contract
            solids: Optional dict of room_id -> SolidResult
            project_id: Project identifier
            finish_grade: 'economy' | 'standard' | 'premium'
            
        Returns:
            BOQSummary with items, totals, and takeoff data
        """
        items = []
        takeoffs = {}
        subtotal = 0.0
        total_gst = 0.0
        
        for room in contract.rooms:
            solid = solids.get(room.id) if solids else None
            takeoff = self.takeoff.takeoff_room(room, solid)
            takeoffs[room.id] = takeoff
            
            room_items = self._generate_room_items(room, takeoff, finish_grade)
            for item in room_items:
                items.append(item)
                subtotal += item.total_inr
                total_gst += item.gst_amount
        
        return BOQSummary(
            project_id=project_id,
            items=items,
            subtotal_excl_gst=subtotal,
            total_gst=total_gst,
            total_incl_gst=subtotal + total_gst,
            currency="INR",
            takeoffs=takeoffs,
            metadata={
                "finish_grade": finish_grade,
                "er_standards": ["IS 456", "IS 2526", "IS 14863"],
                "generated_at": self._timestamp(),
            }
        )
    
    def _generate_room_items(
        self,
        room: Room,
        takeoff: TakeoffResult,
        finish_grade: str
    ) -> list[BOQLineItem]:
        """Generate BOQ line items for a single room."""
        items = []
        sa = takeoff.surface_areas
        vr = takeoff.volumes
        lr = takeoff.linear_runs
        
        rate_multiplier = {"economy": 0.8, "standard": 1.0, "premium": 1.3}[finish_grade]
        
        # 1. Flooring — vitrified tiles (24x24)
        tile_rate = self.rates[BOQCategory.FLOORING]["vitrified 24x24"] * rate_multiplier
        items.append(BOQLineItem(
            category=BOQCategory.FLOORING,
            description=f"Vitrified floor tiles 24\"x24\", {finish_grade} finish - {room.id}",
            unit=BOQUnit.SQFT.value,
            quantity=sa["floor_sqft"],
            unit_rate_inr=round(tile_rate, 2),
            total_inr=round(sa["floor_sqft"] * tile_rate, 2),
        ))
        
        # 2. Skirting
        skirting_rate = 120.0 * rate_multiplier
        items.append(BOQLineItem(
            category=BOQCategory.FLOORING,
            description=f"Vitrified skirting 4\"x24\", {finish_grade} finish - {room.id}",
            unit=BOQUnit.LM.value,
            quantity=lr["skirting_lm"],
            unit_rate_inr=round(skirting_rate, 2),
            total_inr=round(lr["skirting_lm"] * skirting_rate, 2),
        ))
        
        # 3. Internal wall plaster (12mm)
        plaster_rate = self.rates[BOQCategory.PLASTER]["12mm internal"] * rate_multiplier
        items.append(BOQLineItem(
            category=BOQCategory.PLASTER,
            description=f"Cement plaster 12mm, internal walls - {room.id}",
            unit=BOQUnit.SQFT.value,
            quantity=sa["net_wall_sqft"],
            unit_rate_inr=round(plaster_rate, 2),
            total_inr=round(sa["net_wall_sqft"] * plaster_rate, 2),
        ))
        
        # 4. Internal painting (emulsion)
        paint_rate = self.rates[BOQCategory.PAINTING]["emulsion internal"] * rate_multiplier
        items.append(BOQLineItem(
            category=BOQCategory.PAINTING,
            description=f"Emulsion paint 2 coats, internal walls & ceiling - {room.id}",
            unit=BOQUnit.SQFT.value,
            quantity=sa["wall_sqft"] + sa["ceiling_sqft"],
            unit_rate_inr=round(paint_rate, 2),
            total_inr=round((sa["wall_sqft"] + sa["ceiling_sqft"]) * paint_rate, 2),
        ))
        
        # 5. Brickwork for new walls (if applicable)
        if vr["brickwork_cum"] > 0:
            brick_rate = self.rates[BOQCategory.BRICKWORK]["9\"x4.5\"x230mm"] * rate_multiplier
            items.append(BOQLineItem(
                category=BOQCategory.BRICKWORK,
                description=f"9\"x4.5\" brickwork 230mm thick - {room.id}",
                unit=BOQUnit.CUM.value,
                quantity=vr["brickwork_cum"],
                unit_rate_inr=round(brick_rate, 2),
                total_inr=round(vr["brickwork_cum"] * brick_rate, 2),
            ))
        
        # 6. False ceiling (gypsum)
        ceiling_rate = self.rates[BOQCategory.CEILING]["gypsum 2ftx2ft"] * rate_multiplier
        items.append(BOQLineItem(
            category=BOQCategory.CEILING,
            description=f"Gypsum board false ceiling 2ftx2ft, {finish_grade} - {room.id}",
            unit=BOQUnit.SQFT.value,
            quantity=sa["ceiling_sqft"],
            unit_rate_inr=round(ceiling_rate, 2),
            total_inr=round(sa["ceiling_sqft"] * ceiling_rate, 2),
        ))
        
        # 7. Doors
        openings = takeoff.openings_takeoff
        for grp in openings:
            if grp["type"] == "doors":
                for door in grp["items"]:
                    width_category = self._classify_door_width(door["w"])
                    door_rate = self.rates[BOQCategory.JOINERY]["flush door"] * rate_multiplier
                    items.append(BOQLineItem(
                        category=BOQCategory.JOINERY,
                        description=f"Flush door {width_category}, {finish_grade} - {room.id}",
                        unit=BOQUnit.EA.value,
                        quantity=1,
                        unit_rate_inr=round(door_rate, 2),
                        total_inr=round(door_rate, 2),
                    ))
        
        # 8. Windows
        for grp in openings:
            if grp["type"] == "windows":
                for win in grp["items"]:
                    win_rate = 550.0 * rate_multiplier  # INR per sqft for aluminium windows
                    win_area_sqft = (win["w"] * win["h"]) * self.MM2_TO_SQFT
                    items.append(BOQLineItem(
                        category=BOQCategory.JOINERY,
                        description=f"Aluminium window {int(win['w']/1000)}x{int(win['h']/1000)}m - {room.id}",
                        unit=BOQUnit.SQFT.value,
                        quantity=win_area_sqft,
                        unit_rate_inr=round(win_rate, 2),
                        total_inr=round(win_area_sqft * win_rate, 2),
                    ))
        
        return items
    
    @staticmethod
    def _classify_door_width(width_mm: float) -> str:
        """Classify door width to Indian standard categories."""
        e = IndianErgonomics()
        for w in e.DOOR_STANDARD_WIDTHS_MM:
            if abs(width_mm - w) < 50:
                return f"{w}mm"
        return f"{int(round(width_mm / 25) * 25)}mm"
    
    @staticmethod
    def _timestamp() -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
    
    def to_dict(self, summary: BOQSummary) -> dict:
        """Convert BOQ summary to JSON-serializable dict."""
        return {
            "project_id": summary.project_id,
            "currency": summary.currency,
            "items": [
                {
                    "category": item.category.value,
                    "description": item.description,
                    "unit": item.unit,
                    "quantity": round(item.quantity, 2),
                    "unit_rate_inr": item.unit_rate_inr,
                    "total_inr": item.total_inr,
                    "gst_rate": item.gst_rate,
                    "gst_amount": round(item.gst_amount, 2),
                    "metadata": item.metadata
                }
                for item in summary.items
            ],
            "subtotal_excl_gst": round(summary.subtotal_excl_gst, 2),
            "total_gst": round(summary.total_gst, 2),
            "total_incl_gst": round(summary.total_incl_gst, 2),
            "metadata": summary.metadata
        }
