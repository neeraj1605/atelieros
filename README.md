# AtelierFlow: Interior Architecture & Project Lifecycle OS

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Modern%20Web-blue.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20HTML%2FCSS%2FJS)-green.svg)]()

> **AtelierFlow** is a unified operating system mapping the complete interior architecture project journey across four interconnected pillars: **Product Discovery (FF&E)** ➔ **Design & Spatial Mapping** ➔ **Commercial & Procurement** ➔ **Project Management & Execution**.

---

## 🏛️ The 4 Core Pillars

```
                                  ATELIERFLOW LIFECYCLE MAP
                                  
  [1. Product Discovery]  ──►  [2. Design & Spatial]  ──►  [3. Commercial]     ──►  [4. Project Mgmt]
  • FF&E Catalog (16+ Items)   • 2D Scaled Floorplan        • Dynamic BOQ / Matrix       • 7-Phase Gantt Timeline
  • Interactive Moodboard      • Furniture Footprints       • Trade vs Client Pricing    • Multi-Trade Kanban
  • Sample Tracker             • Room-by-Room Schedules     • Spec Sheet / Cut Sheets    • Defect Snagging Pins
  • Custom Product Creator     • 3D Concept Hotspot Pins    • PO & Procurement Pipeline  • Turnkey Handover Sign
                                             │                          │
                                             └──────────┬───────────────┘
                                                        ▼
                                          Unified Data & State Engine
                                       (Auto-save, Export, Project JSON)
```

---

### 1. Product Discovery & FF&E Curation
- **Curated Specifications**: Filterable by Room, Category (*Seating, Tables, Lighting, Millwork, Textiles, Sanitaryware, Art*), and Style (*Japandi Modern, Mid-Century, Contemporary*).
- **Interactive Freeform Moodboard Studio**: Freeform canvas with draggable cutouts, rotation, concepts, and an automatically extracted 6-tone architectural color palette.
- **Physical Sample Tracker**: Track stone tiles, wood veneers, fabrics, and metal finishes with studio shelf locations and client sign-offs.
- **Custom Product Builder**: Add custom bespoke FF&E items.

### 2. Design & Spatial Mapping
- **2D Scaled Floorplan (1:50)**: Pre-mapped penthouse layout rendering 6 architectural spaces (*Great Room, Dining Pavilion, Master Suite, Chef's Kitchen, Executive Study, Terrace*).
- **Interactive Furniture Footprints**: Draggable items with 45° rotation steps and live spec inspection.
- **Circulation & Clearance Layer**: Visualizes 900mm circulation and walkway clearance corridors.
- **3D Render Gallery with Client Review Hotspots**: Pin-drop feedback threads directly on photorealistic renders.

### 3. Commercial & Procurement Engine
- **Dynamic Bill of Quantities (BOQ)**: Live matrix with editable quantity and trade markup fields.
- **Client Presentation Mode**: Instant 1-click toggle to conceal trade costs, wholesale vendor margins, and internal markups.
- **Architectural Spec Sheets (Cut Sheets)**: Standardized, printable/PDF-ready specification cut sheets with high-res imagery and signature blocks.
- **Purchase Order (PO) Pipeline**: Vendor order tracking with 50% deposit and delivery milestones.

### 4. Project Management & Turnkey Execution
- **7-Phase Gantt Timeline**: Sequential architectural phases with interactive milestone checklists.
- **Multi-Trade Kanban Execution Board**: Organize Joiners, Electricians, Stone Masons, Painters, and Stylists across *Backlog, To Do, In Progress, Quality Review, and Completed*.
- **Site Snagging / Defect Punch List**: Defect pins on floorplans with contractor assignment and severity tracking (*Critical, Major, Minor, Cosmetic*).
- **White-Glove Turnkey Handover Protocol**: Commissioning checklist and an **HTML5 Canvas Digital Signature Pad** for client sign-off.

---

## 🚀 Getting Started

AtelierFlow has **zero dependencies** and requires no build tools or package managers:

1. Clone the repository:
   ```bash
   git clone https://github.com/neeraj1605/atelieros.git
   ```
2. Double click `index.html` or open it directly in any browser:
   ```bash
   start index.html
   ```

---

## 💻 Tech Stack
- **Architecture**: Modern HTML5, ES6 Modules / Standalone Bundle
- **Styling**: Vanilla CSS Design System with CSS custom properties, glassmorphism, and print media queries
- **Canvas Engines**: Scaled HTML5 2D Floorplan Canvas, Freeform Moodboard Canvas, and Digital Signature Canvas
- **Storage**: `localStorage` auto-sync and portable JSON export/import
