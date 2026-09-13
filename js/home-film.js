/* ============================================================
   Planex — Home film
   An illustrated, animated short: an Indian couple take their
   bare-shell flat to a furnished home with Planex. Pure canvas,
   no assets. Chapters drive captions; real footage can replace it
   via PLANEX_CONFIG.demoVideo.
   ============================================================ */
window.PlanexHomeFilm = (function () {
  const DUR = 36000;
  const CH = [
    { at: 0, label: 'The empty flat', cap: 'Riya and Arjun, in their bare-shell 3BHK.' },
    { at: 6500, label: 'Open Planex', cap: 'They add their floor plan and confirm the rooms.' },
    { at: 13000, label: 'The look comes together', cap: 'Room by room, the layout and the look take shape.' },
    { at: 24000, label: 'Priced & buildable', cap: 'Scope, BOQ, dockets and vendor-ready documents.' },
    { at: 30000, label: 'Home', cap: 'Their home, ready to live in.' }
  ];

  const C = {
    wall: '#f4ede3', wallShade: '#e8dfd1', ceil: '#f8f3ec',
    floor: '#dcc6a8', floorDark: '#cdb391',
    sky: '#cfe3f0', sky2: '#eaf4fb', sun: '#fff4e0',
    sofa: '#bd9068', sofaDark: '#a0764f', cushionA: '#c9a27a', cushionB: '#7d8a6a',
    wood: '#8a5d38', woodDark: '#6f4a2c', ink: '#2f3437', brass: '#b08d57',
    rug: '#e5d8c4', rug2: '#d3c0a4', green: '#5f7a54', white: '#ffffff',
    skinA: '#c98b62', skinB: '#d69b73', hair: '#2b2020',
    kurta: '#b0574f', shirt: '#4f6b7a', trousers: '#3a3f45',
    line: 'rgba(47,52,55,.18)'
  };

  function ease(t) { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function poly(c, pts, fill) {
    c.beginPath();
    pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
  }
  function txt(c, t, x, y, size, color, weight, align) {
    c.fillStyle = color; c.textAlign = align || 'left';
    c.font = (weight || 600) + ' ' + size + 'px Inter, sans-serif';
    c.fillText(t, x, y);
  }
  // appear progress for an item introduced during chapter 3
  function app(e, offset, dur) { return ease((e - (13000 + offset)) / (dur || 700)); }

  /* ---------------- Room ---------------- */
  function room(c, W, H, warm) {
    c.fillStyle = C.wall; c.fillRect(0, 0, W, H);
    const bx0 = 0.20 * W, by0 = 0.20 * H, bx1 = 0.80 * W, by1 = 0.66 * H;
    // ceiling
    poly(c, [[0, 0], [W, 0], [bx1, by0], [bx0, by0]], C.ceil);
    // side walls
    poly(c, [[0, 0], [bx0, by0], [bx0, by1], [0, H]], C.wallShade);
    poly(c, [[W, 0], [bx1, by0], [bx1, by1], [W, H]], C.wallShade);
    // back wall
    c.fillStyle = C.wall; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    // floor
    const g = c.createLinearGradient(0, by1, 0, H);
    g.addColorStop(0, C.floorDark); g.addColorStop(1, C.floor);
    poly(c, [[bx0, by1], [bx1, by1], [W, H], [0, H]], C.floor);
    c.fillStyle = g; poly(c, [[bx0, by1], [bx1, by1], [W, H], [0, H]]);
    // plank lines
    c.strokeStyle = 'rgba(120,90,55,.16)'; c.lineWidth = 1;
    for (let i = -6; i <= 6; i++) {
      const fx = 0.5 * W + i * 0.09 * W;
      c.beginPath(); c.moveTo(fx, by1); c.lineTo(0.5 * W + i * 0.22 * W, H); c.stroke();
    }
    // skirting
    c.strokeStyle = 'rgba(90,70,50,.25)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(bx0, by1); c.lineTo(bx1, by1); c.stroke();
    // window on back wall
    const wx0 = 0.34 * W, wx1 = 0.62 * W, wy0 = 0.30 * H, wy1 = 0.57 * H;
    const sky = c.createLinearGradient(0, wy0, 0, wy1);
    sky.addColorStop(0, C.sky2); sky.addColorStop(1, C.sky);
    c.fillStyle = sky; c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    c.strokeStyle = 'rgba(47,52,55,.5)'; c.lineWidth = 3;
    c.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    c.beginPath(); c.moveTo((wx0 + wx1) / 2, wy0); c.lineTo((wx0 + wx1) / 2, wy1);
    c.moveTo(wx0, (wy0 + wy1) / 2); c.lineTo(wx1, (wy0 + wy1) / 2); c.stroke();
    // sunlight beam
    c.save(); c.globalAlpha = 0.5;
    const beam = c.createLinearGradient(wx0, wy0, wx0 + 0.5 * W, H);
    beam.addColorStop(0, C.sun); beam.addColorStop(1, 'rgba(255,244,224,0)');
    poly(c, [[wx0, wy0], [wx1, wy0], [0.85 * W, H], [0.35 * W, H]], beam);
    c.restore();
    if (warm) {
      c.save(); c.globalCompositeOperation = 'multiply';
      c.fillStyle = 'rgba(255,228,190,.25)'; c.fillRect(0, 0, W, H);
      c.restore();
    }
    c.strokeStyle = C.line; c.lineWidth = 1.5; c.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
  }

  /* ---------------- Furniture ---------------- */
  function rug(c, W, H, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const y = 0.80 * H, x = 0.5 * W, w = 0.62 * W, h = 0.13 * H;
    rr(c, x - w / 2, y - h / 2, w, h, 10); c.fillStyle = C.rug; c.fill();
    rr(c, x - w / 2 + 12, y - h / 2 + 8, w - 24, h - 16, 8); c.fillStyle = C.rug2; c.fill();
    c.restore();
  }
  function sofa(c, W, H, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = 0.40 * W, y = 0.78 * H, w = 0.30 * W, h = 0.14 * H;
    c.save(); c.globalAlpha = a * 0.25; c.fillStyle = '#000';
    rr(c, x - w / 2 + 6, y + h / 2 - 2, w, 10, 6); c.fill(); c.restore();
    rr(c, x - w / 2, y - h / 2, w, h, 14); c.fillStyle = C.sofa; c.fill();
    rr(c, x - w / 2, y - h / 2 - 0.045 * H, w, 0.06 * H, 12); c.fillStyle = C.sofaDark; c.fill();
    // arms
    rr(c, x - w / 2 - 0.012 * W, y - h / 2 - 0.02 * H, 0.02 * W, h + 0.02 * H, 8); c.fillStyle = C.sofaDark; c.fill();
    rr(c, x + w / 2 - 0.008 * W, y - h / 2 - 0.02 * H, 0.02 * W, h + 0.02 * H, 8); c.fillStyle = C.sofaDark; c.fill();
    // cushions
    rr(c, x - w * 0.30, y - h * 0.55, 0.055 * W, 0.05 * H, 6); c.fillStyle = C.cushionA; c.fill();
    rr(c, x + w * 0.10, y - h * 0.55, 0.055 * W, 0.05 * H, 6); c.fillStyle = C.cushionB; c.fill();
    c.restore();
  }
  function coffee(c, W, H, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = 0.40 * W, y = 0.875 * H, w = 0.13 * W, h = 0.03 * H;
    rr(c, x - w / 2, y - h, w, h, 5); c.fillStyle = C.wood; c.fill();
    rr(c, x - w / 2 + 6, y, 5, 0.035 * H, 2); c.fillStyle = C.woodDark; c.fill();
    rr(c, x + w / 2 - 11, y, 5, 0.035 * H, 2); c.fillStyle = C.woodDark; c.fill();
    rr(c, x - 0.02 * W, y - h - 0.012 * H, 0.04 * W, 0.012 * H, 3); c.fillStyle = C.ink; c.fill(); // book
    c.restore();
  }
  function tvUnit(c, W, H, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = 0.40 * W, y = 0.60 * H, w = 0.36 * W, h = 0.055 * H;
    rr(c, x - w / 2, y - h, w, h, 6); c.fillStyle = C.wood; c.fill();
    rr(c, x - w / 2 + 8, y - h - 0.004 * H, w - 16, 0.006 * H, 3); c.fillStyle = C.woodDark; c.fill();
    // TV
    rr(c, x - 0.09 * W, y - h - 0.115 * H, 0.18 * W, 0.105 * H, 5); c.fillStyle = C.ink; c.fill();
    c.save(); c.globalAlpha = a * 0.6;
    rr(c, x - 0.084 * W, y - h - 0.108 * H, 0.168 * W, 0.093 * H, 3); c.fillStyle = '#3d474d'; c.fill();
    c.restore();
    c.restore();
  }
  function art(c, W, H, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = 0.68 * W, y = 0.34 * H, w = 0.075 * W, h = 0.09 * H;
    rr(c, x - w / 2, y - h / 2, w, h, 4); c.fillStyle = C.white; c.fill();
    c.strokeStyle = C.line; c.strokeRect(x - w / 2, y - h / 2, w, h);
    poly(c, [[x - w / 2 + 4, y + h / 2 - 4], [x - w / 6, y - h / 6], [x + w / 6, y + h / 2 - 4]], C.cushionB);
    c.beginPath(); c.arc(x + w / 5, y - h / 5, 4, 0, Math.PI * 2); c.fillStyle = C.brass; c.fill();
    c.restore();
  }
  function lamp(c, W, H, a, glow) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = 0.145 * W, y = 0.86 * H, top = 0.52 * H;
    c.strokeStyle = C.brass; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, top); c.stroke();
    c.beginPath(); c.moveTo(x - 0.03 * W, top + 0.01 * H); c.lineTo(x + 0.03 * W, top + 0.01 * H); c.lineTo(x + 0.02 * W, top - 0.05 * H); c.lineTo(x - 0.02 * W, top - 0.05 * H); c.closePath();
    c.fillStyle = C.ink; c.fill();
    rr(c, x - 0.03 * W, y - 4, 0.06 * W, 6, 3); c.fillStyle = C.brass; c.fill();
    if (glow) {
      const gg = c.createRadialGradient(x, top, 4, x, top, 0.16 * W);
      gg.addColorStop(0, 'rgba(255,214,150,.55)'); gg.addColorStop(1, 'rgba(255,214,150,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(x, top, 0.16 * W, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  function plant(c, W, H, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = 0.635 * W, y = 0.86 * H;
    rr(c, x - 0.022 * W, y - 0.05 * H, 0.044 * W, 0.05 * H, 5); c.fillStyle = C.brass; c.fill();
    c.strokeStyle = C.green; c.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      c.beginPath(); c.moveTo(x, y - 0.05 * H);
      c.quadraticCurveTo(x + i * 0.02 * W, y - 0.12 * H, x + i * 0.035 * W, y - 0.17 * H - Math.abs(i) * 0.01 * H);
      c.stroke();
    }
    c.fillStyle = C.green;
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI - Math.PI * 0.1, rr2 = 0.05 * W;
      c.beginPath(); c.ellipse(x + Math.cos(ang) * rr2 * 0.6, y - 0.17 * H + Math.sin(ang) * rr2 * 0.5, 9, 5, ang, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  function dining(c, W, H, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = 0.63 * W, y = 0.80 * H, w = 0.17 * W, h = 0.02 * H;
    rr(c, x - w / 2, y - h, w, h, 4); c.fillStyle = C.wood; c.fill();
    rr(c, x - w / 2 + 8, y, 5, 0.06 * H, 2); c.fillStyle = C.woodDark; c.fill();
    rr(c, x + w / 2 - 13, y, 5, 0.06 * H, 2); c.fillStyle = C.woodDark; c.fill();
    // chairs
    [-0.075, 0.075].forEach(function (dx, i) {
      const cx = x + dx * W;
      rr(c, cx - 0.016 * W, y - 0.055 * H, 0.032 * W, 0.006 * H, 2); c.fillStyle = C.sofaDark; c.fill();
      c.strokeStyle = C.woodDark; c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx - 0.014 * W, y - 0.05 * H); c.lineTo(cx - 0.014 * W, y); c.moveTo(cx + 0.014 * W, y - 0.05 * H); c.lineTo(cx + 0.014 * W, y); c.stroke();
    });
    c.restore();
  }
  function pendant(c, W, H, a, glow) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = 0.60 * W, yTop = 0.06 * H, y = 0.30 * H;
    c.strokeStyle = C.ink; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, yTop); c.lineTo(x, y - 0.02 * H); c.stroke();
    poly(c, [[x - 0.028 * W, y + 0.02 * H], [x + 0.028 * W, y + 0.02 * H], [x + 0.018 * W, y - 0.02 * H], [x - 0.018 * W, y - 0.02 * H]], C.ink);
    if (glow) {
      const gg = c.createRadialGradient(x, y + 0.03 * H, 4, x, y + 0.03 * H, 0.2 * W);
      gg.addColorStop(0, 'rgba(255,220,160,.5)'); gg.addColorStop(1, 'rgba(255,220,160,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(x, y + 0.03 * H, 0.2 * W, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  function curtains(c, W, H, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a * 0.95;
    const wy0 = 0.30 * H, wy1 = 0.57 * H;
    [0.30, 0.60].forEach(function (fx) {
      const x = fx * W;
      c.fillStyle = '#d9cdb9';
      rr(c, x, wy0 - 0.02 * H, 0.035 * W, (wy1 - wy0) + 0.06 * H, 4); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 1;
      for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x + i * 0.009 * W, wy0 - 0.02 * H); c.lineTo(x + i * 0.009 * W, wy1 + 0.04 * H); c.stroke(); }
    });
    c.restore();
  }

  /* ---------------- People ---------------- */
  function person(c, x, y, s, pose, col, hairLong, faceX) {
    c.save();
    c.translate(x, y); c.scale(s, s);
    const skin = col.skin;
    if (pose === 'sit') {
      // legs (seated)
      c.strokeStyle = col.bottom; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-6, -14); c.lineTo(10, -10); c.lineTo(22, 4); c.stroke();
      c.beginPath(); c.moveTo(6, -14); c.lineTo(20, -8); c.lineTo(30, 6); c.stroke();
      // torso
      rr(c, -14, -54, 28, 44, 12); c.fillStyle = col.top; c.fill();
      // arms
      c.strokeStyle = skin; c.lineWidth = 7;
      c.beginPath(); c.moveTo(-12, -46); c.lineTo(2, -26); c.stroke();
      c.beginPath(); c.moveTo(12, -46); c.lineTo(24, -28); c.stroke();
    } else {
      // legs (standing)
      c.strokeStyle = col.bottom; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-6, -30); c.lineTo(-7, 0); c.stroke();
      c.beginPath(); c.moveTo(6, -30); c.lineTo(8, 0); c.stroke();
      // torso
      rr(c, -14, -66, 28, 40, 12); c.fillStyle = col.top; c.fill();
      // arms
      c.strokeStyle = skin; c.lineWidth = 7;
      c.beginPath(); c.moveTo(-12, -58); c.lineTo(faceX > 0 ? 4 : -18, faceX > 0 ? -40 : -44); c.stroke();
      c.beginPath(); c.moveTo(12, -58); c.lineTo(faceX > 0 ? 22 : 24, faceX > 0 ? -44 : -40); c.stroke();
    }
    // head
    c.beginPath(); c.arc(0, pose === 'sit' ? -68 : -80, 13, 0, Math.PI * 2); c.fillStyle = skin; c.fill();
    // hair
    c.fillStyle = C.hair;
    if (hairLong) {
      c.beginPath(); c.arc(0, pose === 'sit' ? -70 : -82, 14, Math.PI * 0.95, Math.PI * 2.15); c.fill();
      rr(c, -14, (pose === 'sit' ? -70 : -82), 6, 34, 3); c.fill();
      rr(c, 8, (pose === 'sit' ? -70 : -82), 6, 34, 3); c.fill();
    } else {
      c.beginPath(); c.arc(0, pose === 'sit' ? -71 : -83, 14, Math.PI, Math.PI * 2); c.fill();
    }
    // face dot
    c.fillStyle = 'rgba(43,32,32,.75)';
    c.beginPath(); c.arc(faceX * 4, pose === 'sit' ? -67 : -79, 1.6, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function laptop(c, W, H, a, glow) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = 0.5 * W, y = 0.80 * H, w = 0.10 * W;
    // stool
    rr(c, x - w * 0.5, y + 0.02 * H, w, 0.012 * H, 3); c.fillStyle = C.wood; c.fill();
    // base
    poly(c, [[x - w / 2, y], [x + w / 2, y], [x + w / 2 - 6, y + 0.014 * H], [x - w / 2 + 6, y + 0.014 * H]], C.ink);
    // screen
    poly(c, [[x - w / 2, y], [x + w / 2, y], [x + w / 2 - 4, y - 0.075 * H], [x - w / 2 + 4, y - 0.075 * H]], '#20262a');
    const sx = x - w / 2 + 8, sy = y - 0.068 * H, sw = w - 16, sh = 0.06 * H;
    c.fillStyle = glow ? '#eaf6ff' : '#dfe9ef'; c.fillRect(sx, sy, sw, sh);
    // mini plan on screen
    c.strokeStyle = 'rgba(47,52,55,.6)'; c.lineWidth = 1;
    c.strokeRect(sx + 4, sy + 4, sw * 0.55, sh * 0.5);
    c.strokeRect(sx + 4 + sw * 0.55, sy + 4, sw * 0.35, sh * 0.5);
    c.beginPath(); c.moveTo(sx + 4, sy + sh - 6); c.lineTo(sx + sw - 4, sy + sh - 6); c.stroke();
    c.restore();
  }

  /* ---------------- Overlay cards (chapter 4) ---------------- */
  function card(c, x, y, w, h, title, value, a, bob) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = clamp(a, 0, 1);
    const yy = y + Math.sin(bob) * 4;
    c.save(); c.globalAlpha = a * 0.18; c.fillStyle = '#000';
    rr(c, x - w / 2 + 4, yy - h / 2 + 6, w, h, 12); c.fill(); c.restore();
    rr(c, x - w / 2, yy - h / 2, w, h, 12); c.fillStyle = 'rgba(255,255,255,.96)'; c.fill();
    c.strokeStyle = 'rgba(47,52,55,.12)'; c.lineWidth = 1; c.stroke();
    txt(c, title, x - w / 2 + 14, yy - h / 2 + 20, 10.5, '#8a8a92', 700);
    txt(c, value, x - w / 2 + 14, yy - h / 2 + 40, 15, '#18181b', 750);
    c.restore();
  }

  /* ---------------- Scene ---------------- */
  function frame(c, e, W, H) {
    const warm = clamp((e - 24000) / 6000, 0, 1);
    room(c, W, H, warm);
    const ch = e < 13000 ? 0 : 1; // pre/post furnish
    // window curtains only near the end
    curtains(c, W, H, app(e, 3200));
    rug(c, W, H, app(e, 0));
    sofa(c, W, H, app(e, 500));
    coffee(c, W, H, app(e, 900));
    tvUnit(c, W, H, app(e, 1300));
    art(c, W, H, app(e, 1900));
    plant(c, W, H, app(e, 2200));
    dining(c, W, H, app(e, 2900));
    lamp(c, W, H, app(e, 2400), e > 13000);
    pendant(c, W, H, app(e, 3600), warm > 0);

    // people: standing early, seated by the sofa later
    const seat = ease((e - 27500) / 1500);
    const px = lerp(0.50, 0.53, seat), py = lerp(0.80, 0.72, seat);
    if (e < 27500) {
      person(c, 0.46 * W, 0.80 * H, 1, 'stand', { top: C.kurta, bottom: C.trousers, skin: C.skinA }, true, 1);
      person(c, 0.55 * W, 0.80 * H, 1.03, 'stand', { top: C.shirt, bottom: C.trousers, skin: C.skinB }, false, -1);
      laptop(c, W, H, ease((e - 6000) / 900), e > 6500);
      // pointing gesture hint (chapter 2)
      if (e > 6500 && e < 13000) {
        c.save(); c.globalAlpha = ease((e - 6800) / 800) * (1 - ease((e - 12000) / 800));
        txt(c, 'Add your floor plan', 0.5 * W, 0.24 * H, 13, '#2f3437', 700, 'center');
        c.restore();
      }
    } else {
      person(c, 0.34 * W, 0.80 * H, 1, 'sit', { top: C.kurta, bottom: C.trousers, skin: C.skinA }, true, 1);
      person(c, 0.46 * W, 0.80 * H, 1, 'sit', { top: C.shirt, bottom: C.trousers, skin: C.skinB }, false, -1);
    }

    // chapter 4 overlay cards
    const c4 = e >= 24000 ? clamp((e - 24000) / 500, 0, 1) : 0;
    card(c, 0.755 * W, 0.34 * H, 0.20 * W, 0.10 * H, 'MOODBOARD', 'Warm Japandi', c4 * ease((e - 24200) / 700), e / 700);
    card(c, 0.755 * W, 0.47 * H, 0.20 * W, 0.10 * H, 'BOQ · GST READY', '₹36.7L', c4 * ease((e - 24900) / 700), e / 700 + 1);
    card(c, 0.755 * W, 0.60 * H, 0.20 * W, 0.10 * H, 'DOCKETS', '13 trades', c4 * ease((e - 25600) / 700), e / 700 + 2);
    card(c, 0.30 * W, 0.30 * H, 0.20 * W, 0.10 * H, 'DRAWINGS', 'A-01 – A-04', c4 * ease((e - 26300) / 700), e / 700 + 3);

    // chapter 5 wordmark
    const wm = e >= 30000 ? ease((e - 30000) / 1200) : 0;
    if (wm > 0) {
      c.save(); c.globalAlpha = wm;
      poly(c, [[0, H - 0.16 * H], [W, H - 0.16 * H], [W, H], [0, H]], 'rgba(24,24,27,.45)');
      txt(c, 'Planex AI', 0.06 * W, H - 0.075 * H, 24, '#ffffff', 700);
      txt(c, 'Plan & Execute · Interiors for India', 0.06 * W, H - 0.042 * H, 13, 'rgba(255,255,255,.8)', 500);
      c.restore();
    }
  }

  /* ---------------- Controller ---------------- */
  function mount(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    let timer = null, paused = false, elapsed = 0, last = 0, lastCh = -1;

    function resize() {
      const parent = canvas.parentElement;
      const w = (parent && parent.clientWidth) || 900;
      W = w; H = Math.round(w * 0.6);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = '100%'; canvas.style.height = 'auto';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      frame(ctx, elapsed % DUR, W, H);
      const idx = CH.slice().reverse().findIndex(function (c) { return (elapsed % DUR) >= c.at; });
      const ci = idx < 0 ? 0 : CH.length - 1 - idx;
      if (ci !== lastCh) { lastCh = ci; if (opts.onChapter) opts.onChapter(CH[ci], ci); }
      if (opts.onProgress) opts.onProgress((elapsed % DUR) / DUR);
    }

    function tick() {
      const now = Date.now();
      if (!paused) elapsed += Math.min(120, now - last);
      last = now;
      draw();
    }

    function start() {
      stop();
      resize();
      last = Date.now();
      timer = setInterval(tick, 40);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    start();
    return {
      play: function () { if (paused) { paused = false; last = Date.now(); } if (!timer) start(); },
      pause: function () { paused = true; },
      isPaused: function () { return paused; },
      restart: function () { elapsed = 0; lastCh = -1; if (!timer) start(); },
      seek: function (ms) { elapsed = Math.max(0, Number(ms) || 0); lastCh = -1; draw(); },
      resize: resize,
      destroy: stop
    };
  }

  return { mount: mount, DURATION: DUR, CHAPTERS: CH };
})();
