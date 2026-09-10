/* ============================================================
   Planex — Plan Generator
   Turns the room schedule (names + dimensions) into an indicative
   architectural footprint: each room gets a rectangle, partitioned to
   fill a near-square envelope. Deterministic. Basis for every sheet.
   ============================================================ */
window.PlanexPlanGenerator = (function () {

  function roomAreaM2(r) {
    const w = Number(r.length) || 0, d = Number(r.width) || 0;
    const a = w * d;
    return a > 0 && a < 200 ? a : 12;
  }

  // Recursive area partition (binary split by half-area, alternating axis).
  function partition(items, x, y, w, h, out) {
    if (!items.length) return;
    if (items.length === 1) {
      out.push({ room: items[0], x: x, y: y, w: w, h: h });
      return;
    }
    const total = items.reduce(function (s, i) { return s + i.area; }, 0) || 1;
    let acc = 0, idx = items.length - 1;
    for (let k = 0; k < items.length - 1; k++) {
      acc += items[k].area;
      if (acc >= total / 2) { idx = k + 1; break; }
    }
    const left = items.slice(0, idx);
    const right = items.slice(idx);
    if (!left.length || !right.length) { out.push({ room: items[0], x: x, y: y, w: w, h: h }); return; }
    const frac = left.reduce(function (s, i) { return s + i.area; }, 0) / total;
    if (w >= h) {
      const lw = w * frac;
      partition(left, x, y, lw, h, out);
      partition(right, x + lw, y, w - lw, h, out);
    } else {
      const lh = h * frac;
      partition(left, x, y, w, lh, out);
      partition(right, x, y + lh, w, h - lh, out);
    }
  }

  function generatePlan(rooms, opts) {
    opts = opts || {};
    const list = (rooms || []).map(function (r) {
      const area = roomAreaM2(r);
      return {
        id: r.id, name: r.name, kind: kindOf(r.name),
        length: Number(r.length) || Math.round(Math.sqrt(area) * 10) / 10,
        width: Number(r.width) || Math.round(Math.sqrt(area) * 10) / 10,
        area: area
      };
    });
    if (!list.length) return null;

    list.sort(function (a, b) { return b.area - a.area; });

    const totalArea = list.reduce(function (s, r) { return s + r.area; }, 0);
    const envelope = totalArea * (opts.efficiency || 1.16);
    const side = Math.sqrt(envelope);
    const W = side, H = side;

    const rects = [];
    partition(list, 0, 0, W, H, rects);

    return {
      widthM: W,
      heightM: H,
      totalAreaM2: totalArea,
      efficiency: opts.efficiency || 1.16,
      generatedAt: new Date().toISOString(),
      rooms: rects.map(function (r) {
        return {
          id: r.room.id, name: r.room.name, kind: r.room.kind,
          x: r.x, y: r.y, w: r.w, h: r.h,
          length: r.room.length, width: r.room.width,
          areaM2: r.room.area
        };
      })
    };
  }

  function kindOf(name) {
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

  return { generatePlan: generatePlan, kindOf: kindOf, roomAreaM2: roomAreaM2 };
})();
