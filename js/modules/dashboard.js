/* ============================================================
   Planex AI — Dashboard Module
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Dashboard = (function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function render(container) {
    const store = window.PlanexStore;
    const S = store.state;
    const fin = store.getFinancials();
    const money = (n) => store.formatMoney(n);
    const ic = window.PlanexIcons.get;

    const stages = [
      { id: 'ideate', name: 'Ideate', desc: 'AI conversation', icon: 'chat' },
      { id: 'docket', name: 'Design Docket', desc: 'Plans & BOQ', icon: 'docket' },
      { id: 'quotation', name: 'Quotation', desc: 'Compare & finalize', icon: 'rupee' },
      { id: 'execution', name: 'Execution', desc: 'Track & QC', icon: 'build' }
    ];

    // derive the active stage for the rail from project progress
    let activeRail = 0;
    if (S.selectedVendorId) activeRail = 2;
    const anyExec = S.timeline.some(p => p.progress > 0);
    if (anyExec) activeRail = 3;

    const doneMilestones = S.timeline.reduce((s, p) => s + p.milestones.filter(m => m.done).length, 0);
    const totalMilestones = S.timeline.reduce((s, p) => s + p.milestones.length, 0);
    const openQc = S.qc.filter(q => q.status !== 'Resolved').length;

    const stageRail = stages.map((st, i) => {
      const cls = i < activeRail ? 'done' : i === activeRail ? 'active' : '';
      return `
        <div class="stage-node ${cls}">
          <div class="stage-bubble">${ic(st.icon)}</div>
          <div class="stage-name">${st.name}</div>
          <div class="stage-desc">${st.desc}</div>
        </div>`;
    }).join('');

    const moduleCards = [
      { view: 'ai', icon: 'chat', title: 'Planex AI', desc: 'Chat, upload images & site plans, and shape the design.' },
      { view: 'docket', icon: 'docket', title: 'Design Docket', desc: 'Floorplan, furniture layout and detailed BOQ.' },
      { view: 'quotation', icon: 'rupee', title: 'Quotation', desc: 'Compare vendor quotes with locked specifications.' },
      { view: 'execution', icon: 'build', title: 'Execution Dockets', desc: 'Timeline, milestones and quality checks.' }
    ].map(c => `
      <button class="module-card" data-nav="${c.view}">
        <div class="module-ico">${ic(c.icon)}</div>
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
      </button>`).join('');

    container.innerHTML = `
      <div class="view-inner">
        <section class="hero anim">
          <div class="hero-mesh"></div>
          <div class="hero-inner">
            <div>
              <div class="hero-eyebrow">${ic('sparkles')} Welcome home</div>
              <h1 class="hero-title">${esc(S.project.name)}</h1>
              <p class="hero-sub">${esc(S.project.tagline)} • ${esc(S.project.location)}</p>
            </div>
            <div class="hero-stats">
              <div class="hero-stat">
                <div class="hs-val">${store.formatCompact(fin.total)}</div>
                <div class="hs-label">Est. Cost</div>
              </div>
              <div class="hero-stat">
                <div class="hs-val">${store.formatCompact(fin.budget)}</div>
                <div class="hs-label">Budget</div>
              </div>
              <div class="hero-stat">
                <div class="hs-val">${Math.round((doneMilestones / (totalMilestones || 1)) * 100)}%</div>
                <div class="hs-label">Progress</div>
              </div>
            </div>
          </div>
        </section>

        <div class="section-label anim anim-1">Your Journey</div>
        <div class="stage-rail anim anim-1">${stageRail}</div>

        <div class="section-label anim anim-2">Workspace</div>
        <div class="module-grid anim anim-2">${moduleCards}</div>

        <div class="section-label anim anim-3">At a Glance</div>
        <div class="stat-grid anim anim-3">
          <div class="stat-card">
            <div class="stat-head"><span>Estimated Cost</span>${ic('rupee')}</div>
            <div class="stat-val">${store.formatCompact(fin.total)}</div>
            <div class="stat-foot">${fin.withinBudget ? 'Within budget' : 'Over budget'} • incl. 18% GST</div>
          </div>
          <div class="stat-card">
            <div class="stat-head"><span>BOQ Items</span>${ic('docket')}</div>
            <div class="stat-val">${S.boq.length}</div>
            <div class="stat-foot">Across ${S.rooms.length} rooms</div>
          </div>
          <div class="stat-card">
            <div class="stat-head"><span>Open QC Items</span>${ic('check')}</div>
            <div class="stat-val">${openQc}</div>
            <div class="stat-foot">${S.qc.length - openQc} resolved</div>
          </div>
        </div>

        <div class="section-label anim anim-4">Next Step</div>
        <div class="card card-pad-lg anim anim-4" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">
          <div class="chat-avatar" style="width:46px;height:46px;">${ic('sparkles')}</div>
          <div style="flex:1;min-width:220px;">
            <div style="font-size:15px;font-weight:650;">Continue the conversation with Planex AI</div>
            <div class="muted text-sm" style="margin-top:2px;">Upload your site plan or photos, and I'll build your design docket automatically.</div>
          </div>
          <button class="btn btn-primary" data-nav="ai">${ic('chat')} Open Planex AI</button>
        </div>
      </div>
    `;
  }

  return { render };
})();
