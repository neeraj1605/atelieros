/* ============================================================
   Planex — Design Docket Engine
   Builds trade-wise execution dockets from the Scope (single source of
   quantities), the validated plan rooms and the project type/quality.
   Deterministic. No prices. Quantities trace to the Scope.
   ============================================================ */
window.PlanexDocketEngine = (function () {
  const L = window.PlanexDocketData;

  function acts(scopeDoc, cats) {
    const out = [];
    if (!scopeDoc) return out;
    scopeDoc.packages.forEach(function (p) {
      if (cats.indexOf(p.name) < 0) return;
      p.activities.forEach(function (a) {
        if (a.included === false) return;
        out.push({ pkg: p.name, room: a.room || '', name: a.name, detail: a.detail || '', unit: a.unit, qty: a.qty });
      });
    });
    return out;
  }

  function q(v, quality) {
    return (v && (v[quality] || v.standard)) || '';
  }

  function provisional(plan) { return !(plan && plan.validated); }

  function sizeFor(name) {
    const n = name.toLowerCase();
    if (n.indexOf('tv') >= 0) return '1800 × 450 × 1800';
    if (n.indexOf('crockery') >= 0 || n.indexOf('bar') >= 0) return '1200 × 400 × 2100';
    if (n.indexOf('study') >= 0) return '1200 × 550 × 750';
    if (n.indexOf('foyer') >= 0 || n.indexOf('shoe') >= 0) return '1200 × 350 × 1200';
    if (n.indexOf('pooja') >= 0) return '900 × 450 × 2100';
    if (n.indexOf('wardrobe') >= 0) return '2400 × 600 × 2400';
    return 'As per site';
  }

  function lightingSpec(room) {
    const n = (room || '').toLowerCase();
    if (n.indexOf('kitchen') >= 0) return { cct: '4000K', beam: '36°' };
    if (n.indexOf('study') >= 0) return { cct: '4000K', beam: '36°' };
    if (n.indexOf('bath') >= 0) return { cct: '4000K', beam: '36°' };
    return { cct: '3000K', beam: '24°' };
  }

  function luxTarget(room) {
    const n = (room || '').toLowerCase();
    if (n.indexOf('kitchen') >= 0 || n.indexOf('study') >= 0) return '300–500 lux';
    if (n.indexOf('living') >= 0 || n.indexOf('dining') >= 0) return '150–200 lux';
    if (n.indexOf('bath') >= 0) return '200–300 lux';
    return '100–150 lux';
  }

  function pointHeight(name) {
    const n = name.toLowerCase();
    if (n.indexOf('light') >= 0 || n.indexOf('fan') >= 0) return 'Ceiling';
    if (n.indexOf('16a') >= 0 || n.indexOf('socket') >= 0) return '1100';
    if (n.indexOf('switch') >= 0 || n.indexOf('board') >= 0) return '1200';
    return '1200';
  }

  // ---- per-docket builders ----
  const BUILD = {
    furniture: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Modular & Joinery (Millwork)']);
      const unitRows = [];
      let i = 1;
      list.forEach(function (a) {
        if (/tv|crockery|bar|study|foyer|shoe|pooja|bookshelf|unit|table/i.test(a.name)) {
          unitRows.push(['FU' + (i++), a.name, a.room, sizeFor(a.name), q(ctx.quality ? L.QUALITY_DEFAULTS.carcass : null, ctx.quality), q(L.QUALITY_DEFAULTS.shutter, ctx.quality), q(L.QUALITY_DEFAULTS.carcass, ctx.quality), q(L.QUALITY_DEFAULTS.hardware, ctx.quality)]);
        }
      });
      const hardware = [
        ['Soft-close hinge', q(L.QUALITY_DEFAULTS.hardware, ctx.quality), unitRows.length * 6, 'nos', '110° clip-on'],
        ['Telescopic channel', q(L.QUALITY_DEFAULTS.hardware, ctx.quality), unitRows.length * 2, 'set', 'Soft-close, 45kg'],
        ['Handle / profile', 'SS / aluminium (per design)', unitRows.length * 4, 'nos', 'Finish to match'],
        ['Locker', 'Ebco / Godrej', 1, 'no', 'Where specified']
      ];
      const finishes = [
        ['Carcass', q(L.QUALITY_DEFAULTS.carcass, ctx.quality), '—', 'Matt', '18mm ply'],
        ['Shutter', q(L.QUALITY_DEFAULTS.shutter, ctx.quality), 'To design', '—', 'Edge band 2mm PVC'],
        ['Back panel', '6mm ply + laminate', '—', '—', '—']
      ];
      return [
        { key: 'units', title: 'Unit Schedule', columns: ['Mark', 'Unit', 'Room', 'Size (W×D×H mm)', 'Carcass', 'Shutter', 'Finish', 'Hardware'], rows: unitRows },
        { key: 'hardware', title: 'Hardware Schedule', columns: ['Item', 'Make / Model', 'Qty', 'Unit', 'Remarks'], rows: hardware },
        { key: 'finishes', title: 'Finish Schedule', columns: ['Surface', 'Material', 'Code / Shade', 'Sheen', 'Remarks'], rows: finishes }
      ];
    },

    kitchen: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Kitchen Systems']);
      const cabinets = [];
      let i = 1;
      list.forEach(function (a) {
        if (/unit|cabinet|pantry|tall|base|wall/i.test(a.name)) {
          cabinets.push(['FK' + (i++), a.name, a.detail || 'As per layout', q(L.QUALITY_DEFAULTS.carcass, ctx.quality), q(L.QUALITY_DEFAULTS.shutter, ctx.quality), 'Soft-close / pull-out', q(L.QUALITY_DEFAULTS.hardware, ctx.quality)]);
        }
      });
      const counter = [
        ['Countertop', 'Quartz (2cm)', 'Bullnose / 45°', 'As per site', 'Cut-outs for hob/sink'],
        ['Backsplash', 'Tile / glass', '—', '600mm above counter', '—'],
        ['Plinth / skirting', 'PVC / SS 100mm', '—', 'As per site', '—']
      ];
      const appliances = list.filter(function (a) { return /chimney|hob|sink|faucet|oven/i.test(a.name); })
        .map(function (a) { return [a.name, a.detail || 'Vendor make', a.qty, a.unit, 'Electrical/plumbing point']; });
      const accessories = [
        ['Cutlery tray', 'Hettich / Ebco', 2, 'nos', 'Top drawer'],
        ['Carousel', 'Hettich / Ebco', 1, 'no', 'Corner'],
        ['Waste bin pull-out', 'Hettich / Ebco', 1, 'no', 'Under sink']
      ];
      return [
        { key: 'cabinets', title: 'Cabinet Schedule', columns: ['Mark', 'Type', 'Spec', 'Carcass', 'Shutter', 'Drawer/Pull-out', 'Hardware'], rows: cabinets },
        { key: 'counter', title: 'Counter & Backsplash', columns: ['Item', 'Material', 'Edge', 'Size', 'Remarks'], rows: counter },
        { key: 'appliances', title: 'Appliance & Fixture Schedule', columns: ['Item', 'Make / Model', 'Qty', 'Unit', 'Service required'], rows: appliances },
        { key: 'accessories', title: 'Accessory Schedule', columns: ['Item', 'Make', 'Qty', 'Unit', 'Remarks'], rows: accessories }
      ];
    },

    wardrobe: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Wardrobe Internals']);
      const rooms = {};
      list.forEach(function (a) { if (a.room) rooms[a.room] = true; });
      const wardrobes = Object.keys(rooms).map(function (room, i) {
        return ['FW' + (i + 1), room, '2400 × 2400 × 600', 'Sliding', 'Sliding', q(L.QUALITY_DEFAULTS.shutter, ctx.quality), q(L.QUALITY_DEFAULTS.hardware, ctx.quality)];
      });
      const internals = Object.keys(rooms).map(function (room) {
        return [room, 'Section A/B', 'Rods, shelves, drawers', 'Each', 2, '1', 'Loft + locker'];
      });
      const mirror = Object.keys(rooms).map(function (room) { return [room, 'Yes', 'LED on door switch', '—']; });
      return [
        { key: 'wardrobes', title: 'Wardrobe Schedule', columns: ['Mark', 'Room', 'Size (W×H mm) × Depth', 'Type', 'Shutters', 'Finish', 'Hardware'], rows: wardrobes },
        { key: 'internals', title: 'Internal Layout', columns: ['Wardrobe', 'Section', 'Fittings', 'Shelves', 'Drawers', 'Rod', 'Remarks'], rows: internals },
        { key: 'mirrorLight', title: 'Mirror & Lighting', columns: ['Wardrobe', 'Mirror', 'Internal light', 'Remarks'], rows: mirror }
      ];
    },

    lighting: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Lighting']);
      const fixtures = [];
      let i = 1;
      list.forEach(function (a) {
        const spec = lightingSpec(a.room);
        fixtures.push(['L' + (i++), a.name, q(L.QUALITY_DEFAULTS.lighting, ctx.quality), 'As per fixture', spec.cct, spec.beam, a.qty, (a.room || 'Project') + (a.detail ? ' — ' + a.detail : '')]);
      });
      const roomSet = {};
      list.forEach(function (a) { if (a.room) roomSet[a.room] = { ambient: 0, accent: 0 }; });
      const layout = Object.keys(roomSet).map(function (room) {
        return [room, 'Cove + spots', room.toLowerCase().indexOf('kitchen') >= 0 ? 'Under-cabinet' : 'Feature pendant', 'Accent spots', 'Dimming', luxTarget(room)];
      });
      const control = Object.keys(roomSet).map(function (room) { return [room, '2 groups', 'Yes (bedroom/living)', 'Warm / Bright', '—']; });
      return [
        { key: 'fixtures', title: 'Fixture Schedule', columns: ['Mark', 'Fixture', 'Make / Spec', 'W', 'CCT', 'Beam', 'Qty', 'Location'], rows: fixtures },
        { key: 'layout', title: 'Lighting Layout (by room)', columns: ['Room', 'Ambient', 'Task', 'Accent', 'Controls', 'Lux target'], rows: layout },
        { key: 'control', title: 'Switching & Control', columns: ['Room', 'Switch group', 'Dimming', 'Scene', 'Remarks'], rows: control }
      ];
    },

    ceiling: function (ctx) {
      const list = acts(ctx.scopeDoc, ['False Ceiling']);
      const byRoom = {};
      list.forEach(function (a) { if (a.room) byRoom[a.room] = (byRoom[a.room] || 0) + (a.unit === 'sqft' ? a.qty : 0); });
      const levels = Object.entries(byRoom).map(function (e) {
        return [e[0], Math.round(e[1]), 'Gypsum + cove', q(L.QUALITY_DEFAULTS.ceiling, ctx.quality), '+2700', '+2550', 'Cove for lighting'];
      });
      const details = [
        ['Cove', 'Perimeter', '100mm', 'Concealed LED'],
        ['AC cut-out', 'Per AC', 'As per unit', 'Coordinate with HVAC'],
        ['Access panel', 'As required', '600×600', 'For services'],
        ['Light cut-outs', 'Per lighting layout', 'As per fixture', 'Per Lighting Docket']
      ];
      const spec = [
        ['Boarding', '12.5mm gypsum', q(L.QUALITY_DEFAULTS.ceiling, ctx.quality)],
        ['Framework', 'GI @ 610mm centres', 'GI / MS'],
        ['Cornice', 'POP moulding', 'As per design']
      ];
      return [
        { key: 'levels', title: 'Ceiling Schedule (by room)', columns: ['Room', 'Area (sqft)', 'Type', 'Material', 'Perimeter level', 'Centre level', 'Remarks'], rows: levels },
        { key: 'details', title: 'Details & Cut-outs', columns: ['Item', 'Location', 'Size', 'Remarks'], rows: details },
        { key: 'spec', title: 'Material & Framework', columns: ['Item', 'Specification', 'Make'], rows: spec }
      ];
    },

    paint: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Painting & Polishing']);
      const surfaces = [];
      list.forEach(function (a) {
        const n = a.name.toLowerCase();
        let surface = 'Walls';
        if (n.indexOf('ceiling') >= 0) surface = 'Ceiling';
        if (n.indexOf('enamel') >= 0 || n.indexOf('wood') >= 0) surface = 'Woodwork';
        if (n.indexOf('exterior') >= 0 || n.indexOf('balcony') >= 0) surface = 'Exterior';
        surfaces.push([a.room || 'Project', surface, a.name, q(L.QUALITY_DEFAULTS.paint, ctx.quality), 'Per fan deck', q(L.QUALITY_DEFAULTS.paintSheen, ctx.quality), '2']);
      });
      const prep = [
        ['Walls', 'Putty 2 coats, sanding', 'Primer', 'Yes', 'New/plastered surfaces'],
        ['Ceiling', 'Putty 1 coat', 'Primer', 'Yes', '—'],
        ['Wood', 'Sanding + filler', 'Wood primer', 'No', 'Melamine/PU/Duco']
      ];
      const wood = [
        ['Joinery (wardrobes/TV)', q(L.QUALITY_DEFAULTS.polish, ctx.quality), 'Matt / Gloss', 'Factory or site'],
        ['Doors/frames', 'Enamel', 'Satin', '2 coats'],
        ['Metal', 'Enamel / Duco', '—', '—']
      ];
      return [
        { key: 'surfaces', title: 'Paint Schedule (by room)', columns: ['Room', 'Surface', 'System', 'Product', 'Shade code', 'Sheen', 'Coats'], rows: surfaces },
        { key: 'prep', title: 'Surface Preparation', columns: ['Surface', 'Preparation', 'Primer', 'Putty', 'Remarks'], rows: prep },
        { key: 'wood', title: 'Wood & Metal Polish', columns: ['Item', 'System', 'Finish', 'Remarks'], rows: wood }
      ];
    },

    flooring: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Flooring']);
      const byRoom = {};
      list.forEach(function (a) {
        if (!a.room) return;
        if (!byRoom[a.room]) byRoom[a.room] = { sqft: 0, material: '' };
        if (a.unit === 'sqft') byRoom[a.room].sqft += a.qty;
        if (/marble|wood|laminate|tile|vitrified/i.test(a.name)) byRoom[a.room].material = a.name;
      });
      const rooms = Object.entries(byRoom).map(function (e) {
        const wet = /bath|kitchen|balcony/i.test(e[0]);
        return [e[0], Math.round(e[1]), e[1].material || q(L.QUALITY_DEFAULTS.floor, ctx.quality), '600×600', wet ? 'Anti-skid' : 'Straight', 'To layout', '100mm matching', wet ? 'Epoxy grout' : 'Cement-based grout'];
      });
      const prep = [
        ['Screed', 'Where deviation > 3mm', 'Cement screed'],
        ['Threshold', 'At bath entries', 'Granite / SS'],
        ['Expansion joint', 'Large spans', 'Provision at 6m']
      ];
      return [
        { key: 'rooms', title: 'Flooring Schedule (by room)', columns: ['Room', 'Area (sqft)', 'Material', 'Size', 'Pattern', 'Direction', 'Skirting', 'Adhesive/Grout'], rows: rooms },
        { key: 'prep', title: 'Substrate & Details', columns: ['Item', 'Specification', 'Remarks'], rows: prep }
      ];
    },

    electrical: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Electrical & Wiring']);
      const points = [];
      list.forEach(function (a) {
        points.push([a.room || 'Project', a.name, pointHeight(a.name), a.qty, a.detail || '']);
      });
      const circuits = [
        ['Lighting', 'All lighting', 'As per fixtures', '10A MCB', '1.5 sq.mm'],
        ['Power', 'Sockets', 'As per load', '16A MCB', '2.5 sq.mm'],
        ['AC', 'Each AC', 'As per tonnage', '20A MCB', '4.0 sq.mm'],
        ['Kitchen', 'Kitchen appliances', 'As per schedule', '20A MCB', '4.0 sq.mm']
      ];
      const control = [
        ['Living', 'Board near entry', 'Ambient, accent, fans', '—'],
        ['Bedrooms', 'Board at door + bedside', '2-way lighting', '—']
      ];
      return [
        { key: 'points', title: 'Point Schedule (by room)', columns: ['Room', 'Point type', 'Height (mm)', 'Qty', 'Remarks'], rows: points },
        { key: 'circuits', title: 'Circuit & DB Schedule', columns: ['Circuit', 'Description', 'Load (W)', 'MCB', 'Cable size'], rows: circuits },
        { key: 'control', title: 'Switch Control Chart', columns: ['Room', 'Board', 'Controls', 'Remarks'], rows: control }
      ];
    },

    plumbing: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Plumbing & Sanitary (WC)']);
      const fixtures = [];
      list.forEach(function (a) {
        if (/wc|commode|basin|faucet|shower|geyser|health/i.test(a.name)) {
          fixtures.push(['S' + (fixtures.length + 1), a.name, a.detail || q(L.QUALITY_DEFAULTS.sanitary, ctx.quality), a.qty, a.room || '', '']);
        }
      });
      const points = [
        ['Bathrooms', 'Basin point', '750', '15mm', 'Hot + cold'],
        ['Bathrooms', 'Shower point', '2100', '15mm', 'Diverter'],
        ['Bathrooms', 'Health faucet', '750', '15mm', '—'],
        ['Kitchen', 'Sink point', '450', '15mm', 'Hot + cold'],
        ['Bathrooms', 'Geyser point', '1800', '15mm', 'Electrical nearby']
      ];
      const lines = [
        ['Supply', 'CPVC concealed (Astral/Ashirvad)', 'Hot + cold, insulated hot'],
        ['Drainage', 'UPVC with 1:60 slope', 'Vent + traps'],
        ['Waterproofing', 'Wet areas before chase closure', 'Ponding test 24h']
      ];
      return [
        { key: 'fixtures', title: 'Fixture Schedule', columns: ['Mark', 'Fixture', 'Make / Model', 'Qty', 'Location', 'Remarks'], rows: fixtures },
        { key: 'points', title: 'Point Schedule', columns: ['Location', 'Point', 'Height (mm)', 'Size', 'Remarks'], rows: points },
        { key: 'lines', title: 'Water & Drainage', columns: ['Item', 'Specification', 'Remarks'], rows: lines }
      ];
    },

    doors: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Doors & Windows']);
      const doors = [];
      list.forEach(function (a) {
        if (/door/i.test(a.name)) doors.push(['D' + (doors.length + 1), a.room || 'As per plan', /main/i.test(a.name) ? '1200×2100' : '900×2100', 'Hardwood / WPC', /main/i.test(a.name) ? 'Solid core' : 'Flush', /main/i.test(a.name) ? 'PU / Duco' : 'Enamel / laminate', 'Lock, handle, hinges, stopper', '']);
      });
      const windows = list.filter(function (a) { return /window/i.test(a.name); })
        .map(function (a, i) { return ['W' + (i + 1), a.room || 'As per plan', 'As per plan', 'UPVC / aluminium', '5mm + 5mm', 'Yes', 'Powder coat']; });
      return [
        { key: 'doors', title: 'Door Schedule', columns: ['Mark', 'Location', 'Size (W×H mm)', 'Frame', 'Shutter', 'Finish', 'Hardware', 'Remarks'], rows: doors },
        { key: 'windows', title: 'Window Schedule', columns: ['Mark', 'Location', 'Size (W×H mm)', 'Type', 'Glass', 'Mesh', 'Finish'], rows: windows }
      ];
    },

    wall: function (ctx) {
      const list = acts(ctx.scopeDoc, ['Wall Finishes & Cladding']);
      const rows = list.map(function (a) {
        return [a.room || 'Project', a.name, a.detail || 'As per design', a.unit === 'sqft' ? a.qty : '', 'Adhesive + mechanical where needed', 'SS / aluminium', ''];
      });
      return [{ key: 'surfaces', title: 'Wall Finish Schedule', columns: ['Location', 'Finish', 'Material / Make', 'Area (sqft)', 'Adhesive / Fixing', 'Trims', 'Remarks'], rows: rows }];
    },

    hvac: function (ctx) {
      const list = acts(ctx.scopeDoc, ['HVAC & Ventilation']);
      const ac = list.filter(function (a) { return /ac|air/i.test(a.name); })
        .map(function (a, i) { return ['A' + (i + 1), a.room || 'Project', /cassette/i.test(a.name) ? 'Cassette' : 'Split', '1.5 T', 'As per layout', '3', '']; });
      const vent = list.filter(function (a) { return /exhaust|vent/i.test(a.name); })
        .map(function (a) { return [a.room || 'Kitchen/Bath', 'Exhaust fan', '6"', 'Yes', 'Back-draught shutter']; });
      return [
        { key: 'ac', title: 'AC Schedule', columns: ['Mark', 'Room', 'Type', 'Tonnage', 'Location', 'Piperun (m)', 'Remarks'], rows: ac },
        { key: 'vent', title: 'Ventilation Schedule', columns: ['Location', 'Item', 'Size', 'Ducting', 'Remarks'], rows: vent }
      ];
    },

    site: function () {
      const sequence = [
        ['1', 'Site setup & protection', '—', '2 days', 'Masking, barricades'],
        ['2', 'Demolition & services (if any)', '1', 'Per scope', 'See Scope'],
        ['3', 'Civil & masonry', '2', 'Per scope', ''],
        ['4', 'Electrical & plumbing rough-in', '3', 'Per scope', 'Before ceiling'],
        ['5', 'Waterproofing & testing', '4', 'Per scope', 'Ponding test'],
        ['6', 'Ceiling & joinery carcass', '5', 'Per scope', ''],
        ['7', 'Flooring & wall finishes', '6', 'Per scope', ''],
        ['8', 'Painting & polish', '7', 'Per scope', ''],
        ['9', 'Furniture, lighting & fittings', '8', 'Per scope', ''],
        ['10', 'Snag, clean & handover', '9', 'Per scope', '']
      ];
      const qc = [
        ['Civil', 'Level & plumb', '±3mm', 'Before finishes', ''],
        ['Electrical', 'Continuity & earthing', 'IS standards', 'Before ceiling closure', ''],
        ['Plumbing', 'Pressure & drainage', 'Leak-free', 'Before chase closure', ''],
        ['Waterproofing', 'Ponding test', '24h no leak', 'Before tiling', ''],
        ['Joinery', 'Alignment & soft-close', 'Smooth', 'On installation', ''],
        ['Paint', 'Coverage & finish', 'Uniform', 'Before handover', '']
      ];
      const handover = [
        ['Deep cleaning', 'Site team', 'Pending', ''],
        ['Snag closure', 'Site team', 'Pending', 'Photo record'],
        ['As-builts & warranties', 'Design', 'Pending', ''],
        ['Spare materials', 'Procurement', 'Pending', ''],
        ['Client walkthrough', 'Design', 'Pending', 'Sign-off']
      ];
      return [
        { key: 'sequence', title: 'Sequence of Works', columns: ['Stage', 'Activity', 'Predecessor', 'Duration', 'Remarks'], rows: sequence },
        { key: 'qc', title: 'QC Checkpoints', columns: ['Trade', 'Checkpoint', 'Standard', 'Stage', 'Result'], rows: qc },
        { key: 'handover', title: 'Handover Checklist', columns: ['Item', 'Responsibility', 'Status', 'Remarks'], rows: handover }
      ];
    }
  };

  function scopeHash(scopeDoc) {
    if (!scopeDoc) return 'none';
    let s = scopeDoc.projectType + '|' + scopeDoc.quality + '|';
    s += (scopeDoc.packages || []).map(function (p) { return p.name + ':' + p.subtotal; }).join(';');
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return String(h >>> 0);
  }

  function buildDocketSet(ctx) {
    const scopeDoc = ctx.scopeDoc;
    const rooms = ctx.rooms || [];
    const plan = ctx.plan || (ctx.floorplan || null);
    const quality = ctx.quality || 'standard';
    const projectType = ctx.projectType || 'ready';
    const prov = provisional(ctx.plan || ctx.floorplan);

    const dockets = L.DOCKETS.map(function (def) {
      const builder = BUILD[def.id];
      let sections = [];
      try {
        sections = builder ? builder({ scopeDoc: scopeDoc, rooms: rooms, quality: quality, projectType: projectType }) : [];
      } catch (e) {
        sections = [];
      }
      const sectionsOut = def.sections.map(function (s) {
        const built = sections.filter(function (x) { return x.key === s.key; })[0];
        return { key: s.key, title: s.title, columns: s.columns, rows: (built && built.rows) || [] };
      });
      const populated = sectionsOut.some(function (s) { return s.rows.length; });

      return {
        id: def.id,
        name: def.name,
        trade: def.trade,
        purpose: def.purpose,
        refs: {
          scopePackages: def.fromCategories,
          rooms: rooms.map(function (r) { return r.name; }),
          planRevision: plan ? (plan.id || 'plan') : null,
          planValidated: !prov
        },
        provisional: prov,
        sections: sectionsOut,
        spec: { standards: def.notes || [] },
        notes: def.notes || [],
        populated: populated,
        ai: null
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      projectType: projectType,
      quality: quality,
      scopeHash: scopeHash(scopeDoc),
      planRevision: plan ? (plan.id || 'plan') : null,
      planValidated: !prov,
      dockets: dockets
    };
  }

  return { buildDocketSet: buildDocketSet, scopeHash: scopeHash };
})();
