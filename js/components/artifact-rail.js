/* ============================================================
   Planex — Artifact Rail (right)
   Shows whatever the AI is building right now, driven by ui.artifactRef.
   Summaries only; full detail opens in the Workspace.
   ============================================================ */
window.PlanexArtifactRail = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function money(n) { return store().formatMoney(n || 0); }
  function compact(n) { return store().formatCompact(n || 0); }

  function open(act, subKey, sub) {
    const patch = { view: 'workspace', act: act };
    if (subKey) patch[subKey] = sub;
    store().setUI(patch);
    window.PlanexApp.renderView();
  }

  function spaceName(id) {
    const s = store().spaceById(id);
    return s ? s.name : '';
  }

  function block(ref) {
    const S = store().state;

    if (ref && ref.indexOf('moodboard:') === 0) {
      const id = ref.split(':')[1];
      const mb = S.moodboards && S.moodboards[id];
      return `
        <div class="art-head"><span class="art-kind">Moodboard</span><span class="faint text-xs">${esc(spaceName(id))}</span></div>
        ${mb ? `
          <div class="art-swatches">${(mb.palette || []).map(function (c) { return `<span class="mood-sw" style="background:${esc(c.hex)}" title="${esc(c.name)}"></span>`; }).join('')}</div>
          <p class="muted text-sm" style="margin-top:8px;">${(mb.materials || []).length} materials · ${esc((mb.lighting && mb.lighting.cct) || '')}</p>
        ` : '<p class="muted text-sm">No palette yet for this space.</p>'}
        <button class="btn btn-secondary btn-sm btn-block" data-open="design:designSub:moodboard">Open Moodboard</button>`;
    }

    if (ref && ref.indexOf('scope:') === 0) {
      const id = ref.split(':')[1];
      const doc = S.scopeDoc;
      const pkgs = doc ? doc.packages.length : 0;
      const total = doc ? doc.summary.total : 0;
      return `
        <div class="art-head"><span class="art-kind">Scope</span><span class="faint text-xs">${esc(spaceName(id))}</span></div>
        <div class="art-stat"><span class="muted">Packages</span><strong>${pkgs}</strong></div>
        <div class="art-stat"><span class="muted">Indicative</span><strong>${compact(total * 0.88)} – ${compact(total * 1.12)}</strong></div>
        <button class="btn btn-secondary btn-sm btn-block" data-open="procurement:procurementSub:scope">Open Scope</button>`;
    }

    if (ref && ref.indexOf('cost:') === 0) {
      const fin = store().getFinancials();
      const pct = Math.min(100, fin.utilization || 0);
      return `
        <div class="art-head"><span class="art-kind">Costing</span></div>
        <div class="art-stat"><span class="muted">Subtotal</span><strong>${money(fin.subtotal)}</strong></div>
        <div class="art-stat"><span class="muted">GST</span><strong>${money(fin.gst)}</strong></div>
        <div class="art-stat"><span class="muted">Total</span><strong>${money(fin.total)}</strong></div>
        <div class="psc-bar" style="margin-top:8px;"><div class="psc-bar-fill" style="width:${pct}%"></div></div>
        <p class="faint text-xs" style="margin-top:6px;">${fin.withinBudget ? 'Within budget' : 'Over budget'} · ${pct}% of budget</p>
        <button class="btn btn-secondary btn-sm btn-block" data-open="procurement:procurementSub:costing">Open Costing</button>`;
    }

    if (ref && ref.indexOf('unit:') === 0) {
      const mark = ref.split(':')[1];
      const set = S.docketSet;
      let unit = null;
      if (set) {
        set.dockets.forEach(function (d) {
          (d.units || []).forEach(function (u) { if (u.mark === mark) unit = u; });
        });
      }
      return `
        <div class="art-head"><span class="art-kind">Unit</span><span class="faint text-xs">${esc(mark)}</span></div>
        ${unit ? `
          <p class="text-sm" style="font-weight:650;">${esc(unit.name)}</p>
          <p class="muted text-sm">${esc(unit.space || '')} · ${esc(unit.size || '')}</p>
          <p class="muted text-sm">Carcass: ${esc(unit.carcass || '')}</p>
        ` : '<p class="muted text-sm">Unit details are in the Dockets workspace.</p>'}
        <button class="btn btn-secondary btn-sm btn-block" data-open="design:designSub:docket">Open Dockets</button>`;
    }

    // At a glance
    const j = window.PlanexJourneyRail ? window.PlanexJourneyRail.progress(S) : { design: 0, procurement: 0, execution: 0 };
    const next = store().nextAction();
    return `
      <div class="art-head"><span class="art-kind">At a glance</span></div>
      <div class="art-stat"><span class="muted">Design</span><strong>${j.design}%</strong></div>
      <div class="art-stat"><span class="muted">Procurement</span><strong>${j.procurement}%</strong></div>
      <div class="art-stat"><span class="muted">Execution</span><strong>${j.execution}%</strong></div>
      <button class="btn btn-primary btn-sm btn-block" data-nav="${next.view}" style="margin-top:10px;">${esc(next.label)}</button>`;
  }

  function render(container) {
    if (!container) return;
    const ref = (store().state.ui && store().state.ui.artifactRef) || null;
    container.innerHTML = `
      <div class="art-rail-inner">
        <div class="art-rail-label">${ic('docket')} Live artifact</div>
        ${block(ref)}
      </div>`;
    container.querySelectorAll('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        const p = b.getAttribute('data-open').split(':');
        open(p[0], p[1], p[2]);
      });
    });
  }

  return { render: render };
})();
