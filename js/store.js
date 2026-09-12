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
      rooms: JSON.parse(JSON.stringify(D.rooms)).map(function (r) {
        const kind = (window.PlanexPlanGenerator && window.PlanexPlanGenerator.kindOf) ? window.PlanexPlanGenerator.kindOf(r.name) : 'other';
        return Object.assign({}, r, {
          kind: kind,
          photos: [],
          style: { directions: [], palette: [] },
          brief: '',
          status: 'define',
          validated: true
        });
      }),
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
      scopeConfirmed: false,
      plan: null,
      sheetNotes: {},
      activeSpaceId: 'all',
      moodboards: {},
      theme: { directions: ['Warm Minimal', 'Japandi'], palette: [] },
      scopeSheets: {},
      scopeSheetQuotes: {},
      derived: {
        plan: { inputHash: '', builtAt: '' },
        scope: { inputHash: '', builtAt: '', edited: false },
        boq: { scopeHash: '', builtAt: '' },
        dockets: { docketHash: '', builtAt: '' },
        execution: { docketHash: '', builtAt: '' },
        scopeSheets: { inputHash: '', builtAt: '' }
      },
      stale: { plan: false, scope: false, boq: false, dockets: false, execution: false, scopeSheets: false }
    };
    initial.project.projectType = 'ready';
    initial.project.plan = 'ai';
    initial.ui = { dock: 'right', collapsed: false, act: 'design', designSub: 'spaces', procurementSub: 'scope', seenHowItWorks: false, view: 'copilot', artifactRef: null, leftRailCollapsed: false };
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
          if (state.plan === undefined) state.plan = null;
          if (state.activeSpaceId === undefined) state.activeSpaceId = 'all';
          if (!state.moodboards || typeof state.moodboards !== 'object') state.moodboards = {};
          if (!state.theme) state.theme = { directions: [], palette: [] };
          if (!state.derived || typeof state.derived !== 'object') state.derived = {
            plan: { inputHash: '', builtAt: '' },
            scope: { inputHash: '', builtAt: '', edited: false },
            boq: { scopeHash: '', builtAt: '' },
            dockets: { docketHash: '', builtAt: '' },
            execution: { docketHash: '', builtAt: '' },
            scopeSheets: { inputHash: '', builtAt: '' }
          };
          ['plan', 'scope', 'boq', 'dockets', 'execution', 'scopeSheets'].forEach(function (k) {
            if (!state.derived[k]) state.derived[k] = {};
          });
          if (!state.stale || typeof state.stale !== 'object') state.stale = {};
          ['plan', 'scope', 'boq', 'dockets', 'execution', 'scopeSheets'].forEach(function (k) {
            if (typeof state.stale[k] !== 'boolean') state.stale[k] = false;
          });
          if (!state.scopeSheets || typeof state.scopeSheets !== 'object') state.scopeSheets = {};
          if (!state.scopeSheetQuotes || typeof state.scopeSheetQuotes !== 'object') state.scopeSheetQuotes = {};
          // Migrate legacy per-space photos into the canonical roomImages map.
          if (Array.isArray(state.rooms)) state.rooms.forEach(function (r) {
            if (Array.isArray(r.photos) && r.photos.length) {
              if (!state.roomImages[r.id]) state.roomImages[r.id] = [];
              const known = state.roomImages[r.id].map(function (p) { return p.dataUrl; });
              r.photos.forEach(function (p) {
                if (p && p.dataUrl && known.indexOf(p.dataUrl) < 0) state.roomImages[r.id].push(p);
              });
            }
          });
          if (Array.isArray(state.rooms)) state.rooms.forEach(function (r) {
            if (r.kind === undefined) r.kind = (window.PlanexPlanGenerator && window.PlanexPlanGenerator.kindOf) ? window.PlanexPlanGenerator.kindOf(r.name) : 'other';
            if (!Array.isArray(r.photos)) r.photos = [];
            if (!r.style) r.style = { directions: [], palette: [] };
            if (r.brief === undefined) r.brief = '';
            if (r.status === undefined) r.status = 'define';
          });
          if (!state.sheetNotes || typeof state.sheetNotes !== 'object') state.sheetNotes = {};
          if (!state.scopeQuality) state.scopeQuality = 'standard';
          if (state.project && !state.project.projectType) state.project.projectType = 'ready';
          if (state.project && !state.project.plan) state.project.plan = 'ai';
          if (!state.ui) state.ui = { dock: 'right', collapsed: false, act: 'design', designSub: 'spaces', procurementSub: 'scope', seenHowItWorks: false };
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

  // Notify the project spine so derived artifacts cascade.
  function touch() {
    if (window.PlanexSpine && window.PlanexSpine.onChange) {
      try { window.PlanexSpine.onChange(); } catch (e) { console.warn('Planex spine:', e); }
    }
  }

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
    touch();
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
    touch();
    commit();
    return state.floorplan;
  }

  function clearFloorplan() {
    state.floorplan = null;
    touch();
    commit();
  }

  function validateFloorplan(validation) {
    if (!state.floorplan) return false;
    state.floorplan.validated = true;
    state.floorplan.validatedAt = new Date().toISOString();
    state.floorplan.validation = validation || { checks: [], warnings: [] };
    pushAudit('plan.validate', { warnings: ((validation && validation.warnings) || []).length });
    touch();
    commit();
    return true;
  }

  function unvalidateFloorplan() {
    if (state.floorplan && state.floorplan.validated) {
      state.floorplan.validated = false;
      state.floorplan.validatedAt = null;
      touch();
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
    touch();
    commit();
  }

  function setScopeQuality(q) { state.scopeQuality = q; touch(); commit(); }

  function setScopeDoc(doc) { state.scopeDoc = doc || null; touch(); commit(); }

  function regenerateScope() {
    if (!window.PlanexScopeEngine) return null;
    state.scopeDoc = window.PlanexScopeEngine.generateScopeDoc({
      projectType: (state.project && state.project.projectType) || 'ready',
      quality: state.scopeQuality || 'standard',
      rooms: state.rooms,
      budget: state.project && state.project.budget
    });
    if (state.derived && state.derived.scope) {
      state.derived.scope = {
        inputHash: window.PlanexSpine ? window.PlanexSpine.scopeInputHash(state) : '',
        builtAt: new Date().toISOString(),
        edited: false
      };
    }
    pushAudit('scope.generate', {
      projectType: state.scopeDoc.projectType,
      packages: state.scopeDoc.packages.length
    });
    touch();
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
  // opts.replace keeps user-edited qty/rate for scope-derived lines instead of duplicating.
  function scopeBoqKey(act, pkgName) {
    return [(act.room || ''), pkgName, act.name + (act.detail ? ' — ' + act.detail : '')].join('|').toLowerCase();
  }

  function addScopeToBOQ(packageId, opts) {
    const doc = state.scopeDoc;
    if (!doc || !Array.isArray(doc.packages)) return 0;
    opts = opts || {};
    const replace = !!opts.replace;

    const prior = {};
    if (replace) {
      state.boq.forEach(function (b) { if (b.fromScope) prior[b.scopeKey] = { qty: b.qty, rate: b.rate }; });
      state.boq = state.boq.filter(function (b) { return !b.fromScope; });
    }

    let added = 0;
    doc.packages.forEach(function (pkg) {
      if (packageId && pkg.id !== packageId) return;
      pkg.activities.forEach(function (act) {
        if (act.included === false) return;
        const key = scopeBoqKey(act, pkg.name);
        if (!replace) {
          const dup = state.boq.some(function (b) { return b.fromScope && b.scopeKey === key; });
          if (dup) return;
        }
        const prev = prior[key];
        state.boq.push({
          id: 'b-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
          room: act.room || '',
          category: pkg.name,
          item: act.name + (act.detail ? ' — ' + act.detail : ''),
          qty: prev ? prev.qty : (Number(act.qty) || 0),
          unit: act.unit || 'nos',
          rate: prev ? prev.rate : (Number(act.rate) || 0),
          fromScope: true,
          scopeKey: key
        });
        added++;
      });
    });
    if (state.derived && state.derived.boq) {
      state.derived.boq = {
        scopeHash: window.PlanexSpine ? window.PlanexSpine.scopeInputHash(state) : '',
        builtAt: new Date().toISOString()
      };
    }
    pushAudit('scope.to_boq', { package: packageId || 'all', items: added, replace: replace });
    touch();
    commit();
    return added;
  }

  /* ---------- Design dockets ---------- */
  function setDocketSet(set) {
    state.docketSet = set || null;
    if (state.derived && state.derived.dockets && set && window.PlanexSpine) {
      state.derived.dockets = {
        docketHash: window.PlanexSpine.docketHash(state.scopeDoc, state.rooms, state.moodboards, state.project && state.project.projectType, state.scopeQuality),
        builtAt: new Date().toISOString()
      };
    }
    touch();
    commit();
  }

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

  /* ---------- Plan footprint & drawing sheets ---------- */
  function setPlan(plan) { state.plan = plan || null; commit(); }

  function regeneratePlan() {
    if (!window.PlanexPlanGenerator) return null;
    state.plan = window.PlanexPlanGenerator.generatePlan(state.rooms);
    if (state.derived && state.derived.plan) {
      state.derived.plan = {
        inputHash: window.PlanexSpine ? window.PlanexSpine.roomsHash(state.rooms) : '',
        builtAt: new Date().toISOString()
      };
    }
    touch();
    commit();
    return state.plan;
  }

  function setSheetNotes(kind, notes) {
    if (!kind) return;
    state.sheetNotes[kind] = notes || null;
    commit();
  }

  /* ---------- Engagement plan & UI state ---------- */
  function setServicePlan(plan) {
    if (['ai', 'remote', 'onground'].indexOf(plan) < 0) return;
    if (!state.project) state.project = {};
    state.project.plan = plan;
    pushAudit('project.plan', { plan: plan });
    commit();
  }
  function setUI(patch) {
    state.ui = Object.assign({ dock: 'right', collapsed: false, act: 'design', designSub: 'spaces', procurementSub: 'scope', seenHowItWorks: false }, state.ui, patch || {});
    commit();
  }
  function markHowItWorksSeen() { setUI({ seenHowItWorks: true }); }
  function setArtifact(ref) { state.ui.artifactRef = ref || null; commit(); }
  function setSurface(view) { state.ui.view = view === 'workspace' ? 'workspace' : 'copilot'; commit(); }

  /* ---------- Spaces ---------- */
  function spaceById(id) {
    return state.rooms.filter(function (r) { return r.id === id; })[0] || null;
  }
  function activeSpace() {
    return (state.activeSpaceId && state.activeSpaceId !== 'all') ? spaceById(state.activeSpaceId) : null;
  }
  function setActiveSpace(id) { state.activeSpaceId = id || 'all'; commit(); }
  function addSpace(space) {
    const s = Object.assign({
      id: 'space-' + Date.now(),
      name: 'New Space', kind: 'other', length: 0, width: 0, area: '—',
      color: '#9db8c9', type: 'private',
      photos: [], style: { directions: [], palette: [] }, brief: '', status: 'define'
    }, space || {});
    s.area = (Number(s.length) * Number(s.width)).toFixed(1) + ' m²';
    state.rooms.push(s);
    unvalidateFloorplan();
    touch();
    commit();
    return s;
  }
  function updateSpace(id, patch) {
    const s = spaceById(id);
    if (!s) return null;
    Object.assign(s, patch || {});
    if (patch && (patch.length != null || patch.width != null)) {
      s.area = (Number(s.length) * Number(s.width)).toFixed(1) + ' m²';
    }
    unvalidateFloorplan();
    touch();
    commit();
    return s;
  }
  function removeSpace(id) {
    state.rooms = state.rooms.filter(function (r) { return r.id !== id; });
    if (state.activeSpaceId === id) state.activeSpaceId = 'all';
    unvalidateFloorplan();
    touch();
    commit();
  }
  function setMoodboard(spaceId, mb) { state.moodboards[spaceId] = mb || null; touch(); commit(); }
  function setTheme(patch) { state.theme = Object.assign({ directions: [], palette: [] }, state.theme, patch || {}); touch(); commit(); }

  /* ---------- Status & journey ---------- */
  function confirmScope() {
    if (!state.scopeDoc) return false;
    state.scopeConfirmed = true;
    pushAudit('scope.confirm', { packages: state.scopeDoc.packages.length });
    commit();
    return true;
  }

  function statusOf(artifact) {
    const stale = state.stale || {};
    if (artifact === 'plan') {
      const fp = state.floorplan;
      if (!fp) return 'draft';
      if (stale.plan) return 'stale';
      return fp.validated ? 'validated' : 'draft';
    }
    if (artifact === 'scope') {
      if (!state.scopeDoc) return 'draft';
      if (stale.scope) return 'stale';
      return state.scopeConfirmed ? 'validated' : 'indicative';
    }
    if (artifact === 'costing') {
      if (!(state.boq && state.boq.length)) return 'draft';
      return stale.boq ? 'stale' : 'firm';
    }
    if (artifact === 'dockets') {
      const set = state.docketSet;
      if (!set) return 'draft';
      if (stale.dockets) return 'stale';
      return set.dockets.some(function (d) { return d.ai; }) ? 'enriched' : 'built';
    }
    if (artifact === 'execution') {
      if (!state.docketSet) return 'draft';
      return stale.execution ? 'stale' : 'tracking';
    }
    if (artifact === 'scopesheets') {
      const sheets = state.scopeSheets || {};
      const ids = Object.keys(sheets);
      if (!ids.length) return 'draft';
      if (stale.scopeSheets) return 'stale';
      if (ids.some(function (id) { return sheets[id].status === 'finalized'; })) return 'finalized';
      if (ids.some(function (id) { return sheets[id].status === 'issued'; })) return 'issued';
      return ids.every(function (id) { return sheets[id].audit && sheets[id].audit.passed; }) ? 'ready' : 'draft';
    }
    return 'draft';
  }

  function nextAction() {
    const stale = state.stale || {};
    const fp = state.floorplan;
    if (!fp) return { label: 'Upload floor plan', view: 'project' };
    if (!fp.validated) return { label: 'Validate floor plan', view: 'project' };
    if (!state.scopeDoc) return { label: 'Build the scope', view: 'scope' };
    if (!state.scopeConfirmed) return { label: 'Confirm the scope', view: 'scope' };
    if (!state.boq || !state.boq.length) return { label: 'Price the scope', view: 'costing' };
    if (stale.boq) return { label: 'Re-price the scope', view: 'costing' };
    if (!state.docketSet) return { label: 'Generate dockets', view: 'docket' };
    if (stale.dockets) return { label: 'Refresh dockets', view: 'docket' };
    if (!Object.keys(state.scopeSheets || {}).length) return { label: 'Issue Scope Sheets', view: 'sheets' };
    if (stale.scopeSheets) return { label: 'Update Scope Sheets', view: 'sheets' };
    const sheets = state.scopeSheets || {};
    if (!Object.keys(sheets).some(function (id) { return sheets[id].status === 'issued' || sheets[id].status === 'finalized'; })) {
      return { label: 'Issue Scope Sheets to vendors', view: 'sheets' };
    }
    if (!state.selectedVendorId) return { label: 'Send RFQ to vendors', view: 'quotation' };
    return { label: 'Track execution', view: 'execution' };
  }

  function rebuildDerived(opts) {
    if (window.PlanexSpine && window.PlanexSpine.refresh) return window.PlanexSpine.refresh(opts || { interactive: true });
    return state.stale || {};
  }

  /* Apply AI-read rooms with stable ids and kind. Shared by every plan reader. */
  function applyRoomsDiff(aiRooms, opts) {
    opts = opts || {};
    const palette = ['#c9a27a', '#8aa4a0', '#b9a3c9', '#e0b98a', '#a8b89a', '#9db8c9'];
    const mode = opts.mode || 'merge';
    const current = state.rooms || [];
    const result = mode === 'replace' ? [] : current.slice();
    let added = 0, updated = 0, removed = 0;

    (aiRooms || []).forEach(function (r) {
      const nm = String((r && r.name) || '').trim();
      if (!nm) return;
      const len = Number(r.lengthM != null ? r.lengthM : r.length) || 0;
      const wid = Number(r.widthM != null ? r.widthM : r.width) || 0;
      const existing = result.filter(function (x) { return String(x.name).toLowerCase() === nm.toLowerCase(); })[0];
      if (existing) {
        existing.length = len || existing.length;
        existing.width = wid || existing.width;
        existing.area = (Number(existing.length) * Number(existing.width)).toFixed(1) + ' m²';
        existing.source = 'ai-plan';
        existing.confidence = r.confidence || existing.confidence;
        updated++;
      } else {
        result.push({
          id: r.id || ('room-' + Date.now() + '-' + result.length),
          name: nm,
          kind: r.kind || (window.PlanexPlanGenerator ? window.PlanexPlanGenerator.kindOf(nm) : 'other'),
          length: len,
          width: wid,
          area: (len * wid).toFixed(1) + ' m²',
          color: palette[result.length % palette.length],
          type: 'private',
          photos: [],
          style: { directions: [], palette: [] },
          brief: '',
          status: 'define',
          source: 'ai-plan',
          confidence: r.confidence || 'low'
        });
        added++;
      }
    });

    if (Array.isArray(opts.removals) && opts.removals.length) {
      const rm = opts.removals.map(function (n) { return String(n).toLowerCase(); });
      for (let i = result.length - 1; i >= 0; i--) {
        if (rm.indexOf(String(result[i].name).toLowerCase()) >= 0) { result.splice(i, 1); removed++; }
      }
    }

    state.rooms = result;
    unvalidateFloorplan();
    pushAudit('rooms.apply', { mode: mode, added: added, updated: updated, removed: removed });
    touch();
    commit();
    return { added: added, updated: updated, removed: removed };
  }

  // Photos for a space, stored in the canonical roomImages map the AI reads.
  function addSpacePhoto(spaceId, file) {
    if (!spaceId || !file || !file.dataUrl) return null;
    const entry = {
      id: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      name: file.name || 'space.jpg',
      mime: (String(file.dataUrl).match(/^data:([^;]+)/) || [])[1] || 'image/jpeg',
      dataUrl: file.dataUrl,
      size: file.size || 0,
      addedAt: new Date().toISOString()
    };
    if (!state.roomImages[spaceId]) state.roomImages[spaceId] = [];
    state.roomImages[spaceId].push(entry);
    if (state.roomImages[spaceId].length > 12) state.roomImages[spaceId].shift();
    commit();
    return entry;
  }

  // Merge AI scope enrichment (detail/make/spec only — never qty/rate).
  function mergeScopeEnrichment(enrichment) {
    if (!enrichment || !state.scopeDoc || !Array.isArray(state.scopeDoc.packages)) return 0;
    const by = enrichment.byActivityId || {};
    let n = 0;
    state.scopeDoc.packages.forEach(function (p) {
      (p.activities || []).forEach(function (a) {
        const e = by[a.id];
        if (!e) return;
        if (e.detail) { a.detail = String(e.detail).slice(0, 200); a.enriched = true; n++; }
        if (e.make) a.make = String(e.make).slice(0, 80);
        if (e.spec) a.spec = String(e.spec).slice(0, 160);
      });
    });
    pushAudit('scope.enrich', { items: n });
    touch();
    commit();
    return n;
  }

  /* ---------- Scope Sheets (vendor-facing RFQ documents) ---------- */
  function sheetInputHash() {
    return window.PlanexScopeSheetEngine
      ? window.PlanexScopeSheetEngine.sheetInputHash({ scopeDoc: state.scopeDoc, docketSet: state.docketSet, quality: state.scopeQuality })
      : '';
  }

  function regenerateScopeSheets() {
    if (!window.PlanexScopeSheetEngine) return 0;
    const built = window.PlanexScopeSheetEngine.buildAll({
      scopeDoc: state.scopeDoc, docketSet: state.docketSet, plan: state.plan,
      floorplan: state.floorplan, moodboards: state.moodboards, rooms: state.rooms,
      quality: state.scopeQuality, projectType: (state.project && state.project.projectType) || 'ready',
      activeSpaceId: state.activeSpaceId
    });
    if (!state.scopeSheets) state.scopeSheets = {};
    let n = 0;
    Object.keys(built).forEach(function (pid) {
      const fresh = built[pid];
      const old = state.scopeSheets[pid];
      if (old) {
        fresh.revision = old.revision || 0;
        fresh.status = old.status || 'draft';
        fresh.revisions = old.revisions || [];
        fresh.ai = old.ai || null;
        // preserve user edits and enrichment per line id
        const map = {};
        (old.lines || []).forEach(function (l) { map[l.id] = l; });
        fresh.lines.forEach(function (l) {
          const o = map[l.id];
          if (!o) return;
          if (o.edited) {
            ['spec', 'make', 'size', 'finish', 'basis', 'method', 'drawingRef', 'remarks'].forEach(function (k) {
              if (o[k] != null && o[k] !== '') l[k] = o[k];
            });
            l.edited = true;
          }
          if (o.enriched) l.enriched = true;
        });
        // preserve assumption answers by label
        const amap = {};
        (old.assumptions || []).forEach(function (a) { amap[a.label] = a.answer; });
        (fresh.assumptions || []).forEach(function (a) { if (amap[a.label]) a.answer = amap[a.label]; });
        if (old.inclusions && old.inclusions.length) fresh.inclusions = old.inclusions;
        if (old.exclusions && old.exclusions.length) fresh.exclusions = old.exclusions;
      }
      fresh.audit = window.PlanexScopeSheetEngine.audit(fresh);
      state.scopeSheets[pid] = fresh;
      n++;
    });
    if (state.derived) state.derived.scopeSheets = { inputHash: sheetInputHash(), builtAt: new Date().toISOString() };
    if (state.stale) state.stale.scopeSheets = false;
    pushAudit('scope_sheets.generate', { sheets: n });
    touch();
    commit();
    return n;
  }

  function sheetAudit(packageId) {
    const s = state.scopeSheets[packageId];
    if (!s || !window.PlanexScopeSheetEngine) return null;
    s.audit = window.PlanexScopeSheetEngine.audit(s);
    return s.audit;
  }

  function updateSheetLine(packageId, lineId, patch) {
    const s = state.scopeSheets[packageId];
    if (!s) return null;
    const line = (s.lines || []).filter(function (l) { return l.id === lineId; })[0];
    if (!line) return null;
    Object.assign(line, patch || {});
    line.edited = true;
    s.audit = window.PlanexScopeSheetEngine ? window.PlanexScopeSheetEngine.audit(s) : s.audit;
    s.updatedAt = new Date().toISOString();
    commit();
    return line;
  }

  function setSheetSection(packageId, section, value) {
    const s = state.scopeSheets[packageId];
    if (!s) return null;
    s[section] = value;
    s.updatedAt = new Date().toISOString();
    if (window.PlanexScopeSheetEngine) s.audit = window.PlanexScopeSheetEngine.audit(s);
    commit();
    return s;
  }

  function setSheetAssumption(packageId, assumptionId, answer) {
    const s = state.scopeSheets[packageId];
    if (!s) return null;
    const a = (s.assumptions || []).filter(function (x) { return x.id === assumptionId; })[0];
    if (a) a.answer = answer || '';
    if (window.PlanexScopeSheetEngine) s.audit = window.PlanexScopeSheetEngine.audit(s);
    commit();
    return s;
  }

  function setSheetOverride(packageId, reason) {
    const s = state.scopeSheets[packageId];
    if (!s) return null;
    s.audit = s.audit || {};
    s.audit.override = reason ? { reason: String(reason).slice(0, 300), at: new Date().toISOString() } : null;
    pushAudit('scope_sheet.override', { package: packageId });
    commit();
    return s;
  }

  function mergeSheetEnrichment(packageId, enrichment, model) {
    const s = state.scopeSheets[packageId];
    if (!s || !enrichment) return 0;
    let n = 0;
    const by = enrichment.byLineId || {};
    s.lines.forEach(function (l) {
      const e = by[l.id];
      if (!e) return;
      ['spec', 'make', 'size', 'finish', 'method'].forEach(function (k) {
        if (e[k] && !(l.edited && l[k])) l[k] = e[k];
      });
      l.enriched = true; n++;
    });
    if (enrichment.inclusions && enrichment.inclusions.length) s.inclusions = enrichment.inclusions;
    if (enrichment.exclusions && enrichment.exclusions.length) s.exclusions = enrichment.exclusions;
    const labels = (s.assumptions || []).map(function (a) { return String(a.label).toLowerCase(); });
    (enrichment.assumptions || []).forEach(function (label) {
      if (!label || labels.indexOf(String(label).toLowerCase()) >= 0) return;
      s.assumptions.push({ id: 'a' + (s.assumptions.length + 1), label: label, answer: '', required: true });
    });
    s.ai = { enrichedAt: new Date().toISOString(), model: model || 'gemini', notes: (enrichment.noAssumptionNotes || []).join(' ') };
    if (window.PlanexScopeSheetEngine) s.audit = window.PlanexScopeSheetEngine.audit(s);
    pushAudit('scope_sheet.enrich', { package: packageId, lines: n });
    commit();
    return n;
  }

  function canIssueSheet(packageId) {
    const s = state.scopeSheets[packageId];
    if (!s || !window.PlanexScopeSheetEngine) return false;
    return window.PlanexScopeSheetEngine.canIssue(s);
  }

  function issueScopeSheet(packageId, opts) {
    const s = state.scopeSheets[packageId];
    if (!s || !window.PlanexScopeSheetEngine) return null;
    if (!window.PlanexScopeSheetEngine.canIssue(s)) return { error: 'audit_blocked', audit: s.audit };
    opts = opts || {};
    const nextRev = (s.revision || 0) + 1;
    const frozen = window.PlanexScopeSheetEngine.freeze(Object.assign({}, s, { revision: nextRev }), {
      planRevision: (state.floorplan && state.floorplan.id) || null,
      planDate: state.floorplan && state.floorplan.uploadedAt
    });
    s.revision = nextRev;
    s.status = 'issued';
    s.revisions = (s.revisions || []).concat([frozen]);
    const vendors = (opts.vendorIds || []).map(function (id) {
      const v = state.vendors.filter(function (x) { return x.id === id; })[0];
      return v ? { id: v.id, name: v.name } : null;
    }).filter(Boolean);
    if (!state.scopeSheetQuotes[packageId]) state.scopeSheetQuotes[packageId] = [];
    vendors.forEach(function (v) {
      state.scopeSheetQuotes[packageId].push({
        id: 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        vendorId: v.id, vendorName: v.name, status: 'issued',
        againstRevision: nextRev, issuedAt: new Date().toISOString(),
        receivedAt: null, finalizedAt: null, amount: 0, currency: state.currency || 'INR',
        lineItems: [], coverage: null, compliance: null,
        file: null, source: 'manual', analysis: null
      });
    });
    pushAudit('scope_sheet.issue', { package: packageId, revision: nextRev, vendors: vendors.length });
    commit();
    return s;
  }

  function addSheetQuote(packageId, quote) {
    if (!state.scopeSheetQuotes[packageId]) state.scopeSheetQuotes[packageId] = [];
    state.scopeSheetQuotes[packageId].push(Object.assign({
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      status: 'received', againstRevision: (state.scopeSheets[packageId] || {}).revision || 0,
      receivedAt: new Date().toISOString(), amount: 0, lineItems: [], source: 'manual'
    }, quote || {}));
    commit();
    return state.scopeSheetQuotes[packageId];
  }

  function updateSheetQuote(packageId, quoteId, patch) {
    const q = (state.scopeSheetQuotes[packageId] || []).filter(function (x) { return x.id === quoteId; })[0];
    if (!q) return null;
    Object.assign(q, patch || {});
    commit();
    return q;
  }

  function mergeQuoteAnalysis(packageId, quoteId, analysis, model) {
    const q = (state.scopeSheetQuotes[packageId] || []).filter(function (x) { return x.id === quoteId; })[0];
    if (!q || !analysis) return null;
    q.lineItems = analysis.lineItems || [];
    q.coverage = analysis.coverage || null;
    q.compliance = analysis.compliance || null;
    q.amount = analysis.total || q.amount || 0;
    q.currency = analysis.currency || q.currency;
    if (analysis.vendorName && !q.vendorName) q.vendorName = analysis.vendorName;
    q.analysis = { summary: analysis.summary || '', model: model || 'gemini', at: new Date().toISOString() };
    q.status = 'analyzed';
    pushAudit('quote.analyze', { package: packageId, lines: (analysis.lineItems || []).length });
    commit();
    return q;
  }

  function setSheetQuoteStatus(packageId, quoteId, status) {
    const q = (state.scopeSheetQuotes[packageId] || []).filter(function (x) { return x.id === quoteId; })[0];
    if (!q) return null;
    q.status = status;
    if (status === 'finalized') {
      q.finalizedAt = new Date().toISOString();
      const s = state.scopeSheets[packageId];
      if (s) s.status = 'finalized';
    }
    pushAudit('scope_sheet.quote', { package: packageId, status: status });
    commit();
    return q;
  }

  function deleteSheetQuote(packageId, quoteId) {
    if (!state.scopeSheetQuotes[packageId]) return;
    state.scopeSheetQuotes[packageId] = state.scopeSheetQuotes[packageId].filter(function (x) { return x.id !== quoteId; });
    commit();
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
      applyRoomsDiff([{ id: p.id, name: p.name, lengthM: p.lengthM, widthM: p.widthM }], { mode: 'merge' });
    } else if (proposal.type === 'style.apply') {
      state.context.style = window.PlanexContext.mergePatch(state.context.style || {}, {
        directions: p.directions || [],
        palette: p.palette || []
      });
    } else {
      return false;
    }
    pushAudit('proposal.apply', { type: proposal.type, id: proposal.id });
    touch();
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
      boqLines: state.boq.slice(0, 40).map(function (b) {
        return { room: b.room, category: b.category, item: b.item, qty: b.qty, unit: b.unit, rate: b.rate };
      }),
      dockets: (state.docketSet ? state.docketSet.dockets : []).map(function (d) {
        return {
          id: d.id, name: d.name, trade: d.trade,
          rows: d.sections.reduce(function (n, s) { return n + ((s.rows && s.rows.length) || 0); }, 0),
          enriched: !!d.ai,
          notes: (d.notes || []).slice(0, 3)
        };
      }),
      moodboards: Object.keys(state.moodboards || {}).map(function (sid) {
        const m = state.moodboards[sid] || {};
        const sp = state.rooms.filter(function (r) { return r.id === sid; })[0];
        if (!sp) return null;
        return {
          space: sp.name,
          palette: (m.palette || []).map(function (c) { return ((c.role || '') + ' ' + (c.hex || '')).trim(); }).slice(0, 8),
          materials: (m.materials || []).map(function (x) { return (x.surface || '') + ': ' + (x.material || '') + (x.make ? ' (' + x.make + ')' : ''); }).slice(0, 8)
        };
      }).filter(Boolean),
      vendors: state.vendors.map(function (v) {
        const q = quoteFor(v);
        return { id: v.id, name: v.name, tier: v.tier, total: q.total, leadTime: v.leadTime, warranty: v.warranty };
      }),
      selectedVendorId: state.selectedVendorId,
      execution: {
        phases: (state.timeline || []).map(function (p) { return { name: p.name, progress: p.progress, status: p.status }; }),
        openQc: (state.qc || []).filter(function (q) { return q.status !== 'Resolved'; }).length
      },
      scopeSheets: Object.keys(state.scopeSheets || {}).map(function (pid) {
        const s = state.scopeSheets[pid];
        return {
          package: pid, trade: s.trade, status: s.status, revision: s.revision,
          lines: (s.lines || []).length,
          auditPassed: !!(s.audit && s.audit.passed),
          blocking: s.audit ? s.audit.blocking : 0,
          quotes: ((state.scopeSheetQuotes || {})[pid] || []).map(function (q) {
            return { vendor: q.vendorName, status: q.status, total: q.amount, againstRevision: q.againstRevision };
          })
        };
      }),
      staleness: state.stale || {}
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
    setProjectType, setScopeQuality, setScopeDoc, regenerateScope, recomputeScope, addScopeToBOQ, mergeScopeEnrichment, scopeBoqKey,
    setDocketSet, updateDocketCell, mergeDocketEnrichment,
    regenerateScopeSheets, sheetAudit, updateSheetLine, setSheetSection, setSheetAssumption, setSheetOverride,
    mergeSheetEnrichment, canIssueSheet, issueScopeSheet, addSheetQuote, updateSheetQuote, mergeQuoteAnalysis,
    setSheetQuoteStatus, deleteSheetQuote,
    setPlan, regeneratePlan, setSheetNotes,
    spaceById, activeSpace, setActiveSpace, addSpace, updateSpace, removeSpace, setMoodboard, setTheme,
    addSpacePhoto, applyRoomsDiff,
    setServicePlan, setUI, markHowItWorksSeen, setArtifact, setSurface,
    confirmScope, statusOf, nextAction, rebuildDerived,
    setFloorplan, clearFloorplan,
    validateFloorplan, unvalidateFloorplan, addRoomImage, removeRoomImage, roomImagesFor, focusRoomFor,
    reset
  };
})();
