/* ============================================================
   Planex — Journey Rail (left)
   Keeps the journey and the spaces visible while you talk to the AI.
   ============================================================ */
window.PlanexJourneyRail = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  function progress(S) {
    const designDone = (S.floorplan && S.floorplan.validated) ? 1 : (S.floorplan ? 0.5 : 0);
    const lookDone = Object.keys(S.moodboards || {}).length ? 1 : 0;
    const design = Math.round(((designDone + lookDone) / 2) * 100);
    const procParts = [S.scopeDoc ? 1 : 0, (S.boq && S.boq.length) ? 1 : 0, S.selectedVendorId ? 1 : 0];
    const procurement = Math.round((procParts.reduce(function (a, b) { return a + b; }, 0) / 3) * 100);
    const ms = S.timeline || [];
    const total = ms.reduce(function (s, p) { return s + p.milestones.length; }, 0);
    const done = ms.reduce(function (s, p) { return s + p.milestones.filter(function (m) { return m.done; }).length; }, 0);
    const execution = total ? Math.round((done / total) * 100) : 0;
    return { design: design, procurement: procurement, execution: execution };
  }

  function render(container) {
    const S = store().state;
    const p = progress(S);
    const acts = [
      { k: 'design', label: 'Design', pct: p.design, subs: [['spaces', 'Spaces'], ['moodboard', 'Moodboard'], ['docket', 'Dockets']], sub: (S.ui && S.ui.designSub) || 'spaces', subKey: 'designSub' },
      { k: 'procurement', label: 'Procurement', pct: p.procurement, subs: [['scope', 'Scope'], ['costing', 'Costing'], ['quotation', 'Buy']], sub: (S.ui && S.ui.procurementSub) || 'scope', subKey: 'procurementSub' },
      { k: 'execution', label: 'Execution', pct: p.execution, subs: [], sub: null, subKey: null }
    ];

    container.innerHTML = `
      <div class="rail-block">
        <div class="rail-title">Your journey</div>
        ${acts.map(function (a) {
          const sub = (a.subs.filter(function (x) { return x[0] === a.sub; })[0] || [])[1] || '';
          return `
            <button class="rail-act ${a.pct >= 100 ? 'done' : ''}" data-act="${a.k}">
              <span class="rail-act-top"><span class="rail-act-name">${esc(a.label)}</span><span class="rail-act-pct">${a.pct}%</span></span>
              <span class="rail-act-bar"><span style="width:${a.pct}%"></span></span>
              ${sub ? `<span class="rail-act-sub">${esc(sub)}</span>` : ''}
            </button>`;
        }).join('')}
      </div>

      <div class="rail-block">
        <div class="rail-title">Spaces</div>
        <button class="rail-space ${(!S.activeSpaceId || S.activeSpaceId === 'all') ? 'active' : ''}" data-space="all">All spaces</button>
        ${(S.rooms || []).map(function (r) {
          const mb = S.moodboards && S.moodboards[r.id];
          const dot = mb ? 'ok' : (S.floorplan && S.floorplan.validated ? 'warn' : 'idle');
          return `<button class="rail-space ${r.id === S.activeSpaceId ? 'active' : ''}" data-space="${r.id}">
            <span class="rail-dot ${dot}"></span>${esc(r.name)}
          </button>`;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        const k = b.getAttribute('data-act');
        store().setUI({ view: 'workspace', act: k });
        if (k === 'execution') window.PlanexApp.navigate('execution');
        else window.PlanexApp.renderView();
      });
    });
    container.querySelectorAll('[data-space]').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-space');
        store().setActiveSpace(id);
        store().setUI({ view: 'copilot' });
        window.PlanexApp.renderView();
      });
    });
  }

  return { render: render, progress: progress };
})();
