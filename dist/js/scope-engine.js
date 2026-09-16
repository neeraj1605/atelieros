/* ============================================================
   Planex — Scope Engine
   Builds the room-wise / package-wise scope document and BOQ
   from the library, the project type and the area schedule.
   Deterministic: no model, no hallucinated rates.
   ============================================================ */
window.PlanexScopeEngine = (function () {
  const SQM_TO_SQFT = 10.7639;
  const M_TO_FT = 3.28084;
  const CEILING_M = 2.9;

  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  }

  function roomKind(name) {
    const n = String(name || '').toLowerCase();
    if (n.indexOf('living') >= 0) return 'living';
    if (n.indexOf('dining') >= 0) return 'dining';
    if (n.indexOf('kitchen') >= 0) return 'kitchen';
    if (n.indexOf('kids') >= 0 || n.indexOf('child') >= 0) return 'kids';
    if (n.indexOf('guest') >= 0) return 'guest';
    if (n.indexOf('study') >= 0 || n.indexOf('office') >= 0) return 'study';
    if (n.indexOf('bath') >= 0 || n.indexOf('wc') >= 0 || n.indexOf('toilet') >= 0) return 'bath';
    if (n.indexOf('foyer') >= 0 || n.indexOf('entrance') >= 0) return 'foyer';
    if (n.indexOf('pooja') >= 0 || n.indexOf('puja') >= 0) return 'pooja';
    if (n.indexOf('balcony') >= 0 || n.indexOf('deck') >= 0) return 'balcony';
    if (n.indexOf('utility') >= 0) return 'utility';
    if (n.indexOf('bed') >= 0) return 'bedroom';
    return 'other';
  }

  function normalizeRoom(r) {
    const lengthM = Number(r.lengthM != null ? r.lengthM : r.length) || 0;
    const widthM = Number(r.widthM != null ? r.widthM : r.width) || 0;
    const kind = r.kind || roomKind(r.name);
    const areaSqft = lengthM && widthM ? lengthM * widthM * SQM_TO_SQFT : (Number(r.areaSqft) || 0);
    return { id: r.id || slug(r.name), name: r.name || 'Room', kind: kind, lengthM: lengthM, widthM: widthM, areaSqft: areaSqft, source: r.source || 'user' };
  }

  function metrics(room) {
    const perimeterM = (room.lengthM && room.widthM) ? 2 * (room.lengthM + room.widthM) : 0;
    const perimeterFt = perimeterM * M_TO_FT;
    return {
      area: room.areaSqft,
      perimeter: perimeterFt,
      wallArea: perimeterFt * (CEILING_M * M_TO_FT)
    };
  }

  function evalQty(expr, m) {
    if (typeof expr === 'number') return expr;
    const e = String(expr || '').trim();
    if (e === 'area') return Math.round(m.area);
    if (e === 'perimeter') return Math.round(m.perimeter);
    if (e === 'wallArea') return Math.round(m.wallArea);
    if (e === 'room') return 1;
    if (e.indexOf('fixed:') === 0) return Number(e.slice(6)) || 1;
    const mult = e.match(/^area\*([\d.]+)$/);
    if (mult) return Math.round(m.area * Number(mult[1]));
    const pmult = e.match(/^perimeter\*([\d.]+)$/);
    if (pmult) return Math.round(m.perimeter * Number(pmult[1]));
    const wmult = e.match(/^wallArea\*([\d.]+)$/);
    if (wmult) return Math.round(m.wallArea * Number(wmult[1]));
    return 1;
  }

  function roomMatches(kinds, kind) {
    if (!Array.isArray(kinds) || !kinds.length) return false;
    if (kinds.indexOf('*') >= 0) return true;
    return kinds.indexOf(kind) >= 0;
  }

  function aggregate(rooms) {
    let area = 0, perimeter = 0, wallArea = 0;
    rooms.forEach(function (r) {
      const m = metrics(r);
      area += m.area; perimeter += m.perimeter; wallArea += m.wallArea;
    });
    return { area: area, perimeter: perimeter, wallArea: wallArea };
  }

  function makeActivity(tuple, m, factor, roomName) {
    const name = tuple[0], detail = tuple[1], unit = tuple[2];
    const qty = evalQty(tuple[3], m);
    const rate = Math.round(tuple[4] * factor);
    return {
      id: slug(name) + '-' + slug(roomName || 'project'),
      name: name,
      detail: detail,
      unit: unit,
      qty: qty,
      rate: rate,
      rateSource: 'library',
      included: true,
      amount: qty * rate,
      room: roomName || ''
    };
  }

  function generateScopeDoc(opts) {
    opts = opts || {};
    const lib = window.PlanexScopeData;
    const type = lib.PROJECT_TYPES.filter(function (t) { return t.id === opts.projectType; })[0] || lib.PROJECT_TYPES[0];
    const quality = lib.QUALITY.filter(function (q) { return q.id === opts.quality; })[0] || lib.QUALITY[1];
    const rooms = (opts.rooms || []).map(normalizeRoom);
    const factor = (type.rateFactor || 1) * (quality.rateFactor || 1);

    const packages = [];
    lib.PACKAGES.forEach(function (pkg) {
      if (pkg.types.indexOf(type.id) === -1) return;
      const activities = [];

      if (pkg.scope === 'project') {
        const m = aggregate(rooms);
        pkg.activities.forEach(function (a) { activities.push(makeActivity(a, m, factor, '')); });
      } else {
        rooms.forEach(function (room) {
          if (!roomMatches(pkg.rooms, room.kind)) return;
          const m = metrics(room);
          pkg.activities.forEach(function (a) { activities.push(makeActivity(a, m, factor, room.name)); });
        });
      }
      if (!activities.length) return;

      const subtotal = activities.reduce(function (s, a) { return s + a.amount; }, 0);
      packages.push({
        id: pkg.id,
        name: pkg.name,
        description: pkg.desc,
        applicable: true,
        scope: pkg.scope,
        activities: activities,
        subtotal: subtotal,
        sharePct: 0
      });
    });

    const subtotal = packages.reduce(function (s, p) { return s + p.subtotal; }, 0);
    packages.forEach(function (p) { p.sharePct = subtotal ? Math.round((p.subtotal / subtotal) * 1000) / 10 : 0; });
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    const totalSqft = Math.round(rooms.reduce(function (s, r) { return s + r.areaSqft; }, 0));
    const budget = Number(opts.budget) || 0;

    return {
      projectType: type.id,
      quality: quality.id,
      generatedAt: new Date().toISOString(),
      area: { rooms: rooms, totalSqft: totalSqft, carpetSqft: Math.round(totalSqft * 0.9) },
      packages: packages,
      summary: { subtotal: subtotal, gst: gst, total: total, budget: budget, variance: budget ? budget - total : 0 }
    };
  }

  function recompute(doc) {
    if (!doc) return doc;
    let subtotal = 0;
    (doc.packages || []).forEach(function (p) {
      let ps = 0;
      (p.activities || []).forEach(function (a) {
        a.amount = (a.included === false ? 0 : (Number(a.qty) || 0) * (Number(a.rate) || 0));
        ps += a.amount;
      });
      p.subtotal = ps;
      subtotal += ps;
    });
    (doc.packages || []).forEach(function (p) { p.sharePct = subtotal ? Math.round((p.subtotal / subtotal) * 1000) / 10 : 0; });
    const gst = Math.round(subtotal * 0.18);
    doc.summary = {
      subtotal: subtotal, gst: gst, total: subtotal + gst,
      budget: doc.summary ? doc.summary.budget : 0,
      variance: (doc.summary && doc.summary.budget) ? doc.summary.budget - (subtotal + gst) : 0
    };
    return doc;
  }

  return { generateScopeDoc: generateScopeDoc, recompute: recompute, roomKind: roomKind };
})();
