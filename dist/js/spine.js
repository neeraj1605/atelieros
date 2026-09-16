/* ============================================================
   Planex — Project Spine
   Single source of truth for derived artifacts and the staleness
   cascade: rooms → plan → scope → BOQ → dockets → execution.
   Deterministic hashing only; never touches prices.
   ============================================================ */
window.PlanexSpine = (function () {
  function S() { return window.PlanexStore.state; }
  function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }

  function hash(str) {
    let h = 0;
    const s = String(str == null ? '' : str);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return String(h >>> 0);
  }

  function roomsHash(rooms) {
    return hash((rooms || []).map(function (r) {
      return [r.name || '', num(r.length), num(r.width), r.kind || ''].join(':');
    }).join('|'));
  }

  function moodboardHash(moods) {
    const keys = Object.keys(moods || {}).sort();
    return hash(keys.map(function (k) {
      const m = moods[k] || {};
      const pal = (m.palette || []).map(function (c) { return (c.hex || '') + (c.role || ''); }).join(',');
      const mats = (m.materials || []).map(function (x) { return (x.surface || '') + ':' + (x.material || '') + ':' + (x.make || ''); }).join(',');
      return k + '|' + pal + '|' + mats;
    }).join('||'));
  }

  function scopeHash(doc) {
    if (window.PlanexDocketEngine && window.PlanexDocketEngine.scopeHash) return window.PlanexDocketEngine.scopeHash(doc);
    if (!doc) return 'none';
    return hash(doc.projectType + '|' + doc.quality + '|' + (doc.packages || []).map(function (p) { return p.name + ':' + p.subtotal; }).join(';'));
  }

  function fpHash() {
    const fp = S().floorplan;
    return fp ? (fp.validated ? 'validated' : 'draft') : 'none';
  }

  function docketHash(doc, rooms, moods, projectType, quality) {
    return hash([scopeHash(doc), roomsHash(rooms), moodboardHash(moods), projectType || '', quality || '', fpHash()].join('::'));
  }

  // Hash of the inputs that produce the scope (rooms + type + quality + look).
  function scopeInputHash(st) {
    st = st || S();
    return hash([
      (st.project && st.project.projectType) || 'ready',
      st.scopeQuality || 'standard',
      roomsHash(st.rooms),
      moodboardHash(st.moodboards)
    ].join('::'));
  }

  // Hash of the inputs that produce the vendor scope sheets.
  function sheetsInputHash(st) {
    st = st || S();
    if (!window.PlanexScopeSheetEngine) return 'none';
    return window.PlanexScopeSheetEngine.sheetInputHash({
      scopeDoc: st.scopeDoc, docketSet: st.docketSet, quality: st.scopeQuality
    });
  }

  function derived() { const st = S(); if (!st.derived) st.derived = {}; return st.derived; }
  function staleMap() {
    const st = S();
    if (!st.stale) st.stale = { plan: false, scope: false, boq: false, dockets: false, execution: false, scopeSheets: false };
    return st.stale;
  }

  // Seed hashes from current state so a migrated project is not falsely stale.
  function adoptCurrent() {
    const st = S();
    const d = derived();
    d.plan = d.plan || { inputHash: '', builtAt: '' };
    d.scope = d.scope || { inputHash: '', builtAt: '', edited: false };
    d.boq = d.boq || { scopeHash: '', builtAt: '' };
    d.dockets = d.dockets || { docketHash: '', builtAt: '' };
    d.execution = d.execution || { docketHash: '', builtAt: '' };
    d.scopeSheets = d.scopeSheets || { inputHash: '', builtAt: '' };
    if (!d.plan.inputHash) d.plan.inputHash = roomsHash(st.rooms);
    if (!d.scope.inputHash) d.scope.inputHash = scopeInputHash(st);
    if (!d.boq.scopeHash) d.boq.scopeHash = scopeInputHash(st);
    if (!d.dockets.docketHash) d.dockets.docketHash = docketHash(st.scopeDoc, st.rooms, st.moodboards, st.project && st.project.projectType, st.scopeQuality);
    if (!d.execution.docketHash) d.execution.docketHash = d.dockets.docketHash;
    if (!d.scopeSheets.inputHash) d.scopeSheets.inputHash = sheetsInputHash(st);
    staleMap();
    return d;
  }

  function markDirty() {
    const st = S();
    const d = adoptCurrent();
    const sm = staleMap();
    const rh = roomsHash(st.rooms);
    const sih = scopeInputHash(st);
    const dh = docketHash(st.scopeDoc, st.rooms, st.moodboards, st.project && st.project.projectType, st.scopeQuality);
    sm.plan = !!st.plan && d.plan.inputHash !== rh;
    sm.scope = !!st.scopeDoc && d.scope.inputHash !== sih;
    sm.boq = !!(st.boq && st.boq.length) && !!st.scopeDoc && d.boq.scopeHash !== sih;
    sm.dockets = !!st.docketSet && d.dockets.docketHash !== dh;
    sm.execution = !!st.docketSet && d.execution.docketHash !== dh;
    sm.scopeSheets = !!(st.scopeSheets && Object.keys(st.scopeSheets).length) && d.scopeSheets.inputHash !== sheetsInputHash(st);
    return sm;
  }

  function staleness() { return staleMap(); }

  function markScopeEdited() {
    const d = derived();
    d.scope = d.scope || { inputHash: '', builtAt: '', edited: false };
    d.scope.edited = true;
    return true;
  }

  function pristineDockets(set) {
    if (!set || !Array.isArray(set.dockets)) return false;
    for (const dk of set.dockets) {
      if (dk.ai) return false;
      for (const s of dk.sections || []) {
        for (const r of s.rows || []) { if (r && (r.edited || r.colEdited)) return false; }
      }
    }
    return true;
  }

  function buildDocketSetFromState(st) {
    if (!window.PlanexDocketEngine) return null;
    return window.PlanexDocketEngine.buildDocketSet({
      scopeDoc: st.scopeDoc,
      rooms: st.rooms,
      plan: st.floorplan,
      quality: st.scopeQuality || 'standard',
      projectType: (st.project && st.project.projectType) || 'ready',
      moodboards: st.moodboards,
      theme: st.theme,
      activeSpaceId: st.activeSpaceId
    });
  }

  /* ---------- Execution derived from the docket site section ---------- */
  function sectionRows(d, key) {
    const s = (d.sections || []).filter(function (x) { return x.key === key; })[0];
    return s ? (s.rows || []) : [];
  }

  function buildExecutionFromDocket(set) {
    const d = (set.dockets || []).filter(function (x) { return x.id === 'site'; })[0];
    if (!d) return null;
    const seq = sectionRows(d, 'sequence');
    const phases = seq.map(function (r, i) {
      const name = r[1] || r[0] || ('Stage ' + (i + 1));
      return {
        id: 'sp-' + (i + 1),
        name: name,
        start: '',
        end: r[3] || '',
        status: i === 0 ? 'active' : 'upcoming',
        progress: 0,
        milestones: [{ label: name, done: false }]
      };
    });
    if (!phases.length) return null;
    const qc = sectionRows(d, 'qc').map(function (r, i) {
      return { id: 'qc-d' + (i + 1), title: r[1] || r[0] || ('Check ' + (i + 1)), trade: r[0] || '', severity: 'Minor', status: 'Open', date: '' };
    });
    return { phases: phases, qc: qc };
  }

  function mergeTimeline(oldT, newPhases) {
    const oldByName = {};
    (oldT || []).forEach(function (p) { oldByName[(p.name || '').toLowerCase()] = p; });
    return newPhases.map(function (p) {
      const old = oldByName[(p.name || '').toLowerCase()];
      if (old && Array.isArray(old.milestones)) {
        p.milestones = p.milestones.map(function (m, mi) {
          const om = (old.milestones || [])[mi];
          return { label: m.label, done: om ? !!om.done : false };
        });
      }
      const done = p.milestones.filter(function (m) { return m.done; }).length;
      p.progress = p.milestones.length ? Math.round((done / p.milestones.length) * 100) : 0;
      p.status = p.progress === 100 ? 'done' : (p.progress > 0 ? 'active' : p.status);
      return p;
    });
  }

  function mergeQc(oldQ, newQc) {
    const byTitle = {};
    (oldQ || []).forEach(function (q) { byTitle[(q.title || '').toLowerCase()] = q; });
    return newQc.map(function (q) {
      const o = byTitle[(q.title || '').toLowerCase()];
      if (o) { q.status = o.status || q.status; q.severity = o.severity || q.severity; q.date = o.date || q.date; }
      return q;
    });
  }

  function refreshExecution() {
    const st = S();
    const d = derived();
    const sm = staleMap();
    if (!st.docketSet) return;
    const dh = docketHash(st.scopeDoc, st.rooms, st.moodboards, st.project && st.project.projectType, st.scopeQuality);
    if (d.execution && d.execution.docketHash === dh) { sm.execution = false; return; }
    const built = buildExecutionFromDocket(st.docketSet);
    if (!built) return;
    st.timeline = mergeTimeline(st.timeline, built.phases);
    st.qc = mergeQc(st.qc, built.qc);
    d.execution = { docketHash: dh, builtAt: new Date().toISOString() };
    sm.execution = false;
  }

  /* ---------- Cascade ---------- */
  let busy = false;

  function refresh(opts) {
    opts = opts || {};
    if (busy) return staleness();
    busy = true;
    try {
      const st = S();
      const d = adoptCurrent();
      const sm = markDirty();

      if (sm.plan && window.PlanexPlanGenerator) {
        st.plan = window.PlanexPlanGenerator.generatePlan(st.rooms);
        d.plan = { inputHash: roomsHash(st.rooms), builtAt: new Date().toISOString() };
        sm.plan = false;
      }

      if (sm.scope && !(d.scope && d.scope.edited) && window.PlanexScopeEngine) {
        st.scopeDoc = window.PlanexScopeEngine.generateScopeDoc({
          projectType: (st.project && st.project.projectType) || 'ready',
          quality: st.scopeQuality || 'standard',
          rooms: st.rooms,
          budget: st.project && st.project.budget
        });
        d.scope = { inputHash: scopeInputHash(st), builtAt: new Date().toISOString(), edited: false };
        sm.scope = false;
      }

      if (sm.dockets && st.scopeDoc && pristineDockets(st.docketSet)) {
        const set = buildDocketSetFromState(st);
        if (set) {
          st.docketSet = set;
          d.dockets = {
            docketHash: docketHash(st.scopeDoc, st.rooms, st.moodboards, st.project && st.project.projectType, st.scopeQuality),
            builtAt: new Date().toISOString()
          };
          sm.dockets = false;
        }
      }

      refreshExecution();

      if (opts.persist !== false && window.PlanexStore) window.PlanexStore.commit();
    } finally {
      busy = false;
    }
    return staleness();
  }

  // Called from store mutations. Marks staleness then applies safe cascades.
  function onChange() {
    if (busy) return staleness();
    markDirty();
    return refresh({ persist: false });
  }

  return {
    roomsHash: roomsHash,
    moodboardHash: moodboardHash,
    scopeHash: scopeHash,
    scopeInputHash: scopeInputHash,
    sheetsInputHash: sheetsInputHash,
    docketHash: docketHash,
    adoptCurrent: adoptCurrent,
    markDirty: markDirty,
    staleness: staleness,
    markScopeEdited: markScopeEdited,
    refresh: refresh,
    onChange: onChange,
    pristineDockets: pristineDockets,
    buildExecutionFromDocket: buildExecutionFromDocket
  };
})();

if (window.PlanexStore) window.PlanexSpine.adoptCurrent();
