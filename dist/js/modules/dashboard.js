/* ============================================================
   Planex AI — Home
   Status -> next action -> attention. No duplicate rails/cards.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Dashboard = (function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function moodboardStrip() {
    const S = window.PlanexStore.state;
    const rooms = S.rooms || [];
    if (!rooms.length) return '';
    return `
      <div class="section-label anim anim-2">Your spaces — the look so far</div>
      <div class="mood-strip anim anim-2">
        ${rooms.map(function (r) {
          const mb = S.moodboards && S.moodboards[r.id];
          const swatches = (mb && mb.palette && mb.palette.length)
            ? mb.palette.slice(0, 6).map(function (c) {
                return `<span class="mood-sw" style="background:${c.hex}" title="${esc(c.name)} ${esc(c.hex)}" data-hex="${esc(c.hex)}"></span>`;
              }).join('')
            : '<span class="muted text-xs">No palette yet</span>';
          return `<button class="mood-card" data-space="${r.id}">
            <span class="mood-card-head"><span class="mood-name">${esc(r.name)}</span><span class="faint text-xs">${r.length || 0} × ${r.width || 0} m</span></span>
            <span class="mood-swatches">${swatches}</span>
            <span class="faint text-xs">${mb ? 'Tap to open moodboard' : 'Set the look →'}</span>
          </button>`;
        }).join('')}
      </div>`;
  }

  function render(container) {
    const store = window.PlanexStore;
    const S = store.state;
    const fin = store.getFinancials();
    const ic = window.PlanexIcons.get;

    const steps = [
      { label: 'Design', view: 'design', done: !!(S.floorplan && S.floorplan.validated) && Object.keys(S.moodboards || {}).length > 0 },
      { label: 'Procurement', view: 'procurement', done: !!(S.boq && S.boq.length) },
      { label: 'Execution', view: 'execution', done: S.timeline.every(function (p) { return p.status === 'done'; }) }
    ];
    const doneCount = steps.filter(function (s) { return s.done; }).length;
    const pct = Math.round((doneCount / steps.length) * 100);
    const next = store.nextAction();

    // attention: blocking first, then deadlines/budget/issues
    const attention = [];
    if (!S.floorplan) attention.push({ icon: 'plan', title: 'Upload your floor plan', desc: 'Start with the plan and room photos.', view: 'project', tag: 'Blocking' });
    else if (!S.floorplan.validated) attention.push({ icon: 'alert', title: 'Validate your floor plan', desc: 'Confirm rooms and dimensions so advice is specific.', view: 'project', tag: 'Blocking' });
    if (!S.scopeDoc) attention.push({ icon: 'ruler', title: 'Build the scope of work', desc: 'Room-by-room, package-by-package.', view: 'scope', tag: 'Blocking' });
    else if (!S.scopeConfirmed) attention.push({ icon: 'check', title: 'Confirm the scope', desc: 'Lock what is included before pricing.', view: 'scope', tag: 'Blocking' });
    if (S.scopeDoc && !(S.boq && S.boq.length)) attention.push({ icon: 'rupee', title: 'Price the scope', desc: 'Create the firm BOQ in Costing.', view: 'costing', tag: 'Next' });
    if (S.boq && S.boq.length && !S.docketSet) attention.push({ icon: 'docket', title: 'Generate dockets', desc: 'Execution documents for agencies and suppliers.', view: 'docket', tag: 'Next' });
    if (S.docketSet && !S.selectedVendorId) attention.push({ icon: 'rupee', title: 'Send RFQ to vendors', desc: 'Get quotes against the BOQ.', view: 'quotation', tag: 'Next' });
    if (!fin.withinBudget) attention.push({ icon: 'alert', title: store.formatCompact(Math.abs(fin.variance)) + ' over budget', desc: 'Review value engineering in Costing.', view: 'costing', tag: 'Watch' });
    const openQc = S.qc.filter(function (q) { return q.status !== 'Resolved'; }).length;
    if (openQc) attention.push({ icon: 'check', title: openQc + ' QC item(s) open', desc: 'Track snags through to closure.', view: 'execution', tag: 'Watch' });

    const msDone = S.timeline.reduce(function (s, p) { return s + p.milestones.filter(function (m) { return m.done; }).length; }, 0);
    const msTotal = S.timeline.reduce(function (s, p) { return s + p.milestones.length; }, 0);
    const timelinePct = msTotal ? Math.round((msDone / msTotal) * 100) : 0;

    const stepper = steps.map(function (s, i) {
      const active = !s.done && steps.slice(0, i).every(function (x) { return x.done; });
      return `
        <button class="step ${s.done ? 'done' : ''} ${active ? 'active' : ''}" data-nav="${s.view}">
          <span class="step-dot">${s.done ? '✓' : i + 1}</span>
          <span class="step-label">${esc(s.label)}</span>
        </button>`;
    }).join('');

    const cards = attention.slice(0, 5).map(function (a) {
      const cls = a.tag === 'Blocking' ? 'danger' : a.tag === 'Watch' ? 'warning' : 'info';
      return `
        <button class="attention-card" data-nav="${a.view}">
          <span class="attention-ico">${ic(a.icon)}</span>
          <span class="attention-body">
            <span class="attention-title">${esc(a.title)}</span>
            <span class="attention-desc">${esc(a.desc)}</span>
          </span>
          <span class="badge badge-${cls === 'danger' ? 'danger' : cls === 'warning' ? 'warning' : 'info'}">${esc(a.tag)}</span>
        </button>`;
    }).join('');

    container.innerHTML = `
      <div class="view-inner">
        <section class="hero anim">
          <div class="hero-mesh"></div>
          <div class="hero-inner">
            <div>
              <div class="hero-eyebrow">${ic('home')} ${esc(S.project.spaceType || 'Home interior')} · ${esc(S.project.location || '')}</div>
              <h1 class="hero-title">${esc(S.project.name)}</h1>
              <p class="hero-sub">${pct}% through the journey · ${esc(next.label)} is next.</p>
              <div style="margin-top:16px;">
                <button class="btn btn-lg" data-nav="${next.view}" style="background:#fff;color:#18181b;">${esc(next.label)} ${ic('arrowRight')}</button>
              </div>
            </div>
            <div class="hero-stats">
              <div class="hero-stat"><div class="hs-val">${store.formatCompact(fin.total)}</div><div class="hs-label">Costing</div></div>
              <div class="hero-stat"><div class="hs-val">${pct}%</div><div class="hs-label">Complete</div></div>
            </div>
          </div>
        </section>

        <div class="stepper anim anim-1">${stepper}</div>

        ${moodboardStrip()}

        <div class="section-label anim anim-2">Needs your attention</div>
        <div class="attention-list anim anim-2">
          ${cards || '<div class="card"><p class="muted text-sm">All clear — nothing needs you right now.</p></div>'}
        </div>

        <div class="section-label anim anim-3">At a glance</div>
        <div class="stat-grid anim anim-3">
          <div class="stat-card">
            <div class="stat-head"><span>Budget</span>${ic('rupee')}</div>
            <div class="stat-val">${fin.withinBudget ? 'On track' : 'Over'}</div>
            <div class="stat-foot">${store.formatCompact(fin.total)} of ${store.formatCompact(S.project.budget)} · ${fin.utilization}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-head"><span>Timeline</span>${ic('calendar')}</div>
            <div class="stat-val">${timelinePct}%</div>
            <div class="stat-foot">${msDone}/${msTotal} milestones complete</div>
          </div>
          <div class="stat-card">
            <div class="stat-head"><span>Open issues</span>${ic('alert')}</div>
            <div class="stat-val">${openQc}</div>
            <div class="stat-foot">${S.qc.length - openQc} resolved</div>
          </div>
        </div>
      </div>
    `;

    bind(container);
  }

  function bind(container) {
    container.querySelectorAll('[data-space]').forEach(function (b) {
      b.addEventListener('click', function () {
        window.PlanexStore.setActiveSpace(b.getAttribute('data-space'));
        window.PlanexApp.navigate('moodboard');
      });
    });
    container.querySelectorAll('[data-hex]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        const hex = b.getAttribute('data-hex');
        try { navigator.clipboard.writeText(hex); window.PlanexUI.toast('Copied ' + hex); } catch (err) { window.PlanexUI.toast(hex); }
      });
    });
  }

  return { render };
})();
