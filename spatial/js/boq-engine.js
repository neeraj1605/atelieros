/* ============================================================
   PlanX BOQ Engine — TypeScript client-side BOQ calculator.
   
   Generates Indian-standard BOQ line items from CAD takeoff data.
   Synchronized in real-time with the Three.js GLTF viewer.
============================================================ */

export interface BOQItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitRateINR: number;
  totalINR: number;
}

export interface KitchenTakeoff {
  marine_ply_sqm: number;
  quartz_counter_sqm: number;
  base_length_mm: number;
}

export interface BOQResult {
  items: BOQItem[];
  grandTotalINR: number;
}

export class PlanXBOQEngine {
  /**
   * Calculate a kitchen BOQ from CAD takeoff metrics.
   * Uses Indian-standard rates and materials.
   */
  public calculateKitchenBOQ(takeoff: KitchenTakeoff): BOQResult {
    const items: BOQItem[] = [
      {
        id: "ply-carcass",
        category: "CARCASS",
        description: "18mm Marine Grade BWP Plywood (IS 710 certified)",
        quantity: takeoff.marine_ply_sqm,
        unit: "SQM",
        unitRateINR: 1950,
        totalINR: Math.round(takeoff.marine_ply_sqm * 1950),
      },
      {
        id: "shutter-acrylic",
        category: "SHUTTERS",
        description: "Anti-Scratch Acrylic Finish with 1mm Edge Banding",
        quantity: Number((takeoff.base_length_mm * 0.74 / 1000).toFixed(2)),
        unit: "SQM",
        unitRateINR: 2600,
        totalINR: Math.round((takeoff.base_length_mm * 0.74 / 1000) * 2600),
      },
      {
        id: "countertop-quartz",
        category: "COUNTERTOP",
        description: "20mm Polished Quartz Countertop with Edge Chamfering",
        quantity: takeoff.quartz_counter_sqm,
        unit: "SQM",
        unitRateINR: 5200,
        totalINR: Math.round(takeoff.quartz_counter_sqm * 5200),
      },
      {
        id: "hardware-tandem",
        category: "HARDWARE",
        description: "Soft-Close Tandem Drawer Channels (1 per 600mm)",
        quantity: Math.ceil(takeoff.base_length_mm / 600),
        unit: "UNITS",
        unitRateINR: 4200,
        totalINR: Math.ceil(takeoff.base_length_mm / 600) * 4200,
      },
    ];

    const grandTotalINR = items.reduce((acc, curr) => acc + curr.totalINR, 0);
    return { items, grandTotalINR };
  }

  /**
   * Format a number as INR currency string.
   * e.g. 3670000 → "₹36,70,000"
   */
  public formatINR(value: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }
}
