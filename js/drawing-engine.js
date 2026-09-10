/* ============================================================
   Planex — Drawing Engine
   Architectural sheet renderer: main layout, furniture layout,
   false-ceiling layout and lighting layout, drawn to scale from the
   generated plan footprint. Title block, north arrow, scale bar,
   legend, dimensions, hatching. No prices.
   ============================================================ */
window.PlanexDrawingEngine = (function () {
  const SHEETS = {
    main: { no: 'A-01', title: 'Main Layout Plan' },
    furniture: { no: 'A-02', title: 'Furniture Layout Plan' },
    ceiling: { no: 'A-03', title: 'False Ceiling Layout Plan' },
    lighting: { no: 'A-04', title: 'Lighting Layout Plan' }
  };

  function setup(canvas, cssW, cssH) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(document.documentElement);
    const s = {
      c: c, W: cssW, H: cssH,
      line: '#2b2b2f', soft: '#8a8a92', faint: '#b0b0b8', text: '#18181b', room: '#f6f7f9'
    };
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, cssW, cssH);
    return s;
  }

  function txt(s, x, y, t, color, align, font) {
    s.c.fillStyle = color || s.text;
    s.c.font = font || '500 10px Inter, sans-serif';
    s.c.textAlign = align || 'left';
    s.c.fillText(t, x, y);
  }
  function line(s, x1, y1, x2, y2, color, w, dash) {
    s.c.strokeStyle = color || s.line; s.c.lineWidth = w == null ? 1 : w;
    if (dash) s.c.setLineDash(dash);
    s.c.beginPath(); s.c.moveTo(x1, y1); s.c.lineTo(x2, y2); s.c.stroke();
    s.c.setLineDash([]);
  }
  function rect(s, x, y, w, h, fill, stroke, lw) {
    if (fill) { s.c.fillStyle = fill; s.c.fillRect(x, y, w, h); }
    if (stroke) { s.c.strokeStyle = stroke; s.c.lineWidth = lw == null ? 1 : lw; s.c.strokeRect(x, y, w, h); }
  }

  function sheetFrame(s) {
    const m = 10;
    rect(s, m, m, s.W - m * 2, s.H - m * 2, null, s.line, 2);
    rect(s, m + 4, m + 4, s.W - (m + 4) * 2, s.H - (m + 4) * 2, null, s.soft, 0.6);
  }

  function titleBlock(s, opts) {
    const bw = 250, bh = 78;
    const x = s.W - 14 - bw, y = s.H - 14 - bh;
    rect(s, x, y, bw, bh, '#ffffff', s.line, 1.4);
    line(s, x, y + 26, x + bw, y + 26, s.soft, 0.8);
    line(s, x, y + 52, x + bw, y + 52, s.soft, 0.8);
    txt(s, x + 8, y + 17, 'PLANEX AI', s.text, 'left', '800 12px Inter, sans-serif');
    txt(s, x + bw - 8, y + 17, 'INDICATIVE — VERIFY ON SITE', '#b45309', 'right', '700 8px Inter, sans-serif');
    txt(s, x + 8, y + 40, (opts.project || 'Project').toUpperCase(), s.text, 'left', '700 10px Inter, sans-serif');
    txt(s, x + 8, y + 66, SHEETS[opts.kind].no + ' · ' + SHEETS[opts.kind].title, s.text, 'left', '700 10px Inter, sans-serif');
    txt(s, x + bw - 8, y + 66, 'SCALE ' + (opts.scaleLabel || '1:50') + '  ·  ' + (opts.date || ''), s.soft, 'right', '600 9px Inter, sans-serif');
    txt(s, x + bw - 8, y + 40, 'REV ' + (opts.revision || 'P0') + (opts.provisional ? ' · PROVISIONAL' : ''), opts.provisional ? '#b45309' : s.soft, 'right', '600 9px Inter, sans-serif');
    return { x: x, y: y, w: bw, h: bh };
  }

  function north(s, x, y) {
    s.c.strokeStyle = s.line; s.c.lineWidth = 1.4;
    s.c.beginPath(); s.c.moveTo(x, y + 26); s.c.lineTo(x, y - 10); s.c.stroke();
    s.c.beginPath(); s.c.moveTo(x, y - 14); s.c.lineTo(x - 5, y - 4); s.c.lineTo(x + 5, y - 4); s.c.closePath();
    s.c.fillStyle = s.line; s.c.fill();
    txt(s, x, y + 38, 'N', s.text, 'center', '700 10px Inter, sans-serif');
  }

  function scaleBar(s, x, y, scale, metres) {
    const seg = metres * scale;
    txt(s, x, y - 6, 'SCALE BAR', s.soft, 'left', '600 8px Inter, sans-serif');
    for (let i = 0; i < 4; i++) {
      rect(s, x + (seg / 4) * i, y, seg / 4, 6, i % 2 ? '#ffffff' : s.line, s.line, 0.6);
    }
    txt(s, x, y + 18, '0', s.soft, 'left', '500 8px Inter, sans-serif');
    txt(s, x + seg, y + 18, metres + ' m', s.soft, 'right', '500 8px Inter, sans-serif');
  }

  function legend(s, x, y, items) {
    txt(s, x, y, 'LEGEND', s.text, 'left', '700 9px Inter, sans-serif');
    items.forEach(function (it, i) {
      const yy = y + 14 + i * 13;
      if (it.swatch) { rect(s, x, yy - 8, 12, 8, it.swatch, s.soft, 0.6); }
      else if (it.dash) { line(s, x, yy - 4, x + 12, yy - 4, it.color || s.soft, 2, [5, 3]); }
      else if (it.dot) { s.c.strokeStyle = s.soft; s.c.lineWidth = 1.2; s.c.beginPath(); s.c.arc(x + 6, yy - 4, 3.5, 0, Math.PI * 2); s.c.stroke(); }
      txt(s, x + 18, yy, it.label, s.soft, 'left', '500 9px Inter, sans-serif');
    });
  }

  function drawArea(s) {
    const tbH = 78, tbW = 250, m = 16;
    return {
      x: m + 4, y: m + 4,
      w: s.W - (m + 4) * 2 - 150,
      h: s.H - (m + 4) * 2 - tbH - 6
    };
  }

  function fit(plan, area) {
    const scale = Math.min(area.w / plan.widthM, area.h / plan.heightM) * 0.92;
    const ox = area.x + (area.w - plan.widthM * scale) / 2;
    const oy = area.y + (area.h - plan.heightM * scale) / 2;
    return { scale: scale, ox: ox, oy: oy };
  }

  function dims(s, plan, f, opts) {
    const xEnd = f.ox + plan.widthM * f.scale;
    const yEnd = f.oy + plan.heightM * f.scale;
    // overall
    line(s, f.ox, f.oy - 18, xEnd, f.oy - 18, s.soft, 0.6);
    line(s, f.ox, f.oy - 22, f.ox, f.oy - 14, s.soft, 0.6);
    line(s, xEnd, f.oy - 22, xEnd, f.oy - 14, s.soft, 0.6);
    txt(s, (f.ox + xEnd) / 2, f.oy - 22, Math.round(plan.widthM * 1000) + ' mm', s.soft, 'center', '600 9px Inter, sans-serif');
    line(s, f.ox - 18, f.oy, f.ox - 18, yEnd, s.soft, 0.6);
    line(s, f.ox - 22, f.oy, f.ox - 14, f.oy, s.soft, 0.6);
    line(s, f.ox - 22, yEnd, f.ox - 14, yEnd, s.soft, 0.6);
    s.c.save();
    s.c.translate(f.ox - 22, (f.oy + yEnd) / 2); s.c.rotate(-Math.PI / 2);
    txt(s, 0, 0, Math.round(plan.heightM * 1000) + ' mm', s.soft, 'center', '600 9px Inter, sans-serif');
    s.c.restore();
  }

  function drawRooms(s, plan, f, opts) {
    plan.rooms.forEach(function (r) {
      const X = f.ox + r.x * f.scale, Y = f.oy + r.y * f.scale;
      const Wp = r.w * f.scale, Hp = r.h * f.scale;
      const wet = (r.kind === 'bath' || r.kind === 'kitchen' || r.kind === 'utility' || r.kind === 'balcony');
      rect(s, X, Y, Wp, Hp, wet ? '#eef4f6' : s.room, s.line, 1.6);
      // wall poché
      s.c.strokeStyle = '#3a3a40'; s.c.lineWidth = 2.4; s.c.strokeRect(X - 1, Y - 1, Wp + 2, Hp + 2);
      // label
      txt(s, X + Wp / 2, Y + Hp / 2 - 3, r.name, s.text, 'center', '700 9px Inter, sans-serif');
      txt(s, X + Wp / 2, Y + Hp / 2 + 9, Math.round(r.areaM2) + ' sqm', s.soft, 'center', '500 8px Inter, sans-serif');
      if (Wp > 74 && Hp > 40) {
        txt(s, X + Wp / 2, Y + Hp / 2 + 20, (r.length || 0) + ' × ' + (r.width || 0) + ' m', s.faint, 'center', '500 8px Inter, sans-serif');
      }
      // entry marker on the shortest wall
      if (Wp > Hp) line(s, X + Wp / 2 - 10, Y + Hp, X + Wp / 2 + 10, Y + Hp, '#b45309', 1.6);
      else line(s, X, Y + Hp / 2 - 10, X, Y + Hp / 2 + 10, '#b45309', 1.6);
    });
    drawOutline(s, plan, f);
  }

  function drawOutline(s, plan, f) {
    // overall envelope
    s.c.strokeStyle = '#1f1f24'; s.c.lineWidth = 3;
    s.c.strokeRect(f.ox, f.oy, plan.widthM * f.scale, plan.heightM * f.scale);
  }

  // ---------------- Furniture ----------------
  function furnitureFor(room) {
    const F = [];
    const add = function (x, y, w, h, label, hatch) { F.push({ x: x, y: y, w: w, h: h, label: label, hatch: hatch }); };
    const cx = room.x + room.w / 2, cy = room.y + room.h / 2;
    const k = room.kind;
    if (k === 'bedroom' || k === 'kids' || k === 'guest') {
      const bw = 1.6, bh = 2.0;
      const vertical = room.h >= room.w;
      if (vertical) { add(cx - bw / 2, room.y + 0.1, bw, bh, 'BED'); add(room.x + 0.1, room.y + room.h - 0.7, 0.6, Math.min(2.0, room.w - 0.3), 'WRD', true); }
      else { add(cx - bh / 2, room.y + 0.1, bh, bw, 'BED'); add(room.x + 0.1, room.y + room.h - 0.7, Math.min(2.0, room.w - 0.3), 0.6, 'WRD', true); }
    } else if (k === 'living') {
      add(cx - 1.1, room.y + 0.15, 2.2, 0.85, 'SOFA');
      add(cx - 0.55, room.y + 1.25, 1.1, 0.6, 'CT', true);
      add(cx - 0.9, room.y + room.h - 0.6, 1.8, 0.45, 'TV', true);
    } else if (k === 'dining') {
      add(cx - 0.8, cy - 0.45, 1.6, 0.9, 'DINING');
    } else if (k === 'kitchen') {
      add(room.x + 0.1, room.y + 0.1, room.w - 0.2, 0.6, 'COUNTER', true);
      add(room.x + 0.1, room.y + 0.7, 0.6, Math.max(0.6, room.h - 0.8), 'COUNTER', true);
    } else if (k === 'study') {
      add(room.x + 0.15, room.y + 0.1, Math.min(1.4, room.w - 0.3), 0.6, 'DESK', true);
      add(room.x + 0.15, room.y + 0.8, 0.35, Math.max(0.6, room.h - 1.0), 'SHELF', true);
    } else if (k === 'foyer') {
      add(room.x + 0.1, room.y + 0.1, Math.min(1.2, room.w - 0.2), 0.35, 'SHOE', true);
    } else if (k === 'pooja') {
      add(cx - 0.45, room.y + 0.1, 0.9, 0.45, 'MANDIR', true);
    } else if (k === 'bath') {
      add(room.x + 0.1, room.y + 0.1, 0.4, 0.7, 'WC');
      add(room.x + room.w - 0.7, room.y + 0.1, 0.6, 0.5, 'WB', true);
      add(room.x + room.w - 1.0, room.y + room.h - 1.0, 0.9, 0.9, 'SH', true);
    } else if (k === 'balcony') {
      add(room.x + 0.15, room.y + 0.15, Math.min(1.2, room.w - 0.3), 0.5, 'SEAT', true);
    } else if (k === 'utility') {
      add(room.x + 0.1, room.y + 0.1, 0.6, 0.6, 'WM');
      add(room.x + 0.1, room.y + 0.8, 0.6, 0.5, 'SINK', true);
    }
    return F;
  }

  function drawFurniture(s, plan, f, opts) {
    drawRooms(s, plan, f, opts);
    let clear = 0;
    plan.rooms.forEach(function (r) {
      furnitureFor(r).forEach(function (it) {
        const X = f.ox + it.x * f.scale, Y = f.oy + it.y * f.scale;
        const Wp = it.w * f.scale, Hp = it.h * f.scale;
        rect(s, X, Y, Wp, Hp, '#ffffff', s.line, 1.2);
        if (it.hatch) {
          s.c.save(); s.c.beginPath(); s.c.rect(X, Y, Wp, Hp); s.c.clip();
          line(s, X, Y + Hp, X + Wp, Y, s.faint, 0.6);
          line(s, X, Y + Hp / 2, X + Wp / 2, Y, s.faint, 0.6);
          line(s, X + Wp / 2, Y + Hp, X + Wp, Y + Hp / 2, s.faint, 0.6);
          s.c.restore();
        }
        if (Wp > 34 && Hp > 16) txt(s, X + Wp / 2, Y + Hp / 2 + 3, it.label, s.soft, 'center', '600 8px Inter, sans-serif');
        clear++;
      });
      // clearance note for bedrooms
      if (r.kind === 'bedroom' || r.kind === 'kids' || r.kind === 'guest') {
        const footY = f.oy + (r.y + 2.1) * f.scale;
        const wardY = f.oy + (r.y + r.h - 0.7) * f.scale;
        if (wardY - footY > 12) {
          line(s, f.ox + (r.x + r.w - 0.9) * f.scale, footY, f.ox + (r.x + r.w - 0.9) * f.scale, wardY, '#b45309', 0.8, [4, 3]);
          txt(s, f.ox + (r.x + r.w - 0.9) * f.scale + 3, (footY + wardY) / 2, '900 clear', '#b45309', 'left', '600 8px Inter, sans-serif');
        }
      }
    });
    return clear;
  }

  // ---------------- Ceiling ----------------
  function drawCeiling(s, plan, f, opts) {
    drawRooms(s, plan, f, opts);
    let n = 0;
    plan.rooms.forEach(function (r) {
      const X = f.ox + r.x * f.scale, Y = f.oy + r.y * f.scale;
      const Wp = r.w * f.scale, Hp = r.h * f.scale;
      const inset = Math.min(Wp, Hp) * 0.14;
      // perimeter drop + cove
      line(s, X + inset, Y + inset, X + Wp - inset, Y + inset, '#8a6f52', 1.4, [6, 4]);
      line(s, X + inset, Y + Hp - inset, X + Wp - inset, Y + Hp - inset, '#8a6f52', 1.4, [6, 4]);
      line(s, X + inset, Y + inset, X + inset, Y + Hp - inset, '#8a6f52', 1.4, [6, 4]);
      line(s, X + Wp - inset, Y + inset, X + Wp - inset, Y + Hp - inset, '#8a6f52', 1.4, [6, 4]);
      txt(s, X + Wp / 2, Y + 12, 'PERIMETER DROP 150 + COVE', s.faint, 'center', '600 7px Inter, sans-serif');
      // AC indoor unit cut-out (living/bedroom)
      if (r.kind === 'living' || r.kind === 'bedroom' || r.kind === 'dining' || r.kind === 'kids') {
        rect(s, X + Wp / 2 - 20, Y + inset + 4, 40, 12, null, '#4a90d9', 1.2);
        txt(s, X + Wp / 2, Y + inset + 13, 'AC', '#4a90d9', 'center', '700 7px Inter, sans-serif');
      }
      // downlight cut-outs on grid
      const cols = Math.max(2, Math.round(r.w / 1.4));
      const rows = Math.max(1, Math.round(r.h / 1.4));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const px = X + ((i + 0.5) / cols) * Wp, py = Y + ((j + 0.5) / rows) * Hp;
        s.c.strokeStyle = '#b0b0b8'; s.c.lineWidth = 1;
        s.c.beginPath(); s.c.arc(px, py, 3, 0, Math.PI * 2); s.c.stroke();
        n++;
      }
      if (r.kind === 'bath' || r.kind === 'kitchen') {
        rect(s, X + Wp - 26, Y + Hp - 26, 18, 18, null, '#8a8a92', 1);
        txt(s, X + Wp - 17, Y + Hp - 14, 'AP', s.faint, 'center', '700 7px Inter, sans-serif');
      }
    });
    return n;
  }

  // ---------------- Lighting ----------------
  function drawLighting(s, plan, f, opts) {
    drawRooms(s, plan, f, opts);
    const fixtures = (opts && opts.fixtures) || [];
    let tag = 0, count = 0;
    plan.rooms.forEach(function (r) {
      const X = f.ox + r.x * f.scale, Y = f.oy + r.y * f.scale;
      const Wp = r.w * f.scale, Hp = r.h * f.scale;
      // cove
      line(s, X + 8, Y + Hp - 8, X + Wp - 8, Y + Hp - 8, '#b0b0b8', 1.6, [6, 4]);
      line(s, X + 8, Y + 8, X + Wp / 2 - 16, Y + 8, '#b0b0b8', 1.6, [6, 4]);
      // pendant at centre for living/dining
      if (r.kind === 'living' || r.kind === 'dining') {
        s.c.strokeStyle = '#b45309'; s.c.lineWidth = 1.4;
        s.c.beginPath(); s.c.arc(X + Wp / 2, Y + Hp / 2, 5, 0, Math.PI * 2); s.c.stroke();
        txt(s, X + Wp / 2 + 8, Y + Hp / 2 + 3, 'P', '#b45309', 'left', '700 8px Inter, sans-serif');
      }
      // downlight grid
      const cols = Math.max(2, Math.round(r.w / 1.4));
      const rows = Math.max(1, Math.round(r.h / 1.4));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const px = X + ((i + 0.5) / cols) * Wp, py = Y + ((j + 0.5) / rows) * Hp;
        s.c.strokeStyle = s.line; s.c.lineWidth = 1.2;
        s.c.beginPath(); s.c.arc(px, py, 4, 0, Math.PI * 2); s.c.stroke();
        s.c.beginPath(); s.c.moveTo(px - 4, py); s.c.lineTo(px + 4, py); s.c.moveTo(px, py - 4); s.c.lineTo(px, py + 4); s.c.stroke();
        if (count < 6 && px > X + 10) { txt(s, px + 5, py - 4, 'L' + (++tag), '#b45309', 'left', '700 7px Inter, sans-serif'); }
        count++;
      }
      // lux target
      const lux = r.kind === 'kitchen' || r.kind === 'study' ? '300–500 lux' : r.kind === 'living' || r.kind === 'dining' ? '150–200 lux' : '100–150 lux';
      txt(s, X + Wp / 2, Y + Hp - 8, lux, s.faint, 'center', '600 7px Inter, sans-serif');
    });
    return count;
  }

  function drawSheet(canvas, kind, plan, opts) {
    opts = opts || {};
    if (!plan) return;
    const cssW = canvas.parentElement.clientWidth || 900;
    const s = setup(canvas, cssW, Math.round(cssW * 0.6));
    sheetFrame(s);
    const area = drawArea(s);
    const f = fit(plan, area);

    let legendItems = [];
    if (kind === 'main') {
      drawRooms(s, plan, f, opts);
      dims(s, plan, f, opts);
      legendItems = [{ swatch: '#eef4f6', label: 'Wet area (bath / kitchen)' }, { line: 1, label: 'Entry / door opening' }];
    } else if (kind === 'furniture') {
      const n = drawFurniture(s, plan, f, opts);
      dims(s, plan, f, opts);
      legendItems = [{ swatch: '#ffffff', label: 'Furniture footprint' }, { dash: 1, color: '#b45309', label: 'Clearance' }, { label: n + ' items placed' }];
    } else if (kind === 'ceiling') {
      const n = drawCeiling(s, plan, f, opts);
      legendItems = [{ dash: 1, color: '#8a6f52', label: 'Perimeter drop + cove' }, { dot: 1, label: 'Downlight cut-out' }, { swatch: '#ffffff', label: 'AC / access panel' }, { label: n + ' cut-outs' }];
    } else if (kind === 'lighting') {
      const n = drawLighting(s, plan, f, opts);
      legendItems = [{ dot: 1, label: 'Downlight (tagged L1…)' }, { dash: 1, color: '#b0b0b8', label: 'Cove' }, { dot: 1, label: 'Pendant' }, { label: n + ' fixtures' }];
    }

    north(s, s.W - 34, 42);
    scaleBar(s, 24, s.H - 40, f.scale, 2);
    legend(s, 24, 34, legendItems);
    titleBlock(s, {
      kind: kind, project: opts.project, date: opts.date, revision: opts.revision,
      scaleLabel: '1:50 (indicative)', provisional: opts.provisional
    });
  }

  return { drawSheet: drawSheet, SHEETS: SHEETS, furnitureFor: furnitureFor };
})();
