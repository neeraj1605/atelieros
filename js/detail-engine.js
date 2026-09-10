/* ============================================================
   Planex — Shop Drawing Engine
   Generates 2D elevation + section details for joinery units
   (wardrobes, TV units, kitchen, crockery, study, foyer, pooja).
   Pure canvas — deterministic, printable, no model needed.
   ============================================================ */
window.PlanexDetailEngine = (function () {

  function unitType(name) {
    const n = String(name || '').toLowerCase();
    if (n.indexOf('wardrobe') >= 0) return 'wardrobe';
    if (n.indexOf('tv') >= 0) return 'tv';
    if (n.indexOf('kitchen') >= 0 || n.indexOf('base') >= 0 || n.indexOf('wall unit') >= 0 || n.indexOf('tall') >= 0 || n.indexOf('cabinet') >= 0) return 'kitchen';
    if (n.indexOf('crockery') >= 0 || n.indexOf('bar') >= 0) return 'crockery';
    if (n.indexOf('study') >= 0) return 'study';
    if (n.indexOf('foyer') >= 0 || n.indexOf('shoe') >= 0) return 'foyer';
    if (n.indexOf('pooja') >= 0) return 'pooja';
    return 'generic';
  }

  // Accept "1800 × 450 × 1800", "2400 × 2400 × 600", "1200 x 550 x 750" (any order of W,D,H given as W×D×H)
  function parseSize(sizeStr, type) {
    const nums = String(sizeStr || '').match(/\d+(\.\d+)?/g);
    let w = 1800, d = 450, h = 1800;
    if (nums && nums.length >= 2) {
      w = Number(nums[0]); d = Number(nums[1]); h = Number(nums[2] || nums[1]);
    }
    // sanity for wardrobe/tv where H may be the 2nd number
    if (type === 'wardrobe' && nums && nums.length >= 2 && nums[2] == null) { h = Number(nums[1]); d = 600; }
    return { w: Math.max(300, w), d: Math.max(150, d), h: Math.max(300, h) };
  }

  function setup(canvas, cssW, cssH) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const css = getComputedStyle(document.documentElement);
    return {
      ctx: ctx, W: cssW, H: cssH,
      line: css.getPropertyValue('--text-secondary').trim() || '#52525b',
      soft: css.getPropertyValue('--border-strong').trim() || '#d4d4d8',
      faint: css.getPropertyValue('--text-muted').trim() || '#a1a1aa',
      text: css.getPropertyValue('--text').trim() || '#18181b',
      bg: '#ffffff'
    };
  }

  function frame(s, x, y, w, h, fill, stroke, lw) {
    s.ctx.fillStyle = fill || '#ffffff';
    s.ctx.fillRect(x, y, w, h);
    s.ctx.strokeStyle = stroke || s.line;
    s.ctx.lineWidth = lw == null ? 1.4 : lw;
    s.ctx.strokeRect(x, y, w, h);
  }

  function vline(s, x, y1, y2) { s.ctx.beginPath(); s.ctx.moveTo(x, y1); s.ctx.lineTo(x, y2); s.ctx.stroke(); }
  function hline(s, x1, x2, y) { s.ctx.beginPath(); s.ctx.moveTo(x1, y); s.ctx.lineTo(x2, y); s.ctx.stroke(); }

  function dimH(s, x1, x2, y, label) {
    s.ctx.strokeStyle = s.faint; s.ctx.lineWidth = 1;
    hline(s, x1, x2, y);
    vline(s, x1, y - 5, y + 5); vline(s, x2, y - 5, y + 5);
    s.ctx.fillStyle = s.line; s.ctx.font = '600 10px Inter, sans-serif'; s.ctx.textAlign = 'center';
    s.ctx.fillText(label, (x1 + x2) / 2, y - 6);
  }
  function dimV(s, x, y1, y2, label) {
    s.ctx.strokeStyle = s.faint; s.ctx.lineWidth = 1;
    vline(s, x, y1, y2);
    hline(s, x - 5, x + 5, y1); hline(s, x - 5, x + 5, y2);
    s.ctx.save();
    s.ctx.translate(x - 7, (y1 + y2) / 2); s.ctx.rotate(-Math.PI / 2);
    s.ctx.fillStyle = s.line; s.ctx.font = '600 10px Inter, sans-serif'; s.ctx.textAlign = 'center';
    s.ctx.fillText(label, 0, 0);
    s.ctx.restore();
  }
  function label(s, x, y, text, color, align, font) {
    s.ctx.fillStyle = color || s.line;
    s.ctx.font = font || '500 10px Inter, sans-serif';
    s.ctx.textAlign = align || 'left';
    s.ctx.fillText(text, x, y);
  }
  function leader(s, x, y, tx, ty, text) {
    s.ctx.strokeStyle = s.faint; s.ctx.lineWidth = 1;
    s.ctx.beginPath(); s.ctx.moveTo(x, y); s.ctx.lineTo(tx, ty); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.arc(x, y, 1.6, 0, Math.PI * 2); s.ctx.fillStyle = s.faint; s.ctx.fill();
    label(s, tx + 3, ty - 2, text, s.line);
  }

  // ---------- Elevation ----------
  function drawUnit(canvas, unit) {
    const type = unitType(unit.name);
    const size = parseSize(unit.size, type);
    const s = setup(canvas, canvas.parentElement.clientWidth || 520, 300);

    const padL = 40, padR = 40, padT = 34, padB = 34;
    const availW = s.W - padL - padR, availH = s.H - padT - padB;
    const scale = Math.min(availW / size.w, availH / size.h);
    const w = size.w * scale, h = size.h * scale;
    const x = padL + (availW - w) / 2, y = padT + (availH - h) / 2;

    // title
    label(s, 10, 16, (unit.mark ? unit.mark + ' · ' : '') + unit.name, s.text, 'left', '700 11px Inter, sans-serif');
    label(s, s.W - 10, 16, 'ELEVATION  ·  scale ' + (scale * 1000).toFixed(0) + ' : 1000', s.faint, 'right', '500 10px Inter, sans-serif');

    frame(s, x, y, w, h, '#fbfbfc', s.line, 1.6);

    const bandY = function (f) { return y + h * f; };

    if (type === 'wardrobe') {
      const loft = h * 0.18;
      hline(s, x, x + w, y + loft);
      const doors = Math.max(2, Math.round(size.w / 900));
      for (let i = 1; i < doors; i++) { s.ctx.strokeStyle = s.soft; vline(s, x + (w / doors) * i, y + loft, y + h); }
      hline(s, x, x + w, y + h * 0.86);
      label(s, x + w / 2, y + loft / 2 + 3, 'LOFT', s.faint, 'center');
      label(s, x + w / 2, y + h * 0.72, 'HANGING / SHELVES', s.faint, 'center');
      leader(s, x + 12, y + loft - 6, x + w * 0.5, y - 14, 'Loft shutter');
      leader(s, x + 12, y + h * 0.9, x + w * 0.55, y + h + 24, 'Drawer bank (optional)');
    } else if (type === 'tv') {
      const top = h * 0.28, mid = y + top, niche = h * 0.5;
      hline(s, x, x + w, mid);
      hline(s, x, x + w, mid + niche);
      const shelves = 3;
      for (let i = 1; i < shelves; i++) hline(s, x, x + w, mid + (niche / shelves) * i);
      label(s, x + w / 2, y + top / 2 + 3, 'OPEN SHELVES', s.faint, 'center');
      label(s, x + w / 2, mid + niche / 2 + 3, 'TV NICHE', s.faint, 'center');
      label(s, x + w / 2, mid + niche + (h - top - niche) / 2 + 3, 'DRAWERS', s.faint, 'center');
      leader(s, x + 12, y + 8, x + w * 0.5, y - 14, 'Shutter / open display');
    } else if (type === 'kitchen') {
      const counter = h * 0.62;
      hline(s, x, x + w, y + counter);
      const doors = Math.max(2, Math.round(size.w / 600));
      for (let i = 1; i < doors; i++) { s.ctx.strokeStyle = s.soft; vline(s, x + (w / doors) * i, y, y + counter); }
      hline(s, x, x + w, y + h - h * 0.06);
      label(s, x + w / 2, y + 12, 'WALL UNITS / SHELVES', s.faint, 'center');
      label(s, x + w / 2, y + counter / 2 + 4, 'BASE UNITS', s.faint, 'center');
      label(s, x + w / 2, y + h - 4, 'TOE KICK', s.faint, 'center');
      leader(s, x + w - 12, y + counter - 4, x + w * 0.6, y + counter + 22, 'Counter 20mm quartz');
    } else if (type === 'crockery') {
      const shelves = 4;
      for (let i = 1; i < shelves; i++) hline(s, x, x + w, y + (h / shelves) * i);
      s.ctx.strokeStyle = s.soft;
      for (let i = 0; i < w; i += 14) { s.ctx.beginPath(); s.ctx.moveTo(x + i, y); s.ctx.lineTo(x + i + 8, y + h / 2); s.ctx.stroke(); }
      label(s, x + w / 2, y + 12, 'GLASS SHUTTERS', s.faint, 'center');
    } else if (type === 'study') {
      const desk = h * 0.42;
      hline(s, x, x + w, y + desk);
      hline(s, x, x + w, y + desk + 6);
      label(s, x + w / 2, y + desk - 6, 'DESK', s.faint, 'center');
      label(s, x + w / 2, y + desk + h * 0.2, 'KNEE SPACE', s.faint, 'center');
      vline(s, x + w * 0.72, y + desk, y + h);
    } else if (type === 'foyer') {
      hline(s, x, x + w, y + h * 0.4);
      label(s, x + w / 2, y + h * 0.2, 'SEATING / CUSHION', s.faint, 'center');
      for (let i = 1; i <= 3; i++) hline(s, x, x + w, y + h * 0.4 + (h * 0.6 / 4) * i);
      label(s, x + w / 2, y + h * 0.75, 'SHOE SHELVES', s.faint, 'center');
    } else if (type === 'pooja') {
      const arch = w * 0.6;
      s.ctx.beginPath();
      s.ctx.moveTo(x + (w - arch) / 2, y + h * 0.4);
      s.ctx.lineTo(x + (w - arch) / 2, y + h * 0.15);
      s.ctx.quadraticCurveTo(x + w / 2, y - h * 0.02, x + (w + arch) / 2, y + h * 0.15);
      s.ctx.lineTo(x + (w + arch) / 2, y + h * 0.4);
      s.ctx.strokeStyle = s.line; s.ctx.stroke();
      hline(s, x, x + w, y + h * 0.4);
      label(s, x + w / 2, y + h * 0.28, 'MANDIR NICHE', s.faint, 'center');
      label(s, x + w / 2, y + h * 0.7, 'STORAGE / DRAWERS', s.faint, 'center');
    } else {
      const doors = Math.max(2, Math.round(size.w / 700));
      for (let i = 1; i < doors; i++) { s.ctx.strokeStyle = s.soft; vline(s, x + (w / doors) * i, y, y + h); }
      label(s, x + w / 2, y + h / 2, 'SHUTTERS', s.faint, 'center');
    }

    dimH(s, x, x + w, y + h + 18, size.w + ' mm');
    dimV(s, x - 16, y, y + h, size.h + ' mm');
    label(s, x, y + h + 34, 'W × H', s.faint, 'left', '500 9px Inter, sans-serif');
  }

  function drawSection(canvas, unit) {
    const type = unitType(unit.name);
    const size = parseSize(unit.size, type);
    const s = setup(canvas, canvas.parentElement.clientWidth || 320, 300);

    const padL = 44, padR = 30, padT = 34, padB = 40;
    const availW = s.W - padL - padR, availH = s.H - padT - padB;
    const scale = Math.min(availW / size.d, availH / size.h);
    const w = size.d * scale, h = size.h * scale;
    const x = padL + (availW - w) / 2, y = padT + (availH - h) / 2;

    label(s, 10, 16, (unit.mark ? unit.mark + ' · ' : '') + unit.name + ' — SECTION', s.text, 'left', '700 11px Inter, sans-serif');
    label(s, s.W - 10, 16, 'scale ' + (scale * 1000).toFixed(0) + ' : 1000', s.faint, 'right', '500 10px Inter, sans-serif');

    // wall behind
    s.ctx.fillStyle = '#f0f0f2'; s.ctx.fillRect(x - 14, y, 14, h);
    frame(s, x, y, w, h, '#fbfbfc', s.line, 1.6);
    hline(s, x, x + w, y + h - h * 0.06);
    label(s, x + w + 4, y + h - h * 0.03, 'Plinth', s.faint);

    const n = 5;
    for (let i = 1; i < n; i++) { hline(s, x, x + w, y + (h / n) * i); }
    label(s, x + w / 2, y + 12, 'Shelves', s.faint, 'center');

    // back panel
    s.ctx.fillStyle = '#eceef0'; s.ctx.fillRect(x, y, 4, h);
    label(s, x + 6, y + h + 16, 'Wall', s.faint);

    dimH(s, x, x + w, y + h + 22, size.d + ' mm (depth)');
    dimV(s, x + w + 16, y, y + h, size.h + ' mm');
    leader(s, x + 2, y + 10, x + w + 2, y - 14, 'Back panel 6mm');
    leader(s, x + w / 2, y + (h / n), x + w * 0.6, y + (h / n) + 16, 'Shelf 18mm');
  }

  return { unitType: unitType, parseSize: parseSize, drawUnit: drawUnit, drawSection: drawSection };
})();
