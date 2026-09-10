/* ============================================================
   Planex — Design Docket Library
   Trade-wise execution dockets for site agencies and suppliers.
   Authored from a Head of Design & Costing + 20-year Indian interiors view.
   Schedules + specifications only. NO prices.
   ============================================================ */
window.PlanexDocketData = (function () {

  const Q = {
    carcass: {
      economy: '18mm MR ply, 0.8mm laminate',
      standard: '18mm BWP ply (Century/Greenply), 1mm premium laminate',
      premium: '18mm BWP marine ply, veneer / PU / acrylic finish'
    },
    shutter: {
      economy: '0.8mm laminate (Merino)',
      standard: '1mm premium laminate (Merino/Greenlam)',
      premium: 'Duco / PU / veneer (sharp edge)'
    },
    hardware: {
      economy: 'Ebco / generic soft-close',
      standard: 'Hettich / Hafele soft-close',
      premium: 'Blum / Hettich Legrabox'
    },
    paint: {
      economy: 'Interior emulsion (Asian Paints Tractor)',
      standard: 'Premium emulsion (Asian Paints Apcolite / Nerolac Beauty)',
      premium: 'Luxury emulsion (Asian Paints Royale / Dulux Velvet)'
    },
    paintSheen: { economy: 'Matt', standard: 'Matt / Sheen', premium: 'Rich Matt / Satin' },
    polish: {
      economy: 'Melamine',
      standard: 'PU (2K)',
      premium: 'Duco / PU high-gloss'
    },
    floor: {
      economy: 'Vitrified 600x600 (Kajaria/Somany)',
      standard: 'GVT/PGVT 600x600 (Kajaria/Somany)',
      premium: 'Italian marble / engineered wood'
    },
    lighting: {
      economy: 'Philips / Wipro',
      standard: 'Philips / Wipro / Havells',
      premium: 'Philips Hue / premium fixtures'
    },
    sanitary: {
      economy: 'Hindware / Cera',
      standard: 'Jaquar / Kohler (entry)',
      premium: 'Kohler / Grohe / Duravit'
    },
    ceiling: {
      economy: 'Gypsum (Modi) on GI',
      standard: 'Gypsum (Saint-Gobain) on GI',
      premium: 'Saint-Gobain Gyproc + designer cove/POP'
    }
  };

  const DOCKETS = [
    {
      id: 'furniture', name: 'Furniture & Joinery Docket', trade: 'Millwork',
      purpose: 'Shop drawing schedule and hardware/finish specification for the joinery agency.',
      fromCategories: ['Modular & Joinery (Millwork)', 'Wardrobe Internals'],
      sections: [
        { key: 'units', title: 'Unit Schedule', columns: ['Mark', 'Unit', 'Room', 'Size (W×D×H mm)', 'Carcass', 'Shutter', 'Finish', 'Hardware'] },
        { key: 'hardware', title: 'Hardware Schedule', columns: ['Item', 'Make / Model', 'Qty', 'Unit', 'Remarks'] },
        { key: 'finishes', title: 'Finish Schedule', columns: ['Surface', 'Material', 'Code / Shade', 'Sheen', 'Remarks'] }
      ],
      defaults: { carcass: Q.carcass, shutter: Q.shutter, hardware: Q.hardware },
      notes: [
        'All carcasses in 18mm ply; backs in 6mm; edge-banding 2mm PVC matching shutter.',
        'Wardrobe/drawer hardware soft-close; hinges 110° clip-on; channels rated for load.',
        'Provide 50mm skirting gap and wall-filler scribes for uneven walls.',
        'Site-measure after plaster and before shutter fabrication; issue GFC drawings.'
      ]
    },
    {
      id: 'kitchen', name: 'Kitchen Docket', trade: 'Modular Kitchen',
      purpose: 'Cabinet, counter, appliance and accessory schedule for the kitchen vendor.',
      fromCategories: ['Kitchen Systems', 'Plumbing & Sanitary (WC)', 'Electrical & Wiring'],
      sections: [
        { key: 'cabinets', title: 'Cabinet Schedule', columns: ['Mark', 'Type', 'Size (W×D×H mm)', 'Carcass', 'Shutter', 'Drawer/Pull-out', 'Hardware'] },
        { key: 'counter', title: 'Counter & Backsplash', columns: ['Item', 'Material', 'Edge', 'Size', 'Remarks'] },
        { key: 'appliances', title: 'Appliance & Fixture Schedule', columns: ['Item', 'Make / Model', 'Qty', 'Size', 'Service required'] },
        { key: 'accessories', title: 'Accessory Schedule', columns: ['Item', 'Make', 'Qty', 'Remarks'] }
      ],
      defaults: { carcass: Q.carcass, shutter: Q.shutter, hardware: Q.hardware },
      notes: [
        'Countertop in quartz; skirting in 100mm PVC/SS; toe-kick profile.',
        'Hob/chimney cut-outs confirmed before counter fabrication; provide 4" platform.',
        'Tall unit for microwave/oven; carousel in corner; waste bin pull-out.',
        'Electrical: hob (16A), chimney (6A), RO, microwave — points above counter.'
      ]
    },
    {
      id: 'wardrobe', name: 'Wardrobe Docket', trade: 'Joinery',
      purpose: 'Wardrobe schedule, internal layout and hardware for bedside joinery.',
      fromCategories: ['Wardrobe Internals', 'Modular & Joinery (Millwork)'],
      sections: [
        { key: 'wardrobes', title: 'Wardrobe Schedule', columns: ['Mark', 'Room', 'Size (W×H mm) × Depth', 'Type', 'Shutters', 'Finish', 'Hardware'] },
        { key: 'internals', title: 'Internal Layout', columns: ['Wardrobe', 'Section', 'Fittings', 'Shelves', 'Drawers', 'Rod', 'Remarks'] },
        { key: 'mirrorLight', title: 'Mirror & Lighting', columns: ['Wardrobe', 'Mirror', 'Internal light', 'Remarks'] }
      ],
      defaults: { carcass: Q.carcass, shutter: Q.shutter, hardware: Q.hardware },
      notes: [
        'Sliding shutters on top/bottom tracks; anti-jump rollers; soft-close.',
        'Loft above wardrobe to ceiling; internal LED strip on door switch.',
        'Full-height mirror inside one shutter; locker for valuables.',
        'Clear 900mm in front of wardrobe for sliding operation.'
      ]
    },
    {
      id: 'lighting', name: 'Lighting Docket', trade: 'Lighting',
      purpose: 'Fixture schedule, layout and control for the lighting supplier and electrician.',
      fromCategories: ['Lighting', 'Electrical & Wiring'],
      sections: [
        { key: 'fixtures', title: 'Fixture Schedule', columns: ['Mark', 'Fixture', 'Make / Spec', 'W', 'CCT', 'Beam', 'Qty', 'Location'] },
        { key: 'layout', title: 'Lighting Layout (by room)', columns: ['Room', 'Ambient', 'Task', 'Accent', 'Controls', 'Lux target'] },
        { key: 'control', title: 'Switching & Control', columns: ['Room', 'Switch group', 'Dimming', 'Scene', 'Remarks'] }
      ],
      defaults: { make: Q.lighting },
      notes: [
        'Ambient 3000K warm white; task 4000K (kitchen/study); accent 2700–3000K.',
        'Cove 24V profile; spots 24°/36° beam; drivers in accessible cove/ceiling void.',
        'Lux guidance: living 150–200, kitchen 300–500, study 300–500, bedroom 100–150.',
        'Dimmers/scene control per room; provision for future smart control.'
      ]
    },
    {
      id: 'ceiling', name: 'False Ceiling Docket', trade: 'Ceiling',
      purpose: 'Ceiling levels, materials and cut-outs for the ceiling contractor.',
      fromCategories: ['False Ceiling', 'HVAC & Ventilation'],
      sections: [
        { key: 'levels', title: 'Ceiling Schedule (by room)', columns: ['Room', 'Area (sqft)', 'Type', 'Framework', 'Perimeter level', 'Centre level', 'Remarks'] },
        { key: 'details', title: 'Details & Cut-outs', columns: ['Item', 'Location', 'Size', 'Remarks'] },
        { key: 'spec', title: 'Material & Framework', columns: ['Item', 'Specification', 'Make'] }
      ],
      defaults: { material: Q.ceiling },
      notes: [
        'GI framework at 610mm centres; perimeter angle; 12.5mm boarding.',
        'Cove for concealed lighting; POP cornice where specified.',
        'Cut-outs: lights, AC indoor unit, speakers, access panels (600×600).',
        'Maintain minimum 2.6m clear height; coordinate with AC piping and ducts.'
      ]
    },
    {
      id: 'paint', name: 'Paint & Polish Docket', trade: 'Painting',
      purpose: 'Surface-wise paint/polish system and shades for the painting contractor.',
      fromCategories: ['Painting & Polishing'],
      sections: [
        { key: 'surfaces', title: 'Paint Schedule (by room)', columns: ['Room', 'Surface', 'System', 'Product', 'Shade code', 'Sheen', 'Coats'] },
        { key: 'prep', title: 'Surface Preparation', columns: ['Surface', 'Preparation', 'Primer', 'Putty', 'Remarks'] },
        { key: 'wood', title: 'Wood & Metal Polish', columns: ['Item', 'System', 'Finish', 'Remarks'] }
      ],
      defaults: { product: Q.paint, sheen: Q.paintSheen, polish: Q.polish },
      notes: [
        'Two coats putty for new plaster; primer + 2 coats paint.',
        'Shade codes from fan decks (Asian Paints / Nerolac / Berger) on the schedule.',
        'Wood: melamine/PU/Duco per tier; metal: enamel/DUCO.',
        'Damp walls: damp-block primer before putty.'
      ]
    },
    {
      id: 'flooring', name: 'Flooring Docket', trade: 'Flooring',
      purpose: 'Room-wise flooring, laying pattern and skirting specification.',
      fromCategories: ['Flooring', 'Skirting, Thresholds & Sills'],
      sections: [
        { key: 'rooms', title: 'Flooring Schedule (by room)', columns: ['Room', 'Area (sqft)', 'Material', 'Size', 'Pattern', 'Direction', 'Skirting', 'Adhesive/Grout'] },
        { key: 'prep', title: 'Substrate & Details', columns: ['Item', 'Specification', 'Remarks'] }
      ],
      defaults: { material: Q.floor },
      notes: [
        'Dry-lay and get client approval for tile layout before fixing.',
        'Expansion joints at door thresholds and large spans; epoxied grout in wet areas.',
        'Level tolerance ±2mm over 2m; screed where deviation exceeds.',
        'Skirting matching flooring / 100mm; threshold in granite/SS at bath entries.'
      ]
    },
    {
      id: 'electrical', name: 'Electrical Docket', trade: 'Electrical',
      purpose: 'Point schedule, circuits and load list for the electrical contractor.',
      fromCategories: ['Electrical & Wiring', 'Lighting'],
      sections: [
        { key: 'points', title: 'Point Schedule (by room)', columns: ['Room', 'Point type', 'Height (mm)', 'Qty', 'Remarks'] },
        { key: 'circuits', title: 'Circuit & DB Schedule', columns: ['Circuit', 'Description', 'Load (W)', 'MCB', 'Cable size'] },
        { key: 'control', title: 'Switch Control Chart', columns: ['Room', 'Board', 'Controls', 'Remarks'] }
      ],
      defaults: {},
      notes: [
        'Switch height 1200mm; socket 300mm (low) / 1100mm (above counter); AC 1800mm.',
        'Separate circuits for AC, kitchen, geyser; RCCB + earthing.',
        '16A for heavy loads; 6A lighting; USB points at bedside.',
        'Coordinate conduit routing with plumbing and ceiling before chasing.'
      ]
    },
    {
      id: 'plumbing', name: 'Plumbing & Sanitary Docket', trade: 'Plumbing',
      purpose: 'Fixture schedule, layout and point heights for plumber and sanitary supplier.',
      fromCategories: ['Plumbing & Sanitary (WC)', 'Waterproofing'],
      sections: [
        { key: 'fixtures', title: 'Fixture Schedule', columns: ['Mark', 'Fixture', 'Make / Model', 'Qty', 'Location', 'Remarks'] },
        { key: 'points', title: 'Point Schedule', columns: ['Location', 'Point', 'Height (mm)', 'Size', 'Remarks'] },
        { key: 'lines', title: 'Water & Drainage', columns: ['Item', 'Specification', 'Remarks'] }
      ],
      defaults: { make: Q.sanitary },
      notes: [
        'CPVC supply (Astral/Ashirvad) concealed; UPVC drainage with slope 1:60.',
        'Point heights: basin 750, shower 2100, health faucet 750, geyser 1800.',
        'Waterproofing before plumbing chase closure; ponding test 24h.',
        'Isolation valves, floor traps with grating, access for maintenance.'
      ]
    },
    {
      id: 'doors', name: 'Doors & Windows Docket', trade: 'Fabrication',
      purpose: 'Door/window schedule with frame, shutter, finish and hardware.',
      fromCategories: ['Doors & Windows'],
      sections: [
        { key: 'doors', title: 'Door Schedule', columns: ['Mark', 'Location', 'Size (W×H mm)', 'Frame', 'Shutter', 'Finish', 'Hardware', 'Remarks'] },
        { key: 'windows', title: 'Window Schedule', columns: ['Mark', 'Location', 'Size (W×H mm)', 'Type', 'Glass', 'Mesh', 'Finish'] }
      ],
      defaults: {},
      notes: [
        'Main door solid core with security fittings; internal flush doors.',
        'Hardware: locks, handles, hinges, closers, stoppers per door.',
        'UPVC/aluminium windows with mesh; sill and waterproofing at openings.',
        'Frame fixing after plaster reveals; maintain 4mm gap and seal.'
      ]
    },
    {
      id: 'wall', name: 'Wall Finishes & Cladding Docket', trade: 'Finishes',
      purpose: 'Surface-wise cladding/finish schedule with areas and adhesives.',
      fromCategories: ['Wall Finishes & Cladding'],
      sections: [
        { key: 'surfaces', title: 'Wall Finish Schedule', columns: ['Location', 'Finish', 'Material / Make', 'Area (sqft)', 'Adhesive / Fixing', 'Trims', 'Remarks'] }
      ],
      defaults: {},
      notes: [
        'Fluted/WPC louvers on ply backing; 3D panels per layout.',
        'Wallpaper: primer + adhesive; confirm design repeat and batch.',
        'Dado tiling with spacers; stone cladding with mechanical fixing + adhesive.',
        'Trims in SS/aluminium for edges; protect till handover.'
      ]
    },
    {
      id: 'hvac', name: 'HVAC & Ventilation Docket', trade: 'HVAC',
      purpose: 'AC locations, piping/drain routing and ventilation for the HVAC vendor.',
      fromCategories: ['HVAC & Ventilation'],
      sections: [
        { key: 'ac', title: 'AC Schedule', columns: ['Mark', 'Room', 'Type', 'Tonnage', 'Location', 'Piperun (m)', 'Remarks'] },
        { key: 'vent', title: 'Ventilation Schedule', columns: ['Location', 'Item', 'Size', 'Ducting', 'Remarks'] }
      ],
      defaults: {},
      notes: [
        'Copper piping insulated; condensate drain with slope to nearest point.',
        'Cut-outs in ceiling/joinery coordinated; indoor unit clearances maintained.',
        'Exhaust with ducting for kitchen/baths; back-draught shutter.',
        'Vacuum and pressure-test piping before commissioning.'
      ]
    },
    {
      id: 'site', name: 'Site Execution & Handover Docket', trade: 'Site',
      purpose: 'Sequence, protection, QC checkpoints and handover for the site team.',
      fromCategories: ['Cleaning, Pest Control & Handover'],
      sections: [
        { key: 'sequence', title: 'Sequence of Works', columns: ['Stage', 'Activity', 'Predecessor', 'Duration', 'Remarks'] },
        { key: 'qc', title: 'QC Checkpoints', columns: ['Trade', 'Checkpoint', 'Standard', 'Stage', 'Result'] },
        { key: 'handover', title: 'Handover Checklist', columns: ['Item', 'Responsibility', 'Status', 'Remarks'] }
      ],
      defaults: {},
      notes: [
        'Protect floors/joinery during works; dust screens between rooms.',
        'Stage-wise QC sign-off before the next trade starts.',
        'Snag list with photos; close within agreed window.',
        'Handover: as-builts, warranties, O&M, spare materials, deep clean.'
      ]
    }
  ];

  return { DOCKETS: DOCKETS, QUALITY_DEFAULTS: Q };
})();
