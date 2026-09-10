/* ============================================================
   Planex AI — State Store
   Reactive state with localStorage persistence and calculators.
   ============================================================ */
window.PlanexStore = (function () {
  const STORAGE_KEY = 'PLANEX_AI_STATE_V1';

  const CURRENCIES = {
    INR: { symbol: '₹', rate: 1, locale: 'en-IN' },
    USD: { symbol: '$', rate: 1 / 83, locale: 'en-US' },
    EUR: { symbol: '€', rate: 1 / 90, locale: 'de-DE' },
    AED: { symbol: 'د.إ', rate: 1 / 22.6, locale: 'en-AE' }
  };

  const GST_RATE = 0.18;

  let listeners = [];
  let state = buildInitial();

  function buildInitial() {
    const D = window.PlanexData;
    const initial = {
      theme: 'light',
      currency: 'INR',
      activeView: 'dashboard',
      project: JSON.parse(JSON.stringify(D.project)),
      rooms: JSON.parse(JSON.stringify(D.rooms)),
      boq: JSON.parse(JSON.stringify(D.boq)),
      vendors: JSON.parse(JSON.stringify(D.vendors)),
      selectedVendorId: null,
      timeline: JSON.parse(JSON.stringify(D.timeline)),
      qc: JSON.parse(JSON.stringify(D.qc)),
      chat: JSON.parse(JSON.stringify(D.chatSeed)),
      uploads: [],
      activeRoomId: D.rooms[0].id,
      contextVersion: 1,
      context: {
        project: { type: D.project.type, spaceType: D.project.spaceType, location: D.project.location },
        spaces: D.rooms.map(function (r) {
          return { id: r.id, name: r.name, lengthM: r.length, widthM: r.width, source: 'user', confidence: 1 };
        }),
        style: { directions: ['Warm Minimal', 'Japandi'], palette: [], avoids: [] },
        budget: { target: D.project.budget, currency: 'INR', flexibility: 'some' },
        family: { members: 4, children: 2, pets: 1 },
        priorities: ['storage', 'low-maintenance'],
        constraints: { keepFurniture: [], timeline: D.project.handoverDate, vastu: false },
        preferences: { materials: [], exclusions: [] },
        painPoints: ['poor kitchen light', 'storage shortage'],
        openQuestions: [],
        decisions: [],
        notes: 'Prefers low-maintenance finishes. Wants more storage.'
      },
      contextVersions: [],
      audit: [],
      renders: [],
      scopeDoc: null,
      scopeQuality: 'standard',
      floorplan: null,
      roomImages: {},
      docketSet: null,
      scopeConfirmed: false
    };
    initial.project.projectType = 'ready';
    initial.contextVersions.push({
      version: 1,
      source: 'seed',
      at: new Date().toISOString(),
      context: JSON.parse(JSON.stringify(initial.context))
    });
    return initial;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.project && parsed.boq) {
          state = parsed;
          if (!Array.isArray(state.contextVersions)) state.contextVersions = [];
          if (!Array.isArray(state.audit)) state.audit = [];
          if (!Array.isArray(state.renders)) state.renders = [];
          if (state.scopeDoc === undefined) state.scopeDoc = null;
          if (state.floorplan === undefined) state.floorplan = null;
          if (!state.roomImages || typeof state.roomImages !== 'object') state.roomImages = {};
          if (state.docketSet === undefined) state.docketSet = null;
          if (typeof state.scopeConfirmed !== 'boolean') state.scopeConfirmed = false;
          if (!state.scopeQuality) state.scopeQuality = 'standard';
          if (state.project && !state.project.projectType) state.project.projectType = 'ready';
          if (!state.context || !state.context.project) state.context = buildInitial().context;
          if (!state.contextVersion) state.contextVersion = 1;
          return;
        }
      }
    } catch (e) {
      console.warn('Planex: could not restore state', e);
    }
    state = buildInitial();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage may be full (large image data URLs) — retry without binary payloads
      try {
        const stripped = JSON.parse(JSON.stringify(state));
        stripped.uploads = [];
        stripped.renders = [];
        stripped.roomImages = {};
        stripped.chat = stripped.chat.map(function (m) {
          return Object.assign({}, m, { attachments: [] });
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
      } catch (e2) { /* ignore */ }
    }
  }

  function subscribe(fn) { listeners.push(fn); return () => { listeners = listeners.filter(l => l !== fn); }; }
  function notify() { listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } }); }
  function commit() { persist(); notify(); }

  /* ---------- Currency ---------- */
  function setCurrency(code) {
    if (CURRENCIES[code]) { state.currency = code; state.project.currency = code; commit(); }
  }

  function formatMoney(amountINR, opts) {
    const c = CURRENCIES[state.currency] || CURRENCIES.INR;
    const converted = (amountINR || 0) * c.rate;
    const showDecimals = opts && opts.decimals;
    return c.symbol + converted.toLocaleString(c.locale, {
      maximumFractionDigits: showDecimals ? 2 : 0,
      minimumFractionDigits: 0
    });
  }

  function formatCompact(amountINR) {
    const c = CURRENCIES[state.currency] || CURRENCIES.INR;
    const v = (amountINR || 0) * c.rate;
    if (state.currency === 'INR') {
      if (v >= 10000000) return c.symbol + (v / 10000000).toFixed(2) + ' Cr';
      if (v >= 100000) return c.symbol + (v / 100000).toFixed(2) + ' L';
      if (v >= 1000) return c.symbol + (v / 1000).toFixed(1) + 'K';
    } else {
      if (v >= 1000000) return c.symbol + (v / 1000000).toFixed(2) + 'M';
      if (v >= 1000) return c.symbol + (v / 1000).toFixed(1) + 'K';
    }
    return c.symbol + Math.round(v).toLocaleString(c.locale);
  }

  /* ---------- Calculations ---------- */
  function boqSubtotal() {
    return state.boq.reduce((sum, r) => sum + (r.qty * r.rate), 0);
  }

  function boqLinesWithAmount() {
    return state.boq.map(r => Object.assign({}, r, { amount: r.qty * r.rate }));
  }

  function quoteFor(vendor) {
    const lines = boqLinesWithAmount().map(l => Object.assign({}, l, {
      rate: Math.round(l.rate * vendor.multiplier)
    }));
    const subtotal = lines.reduce((s, l) => s + (l.qty * l.rate), 0);
    const gst = Math.round(subtotal * GST_RATE);
    return { vendor, lines, subtotal, gst, total: subtotal + gst };
  }

  function allQuotes() { return state.vendors.map(quoteFor); }

  function selectedQuote() {
    const v = state.vendors.find(x => x.id === state.selectedVendorId);
    return v ? quoteFor(v) : null;
  }

  function getFinancials() {
    const subtotal = boqSubtotal();
    const gst = Math.round(subtotal * GST_RATE);
    const total = subtotal + gst;
    const budget = state.project.budget;
    return {
      subtotal, gst, total, budget,
      variance: budget - total,
      withinBudget: total <= budget,
      utilization: Math.min(999, Math.round((total / budget) * 100))
    };
  }

  /* ---------- Mutations ---------- */
  function setView(view) { state.activeView = view; commit(); }

  function setTheme(theme) { state.theme = theme; commit(); }

  function setActiveRoom(id) { state.activeRoomId = id; commit(); }

  function updateBOQItem(id, changes) {
    const item = state.boq.find(b => b.id === id);
    if (item) { Object.assign(item, changes); commit(); }
  }

  function selectVendor(id) {
    state.selectedVendorId = (state.selectedVendorId === id) ? null : id;
    if (state.selectedVendorId) {
      state.project.stage = 'quotation';
    }
    commit();
  }

  function toggleMilestone(phaseId, index) {
    const phase = state.timeline.find(p => p.id === phaseId);
    if (phase && phase.milestones[index]) {
      phase.milestones[index].done = !phase.milestones[index].done;
      const done = phase.milestones.filter(m => m.done).length;
      phase.progress = Math.round((done / phase.milestones.length) * 100);
      phase.status = phase.progress === 100 ? 'done' : phase.progress > 0 ? 'active' : 'upcoming';
      recomputeProjectStage();
      commit();
    }
  }

  function setQcStatus(id, status) {
    const item = state.qc.find(q => q.id === id);
    if (item) { item.status = status; commit(); }
  }

  function addChatMessage(role, text, attachments, extra) {
    state.chat.push(Object.assign({
      role,
      text,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments || []
    }, extra || {}));
    commit();
  }

  function addUpload(file) {
    state.uploads.push(file);
    if (file.kind === 'plan') {
      setFloorplanInternal(file);
      state.context.notes += ' Site plan uploaded.';
    }
    commit();
  }

  function setFloorplanInternal(file) {
    state.floorplan = {
      id: file.id || ('fp-' + Date.now()),
      name: file.name || 'floor-plan',
      mime: (String(file.dataUrl || '').match(/^data:([^;]+)/) || [])[1] || 'image/jpeg',
      dataUrl: file.dataUrl,
      size: file.size || 0,
      uploadedAt: new Date().toISOString(),
      validated: false,
      validatedAt: null,
      validation: null
    };
  }

  // The floor plan is a shared project asset (Scope + Design Docket).
  function setFloorplan(file) {
    if (!file || !file.dataUrl) return null;
    setFloorplanInternal(file);
    commit();
    return state.floorplan;
  }

  function clearFloorplan() {
    state.floorplan = null;
    commit();
  }

  function validateFloorplan(validation) {
    if (!state.floorplan) return false;
    state.floorplan.validated = true;
    state.floorplan.validatedAt = new Date().toISOString();
    state.floorplan.validation = validation || { checks: [], warnings: [] };
    pushAudit('plan.validate', { warnings: ((validation && validation.warnings) || []).length });
    commit();
    return true;
  }

  function unvalidateFloorplan() {
    if (state.floorplan && state.floorplan.validated) {
      state.floorplan.validated = false;
      state.floorplan.validatedAt = null;
      commit();
    }
  }

  /* ---------- Room images ---------- */
  function addRoomImage(roomId, file) {
    if (!roomId || !file || !file.dataUrl) return null;
    if (!state.roomImages[roomId]) state.roomImages[roomId] = [];
    const entry = {
      id: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      name: file.name || 'room.jpg',
      mime: (String(file.dataUrl).match(/^data:([^;]+)/) || [])[1] || 'image/jpeg',
      dataUrl: file.dataUrl,
      size: file.size || 0,
      addedAt: new Date().toISOString()
    };
    state.roomImages[roomId].push(entry);
    if (state.roomImages[roomId].length > 12) state.roomImages[roomId].shift();
    commit();
    return entry;
  }

  function removeRoomImage(roomId, id) {
    if (!state.roomImages[roomId]) return;
    state.roomImages[roomId] = state.roomImages[roomId].filter(function (i) { return i.id !== id; });
    commit();
  }

  // Which room is the user talking about, based on their message.
  function focusRoomFor(text) {
    const t = String(text || '').toLowerCase();
    if (!t) return null;
    const names = state.rooms.map(function (r) { return r.name; });
    for (let i = 0; i < names.length; i++) {
      if (t.indexOf(names[i].toLowerCase()) >= 0) return names[i];
    }
    const generic = [
      ['living', 'living'], ['dining', 'dining'], ['kitchen', 'kitchen'],
      ['master bed', 'master bed'], ['bedroom', 'bedroom'], ['kids', 'kids'],
      ['bath', 'bath'], ['study', 'study'], ['balcony', 'balcony'], ['foyer', 'foyer']
    ];
    for (let j = 0; j < generic.length; j++) {
      if (t.indexOf(generic[j][0]) >= 0) {
        const found = names.filter(function (n) { return n.toLowerCase().indexOf(generic[j][0]) >= 0; })[0];
        if (found) return found;
      }
    }
    return null;
  }

  function roomImagesFor(text) {
    const room = focusRoomFor(text);
    if (!room) return { room: null, images: [] };
    const byName = state.rooms.filter(function (r) { return r.name.toLowerCase() === room.toLowerCase(); })[0];
    const key = byName ? byName.id : null;
    let images = (key && state.roomImages[key]) ? state.roomImages[key] : [];
    if (!images.length) {
      const match = Object.keys(state.roomImages).filter(function (k) {
        return k.toLowerCase().indexOf(room.toLowerCase()) >= 0;
      })[0];
      if (match) images = state.roomImages[match];
    }
    return { room: room, images: images.slice(-2) };
  }

  function removeUpload(id) {
    state.uploads = state.uploads.filter(u => u.id !== id);
    commit();
  }

  function updateContext(patch) {
    state.context = window.PlanexContext.mergePatch(state.context, patch || {});
    state.contextVersion = state.contextVersion + 1;
    snapshotContext('user');
    commit();
  }

  /* ---------- Evolving context: versioning, adopt, patch, revert ---------- */
  function snapshotContext(source) {
    const version = state.contextVersion;
    state.contextVersions = state.contextVersions.filter(function (v) { return v.version !== version; });
    state.contextVersions.unshift({
      version: version,
      source: source || 'ai',
      at: new Date().toISOString(),
      context: JSON.parse(JSON.stringify(state.context))
    });
    if (state.contextVersions.length > 30) state.contextVersions.length = 30;
  }

  function adoptServerContext(context, version) {
    if (!context || typeof context !== 'object') return;
    state.context = context;
    state.contextVersion = version || state.contextVersion || 1;
    snapshotContext('server');
    commit();
  }

  function applyContextPatch(patch, version) {
    if (!patch || typeof patch !== 'object') return;
    state.context = window.PlanexContext.mergePatch(state.context, patch);
    state.contextVersion = version || (state.contextVersion + 1);
    snapshotContext('ai');
    commit();
  }

  function revertContext(version) {
    const snap = state.contextVersions.find(function (v) { return v.version === version; });
    if (!snap) return false;
    state.context = JSON.parse(JSON.stringify(snap.context));
    state.contextVersion = version;
    pushAudit('context.revert', { version: version });
    commit();
    return true;
  }

  function pushAudit(kind, detail) {
    state.audit.unshift({ kind: kind, detail: detail || {}, at: new Date().toISOString() });
    if (state.audit.length > 100) state.audit.length = 100;
  }

  function addRender(render) {
    if (!render || !render.dataUrl) return null;
    const entry = {
      id: 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      dataUrl: render.dataUrl,
      prompt: render.prompt || '',
      at: new Date().toISOString()
    };
    state.renders.unshift(entry);
    if (state.renders.length > 24) state.renders.length = 24;
    commit();
    return entry;
  }

  /* ---------- Scope ---------- */
  function setProjectType(pt) {
    if (!state.project) state.project = {};
    state.project.projectType = pt;
    commit();
  }

  function setScopeQuality(q) { state.scopeQuality = q; commit(); }

  function setScopeDoc(doc) { state.scopeDoc = doc || null; commit(); }

  function regenerateScope() {
    if (!window.PlanexScopeEngine) return null;
    state.scopeDoc = window.PlanexScopeEngine.generateScopeDoc({
      projectType: (state.project && state.project.projectType) || 'ready',
      quality: state.scopeQuality || 'standard',
      rooms: state.rooms,
      budget: state.project && state.project.budget
    });
    pushAudit('scope.generate', {
      projectType: state.scopeDoc.projectType,
      packages: state.scopeDoc.packages.length
    });
    commit();
    return state.scopeDoc;
  }

  function recomputeScope() {
    if (state.scopeDoc && window.PlanexScopeEngine) {
      window.PlanexScopeEngine.recompute(state.scopeDoc);
      commit();
    }
  }

  // Push scope activities into the BOQ (rates carried over, still editable).
  function addScopeToBOQ(packageId) {
    const doc = state.scopeDoc;
    if (!doc || !Array.isArray(doc.packages)) return 0;
    let added = 0;
    doc.packages.forEach(function (pkg) {
      if (packageId && pkg.id !== packageId) return;
      pkg.activities.forEach(function (act) {
        if (act.included === false) return;
        state.boq.push({
          id: 'b-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
          room: act.room || '',
          category: pkg.name,
          item: act.name + (act.detail ? ' — ' + act.detail : ''),
          qty: Number(act.qty) || 0,
          unit: act.unit || 'nos',
          rate: Number(act.rate) || 0
        });
        added++;
      });
    });
    pushAudit('scope.to_boq', { package: packageId || 'all', items: added });
    commit();
    return added;
  }

  /* ---------- Design dockets ---------- */
  function setDocketSet(set) { state.docketSet = set || null; commit(); }

  function updateDocketCell(docketId, sectionKey, rowIndex, colIndex, value) {
    const set = state.docketSet;
    if (!set) return;
    const d = set.dockets.filter(function (x) { return x.id === docketId; })[0];
    if (!d) return;
    const s = d.sections.filter(function (x) { return x.key === sectionKey; })[0];
    if (!s || !s.rows[rowIndex]) return;
    s.rows[rowIndex][colIndex] = value;
    s.rows[rowIndex].edited = true;
    commit();
  }

  // Apply AI enrichment: { model, notes, sections: { [sectionKey]: { [columnTitle]: value | [values] } } }
  function mergeDocketEnrichment(docketId, enrichment) {
    const set = state.docketSet;
    if (!set || !enrichment) return false;
    const d = set.dockets.filter(function (x) { return x.id === docketId; })[0];
    if (!d) return false;

    if (enrichment.sections) {
      d.sections.forEach(function (s) {
        const up = enrichment.sections[s.key];
        if (!up) return;
        Object.keys(up).forEach(function (colTitle) {
          const idx = s.columns.indexOf(colTitle);
          if (idx < 0) return;
          const val = up[colTitle];
          if (Array.isArray(val)) {
            val.forEach(function (v, i) {
              if (s.rows[i] && !s.rows[i].edited) s.rows[i][idx] = v;
            });
          } else if (typeof val === 'string') {
            s.rows.forEach(function (r) {
              if (!r.colEdited || !r.colEdited[idx]) r[idx] = val;
            });
          }
        });
      });
    }
    d.ai = { enrichedAt: new Date().toISOString(), model: enrichment.model || 'gemini', notes: enrichment.notes || '' };
    pushAudit('docket.enrich', { docket: docketId });
    commit();
    return true;
  }

  /* ---------- Status & journey ---------- */
  function confirmScope() {
    if (!state.scopeDoc) return false;
    state.scopeConfirmed = true;
    pushAudit('scope.confirm', { packages: state.scopeDoc.packages.length });
    commit();
    return true;
  }

  function statusOf(artifact) {
    if (artifact === 'plan') {
      const fp = state.floorplan;
      return fp ? (fp.validated ? 'validated' : 'draft') : 'draft';
    }
    if (artifact === 'scope') {
      return state.scopeDoc ? (state.scopeConfirmed ? 'validated' : 'indicative') : 'draft';
    }
    if (artifact === 'costing') {
      return (state.boq && state.boq.length) ? 'firm' : 'draft';
    }
    if (artifact === 'dockets') {
      const set = state.docketSet;
      if (!set) return 'draft';
      return set.dockets.some(function (d) { return d.ai; }) ? 'enriched' : 'built';
    }
    return 'draft';
  }

  function nextAction() {
    const fp = state.floorplan;
    if (!fp) return { label: 'Upload floor plan', view: 'project' };
    if (!fp.validated) return { label: 'Validate floor plan', view: 'project' };
    if (!state.scopeDoc) return { label: 'Build the scope', view: 'scope' };
    if (!state.scopeConfirmed) return { label: 'Confirm the scope', view: 'scope' };
    if (!state.boq || !state.boq.length) return { label: 'Price the scope', view: 'costing' };
    if (!state.docketSet) return { label: 'Generate dockets', view: 'docket' };
    if (!state.selectedVendorId) return { label: 'Send RFQ to vendors', view: 'quotation' };
    return { label: 'Track execution', view: 'execution' };
  }

  /* Apply a proposal the user explicitly confirmed. */
  function applyProposal(proposal) {
    if (!proposal || !proposal.type) return false;
    const p = proposal.payload || {};
    if (proposal.type === 'boq.add') {
      if (!p.item) return false;
      state.boq.push({
        id: 'b-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        room: p.room || state.activeRoomId,
        category: p.category || 'Furniture',
        item: p.item,
        qty: Number(p.qty) || 0,
        unit: p.unit || 'nos',
        rate: Number(p.rate) || 0
      });
    } else if (proposal.type === 'room.upsert') {
      const existing = state.rooms.find(function (r) {
        return (p.id && r.id === p.id) || r.name.toLowerCase() === String(p.name || '').toLowerCase();
      });
      if (existing) {
        existing.name = p.name || existing.name;
        existing.length = Number(p.lengthM) || existing.length;
        existing.width = Number(p.widthM) || existing.width;
        existing.area = (existing.length * existing.width).toFixed(1) + ' m²';
      } else {
        state.rooms.push({
          id: p.id || ('room-' + Date.now()),
          name: p.name,
          length: Number(p.lengthM) || 0,
          width: Number(p.widthM) || 0,
          area: ((Number(p.lengthM) || 0) * (Number(p.widthM) || 0)).toFixed(1) + ' m²',
          color: '#9db8c9',
          type: 'private'
        });
      }
    } else if (proposal.type === 'style.apply') {
      state.context.style = window.PlanexContext.mergePatch(state.context.style || {}, {
        directions: p.directions || [],
        palette: p.palette || []
      });
    } else {
      return false;
    }
    pushAudit('proposal.apply', { type: proposal.type, id: proposal.id });
    commit();
    return true;
  }

  /* Grounding snapshot sent with each chat turn (client owns the BOQ/rooms). */
  function getGroundingState() {
    const fp = state.floorplan;
    const doc = state.scopeDoc;
    return {
      budget: state.project.budget,
      currency: state.currency,
      financials: getFinancials(),
      brief: state.context,
      plan: fp ? {
        validated: !!fp.validated,
        name: fp.name,
        rooms: state.rooms.map(function (r) {
          return {
            id: r.id,
            name: r.name,
            lengthM: r.length,
            widthM: r.width,
            areaSqft: Math.round((Number(r.length) || 0) * (Number(r.width) || 0) * 10.7639),
            confidence: r.confidence || null,
            source: r.source || 'user'
          };
        }),
        totalSqft: Math.round(state.rooms.reduce(function (s, r) {
          return s + (Number(r.length) || 0) * (Number(r.width) || 0) * 10.7639;
        }, 0)),
        warnings: (fp.validation && fp.validation.warnings) || []
      } : null,
      scope: doc ? {
        projectType: doc.projectType,
        quality: doc.quality,
        summary: doc.summary,
        packages: doc.packages.map(function (p) {
          return { name: p.name, subtotal: p.subtotal, sharePct: p.sharePct };
        })
      } : null,
      rooms: state.rooms.map(function (r) { return { id: r.id, name: r.name, lengthM: r.length, widthM: r.width }; }),
      boqLines: state.boq.slice(0, 60).map(function (b) {
        return { room: b.room, category: b.category, item: b.item, qty: b.qty, unit: b.unit, rate: b.rate };
      })
    };
  }

  function recomputeProjectStage() {
    const anyActive = state.timeline.some(p => p.status === 'active');
    const allDone = state.timeline.every(p => p.status === 'done');
    const anyWork = state.timeline.some(p => p.progress > 0);
    if (allDone) state.project.stage = 'execution';
    else if (anyWork || anyActive) state.project.stage = 'execution';
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    state = buildInitial();
    commit();
  }

  load();

  return {
    get state() { return state; },
    CURRENCIES, GST_RATE,
    subscribe, commit,
    setCurrency, formatMoney, formatCompact,
    boqSubtotal, boqLinesWithAmount, quoteFor, allQuotes, selectedQuote, getFinancials,
    setView, setTheme, setActiveRoom, updateBOQItem, selectVendor,
    toggleMilestone, setQcStatus, addChatMessage, addUpload, removeUpload, updateContext,
    adoptServerContext, applyContextPatch, revertContext, applyProposal, getGroundingState, pushAudit, addRender,
    setProjectType, setScopeQuality, setScopeDoc, regenerateScope, recomputeScope, addScopeToBOQ,
    setDocketSet, updateDocketCell, mergeDocketEnrichment,
    confirmScope, statusOf, nextAction,
    setFloorplan, clearFloorplan,
    validateFloorplan, unvalidateFloorplan, addRoomImage, removeRoomImage, roomImagesFor, focusRoomFor,
    reset
  };
})();
