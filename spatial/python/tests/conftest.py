"""
Tests for the Planex Tier-1 spatial pipeline.
Run with: python -m pytest spatial/python/tests/ -v
Or with:  python -m pytest spatial/python/tests/ --tb=short
"""
import json
import os
import sys
import numpy as np

# Ensure the spatial/python directory is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from spatial_contract import (
    MetricSpatialContract, Room, Opening, ContractSource, Provenance,
    new_contract, room_id, validate_contract, CONTRACT_VERSION, COORDINATE_SYSTEM
)
from engines.layoutlens import LayoutLensEngine
from engines.multicadf import MultiAgentCAD
from engines.erp_boq import BOQEngine, BOQCategory, BOQUnit