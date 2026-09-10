/* ============================================================
   Planex — Service Layout Engine
   Per-room schematic layouts for Electrical, Lighting and Plumbing,
   drawn deterministically from the docket schedules. Symbols are
   placed by rule (not by site coordinates), tagged, and legend-keyed.
   No prices. Printable.
   ============================================================ */
window.PlanexLayoutEngine = (function () {
  const M_TO_FT = 3.28084;

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
      text: css.getPropertyValue('--text').trim() || '#18181b'
    };
  }

  function label(s, x, y, t, color, align, font) {
    s.ctx.fillStyle = color || s.line;
    s.ctx.font = font || '500 10px Inter, sans-serif';
    s.ctx.textAlign = align || 'left';
    s.ctx.fillText(t, x, y);
  }

  function roomDims(room) {
    let w = Number(room.length) || 4, d = Number(room.width) || 3;
    if (w > 40 || d > 40) { w = 4; d = 3; }
    return { w: w, d: d };
  }

  // ---- symbol primitives ----
  function symSwitch(s, x, y) {
    s.ctx.strokeStyle = s.line; s.ctx.lineWidth = 1.4;
    s.ctx.beginPath(); s.ctx.arc(x, y, 5, 0, Math.PI * 2); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.moveTo(x, y); s.ctx.lineTo(x + 5, y - 5); s.ctx.stroke();
  }
  function symSocket(s, x, y) {
    s.ctx.strokeStyle = s.line; s.ctx.lineWidth = 1.4;
    s.ctx.beginPath(); s.ctx.arc(x, y, 5, 0, Math.PI); s.ctx.moveTo(x - 5, y); s.ctx.lineTo(x + 5, y); s.ctx.stroke();
  }
  function symFan(s, x, y) {
    s.ctx.strokeStyle = s.line; s.ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      s.ctx.beginPath(); s.ctx.moveTo(x, y);
      const a = (i / 3) * Math.PI * 2;
      s.ctx.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); s.ctx.stroke();
    }
    s.ctx.beginPath(); s.ctx.arc(x, y, 2.5, 0, Math.PI * 2); s.ctx.stroke();
  }
  function symDownlight(s, x, y) {
    s.ctx.strokeStyle = s.line; s.ctx.lineWidth = 1.4;
    s.ctx.beginPath(); s.ctx.arc(x, y, 4, 0, Math.PI * 2); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.moveTo(x - 4, y); s.ctx.lineTo(x + 4, y); s.ctx.moveTo(x, y - 4); s.ctx.lineTo(x, y + 4); s.ctx.stroke();
  }
  function symPendant(s, x, y) {
    s.ctx.strokeStyle = s.line; s.ctx.lineWidth = 1.4;
    s.ctx.beginPath(); s.ctx.arc(x, y, 6, 0, Math.PI * 2); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.moveTo(x, y - 6); s.ctx.lineTo(x, y - 12); s.ctx.stroke();
  }
  function symCove(s, x1, y1, x2, y2) {
    s.ctx.strokeStyle = s.faint; s.ctx.lineWidth = 2; s.ctx.setLineDash([6, 4]);
    s.ctx.beginPath(); s.ctx.moveTo(x1, y1); s.ctx.lineTo(x2, y2); s.ctx.stroke();
    s.ctx.setLineDash([]);
  }
  function symWC(s, x, y) { symRect(s, x - 6, y - 8, 12, 16, 'WC'); }
  function symBasin(s, x, y) { symRect(s, x - 8, y - 5, 16, 10, 'WB'); }
  function symShower(s, x, y) { symRect(s, x - 8, y - 8, 16, 16, 'SH'); }
  function symRect(s, x, y, w, h, t) {
    s.ctx.strokeStyle = s.line; s.ctx.lineWidth = 1.4;
    s.ctx.strokeRect(x, y, w, h);
    s.ctx.fillStyle = s.faint; s.ctx.font = '700 8px Inter, sans-serif'; s.ctx.textAlign = 'center';
    s.ctx.fillText(t, x + w / 2, y + h / 2 + 3);
  }

  function drawRoomBase(s, x, y, w, h, room) {
    s.ctx.fillStyle = '#fbfbfc'; s.ctx.fillRect(x, y, w, h);
    s.ctx.strokeStyle = s.line; s.ctx.lineWidth = 1.8; s.ctx.strokeRect(x, y, w, h);
    label(s, x + 6, y + 14, room.name, s.text, 'left', '700 11px Inter, sans-serif');
    label(s, x + w - 6, y + 14, (Number(room.length) || 0) + ' × ' + (Number(room.width) || 0) + ' m', s.faint, 'right');
    // door marker (bottom-centre)
    s.ctx.strokeStyle = s.faint; s.ctx.lineWidth = 1;
    s.ctx.beginPath(); s.ctx.moveTo(x + w / 2 - 14, y + h); s.ctx.lineTo(x + w / 2 + 14, y + h); s.ctx.stroke();
  }

  // ---- Lighting layout: ceiling grid of downlights + cove + pendant ----
  function drawLighting(canvas, room) {
    const s = setup(canvas, canvas.parentElement.clientWidth || 420, 260);
    const pad = 34;
    const d = roomDims(room);
    const scale = Math.min((s.W - pad * 2) / d.w, (s.H - pad * 2) / d.d);
    const w = d.w * scale, h = d.d * scale;
    const x = pad, y = (s.H - h) / 2;
    label(s, 8, 14, room.name + ' — ceiling lighting', s.text, 'left', '700 11px Inter, sans-serif');
    drawRoomBase(s, x, y, w, h, room);

    // cove outline (inset dashed)
    symCove(s, x + 12, y + h - 12, x + w - 12, y + h - 12);
    symCove(s, x + 12, y + 12, x + w / 2 - 24, y + 12);

    // downlight grid
    const cols = Math.max(2, Math.round(d.w / 1.5));
    const rows = Math.max(1, Math.round(d.d / 1.5));
    let n = 0;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (j === 0 && i === 0) continue; // leave room for pendant
        const px = x + ((i + 0.5) / cols) * w;
        const py = y + ((j + 0.5) / rows) * h;
        symDownlight(s, px, py);
        n++;
      }
    }
    symPendant(s, x + w / 2, y + h / 2);
    label(s, x + w / 2 + 8, y + h / 2 + 3, 'Pendant', s.faint);
    label(s, x + 8, y + h - 20, n + ' downlights + cove + pendant', s.faint);
  }

  // ---- Electrical layout: switch board at door, sockets, AC, light points ----
  function drawElectrical(canvas, room) {
    const s = setup(canvas, canvas.parentElement.clientWidth || 420, 260);
    const pad = 34;
    const d = roomDims(room);
    const scale = Math.min((s.W - pad * 2) / d.w, (s.H - pad * 2) / d.d);
    const w = d.w * scale, h = d.d * scale;
    const x = pad, y = (s.H - h) / 2;
    label(s, 8, 14, room.name + ' — electrical points', s.text, 'left', '700 11px Inter, sans-serif');
    drawRoomBase(s, x, y, w, h, room);

    // switch board near the door (bottom wall)
    symSwitch(s, x + w / 2 + 26, y + h - 8);
    label(s, x + w / 2 + 34, y + h - 5, 'Switch board 1200mm', s.faint);

    // sockets along walls at 300mm
    symSocket(s, x + 18, y + h - 6); label(s, x + 24, y + h + 12, '6A 300mm', s.faint);
    symSocket(s, x + w - 18, y + h - 6); label(s, x + w - 70, y + h + 12, '6A 300mm', s.faint);
    // 16A above counter / appliance
    symSocket(s, x + 18, y + 8); label(s, x + 24, y - 2, '16A 1100mm', s.faint);

    // AC point top corner
    s.ctx.strokeStyle = s.line; s.ctx.lineWidth = 1.4;
    s.ctx.strokeRect(x + w - 34, y + 6, 26, 10);
    label(s, x + w - 74, y + 14, 'AC 1800mm', s.faint);

    // light/fan points on ceiling
    symFan(s, x + w / 2, y + h / 2);
    symDownlight(s, x + w / 2 - 40, y + 20);
    symDownlight(s, x + w / 2 + 40, y + 20);
    label(s, x + 8, y + h - 20, 'Light/fan points on ceiling', s.faint);
  }

  // ---- Plumbing layout (wet rooms) ----
  function drawPlumbing(canvas, room) {
    const s = setup(canvas, canvas.parentElement.clientWidth || 420, 260);
    const pad = 34;
    const d = roomDims(room);
    const scale = Math.min((s.W - pad * 2) / d.w, (s.H - pad * 2) / d.d);
    const w = d.w * scale, h = d.d * scale;
    const x = pad, y = (s.H - h) / 2;
    label(s, 8, 14, room.name + ' — sanitary layout', s.text, 'left', '700 11px Inter, sans-serif');
    drawRoomBase(s, x, y, w, h, room);

    // fixtures along top wall, shaft at top-left corner
    s.ctx.fillStyle = '#eef0f2'; s.ctx.fillRect(x + 2, y + 2, 18, 18);
    label(s, x + 11, y + 34, 'Shaft', s.faint, 'center', '500 8px Inter, sans-serif');
    symWC(s, x + 34, y + 22);
    symBasin(s, x + 74, y + 18);
    symShower(s, x + w - 26, y + 22);

    // supply / drain lines
    s.ctx.strokeStyle = '#4a90d9'; s.ctx.lineWidth = 1.4;
    s.ctx.beginPath(); s.ctx.moveTo(x + 20, y + 20); s.ctx.lineTo(x + 74, y + 20); s.ctx.lineTo(x + w - 26, y + 20); s.ctx.stroke();
    label(s, x + 8, y + h - 20, 'Blue = supply · Drain to shaft', '#4a90d9');
    label(s, x + 8, y + 8, 'Basin 750 · Shower 2100 · Health faucet 750 mm', s.faint, 'left', '500 9px Inter, sans-serif');
  }

  function legend(kind) {
    if (kind === 'lighting') return 'Symbols: ◉ downlight · ⊙ pendant · ▭ cove (dashed)';
    if (kind === 'electrical') return 'Symbols: —○ socket · ⊾ switch · AC box · fan/downlight on ceiling';
    return 'Symbols: WC · WB basin · SH shower · Shaft';
  }

  function draw(canvas, kind, room) {
    if (kind === 'lighting') drawLighting(canvas, room);
    else if (kind === 'electrical') drawElectrical(canvas, room);
    else if (kind === 'plumbing') drawPlumbing(canvas, room);
  }

  return { draw: draw, legend: legend, roomDims: roomDims };
})();
