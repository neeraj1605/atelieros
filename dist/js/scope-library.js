/* ============================================================
   Planex — Scope Library
   Work-package templates + indicative Indian market rates.
   Authored from a Head of Design & Costing perspective.
   Rates are INDICATIVE (standard tier, 2026 metro India) and editable.
   ============================================================ */
window.PlanexScopeData = (function () {

  // qty expressions the engine understands:
  //   area | area*<f> | perimeter | wallArea | room | fixed:<n>
  // room kinds: living, dining, kitchen, bedroom, kids, guest, study,
  //             bath, foyer, pooja, balcony, utility, other

  const PROJECT_TYPES = [
    {
      id: 'ready',
      name: 'New Flat — Ready to Occupy',
      short: 'Ready to occupy',
      description: 'Builder-finished flat. Scope covers finishing, joinery, furniture and styling — no civil, waterproofing or core services.',
      rateFactor: 1.0
    },
    {
      id: 'renovation',
      name: 'Renovation',
      short: 'Renovation',
      description: 'Occupied home being redone. Adds demolition, debris, protection, civil repairs, waterproofing and services rework.',
      rateFactor: 1.12
    },
    {
      id: 'construction',
      name: 'Complete Construction (Bare Shell)',
      short: 'Bare shell',
      description: 'Bare-shell build. Full civil, services rough-in, waterproofing, finishes, joinery, furniture and handover.',
      rateFactor: 1.18
    }
  ];

  const QUALITY = [
    { id: 'economy', name: 'Economy', rateFactor: 0.78 },
    { id: 'standard', name: 'Standard', rateFactor: 1.0 },
    { id: 'premium', name: 'Premium', rateFactor: 1.55 }
  ];

  // Each activity: [name, detail, unit, qtyExpr, rate]
  const PACKAGES = [
    {
      id: 'demolition', name: 'Demolition & Debris', types: ['renovation', 'construction'],
      scope: 'room', rooms: ['*'], desc: 'Careful dismantling of existing finishes and services, with debris removal.',
      activities: [
        ['Dismantling of existing finishes', 'Flooring, tiles, skirting, ceiling, cladding removal', 'sqft', 'area', 45],
        ['Breakage of masonry / partition', 'Where layout is being changed', 'sqft', 'area*0.15', 85],
        ['Service chase cutting', 'Conduits and plumbing chases', 'rft', 'fixed:40', 65],
        ['Debris removal & disposal', 'Bagging, hauling, society disposal charges', 'LS', 'fixed:1', 8000],
        ['Site protection', 'Floor/wall masking, dust screens during works', 'sqft', 'area*0.8', 18]
      ]
    },
    {
      id: 'civil', name: 'Civil & Masonry', types: ['renovation', 'construction'],
      scope: 'room', rooms: ['*'], desc: 'Brickwork, plaster, levelling and civil repairs to receive finishes.',
      activities: [
        ['Brickwork / partition', '100mm or 150mm block work where required', 'sqft', 'area*0.12', 320],
        ['Internal plaster', 'Cement plaster to new / damaged areas', 'sqft', 'area*0.5', 85],
        ['POP punning / levelling', 'POP punning to receive paint', 'sqft', 'wallArea', 42],
        ['Threshold & lintel fixes', 'Door thresholds, lintels, sills', 'nos', 'room', 2200]
      ]
    },
    {
      id: 'waterproofing', name: 'Waterproofing', types: ['renovation', 'construction'],
      scope: 'room', rooms: ['bath', 'kitchen', 'balcony', 'utility'], desc: 'Wet-area and open-area waterproofing with protective screed.',
      activities: [
        ['Wet-area waterproofing', '2-coat membrane + protective screed + ponding test', 'sqft', 'area', 175],
        ['Sunken slab / shaft treatment', 'Where sunken or shafts exist', 'sqft', 'area*0.6', 210],
        ['Balcony / terrace waterproofing', 'Brush-applied membrane + slope', 'sqft', 'area', 165]
      ]
    },
    {
      id: 'flooring', name: 'Flooring', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['*'], desc: 'Supply and laying of floor finishes with skirting.',
      activities: [
        ['Vitrified tile flooring', '600x600 vitrified, grouting, spacers included', 'sqft', 'area*1.05', 145],
        ['Engineered wood / laminate', 'Bedrooms — engineered wood with underlay', 'sqft', 'area*1.08', 320],
        ['Italian marble', 'Premium — Italian marble with polishing', 'sqft', 'area*1.08', 450],
        ['Skirting', 'Matching skirting with adhesive', 'rft', 'perimeter', 180],
        ['Screed / levelling', 'Cement screed where deviation exists', 'sqft', 'area*0.4', 95]
      ]
    },
    {
      id: 'wall', name: 'Wall Finishes & Cladding', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['*'], desc: 'Featured wall finishes and cladding.',
      activities: [
        ['Texture / specialty paint', 'Accent wall texture finish', 'sqft', 'fixed:80', 90],
        ['Fluted / WPC louvers', 'TV wall or accent louver panelling', 'sqft', 'fixed:60', 450],
        ['Wallpaper', 'Imported / premium wallpaper with adhesive', 'sqft', 'fixed:60', 120],
        ['3D wall panels', 'Feature panel behind TV / bed', 'sqft', 'fixed:40', 380],
        ['Dado tiling', 'Kitchen backsplash / bath dado', 'sqft', 'fixed:50', 160]
      ]
    },
    {
      id: 'painting', name: 'Painting & Polishing', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['*'], desc: 'Full putty, primer and topcoats, plus woodwork polishing.',
      activities: [
        ['Wall & ceiling painting', 'Putty + primer + 2 coats premium emulsion', 'sqft', 'wallArea', 55],
        ['Enamel on woodwork', 'Doors, frames, grills — enamel finish', 'sqft', 'fixed:120', 62],
        ['Melamine / PU polish', 'Factory or site polish on joinery', 'sqft', 'fixed:150', 90],
        ['Exterior / balcony paint', 'Weatherproof exterior emulsion', 'sqft', 'fixed:120', 58]
      ]
    },
    {
      id: 'ceiling', name: 'False Ceiling', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['living', 'dining', 'bedroom', 'kids', 'guest', 'study', 'kitchen', 'bath', 'foyer'],
      desc: 'Gypsum/POP ceilings with cove, service provisions and access panels.',
      activities: [
        ['Gypsum false ceiling', 'Gypsum board on GI framework, jointing', 'sqft', 'area*0.8', 78],
        ['POP / plaster ceiling', 'POP mouldings and cornice', 'rft', 'perimeter', 210],
        ['Cove provision', 'Cove for concealed lighting', 'rft', 'perimeter*0.6', 130],
        ['Access panel', 'For AC/service access', 'nos', 'fixed:2', 1800]
      ]
    },
    {
      id: 'electrical', name: 'Electrical & Wiring', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['*'], desc: 'Concealed conduits, wiring, modular switches and distribution.',
      activities: [
        ['Light / fan points', 'Concealed conduit + wiring per point', 'point', 'fixed:6', 1250],
        ['6A / 16A sockets', 'Modular socket points with wiring', 'point', 'fixed:4', 1150],
        ['Modular switch board', 'Modular plate with switches & sockets', 'nos', 'fixed:2', 3200],
        ['DB & MCBs', 'Distribution board with MCBs / RCCB', 'nos', 'fixed:1', 12000],
        ['Earthing & inverter point', 'Earthing pit provision + inverter point', 'LS', 'fixed:1', 9000]
      ]
    },
    {
      id: 'lighting', name: 'Lighting', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['*'], desc: 'Fixture supply and installation across all rooms.',
      activities: [
        ['Cove / profile lighting', 'LED profile in cove', 'rft', 'perimeter*0.6', 380],
        ['Spot / track lights', 'Adjustable spotlights on track', 'nos', 'fixed:6', 1450],
        ['Pendant / chandelier', 'Feature pendant at dining / living', 'nos', 'fixed:2', 6500],
        ['Wall sconces', 'Bedside / corridor sconces', 'nos', 'fixed:4', 2800],
        ['Mirror light', 'Bath / dressing mirror light', 'nos', 'fixed:2', 3200]
      ]
    },
    {
      id: 'plumbing', name: 'Plumbing & Sanitary (WC)', types: ['renovation', 'construction'],
      scope: 'room', rooms: ['bath', 'kitchen', 'balcony', 'utility'], desc: 'Concealed plumbing, drainage and sanitary fixtures.',
      activities: [
        ['Concealed plumbing', 'CPVC supply + UPVC drainage lines', 'rft', 'perimeter', 420],
        ['WC / commode', 'Wall-hung / floor-mounted WC', 'nos', 'fixed:1', 24000],
        ['Wash basin', 'Counter / wall-mounted basin', 'nos', 'fixed:1', 12500],
        ['Faucets & diverters', 'CP fittings, diverter, health faucet', 'set', 'fixed:1', 14000],
        ['Rain shower / shower set', 'Overhead rain shower with arm', 'set', 'fixed:1', 16000],
        ['Geyser point', 'Geyser with point and fixture', 'nos', 'fixed:1', 18000]
      ]
    },
    {
      id: 'kitchen', name: 'Kitchen Systems', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['kitchen'], desc: 'Modular kitchen with carcass, shutters, counter and appliances.',
      activities: [
        ['Base & wall units', 'BWP ply carcass + premium shutters, soft-close', 'rft', 'fixed:18', 7200],
        ['Tall / pantry units', 'Tall unit with pull-outs and carousels', 'rft', 'fixed:4', 8500],
        ['Countertop', 'Quartz countertop with edge profile', 'rft', 'fixed:16', 5600],
        ['Backsplash', 'Backsplash in tile / glass', 'sqft', 'fixed:28', 190],
        ['Chimney & hob', 'Auto-clean chimney + hob set', 'set', 'fixed:1', 58000],
        ['Sink & faucet', 'Under-mount SS sink + pull-down faucet', 'set', 'fixed:1', 19000]
      ]
    },
    {
      id: 'wardrobe', name: 'Wardrobe Internals', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['bedroom', 'kids', 'guest'], desc: 'Wardrobes with modular internal fittings.',
      activities: [
        ['Sliding-door wardrobe', 'BWP carcass, sliding shutters, loft', 'rft', 'fixed:8', 7800],
        ['Internal fittings', 'Rods, shelves, drawers, pull-outs', 'rft', 'fixed:8', 1900],
        ['Internal mirror & lighting', 'Mirror and LED strip inside wardrobe', 'nos', 'fixed:1', 6500]
      ]
    },
    {
      id: 'joinery', name: 'Modular & Joinery (Millwork)', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['living', 'dining', 'study', 'foyer', 'pooja', 'kids', 'guest'], desc: 'TV units, crockery, study, foyer and custom millwork.',
      activities: [
        ['TV unit', 'TV unit with drawers and back panel', 'nos', 'fixed:1', 38000],
        ['Crockery / bar unit', 'Crockery display with glass shutters', 'nos', 'fixed:1', 42000],
        ['Study table', 'Wall-mounted study with drawers', 'nos', 'fixed:1', 34000],
        ['Foyer / shoe rack', 'Entrance unit with seating and storage', 'nos', 'fixed:1', 28000],
        ['Pooja unit', 'Pooja mandir with storage and lighting', 'nos', 'fixed:1', 32000]
      ]
    },
    {
      id: 'doors', name: 'Doors & Windows', types: ['renovation', 'construction'],
      scope: 'room', rooms: ['*'], desc: 'Doors, frames, hardware and fenestration.',
      activities: [
        ['Internal door', 'Flush door + frame + hardware, painted', 'nos', 'fixed:2', 28000],
        ['Main door', 'Solid-core main door with hardware', 'nos', 'fixed:1', 68000],
        ['UPVC / aluminium window', 'Sliding window with mesh', 'sqft', 'fixed:40', 880],
        ['Window grill', 'MS / SS grill', 'sqft', 'fixed:20', 420]
      ]
    },
    {
      id: 'hvac', name: 'HVAC & Ventilation', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['living', 'dining', 'bedroom', 'kitchen', 'study'], desc: 'Air-conditioning provisions and ventilation.',
      activities: [
        ['AC point', 'Copper piping, drainage, electrical point', 'nos', 'fixed:1', 6800],
        ['AC unit (split / cassette)', 'Split or cassette AC supply & install', 'nos', 'fixed:1', 52000],
        ['Exhaust / ventilation', 'Exhaust fan with ducting', 'nos', 'fixed:1', 4500]
      ]
    },
    {
      id: 'furniture', name: 'Loose Furniture', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['living', 'dining', 'bedroom', 'kids', 'guest', 'study', 'balcony'], desc: 'Loose and upholstered furniture.',
      activities: [
        ['Sofa set', '3-seater + accent chairs', 'set', 'fixed:1', 92000],
        ['Bed & mattress', 'Upholstered bed with mattress', 'set', 'fixed:1', 88000],
        ['Dining set', 'Dining table with chairs', 'set', 'fixed:1', 85000],
        ['Coffee / side tables', 'Centre and side tables', 'set', 'fixed:1', 26000],
        ['Outdoor / balcony furniture', 'Weather-resistant seating', 'set', 'fixed:1', 22000]
      ]
    },
    {
      id: 'soft', name: 'Soft Furnishings', types: ['ready', 'renovation', 'construction'],
      scope: 'room', rooms: ['*'], desc: 'Curtains, blinds, upholstery and decor.',
      activities: [
        ['Curtains', 'Fabric, lining, hardware, installation', 'sqft', 'fixed:60', 240],
        ['Blinds', 'Roller / zebra blinds', 'sqft', 'fixed:40', 190],
        ['Rugs & carpets', 'Area rugs', 'sqft', 'fixed:40', 160],
        ['Wall art & mirrors', 'Framed art, mirrors, decor', 'set', 'fixed:1', 32000]
      ]
    },
    {
      id: 'automation', name: 'Home Automation & Network', types: ['ready', 'renovation', 'construction'],
      scope: 'project', rooms: [], desc: 'Smart switches, VDP, sensors and networking.',
      activities: [
        ['Smart switches', 'Wi-Fi smart switch modules', 'nos', 'fixed:8', 3200],
        ['Video door phone', 'VDP with indoor monitor', 'nos', 'fixed:1', 22000],
        ['Sensors & hub', 'Motion sensors with automation hub', 'set', 'fixed:1', 18000],
        ['Wi-Fi / data points', 'Structured data points', 'point', 'fixed:4', 2600]
      ]
    },
    {
      id: 'shell', name: 'Structural & Shell Finishes', types: ['construction'],
      scope: 'room', rooms: ['*'], desc: 'Shell-stage works in a bare build — external plaster, slabs, coping and structural repairs.',
      activities: [
        ['External plaster', 'Cement plaster to external / exposed faces', 'sqft', 'wallArea*0.6', 92],
        ['Slab / beam finishing', 'Levelling and finishing of RCC surfaces', 'sqft', 'area*0.35', 140],
        ['Coping, chajja & moulding', 'Sills, coping and chajja in cement/POP', 'rft', 'perimeter*0.5', 260],
        ['Structural repairs / grouting', 'Crack stitching and grouting where required', 'LS', 'fixed:1', 24000]
      ]
    },
    {
      id: 'external', name: 'External & Common Works', types: ['construction'],
      scope: 'project', rooms: [], desc: 'External facade, terrace, common areas and landscape.',
      activities: [
        ['External / facade painting', 'Weatherproof exterior finish', 'sqft', 'fixed:600', 62],
        ['Terrace / open-area treatment', 'Screed, slope and protective finish', 'sqft', 'fixed:400', 180],
        ['Compound, parking & paving', 'Driveway / paving works', 'LS', 'fixed:1', 85000],
        ['Landscape & softscape', 'Planters, planting and irrigation', 'LS', 'fixed:1', 65000]
      ]
    },
    {
      id: 'sitepm', name: 'Site Management & Safety', types: ['renovation', 'construction'],
      scope: 'project', rooms: [], desc: 'Supervision, safety, barricading and quality control through execution.',
      activities: [
        ['Site supervision & PM', 'Dedicated supervision through the programme', 'LS', 'fixed:1', 65000],
        ['Safety & barricading', 'Helmets, safety nets, barricades, signage', 'LS', 'fixed:1', 18000],
        ['Quality & snag management', 'Stage-wise QC, checklists and snag closure', 'LS', 'fixed:1', 22000]
      ]
    },
    {
      id: 'cleaning', name: 'Cleaning, Pest Control & Handover', types: ['ready', 'renovation', 'construction'],
      scope: 'project', rooms: [], desc: 'Deep cleaning, pest control and snag-free handover.',
      activities: [
        ['Deep cleaning', 'Post-work deep cleaning', 'sqft', 'area', 7],
        ['Pest control', 'Pre-handover pest treatment', 'LS', 'fixed:1', 6500],
        ['Snag list & handover', 'Snag rectification and handover', 'LS', 'fixed:1', 9000]
      ]
    }
  ];

  return { PROJECT_TYPES, QUALITY, PACKAGES };
})();
