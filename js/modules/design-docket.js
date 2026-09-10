/* ============================================================
   Planex — Design Docket Tab
   The execution-grade docket SET: furniture, kitchen, wardrobe,
   lighting, ceiling, paint, flooring, electrical, plumbing,
   doors, wall finishes, HVAC and site/handover.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.DesignDocket = (function () {
  let selectedId = 'furniture';
  let currentUnits = [];

  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function money(n) { return store().formatMoney(n || 0); }

  function current() {
    const set = store().state.docketSet;
    if (!set) return null;
    return set.dockets.filter(function (d) { return d.id === selectedId; })[0] || set.dockets[0];
  }

  function sectionTable(d, s) {
    const head = s.columns.map(function (c) { return `<th>${esc(c)}</th>`; }).join('');
    const body = s.rows.length
      ? s.rows.map(function (row, ri) {
          const cells = s.columns.map(function (col, ci) {
            const val = row[ci] == null ? '' : row[ci];
            return `<td data-label="${esc(col)}"><input class="dcell" value="${esc(val)}" data-dcell="${d.id}:${s.key}:${ri}:${ci}" title="${esc(col)}"></td>`;
          }).join('');
          return `<tr>${cells}</tr>`;
        }).join('')
      : `<tr><td colspan="${s.columns.length}" class="muted">No rows — generate the scope first.</td></tr>`;
    return `
      <div class="docket-section">
        <div class="docket-section-title">${esc(s.title)}</div>
        <div style="overflow-x:auto;"><table class="docket-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
      </div>`;
  }

  function unitSourceSection(d) {
    const map = { furniture: 'units', wardrobe: 'wardrobes', kitchen: 'cabinets' };
    return map[d.id] || null;
  }

  function shopDrawings(d) {
    const key = unitSourceSection(d);
    if (!key || !window.PlanexDetailEngine) return '';
    const s = d.sections.filter(function (x) { return x.key === key; })[0];
    if (!s || !s.rows.length) return '';

    const markIdx = s.columns.findIndex(function (c) { return /^mark$/i.test(c); });
    const nameIdx = s.columns.findIndex(function (c) { return /unit|type/i.test(c); });
    const sizeIdx = s.columns.findIndex(function (c) { return /size|spec/i.test(c); });
    currentUnits = s.rows.map(function (r) {
      return {
        mark: markIdx >= 0 ? r[markIdx] : '',
        name: nameIdx >= 0 ? r[nameIdx] : 'Unit',
        size: sizeIdx >= 0 ? r[sizeIdx] : ''
      };
    }).filter(function (u) { return u.name && u.name !== 'Unit'; });

    if (!currentUnits.length) return '';
    return `
      <div class="docket-section">
        <div class="docket-section-title">Shop Drawings — Elevation &amp; Section</div>
        <p class="muted text-sm" style="margin-bottom:10px;">Indicative coordination drawings generated from the schedule (dimensions in mm). Verify on site before fabrication.</p>
        <div class="detail-grid">
          ${currentUnits.map(function (u, i) {
            return `
              <div class="detail-card">
                <div class="detail-head">${esc(u.mark ? u.mark + ' · ' : '')}${esc(u.name)}</div>
                <div class="detail-canvas"><canvas data-elev="${i}"></canvas></div>
                <div class="detail-canvas"><canvas data-sect="${i}"></canvas></div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  function drawDetails(container) {
    if (!window.PlanexDetailEngine) return;
    container.querySelectorAll('[data-elev]').forEach(function (cv) {
      const u = currentUnits[Number(cv.getAttribute('data-elev'))];
      if (u) window.PlanexDetailEngine.drawUnit(cv, u);
    });
    container.querySelectorAll('[data-sect]').forEach(function (cv) {
      const u = currentUnits[Number(cv.getAttribute('data-sect'))];
      if (u) window.PlanexDetailEngine.drawSection(cv, u);
    });
  }

  function documentView(d) {
    if (!d) return '<p class="muted">No docket selected.</p>';
    const refs = d.refs || {};
    return `
      <div class="docket-doc">
        <div class="docket-doc-head">
          <div>
            <h2 class="serif" style="font-size:22px;">${esc(d.name)}</h2>
            <p class="muted text-sm">${esc(d.purpose)}</p>
            <div class="docket-meta">
              <span class="badge badge-neutral">Trade: ${esc(d.trade)}</span>
              ${d.provisional ? '<span class="badge badge-warning">Provisional — plan not validated</span>' : '<span class="badge badge-success">Plan validated</span>'}
              ${d.ai ? '<span class="badge badge-info">AI enriched</span>' : ''}
              <span class="badge badge-neutral">Scope: ${(refs.scopePackages || []).join(', ')}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="dk-print">${ic('print')} Print / PDF</button>
            <button class="btn btn-primary btn-sm" id="dk-enrich">${ic('sparkles')} ${d.ai ? 'Re-enrich' : 'Enrich with AI'}</button>
          </div>
        </div>
        ${d.sections.map(function (s) { return sectionTable(d, s); }).join('')}
        ${shopDrawings(d)}
        ${d.notes && d.notes.length ? `
          <div class="docket-section">
            <div class="docket-section-title">Expert Notes</div>
            <ul class="docket-notes">${d.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('')}</ul>
          </div>` : ''}
        ${d.ai && d.ai.notes ? `
          <div class="docket-section">
            <div class="docket-section-title">AI Enrichment Notes</div>
            <p class="text-sm">${esc(d.ai.notes)}</p>
          </div>` : ''}
        <div class="docket-foot">Prepared by Planex AI · ${esc(new Date().toLocaleString())} · Plan revision ${esc(d.refs && d.refs.planRevision || '—')} · Quantities per the Scope of Work</div>
      </div>`;
  }

  function render(container) {
    const S = store().state;
    const set = S.docketSet;
    const d = set ? current() : null;

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <h1 class="serif">Design Docket</h1>
            <p>Execution dockets for the site agency and suppliers — furniture, lighting, ceiling, paint and every trade.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="dk-generate">${ic('docket')} ${set ? 'Regenerate dockets' : 'Generate dockets'}</button>
            ${set ? `<button class="btn btn-secondary btn-sm" id="dk-print-all">${ic('print')} Print pack</button>` : ''}
          </div>
        </div>

        ${!set ? `
          <div class="empty anim anim-1">
            <div class="empty-icon">${ic('docket')}</div>
            <p>Generate the dockets from your <strong>Scope of Work</strong>. Each trade gets its own schedule — quantities come straight from the scope.</p>
          </div>` : `
          <div class="card anim anim-1">
            <div class="card-head">
              <div>
                <div class="card-title">Docket set</div>
                <div class="card-sub">${set.dockets.length} dockets · ${esc(set.projectType)} · ${esc(set.quality)} · generated ${esc(new Date(set.generatedAt).toLocaleDateString())}</div>
              </div>
              <span class="badge ${set.planValidated ? 'badge-success' : 'badge-warning'}">${set.planValidated ? 'Plan validated' : 'Provisional'}</span>
            </div>
            <div class="docket-rail">
              ${set.dockets.map(function (x) {
                const rows = x.sections.reduce(function (n, s) { return n + s.rows.length; }, 0);
                return `<button class="docket-chip ${x.id === d.id ? 'active' : ''}" data-dk="${x.id}">
                  <span>${esc(x.name.replace(' Docket', ''))}</span>
                  <span class="faint text-xs">${rows}</span>${x.ai ? ' <span class="dot" style="background:var(--info)"></span>' : ''}
                </button>`;
              }).join('')}
            </div>
          </div>

          ${documentView(d)}
        `}

        ${floorplanSection()}
        ${rendersSection()}
        ${costingLink()}
      </div>
    `;

    bind(container);
  }

  function floorplanSection() {
    const S = store().state;
    const fp = S.floorplan;
    return `
      <div class="section-label anim anim-3">Floor Plan</div>
      <div class="card anim anim-3">
        <div class="card-head">
          <div><div class="card-title">${fp ? esc(fp.name) : 'No floor plan yet'}</div>
          <div class="card-sub">${fp ? 'Shared with the Project and Scope tabs' : 'Upload it in the Project tab'}</div></div>
          <div class="badge badge-neutral">shared plan</div>
        </div>
        ${fp ? `<div class="plan-preview"><img src="${fp.dataUrl}" alt="Floor plan" data-lightbox="${fp.dataUrl}"></div>`
             : `<p class="muted text-sm">Upload it in the <strong>Project</strong> tab.</p>`}
      </div>`;
  }

  function rendersSection() {
    const S = store().state;
    if (!S.renders || !S.renders.length) return '';
    return `
      <div class="section-label anim anim-3">Concept Renders</div>
      <div class="card anim anim-3">
        <div class="card-head"><div><div class="card-title">Generated Concepts</div><div class="card-sub">AI renders from your Planex AI conversations</div></div><div class="badge badge-neutral">${S.renders.length}</div></div>
        <div class="renders-grid">
          ${S.renders.map(function (r) { return `<img class="render-thumb" src="${r.dataUrl}" alt="Concept render" data-lightbox="${r.dataUrl}" title="${esc(r.prompt || '')}">`; }).join('')}
        </div>
      </div>`;
  }

  function costingLink() {
    return `
      <div class="section-label anim anim-3">Costing</div>
      <div class="card anim anim-3">
        <div class="card-head">
          <div><div class="card-title">Costing &amp; BOQ</div>
          <div class="card-sub">Line-item costing lives in its own tab so dockets stay about execution.</div></div>
          <button class="btn btn-primary btn-sm" id="dk-costing">${ic('rupee')} Open Costing</button>
        </div>
      </div>`;
  }

  function bind(container) {
    const gen = container.querySelector('#dk-generate');
    if (gen) gen.addEventListener('click', generateDockets);

    const costingBtn = container.querySelector('#dk-costing');
    if (costingBtn) costingBtn.addEventListener('click', function () { window.PlanexApp.navigate('costing'); });

    const printAll = container.querySelector('#dk-print-all');
    if (printAll) printAll.addEventListener('click', function () { window.print(); });

    container.querySelectorAll('[data-dk]').forEach(function (b) {
      b.addEventListener('click', function () {
        selectedId = b.getAttribute('data-dk');
        window.PlanexApp.renderView();
      });
    });

    const print = container.querySelector('#dk-print');
    if (print) print.addEventListener('click', function () { window.print(); });

    const enrich = container.querySelector('#dk-enrich');
    if (enrich) enrich.addEventListener('click', enrichCurrent);

    container.querySelectorAll('[data-dcell]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        const p = inp.getAttribute('data-dcell').split(':');
        store().updateDocketCell(p[0], p[1], Number(p[2]), Number(p[3]), inp.value);
      });
    });

    container.querySelectorAll('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () { window.PlanexUI.lightbox(el.getAttribute('data-lightbox')); });
    });

    drawDetails(container);
  }

  function generateDockets() {
    if (!store().state.scopeDoc) {
      window.PlanexUI.toast('Build the Scope of Work first — dockets derive from it.');
      window.PlanexApp.navigate('scope');
      return;
    }
    const S = store().state;
    const set = window.PlanexDocketEngine.buildDocketSet({
      scopeDoc: S.scopeDoc,
      rooms: S.rooms,
      plan: S.floorplan,
      quality: S.scopeQuality || 'standard',
      projectType: (S.project && S.project.projectType) || 'ready'
    });
    store().setDocketSet(set);
    window.PlanexUI.toast('Generated ' + set.dockets.length + ' dockets.');
    window.PlanexApp.renderView();
  }

  async function enrichCurrent() {
    const set = store().state.docketSet;
    const d = current();
    if (!d) return;
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) { window.PlanexUI.toast('AI enrichment needs the hosted assistant.'); return; }
    if (d.ai) {
      const ok = await window.PlanexUI.confirm('Re-enrich this docket? This replaces AI-filled values.', { title: 'Re-enrich docket' });
      if (!ok) return;
    }

    const btn = document.querySelector('#dk-enrich');
    const prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Enriching…'; }

    try {
      const S = store().state;
      const res = await window.PlanexAIClient.enrichDocket(
        { id: d.id, name: d.name, sections: d.sections },
        { projectType: set.projectType, quality: set.quality, brief: S.context }
      );
      if (res && res.enrichment) {
        store().mergeDocketEnrichment(d.id, res.enrichment);
        window.PlanexUI.toast('Docket enriched with India-market specs.');
        window.PlanexApp.renderView();
        return;
      }
      window.PlanexUI.toast('No enrichment returned.');
    } catch (e) {
      window.PlanexUI.toast('Enrichment failed (' + (e && e.status ? e.status : 'network') + ').');
    }
    if (btn) { btn.disabled = false; btn.textContent = prev; }
  }

  return { render: render };
})();
