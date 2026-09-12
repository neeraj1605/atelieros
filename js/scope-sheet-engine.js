/* ============================================================
   Planex — Scope Sheet Engine
   Builds vendor-facing RFQ scope sheets from the Scope (quantities),
   the Design Docket (specifications), the plan (drawing references &
   measurement basis) and the moodboard (finish reference).
   Deterministic. NO prices. Quantities are never changed by AI.
   ============================================================ */
window.PlanexScopeSheetEngine = (function () {

  const KEY_FIELD = {
    carcass: 'spec', shutter: 'finish', hardware: 'make',
    paint: 'spec', paintSheen: 'finish', polish: 'finish',
    floor: 'spec', lighting: 'make', sanitary: 'make', ceiling: 'spec'
  };

  function lib(packageId, packageName) { return window.PlanexScopeSheetData.forPackage(packageId, packageName); }
  function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
  function hash(s) { let h = 0; s = String(s == null ? '' : s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h >>> 0); }
  function pick(v, quality) { return (v && typeof v === 'object') ? (v[quality] || v.standard || '') : (v || ''); }

  function lineId(packageId, activityId) { return packageId + ':' + activityId; }

  function sizeFromText(txt) {
    const m = String(txt || '').match(/(\d{2,4})\s*[x×]\s*(\d{2,4})(?:\s*[x×]\s*(\d{2,4}))?/);
    return m ? m[0].replace(/\s+/g, '') : '';
  }

  function docketFor(packageName, docketSet) {
    if (!docketSet || !Array.isArray(docketSet.dockets)) return null;
    return docketSet.dockets.filter(function (d) { return (d.fromCategories || []).indexOf(packageName) >= 0; })[0] || null;
  }

  function specFromDocket(docket, activity) {
    if (!docket) return {};
    const nameL = String(activity.name || '').toLowerCase();
    const roomL = String(activity.room || '').toLowerCase();
    const toks = nameL.split(/\s+/).filter(function (w) { return w.length > 3; });
    for (const s of docket.sections || []) {
      for (const row of s.rows || []) {
        const cells = (row || []).map(function (x) { return String(x == null ? '' : x); });
        const joined = cells.join(' ').toLowerCase();
        const hit = toks.some(function (t) { return joined.indexOf(t) >= 0; });
        if (!hit) continue;
        if (roomL && joined.indexOf(roomL) < 0 && !hit) continue;
        const out = {};
        (s.columns || []).forEach(function (col, i) {
          const c = String(col).toLowerCase();
          const val = cells[i];
          if (!val) return;
          if (/spec|make|model|material|carcass|shutter/.test(c)) out.spec = out.spec || val;
          if (/size|dimension/.test(c)) out.size = out.size || val;
          if (/finish|shade|sheen/.test(c)) out.finish = out.finish || val;
          if (/hardware/.test(c)) out.make = out.make || val;
        });
        return out;
      }
    }
    return {};
  }

  function specFromDefaults(pkgId, quality) {
    const Q = window.PlanexDocketData && window.PlanexDocketData.QUALITY_DEFAULTS;
    if (!Q) return {};
    const out = {};
    const specKeys = (lib(pkgId).specKeys) || [];
    specKeys.forEach(function (k) {
      if (!Q[k]) return;
      const field = KEY_FIELD[k];
      const val = pick(Q[k], quality);
      if (field && val && !out[field]) out[field] = val;
    });
    return out;
  }

  function basisFor(libT, activity) {
    const rules = libT.activityRules || [];
    for (const r of rules) { if (r.re.test(String(activity.name || ''))) return { basis: r.basis, method: r.method }; }
    return { basis: libT.basisDefaults.basis, method: libT.basisDefaults.method };
  }

  function unitMarkFor(docketSet, activity) {
    if (!docketSet) return '';
    const furn = (docketSet.dockets || []).filter(function (d) { return d.id === 'furniture'; })[0];
    if (!furn || !Array.isArray(furn.units)) return '';
    const toks = String(activity.name || '').toLowerCase().split(/\s+/).filter(function (w) { return w.length > 3; });
    const u = (furn.units || []).filter(function (x) {
      const n = String(x.name || '').toLowerCase();
      return toks.some(function (t) { return n.indexOf(t) >= 0; });
    })[0];
    return u ? u.mark : '';
  }

  function drawingRefFor(libT, activity, docketSet) {
    const nos = (libT.drawings || []).filter(function (d) { return d.kind === 'sheet' || d.kind === 'layout'; }).map(function (d) { return d.no || d.label; });
    const mark = unitMarkFor(docketSet, activity);
    const parts = nos.slice();
    if (mark) parts.push('Unit ' + mark);
    return parts.join(' · ');
  }

  function moodRef(moodboards, rooms, activeSpaceId) {
    if (!moodboards) return null;
    const ids = Object.keys(moodboards);
    if (!ids.length) return null;
    const pickId = (activeSpaceId && activeSpaceId !== 'all' && moodboards[activeSpaceId]) ? activeSpaceId : ids[0];
    const m = moodboards[pickId] || {};
    const sp = (rooms || []).filter(function (r) { return r.id === pickId; })[0];
    const palette = (m.palette || []).map(function (c) { return ((c.role || '') + ' ' + (c.hex || '')).trim(); }).filter(Boolean);
    const materials = (m.materials || []).map(function (x) { return (x.surface || '') + ': ' + (x.material || '') + (x.make ? ' (' + x.make + ')' : ''); }).filter(Boolean);
    if (!palette.length && !materials.length) return null;
    return { space: sp ? sp.name : '', palette: palette, materials: materials };
  }

  function buildSheet(ctx) {
    const S = ctx || {};
    const scopeDoc = S.scopeDoc;
    if (!scopeDoc || !Array.isArray(scopeDoc.packages)) return null;
    const pkg = scopeDoc.packages.filter(function (p) { return p.id === S.packageId; })[0];
    if (!pkg) return null;
    const quality = S.quality || scopeDoc.quality || 'standard';
    const libT = lib(pkg.id, pkg.name);
    const docket = docketFor(pkg.name, S.docketSet);
    const assumptions = (libT.requiredAssumptions || []).map(function (label, i) {
      return { id: 'a' + (i + 1), label: label, answer: '', required: true };
    });

    const lines = [];
    (pkg.activities || []).forEach(function (act) {
      if (act.included === false) return;
      const fromDocket = specFromDocket(docket, act);
      const defaults = specFromDefaults(pkg.id, quality);
      const base = basisFor(libT, act);
      const spec = fromDocket.spec || defaults.spec || '';
      const make = fromDocket.make || defaults.make || '';
      const finish = fromDocket.finish || defaults.finish || '';
      const size = fromDocket.size || sizeFromText(act.detail) || sizeFromText(act.name) || '';
      lines.push({
        id: lineId(pkg.id, act.id),
        activityId: act.id,
        room: act.room || '',
        description: act.name,
        detail: act.detail || '',
        spec: spec,
        make: make,
        size: size,
        finish: finish,
        qty: num(act.qty),
        unit: act.unit || 'nos',
        basis: base.basis,
        method: base.method,
        drawingRef: drawingRefFor(libT, act, S.docketSet),
        remarks: '',
        fromDocket: !!(fromDocket.spec || fromDocket.make || fromDocket.finish || fromDocket.size),
        enriched: false,
        edited: false
      });
    });

    const sheet = {
      packageId: pkg.id,
      trade: libT.trade,
      title: libT.title,
      subjective: !!libT.subjective,
      finishDriven: !!libT.finishDriven,
      specPolicy: libT.specPolicy || { requireSpec: false, requireSize: false, requireFinish: false },
      lines: lines,
      inclusions: (libT.inclusions || []).slice(),
      exclusions: (libT.exclusions || []).slice(),
      supplied: { client: (libT.clientSupply || []).slice(), vendor: (libT.vendorSupply || []).slice() },
      assumptions: assumptions,
      measurement: (libT.measurement || []).slice(),
      drawings: (libT.drawings || []).slice(),
      commercial: Object.assign({}, libT.commercial || {}),
      qc: (libT.qc || []).slice(),
      timeline: Object.assign({ duration: '', coordination: [] }, libT.timeline || {}),
      moodboardRef: moodRef(S.moodboards, S.rooms, S.activeSpaceId),
      revision: 0,
      status: 'draft',
      revisions: [],
      ai: null,
      updatedAt: new Date().toISOString()
    };
    sheet.audit = audit(sheet);
    return sheet;
  }

  function buildAll(ctx) {
    const scopeDoc = ctx && ctx.scopeDoc;
    const out = {};
    if (!scopeDoc || !Array.isArray(scopeDoc.packages)) return out;
    scopeDoc.packages.forEach(function (p) {
      const hasIncluded = (p.activities || []).some(function (a) { return a.included !== false; });
      if (!hasIncluded) return;
      const sheet = buildSheet(Object.assign({}, ctx, { packageId: p.id, quality: (ctx.quality || scopeDoc.quality) }));
      if (sheet) out[p.id] = sheet;
    });
    return out;
  }

  /* ---------------- Audit (the no-assumption gate) ---------------- */
  function audit(sheet) {
    const gaps = [];
    const pol = sheet.specPolicy || {};
    (sheet.lines || []).forEach(function (l) {
      const ref = (l.description || '') + (l.room ? ' · ' + l.room : '');
      if (!l.basis) gaps.push({ lineId: l.id, block: true, message: 'No quantity basis set — ' + ref });
      if (!l.method) gaps.push({ lineId: l.id, block: true, message: 'No measurement method — ' + ref });
      if (pol.requireSpec && !l.spec && !l.detail) gaps.push({ lineId: l.id, block: true, message: 'No specification/make — ' + ref });
      if (pol.requireSize && !l.size) gaps.push({ lineId: l.id, block: true, message: 'No size/dimension — ' + ref });
      if (pol.requireFinish && !l.finish) gaps.push({ lineId: l.id, block: true, message: 'No finish/shade — ' + ref });
      if (!l.drawingRef) gaps.push({ lineId: l.id, block: true, message: 'No drawing reference — ' + ref });
      if (num(l.qty) <= 0) gaps.push({ lineId: l.id, block: false, message: 'Zero quantity — confirm on site: ' + ref });
      if (!l.enriched) gaps.push({ lineId: l.id, block: false, message: 'Product detail not yet enriched — ' + ref });
    });
    (sheet.assumptions || []).forEach(function (a) {
      if (a.required && !String(a.answer || '').trim()) gaps.push({ lineId: null, block: true, message: 'Assumption unanswered: ' + a.label });
    });
    if (sheet.finishDriven && !sheet.moodboardRef) gaps.push({ lineId: null, block: false, message: 'No moodboard/finish reference for a finish-driven trade.' });
    const blocking = gaps.filter(function (g) { return g.block; });
    return {
      gaps: gaps,
      blocking: blocking.length,
      warnings: gaps.length - blocking.length,
      passed: blocking.length === 0,
      override: (sheet.audit && sheet.audit.override) || null
    };
  }

  function canIssue(sheet) {
    const a = sheet.audit || audit(sheet);
    return !!a.passed || !!(a.override && a.override.reason);
  }

  function freeze(sheet, meta) {
    meta = meta || {};
    return {
      rev: sheet.revision,
      at: new Date().toISOString(),
      planRevision: meta.planRevision || null,
      planDate: meta.planDate || null,
      override: (sheet.audit && sheet.audit.override) || null,
      frozen: {
        title: sheet.title, trade: sheet.trade, packageId: sheet.packageId,
        lines: (sheet.lines || []).map(function (l) { return Object.assign({}, l); }),
        inclusions: (sheet.inclusions || []).slice(),
        exclusions: (sheet.exclusions || []).slice(),
        supplied: sheet.supplied,
        assumptions: (sheet.assumptions || []).map(function (a) { return Object.assign({}, a); }),
        measurement: (sheet.measurement || []).slice(),
        drawings: (sheet.drawings || []).slice(),
        commercial: Object.assign({}, sheet.commercial || {}),
        qc: (sheet.qc || []).slice(),
        timeline: Object.assign({}, sheet.timeline || {}),
        moodboardRef: sheet.moodboardRef || null,
        auditPassed: !!(sheet.audit && sheet.audit.passed),
        blocking: sheet.audit ? sheet.audit.blocking : 0
      }
    };
  }

  function sheetInputHash(ctx) {
    const scopeDoc = ctx && ctx.scopeDoc;
    const docketSet = ctx && ctx.docketSet;
    const ids = scopeDoc && scopeDoc.packages ? scopeDoc.packages.map(function (p) { return p.id + ':' + p.subtotal; }).join(';') : 'none';
    const dk = docketSet && docketSet.scopeHash ? docketSet.scopeHash : 'none';
    return hash([ids, dk, (ctx && ctx.quality) || 'standard'].join('::'));
  }

  return {
    buildSheet: buildSheet,
    buildAll: buildAll,
    audit: audit,
    canIssue: canIssue,
    freeze: freeze,
    sheetInputHash: sheetInputHash,
    lineId: lineId
  };
})();
