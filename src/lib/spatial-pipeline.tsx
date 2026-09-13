/* ============================================================
   Planex Spatial Pipeline — React Integration
   
   Connects the Next.js + Three.js viewer with the spatial contract
   layer and the real-time BOQ ledger.
============================================================ */

import { useEffect, useRef, useState } from 'react';
import { SpatialViewer } from './components/SpatialViewer';
import { layoutToContract, createKernel } from '../lib/spatial-bridge';
import type { MetricSpatialContract } from '../lib/spatial-bridge';

export interface BOQLineItem {
  category: string;
  description: string;
  unit: string;
  quantity: number;
  unit_rate_inr: number;
  total_inr: number;
  gst_amount: number;
}

export interface BOQSummary {
  project_id: string;
  items: BOQLineItem[];
  subtotal_excl_gst: number;
  total_gst: number;
  total_incl_gst: number;
}

export function SpatialPipeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SpatialViewer | null>(null);
  const [boq, setBoq] = useState<BOQSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the 3D viewer
  useEffect(() => {
    if (!canvasRef.current) return;

    viewerRef.current = new SpatialViewer({
      canvas: canvasRef.current,
      enableControls: true,
      autoRotate: false,
      backgroundColor: 0x0f0f1a,
    });

    viewerRef.current.animate();

    return () => {
      viewerRef.current?.stop();
    };
  }, []);

  // Handle room selection from BOQ
  const handleRoomSelect = (roomId: string) => {
    viewerRef.current?.highlightRoom(roomId, true);
    setTimeout(() => {
      viewerRef.current?.highlightRoom(roomId, false);
    }, 2000);
  };

  // Handle layout-to-contract conversion
  const handleLayoutConvert = async (layout: {
    widthM: number;
    heightM: number;
    rooms: Array<{
      name: string;
      x: number; y: number;
      w: number; h: number;
      ceilingHeight?: number;
    }>;
  }) => {
    setLoading(true);
    try {
      const result = layoutToContract({
        source: { kind: 'manual' },
        provenance: { measured_by: 'hybrid' },
        ...layout,
      });

      if (!result.validation.valid) {
        setError(result.validation.errors.map(e => e.message).join('; '));
      } else {
        setError(null);
        // Build the 3D scene from the contract
        viewerRef.current?.buildFromLayout(layout);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // Handle GLB load from CAD engine
  const handleLoadGLB = async (url: string, roomId: string) => {
    setLoading(true);
    try {
      await viewerRef.current?.loadGLB(url, roomId);
    } catch (e) {
      setError(`Failed to load GLB: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync BOQ with the 3D viewer
  const syncBOQWithViewer = (summary: BOQSummary) => {
    setBoq(summary);
    // Update each room's price visualization
    if (viewerRef.current) {
      // The BOQ items are synced to rooms via the mesh data
      // This would be wired to specific room IDs in a full implementation
    }
  };

  return {
    // DOM elements
    canvasRef,
    // Actions
    handleLayoutConvert,
    handleLoadGLB,
    handleRoomSelect,
    syncBOQWithViewer,
    // State
    loading,
    error,
    boq,
    viewer: viewerRef.current,
  };
}

// Export standalone hooks for flexible composition
export function useSpatialPipeline() {
  return SpatialPipeline();
}
