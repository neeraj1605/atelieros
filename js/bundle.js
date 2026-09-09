// AtelierFlow - Standalone Self-Contained Bundle (Zero CORS / Offline Ready)
// Contains Data Seed, Reactive State Engine, Overview, Discovery, Design, Commercial, Project Management, and App Controller

(function () {
  'use strict';

  // --- 1. DATA SEED ---
  const initialProject = {
    id: "proj-belair-01",
    name: "The Bel-Air Penthouse",
    client: "Elena & Marcus Vance",
    code: "AT-2026-08",
    type: "Luxury Residential Architecture & Interior Fit-out",
    location: "1080 Bellagio Road, Bel-Air, Los Angeles, CA",
    targetBudget: 485000,
    currency: "USD",
    currencySymbol: "$",
    status: "Phase 5 - Procurement & Execution",
    startDate: "2026-02-15",
    handoverDate: "2026-11-28",
    leadArchitect: "Sienna Cole, AIA & Atelier Team",
    contractor: "Apex Luxury Construction Ltd.",
    totalAreaSqm: 385,
    totalAreaSqft: 4144,
    description: "A serene, Japandi-infused modern luxury sanctuary featuring custom fluted oak architectural millwork, honed Roman travertine, muted tactile textiles, and bespoke ambient lighting."
  };

  const initialRooms = [
    {
      id: "room-living",
      name: "Great Room & Lounge",
      code: "RM-101",
      sqft: 980,
      sqm: 91,
      ceilingHeight: "3.6m (11.8 ft)",
      orientation: "South-West (Sunset Light)",
      floorFinish: "Chevron Select Grade White Oak (Brushed Matte)",
      wallFinish: "Limewash Roman Plaster & Fluted White Oak Slats",
      ceilingFinish: "Acoustic Plaster with Recessed Linear LED Cove",
      color: "#C5A880",
      budgetAllocated: 145000,
      notes: "Floor-to-ceiling panoramic glass doors. Central travertine fireplace focal point."
    },
    {
      id: "room-dining",
      name: "Dining Pavilion",
      code: "RM-102",
      sqft: 480,
      sqm: 44.6,
      ceilingHeight: "3.6m (11.8 ft)",
      orientation: "South-East (Morning Light)",
      floorFinish: "Chevron White Oak with Honed Arabescato Marble Inlay",
      wallFinish: "Muted Silk Grasscloth Wallpaper",
      ceilingFinish: "Drop Coffered Ceiling with Brass Reveal",
      color: "#5E6858",
      budgetAllocated: 62000,
      notes: "Seats 10 guests. Central feature branch chandelier required."
    },
    {
      id: "room-master",
      name: "Master Sanctuary Suite",
      code: "RM-201",
      sqft: 750,
      sqm: 69.7,
      ceilingHeight: "3.2m (10.5 ft)",
      orientation: "East (Sunrise)",
      floorFinish: "Plush New Zealand Wool Carpet over Acoustic Underlay",
      wallFinish: "Upholstered Linen Acoustic Wall Panels & Smoked Walnut",
      ceilingFinish: "Warm White Matte (Chantilly Lace tone)",
      color: "#7E6B5D",
      budgetAllocated: 110000,
      notes: "Integrated acoustic wall panels behind king bed, walk-in dressing lounge access."
    },
    {
      id: "room-kitchen",
      name: "Chef's Kitchen & Nook",
      code: "RM-103",
      sqft: 520,
      sqm: 48.3,
      ceilingHeight: "3.4m (11.2 ft)",
      orientation: "North-West",
      floorFinish: "Large-Format Honed Travertine Pavers (900x900mm)",
      wallFinish: "Full Height Taj Mahal Quartzite Slab Splashback",
      ceilingFinish: "Recessed Architectural Spotlights (Cri 95+)",
      color: "#A47E5B",
      budgetAllocated: 85000,
      notes: "Concealed scullery door, custom fluted oak island with waterfall quartzite."
    },
    {
      id: "room-study",
      name: "Executive Study & Library",
      code: "RM-202",
      sqft: 360,
      sqm: 33.4,
      ceilingHeight: "3.2m (10.5 ft)",
      orientation: "North (Diffused Light)",
      floorFinish: "Chevron Select Grade White Oak",
      wallFinish: "Floor-to-Ceiling Smoked Walnut Bookcases with Integrated Brass Accent Lighting",
      ceilingFinish: "Deep Espresso Lacquer (Satin)",
      color: "#3F4A42",
      budgetAllocated: 48000,
      notes: "Acoustically isolated room for video conferences and private collection."
    },
    {
      id: "room-terrace",
      name: "Sunset Terrace & Solarium",
      code: "RM-301",
      sqft: 1054,
      sqm: 97.9,
      ceilingHeight: "Open Sky (Pergola)",
      orientation: "West (Panoramic Coastline View)",
      floorFinish: "Flamed Teak Decking with Porcelain Pavers",
      wallFinish: "Board-Formed Architectural Concrete",
      ceilingFinish: "Motorized Louvered Cedar Pergola",
      color: "#9E8268",
      budgetAllocated: 35000,
      notes: "Outdoor fire table, integrated perimeter planters, weather-resistant upholstery."
    }
  ];

  const initialProducts = [
    {
      id: "prod-01",
      name: "Kyoto Organic Curved Sofa",
      category: "Seating",
      room: "room-living",
      vendor: "Koto Living Atelier",
      vendorContact: "procurement@kotoliving.design",
      sku: "KLA-SF-904",
      style: "Japandi Modern",
      dimensions: { width: 2850, depth: 1120, height: 740, seatHeight: 420, unit: "mm" },
      finish: "Textured Bouclé (Oatmeal Cream) / Smoked Walnut Plinth",
      tradeCost: 6400,
      markupPercent: 35,
      clientPrice: 8640,
      quantity: 1,
      leadTimeWeeks: 8,
      sustainabilityScore: "Grade A (FSC certified timber, zero VOC foam)",
      procurementStatus: "In Production",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
      description: "Handcrafted sculptural curved sofa with ergonomic lumbar support, upholstered in heavy Italian bouclé with hidden floor glides.",
      careInstructions: "Professional dry extraction cleaning only. Fluff cushions bi-weekly.",
      floorplan: { x: 380, y: 240, width: 90, height: 45, rotation: 0 }
    },
    {
      id: "prod-02",
      name: "Pierre Jeanneret Floating Armchairs (Pair)",
      category: "Seating",
      room: "room-living",
      vendor: "Galerie Vespera",
      vendorContact: "orders@galerie-vespera.com",
      sku: "GV-PJ-44",
      style: "Mid-Century Modernist",
      dimensions: { width: 680, depth: 760, height: 750, seatHeight: 400, unit: "mm" },
      finish: "Solid Teak Frame / Hand-woven Cane / Off-white Linen Seat",
      tradeCost: 4200,
      markupPercent: 40,
      clientPrice: 5880,
      quantity: 2,
      leadTimeWeeks: 6,
      sustainabilityScore: "Grade A+ (Reclaimed plantation teak)",
      procurementStatus: "PO Issued",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      description: "Pair of iconic V-leg floating armchairs in hand-burnished aged teak with natural rattan backing.",
      careInstructions: "Dust cane with dry soft brush. Apply beeswax polish annually to wood.",
      floorplan: { x: 310, y: 310, width: 35, height: 35, rotation: 45 }
    },
    {
      id: "prod-03",
      name: "Bellagio Dining Armchairs (Set of 10)",
      category: "Seating",
      room: "room-dining",
      vendor: "Molteni & C Contract",
      vendorContact: "contract@molteni.it",
      sku: "MLT-BLG-10",
      style: "Contemporary Italian",
      dimensions: { width: 590, depth: 560, height: 810, seatHeight: 470, unit: "mm" },
      finish: "Nubuck Leather (Truffle Taupe) / Burnished Bronze Stiletto Legs",
      tradeCost: 9200,
      markupPercent: 30,
      clientPrice: 11960,
      quantity: 10,
      leadTimeWeeks: 10,
      sustainabilityScore: "Grade B+ (EU Ecolabel Leather)",
      procurementStatus: "Deposit Paid",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80",
      description: "Sleek dining armchairs wrapped in supple waterproof nubuck with curved lumbar wraps.",
      careInstructions: "Wipe with damp micro-cloth. Nubuck protector spray applied prior to delivery.",
      floorplan: { x: 740, y: 220, width: 80, height: 50, rotation: 0 }
    },
    {
      id: "prod-04",
      name: "Eames Executive Lounge Chair & Ottoman",
      category: "Seating",
      room: "room-study",
      vendor: "Herman Miller Authorised",
      vendorContact: "designers@hermanmiller.com",
      sku: "HM-EAM-670",
      style: "Modernist Classic",
      dimensions: { width: 850, depth: 850, height: 840, seatHeight: 420, unit: "mm" },
      finish: "Santos Palisander Rosewood / Edelman Royal Hide Leather (Espresso)",
      tradeCost: 5800,
      markupPercent: 25,
      clientPrice: 7250,
      quantity: 1,
      leadTimeWeeks: 4,
      sustainabilityScore: "Grade A (Greenguard Gold Certified)",
      procurementStatus: "Delivered",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80",
      description: "Authentic Herman Miller classic lounge chair in premium Santos Palisander veneer with black aluminum swivel base.",
      careInstructions: "Condition leather semi-annually. Protect from direct harsh UV sun.",
      floorplan: { x: 190, y: 460, width: 40, height: 40, rotation: -30 }
    },
    {
      id: "prod-05",
      name: "Honed Roman Travertine Monolith Coffee Table",
      category: "Tables",
      room: "room-living",
      vendor: "Marmi Stone Craft Studio",
      vendorContact: "atelier@marmistone.it",
      sku: "MSC-TRV-02",
      style: "Brutalist Warm Minimalist",
      dimensions: { width: 1500, depth: 850, height: 320, unit: "mm" },
      finish: "Unfilled Roman Navona Travertine (Honed Matte)",
      tradeCost: 4900,
      markupPercent: 40,
      clientPrice: 6860,
      quantity: 1,
      leadTimeWeeks: 7,
      sustainabilityScore: "Grade A (Natural quarry stone with zero synthetic resins)",
      procurementStatus: "In Production",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
      description: "Solid block monolithic low table with bullnose softened corners and architectural fluting along the pedestal base.",
      careInstructions: "Impregnated with Dry-Treat stain barrier. Wipe spills immediately. Use coasters.",
      floorplan: { x: 380, y: 290, width: 50, height: 30, rotation: 0 }
    },
    {
      id: "prod-06",
      name: "Brutalist Fluted Oak Dining Table (10-Seater)",
      category: "Tables",
      room: "room-dining",
      vendor: "Soren Holst Bespoke",
      vendorContact: "commissions@sorenholst.dk",
      sku: "SHB-DT-320",
      style: "Nordic Minimalist",
      dimensions: { width: 3200, depth: 1100, height: 750, unit: "mm" },
      finish: "Solid White Oak (Smoked Fumed Oil) / Twin Fluted Column Pedestals",
      tradeCost: 8800,
      markupPercent: 35,
      clientPrice: 11880,
      quantity: 1,
      leadTimeWeeks: 9,
      sustainabilityScore: "Grade A+ (PEFC Certified European Oak)",
      procurementStatus: "Deposit Paid",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80",
      description: "Monumental solid oak dining surface with softly beveled boat-shaped edges resting on twin fluted drum pedestals.",
      careInstructions: "Treat with Rubio Monocoat maintenance oil every 18 months.",
      floorplan: { x: 740, y: 220, width: 90, height: 40, rotation: 0 }
    },
    {
      id: "prod-07",
      name: "Calacatta Viola Marble Plinth Side Table",
      category: "Tables",
      room: "room-living",
      vendor: "Menu Design / Audo Copenhagen",
      vendorContact: "b2b@audocph.com",
      sku: "AUD-PLN-CV",
      style: "Contemporary Luxury",
      dimensions: { width: 400, depth: 400, height: 510, unit: "mm" },
      finish: "Honed Calacatta Viola Marble (Dramatic Purple/Burgundy Veins)",
      tradeCost: 1950,
      markupPercent: 35,
      clientPrice: 2632,
      quantity: 2,
      leadTimeWeeks: 3,
      sustainabilityScore: "Grade A (Natural Italian Marble)",
      procurementStatus: "PO Issued",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      description: "Geometric cubic plinth crafted from mitered slabs of rich Calacatta Viola marble with honed satin touch.",
      careInstructions: "Neutral pH cleaner only. Acidic beverages will etch surface.",
      floorplan: { x: 440, y: 240, width: 20, height: 20, rotation: 0 }
    },
    {
      id: "prod-08",
      name: "Metronome Sculptural Branch Chandelier",
      category: "Lighting",
      room: "room-dining",
      vendor: "Apparatus Studio New York",
      vendorContact: "concierge@apparatusstudio.com",
      sku: "APP-MET-BR7",
      style: "High Decorative Art",
      dimensions: { width: 1800, depth: 850, height: 1100, unit: "mm" },
      finish: "Tarnished Burnished Brass / Hand-blown Frosted Glass Orbs / Porcelain",
      tradeCost: 14500,
      markupPercent: 25,
      clientPrice: 18125,
      quantity: 1,
      leadTimeWeeks: 12,
      sustainabilityScore: "Grade A (Artisan hand-fabricated, LED 2700K Warm Dim)",
      procurementStatus: "In Production",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
      description: "Suspended mobile chandelier featuring counterbalanced brass arms and hand-blown translucent globes, custom drop rod.",
      careInstructions: "Wipe with micro-fiber cloth. Do not use chemical brass solvents.",
      floorplan: { x: 740, y: 220, width: 40, height: 40, rotation: 0 }
    },
    {
      id: "prod-09",
      name: "Akari 10A Washi Paper Floor Lantern",
      category: "Lighting",
      room: "room-living",
      vendor: "Vitra / Isamu Noguchi Foundation",
      vendorContact: "contract@vitra.com",
      sku: "VIT-AK-10A",
      style: "Japandi Organic",
      dimensions: { width: 530, depth: 530, height: 1230, unit: "mm" },
      finish: "Handmade Japanese Mulberry Washi Paper / Bamboo / Wire Legs",
      tradeCost: 1150,
      markupPercent: 35,
      clientPrice: 1552,
      quantity: 1,
      leadTimeWeeks: 2,
      sustainabilityScore: "Grade A+ (Renewable Mulberry Bark & Bamboo)",
      procurementStatus: "Client Approved",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
      description: "Original design by Isamu Noguchi, casting a soft poetic ambient glow through hand-pressed paper.",
      careInstructions: "Gently feather dust. Keep away from humid areas or heat vents.",
      floorplan: { x: 470, y: 320, width: 25, height: 25, rotation: 0 }
    },
    {
      id: "prod-10",
      name: "Custom Fluted White Oak Media Credenza",
      category: "Storage & Millwork",
      room: "room-living",
      vendor: "Atelier Woodcraft Bespoke",
      vendorContact: "stefan@atelierwoodcraft.com",
      sku: "AWB-MLW-101",
      style: "Architectural Millwork",
      dimensions: { width: 4200, depth: 550, height: 600, unit: "mm" },
      finish: "Crown Cut White Oak (Cerused Matte) / Shadowline Travertine Top",
      tradeCost: 18500,
      markupPercent: 30,
      clientPrice: 24050,
      quantity: 1,
      leadTimeWeeks: 10,
      sustainabilityScore: "Grade A (FSC certified timber, low emission adhesives)",
      procurementStatus: "In Production",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
      description: "Integrated floating credenza with touch-latch acoustic cloth doors for AV gear and continuous fluted timber fronts.",
      careInstructions: "Microfiber duster. Wipe with mild natural wood cleaner.",
      floorplan: { x: 380, y: 190, width: 110, height: 25, rotation: 0 }
    },
    {
      id: "prod-11",
      name: "Hand-Knotted High-Low Tibetan Wool Area Rug (4x5m)",
      category: "Textiles & Rugs",
      room: "room-living",
      vendor: "Cc-Tapis Bespoke Milano",
      vendorContact: "custom@cc-tapis.com",
      sku: "CCT-TIB-45",
      style: "Organic Geometric",
      dimensions: { width: 5000, depth: 4000, height: 18, unit: "mm" },
      finish: "Hand-spun Himalayan Wool & Pure Raw Silk (Desert Sand & Charcoal lines)",
      tradeCost: 16500,
      markupPercent: 35,
      clientPrice: 22275,
      quantity: 1,
      leadTimeWeeks: 16,
      sustainabilityScore: "Grade A+ (GoodWeave Certified, Fair Trade Hand-knotted)",
      procurementStatus: "In Production",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80",
      description: "Custom oversized Tibetan weave rug with relief textural carving and undyed natural fleece variation.",
      careInstructions: "Professional rug cleaning. Rotate every 6 months to balance natural wear.",
      floorplan: { x: 380, y: 270, width: 130, height: 100, rotation: 0 }
    },
    {
      id: "prod-12",
      name: "Kyoto Low Platform Floating King Bed",
      category: "Seating",
      room: "room-master",
      vendor: "Atelier Woodcraft Bespoke",
      vendorContact: "stefan@atelierwoodcraft.com",
      sku: "AWB-BED-KNG",
      style: "Japandi Sanctuary",
      dimensions: { width: 2300, depth: 2200, height: 950, unit: "mm" },
      finish: "Solid Smoked Walnut / Raw Silk Upholstered Headboard Cushions",
      tradeCost: 9500,
      markupPercent: 35,
      clientPrice: 12825,
      quantity: 1,
      leadTimeWeeks: 8,
      sustainabilityScore: "Grade A (Sustainable domestic hardwood)",
      procurementStatus: "In Production",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
      description: "Low-slung architectural bed frame with cantilevered floating bedside tables and under-bed warm LED wash.",
      careInstructions: "Wipe wood frame with dry cloth. Spot treat raw silk with solvent cleaner.",
      floorplan: { x: 740, y: 460, width: 70, height: 65, rotation: 0 }
    },
    {
      id: "prod-13",
      name: "Freestanding Honed Terrazzo Bathtub",
      category: "Sanitaryware & Fixtures",
      room: "room-master",
      vendor: "Boffi Bathrooms",
      vendorContact: "orders@boffi.com",
      sku: "BOF-TUB-TRZ",
      style: "Sculptural Minimalist",
      dimensions: { width: 1750, depth: 850, height: 560, unit: "mm" },
      finish: "Warm Grey Aggregated Stone Terrazzo (Hand Polished Silk)",
      tradeCost: 11200,
      markupPercent: 25,
      clientPrice: 14000,
      quantity: 1,
      leadTimeWeeks: 10,
      sustainabilityScore: "Grade B+ (Zero toxic polymers)",
      procurementStatus: "Shipped",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      description: "Organic oval soaking tub cast from composite mineral stone with integrated overflow and push-waste.",
      careInstructions: "Mild non-abrasive liquid soap only. Never use bleaches or acids.",
      floorplan: { x: 670, y: 530, width: 45, height: 25, rotation: 0 }
    },
    {
      id: "prod-14",
      name: "Dornbracht Tara Brushed Brass Basin Mixer Sets",
      category: "Sanitaryware & Fixtures",
      room: "room-master",
      vendor: "Dornbracht Germany",
      vendorContact: "spec@dornbracht.de",
      sku: "DRN-TAR-BRS",
      style: "Architectural Precision",
      dimensions: { width: 220, depth: 180, height: 260, unit: "mm" },
      finish: "Brushed Cyprum Brass (Warm Rose Gold tone)",
      tradeCost: 3200,
      markupPercent: 30,
      clientPrice: 4160,
      quantity: 2,
      leadTimeWeeks: 4,
      sustainabilityScore: "Grade A (WaterSense 1.2 GPM Eco Flow)",
      procurementStatus: "Delivered",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80",
      description: "Three-hole wall-mounted basin mixers with cross handles and architectural aerated flow.",
      careInstructions: "Rinse with water and dry with cotton cloth. No abrasive scouring pads.",
      floorplan: { x: 640, y: 500, width: 15, height: 10, rotation: 0 }
    },
    {
      id: "prod-15",
      name: "Sculptural Plaster Relief Panel 'Dune Formation'",
      category: "Art & Decor",
      room: "room-living",
      vendor: "Studio Floris Ceramic",
      vendorContact: "art@floris.studio",
      sku: "SFC-REL-09",
      style: "Tactile Abstract",
      dimensions: { width: 1800, depth: 90, height: 2400, unit: "mm" },
      finish: "Raw Gypsum Plaster, Sand Grog, Muted Ochre Wash on Linen Canvas",
      tradeCost: 7500,
      markupPercent: 30,
      clientPrice: 9750,
      quantity: 1,
      leadTimeWeeks: 6,
      sustainabilityScore: "Grade A+ (All-natural mineral pigments)",
      procurementStatus: "Client Approved",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
      description: "Commissioned oversized monochromatic textured artwork exploring shadow and gentle topography.",
      careInstructions: "Feather duster only. Avoid humidity.",
      floorplan: { x: 490, y: 220, width: 10, height: 50, rotation: 90 }
    },
    {
      id: "prod-16",
      name: "Kettal Bitta Outdoor Modular Sectional & Daybed",
      category: "Seating",
      room: "room-terrace",
      vendor: "Kettal Barcelona",
      vendorContact: "projects@kettal.es",
      sku: "KET-BIT-SEC",
      style: "Mediterranean Luxury",
      dimensions: { width: 3600, depth: 2400, height: 720, unit: "mm" },
      finish: "Manganese Coated Aluminum / Braided Polyester Cords / Sunbrella Terra",
      tradeCost: 14800,
      markupPercent: 30,
      clientPrice: 19240,
      quantity: 1,
      leadTimeWeeks: 8,
      sustainabilityScore: "Grade A (100% recyclable aluminum & non-toxic dyes)",
      procurementStatus: "PO Issued",
      sampleStatus: "Approved",
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      description: "Outdoor deep modular seating system with quick-dry reticulated foam cushions and braided cord backings.",
      careInstructions: "Cover with custom waterproof winter wraps during rainy months.",
      floorplan: { x: 380, y: 70, width: 90, height: 50, rotation: 0 }
    }
  ];

  const initialMoodboard = {
    canvasWidth: 1400,
    canvasHeight: 900,
    palette: [
      { name: "Roman Travertine", hex: "#D6CBB9", role: "Primary Stone" },
      { name: "Fluted White Oak", hex: "#B89D78", role: "Architectural Wood" },
      { name: "Italian Bouclé Ivory", hex: "#F3EDE3", role: "Tactile Textile" },
      { name: "Burnished Brass", hex: "#C5A880", role: "Hardware & Lighting" },
      { name: "Smoked Espresso Walnut", hex: "#423936", role: "Accent Timber" },
      { name: "Slate Charcoal", hex: "#222428", role: "Graphic Depth" }
    ],
    items: [
      {
        id: "mb-01",
        type: "image",
        title: "Kyoto Organic Sofa Texture",
        imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        x: 60,
        y: 60,
        width: 320,
        height: 240,
        rotation: -3,
        zIndex: 2
      },
      {
        id: "mb-02",
        type: "swatch",
        title: "Navona Travertine Finish",
        imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
        x: 340,
        y: 40,
        width: 220,
        height: 200,
        rotation: 4,
        zIndex: 3
      },
      {
        id: "mb-03",
        type: "image",
        title: "Apparatus Branch Chandelier",
        imageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
        x: 580,
        y: 80,
        width: 260,
        height: 280,
        rotation: -2,
        zIndex: 4
      },
      {
        id: "mb-04",
        type: "note",
        title: "Tactile Design Ethos",
        text: "Layered natural textures with warm ambient lighting. Every surface invites touch: raw plaster, combed linen, and softened stone.",
        x: 300,
        y: 300,
        width: 280,
        height: 180,
        rotation: 2,
        zIndex: 5
      }
    ]
  };

  const initialSamples = [
    {
      id: "smp-01",
      productName: "Textured Bouclé (Oatmeal Cream)",
      category: "Fabric Swatch",
      vendor: "Koto Living Atelier",
      status: "Approved",
      location: "Studio Library - Shelf A2",
      dateRequested: "2026-03-01",
      dateReceived: "2026-03-12",
      clientSignoff: "Elena Vance (Approved in Person)",
      notes: "Superb drape and Martindale abrasion count 85,000 rubs."
    },
    {
      id: "smp-02",
      productName: "Navona Travertine (Honed Satin)",
      category: "Stone Tile",
      vendor: "Marmi Stone Craft Studio",
      status: "Approved",
      location: "Studio Library - Stone Bay 4",
      dateRequested: "2026-03-05",
      dateReceived: "2026-03-18",
      clientSignoff: "Elena Vance",
      notes: "Pore filling approved with translucent matte epoxy."
    },
    {
      id: "smp-03",
      productName: "Smoked White Oak Chevron Floor",
      category: "Wood Sample",
      vendor: "Soren Holst",
      status: "Approved",
      location: "On Site Sample Wall",
      dateRequested: "2026-03-10",
      dateReceived: "2026-03-24",
      clientSignoff: "Marcus Vance",
      notes: "Low sheen polyurethane topcoat chosen for stain resistance."
    },
    {
      id: "smp-04",
      productName: "Burnished Cyprum Brass Hardware",
      category: "Metal Finish",
      vendor: "Dornbracht",
      status: "Approved",
      location: "Studio Library - Tray 01",
      dateRequested: "2026-03-15",
      dateReceived: "2026-03-29",
      clientSignoff: "Elena Vance",
      notes: "Unlacquered living finish will age harmoniously."
    }
  ];

  const initialTimeline = [
    {
      id: "phase-1",
      number: "01",
      name: "Discovery & Client Briefing",
      dates: "Feb 15 - Mar 10, 2026",
      progress: 100,
      status: "Completed",
      lead: "Sienna Cole",
      milestones: [
        { name: "Kickoff Workshop with Clients", done: true },
        { name: "3D Laser Site Survey & As-Built CAD", done: true },
        { name: "Target Budget Approval ($485K)", done: true }
      ]
    },
    {
      id: "phase-2",
      number: "02",
      name: "Concept Design & Moodboards",
      dates: "Mar 11 - Apr 08, 2026",
      progress: 100,
      status: "Completed",
      lead: "Atelier Design Team",
      milestones: [
        { name: "Material Palette & Tactile Boards", done: true },
        { name: "Client Formal Concept Signoff", done: true }
      ]
    },
    {
      id: "phase-3",
      number: "03",
      name: "Spatial Floorplans & 3D Visuals",
      dates: "Apr 09 - May 20, 2026",
      progress: 100,
      status: "Completed",
      lead: "Lead Architect & 3D Artist",
      milestones: [
        { name: "Scaled 2D Furniture & MEP Plans", done: true },
        { name: "High-Res Photorealistic 3D Renders", done: true },
        { name: "Client Render Pin Feedback Resolved", done: true }
      ]
    },
    {
      id: "phase-4",
      number: "04",
      name: "Commercial BOQ & Spec Packages",
      dates: "May 21 - Jun 25, 2026",
      progress: 95,
      status: "Completed",
      lead: "Commercial Director",
      milestones: [
        { name: "Complete FF&E Bill of Quantities (BOQ)", done: true },
        { name: "Client Commercial Proposal & Signoff", done: true },
        { name: "Architectural Cut Sheets Exported", done: true }
      ]
    },
    {
      id: "phase-5",
      number: "05",
      name: "Procurement & Purchase Orders",
      dates: "Jun 26 - Aug 28, 2026",
      progress: 75,
      status: "In Progress",
      lead: "Procurement Manager",
      milestones: [
        { name: "Long-lead Item POs Dispatched", done: true },
        { name: "50% Deposits Remitted to Vendors", done: true },
        { name: "Freight Consolidation & Customs Clearance", done: false }
      ]
    },
    {
      id: "phase-6",
      number: "06",
      name: "Civil Works, MEP & Custom Fit-Out",
      dates: "Jul 15 - Oct 25, 2026",
      progress: 58,
      status: "In Progress",
      lead: "General Contractor (Apex)",
      milestones: [
        { name: "Partition Demolition & Structural Openings", done: true },
        { name: "Electrical & Lutron Smart Rough-in", done: true },
        { name: "Custom Architectural Joinery & Cabinets", done: false }
      ]
    },
    {
      id: "phase-7",
      number: "07",
      name: "FF&E White-Glove Installation & Handover",
      dates: "Oct 26 - Nov 28, 2026",
      progress: 10,
      status: "Upcoming",
      lead: "Sienna Cole & Lead Stylist",
      milestones: [
        { name: "Warehouse Staging & White Glove Delivery", done: false },
        { name: "Final Client Walkthrough & Digital Sign-off", done: false }
      ]
    }
  ];

  const initialTasks = [
    {
      id: "task-01",
      title: "Verify Lutron Homeworks QS keypads rough-in heights",
      trade: "Electrical & Lighting",
      room: "room-living",
      assignee: "Apex Electric (Dave K.)",
      priority: "High",
      dueDate: "2026-09-14",
      status: "In Progress"
    },
    {
      id: "task-02",
      title: "Review shop drawings for Living Room fluted media wall",
      trade: "Joinery / Millwork",
      room: "room-living",
      assignee: "Stefan (Atelier Woodcraft)",
      priority: "Urgent",
      dueDate: "2026-09-12",
      status: "In Progress"
    },
    {
      id: "task-03",
      title: "Complete Taj Mahal Quartzite slab template in Kitchen",
      trade: "Plumbing & Stone",
      room: "room-kitchen",
      assignee: "Marmi Stone Craft",
      priority: "High",
      dueDate: "2026-09-16",
      status: "To Do"
    },
    {
      id: "task-04",
      title: "Limewash plaster test patch in Dining Pavilion",
      trade: "Painting & Finishes",
      room: "room-dining",
      assignee: "Roman Finishers Ltd",
      priority: "Normal",
      dueDate: "2026-09-15",
      status: "In Progress"
    },
    {
      id: "task-05",
      title: "Inspect warehouse arrival of Dornbracht Cyprum brassware",
      trade: "Procurement & Quality",
      room: "room-master",
      assignee: "Sienna Cole",
      priority: "Normal",
      dueDate: "2026-09-18",
      status: "Completed"
    }
  ];

  const initialSnags = [
    {
      id: "snag-01",
      room: "room-living",
      roomName: "Great Room & Lounge",
      x: 420,
      y: 210,
      title: "Minor paint splatter on fluted oak panel",
      description: "White primer overspray detected on upper left return of fluted oak casing. Requires delicate acetone cleaning and wax re-buffing.",
      severity: "Minor",
      trade: "Painting & Finishes",
      status: "Open",
      reportedBy: "Sienna Cole (Lead Architect)",
      dateReported: "2026-09-08",
      assignedTo: "Roman Finishers Ltd"
    },
    {
      id: "snag-02",
      room: "room-dining",
      roomName: "Dining Pavilion",
      x: 740,
      y: 200,
      title: "Recessed junction box off-center by 45mm",
      description: "Junction box for Apparatus Chandelier is 45mm south of central table alignment. Must be relocated before final ceiling skimming.",
      severity: "Critical",
      trade: "Electrical & Lighting",
      status: "In Progress",
      reportedBy: "Marcus Vance (Client inspection)",
      dateReported: "2026-09-07",
      assignedTo: "Apex Electric"
    }
  ];

  const initialConceptRenders = [
    {
      id: "rnd-01",
      title: "Great Room & Lounge - Sunset Ambience",
      room: "room-living",
      imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
      clientStatus: "Approved with Notes",
      pins: [
        { id: "pin-01", x: 42, y: 55, author: "Elena Vance (Client)", role: "Client", text: "We love the curve of the Kyoto sofa! Can we confirm the bouclé sample was treated for stain protection?", status: "Answered", date: "Apr 18" },
        { id: "pin-02", x: 68, y: 42, author: "Sienna Cole (Architect)", role: "Architect", text: "Travertine fireplace ledge extended by 300mm to align with terrace glass door frame.", status: "Approved", date: "Apr 20" }
      ]
    },
    {
      id: "rnd-02",
      title: "Dining Pavilion - Evening Chandelier Glow",
      room: "room-dining",
      imageUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1400&q=80",
      clientStatus: "Client Approved",
      pins: [
        { id: "pin-03", x: 52, y: 35, author: "Marcus Vance (Client)", role: "Client", text: "The Apparatus chandelier is spectacular here. Full sign-off from us.", status: "Approved", date: "Apr 22" }
      ]
    }
  ];

  const initialPurchaseOrders = [
    {
      id: "po-101",
      poNumber: "PO-2026-001",
      vendor: "Koto Living Atelier",
      vendorEmail: "procurement@kotoliving.design",
      orderDate: "2026-06-28",
      deliveryDateEst: "2026-09-25",
      status: "Deposit Paid (50%)",
      totalAmount: 6400,
      depositPaid: 3200,
      balanceDue: 3200
    },
    {
      id: "po-102",
      poNumber: "PO-2026-002",
      vendor: "Molteni & C Contract",
      vendorEmail: "contract@molteni.it",
      orderDate: "2026-07-04",
      deliveryDateEst: "2026-10-15",
      status: "Deposit Paid (50%)",
      totalAmount: 9200,
      depositPaid: 4600,
      balanceDue: 4600
    }
  ];

  // --- 2. CURRENCIES ---
  const CURRENCIES = {
    USD: { symbol: '$', rate: 1.0 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    INR: { symbol: '₹', rate: 84.0 },
    AUD: { symbol: 'A$', rate: 1.52 }
  };

  // --- 3. STATE MANAGER ---
  const STORAGE_KEY = 'ATELIERFLOW_STATE_V1';

  class StateManager {
    constructor() {
      this.listeners = new Set();
      this.state = this.loadInitialState();
    }

    loadInitialState() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.project && parsed.products) {
            return parsed;
          }
        }
      } catch (e) {}

      return {
        activeView: 'overview',
        selectedRoomId: 'all',
        isClientMode: false,
        currentCurrency: 'USD',
        project: { ...initialProject },
        rooms: [...initialRooms],
        products: [...initialProducts],
        moodboard: JSON.parse(JSON.stringify(initialMoodboard)),
        samples: [...initialSamples],
        timeline: JSON.parse(JSON.stringify(initialTimeline)),
        tasks: JSON.parse(JSON.stringify(initialTasks)),
        snags: JSON.parse(JSON.stringify(initialSnags)),
        renders: JSON.parse(JSON.stringify(initialConceptRenders)),
        purchaseOrders: JSON.parse(JSON.stringify(initialPurchaseOrders))
      };
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {}
      this.notify();
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    notify() {
      for (const fn of this.listeners) fn(this.state);
    }

    setActiveView(v) {
      this.state.activeView = v;
      this.save();
    }

    setSelectedRoom(r) {
      this.state.selectedRoomId = r;
      this.save();
    }

    toggleClientMode() {
      this.state.isClientMode = !this.state.isClientMode;
      this.save();
    }

    setCurrency(c) {
      if (CURRENCIES[c]) {
        this.state.currentCurrency = c;
        this.save();
      }
    }

    formatCurrency(amt) {
      if (amt == null || isNaN(amt)) return '$0';
      const curr = CURRENCIES[this.state.currentCurrency] || CURRENCIES.USD;
      return `${curr.symbol}${Math.round(amt * curr.rate).toLocaleString()}`;
    }

    getFinancials() {
      let totalCostPrice = 0;
      let totalClientPrice = 0;
      let totalCommittedPO = 0;

      this.state.products.forEach(p => {
        const qty = p.quantity || 1;
        totalCostPrice += (p.tradeCost || 0) * qty;
        totalClientPrice += (p.clientPrice || (p.tradeCost * 1.35)) * qty;
      });

      this.state.purchaseOrders.forEach(po => {
        totalCommittedPO += (po.totalAmount || 0);
      });

      const grossMarginDollars = totalClientPrice - totalCostPrice;
      const grossMarginPercent = totalClientPrice > 0 ? (grossMarginDollars / totalClientPrice) * 100 : 0;
      const targetBudget = this.state.project.targetBudget || 485000;
      const budgetVariance = targetBudget - totalClientPrice;

      return {
        targetBudget,
        totalCostPrice,
        totalClientPrice,
        grossMarginDollars,
        grossMarginPercent,
        budgetVariance,
        totalCommittedPO,
        isUnderBudget: budgetVariance >= 0
      };
    }

    addProduct(p) {
      const newProd = {
        id: `prod-${Date.now()}`,
        quantity: 1,
        markupPercent: 35,
        procurementStatus: 'Idea',
        sampleStatus: 'Requested',
        ...p
      };
      if (!newProd.clientPrice && newProd.tradeCost) {
        newProd.clientPrice = Math.round(newProd.tradeCost * (1 + newProd.markupPercent / 100));
      }
      this.state.products.unshift(newProd);
      this.save();
      return newProd;
    }

    updateProduct(id, changes) {
      const p = this.state.products.find(item => item.id === id);
      if (p) {
        Object.assign(p, changes);
        if (changes.tradeCost != null || changes.markupPercent != null) {
          p.clientPrice = Math.round((p.tradeCost || 0) * (1 + (p.markupPercent || 35) / 100));
        }
        this.save();
      }
    }

    addMoodboardItem(item) {
      this.state.moodboard.items.push({
        id: `mb-${Date.now()}`,
        x: 100,
        y: 100,
        width: 240,
        height: 200,
        rotation: 0,
        zIndex: this.state.moodboard.items.length + 1,
        ...item
      });
      this.save();
    }

    updateMoodboardItem(id, changes) {
      const item = this.state.moodboard.items.find(i => i.id === id);
      if (item) {
        Object.assign(item, changes);
        this.save();
      }
    }

    updateFloorplanPlacement(id, fp) {
      const p = this.state.products.find(item => item.id === id);
      if (p) {
        p.floorplan = { ...(p.floorplan || {}), ...fp };
        this.save();
      }
    }

    addRenderPin(renderId, pin) {
      const r = this.state.renders.find(item => item.id === renderId);
      if (r) {
        r.pins.push({
          id: `pin-${Date.now()}`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status: 'Open',
          role: this.state.isClientMode ? 'Client' : 'Architect',
          author: this.state.isClientMode ? this.state.project.client : this.state.project.leadArchitect,
          ...pin
        });
        this.save();
      }
    }

    updateTimelineProgress(phaseId, prog) {
      const phase = this.state.timeline.find(p => p.id === phaseId);
      if (phase) {
        phase.progress = Math.min(100, Math.max(0, prog));
        phase.status = phase.progress === 100 ? 'Completed' : phase.progress > 0 ? 'In Progress' : 'Upcoming';
        this.save();
      }
    }

    toggleMilestone(phaseId, idx) {
      const phase = this.state.timeline.find(p => p.id === phaseId);
      if (phase && phase.milestones[idx]) {
        phase.milestones[idx].done = !phase.milestones[idx].done;
        const total = phase.milestones.length;
        const done = phase.milestones.filter(m => m.done).length;
        phase.progress = Math.round((done / total) * 100);
        phase.status = phase.progress === 100 ? 'Completed' : phase.progress > 0 ? 'In Progress' : 'Upcoming';
        this.save();
      }
    }

    moveTask(taskId, status) {
      const t = this.state.tasks.find(item => item.id === taskId);
      if (t) {
        t.status = status;
        this.save();
      }
    }

    addTask(taskData) {
      this.state.tasks.unshift({
        id: `task-${Date.now()}`,
        status: 'To Do',
        priority: 'Normal',
        ...taskData
      });
      this.save();
    }

    addSnag(snagData) {
      this.state.snags.unshift({
        id: `snag-${Date.now()}`,
        dateReported: new Date().toISOString().split('T')[0],
        status: 'Open',
        severity: 'Minor',
        reportedBy: this.state.project.leadArchitect,
        ...snagData
      });
      this.save();
    }

    updateSnagStatus(id, s) {
      const snag = this.state.snags.find(item => item.id === id);
      if (snag) {
        snag.status = s;
        this.save();
      }
    }

    updateSampleStatus(id, s) {
      const smp = this.state.samples.find(item => item.id === id);
      if (smp) {
        smp.status = s;
        this.save();
      }
    }

    createPurchaseOrder(data) {
      this.state.purchaseOrders.unshift({
        id: `po-${Date.now()}`,
        poNumber: `PO-2026-${String(this.state.purchaseOrders.length + 1).padStart(3, '0')}`,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'Draft',
        depositPaid: 0,
        balanceDue: data.totalAmount || 0,
        ...data
      });
      this.save();
    }

    updatePOStatus(id, s) {
      const po = this.state.purchaseOrders.find(item => item.id === id);
      if (po) {
        po.status = s;
        if (s.includes('Deposit Paid') && po.depositPaid === 0) {
          po.depositPaid = Math.round(po.totalAmount * 0.5);
          po.balanceDue = po.totalAmount - po.depositPaid;
        } else if (s.includes('Delivered')) {
          po.depositPaid = po.totalAmount;
          po.balanceDue = 0;
        }
        this.save();
      }
    }

    exportProjectJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `AtelierFlow_${this.state.project.code}_${Date.now()}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    resetToDemo() {
      localStorage.removeItem(STORAGE_KEY);
      this.state = this.loadInitialState();
      this.save();
    }
  }

  const state = new StateManager();

  // --- 4. VIEW RENDERERS ---

  // OVERVIEW
  function renderOverview(container) {
    const { project, rooms, products, samples, tasks, snags, renders, isClientMode } = state.state;
    const fin = state.getFinancials();

    const sampleProgress = Math.round((samples.filter(s => s.status === 'Approved').length / (samples.length || 1)) * 100);
    const designProgress = Math.round((renders.filter(r => r.clientStatus.includes('Approved')).length / (renders.length || 1)) * 100);
    const commProgress = Math.round((products.filter(p => ['PO Issued', 'Deposit Paid', 'In Production', 'Shipped', 'Delivered'].includes(p.procurementStatus)).length / (products.length || 1)) * 100);
    const taskProgress = Math.round((tasks.filter(t => t.status === 'Completed').length / (tasks.length || 1)) * 100);
    const openSnags = snags.filter(s => s.status === 'Open').length;

    container.innerHTML = `
      <div class="overview-hero">
        <div class="hero-grid">
          <div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom: 12px;">
              <span class="badge badge-approved">${project.status}</span>
              <span class="badge badge-neutral" style="font-family:monospace;">${project.code}</span>
            </div>
            <h1 class="hero-meta-title">${project.name}</h1>
            <div class="hero-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${project.location}</span>
              <span style="color:var(--border-medium);">|</span>
              <span>Client: <strong>${project.client}</strong></span>
            </div>
            <p class="hero-description">${project.description}</p>
          </div>

          <div class="hero-stats-panel">
            <div class="hero-stat-row">
              <span class="text-secondary">Lead Architect</span>
              <span class="font-medium">${project.leadArchitect}</span>
            </div>
            <div class="hero-stat-row">
              <span class="text-secondary">General Contractor</span>
              <span class="font-medium">${project.contractor}</span>
            </div>
            <div class="hero-stat-row">
              <span class="text-secondary">Total Area</span>
              <span class="font-medium">${project.totalAreaSqm} m² / ${project.totalAreaSqft} sq ft</span>
            </div>
            <div class="hero-stat-row">
              <span class="text-secondary">Target Handover</span>
              <span class="font-medium text-accent">${project.handoverDate}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- LIFECYCLE MAP -->
      <div class="card lifecycle-flow-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Interior Project Lifecycle Nerve Center</h2>
            <p class="text-secondary text-sm">Unified tracking across all 4 pillars from product curation to turnkey delivery</p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-export-json">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Project JSON
          </button>
        </div>

        <div class="lifecycle-stages-bar">
          <div class="stage-step-card" data-nav="discovery" style="--step-progress: ${sampleProgress}%;">
            <div class="stage-num">PILLAR 01</div>
            <div class="stage-name">Product Discovery</div>
            <div class="stage-subtext">FF&E catalog, moodboards, material swatches & physical sample approval.</div>
            <div class="stage-progress-badge">
              <span>${products.length} Products Curated</span>
              <span>•</span>
              <span style="color:var(--status-approved);">${sampleProgress}% Samples Approved</span>
            </div>
          </div>

          <div class="stage-step-card" data-nav="design" style="--step-progress: ${designProgress}%;">
            <div class="stage-num">PILLAR 02</div>
            <div class="stage-name">Design & Spatial</div>
            <div class="stage-subtext">2D scaled floorplans, furniture placement, room finishes & 3D render feedback.</div>
            <div class="stage-progress-badge">
              <span>${rooms.length} Rooms Mapped</span>
              <span>•</span>
              <span style="color:var(--status-approved);">${designProgress}% Visuals Signed</span>
            </div>
          </div>

          <div class="stage-step-card" data-nav="commercial" style="--step-progress: ${commProgress}%;">
            <div class="stage-num">PILLAR 03</div>
            <div class="stage-name">Commercial & BOQ</div>
            <div class="stage-subtext">Bill of Quantities, trade pricing, margin modeling, spec sheets & PO issuance.</div>
            <div class="stage-progress-badge">
              <span>${state.formatCurrency(fin.totalClientPrice)}</span>
              <span>•</span>
              <span style="color:var(--status-progress);">${commProgress}% Procured</span>
            </div>
          </div>

          <div class="stage-step-card" data-nav="project-mgmt" style="--step-progress: ${taskProgress}%;">
            <div class="stage-num">PILLAR 04</div>
            <div class="stage-name">Project Management</div>
            <div class="stage-subtext">7-phase Gantt timeline, multi-trade Kanban, site snag list & white-glove handover.</div>
            <div class="stage-progress-badge">
              <span>${taskProgress}% Tasks Done</span>
              <span>•</span>
              <span style="color:${openSnags > 0 ? 'var(--status-urgent)' : 'var(--status-approved)'};">${openSnags} Open Snags</span>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI STRIP -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Commercial Proposal</div>
          <div class="kpi-value text-accent">${state.formatCurrency(fin.totalClientPrice)}</div>
          <div class="kpi-sub text-secondary">
            Target Budget: ${state.formatCurrency(fin.targetBudget)}
            <span style="color:${fin.isUnderBudget ? 'var(--status-approved)' : 'var(--status-urgent)'}; font-weight:600;">
              (${fin.isUnderBudget ? 'Under Target' : 'Over Budget'})
            </span>
          </div>
        </div>

        ${!isClientMode ? `
          <div class="kpi-card">
            <div class="kpi-label">Designer Gross Profit Margin</div>
            <div class="kpi-value text-gold">${state.formatCurrency(fin.grossMarginDollars)}</div>
            <div class="kpi-sub text-secondary">
              Average Margin: <strong style="color:var(--text-primary);">${Math.round(fin.grossMarginPercent)}%</strong>
              <span>(Cost: ${state.formatCurrency(fin.totalCostPrice)})</span>
            </div>
          </div>
        ` : `
          <div class="kpi-card">
            <div class="kpi-label">Client Approval Status</div>
            <div class="kpi-value" style="color:var(--status-approved);">95%</div>
            <div class="kpi-sub text-secondary">15 of 16 key FF&E specifications client approved</div>
          </div>
        `}

        <div class="kpi-card">
          <div class="kpi-label">Committed Purchase Orders</div>
          <div class="kpi-value text-primary">${state.formatCurrency(fin.totalCommittedPO)}</div>
          <div class="kpi-sub text-secondary">Across active vendor purchase orders</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Site Quality & Snagging</div>
          <div class="kpi-value ${openSnags > 0 ? 'text-urgent' : 'text-approved'}">${openSnags} open</div>
          <div class="kpi-sub text-secondary">${snags.length} total defects logged on floorplan</div>
        </div>
      </div>

      <!-- ROOM SCHEDULE TABLE -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Room-by-Room Schedule & Allocation</h3>
          <span class="text-sm text-secondary">${rooms.length} Architectural Spaces</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="boq-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Room</th>
                <th>Area</th>
                <th>Ceiling</th>
                <th>Finishes (Floor & Wall)</th>
                <th>Allocated Budget</th>
                <th>Floorplan</th>
              </tr>
            </thead>
            <tbody>
              ${rooms.map(room => {
                const roomProducts = products.filter(p => p.room === room.id);
                const roomSpent = roomProducts.reduce((sum, p) => sum + (p.clientPrice * (p.quantity || 1)), 0);
                return `
                  <tr>
                    <td><span class="project-code">${room.code}</span></td>
                    <td><strong style="color:var(--text-primary);">${room.name}</strong></td>
                    <td>${room.sqft} sq ft <span class="text-muted">(${room.sqm} m²)</span></td>
                    <td>${room.ceilingHeight}</td>
                    <td>
                      <div style="font-size:0.8rem; color:var(--text-secondary);">${room.floorFinish}</div>
                      <div style="font-size:0.75rem; color:var(--text-muted);">${room.wallFinish}</div>
                    </td>
                    <td>
                      <div class="font-medium">${state.formatCurrency(roomSpent)}</div>
                      <div class="text-xs text-muted">Allocated: ${state.formatCurrency(room.budgetAllocated)}</div>
                    </td>
                    <td>
                      <button class="btn btn-ghost btn-sm btn-jump-room" data-room="${room.id}">View →</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.stage-step-card').forEach(card => {
      card.onclick = () => state.setActiveView(card.getAttribute('data-nav'));
    });

    container.querySelectorAll('.btn-jump-room').forEach(btn => {
      btn.onclick = () => {
        state.setSelectedRoom(btn.getAttribute('data-room'));
        state.setActiveView('design');
      };
    });

    const exportBtn = container.querySelector('#btn-export-json');
    if (exportBtn) exportBtn.onclick = () => state.exportProjectJSON();
  }

  // DISCOVERY
  let discoverySubTab = 'catalog';
  let discoverySearch = '';
  let discoveryCat = 'all';

  function renderDiscovery(container) {
    const { products, rooms, moodboard, samples, selectedRoomId, isClientMode } = state.state;

    const filtered = products.filter(p => {
      const matchRoom = selectedRoomId === 'all' || p.room === selectedRoomId;
      const matchCat = discoveryCat === 'all' || p.category === discoveryCat;
      const matchSearch = !discoverySearch || p.name.toLowerCase().includes(discoverySearch.toLowerCase()) || p.vendor.toLowerCase().includes(discoverySearch.toLowerCase());
      return matchRoom && matchCat && matchSearch;
    });

    const categories = Array.from(new Set(products.map(p => p.category))).sort();

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-bottom:4px;">Product Discovery & FF&E</h2>
          <p class="text-secondary text-sm">Curate materials, furniture, lighting & tactile finishes for the project</p>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <div style="display:flex; background:var(--bg-surface); padding:4px; border-radius:var(--radius-full); border:1px solid var(--border-subtle);">
            <button class="nav-pillar-btn subtab-btn ${discoverySubTab === 'catalog' ? 'active' : ''}" data-sub="catalog">
              FF&E Catalog (${products.length})
            </button>
            <button class="nav-pillar-btn subtab-btn ${discoverySubTab === 'moodboard' ? 'active' : ''}" data-sub="moodboard">
              Moodboard Studio
            </button>
            <button class="nav-pillar-btn subtab-btn ${discoverySubTab === 'samples' ? 'active' : ''}" data-sub="samples">
              Sample Library (${samples.length})
            </button>
          </div>

          <button class="btn btn-primary btn-sm" id="btn-open-add-product">+ Add Custom Item</button>
        </div>
      </div>

      <!-- ROOM FILTER BAR -->
      <div class="room-filter-bar">
        <button class="room-pill ${selectedRoomId === 'all' ? 'active' : ''}" data-room="all">All Rooms (${products.length})</button>
        ${rooms.map(r => {
          const count = products.filter(p => p.room === r.id).length;
          return `<button class="room-pill ${selectedRoomId === r.id ? 'active' : ''}" data-room="${r.id}">${r.name} (${count})</button>`;
        }).join('')}
      </div>

      ${discoverySubTab === 'catalog' ? `
        <!-- CATALOG TOOLBAR -->
        <div class="catalog-toolbar">
          <div class="search-input-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="disc-search" class="search-input" placeholder="Search furniture, finishes, vendors..." value="${discoverySearch}">
          </div>

          <div class="catalog-filter-group">
            <select id="disc-cat" class="filter-select">
              <option value="all">All Categories</option>
              ${categories.map(c => `<option value="${c}" ${discoveryCat === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <span class="text-xs text-muted">Showing ${filtered.length} specifications</span>
          </div>
        </div>

        <!-- PRODUCT GRID -->
        <div class="product-grid">
          ${filtered.map(p => {
            const roomObj = rooms.find(r => r.id === p.room);
            return `
              <div class="product-card">
                <div class="product-thumb-wrap">
                  <img class="product-thumb" src="${p.imageUrl}" alt="${p.name}">
                  <span class="product-category-tag">${p.category}</span>
                  <span class="product-status-tag badge badge-approved">${p.procurementStatus}</span>
                </div>

                <div class="product-body">
                  <div style="display:flex; justify-content:space-between; align-items:baseline;">
                    <span class="product-vendor">${p.vendor}</span>
                    <span class="text-xs text-muted" style="font-family:monospace;">${p.sku}</span>
                  </div>
                  <h3 class="product-name">${p.name}</h3>

                  <div class="product-specs-compact">
                    <div style="color:var(--text-accent); font-size:0.75rem; margin-bottom:4px;">📍 ${roomObj ? roomObj.name : 'General'}</div>
                    <div style="margin-bottom:2px;"><strong>Finish:</strong> ${p.finish}</div>
                    <div><strong>Dimensions:</strong> ${p.dimensions.width}W × ${p.dimensions.depth}D × ${p.dimensions.height}H mm</div>
                  </div>

                  <div class="product-price-row">
                    <div>
                      <div class="client-price-tag">${state.formatCurrency(p.clientPrice)}</div>
                      <div class="text-xs text-muted">Client Price</div>
                    </div>
                    ${!isClientMode ? `
                      <div style="text-align:right;">
                        <div class="trade-cost-tag">Cost: ${state.formatCurrency(p.tradeCost)}</div>
                        <div class="text-xs text-gold">+${p.markupPercent}% Markup</div>
                      </div>
                    ` : ''}
                  </div>

                  <div class="product-card-actions">
                    <button class="btn btn-secondary btn-sm btn-spec" data-id="${p.id}">Cut Sheet</button>
                    <button class="btn btn-ghost btn-sm btn-pin-mb" data-id="${p.id}">Pin to Board</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      ${discoverySubTab === 'moodboard' ? `
        <div class="moodboard-workspace">
          <div>
            <div class="moodboard-canvas-container" id="mb-container">
              <div class="moodboard-canvas-toolbar">
                <button class="btn btn-ghost btn-sm" id="mb-add-note-btn">+ Add Note</button>
                <span class="text-xs text-muted" style="line-height:28px;">Drag cards around the canvas</span>
              </div>
              <div class="moodboard-canvas-inner" id="mb-inner">
                ${moodboard.items.map(item => {
                  if (item.type === 'image' || item.type === 'swatch') {
                    return `
                      <div class="moodboard-item-elem" data-mb-id="${item.id}" style="left:${item.x}px; top:${item.y}px; width:${item.width}px; height:${item.height}px; transform: rotate(${item.rotation || 0}deg);">
                        <img src="${item.imageUrl}" alt="${item.title}">
                        <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(14,15,18,0.85); padding:6px 10px; font-size:0.72rem; color:#FFF;">${item.title}</div>
                      </div>
                    `;
                  } else {
                    return `
                      <div class="moodboard-item-elem" data-mb-id="${item.id}" style="left:${item.x}px; top:${item.y}px; width:${item.width}px; height:${item.height}px; transform: rotate(${item.rotation || 0}deg); background:#1C1E26; color:#F4F2EE; padding:16px; border:1px solid var(--border-accent);">
                        <div style="font-family:var(--font-serif); font-size:0.95rem; font-weight:600; margin-bottom:8px; color:var(--accent-gold);">${item.title}</div>
                        <p style="font-size:0.8rem; line-height:1.4;">${item.text}</p>
                      </div>
                    `;
                  }
                }).join('')}
              </div>
            </div>

            <!-- PALETTE STRIP -->
            <div style="margin-top:20px;">
              <h4 style="font-family:var(--font-serif); font-size:1.05rem; margin-bottom:10px;">Curated Material Palette</h4>
              <div class="moodboard-palette-strip">
                ${moodboard.palette.map(p => `
                  <div class="palette-swatch-box">
                    <div class="swatch-color-pill" style="background-color: ${p.hex};"></div>
                    <div class="swatch-name">${p.name}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span class="swatch-hex">${p.hex}</span>
                      <span class="text-xs text-accent">${p.role}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- SIDEBAR QUICK PIN -->
          <div class="card" style="padding:18px;">
            <h4 class="card-title" style="font-size:1.05rem; margin-bottom:10px;">Quick Pin to Canvas</h4>
            <div style="display:flex; flex-direction:column; gap:8px; max-height:500px; overflow-y:auto;">
              ${products.map(p => `
                <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-surface-elevated); padding:8px 10px; border-radius:var(--radius-sm);">
                  <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                    <img src="${p.imageUrl}" style="width:30px; height:30px; border-radius:var(--radius-xs); object-fit:cover;">
                    <span style="font-size:0.8rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</span>
                  </div>
                  <button class="btn btn-ghost btn-sm btn-pin-mb" data-id="${p.id}">+</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : ''}

      ${discoverySubTab === 'samples' ? `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Physical Sample Library & Status</h3>
            <span class="text-xs text-secondary">${samples.length} Monitored Swatches</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="boq-table">
              <thead>
                <tr>
                  <th>Material Swatch</th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th>Studio Bay</th>
                  <th>Requested</th>
                  <th>Received</th>
                  <th>Client Approval</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${samples.map(s => `
                  <tr>
                    <td>
                      <strong>${s.productName}</strong>
                      <div class="text-xs text-muted">${s.notes}</div>
                    </td>
                    <td><span class="badge badge-neutral">${s.category}</span></td>
                    <td>${s.vendor}</td>
                    <td style="font-family:monospace; font-size:0.8rem;">${s.location}</td>
                    <td class="text-muted">${s.dateRequested}</td>
                    <td>${s.dateReceived}</td>
                    <td style="color:var(--status-approved); font-weight:500;">${s.clientSignoff}</td>
                    <td>
                      <select class="filter-select sample-status" data-id="${s.id}" style="padding:4px 8px; font-size:0.75rem;">
                        <option value="Requested" ${s.status === 'Requested' ? 'selected' : ''}>Requested</option>
                        <option value="In Transit" ${s.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
                        <option value="Approved" ${s.status === 'Approved' ? 'selected' : ''}>Approved</option>
                        <option value="Rejected" ${s.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                      </select>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    // Subtab events
    container.querySelectorAll('.subtab-btn').forEach(btn => {
      btn.onclick = () => {
        discoverySubTab = btn.getAttribute('data-sub');
        renderDiscovery(container);
      };
    });

    container.querySelectorAll('.room-pill').forEach(btn => {
      btn.onclick = () => {
        state.setSelectedRoom(btn.getAttribute('data-room'));
        renderDiscovery(container);
      };
    });

    const searchIn = container.querySelector('#disc-search');
    if (searchIn) {
      searchIn.oninput = (e) => {
        discoverySearch = e.target.value;
        renderDiscovery(container);
      };
    }

    const catIn = container.querySelector('#disc-cat');
    if (catIn) {
      catIn.onchange = (e) => {
        discoveryCat = e.target.value;
        renderDiscovery(container);
      };
    }

    container.querySelectorAll('.btn-spec').forEach(btn => {
      btn.onclick = () => window.dispatchEvent(new CustomEvent('open-spec-sheet', { detail: { productId: btn.getAttribute('data-id') } }));
    });

    container.querySelectorAll('.btn-pin-mb').forEach(btn => {
      btn.onclick = () => {
        const prod = state.state.products.find(p => p.id === btn.getAttribute('data-id'));
        if (prod) {
          state.addMoodboardItem({
            type: 'image',
            title: prod.name,
            imageUrl: prod.imageUrl,
            x: 100 + Math.random() * 80,
            y: 100 + Math.random() * 80
          });
          window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Pinned "${prod.name}" to Moodboard!` } }));
        }
      };
    });

    container.querySelectorAll('.sample-status').forEach(sel => {
      sel.onchange = (e) => state.updateSampleStatus(sel.getAttribute('data-id'), e.target.value);
    });

    const addNoteBtn = container.querySelector('#mb-add-note-btn');
    if (addNoteBtn) {
      addNoteBtn.onclick = () => {
        const t = prompt('Enter note text:', 'Organic materials with brass lighting accents.');
        if (t) state.addMoodboardItem({ type: 'note', title: 'Concept Note', text: t, x: 200, y: 200, width: 240, height: 160 });
      };
    }

    const addProductBtn = container.querySelector('#btn-open-add-product');
    if (addProductBtn) {
      addProductBtn.onclick = () => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'modal-add-product' } }));
    }

    // Moodboard drag logic
    const mbInner = container.querySelector('#mb-inner');
    if (mbInner) {
      let activeItem = null;
      let offX = 0, offY = 0;
      mbInner.querySelectorAll('.moodboard-item-elem').forEach(el => {
        el.onmousedown = (e) => {
          activeItem = el;
          const rect = el.getBoundingClientRect();
          offX = e.clientX - rect.left;
          offY = e.clientY - rect.top;
          el.style.zIndex = '999';
          e.stopPropagation();
        };
      });

      window.onmousemove = (e) => {
        if (!activeItem) return;
        const cRect = mbInner.getBoundingClientRect();
        const nx = Math.max(0, e.clientX - cRect.left - offX);
        const ny = Math.max(0, e.clientY - cRect.top - offY);
        activeItem.style.left = `${nx}px`;
        activeItem.style.top = `${ny}px`;
      };

      window.onmouseup = () => {
        if (activeItem) {
          const mbId = activeItem.getAttribute('data-mb-id');
          state.updateMoodboardItem(mbId, { x: parseInt(activeItem.style.left, 10), y: parseInt(activeItem.style.top, 10) });
          activeItem = null;
        }
      };
    }
  }

  // DESIGN & SPATIAL
  let activeLayer = 'all';
  let selectedFPItem = null;

  function renderDesign(container) {
    const { rooms, products, renders, snags, selectedRoomId } = state.state;
    const currentRoom = rooms.find(r => r.id === selectedRoomId);
    const placed = products.filter(p => p.floorplan && (selectedRoomId === 'all' || p.room === selectedRoomId));

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-bottom:4px;">Design & Spatial Floorplan Mapping</h2>
          <p class="text-secondary text-sm">Interactive 2D scaled space planning, furniture layout & client render reviews</p>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <div style="display:flex; background:var(--bg-surface); padding:4px; border-radius:var(--radius-full); border:1px solid var(--border-subtle);">
            <button class="nav-pillar-btn layer-btn ${activeLayer === 'all' ? 'active' : ''}" data-l="all">Full Layout</button>
            <button class="nav-pillar-btn layer-btn ${activeLayer === 'clearance' ? 'active' : ''}" data-l="clearance">Clearance</button>
            <button class="nav-pillar-btn layer-btn ${activeLayer === 'snags' ? 'active' : ''}" data-l="snags">Defect Pins (${snags.length})</button>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-rot-item">↻ Rotate Item 45°</button>
        </div>
      </div>

      <div class="room-filter-bar">
        <button class="room-pill ${selectedRoomId === 'all' ? 'active' : ''}" data-room="all">Full Penthouse Plan (6 Zones)</button>
        ${rooms.map(r => `<button class="room-pill ${selectedRoomId === r.id ? 'active' : ''}" data-room="${r.id}">${r.name}</button>`).join('')}
      </div>

      <div class="design-view-grid">
        <div class="floorplan-viewport">
          <div class="floorplan-toolbar">
            <span style="font-size:0.75rem; font-weight:700; color:var(--text-accent);">Scale 1:50</span>
            <span style="color:var(--border-medium);">|</span>
            <span class="text-xs text-secondary">Click & drag furniture on plan to reposition</span>
          </div>
          <canvas class="floorplan-canvas" id="fp-canvas" width="1050" height="680"></canvas>
        </div>

        <div class="room-inspector-panel">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="badge badge-neutral" style="font-family:monospace;">${currentRoom ? currentRoom.code : 'ALL-ZONES'}</span>
              <span class="text-xs text-accent">Active Space Profile</span>
            </div>
            <h3 style="font-family:var(--font-serif); font-size:1.35rem; color:var(--text-primary); margin-top:4px;">
              ${currentRoom ? currentRoom.name : 'Penthouse Overall Master Plan'}
            </h3>
            <p class="text-xs text-secondary" style="margin-top:4px;">
              ${currentRoom ? currentRoom.notes : 'Complete penthouse spatial configuration.'}
            </p>
          </div>

          ${currentRoom ? `
            <div class="room-metric-box">
              <div>
                <div class="text-muted text-xs">Floor Area</div>
                <div class="font-bold">${currentRoom.sqft} sq ft <span class="text-muted">(${currentRoom.sqm} m²)</span></div>
              </div>
              <div>
                <div class="text-muted text-xs">Ceiling Height</div>
                <div class="font-bold">${currentRoom.ceilingHeight}</div>
              </div>
              <div>
                <div class="text-muted text-xs">Sun Orientation</div>
                <div class="font-bold text-accent">${currentRoom.orientation}</div>
              </div>
              <div>
                <div class="text-muted text-xs">Budget</div>
                <div class="font-bold text-gold">${state.formatCurrency(currentRoom.budgetAllocated)}</div>
              </div>
            </div>

            <div style="background:var(--bg-surface-elevated); padding:12px; border-radius:var(--radius-sm); font-size:0.8rem; display:flex; flex-direction:column; gap:6px;">
              <div class="text-xs text-accent font-bold">Finishes Schedule</div>
              <div><strong>Floor:</strong> ${currentRoom.floorFinish}</div>
              <div><strong>Walls:</strong> ${currentRoom.wallFinish}</div>
              <div><strong>Ceiling:</strong> ${currentRoom.ceilingFinish}</div>
            </div>
          ` : ''}

          <div>
            <h4 style="font-size:0.9rem; font-weight:600; margin-bottom:8px;">Allocated FF&E (${placed.length})</h4>
            <div style="display:flex; flex-direction:column; gap:6px; max-height:280px; overflow-y:auto;">
              ${placed.map(p => `
                <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-surface-elevated); padding:6px 10px; border-radius:var(--radius-sm); border:1px solid ${selectedFPItem === p.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}; cursor:pointer;" class="fp-row-item" data-id="${p.id}">
                  <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                    <img src="${p.imageUrl}" style="width:28px; height:28px; border-radius:var(--radius-xs); object-fit:cover;">
                    <span style="font-size:0.75rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</span>
                  </div>
                  <button class="btn btn-ghost btn-sm btn-spec" data-id="${p.id}" style="padding:2px 6px;">📄</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- 3D RENDERS -->
      <div class="renders-strip">
        <div class="card-header" style="margin-bottom:16px;">
          <div>
            <h3 class="card-title">3D Concept Visualizations & Client Review Pins</h3>
            <p class="text-secondary text-sm">Click anywhere on a rendering to drop a design comment pin</p>
          </div>
          <span class="badge badge-approved">Client Signed Off</span>
        </div>

        <div class="render-cards-grid">
          ${renders.map(r => `
            <div class="render-card">
              <div class="render-image-wrap" data-rnd-id="${r.id}">
                <img src="${r.imageUrl}" alt="${r.title}">
                ${r.pins.map((pin, idx) => `
                  <div class="render-pin-drop" style="left:${pin.x}%; top:${pin.y}%;" title="${pin.author}: ${pin.text}">
                    ${idx + 1}
                  </div>
                `).join('')}
              </div>
              <div class="render-comments-box">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="font-family:var(--font-serif); font-size:1.05rem;">${r.title}</strong>
                  <span class="badge badge-approved" style="font-size:0.7rem;">${r.clientStatus}</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                  ${r.pins.map(pin => `
                    <div class="render-comment-item">
                      <div style="display:flex; justify-content:space-between; font-size:0.72rem; margin-bottom:2px;">
                        <strong style="color:${pin.role === 'Client' ? 'var(--accent-gold)' : 'var(--text-primary)'};">${pin.author}</strong>
                        <span class="text-muted">${pin.date}</span>
                      </div>
                      <p style="font-size:0.78rem; color:var(--text-secondary);">${pin.text}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Draw canvas
    drawFloorplan(container);

    container.querySelectorAll('.layer-btn').forEach(btn => {
      btn.onclick = () => {
        activeLayer = btn.getAttribute('data-l');
        renderDesign(container);
      };
    });

    container.querySelectorAll('.room-pill').forEach(btn => {
      btn.onclick = () => {
        state.setSelectedRoom(btn.getAttribute('data-room'));
        renderDesign(container);
      };
    });

    const rotBtn = container.querySelector('#btn-rot-item');
    if (rotBtn) {
      rotBtn.onclick = () => {
        if (selectedFPItem) {
          const p = state.state.products.find(item => item.id === selectedFPItem);
          if (p && p.floorplan) {
            const rot = ((p.floorplan.rotation || 0) + 45) % 360;
            state.updateFloorplanPlacement(selectedFPItem, { rotation: rot });
            drawFloorplan(container);
          }
        } else {
          alert('Click a piece of furniture on the floor plan first to rotate it.');
        }
      };
    }

    container.querySelectorAll('.fp-row-item').forEach(row => {
      row.onclick = () => {
        selectedFPItem = row.getAttribute('data-id');
        drawFloorplan(container);
      };
    });

    container.querySelectorAll('.btn-spec').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('open-spec-sheet', { detail: { productId: btn.getAttribute('data-id') } }));
      };
    });

    // Render Pin Click
    container.querySelectorAll('.render-image-wrap').forEach(wrap => {
      wrap.onclick = (e) => {
        const rndId = wrap.getAttribute('data-rnd-id');
        const rect = wrap.getBoundingClientRect();
        const px = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const py = Math.round(((e.clientY - rect.top) / rect.height) * 100);
        const txt = prompt('Add feedback comment for this rendering view:', 'Please verify the fluted travertine detail.');
        if (txt) {
          state.addRenderPin(rndId, { x: px, y: py, text: txt });
          renderDesign(container);
        }
      };
    });
  }

  function drawFloorplan(container) {
    const canvas = container.querySelector('#fp-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { products, snags, selectedRoomId } = state.state;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Architectural Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Rooms
    const architecturalRooms = [
      { id: 'room-terrace', name: 'SUNSET TERRACE & SOLARIUM', x: 280, y: 20, w: 460, h: 120, fill: 'rgba(158, 130, 104, 0.06)' },
      { id: 'room-study', name: 'EXECUTIVE STUDY', x: 80, y: 380, w: 220, h: 250, fill: 'rgba(63, 74, 66, 0.08)' },
      { id: 'room-living', name: 'GREAT ROOM & LOUNGE', x: 280, y: 150, w: 320, h: 280, fill: 'rgba(197, 168, 128, 0.08)' },
      { id: 'room-dining', name: 'DINING PAVILION', x: 620, y: 150, w: 340, h: 200, fill: 'rgba(94, 104, 88, 0.08)' },
      { id: 'room-kitchen', name: "CHEF'S KITCHEN", x: 620, y: 20, w: 340, h: 120, fill: 'rgba(164, 126, 91, 0.08)' },
      { id: 'room-master', name: 'MASTER SANCTUARY SUITE', x: 620, y: 360, w: 340, h: 270, fill: 'rgba(126, 107, 93, 0.08)' }
    ];

    architecturalRooms.forEach(room => {
      const isFocused = selectedRoomId === 'all' || selectedRoomId === room.id;
      ctx.fillStyle = isFocused ? room.fill : 'rgba(255,255,255,0.01)';
      ctx.fillRect(room.x, room.y, room.w, room.h);

      ctx.strokeStyle = isFocused ? 'rgba(197, 168, 128, 0.7)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = isFocused ? 3 : 1.5;
      ctx.strokeRect(room.x, room.y, room.w, room.h);

      ctx.fillStyle = isFocused ? '#C5A880' : 'rgba(255,255,255,0.3)';
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(room.name, room.x + 12, room.y + 20);

      ctx.strokeStyle = 'rgba(197, 168, 128, 0.3)';
      ctx.beginPath();
      ctx.arc(room.x, room.y + room.h / 2, 22, 0, Math.PI / 2);
      ctx.stroke();
    });

    // Clearance corridor
    if (activeLayer === 'clearance') {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.fillRect(240, 150, 40, 280);
      ctx.fillRect(600, 150, 20, 480);
      ctx.fillRect(280, 430, 340, 30);
      ctx.fillStyle = '#93C5FD';
      ctx.font = '600 10px sans-serif';
      ctx.fillText('900mm CLEARANCE AISLE', 320, 450);
    }

    // Draw Furniture Footprints
    products.forEach(p => {
      if (!p.floorplan) return;
      if (selectedRoomId !== 'all' && p.room !== selectedRoomId) return;

      const fp = p.floorplan;
      const isSelected = selectedFPItem === p.id;

      ctx.save();
      ctx.translate(fp.x, fp.y);
      ctx.rotate(((fp.rotation || 0) * Math.PI) / 180);

      ctx.fillStyle = isSelected ? 'rgba(212, 175, 55, 0.5)' : 'rgba(28, 30, 38, 0.9)';
      ctx.strokeStyle = isSelected ? '#D4AF37' : '#C5A880';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;

      const hw = (fp.width || 60) / 2;
      const hh = (fp.height || 40) / 2;

      ctx.beginPath();
      ctx.rect(-hw, -hh, fp.width || 60, fp.height || 40);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#FFF' : '#E8E2D5';
      ctx.font = '600 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const short = p.name.length > 14 ? p.name.substring(0, 12) + '..' : p.name;
      ctx.fillText(short, 0, 0);

      ctx.restore();
    });

    // Snags
    if (activeLayer === 'all' || activeLayer === 'snags') {
      snags.forEach(snag => {
        ctx.save();
        ctx.fillStyle = snag.severity === 'Critical' ? '#EF4444' : '#F59E0B';
        ctx.beginPath();
        ctx.arc(snag.x, snag.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', snag.x, snag.y);
        ctx.restore();
      });
    }

    // Canvas Dragging
    let isDragging = false;
    let dragOffX = 0, dragOffY = 0;

    canvas.onmousedown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let hit = null;
      for (const p of products) {
        if (!p.floorplan) continue;
        const dist = Math.hypot(mx - p.floorplan.x, my - p.floorplan.y);
        if (dist < 40) {
          hit = p;
          break;
        }
      }

      if (hit) {
        selectedFPItem = hit.id;
        isDragging = true;
        dragOffX = mx - hit.floorplan.x;
        dragOffY = my - hit.floorplan.y;
        drawFloorplan(container);
      } else {
        selectedFPItem = null;
        drawFloorplan(container);
      }
    };

    canvas.onmousemove = (e) => {
      if (!isDragging || !selectedFPItem) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      state.updateFloorplanPlacement(selectedFPItem, {
        x: Math.round(mx - dragOffX),
        y: Math.round(my - dragOffY)
      });
      drawFloorplan(container);
    };

    canvas.onmouseup = () => {
      isDragging = false;
    };
  }

  // COMMERCIAL & BOQ
  let commRoom = 'all';
  let commCat = 'all';

  function renderCommercial(container) {
    const { products, rooms, purchaseOrders, isClientMode } = state.state;
    const fin = state.getFinancials();

    const filtered = products.filter(p => {
      const mr = commRoom === 'all' || p.room === commRoom;
      const mc = commCat === 'all' || p.category === commCat;
      return mr && mc;
    });

    const categories = Array.from(new Set(products.map(p => p.category))).sort();

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-bottom:4px;">Commercial & Procurement Engine</h2>
          <p class="text-secondary text-sm">Dynamic Bill of Quantities (BOQ), trade discounts, client markups, and purchase orders</p>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button class="client-mode-toggle ${isClientMode ? 'active' : ''}" id="btn-toggle-client-mode">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            ${isClientMode ? 'Client Mode: ACTIVE (Margins Hidden)' : 'Designer Mode (Full Trade Margins)'}
          </button>
          <button class="btn btn-primary btn-sm" id="btn-create-po">+ Generate Purchase Order</button>
        </div>
      </div>

      <!-- KPI -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Client Commercial Total</div>
          <div class="kpi-value text-accent">${state.formatCurrency(fin.totalClientPrice)}</div>
          <div class="kpi-sub text-secondary">Target: ${state.formatCurrency(fin.targetBudget)} (${fin.isUnderBudget ? 'Under Target' : 'Variance Over Target'})</div>
        </div>

        ${!isClientMode ? `
          <div class="kpi-card">
            <div class="kpi-label">Total Trade Procurement Cost</div>
            <div class="kpi-value text-primary">${state.formatCurrency(fin.totalCostPrice)}</div>
            <div class="kpi-sub text-secondary">Wholesale Trade Cost Baseline</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Studio Gross Profit Margin</div>
            <div class="kpi-value text-gold">${state.formatCurrency(fin.grossMarginDollars)}</div>
            <div class="kpi-sub text-secondary">Average Realized: ${Math.round(fin.grossMarginPercent)}%</div>
          </div>
        ` : `
          <div class="kpi-card">
            <div class="kpi-label">Payment Milestone</div>
            <div class="kpi-value text-primary">50% / 50%</div>
            <div class="kpi-sub text-secondary">50% Deposit • 50% on Delivery</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Client Warranty</div>
            <div class="kpi-value" style="color:var(--status-approved);">100% Certified</div>
            <div class="kpi-sub text-secondary">Turnkey delivery & site protection</div>
          </div>
        `}

        <div class="kpi-card">
          <div class="kpi-label">Committed Purchase Orders</div>
          <div class="kpi-value text-primary">${state.formatCurrency(fin.totalCommittedPO)}</div>
          <div class="kpi-sub text-secondary">${purchaseOrders.length} Issued POs</div>
        </div>
      </div>

      <!-- BOQ MATRIX -->
      <div class="card" style="margin-bottom:28px;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Bill of Quantities (BOQ) Schedule</h3>
            <p class="text-secondary text-sm">Real-time spreadsheet matrix with live trade markup & quantity calculation</p>
          </div>

          <div style="display:flex; gap:10px;">
            <select id="boq-room" class="filter-select">
              <option value="all">All Rooms</option>
              ${rooms.map(r => `<option value="${r.id}" ${commRoom === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
            </select>
            <select id="boq-cat" class="filter-select">
              <option value="all">All Categories</option>
              ${categories.map(c => `<option value="${c}" ${commCat === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-sm" id="btn-print-boq">Print Proposal</button>
          </div>
        </div>

        <div class="boq-table-container">
          <table class="boq-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item & Finish</th>
                <th>Room</th>
                <th>Vendor</th>
                <th>Qty</th>
                ${!isClientMode ? `<th>Trade Cost</th><th>Markup %</th>` : ''}
                <th>Client Price</th>
                ${!isClientMode ? `<th>Total Cost</th>` : ''}
                <th>Total Client</th>
                ${!isClientMode ? `<th>Margin</th>` : ''}
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(p => {
                const qty = p.quantity || 1;
                const cost = (p.tradeCost || 0) * qty;
                const clientTot = (p.clientPrice || 0) * qty;
                const margin = clientTot - cost;
                const roomObj = rooms.find(r => r.id === p.room);

                return `
                  <tr>
                    <td><span class="project-code" style="font-size:0.75rem;">${p.sku}</span></td>
                    <td>
                      <div class="boq-item-cell">
                        <img src="${p.imageUrl}" class="boq-item-thumb">
                        <div>
                          <strong style="color:var(--text-primary);">${p.name}</strong>
                          <div class="text-xs text-muted" style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.finish}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge badge-neutral">${roomObj ? roomObj.name : 'General'}</span></td>
                    <td><span class="text-secondary">${p.vendor}</span></td>
                    <td>
                      <input type="number" min="1" max="99" class="boq-qty-input" data-id="${p.id}" value="${qty}">
                    </td>
                    ${!isClientMode ? `
                      <td>${state.formatCurrency(p.tradeCost)}</td>
                      <td>
                        <input type="number" min="0" max="200" class="boq-markup-input" data-id="${p.id}" value="${p.markupPercent || 35}">%
                      </td>
                    ` : ''}
                    <td class="font-medium">${state.formatCurrency(p.clientPrice)}</td>
                    ${!isClientMode ? `<td>${state.formatCurrency(cost)}</td>` : ''}
                    <td class="font-bold text-accent">${state.formatCurrency(clientTot)}</td>
                    ${!isClientMode ? `<td class="text-gold font-medium">+${state.formatCurrency(margin)}</td>` : ''}
                    <td><span class="badge badge-progress" style="font-size:0.68rem;">${p.procurementStatus}</span></td>
                    <td>
                      <button class="btn btn-ghost btn-sm btn-spec" data-id="${p.id}">Cut Sheet</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- POS -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Purchase Orders & Fabrication Pipeline</h3>
          <span class="text-xs text-secondary">${purchaseOrders.length} Active POs</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="boq-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Issued</th>
                <th>Est. Delivery</th>
                <th>Total</th>
                <th>Deposit (50%)</th>
                <th>Balance Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${purchaseOrders.map(po => `
                <tr>
                  <td><span class="project-code font-bold">${po.poNumber}</span></td>
                  <td><strong>${po.vendor}</strong></td>
                  <td class="text-muted">${po.orderDate}</td>
                  <td class="font-medium">${po.deliveryDateEst}</td>
                  <td class="font-bold">${state.formatCurrency(po.totalAmount)}</td>
                  <td style="color:var(--status-approved);">${state.formatCurrency(po.depositPaid)}</td>
                  <td>${state.formatCurrency(po.balanceDue)}</td>
                  <td>
                    <select class="filter-select po-status" data-id="${po.id}" style="padding:4px 8px; font-size:0.75rem;">
                      <option value="Draft" ${po.status === 'Draft' ? 'selected' : ''}>Draft</option>
                      <option value="Deposit Paid (50%)" ${po.status.includes('Deposit Paid') ? 'selected' : ''}>Deposit Paid (50%)</option>
                      <option value="In Production" ${po.status === 'In Production' ? 'selected' : ''}>In Production</option>
                      <option value="Delivered to Warehouse" ${po.status.includes('Delivered') ? 'selected' : ''}>Delivered to Warehouse</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const clientBtn = container.querySelector('#btn-toggle-client-mode');
    if (clientBtn) clientBtn.onclick = () => state.toggleClientMode();

    const rSel = container.querySelector('#boq-room');
    if (rSel) rSel.onchange = (e) => { commRoom = e.target.value; renderCommercial(container); };

    const cSel = container.querySelector('#boq-cat');
    if (cSel) cSel.onchange = (e) => { commCat = e.target.value; renderCommercial(container); };

    container.querySelectorAll('.boq-qty-input').forEach(inp => {
      inp.onchange = (e) => state.updateProduct(inp.getAttribute('data-id'), { quantity: parseInt(e.target.value, 10) || 1 });
    });

    container.querySelectorAll('.boq-markup-input').forEach(inp => {
      inp.onchange = (e) => state.updateProduct(inp.getAttribute('data-id'), { markupPercent: parseFloat(e.target.value) || 35 });
    });

    container.querySelectorAll('.btn-spec').forEach(btn => {
      btn.onclick = () => window.dispatchEvent(new CustomEvent('open-spec-sheet', { detail: { productId: btn.getAttribute('data-id') } }));
    });

    container.querySelectorAll('.po-status').forEach(sel => {
      sel.onchange = (e) => state.updatePOStatus(sel.getAttribute('data-id'), e.target.value);
    });

    const createPoBtn = container.querySelector('#btn-create-po');
    if (createPoBtn) {
      createPoBtn.onclick = () => {
        const v = prompt('Enter vendor name for Purchase Order:', 'Atelier Woodcraft Bespoke');
        if (v) state.createPurchaseOrder({ vendor: v, totalAmount: 18500, deliveryDateEst: '2026-11-15' });
      };
    }

    const prBtn = container.querySelector('#btn-print-boq');
    if (prBtn) prBtn.onclick = () => window.print();
  }

  // PROJECT MANAGEMENT
  let activeTrade = 'all';

  function renderProjectMgmt(container) {
    const { timeline, tasks, snags, rooms } = state.state;
    const filteredTasks = tasks.filter(t => activeTrade === 'all' || t.trade === activeTrade);
    const trades = Array.from(new Set(tasks.map(t => t.trade))).sort();
    const cols = ['Backlog', 'To Do', 'In Progress', 'Quality Review', 'Completed'];

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-bottom:4px;">Project Management & Site Execution</h2>
          <p class="text-secondary text-sm">7-phase architectural timeline, contractor Kanban, floorplan snagging & white-glove handover</p>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn btn-secondary btn-sm" id="btn-add-snag">+ Log Site Snag</button>
          <button class="btn btn-primary btn-sm" id="btn-add-task">+ Add Trade Task</button>
        </div>
      </div>

      <!-- GANTT TIMELINE -->
      <div class="card" style="margin-bottom:28px;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Architectural Lifecycle Gantt Timeline</h3>
            <p class="text-secondary text-sm">Check milestones to update phase progress dynamically</p>
          </div>
          <span class="badge badge-progress">Current: Phase 05 & 06</span>
        </div>

        <div class="gantt-container">
          ${timeline.map(phase => `
            <div class="gantt-phase-row">
              <div class="gantt-phase-meta">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="project-code" style="font-size:0.7rem;">PHASE ${phase.number}</span>
                  <span class="badge ${phase.status === 'Completed' ? 'badge-approved' : 'badge-progress'}" style="font-size:0.65rem;">${phase.status}</span>
                </div>
                <div class="gantt-phase-name">${phase.name}</div>
                <div class="gantt-phase-dates">${phase.dates} • Lead: ${phase.lead}</div>
                <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px;">
                  ${phase.milestones.map((m, mIdx) => `
                    <label style="font-size:0.74rem; display:flex; align-items:center; gap:6px; cursor:pointer;">
                      <input type="checkbox" class="gantt-m-chk" data-phase="${phase.id}" data-idx="${mIdx}" ${m.done ? 'checked' : ''}>
                      <span style="${m.done ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${m.name}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <div>
                <div class="gantt-bar-track">
                  <div class="gantt-bar-fill" style="width: ${phase.progress}%;">${phase.progress}%</div>
                </div>
              </div>

              <div style="text-align:right;">
                <input type="range" min="0" max="100" class="gantt-slider" data-phase="${phase.id}" value="${phase.progress}" style="width:80px;">
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- KANBAN -->
      <div class="card" style="margin-bottom:28px;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Multi-Trade Execution Kanban</h3>
            <p class="text-secondary text-sm">Coordinate Joiners, Electricians, Stone Masons, and Stylists</p>
          </div>
          <select id="kanban-trade-filter" class="filter-select">
            <option value="all">All Contractor Trades</option>
            ${trades.map(t => `<option value="${t}" ${activeTrade === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>

        <div class="kanban-board">
          ${cols.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col);
            return `
              <div class="kanban-column">
                <div class="kanban-col-header">
                  <span class="kanban-col-title">${col}</span>
                  <span class="nav-pillar-badge">${colTasks.length}</span>
                </div>
                <div class="kanban-cards-stack">
                  ${colTasks.map(t => `
                    <div class="kanban-card">
                      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span class="badge ${t.priority === 'Urgent' ? 'badge-urgent' : 'badge-neutral'}" style="font-size:0.65rem;">${t.priority}</span>
                        <span class="text-xs text-muted">${t.dueDate}</span>
                      </div>
                      <div class="kanban-card-title">${t.title}</div>
                      <div class="kanban-card-meta">
                        <span>👤 ${t.assignee}</span>
                        <div style="display:flex; gap:4px;">
                          ${col !== 'Backlog' ? `<button class="btn btn-ghost btn-sm move-t" data-id="${t.id}" data-dir="prev" style="padding:1px 5px;">←</button>` : ''}
                          ${col !== 'Completed' ? `<button class="btn btn-ghost btn-sm move-t" data-id="${t.id}" data-dir="next" style="padding:1px 5px;">→</button>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- SNAG LIST -->
      <div class="card" style="margin-bottom:28px;">
        <div class="card-header">
          <h3 class="card-title">Site Snagging & Quality Punch List</h3>
          <span class="badge badge-urgent">${snags.filter(s => s.status === 'Open').length} Open Defects</span>
        </div>
        <div class="snags-grid">
          ${snags.map(s => `
            <div class="snag-card">
              <div class="snag-card-header">
                <span class="badge ${s.severity === 'Critical' ? 'badge-urgent' : 'badge-pending'}">${s.severity}</span>
                <span class="badge badge-progress">${s.status}</span>
              </div>
              <div class="snag-body">
                <div class="text-xs text-accent">📍 ${s.roomName}</div>
                <div class="snag-title">${s.title}</div>
                <p class="snag-desc">${s.description}</p>
                <div class="text-xs text-muted">Assigned: <strong>${s.assignedTo}</strong></div>
              </div>
              <div class="snag-footer">
                <span class="text-xs text-muted">${s.dateReported}</span>
                <select class="filter-select snag-status" data-id="${s.id}" style="padding:3px 6px; font-size:0.75rem;">
                  <option value="Open" ${s.status === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="In Progress" ${s.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Resolved" ${s.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- HANDOVER & SIGN OFF -->
      <div class="card handover-container">
        <div class="card-header">
          <div>
            <h3 class="card-title">White-Glove Turnkey Handover & Sign-Off</h3>
            <p class="text-secondary text-sm">Final architectural inspection protocol & digital client certificate</p>
          </div>
          <span class="badge badge-neutral">Nov 28, 2026</span>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:32px; align-items:start;">
          <div>
            <h4 style="font-size:0.95rem; font-weight:600; margin-bottom:12px;">Final Commissioning Checklist</h4>
            <div style="display:flex; flex-direction:column; gap:8px; font-size:0.82rem;">
              <label style="display:flex; align-items:center; gap:8px;"><input type="checkbox" checked> Smart Home Automation & Lutron Scenes Tested</label>
              <label style="display:flex; align-items:center; gap:8px;"><input type="checkbox" checked> Natural Stone Sealing & Honeycomb Backing Certified</label>
              <label style="display:flex; align-items:center; gap:8px;"><input type="checkbox" checked> All 20 Bespoke FF&E Pieces Placed and Inspected</label>
              <label style="display:flex; align-items:center; gap:8px;"><input type="checkbox"> Deep Post-Construction Clean Completed</label>
              <label style="display:flex; align-items:center; gap:8px;"><input type="checkbox"> Warranty Binder & O&M Manuals Handed Over</label>
            </div>
          </div>

          <div>
            <h4 style="font-size:0.95rem; font-weight:600; margin-bottom:12px;">Client Handover Signature</h4>
            <div class="signature-pad-box">
              <canvas id="handover-canvas" width="400" height="140" class="signature-canvas"></canvas>
              <span class="text-xs text-muted" id="handover-ph" style="position:absolute; pointer-events:none;">Click & drag to sign</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
              <button class="btn btn-ghost btn-sm" id="btn-clear-sig">Clear Signature</button>
              <button class="btn btn-primary btn-sm" id="btn-certify">Certify Turnkey Handover</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.gantt-m-chk').forEach(chk => {
      chk.onchange = () => state.toggleMilestone(chk.getAttribute('data-phase'), parseInt(chk.getAttribute('data-idx'), 10));
    });

    container.querySelectorAll('.gantt-slider').forEach(sl => {
      sl.onchange = (e) => state.updateTimelineProgress(sl.getAttribute('data-phase'), parseInt(e.target.value, 10));
    });

    const tradeSel = container.querySelector('#kanban-trade-filter');
    if (tradeSel) tradeSel.onchange = (e) => { activeTrade = e.target.value; renderProjectMgmt(container); };

    container.querySelectorAll('.move-t').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const dir = btn.getAttribute('data-dir');
        const t = state.state.tasks.find(item => item.id === id);
        if (t) {
          const cIdx = cols.indexOf(t.status);
          const nIdx = dir === 'next' ? Math.min(cols.length - 1, cIdx + 1) : Math.max(0, cIdx - 1);
          state.moveTask(id, cols[nIdx]);
        }
      };
    });

    container.querySelectorAll('.snag-status').forEach(sel => {
      sel.onchange = (e) => state.updateSnagStatus(sel.getAttribute('data-id'), e.target.value);
    });

    const addSnagBtn = container.querySelector('#btn-add-snag');
    if (addSnagBtn) {
      addSnagBtn.onclick = () => {
        const title = prompt('Enter snag / defect title:', 'Stone joint touch-up');
        if (title) state.addSnag({ title, room: 'room-living', roomName: 'Great Room', description: 'Requires sub touch-up', severity: 'Minor', assignedTo: 'Roman Finishers' });
      };
    }

    const addTaskBtn = container.querySelector('#btn-add-task');
    if (addTaskBtn) {
      addTaskBtn.onclick = () => {
        const title = prompt('Enter trade task title:', 'Install ceiling speakers');
        if (title) state.addTask({ title, trade: 'Electrical & Lighting', room: 'room-living', assignee: 'Apex Electric', priority: 'High', dueDate: '2026-09-20' });
      };
    }

    // Signature pad
    const hCanvas = container.querySelector('#handover-canvas');
    const hPh = container.querySelector('#handover-ph');
    const clearBtn = container.querySelector('#btn-clear-sig');
    const certBtn = container.querySelector('#btn-certify');

    if (hCanvas) {
      const hCtx = hCanvas.getContext('2d');
      hCtx.strokeStyle = '#C5A880';
      hCtx.lineWidth = 2.5;
      hCtx.lineCap = 'round';
      let isDrawing = false, signed = false;

      hCanvas.onmousedown = (e) => {
        isDrawing = true;
        signed = true;
        if (hPh) hPh.style.display = 'none';
        const r = hCanvas.getBoundingClientRect();
        hCtx.beginPath();
        hCtx.moveTo(e.clientX - r.left, e.clientY - r.top);
      };

      hCanvas.onmousemove = (e) => {
        if (!isDrawing) return;
        const r = hCanvas.getBoundingClientRect();
        hCtx.lineTo(e.clientX - r.left, e.clientY - r.top);
        hCtx.stroke();
      };

      window.onmouseup = () => isDrawing = false;

      if (clearBtn) clearBtn.onclick = () => {
        hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
        signed = false;
        if (hPh) hPh.style.display = 'block';
      };

      if (certBtn) certBtn.onclick = () => {
        if (!signed) alert('Please sign before certifying handover.');
        else {
          alert('🏆 Handover Acceptance Certified!\n\nThe Bel-Air Penthouse Suite has been formally accepted by the client Elena & Marcus Vance and Lead Architect Sienna Cole.');
          window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Handover Certificate successfully signed!' } }));
        }
      };
    }
  }

  // --- 5. APP CONTROLLER ---
  class AppController {
    constructor() {
      this.main = document.getElementById('view-container');
      this.initHeader();
      this.initModals();
      this.initToasts();
      this.bindEvents();

      state.subscribe(() => {
        this.render();
        this.updateHeader();
      });

      this.render();
      this.updateHeader();
    }

    initHeader() {
      document.querySelectorAll('.nav-pillar-btn[data-view]').forEach(btn => {
        btn.onclick = () => state.setActiveView(btn.getAttribute('data-view'));
      });

      const currSel = document.getElementById('currency-selector');
      if (currSel) {
        currSel.value = state.state.currentCurrency;
        currSel.onchange = (e) => {
          state.setCurrency(e.target.value);
          this.toast(`Currency switched to ${e.target.value}`);
        };
      }

      const clientTog = document.getElementById('header-client-mode-toggle');
      if (clientTog) {
        clientTog.onclick = () => {
          state.toggleClientMode();
          this.toast(state.state.isClientMode ? 'Client Presentation Mode Active' : 'Designer Mode Active (Trade Margins)');
        };
      }

      const themeBtn = document.getElementById('theme-toggle-btn');
      if (themeBtn) {
        themeBtn.onclick = () => {
          document.body.classList.toggle('light-theme');
          const isL = document.body.classList.contains('light-theme');
          themeBtn.innerText = isL ? '🌙 Dark Studio' : '☀️ Linen Light';
          this.toast(isL ? 'Switched to Linen Light Theme' : 'Switched to Architectural Dark Theme');
        };
      }

      const resetBtn = document.getElementById('btn-reset-demo');
      if (resetBtn) {
        resetBtn.onclick = () => {
          if (confirm('Reset project back to default Bel-Air Penthouse demonstration data?')) {
            state.resetToDemo();
            this.toast('Project data reset to default demo.');
          }
        };
      }
    }

    updateHeader() {
      const { activeView, isClientMode, products, tasks, snags } = state.state;
      document.querySelectorAll('.nav-pillar-btn[data-view]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === activeView);
      });

      const tog = document.getElementById('header-client-mode-toggle');
      if (tog) {
        tog.classList.toggle('active', isClientMode);
        tog.innerHTML = isClientMode
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Client Presentation Mode`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></line><line x1="1" y1="1" x2="23" y2="23"></line></svg> Designer View (Margins)`;
      }

      const bDisc = document.getElementById('badge-count-discovery');
      if (bDisc) bDisc.innerText = products.length;

      const bPm = document.getElementById('badge-count-pm');
      if (bPm) bPm.innerText = `${tasks.length} tasks`;
    }

    render() {
      const v = state.state.activeView;
      this.main.innerHTML = '';
      if (v === 'overview') renderOverview(this.main);
      else if (v === 'discovery') renderDiscovery(this.main);
      else if (v === 'design') renderDesign(this.main);
      else if (v === 'commercial') renderCommercial(this.main);
      else if (v === 'project-mgmt') renderProjectMgmt(this.main);
      else renderOverview(this.main);
    }

    bindEvents() {
      window.addEventListener('open-modal', (e) => {
        const m = document.getElementById(e.detail.modalId);
        if (m) m.classList.add('open');
      });

      window.addEventListener('open-spec-sheet', (e) => {
        this.openSpecSheet(e.detail.productId);
      });

      window.addEventListener('show-toast', (e) => {
        this.toast(e.detail.message);
      });
    }

    openSpecSheet(id) {
      const p = state.state.products.find(item => item.id === id);
      if (!p) return;
      const room = state.state.rooms.find(r => r.id === p.room);
      const modal = document.getElementById('modal-spec-sheet');
      const area = document.getElementById('spec-sheet-render-area');

      area.innerHTML = `
        <div class="spec-sheet-container">
          <div class="spec-sheet-header">
            <div>
              <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.15em; color:#888;">
                ${state.state.project.name} • ARCHITECTURAL SPECIFICATION CUT SHEET
              </div>
              <h1 class="spec-sheet-title">${p.name}</h1>
              <div style="font-size:0.85rem; color:#666; margin-top:4px;">
                Code: <strong>${p.sku}</strong> | Room: <strong>${room ? room.name : 'General'}</strong>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.4rem; font-weight:700; color:#121316;">${state.formatCurrency(p.clientPrice)}</div>
              <div style="font-size:0.75rem; color:#777;">Client Approved Unit Price</div>
              ${!state.state.isClientMode ? `
                <div style="font-size:0.75rem; color:#B45309; font-weight:600; margin-top:2px;">
                  Trade Cost: ${state.formatCurrency(p.tradeCost)} (+${p.markupPercent}% markup)
                </div>
              ` : ''}
            </div>
          </div>

          <div class="spec-sheet-grid">
            <div>
              <img src="${p.imageUrl}" alt="${p.name}" class="spec-sheet-image">
            </div>
            <div>
              <h3 style="font-family:var(--font-serif); font-size:1.15rem; margin-bottom:12px; color:#111;">Technical Specifications</h3>
              <table class="spec-detail-table">
                <tr><th>Category</th><td>${p.category}</td></tr>
                <tr><th>Manufacturer / Vendor</th><td>${p.vendor}</td></tr>
                <tr><th>Contact</th><td>${p.vendorContact || 'procurement@atelier.com'}</td></tr>
                <tr><th>Specified Finish</th><td>${p.finish}</td></tr>
                <tr><th>Dimensions (W×D×H)</th><td>${p.dimensions.width}mm × ${p.dimensions.depth}mm × ${p.dimensions.height}mm</td></tr>
                <tr><th>Lead Time</th><td>${p.leadTimeWeeks} Weeks</td></tr>
                <tr><th>Sustainability</th><td>${p.sustainabilityScore || 'Grade A'}</td></tr>
                <tr><th>Sample Status</th><td><span style="color:#059669; font-weight:600;">${p.sampleStatus}</span></td></tr>
                <tr><th>Procurement Status</th><td><span style="color:#2563EB; font-weight:600;">${p.procurementStatus}</span></td></tr>
              </table>
              <div style="margin-top:14px; font-size:0.82rem; color:#4B5563;">
                <strong>Description:</strong> ${p.description || 'Custom architectural specification.'}
              </div>
              <div style="margin-top:8px; font-size:0.8rem; color:#6B7280;">
                <strong>Care:</strong> ${p.careInstructions || 'Wipe clean with dry cloth.'}
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; border-top:1px solid #E5E7EB; padding-top:16px; margin-top:20px; font-size:0.75rem; color:#9CA3AF;">
            <div>Lead Architect: ${state.state.project.leadArchitect}</div>
            <div>Client Approval Signature: _______________________ Date: _________</div>
          </div>
        </div>
      `;

      const pr = document.getElementById('btn-print-cutsheet');
      if (pr) pr.onclick = () => window.print();

      modal.classList.add('open');
    }

    initModals() {
      document.querySelectorAll('.modal-backdrop').forEach(b => {
        b.onclick = (e) => { if (e.target === b) b.classList.remove('open'); };
      });
      document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.onclick = () => {
          const m = btn.closest('.modal-backdrop');
          if (m) m.classList.remove('open');
        };
      });

      const addF = document.getElementById('form-add-product');
      if (addF) {
        addF.onsubmit = (e) => {
          e.preventDefault();
          const name = document.getElementById('input-prod-name').value;
          const category = document.getElementById('input-prod-category').value;
          const room = document.getElementById('input-prod-room').value;
          const vendor = document.getElementById('input-prod-vendor').value;
          const finish = document.getElementById('input-prod-finish').value;
          const w = parseInt(document.getElementById('input-prod-w').value, 10) || 1200;
          const d = parseInt(document.getElementById('input-prod-d').value, 10) || 800;
          const h = parseInt(document.getElementById('input-prod-h').value, 10) || 750;
          const cost = parseFloat(document.getElementById('input-prod-cost').value) || 2000;
          const markup = parseFloat(document.getElementById('input-prod-markup').value) || 35;
          const img = document.getElementById('input-prod-image').value || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

          state.addProduct({
            name, category, room, vendor,
            sku: `CUSTOM-${Date.now().toString().slice(-4)}`,
            style: 'Bespoke Contemporary',
            finish,
            dimensions: { width: w, depth: d, height: h, unit: 'mm' },
            tradeCost: cost,
            markupPercent: markup,
            imageUrl: img,
            leadTimeWeeks: 6,
            floorplan: { x: 380, y: 240, width: Math.round(w / 25), height: Math.round(d / 25), rotation: 0 }
          });

          document.getElementById('modal-add-product').classList.remove('open');
          addF.reset();
          this.toast(`Added "${name}" to project FF&E!`);
        };
      }
    }

    initToasts() {
      this.toastBox = document.getElementById('toast-container');
    }

    toast(msg) {
      if (!this.toastBox) return;
      const t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-primary);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>${msg}</span>
      `;
      this.toastBox.appendChild(t);
      setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(100%)';
        t.style.transition = 'all 0.3s ease';
        setTimeout(() => t.remove(), 300);
      }, 3500);
    }
  }

  // Auto-init on load
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
  });
})();
