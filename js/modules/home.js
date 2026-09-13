/* ============================================================
   Planex — Home (public homepage)
   Redesigned around an illustrated short film of an Indian couple
   taking their bare-shell flat to a furnished home with Planex.
   Audiences: homeowners (B2C), businesses (B2B), partners.
   All product visuals render live from the real Planex engines.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Home = (function () {
  let seg = 'b2c';
  let demoStep = 0;
  let demoPlaying = true;
  let galleryTab = 'main';

  let demoTimer = null;
  let elapsed = 0;
  let filmCtl = null;
  let revealObserver = null;
  const STEP_MS = 5200;

  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function cssVar(name, fallback) {
    try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
    catch (e) { return fallback; }
  }

  /* ---------------- Sample project (drives every visual) ---------------- */
  const SAMPLE_ROOMS = [
    { name: 'Living Room', length: 5.4, width: 4.2 },
    { name: 'Dining Room', length: 3.6, width: 3.0 },
    { name: 'Modular Kitchen', length: 3.0, width: 2.4 },
    { name: 'Master Bedroom', length: 4.5, width: 3.6 },
    { name: 'Kids Bedroom', length: 3.6, width: 3.0 },
    { name: 'Master Bathroom', length: 2.4, width: 1.8 }
  ];
  let _plan = null;
  function samplePlan() {
    if (_plan) return _plan;
    try { _plan = window.PlanexPlanGenerator.generatePlan(SAMPLE_ROOMS); } catch (e) { _plan = null; }
    return _plan;
  }
  const SAMPLE_UNIT = { mark: 'FU1', name: 'TV unit', size: '1800 × 450 × 1800' };
  const PALETTE = [
    { role: 'Base', name: 'Warm plaster', hex: '#ece5db' },
    { role: 'Wood', name: 'Teak', hex: '#b07d4f' },
    { role: 'Accent', name: 'Olive', hex: '#7d8a6a' },
    { role: 'Deep', name: 'Charcoal', hex: '#2f3437' },
    { role: 'Metal', name: 'Antique brass', hex: '#b08d57' },
    { role: 'Soft', name: 'Linen', hex: '#f4f1ec' }
  ];

  /* ---------------- Canvas painters ---------------- */
  function paint(canvas, W, H, fn) {
    try {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      const c = canvas.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      fn(c);
      return true;
    } catch (e) { return false; }
  }
  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function drawSheetInto(canvas, kind) {
    const plan = samplePlan();
    if (!plan || !window.PlanexDrawingEngine) return false;
    try {
      window.PlanexDrawingEngine.drawSheet(canvas, kind, plan, {
        project: 'Planex demo home', date: new Date().toLocaleDateString(), revision: 'P1', provisional: false
      });
      return true;
    } catch (e) { return false; }
  }
  function drawMoodboardInto(canvas) {
    const W = canvas.parentElement && canvas.parentElement.clientWidth ? canvas.parentElement.clientWidth : 760;
    const H = Math.round(W * 0.6);
    return paint(canvas, W, H, function (c) {
      const line = cssVar('--border', '#e4e4e7');
      const text = cssVar('--text', '#18181b');
      const muted = cssVar('--text-muted', '#a1a1aa');
      const surface = cssVar('--surface', '#ffffff');
      c.fillStyle = surface; c.fillRect(0, 0, W, H);
      const pad = Math.round(W * 0.035);
      const tileY = pad, tileH = Math.round(H * 0.52), gap = Math.round(W * 0.02);
      const tileW = Math.round((W - pad * 2 - gap * 2) / 3);
      const tiles = [
        { label: 'Fluted wood', a: '#b07d4f', b: '#8a5d38', tex: 'wood' },
        { label: 'Linen upholstery', a: '#efe9e0', b: '#ded4c6', tex: 'linen' },
        { label: 'Terrazzo floor', a: '#e9e6df', b: '#cfc9bd', tex: 'stone' }
      ];
      tiles.forEach(function (t, i) {
        const x = pad + i * (tileW + gap);
        const g = c.createLinearGradient(x, tileY, x + tileW, tileY + tileH);
        g.addColorStop(0, t.a); g.addColorStop(1, t.b);
        roundRect(c, x, tileY, tileW, tileH, 16); c.fillStyle = g; c.fill();
        c.save(); roundRect(c, x, tileY, tileW, tileH, 16); c.clip(); c.globalAlpha = 0.18;
        if (t.tex === 'wood') {
          c.strokeStyle = '#5b3d22'; c.lineWidth = 1.2;
          for (let yy = tileY + 8; yy < tileY + tileH; yy += 11) { c.beginPath(); c.moveTo(x, yy); c.bezierCurveTo(x + tileW * 0.3, yy - 4, x + tileW * 0.7, yy + 4, x + tileW, yy); c.stroke(); }
        } else if (t.tex === 'linen') {
          c.strokeStyle = '#b8a892';
          for (let yy = tileY; yy < tileY + tileH; yy += 7) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + tileW, yy); c.stroke(); }
          for (let xx = x; xx < x + tileW; xx += 7) { c.beginPath(); c.moveTo(xx, tileY); c.lineTo(xx, tileY + tileH); c.stroke(); }
        } else {
          c.fillStyle = '#8a8377';
          for (let k = 0; k < 90; k++) { const rx = x + Math.random() * tileW, ry = tileY + Math.random() * tileH, r = 1 + Math.random() * 2.4; c.beginPath(); c.arc(rx, ry, r, 0, Math.PI * 2); c.fill(); }
        }
        c.restore(); c.globalAlpha = 1;
        c.fillStyle = 'rgba(0,0,0,.45)';
        roundRect(c, x + 12, tileY + tileH - 32, c.measureText(t.label).width + 46, 22, 11); c.fill();
        c.fillStyle = '#fff'; c.font = '600 11px Inter, sans-serif'; c.textAlign = 'left';
        c.fillText(t.label, x + 24, tileY + tileH - 17);
      });
      const py = tileY + tileH + Math.round(H * 0.09);
      c.fillStyle = muted; c.font = '700 10px Inter, sans-serif'; c.textAlign = 'left';
      c.fillText('PALETTE', pad, py - 10);
      const sw = Math.round((W - pad * 2 - gap * (PALETTE.length - 1)) / PALETTE.length);
      PALETTE.forEach(function (p, i) {
        const x = pad + i * (sw + gap);
        roundRect(c, x, py, sw, Math.round(H * 0.16), 12); c.fillStyle = p.hex; c.fill();
        c.strokeStyle = line; c.lineWidth = 1; c.stroke();
        c.fillStyle = text; c.font = '600 10px Inter, sans-serif'; c.fillText(p.name, x + 2, py + Math.round(H * 0.16) + 14);
        c.fillStyle = muted; c.font = '500 9px Inter, sans-serif'; c.fillText(p.hex.toUpperCase(), x + 2, py + Math.round(H * 0.16) + 26);
      });
    });
  }

  /* ---------------- Real customer video slot ---------------- */
  function config() { return window.PLANEX_CONFIG || {}; }
  function videoEmbed(url, provider) {
    const p = String(provider || '').toLowerCase();
    if (p === 'youtube' || /youtube\.com|youtu\.be/.test(url)) {
      const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
      if (m) return { kind: 'iframe', src: 'https://www.youtube.com/embed/' + m[1] + '?rel=0' };
    }
    if (p === 'vimeo' || /vimeo\.com/.test(url)) {
      const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (m) return { kind: 'iframe', src: 'https://player.vimeo.com/video/' + m[1] };
    }
    return { kind: 'video', src: url };
  }
  function realVideo() {
    const v = config().demoVideo || {};
    if (!v.url) return '';
    const emb = videoEmbed(v.url, v.provider);
    const poster = v.poster ? ' poster="' + esc(v.poster) + '"' : '';
    if (emb.kind === 'video') return `<video class="hero-video" controls playsinline preload="metadata"${poster}><source src="${esc(emb.src)}" type="video/mp4"></video>`;
    return `<div class="hero-video hero-video-embed" data-embed="${esc(emb.src)}"><button class="btn btn-primary" id="video-embed-play">▶&nbsp; Play the customer film</button></div>`;
  }

  /* ---------------- Walkthrough steps ---------------- */
  function demoChipRows(items) {
    return `<div class="demo-chips">${items.map(function (x) { return '<span class="demo-chip">' + esc(x) + '</span>'; }).join('')}</div>`;
  }
  function spacesDOM() {
    return `<div class="demo-panel"><div class="demo-room-grid">
      ${SAMPLE_ROOMS.map(function (r) { return `<div class="demo-room"><div class="demo-room-name">${esc(r.name)}</div><div class="demo-room-dim">${r.length} × ${r.width} m</div><div class="demo-room-area">${(r.length * r.width).toFixed(1)} m²</div></div>`; }).join('')}
    </div>${demoChipRows(['6 spaces confirmed', 'Area schedule ready', 'Photos attached', 'Brief captured'])}</div>`;
  }
  function scopeDOM() {
    const pkgs = [['Flooring', 92], ['Painting', 88], ['False Ceiling', 76], ['Electrical', 84], ['Lighting', 70], ['Joinery & Millwork', 81], ['Kitchen Systems', 74], ['Plumbing', 66]];
    return `<div class="demo-panel"><div class="demo-list">
      ${pkgs.map(function (p) { return `<div class="demo-list-row"><span class="demo-list-name">${esc(p[0])}</span><span class="demo-bar"><span class="demo-bar-fill" style="width:${p[1]}%"></span></span><span class="faint text-xs">${p[1]}%</span></div>`; }).join('')}
    </div>${demoChipRows(['22 work packages', 'Room by room', 'Nothing missed'])}</div>`;
  }
  function boqDOM() {
    const rows = [
      ['Vitrified flooring 600×600', '520 sqft', '₹145', '₹75,400'],
      ['Gypsum false ceiling + cove', '380 sqft', '₹78', '₹29,640'],
      ['Sliding-door wardrobe', '8 rft', '₹7,800', '₹62,400'],
      ['TV unit with storage', '1 nos', '₹38,000', '₹38,000'],
      ['Interior emulsion', '1,850 sqft', '₹55', '₹1,01,750']
    ];
    return `<div class="demo-panel"><table class="demo-table"><thead><tr><th>Line</th><th>Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>
      ${rows.map(function (r) { return `<tr><td>${esc(r[0])}</td><td class="faint">${esc(r[1])}</td><td class="num">${esc(r[2])}</td><td class="num">${esc(r[3])}</td></tr>`; }).join('')}
    </tbody><tfoot><tr><td colspan="3" class="num">Total incl. 18% GST</td><td class="num"><strong>₹36.7L</strong></td></tr></tfoot></table>
    ${demoChipRows(['GST-ready', 'Editable rates', 'Makes included'])}</div>`;
  }
  function sheetDOM() {
    return `<div class="demo-panel"><div class="demo-doc">
      <div class="demo-doc-head"><div><div class="demo-doc-title">Furniture &amp; Joinery — Scope Sheet</div><div class="faint text-xs">Millwork · R1 · Issued</div></div><span class="badge badge-success">Audit passed</span></div>
      <div class="demo-doc-line"><span>Wardrobes &amp; internals</span><span class="faint">To be measured on site</span></div>
      <div class="demo-doc-line"><span>TV unit &amp; crockery</span><span class="faint">Per unit</span></div>
      <div class="demo-doc-line"><span>Carcass / shutter / hardware</span><span class="faint">Specified</span></div>
    </div>${demoChipRows(['Inclusions & exclusions', 'Measurement basis', 'Drawings attached', 'Frozen on issue'])}</div>`;
  }
  function execDOM() {
    const phases = [['Design & freeze', 100, 'done'], ['Demolition & civil', 100, 'done'], ['Plumbing & electrical', 60, 'active'], ['Ceiling & wall finishes', 20, 'upcoming'], ['Joinery & millwork', 0, 'upcoming'], ['Flooring & paint', 0, 'upcoming']];
    return `<div class="demo-panel"><div class="demo-gantt">
      ${phases.map(function (p) { return `<div class="demo-gantt-row"><span class="demo-gantt-name">${esc(p[0])}</span><span class="demo-bar"><span class="demo-bar-fill ${p[2]}" style="width:${p[1]}%"></span></span><span class="faint text-xs">${p[1]}%</span></div>`; }).join('')}
    </div>${demoChipRows(['Programme tracked', 'Stage QC sign-off', '1 open snag'])}</div>`;
  }

  const DEMO = [
    { label: 'Floor plan', title: 'Read your floor plan', you: 'Upload a plan, image or sketch.', planex: 'Reads the rooms, names and approximate areas — you confirm the dimensions.', out: 'A validated plan and area schedule.', kind: 'canvas', sheet: 'main' },
    { label: 'Spaces', title: 'Set up every space', you: 'Confirm sizes, add photos, note what you want.', planex: 'Turns rooms into spaces with a brief, condition and status.', out: 'A space-by-space brief.', kind: 'dom', html: spacesDOM },
    { label: 'Moodboard', title: 'Choose the look', you: 'Pick a direction and a palette.', planex: 'Builds a colour palette with materials, makes and finishes per space.', out: 'An approved look with finish references.', kind: 'canvas', mood: true },
    { label: 'Scope', title: 'Scope the work', you: 'Review what is included, exclude what is not.', planex: 'Generates 22 work packages room by room, with quantities.', out: 'A complete, priced-ready scope of work.', kind: 'dom', html: scopeDOM },
    { label: 'Costing', title: 'Know the cost before you build', you: 'Adjust quality and compare options.', planex: 'Prices every line with makes and rates, and keeps GST current.', out: 'A firm, editable, GST-ready BOQ.', kind: 'dom', html: boqDOM },
    { label: 'Dockets', title: 'Issue the drawings', you: 'Check the trade schedules and details.', planex: 'Builds 13 trade dockets — joinery, ceiling, lighting, electrical and more.', out: 'Build-ready dockets and elevations.', kind: 'canvas', unit: true },
    { label: 'Scope sheets', title: 'Get like-for-like quotes', you: 'Issue scope sheets to your vendors.', planex: 'Freezes the scope, audits every gap and analyses uploaded quotes.', out: 'Vendor quotes on one basis.', kind: 'dom', html: sheetDOM },
    { label: 'Execution', title: 'Build and track to handover', you: 'Follow the programme and close snags.', planex: 'Tracks milestones, stage-wise QC and the handover checklist.', out: 'A snag-free handover.', kind: 'dom', html: execDOM }
  ];

  const GALLERY = [
    { id: 'main', label: 'A-01 Main Layout', kind: 'sheet' },
    { id: 'furniture', label: 'A-02 Furniture', kind: 'sheet' },
    { id: 'ceiling', label: 'A-03 Ceiling', kind: 'sheet' },
    { id: 'lighting', label: 'A-04 Lighting', kind: 'sheet' },
    { id: 'unit', label: 'Unit elevation', kind: 'unit' },
    { id: 'electrical', label: 'Electrical layout', kind: 'layout' },
    { id: 'plumbing', label: 'Plumbing layout', kind: 'layout' },
    { id: 'moodboard', label: 'Moodboard', kind: 'mood' }
  ];

  /* ---------------- Data ---------------- */
  const SEGMENTS = [
    { id: 'b2c', label: 'For homeowners', icon: 'home' },
    { id: 'b2b', label: 'For business', icon: 'build' },
    { id: 'partner', label: 'Partners', icon: 'sparkles' }
  ];
  const B2C_PLANS = [
    { id: 'essential', name: 'Essential', tag: 'AI-assisted', price: '₹4,999', unit: '/ project', servicePlan: 'ai', desc: 'Design, price and build with Planex AI beside you at every step.', features: ['Floor plan → spaces → moodboard', 'Room-wise scope of work', 'Firm BOQ priced in ₹', 'A-01–A-04 drawings & 13 trade dockets', 'Vendor-ready scope sheets', 'Change anytime'], cta: 'Start free' },
    { id: 'signature', name: 'Signature', tag: 'AI + remote expert', price: '₹24,999', unit: '/ project', popular: true, servicePlan: 'remote', desc: 'The AI journey plus a remote interior expert to review and sign off.', features: ['Everything in Essential', '1:1 video consult with an expert', 'Expert review of design & scope', 'Drawing set sign-off', 'Vendor quote comparison', '3 revision cycles'], cta: 'Choose Signature' },
    { id: 'bespoke', name: 'Bespoke', tag: 'AI + on-ground', price: 'Custom', unit: '', servicePlan: 'onground', desc: 'Hands-on delivery with on-ground support from survey to handover.', features: ['Everything in Signature', 'Site visits & measurements', 'Contractor coordination', 'Stage-wise QC & snag closure', 'Dedicated project manager', 'Handover documentation'], cta: 'Talk to us' }
  ];
  const B2B_PLANS = [
    { id: 'studio', name: 'Studio', tag: 'Independent designers', price: '₹49,999', unit: '/ year', desc: 'Win more work and cut drawing time with a full AI back office.', features: ['Up to 20 projects / year', 'Client-ready drawings & BOQ', 'White-label PDF exports', 'Scope sheets & RFQ packs', 'Priority AI capacity', 'Email support'], cta: 'Start Studio' },
    { id: 'firm', name: 'Firm', tag: 'Interior firms & contractors', price: '₹1,49,999', unit: '/ year', popular: true, desc: 'Standardise scope, price every job on the same basis and protect margin.', features: ['Up to 100 projects / year', 'Team seats & shared libraries', 'Procurement + vendor quotes', 'Spec-compliance checks', 'Branded templates', 'API access', 'Dedicated success manager'], cta: 'Start Firm' },
    { id: 'enterprise', name: 'Enterprise', tag: 'Developers, hospitality & retail', price: 'Custom', unit: '', desc: 'Roll out Planex across projects, teams and rate cards.', features: ['Unlimited projects', 'SSO & role controls', 'Custom rate cards & libraries', 'Multi-project dashboards', 'Onboarding & training', 'SLA & priority support'], cta: 'Talk to sales' }
  ];
  const B2C_VALUE = [
    { icon: 'plan', title: 'A real design, not a guess', desc: 'Your floor plan becomes room-wise spaces, layouts and an approved look — with drawings your team can build from.' },
    { icon: 'rupee', title: 'Know the cost before you build', desc: 'A GST-ready BOQ with makes, quantities and rates — so you compare quotes on the same basis.' },
    { icon: 'build', title: 'Build without surprises', desc: 'Trade dockets, vendor scope sheets, a programme and QC checks keep the site moving and snags closing.' }
  ];
  const B2B_VALUE = [
    { icon: 'sparkles', title: 'Quote in hours, not weeks', desc: 'Turn a plan into a priced proposal with drawings, scope and BOQ — consistently across every project.' },
    { icon: 'docket', title: 'Same basis, every vendor', desc: 'Scope sheets with inclusions, exclusions and measurement basis remove the assumptions that leak margin.' },
    { icon: 'check', title: 'Deliver predictably', desc: 'Dockets, procurement and execution tracking in one thread, with revision control you can defend.' }
  ];
  const PARTNER_TYPES = [
    { icon: 'build', title: 'Manufacturers & brands', desc: 'Get specced into plans, BOQs and scope sheets at the moment of design.' },
    { icon: 'docket', title: 'Contractors & vendors', desc: 'Receive RFQs on a fixed scope basis and quote faster, with fewer disputes.' },
    { icon: 'sparkles', title: 'Design studios & consultants', desc: 'Use Planex as your back office and scale your project pipeline.' },
    { icon: 'plan', title: 'Developers & proptech', desc: 'Standardise interiors across projects, towers and handover packages.' },
    { icon: 'rupee', title: 'Channel & franchise partners', desc: 'Build a Planex practice in your city with our tools and support.' },
    { icon: 'wand', title: 'Technology & AI partners', desc: 'Integrate via API for catalogs, pricing, rendering or ERP.' }
  ];
  const DELIVERABLES = [
    { icon: 'plan', title: 'Drawing set', desc: 'A-01 Main, A-02 Furniture, A-03 Ceiling, A-04 Lighting — with dimensions and title block.' },
    { icon: 'ruler', title: 'Scope of work', desc: 'Room-by-room, package-by-package: 22 work packages, nothing missed.' },
    { icon: 'rupee', title: 'Firm BOQ', desc: 'Quantities with makes and rates, GST-ready and editable.' },
    { icon: 'docket', title: 'Design dockets', desc: '13 trade dockets: joinery, kitchen, ceiling, lighting, electrical, plumbing and more.' },
    { icon: 'send', title: 'Scope sheets', desc: 'Vendor-facing RFQ documents with inclusions, exclusions and measurement basis.' },
    { icon: 'build', title: 'Execution pack', desc: 'Programme, QC checkpoints, snag list and handover checklist.' }
  ];
  const GUARANTEES = [
    { title: 'Spec-locked quotes', desc: 'Vendors quote against the same written scope — no silent swaps.' },
    { title: 'Revision control', desc: 'Every issued scope sheet is frozen with its plan revision and drawings.' },
    { title: 'No hidden cost', desc: 'Makes, quantities and rates are explicit in the BOQ, down to GST.' },
    { title: 'Your data, your plan', desc: 'Your drawings and documents stay yours, exportable at any time.' }
  ];
  const FAQ = [
    { q: 'How is Planex different from an interior designer or a marketplace?', a: 'Planex is the planning layer underneath both. It gives you the drawings, scope, BOQ and vendor-ready documents — so you can build with your own team, or hand the pack to a professional.' },
    { q: 'Do I need to be technical to use it?', a: 'No. You upload a plan and answer a few questions. Planex AI explains each step in plain language and shows the cost and scope as they evolve.' },
    { q: 'Are the prices final?', a: 'The BOQ gives you firm, editable indicative rates for your city and quality band. Vendor quotes then land against a fixed scope sheet, so comparison is like-for-like.' },
    { q: 'Can I use Planex for my business?', a: 'Yes. Studio, Firm and Enterprise plans add team seats, procurement, branded outputs and API access for designers, contractors and developers.' },
    { q: 'What does a partner company get?', a: 'Partners are specced into designs, BOQs and scope sheets, or integrate with Planex. There is no self-serve plan — we design the partnership with you directly.' },
    { q: 'Does it work across India?', a: 'Yes. Scope, rates and makes are built for Indian homes and the Indian market, with GST-ready documents and city-wise rate bands.' }
  ];

  /* ---------------- Actions ---------------- */
  function enterApp(target) {
    store().setUI({ enteredApp: true });
    const seen = !!(store().state.ui && store().state.ui.seenHowItWorks);
    window.PlanexApp.navigate(target || (seen ? 'design' : 'how'));
  }
  function scrollTo(id) { const el = document.querySelector(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function choosePlan(plan) {
    if (seg === 'partner') { scrollTo('#partner'); return; }
    if (seg === 'b2c') {
      if (plan.servicePlan) store().setServicePlan(plan.servicePlan);
      store().addLead({ segment: 'b2c', plan: plan.id, planName: plan.name });
      window.PlanexUI.toast(plan.name + ' plan selected.');
      enterApp();
      return;
    }
    store().addLead({ segment: 'b2b', plan: plan.id, planName: plan.name });
    window.PlanexUI.toast(plan.name + ' selected — our team will help you get set up.');
    enterApp();
  }
  function submitPartner(container) {
    const val = function (id) { const el = container.querySelector(id); return el ? String(el.value || '').trim() : ''; };
    const lead = { segment: 'partner', company: val('#hp-company'), contactName: val('#hp-name'), email: val('#hp-email'), phone: val('#hp-phone'), city: val('#hp-city'), category: val('#hp-category'), volume: val('#hp-volume'), message: val('#hp-message') };
    if (!lead.company || !lead.contactName || !lead.email) { window.PlanexUI.toast('Please add company, name and email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) { window.PlanexUI.toast('Please enter a valid email.'); return; }
    const consent = container.querySelector('#hp-consent');
    if (consent && !consent.checked) { window.PlanexUI.toast('Please accept the contact consent.'); return; }
    const saved = store().addLead(lead);
    const box = container.querySelector('#hp-form-wrap');
    if (box) {
      box.innerHTML = `<div class="home-form-success"><div class="home-success-ico">${ic('check')}</div>
        <h3>Thank you — we have your details.</h3>
        <p class="muted">Our partnerships team will reach out to <strong>${esc(lead.email)}</strong> within one working day.</p>
        <p class="faint text-xs">Reference: ${esc(saved.id)}</p>
        <a class="btn btn-secondary" href="mailto:partners@planex.ai?subject=${encodeURIComponent('Partnership enquiry — ' + lead.company)}">Email us directly</a></div>`;
    }
    window.PlanexUI.toast('Enquiry received. We will be in touch.');
  }

  /* ---------------- Film ---------------- */
  function mountFilm(container) {
    const cv = container.querySelector('#home-film');
    if (!cv || !window.PlanexHomeFilm) return;
    filmCtl = window.PlanexHomeFilm.mount(cv, {
      onChapter: function (ch, i) {
        const cap = container.querySelector('#film-cap'); if (cap) cap.textContent = ch.cap;
        const lbl = container.querySelector('#film-label'); if (lbl) lbl.textContent = ch.label;
        container.querySelectorAll('[data-chapter]').forEach(function (b, j) { b.classList.toggle('active', j === i); });
      },
      onProgress: function (p) { const f = container.querySelector('#film-progress'); if (f) f.style.width = (p * 100) + '%'; }
    });
  }
  function unmountFilm() { if (filmCtl) { filmCtl.destroy(); filmCtl = null; } }

  /* ---------------- Walkthrough player ---------------- */
  function renderStage(container) {
    const stage = container.querySelector('#demo-stage');
    const cap = container.querySelector('#demo-caption');
    if (!stage) return;
    const step = DEMO[demoStep];
    const titleEl = container.querySelector('#demo-title');
    if (titleEl) titleEl.textContent = step.title;
    if (step.kind === 'canvas') {
      stage.innerHTML = `<div class="demo-canvas-wrap"><canvas id="demo-canvas"></canvas></div>`;
      const cv = stage.querySelector('#demo-canvas');
      if (cv) {
        if (step.mood) drawMoodboardInto(cv);
        else if (step.unit && window.PlanexDetailEngine) { try { window.PlanexDetailEngine.drawUnit(cv, SAMPLE_UNIT); } catch (e) { /* ignore */ } }
        else drawSheetInto(cv, step.sheet || 'main');
      }
    } else stage.innerHTML = step.html ? step.html() : '';
    if (cap) cap.innerHTML = `
      <div class="demo-cap-col"><span class="demo-cap-k">You</span><p>${esc(step.you)}</p></div>
      <div class="demo-cap-col"><span class="demo-cap-k accent">Planex AI</span><p>${esc(step.planex)}</p></div>
      <div class="demo-cap-col"><span class="demo-cap-k">You get</span><p>${esc(step.out)}</p></div>`;
    container.querySelectorAll('[data-demo-step]').forEach(function (b, i) { b.classList.toggle('active', i === demoStep); });
    const count = container.querySelector('#demo-count'); if (count) count.textContent = (demoStep + 1) + ' / ' + DEMO.length;
    const fill = container.querySelector('#demo-fill'); if (fill) fill.style.width = '0%';
  }
  function setStep(container, n) { demoStep = (n + DEMO.length) % DEMO.length; elapsed = 0; renderStage(container); }
  function startDemo(container) {
    stopDemo(); demoPlaying = true; updatePlayButton(container); elapsed = 0;
    demoTimer = setInterval(function () {
      if (!demoPlaying) return;
      if (!container.querySelector('#demo-stage')) { stopDemo(); return; }
      elapsed += 60;
      const fill = container.querySelector('#demo-fill');
      const pct = Math.min(1, elapsed / STEP_MS);
      if (fill) fill.style.width = (pct * 100) + '%';
      if (pct >= 1) { setStep(container, demoStep + 1); elapsed = 0; }
    }, 60);
  }
  function stopDemo() { if (demoTimer) { clearInterval(demoTimer); demoTimer = null; } demoPlaying = false; }
  function updatePlayButton(container) { const b = container.querySelector('#demo-play'); if (b) b.innerHTML = demoPlaying ? '❚❚ &nbsp;Pause' : '▶ &nbsp;Play'; }

  /* ---------------- Gallery ---------------- */
  function renderGallery(container) {
    const stage = container.querySelector('#gallery-stage');
    if (!stage) return;
    const tab = GALLERY.filter(function (g) { return g.id === galleryTab; })[0] || GALLERY[0];
    stage.innerHTML = `<div class="demo-canvas-wrap"><canvas id="gallery-canvas"></canvas></div>`;
    const cv = stage.querySelector('#gallery-canvas');
    if (!cv) return;
    if (tab.kind === 'mood') drawMoodboardInto(cv);
    else if (tab.kind === 'sheet') drawSheetInto(cv, tab.id);
    else if (tab.kind === 'unit' && window.PlanexDetailEngine) { try { window.PlanexDetailEngine.drawUnit(cv, SAMPLE_UNIT); } catch (e) { /* ignore */ } }
    else if (tab.kind === 'layout' && window.PlanexLayoutEngine) {
      try { const room = SAMPLE_ROOMS.filter(function (r) { return /kitchen|bath|living/i.test(r.name); })[0] || SAMPLE_ROOMS[0]; window.PlanexLayoutEngine.draw(cv, tab.id, room); } catch (e) { /* ignore */ }
    }
    container.querySelectorAll('[data-gallery]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-gallery') === tab.id); });
  }

  /* ---------------- Sections ---------------- */
  function header() {
    return `<header class="home-nav" id="home-top">
      <div class="home-nav-inner">
        <button class="home-brand" data-enter="1"><span class="brand-mark">${ic('home')}</span>
          <span class="brand-text"><span class="brand-name">Planex AI</span><span class="brand-tag">Plan &amp; Execute</span></span></button>
        <nav class="home-links">
          <button data-scroll="#story">The film</button>
          <button data-scroll="#demo">How it works</button>
          <button data-scroll="#gallery">Output</button>
          <button data-scroll="#plans">Pricing</button>
          <button data-seg="b2b">Business</button>
        </nav>
        <div class="home-nav-actions">
          <button class="icon-btn" id="home-theme" aria-label="Toggle theme">${ic('sparkles')}</button>
          <button class="btn btn-secondary btn-sm" data-enter="1">Open app</button>
          <button class="btn btn-primary btn-sm" data-enter="1">Start free</button>
        </div>
      </div></header>`;
  }

  function hero() {
    return `<section class="home-hero">
      <div class="home-hero-mesh"></div>
      <div class="home-hero-grid">
        <div class="home-hero-copy">
          <div class="home-eyebrow">${ic('sparkles')} AI interiors for the Indian market</div>
          <h1 class="home-h1">From an empty flat<br><span class="home-h1-accent">to a home you can build.</span></h1>
          <p class="home-hero-sub">A floor plan becomes a fully specified, priced, buildable interior — drawings, a GST-ready BOQ, trade dockets and vendor-ready scope sheets. Every quote lands on the same basis, and nothing is left to assumption.</p>
          <div class="home-cta-row">
            <button class="btn btn-lg btn-primary" data-enter="1">${ic('arrowRight')} Start your project — free</button>
            <button class="btn btn-lg btn-secondary" data-scroll="#story" data-film-play="1">▶&nbsp; Watch the film</button>
          </div>
          <div class="home-trustline">
            <span>${ic('check')} No card needed</span>
            <span>${ic('check')} Your plan stays yours</span>
            <span>${ic('check')} GST-ready BOQ</span>
          </div>
        </div>
        <div class="home-hero-art">
          <div class="film-card">
            ${realVideo() || `
              <div class="film-canvas-wrap"><canvas id="home-film"></canvas></div>
              <div class="film-chapter-row">
                <span class="film-chip-label">${ic('image')} Riya &amp; Arjun's 3BHK</span>
                <div class="film-chapters" id="film-chapters">
                  ${(window.PlanexHomeFilm ? window.PlanexHomeFilm.CHAPTERS : [{ label: 'The empty flat', at: 0 }, { label: 'Open Planex', at: 6500 }, { label: 'The look comes together', at: 13000 }, { label: 'Priced & buildable', at: 24000 }, { label: 'Home', at: 30000 }]).map(function (c, i) {
                    return `<button class="film-chapter ${i === 0 ? 'active' : ''}" data-chapter="${i}" data-at="${c.at}">${esc(c.label)}</button>`;
                  }).join('')}
                </div>
              </div>
              <div class="film-foot">
                <button class="btn btn-primary btn-sm" id="film-play">❚❚&nbsp; Pause</button>
                <span class="film-cap" id="film-cap">Riya and Arjun, in their bare-shell 3BHK.</span>
                <span class="film-label faint text-xs" id="film-label">The empty flat</span>
              </div>
              <div class="demo-progress film-progress"><div class="demo-progress-fill" id="film-progress"></div></div>
            `}
          </div>
          <p class="film-note">Illustrated screen story generated by Planex. Real customer footage plays here automatically once <code>PLANEX_CONFIG.demoVideo.url</code> is set.</p>
        </div>
      </div>
      <div class="home-strip">
        <span>${ic('check')} 20 years of interiors, encoded</span>
        <span>${ic('check')} 22 work packages</span>
        <span>${ic('check')} 13 trade dockets</span>
        <span>${ic('check')} A-01–A-04 drawings</span>
        <span>${ic('check')} Spec-locked RFQs</span>
        <span>${ic('check')} Revision control</span>
      </div>
    </section>`;
  }

  function storySection() {
    const cards = [
      { icon: 'home', k: 'Chapter 1', t: 'An empty flat', d: 'Riya and Arjun stand in a bare-shell 3BHK with nothing but a plan.' },
      { icon: 'plan', k: 'Chapter 2', t: 'They open Planex', d: 'They add the floor plan; Planex reads the rooms and they confirm the sizes.' },
      { icon: 'sparkles', k: 'Chapter 3', t: 'The look comes together', d: 'Room by room, the layout, palette and finish come to life.' },
      { icon: 'rupee', k: 'Chapter 4', t: 'Priced & buildable', d: 'Scope, BOQ, dockets and vendor-ready documents — priced to the rupee.' },
      { icon: 'check', k: 'Chapter 5', t: 'Home', d: 'A furnished home, built from one thread of decisions.' }
    ];
    return `<section class="home-section" id="story">
      <div class="home-seg-head" style="max-width:820px;">
        <div class="home-eyebrow">${ic('image')} The film</div>
        <h2 class="home-h2" style="margin-top:10px;">Their story, in five chapters.</h2>
        <p class="muted" style="margin-top:10px;">Watch the empty flat become a furnished home — then play the interactive walkthrough to see exactly how Planex does it.</p>
      </div>
      <div class="story-grid">
        ${cards.map(function (c) {
          return `<button class="story-card reveal" data-scroll="#demo">
            <span class="story-ico">${ic(c.icon)}</span>
            <span class="story-k">${esc(c.k)}</span>
            <strong>${esc(c.t)}</strong>
            <p class="muted text-sm">${esc(c.d)}</p>
            <span class="story-link">See how ${ic('arrowRight')}</span>
          </button>`;
        }).join('')}
      </div>
    </section>`;
  }

  function demoSection() {
    return `<section class="home-section" id="demo">
      <div class="home-seg-head" style="max-width:820px;">
        <div class="home-eyebrow">${ic('sparkles')} Interactive walkthrough</div>
        <h2 class="home-h2" style="margin-top:10px;">See Planex work, end to end.</h2>
        <p class="muted" style="margin-top:10px;">Eight steps from a floor plan to a snag-free handover. Press play — every frame is generated by Planex from one plan.</p>
      </div>
      <div class="demo-player reveal">
        <div class="demo-stage-head"><div class="demo-stage-title" id="demo-title"></div><div class="demo-stage-count" id="demo-count">1 / ${DEMO.length}</div></div>
        <div class="demo-stage" id="demo-stage"></div>
        <div class="demo-caption" id="demo-caption"></div>
        <div class="demo-controls">
          <div class="demo-btns">
            <button class="btn btn-secondary btn-sm" id="demo-prev" aria-label="Previous">←</button>
            <button class="btn btn-primary btn-sm" id="demo-play">❚❚ &nbsp;Pause</button>
            <button class="btn btn-secondary btn-sm" id="demo-next" aria-label="Next">→</button>
          </div>
          <div class="demo-progress"><div class="demo-progress-fill" id="demo-fill"></div></div>
        </div>
        <div class="demo-steps" id="demo-steps">
          ${DEMO.map(function (s, i) { return `<button class="demo-step" data-demo-step="${i}"><span class="demo-step-n">${i + 1}</span>${esc(s.label)}</button>`; }).join('')}
        </div>
      </div>
    </section>`;
  }

  function gallerySection() {
    return `<section class="home-section" id="gallery">
      <div class="home-seg-head" style="max-width:820px;">
        <div class="home-eyebrow">${ic('docket')} The output</div>
        <h2 class="home-h2" style="margin-top:10px;">Every document, from one plan.</h2>
        <p class="muted" style="margin-top:10px;">Tap through the drawings and schedules Planex produces — the same documents your contractor, vendors and site team use.</p>
      </div>
      <div class="gallery reveal">
        <div class="gallery-tabs">
          ${GALLERY.map(function (g) { return `<button class="gallery-tab ${g.id === galleryTab ? 'active' : ''}" data-gallery="${g.id}">${esc(g.label)}</button>`; }).join('')}
        </div>
        <div class="gallery-stage" id="gallery-stage"></div>
      </div>
    </section>`;
  }

  function segmentTabs() {
    return `<div class="home-segs">${SEGMENTS.map(function (s) {
      return `<button class="home-seg ${seg === s.id ? 'active' : ''}" data-seg="${s.id}"><span class="home-seg-ico">${ic(s.icon)}</span><span class="home-seg-label">${esc(s.label)}</span></button>`;
    }).join('')}</div>`;
  }
  function valueCards(list) {
    return `<div class="home-value-grid">${list.map(function (v) {
      return `<div class="home-value card reveal"><div class="home-value-ico">${ic(v.icon)}</div><h3>${esc(v.title)}</h3><p class="muted text-sm">${esc(v.desc)}</p></div>`;
    }).join('')}</div>`;
  }
  function planCards(list) {
    return `<div class="home-plans">${list.map(function (p) {
      return `<div class="home-plan ${p.popular ? 'popular' : ''} reveal">
        ${p.popular ? '<span class="home-plan-flag">Most popular</span>' : ''}
        <div class="home-plan-tag">${esc(p.tag)}</div><h3 class="home-plan-name">${esc(p.name)}</h3>
        <div class="home-plan-price">${esc(p.price)}<small>${esc(p.unit)}</small></div>
        <p class="muted text-sm">${esc(p.desc)}</p>
        <ul class="home-plan-feat">${p.features.map(function (f) { return `<li>${ic('check')} <span>${esc(f)}</span></li>`; }).join('')}</ul>
        <button class="btn ${p.popular ? 'btn-primary' : 'btn-secondary'} btn-block" data-plan="${p.id}">${esc(p.cta)}</button></div>`;
    }).join('')}</div>
    <p class="home-price-note">Indicative pricing for the Indian market · GST extra · Final scope and price are confirmed after your plan review.</p>`;
  }
  function partnerForm() {
    return `<div class="home-partner" id="partner">
      <div class="home-partner-copy">
        <div class="home-eyebrow">${ic('sparkles')} Partner programme</div>
        <h2 class="home-h2">Connect with us directly.</h2>
        <p class="muted">Partners don't pick a plan — we design the partnership together. Tell us who you are and we'll set up a working session.</p>
        <div class="home-partner-grid">
          ${PARTNER_TYPES.map(function (p) { return `<div class="home-partner-item"><span class="home-value-ico">${ic(p.icon)}</span><div><strong>${esc(p.title)}</strong><p class="muted text-xs">${esc(p.desc)}</p></div></div>`; }).join('')}
        </div>
      </div>
      <div class="home-form card card-pad-lg" id="hp-form-wrap">
        <h3 style="margin-bottom:4px;">Partner enquiry</h3>
        <p class="muted text-sm" style="margin-bottom:14px;">We reply within one working day.</p>
        <div class="field-row"><div class="field"><label>Company *</label><input class="input" id="hp-company" placeholder="Company / studio name"></div><div class="field"><label>Contact name *</label><input class="input" id="hp-name" placeholder="Full name"></div></div>
        <div class="field-row" style="margin-top:12px;"><div class="field"><label>Work email *</label><input class="input" id="hp-email" placeholder="name@company.com"></div><div class="field"><label>Phone</label><input class="input" id="hp-phone" placeholder="+91"></div></div>
        <div class="field-row" style="margin-top:12px;"><div class="field"><label>City</label><input class="input" id="hp-city" placeholder="City"></div><div class="field"><label>Partner category</label><select class="select" id="hp-category"><option value="">Select</option>${PARTNER_TYPES.map(function (p) { return '<option value="' + esc(p.title) + '">' + esc(p.title) + '</option>'; }).join('')}</select></div></div>
        <div class="field" style="margin-top:12px;"><label>Monthly project volume</label><select class="select" id="hp-volume"><option value="">Select</option><option>1–5 projects</option><option>6–20 projects</option><option>21–50 projects</option><option>50+ projects</option></select></div>
        <div class="field" style="margin-top:12px;"><label>What would you like to build with Planex?</label><textarea class="textarea" id="hp-message" rows="3" placeholder="Tell us briefly…"></textarea></div>
        <label class="home-consent"><input type="checkbox" id="hp-consent"> I agree to be contacted about a Planex partnership.</label>
        <button class="btn btn-primary btn-block" id="hp-submit" style="margin-top:12px;">${ic('send')} Send enquiry</button>
      </div></div>`;
  }
  function segmentSection() {
    if (seg === 'partner') {
      return `<section class="home-section" id="segment">${segmentTabs()}
        <div class="home-seg-head"><h2 class="home-h2">Build the category with us.</h2><p class="muted">Planex sits at the moment of design — where materials, vendors and technology get decided.</p></div>
        ${partnerForm()}</section>`;
    }
    const isB2B = seg === 'b2b';
    return `<section class="home-section" id="segment">
      ${segmentTabs()}
      <div class="home-seg-head"><h2 class="home-h2">${isB2B ? 'Quote faster. Deliver predictably. Protect margin.' : 'Your home, planned end to end.'}</h2>
      <p class="muted">${isB2B ? 'Planex gives your team one thread from the first plan to the final handover — so every project is priced and delivered on the same basis.' : 'From a single floor plan to a priced, buildable interior — with the drawings, specifications and documents your contractor actually needs.'}</p></div>
      ${valueCards(isB2B ? B2B_VALUE : B2C_VALUE)}
      <div class="home-plans-head" id="plans"><h2 class="home-h2">${isB2B ? 'Business plans' : 'Homeowner plans'}</h2><p class="muted">${isB2B ? 'Per-year plans that scale with your practice.' : 'Transparent, project-based pricing. Change anytime.'}</p></div>
      ${planCards(isB2B ? B2B_PLANS : B2C_PLANS)}
    </section>`;
  }
  function deliverables() {
    return `<section class="home-section" id="deliverables">
      <div class="home-seg-head"><h2 class="home-h2">What you get on every project.</h2><p class="muted">The same documents a professional practice issues — generated from your plan.</p></div>
      <div class="home-deliver-grid">
        ${DELIVERABLES.map(function (d) { return `<div class="home-deliver card reveal"><div class="home-value-ico">${ic(d.icon)}</div><div><strong>${esc(d.title)}</strong><p class="muted text-xs">${esc(d.desc)}</p></div></div>`; }).join('')}
      </div></section>`;
  }
  function trust() {
    return `<section class="home-section" id="trust">
      <div class="home-seg-head"><h2 class="home-h2">Confidence, built in.</h2><p class="muted">Why professionals and homeowners trust the Planex pack.</p></div>
      <div class="home-value-grid">${GUARANTEES.map(function (g) { return `<div class="home-value card reveal"><div class="home-value-ico">${ic('check')}</div><h3>${esc(g.title)}</h3><p class="muted text-sm">${esc(g.desc)}</p></div>`; }).join('')}</div></section>`;
  }
  function faq() {
    return `<section class="home-section" id="faq">
      <div class="home-seg-head"><h2 class="home-h2">Questions, answered.</h2></div>
      <div class="home-faq">${FAQ.map(function (f) { return `<details class="home-faq-item reveal"><summary>${esc(f.q)}</summary><p class="muted text-sm">${esc(f.a)}</p></details>`; }).join('')}</div>
    </section>`;
  }
  function ctaBand() {
    return `<section class="home-cta-band">
      <div><h2 class="home-h2" style="color:inherit;">Start with your floor plan.</h2><p style="opacity:.85;margin-top:6px;">Free to begin. See your rooms, scope and cost take shape in minutes.</p></div>
      <div class="home-cta-band-actions">
        <button class="btn btn-lg" data-enter="1" style="background:#fff;color:#18181b;">${ic('arrowRight')} Start free</button>
        <button class="btn btn-lg btn-secondary" data-seg="partner" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4);">Partner with us</button>
      </div></section>`;
  }
  function footer() {
    return `<footer class="home-footer">
      <div class="home-footer-brand"><span class="brand-mark">${ic('home')}</span><div><strong>Planex AI</strong><p class="faint text-xs">Plan &amp; Execute · Interiors for India</p></div></div>
      <div class="home-footer-cols">
        <div><strong>Product</strong><button data-scroll="#story">The film</button><button data-scroll="#demo">How it works</button><button data-scroll="#gallery">Output</button><button data-scroll="#plans">Pricing</button></div>
        <div><strong>Partners</strong><button data-seg="partner">Partner programme</button><a href="mailto:partners@planex.ai">partners@planex.ai</a></div>
        <div><strong>Company</strong><a href="#home-top" data-scroll="#home-top">Back to top</a><button data-nav="execution">Execution</button></div>
      </div>
      <div class="home-footer-base"><span>© ${new Date().getFullYear()} Planex AI. All rights reserved.</span><span>Made for the Indian interior market.</span></div>
    </footer>`;
  }

  /* ---------------- Reveal on scroll ---------------- */
  function setupReveal(container) {
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
    const items = container.querySelectorAll('.reveal');
    if (!window.IntersectionObserver) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------- Render ---------------- */
  function render(container) {
    stopDemo();
    unmountFilm();
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
    elapsed = 0;

    container.innerHTML = `
      <div class="home">
        ${header()}
        ${hero()}
        ${storySection()}
        ${demoSection()}
        ${gallerySection()}
        ${segmentSection()}
        ${deliverables()}
        ${trust()}
        ${faq()}
        ${ctaBand()}
        ${footer()}
      </div>`;
    bind(container);
    mountFilm(container);
    renderStage(container);
    renderGallery(container);
    startDemo(container);
    setupReveal(container);
  }

  function bind(container) {
    container.querySelectorAll('[data-enter]').forEach(function (b) { b.addEventListener('click', function () { enterApp(); }); });
    container.querySelectorAll('[data-scroll]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('data-film-play') && filmCtl) filmCtl.play();
        scrollTo(b.getAttribute('data-scroll'));
      });
    });
    container.querySelectorAll('[data-seg]').forEach(function (b) { b.addEventListener('click', function () { seg = b.getAttribute('data-seg'); window.PlanexApp.renderView(); scrollTo('#segment'); }); });
    container.querySelectorAll('[data-plan]').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-plan');
        const list = seg === 'b2b' ? B2B_PLANS : B2C_PLANS;
        const plan = list.filter(function (p) { return p.id === id; })[0];
        if (plan) choosePlan(plan);
      });
    });
    const theme = container.querySelector('#home-theme');
    if (theme) theme.addEventListener('click', function () {
      const next = (store().state.uiTheme === 'dark') ? 'light' : 'dark';
      store().setUITheme(next);
      document.documentElement.setAttribute('data-theme', next);
      window.PlanexApp.renderView();
    });
    const submit = container.querySelector('#hp-submit');
    if (submit) submit.addEventListener('click', function () { submitPartner(container); });

    // film controls
    const fplay = container.querySelector('#film-play');
    if (fplay) fplay.addEventListener('click', function () {
      if (!filmCtl) return;
      if (filmCtl.isPaused()) { filmCtl.play(); fplay.innerHTML = '❚❚&nbsp; Pause'; }
      else { filmCtl.pause(); fplay.innerHTML = '▶&nbsp; Play'; }
    });
    container.querySelectorAll('[data-chapter]').forEach(function (b) {
      b.addEventListener('click', function () { if (filmCtl) filmCtl.seek(Number(b.getAttribute('data-at'))); });
    });
    const embed = container.querySelector('#video-embed-play');
    if (embed) embed.addEventListener('click', function () {
      const wrap = embed.closest('.hero-video-embed');
      const src = wrap ? wrap.getAttribute('data-embed') : '';
      if (wrap && src) wrap.innerHTML = '<iframe class="hero-video-frame" src="' + esc(src) + '?autoplay=1" title="Planex customer film" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    });

    // walkthrough controls
    const prev = container.querySelector('#demo-prev');
    if (prev) prev.addEventListener('click', function () { setStep(container, demoStep - 1); if (demoPlaying) startDemo(container); });
    const next = container.querySelector('#demo-next');
    if (next) next.addEventListener('click', function () { setStep(container, demoStep + 1); if (demoPlaying) startDemo(container); });
    const play = container.querySelector('#demo-play');
    if (play) play.addEventListener('click', function () { if (demoPlaying) { stopDemo(); updatePlayButton(container); } else startDemo(container); });
    container.querySelectorAll('[data-demo-step]').forEach(function (b) { b.addEventListener('click', function () { setStep(container, Number(b.getAttribute('data-demo-step'))); if (demoPlaying) startDemo(container); }); });
    container.querySelectorAll('[data-gallery]').forEach(function (b) { b.addEventListener('click', function () { galleryTab = b.getAttribute('data-gallery'); renderGallery(container); }); });

    if (!resizeBound) { window.addEventListener('resize', onResize); resizeBound = true; }
  }
  let resizeBound = false;
  function onResize() {
    if (filmCtl) filmCtl.resize();
    const c = document.getElementById('app-view');
    if (c && c.querySelector('#gallery-stage')) renderGallery(c);
    if (c && c.querySelector('#demo-stage')) renderStage(c);
  }

  return { render: render };
})();
