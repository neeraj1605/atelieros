/* ============================================================
   Planex AI — Execution Dockets Module
   Timeline, milestones, KPIs and quality checks
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Execution = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  function severityClass(sev) {
    switch ((sev || '').toLowerCase()) {
      case 'critical': return 'var(--danger)';
      case 'major': return 'var(--warning)';
      case 'minor': return 'var(--info)';
      default: return 'var(--text-muted)';
    }
  }
  function statusBadge(status) {
    if (status === 'Resolved') return 'badge-success';
    if (status === 'In Progress') return 'badge-warning';
    return 'badge-danger';
  }

  function render(container) {
    const S = store().state;

    const totalMs = S.timeline.reduce((s, p) => s + p.milestones.length, 0);
    const doneMs = S.timeline.reduce((s, p) => s + p.milestones.filter(m => m.done).length, 0);
    const overall = Math.round((doneMs / (totalMs || 1)) * 100);
    const phasesDone = S.timeline.filter(p => p.status === 'done').length;
    const openQc = S.qc.filter(q => q.status !== 'Resolved').length;
    const activePhase = S.timeline.find(p => p.status === 'active') || S.timeline[S.timeline.length - 1];

    const phasesHtml = S.timeline.map(p => {
      const done = p.milestones.filter(m => m.done).length;
      const msHtml = p.milestones.map((m, i) => `
        <div class="milestone ${m.done ? 'done' : ''}" data-phase="${p.id}" data-ms="${i}">
          <div class="ms-check">${ic('check')}</div>
          <span class="ms-label">${esc(m.label)}</span>
        </div>`).join('');
      return `
        <div class="phase ${p.status}">
          <div class="phase-rail">
            <div class="phase-dot">${p.status === 'done' ? ic('check') : ''}</div>
            <div class="phase-line"></div>
          </div>
          <div class="phase-body">
            <div class="phase-title">
              <span class="pt-name">${esc(p.name)}</span>
              <span class="pt-date">${esc(p.start)} – ${esc(p.end)}</span>
            </div>
            <div class="phase-progress"><div style="width:${p.progress}%"></div></div>
            <div class="flex between" style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-muted);">
              <span>${done}/${p.milestones.length} milestones</span>
              <span>${p.progress}%</span>
            </div>
            <div class="milestones">${msHtml}</div>
          </div>
        </div>`;
    }).join('');

    const qcHtml = S.qc.map(q => `
      <div class="qc-item">
        <div class="qc-sev" style="background:${severityClass(q.severity)}"></div>
        <div class="qc-info">
          <div class="qc-title">${esc(q.title)}</div>
          <div class="qc-meta">${esc(q.trade)} • ${esc(q.severity)} • reported ${esc(q.date)}</div>
        </div>
        <span class="badge ${statusBadge(q.status)}">${esc(q.status)}</span>
        <div style="display:flex;gap:6px;">
          ${q.status !== 'Resolved' ? `<button class="btn btn-secondary btn-sm" data-resolve="${q.id}">Resolve</button>` : ''}
        </div>
      </div>`).join('');

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <h1 class="serif">Execution Dockets</h1>
            <p>Track every phase, sign off milestones, and run quality checks — from demolition to handover.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="exec-snag">${ic('alert')} Log QC Issue</button>
            <button class="btn btn-primary btn-sm" id="exec-handover">${ic('check')} Handover Checklist</button>
          </div>
        </div>

        <div class="kpi-row anim anim-1" style="margin-bottom:20px;">
          <div class="kpi"><div class="k-label">Overall progress</div><div class="k-val">${overall}%</div></div>
          <div class="kpi"><div class="k-label">Phases complete</div><div class="k-val">${phasesDone}/${S.timeline.length}</div></div>
          <div class="kpi"><div class="k-label">Open QC items</div><div class="k-val">${openQc}</div></div>
          <div class="kpi"><div class="k-label">Current phase</div><div class="k-val" style="font-size:16px;">${esc(activePhase ? activePhase.name : '—')}</div></div>
        </div>

        <div class="docket-layout">
          <div class="card anim anim-2">
            <div class="card-head">
              <div><div class="card-title">Project Timeline</div><div class="card-sub">7 phases • 15 Sep → 20 Dec</div></div>
              <div class="badge badge-info">${overall}% complete</div>
            </div>
            <div class="timeline">${phasesHtml}</div>
          </div>

          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="card anim anim-2">
              <div class="card-head">
                <div><div class="card-title">Quality Check</div><div class="card-sub">Site inspection & snag list</div></div>
                <div class="badge ${openQc ? 'badge-danger' : 'badge-success'}">${openQc} open</div>
              </div>
              <div class="qc-list">${qcHtml || '<div class="empty"><p>No QC issues logged.</p></div>'}</div>
            </div>

            <div class="card anim anim-3">
              <div class="card-head"><div><div class="card-title">Today's Docket</div><div class="card-sub">Site work log</div></div></div>
              <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
                <div style="display:flex;gap:10px;"><span class="badge badge-neutral nowrap">09:30</span><span>Civil team on site — chase work for electrical points in living room.</span></div>
                <div style="display:flex;gap:10px;"><span class="badge badge-neutral nowrap">12:00</span><span>Waterproofing applied in master bathroom; 24h curing started.</span></div>
                <div style="display:flex;gap:10px;"><span class="badge badge-neutral nowrap">16:15</span><span>Material delivery: 18 sheets BWP ply for kitchen carcass.</span></div>
              </div>
              <div class="hr"></div>
              <div style="display:flex;align-items:center;gap:10px;color:var(--text-secondary);font-size:12.5px;">
                ${ic('sparkles')} <span>Planex AI flags: kitchen carcass needs 3-day climate acclimatisation before install.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.milestone').forEach(el => {
      el.addEventListener('click', () => {
        store().toggleMilestone(el.getAttribute('data-phase'), Number(el.getAttribute('data-ms')));
        window.PlanexApp.renderView();
      });
    });

    container.querySelectorAll('[data-resolve]').forEach(btn => {
      btn.addEventListener('click', () => {
        store().setQcStatus(btn.getAttribute('data-resolve'), 'Resolved');
        window.PlanexUI.toast('QC item marked as resolved.');
        window.PlanexApp.renderView();
      });
    });

    container.querySelector('#exec-snag').addEventListener('click', snagDialog);
    container.querySelector('#exec-handover').addEventListener('click', handoverDialog);
  }

  function snagDialog() {
    window.PlanexUI.modal('Log QC Issue', `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="field"><label>Issue description</label><input class="input" id="snag-title" placeholder="e.g. Skirting gap in master bedroom"></div>
        <div class="field-row">
          <div class="field"><label>Trade</label>
            <select class="select" id="snag-trade"><option>Civil</option><option>Painting</option><option>Joinery</option><option>Plumbing</option><option>Electrical</option><option>Tiling</option></select>
          </div>
          <div class="field"><label>Severity</label>
            <select class="select" id="snag-sev"><option>Minor</option><option>Major</option><option>Critical</option><option>Cosmetic</option></select>
          </div>
        </div>
        <button class="btn btn-primary btn-block" id="snag-save">Log Issue</button>
      </div>
    `);
    document.querySelector('#snag-save').addEventListener('click', () => {
      const title = (document.querySelector('#snag-title').value || '').trim();
      if (!title) { window.PlanexUI.toast('Please describe the issue.'); return; }
      window.PlanexStore.state.qc.unshift({
        id: 'q-' + Date.now(),
        title,
        trade: document.querySelector('#snag-trade').value,
        severity: document.querySelector('#snag-sev').value,
        status: 'Open',
        date: new Date().toISOString().slice(0, 10)
      });
      window.PlanexStore.commit();
      window.PlanexUI.closeModal();
      window.PlanexApp.renderView();
      window.PlanexUI.toast('QC issue logged.');
    });
  }

  function handoverDialog() {
    const items = [
      'All works completed as per approved docket',
      'Snag list resolved and verified',
      'Electrical points tested & labelled',
      'Plumbing leak test passed',
      'Modular units aligned and lubricated',
      'Paint touch-ups done',
      'Deep cleaning completed',
      'Client walkthrough & sign-off'
    ];
    window.PlanexUI.modal('Handover Checklist', `
      <p class="muted text-sm" style="margin-bottom:14px;">Confirm each item before final handover to the client.</p>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${items.map((t, i) => `
          <label style="display:flex;gap:10px;align-items:center;padding:9px 10px;border:1px solid var(--border);border-radius:10px;cursor:pointer;">
            <input type="checkbox" style="width:16px;height:16px;">
            <span style="font-size:13px;">${t}</span>
          </label>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="window.PlanexUI.toast('Handover checklist saved.');window.PlanexUI.closeModal();">Save Checklist</button>
    `);
  }

  return { render };
})();
