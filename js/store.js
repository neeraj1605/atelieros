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
    return {
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
      context: {
        projectType: D.project.type,
        spaceType: D.project.spaceType,
        spaces: ['Living Room', 'Modular Kitchen', 'Master Bedroom'],
        style: ['Warm Minimal', 'Japandi'],
        budget: D.project.budget,
        family: '4 members',
        notes: 'Prefers low-maintenance finishes. Wants more storage.'
      }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.boq && parsed.project) {
          state = parsed;
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

  function addChatMessage(role, text, attachments) {
    state.chat.push({
      role, text,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments || []
    });
    commit();
  }

  function addUpload(file) {
    state.uploads.push(file);
    if (file.kind === 'plan') { state.context.notes += ' Site plan uploaded.'; }
    commit();
  }

  function removeUpload(id) {
    state.uploads = state.uploads.filter(u => u.id !== id);
    commit();
  }

  function updateContext(patch) { Object.assign(state.context, patch); commit(); }

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
    reset
  };
})();
