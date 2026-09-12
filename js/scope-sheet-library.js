/* ============================================================
   Planex — Scope Sheet Library
   Vendor-facing RFQ scope templates, authored from a Head of Design
   & Costing / 20-year Indian interiors view. Documents + specifications
   only. NO prices. Rates are left for the vendor to quote.
   ============================================================ */
window.PlanexScopeSheetData = (function () {

  const SHEET = {
    main: { no: 'A-01', title: 'Main Layout Plan' },
    furniture: { no: 'A-02', title: 'Furniture Layout Plan' },
    ceiling: { no: 'A-03', title: 'False Ceiling Layout Plan' },
    lighting: { no: 'A-04', title: 'Lighting Layout Plan' }
  };

  function drwSheet(kind) { const s = SHEET[kind]; return { kind: 'sheet', key: kind, no: s.no, label: s.title }; }
  function drwLayout(kind, label) { return { kind: 'layout', key: kind, label: label }; }
  function drwUnit(label) { return { kind: 'unit', key: 'units', label: label || 'Unit elevations, internal & section' }; }

  const SITE_BASE = [
    'Site cleared and handed over; work area free of other trades at the time of execution.',
    'Power and water available at site at no cost to the vendor.',
    'Working lift / stair access available for material movement.',
    'Working hours and society / building permissions as per project rules.',
    'Secure dry storage available for materials, hardware and tools during the contract.'
  ];

  // activity: [name]  → basis rule. First match wins.
  function rule(re, basis, method) { return { re: re, basis: basis, method: method }; }

  const SITE_MEASURE = 'Measured on site after plaster and before fabrication; quantity invoiced on actual measured basis as per the drawings.';

  const TRADES = {
    joinery: {
      packageId: 'joinery', trade: 'Millwork', title: 'Furniture & Joinery — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: true, requireFinish: true },
      specKeys: ['carcass', 'shutter', 'hardware'],
      drawings: [drwSheet('main'), drwSheet('furniture'), drwUnit()],
      basisDefaults: { basis: 'site', method: 'Joinery measured in running feet along carcass width at the specified depth; height measured floor to top of carcass (loft measured separately).' },
      activityRules: [rule(/unit|tv|crockery|study|foyer|pooja|book|bar|table/i, 'site', SITE_MEASURE)],
      inclusions: [
        'Design co-ordination, shop drawings and GFC drawings for vendor scope.',
        'Supply and installation of all carcasses, shutters, loft and internals as per schedule.',
        'Edge banding, wall fillers and scribes to close gaps against uneven walls.',
        'All hardware as per the hardware schedule, fixed and tested.',
        'Site protection of own work until handover.'
      ],
      exclusions: [
        'Civil / masonry openings, plaster and levelling.',
        'Electrical points, wiring and lighting fixtures (by others).',
        'Flooring, painting and polish of the space (unless scheduled).',
        'Loose furniture, furnishings and decor.'
      ],
      clientSupply: ['Locks and special hardware where marked client-supplied.', 'Appliances / inserts where marked in the schedule.'],
      vendorSupply: ['Ply, laminates, veneers, edge band, adhesive and all hardware per schedule.'],
      requiredAssumptions: SITE_BASE.concat([
        'Site measurement is taken after final plaster and floor level and before shutter fabrication.',
        'Client approves shop drawings and physical finish/hardware samples before production.',
        'Height of ceiling and loft line confirmed before carcass fabrication.'
      ]),
      measurement: [
        'Running feet measured along carcass width at agreed depth; height floor to top of carcass.',
        'Loft, drawers, pull-outs and internals are measured/priced separately where itemised.',
        'Wastage is deemed included in the quoted rate.'
      ],
      qc: [
        'Shop drawings approved before production.',
        'Carcass ply/brand and laminate batch verified on delivery against samples.',
        'Soft-close tested; alignment and level checked at installation.',
        'Touch-up and protection completed before handover.'
      ],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on delivery / on installation (stages as agreed)', retention: 'As agreed', warranty: 'Minimum 2 years on hardware; workmanship as per vendor standard', defectLiability: 'Snag closure within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['Coordinate with electrical and ceiling before carcass installation.', 'Finish polish after paint and flooring where applicable.'] }
    },

    wardrobe: {
      packageId: 'wardrobe', trade: 'Joinery', title: 'Wardrobe Internals — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: true, requireFinish: true },
      specKeys: ['carcass', 'shutter', 'hardware'],
      drawings: [drwSheet('main'), drwSheet('furniture'), drwUnit('Wardrobe elevations & internal layout')],
      basisDefaults: { basis: 'site', method: 'Wardrobe measured in running feet along width at 600mm depth; height up to the specified top; loft measured separately.' },
      activityRules: [],
      inclusions: ['Sliding/hinged shutters with tracks and rollers.', 'Internal rods, shelves, drawers, pull-outs and loft.', 'Full-height mirror and internal LED where scheduled.', 'All hardware and installation.'],
      exclusions: ['Civil work, plaster and floor levelling.', 'Electrical point for internal light (point by others; connection by vendor).'],
      clientSupply: [], vendorSupply: ['Vendor supplies all materials, fittings and hardware per schedule.'],
      requiredAssumptions: SITE_BASE.concat(['Site measurement after plaster and floor level.', 'Sliding clearance in front of wardrobe maintained by others.']),
      measurement: ['Running feet along width at 600mm depth.', 'Internals/loft measured separately where itemised.'],
      qc: ['Tracks aligned; soft-close checked.', 'Mirror and light tested.', 'Edges and scribes finished.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on delivery / on installation', retention: 'As agreed', warranty: 'Minimum 2 years on hardware', defectLiability: 'Snag closure within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['After ceiling and before flooring where possible.'] }
    },

    kitchen: {
      packageId: 'kitchen', trade: 'Modular Kitchen', title: 'Modular Kitchen — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: true, requireFinish: true },
      specKeys: ['carcass', 'shutter', 'hardware'],
      drawings: [drwSheet('main'), drwSheet('furniture'), drwUnit('Kitchen elevations, counter & service points')],
      basisDefaults: { basis: 'site', method: 'Base/wall/tall units measured in running feet at agreed depth; counter measured running feet × agreed depth; appliances per unit.' },
      activityRules: [rule(/unit|cabinet|pantry|tall|base|wall/i, 'site', 'Kitchen units measured in running feet at agreed depth.'), rule(/counter|top/i, 'site', 'Counter measured in running feet at agreed depth.')],
      inclusions: ['Base, wall and tall units with carcass, shutters and internals.', 'Countertop with edge profile and cut-outs.', 'Backsplash, skirting and toe-kick.', 'Chimney, hob, sink and faucet as scheduled.', 'All hardware, accessories and installation.'],
      exclusions: ['Civil work, plumbing rough-in and electrical points (by others).', 'Gas piping and connection.', 'Loose appliances not in the schedule.'],
      clientSupply: ['Appliances marked client-supplied, supplied and connected under vendor supervision.'],
      vendorSupply: ['Ply, laminate/veneer, quartz, hardware, sinks, faucets and accessories per schedule.'],
      requiredAssumptions: SITE_BASE.concat([
        'Plumbing and electrical rough-in completed and tested before cabinet installation.',
        'Hob/chimney cut-outs confirmed before counter fabrication.',
        'Gas connection and utility point available for commissioning.'
      ]),
      measurement: ['Units and counter measured in running feet at agreed depth.', 'Cut-outs and appliances per unit.'],
      qc: ['Counter level and edge finish checked.', 'Hardware and pull-outs operate; soft-close tested.', 'Plumbing leak test before handover.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on delivery / on installation', retention: 'As agreed', warranty: 'Minimum 2 years on hardware', defectLiability: 'Snag closure within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['After plumbing/electrical rough-in and plaster; before flooring skirting.'] }
    },

    lighting: {
      packageId: 'lighting', trade: 'Lighting', title: 'Lighting — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: false, requireFinish: true },
      specKeys: ['lighting'],
      drawings: [drwSheet('lighting'), drwLayout('lighting', 'Lighting layout per room')],
      basisDefaults: { basis: 'unit', method: 'Priced per fixture/point; cove and profile measured running feet.' },
      activityRules: [rule(/cove|profile|strip/i, 'site', 'Cove / profile measured in running feet along the cove length.'), rule(/spot|pendant|chandelier|sconce|mirror/i, 'unit', 'Priced per fixture, installed and tested.')],
      inclusions: ['Supply, installation and testing of all fixtures and drivers.', 'Cove/profile, spots, pendants, sconces and mirror lights as scheduled.', 'CCT and beam as per schedule.', 'Wiring from the nearest point to the fixture.'],
      exclusions: ['Concealed conduits, wiring and switch boards (electrical scope).', 'False ceiling and cove carpentry.', 'Dimmers/scene controllers unless scheduled.'],
      clientSupply: [], vendorSupply: ['Fixtures, drivers, profiles and consumables per schedule.'],
      requiredAssumptions: SITE_BASE.concat(['Ceiling and cove ready before fixture installation.', 'Access to drivers/cove for maintenance maintained.']),
      measurement: ['Fixtures priced per unit; cove/profile measured running feet.'],
      qc: ['CCT and beam verified against schedule.', 'Dimming/scene operation tested.', 'All fixtures tested for continuity and earthing.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on delivery / on installation', retention: 'As agreed', warranty: 'Fixture warranty as per make (min 2 years)', defectLiability: 'Replace failed units within warranty' },
      timeline: { duration: 'As per the project programme', coordination: ['After ceiling framework, before boarding where concealed.', 'Coordinate cut-outs with the ceiling vendor.'] }
    },

    ceiling: {
      packageId: 'ceiling', trade: 'Ceiling', title: 'False Ceiling — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: true, requireFinish: false },
      specKeys: ['ceiling'],
      drawings: [drwSheet('ceiling'), drwLayout('lighting', 'Lighting cut-out reference')],
      basisDefaults: { basis: 'site', method: 'Ceiling measured on room carpet area + agreed allowance for drops and cove; cornice measured running feet.' },
      activityRules: [rule(/gypsum|ceiling/i, 'site', 'Measured on room carpet area + allowance for drops/cove.'), rule(/pop|cornice|moulding/i, 'site', 'POP/cornice measured running feet.')],
      inclusions: ['GI framework, boarding, jointing and finishing.', 'Perimeter drop, cove and cornice as per drawing.', 'Cut-outs for lights, AC, speakers and access panels.', 'Coordination of all cut-outs with services.'],
      exclusions: ['Lighting fixtures and electrical wiring.', 'AC units, piping and ducting.', 'Civil repairs and structural work.'],
      clientSupply: [], vendorSupply: ['Gypsum board, GI framework, jointing compound, POP and consumables.'],
      requiredAssumptions: SITE_BASE.concat([
        'AC piping, electrical conduits and sprinkler points completed before boarding.',
        'Minimum clear height confirmed; any structural drop permitted.',
        'Lighting layout and AC locations frozen before framework.'
      ]),
      measurement: ['Measured on carpet area + drop/cove allowance; cornice running feet.'],
      qc: ['Framework level and spacing checked before boarding.', 'Cut-outs aligned to lighting/AC layout.', 'Jointing finished flush; no visible undulation.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on delivery / on completion', retention: 'As agreed', warranty: 'Workmanship as per vendor standard (min 1 year)', defectLiability: 'Crack/sag rectification within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['After services rough-in; before painting and flooring.'] }
    },

    electrical: {
      packageId: 'electrical', trade: 'Electrical', title: 'Electrical & Wiring — Scope Sheet',
      subjective: true, finishDriven: false,
      specPolicy: { requireSpec: true, requireSize: false, requireFinish: false },
      specKeys: [],
      drawings: [drwSheet('lighting'), drwLayout('electrical', 'Electrical points & circuit layout')],
      basisDefaults: { basis: 'unit', method: 'Priced per point (light/fan, 6A, 16A) and per item (board, DB); point height per schedule. Concealed conduit and wiring included to the point.' },
      activityRules: [rule(/point|socket|light|fan/i, 'unit', 'Priced per point including concealed conduit and wiring to the point height as per schedule.'), rule(/db|mcb|board/i, 'unit', 'Priced per board/DB, installed and tested.')],
      inclusions: ['Concealed conduit, wiring and back-boxes to all points per schedule.', 'Modular switch plates, sockets and DB with MCB/RCCB.', 'Earthing and inverter point as scheduled.', 'Testing, labelling and load check.'],
      exclusions: ['Lighting fixtures and their supply (lighting scope).', 'Civil chasing making-good beyond the chase.', 'Inverter/UPS and appliances.'],
      clientSupply: [], vendorSupply: ['Conduit, wire, modular plates, DB, MCBs and consumables.'],
      requiredAssumptions: SITE_BASE.concat([
        'Point locations and heights frozen before chasing.',
        'Ceiling/joinery cut-outs coordinated before closure.',
        'Supply available for testing; inverter/UPS provided by client where required.'
      ]),
      measurement: ['Per point / per item as scheduled; concealed runs included.'],
      qc: ['Continuity and earthing tested.', 'MCB/RCCB ratings verified against load.', 'All points labelled and tested.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on completion', retention: 'As agreed', warranty: 'Workmanship min 1 year; materials as per make', defectLiability: 'Rectification of defects within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['Rough-in before ceiling/flooring; fit-out after painting.'] }
    },

    painting: {
      packageId: 'painting', trade: 'Painting', title: 'Painting & Polishing — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: false, requireFinish: true },
      specKeys: ['paint', 'paintSheen', 'polish'],
      drawings: [drwSheet('main')],
      basisDefaults: { basis: 'site', method: 'Measured over finished surfaces; openings above 3 sqft deducted; woodwork measured on surface area.' },
      activityRules: [rule(/wall|ceiling|paint/i, 'site', 'Measured over finished wall/ceiling surface; openings > 3 sqft deducted.'), rule(/enamel|polish|wood/i, 'site', 'Measured on developed surface area of woodwork.')],
      inclusions: ['Putty, primer and specified topcoats.', 'Wood polish/enamel as per schedule.', 'Masking, protection and surface preparation.', 'Shade matching per approved fan-deck codes.'],
      exclusions: ['Civil putty defects and crack repairs beyond normal making-good.', 'Woodwork fabrication and joinery.', 'External painting unless scheduled.'],
      clientSupply: ['Final paint/shade selection and fan-deck approval.'],
      vendorSupply: ['Paints, primers, putty, polish and consumables per schedule.'],
      requiredAssumptions: SITE_BASE.concat([
        'Surfaces are cured, dry and free from structural defects before painting.',
        'Shade codes approved before application.',
        'Other trades completed before final coats.'
      ]),
      measurement: ['Walls/ceiling measured over finished surface; woodwork developed area.'],
      qc: ['Surface prep approved before topcoat.', 'Shade and sheen verified against sample.', 'No drips/holidays; touch-up before handover.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on completion', retention: 'As agreed', warranty: 'Workmanship min 1 year', defectLiability: 'Touch-up/rectification within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['After joinery/ceiling install; before final handover.'] }
    },

    wall: {
      packageId: 'wall', trade: 'Finishes', title: 'Wall Finishes & Cladding — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: false, requireFinish: true },
      specKeys: [],
      drawings: [drwSheet('main')],
      basisDefaults: { basis: 'site', method: 'Measured over finished cladding area; trims and framing measured running feet.' },
      activityRules: [rule(/louver|fluted|panel|clad|wallpaper|dado|stone|texture/i, 'site', 'Measured over finished surface area; trims measured running feet.')],
      inclusions: ['Ply/backing, adhesive and mechanical fixing as required.', 'Panels, louvers, wallpaper, dado or stone as scheduled.', 'Trims, edge profiles and finishing.', 'Protection until handover.'],
      exclusions: ['Wall plaster and levelling (civil).', 'Electrical points on feature walls (by others).'],
      clientSupply: [], vendorSupply: ['Panels, louvers, wallpaper, adhesive, stone and trims per schedule.'],
      requiredAssumptions: SITE_BASE.concat(['Base wall plastered and levelled before cladding.', 'Pattern/design repeat and batch approved before order.']),
      measurement: ['Finished surface area; trims running feet.'],
      qc: ['Layout and level marked and approved.', 'Batch/shade matched.', 'Fixings secure; trims flush.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on completion', retention: 'As agreed', warranty: 'Workmanship min 1 year', defectLiability: 'Rectification within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['After electrical points; before final painting touch-up.'] }
    },

    flooring: {
      packageId: 'flooring', trade: 'Flooring', title: 'Flooring & Skirting — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: true, requireFinish: true },
      specKeys: ['floor'],
      drawings: [drwSheet('main')],
      basisDefaults: { basis: 'site', method: 'Measured on carpet area + wastage; skirting measured running feet along wall.' },
      activityRules: [rule(/tile|marble|wood|laminate|floor|screed/i, 'site', 'Measured on carpet area + agreed wastage.'), rule(/skirting/i, 'site', 'Skirting measured running feet along wall.')],
      inclusions: ['Supply, laying, leveling and grouting/polishing.', 'Skirting and thresholds as scheduled.', 'Dry-lay approval before fixing.', 'Protection until handover.'],
      exclusions: ['Civil screed beyond normal levelling unless scheduled.', 'Waterproofing (unless scheduled).'],
      clientSupply: [], vendorSupply: ['Tiles/marble/wood, adhesive, grout, skirting and consumables.'],
      requiredAssumptions: SITE_BASE.concat(['Floor slab/screed level within tolerance; waterproofing completed in wet areas.', 'Tile layout approved before fixing.', 'Material batch confirmed for shade.']),
      measurement: ['Carpet area + wastage; skirting running feet.'],
      qc: ['Layout and level checked before fixing.', 'Lippage within tolerance; grout uniform.', 'Hollow-tile check and polish as applicable.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on completion', retention: 'As agreed', warranty: 'Workmanship min 1 year', defectLiability: 'Rectification within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['After ceiling/joinery; before final painting touch-up.'] }
    },

    plumbing: {
      packageId: 'plumbing', trade: 'Plumbing', title: 'Plumbing & Sanitary — Scope Sheet',
      subjective: true, finishDriven: false,
      specPolicy: { requireSpec: true, requireSize: false, requireFinish: false },
      specKeys: ['sanitary'],
      drawings: [drwSheet('main'), drwLayout('plumbing', 'Sanitary layout for wet areas')],
      basisDefaults: { basis: 'unit', method: 'Fixtures priced per unit; concealed supply/drainage measured running feet; point heights per schedule.' },
      activityRules: [rule(/wc|commode|basin|faucet|shower|geyser|health|fixture/i, 'unit', 'Priced per fixture, supplied and installed as scheduled.'), rule(/plumbing|drainage|supply|cpcv|upvc|line/i, 'site', 'Concealed supply/drainage measured running feet as executed.')],
      inclusions: ['Concealed CPVC supply and UPVC drainage with slope.', 'Sanitary fixtures, CP fittings and accessories as scheduled.', 'Point heights per schedule; pressure and leak testing.', 'Making-good of chases.'],
      exclusions: ['Waterproofing and civil work.', 'Water source / tank connection beyond the project boundary.'],
      clientSupply: [], vendorSupply: ['Pipes, fittings, fixtures, CP fittings and consumables.'],
      requiredAssumptions: SITE_BASE.concat(['Waterproofing completed and tested before chase closure.', 'Water supply available for pressure testing.']),
      measurement: ['Fixtures per unit; concealed runs measured running feet as executed.'],
      qc: ['Pressure test and drainage slope verified.', 'Ponding/leak test before tiling.', 'Fixture alignment and function tested.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on completion', retention: 'As agreed', warranty: 'Materials as per make; workmanship min 1 year', defectLiability: 'Leak rectification within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['Rough-in before ceiling/tiling; fixtures after tiling.'] }
    },

    doors: {
      packageId: 'doors', trade: 'Fabrication', title: 'Doors & Windows — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: true, requireFinish: true },
      specKeys: [],
      drawings: [drwSheet('main')],
      basisDefaults: { basis: 'unit', method: 'Priced per door/window including frame, shutter and hardware as scheduled; measured opening sizes.' },
      activityRules: [rule(/door|window|frame/i, 'unit', 'Priced per unit (frame + shutter + hardware) at the scheduled opening size.')],
      inclusions: ['Frames, shutters, architraves and hardware.', 'Windows with mesh/grills as scheduled.', 'Finishing (paint/polish) as scheduled.', 'Installation and sealing.'],
      exclusions: ['Civil openings and lintels.', 'Structural repairs.'],
      clientSupply: [], vendorSupply: ['Timber/WPC/UPVC, hardware, glass/mesh and finishing materials.'],
      requiredAssumptions: SITE_BASE.concat(['Openings sized and lintels in place.', 'Frame fixing after plaster reveals.']),
      measurement: ['Per unit at scheduled opening size.'],
      qc: ['Frame plumb and square; shutter operation smooth.', 'Hardware aligned; seals intact.', 'Finish uniform.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on delivery / on installation', retention: 'As agreed', warranty: 'Workmanship min 1 year', defectLiability: 'Rectification within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['Frames before plaster; shutters after painting.'] }
    },

    hvac: {
      packageId: 'hvac', trade: 'HVAC', title: 'HVAC & Ventilation — Scope Sheet',
      subjective: true, finishDriven: false,
      specPolicy: { requireSpec: true, requireSize: true, requireFinish: false },
      specKeys: [],
      drawings: [drwSheet('main'), drwSheet('ceiling')],
      basisDefaults: { basis: 'unit', method: 'AC units and exhaust priced per unit; copper piping and drainage measured running metres as executed.' },
      activityRules: [rule(/ac|air/i, 'unit', 'Priced per unit including piping and drainage as scheduled.'), rule(/exhaust|vent/i, 'unit', 'Priced per exhaust/vent with ducting as scheduled.')],
      inclusions: ['Indoor/outdoor units, copper piping, insulation and drainage.', 'Cut-out coordination with ceiling/joinery.', 'Vacuuming, pressure test and commissioning.'],
      exclusions: ['Electrical point to AC (electrical scope).', 'Civil work and structural openings.'],
      clientSupply: [], vendorSupply: ['Units, copper piping, insulation, drainage and accessories.'],
      requiredAssumptions: SITE_BASE.concat(['Electrical point available before commissioning.', 'Outdoor unit location and drainage route approved.', 'Ceiling cut-outs coordinated.']),
      measurement: ['Units per unit; piping/drainage running metres as executed.'],
      qc: ['Pressure/vacuum test passed.', 'Drainage slope and leak check.', 'Cooling/heating and noise checked on commissioning.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on delivery / on commissioning', retention: 'As agreed', warranty: 'As per make (min 1 year)', defectLiability: 'Rectification within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['Piping before ceiling closure; units after finishes.'] }
    },

    furniture: {
      packageId: 'furniture', trade: 'Furniture', title: 'Loose Furniture — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: true, requireFinish: true },
      specKeys: [],
      drawings: [drwSheet('furniture')],
      basisDefaults: { basis: 'unit', method: 'Priced per item/set as scheduled; sizes as per schedule or agreed standard.' },
      activityRules: [rule(/sofa|bed|dining|coffee|outdoor|set|table/i, 'unit', 'Priced per item/set as scheduled.')],
      inclusions: ['Supply, delivery, assembly and placement as scheduled.', 'Upholstery and finish as per approved sample/moodboard.'],
      exclusions: ['Custom joinery/millwork (joinery scope).', 'Soft furnishings and decor.'],
      clientSupply: [], vendorSupply: ['Furniture, upholstery, finishes and packaging.'],
      requiredAssumptions: SITE_BASE.concat(['Site access and lift available for delivery.', 'Final layout and fabric approved before order.']),
      measurement: ['Per item/set as scheduled.'],
      qc: ['Fabric/finish matched to approved sample.', 'Structure and mechanisms checked on assembly.', 'Placement as per layout.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on delivery', retention: 'As agreed', warranty: 'As per make (min 1 year)', defectLiability: 'Rectification/replacement within warranty' },
      timeline: { duration: 'As per the project programme', coordination: ['Deliver after flooring/finishes to avoid damage.'] }
    },

    soft: {
      packageId: 'soft', trade: 'Soft Furnishings', title: 'Soft Furnishings — Scope Sheet',
      subjective: true, finishDriven: true,
      specPolicy: { requireSpec: true, requireSize: false, requireFinish: true },
      specKeys: [],
      drawings: [drwSheet('main')],
      basisDefaults: { basis: 'site', method: 'Curtains/blinds measured on finished window area; rugs measured on area; decor per set.' },
      activityRules: [rule(/curtain|blind|rug|carpet/i, 'site', 'Measured on finished window/floor area.'), rule(/art|mirror|decor/i, 'unit', 'Priced per set as scheduled.')],
      inclusions: ['Fabric, stitching, hardware, tracks and installation.', 'Rugs and decor as scheduled.', 'Sample approval before order.'],
      exclusions: ['Window/ceiling structures and electrical points.', 'Pest control and cleaning.'],
      clientSupply: [], vendorSupply: ['Fabric, lining, tracks, hardware, rugs and decor.'],
      requiredAssumptions: SITE_BASE.concat(['Window/ceiling track locations available and ready.', 'Fabric and colour approved against sample.']),
      measurement: ['Window/floor area or per set as scheduled.'],
      qc: ['Fabric and stitching checked.', 'Tracks smooth; pleats even.', 'Batch/shade matched.'],
      commercial: { gst: 'GST at applicable rate, extra', payment: 'Advance / on installation', retention: 'As agreed', warranty: 'Workmanship min 1 year', defectLiability: 'Rectification within the agreed window' },
      timeline: { duration: 'As per the project programme', coordination: ['Install after painting and flooring.'] }
    }
  };

  const GENERIC = {
    packageId: 'generic', trade: 'General', title: 'Work Package — Scope Sheet',
    subjective: false, finishDriven: false,
    specPolicy: { requireSpec: true, requireSize: false, requireFinish: false },
    specKeys: [],
    drawings: [drwSheet('main')],
    basisDefaults: { basis: 'firm', method: 'Measured as per the schedule; quantities are indicative from the plan and confirmed on site before execution.' },
    activityRules: [],
    inclusions: ['Supply and installation of all items in the schedule.', 'Testing/commissioning and making-good of the vendor scope.', 'Site protection of own work until handover.'],
    exclusions: ['Works not listed in the scope of supply.', 'Civil/structural changes and statutory approvals.'],
    clientSupply: [], vendorSupply: ['All materials, labour, tools and consumables for the listed scope.'],
    requiredAssumptions: SITE_BASE,
    measurement: ['As per the schedule; confirm on site before execution.'],
    qc: ['Stage-wise inspection before the next trade starts.', 'Snags closed before handover.'],
    commercial: { gst: 'GST at applicable rate, extra', payment: 'As agreed', retention: 'As agreed', warranty: 'As per vendor standard', defectLiability: 'Rectification within the agreed window' },
    timeline: { duration: 'As per the project programme', coordination: ['Coordinate with preceding and following trades.'] }
  };

  function forPackage(packageId, packageName) {
    const t = TRADES[packageId];
    if (t) return t;
    return Object.assign({}, GENERIC, {
      packageId: packageId,
      title: (packageName || 'Work') + ' — Scope Sheet'
    });
  }

  return { TRADES: TRADES, GENERIC: GENERIC, forPackage: forPackage, SHEET: SHEET };
})();
