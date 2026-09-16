"""
PlanX AI — Production Spatial Pipeline Engine

FastAPI service that ties together:
  1. LayoutLens (boundary extraction) 
  2. ParametricCADRunner (GLTF model generation)
  
Deploys the full image → GLTF → metrics pipeline for the frontend.
"""
import os
import sys

# Ensure spatial/python is on the path when running this file directly
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from engines.layoutlens_extractor import LayoutLensExtractor
from engines.parametric_cad import ParametricCADRunner
import uvicorn

app = FastAPI(title="PlanX AI - Production Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

extractor = LayoutLensExtractor()
cad_engine = ParametricCADRunner()


@app.post("/api/v1/generate-plan")
async def generate_plan(file: UploadFile = File(...), project_id: str = "project_demo"):
    """
    Full pipeline: floor plan image → spatial contract → 3D GLTF model + takeoff metrics.
    """
    content = await file.read()
    contract = extractor.extract_envelope(content, project_id=project_id)
    cad_result = cad_engine.build_kitchen(contract, base_length_mm=3200.0)

    return {
        "status": "SUCCESS",
        "room_contract": contract.dict(),
        "model_url": cad_result["gltf_url"],
        "takeoff_metrics": cad_result["metrics"]
    }


@app.get("/api/v1/status")
async def status():
    """Health check."""
    from datetime import datetime, timezone
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "engines": {
            "layoutlens": {"available": True, "method": extractor.method_name if hasattr(extractor, 'method_name') else "heuristic"},
            "cad": {"available": cad_engine._build123d_available, "mode": "build123d" if cad_engine._build123d_available else "pseudo"},
        }
    }


@app.get("/api/v1/info")
async def info():
    """Pipeline info and available room types."""
    return {
        "version": "1.0.0",
        "supported_room_types": ["living", "modular_kitchen", "master_bed", "pooja"],
        "supported_opening_types": ["door", "window", "opening", "arch", "balcony_slider"],
        "indian_standards": ["IS 456", "IS 2526", "IS 14863"],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
