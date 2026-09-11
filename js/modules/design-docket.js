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
  let currentLayoutRooms = [];
  let selectedSheet = 'main';
  let sheetZoom = 1;

  const SHEET_LIST = [
    { k: 'main', no: 'A-01', name: 'Main Layout' },
    { k: 'furniture', no: 'A-02', name: 'Furniture' },
    { k: 'ceiling', no: 'A-03', name: 'Ceiling' },
    { k: 'lighting', no: 'A-04', name: 'Lighting' }
  ];

  function drawingsSection() {
    const S = store().state;
    const plan = S.plan;
    const act = store().activeSpace ? store().activeSpace() : null;
    const notes = S.sheetNotes[selectedSheet];
    return `
      <div class="section-label anim anim-1">Design Docket — Drawings</div>
      <div class="card anim anim-1">
        <div class="card-head">
          <div>
            <div class="card-title">Drawing set ${act ? '<span class="badge badge-gold" style="margin-left:6px;">' + esc(act.name) + '</span>' : ''}</div>
            <div class="card-sub">${plan
              ? plan.rooms.length + ' rooms · ' + Math.round(plan.widthM * 1000) + ' × ' + Math.round(plan.heightM * 1000) + ' mm envelope · indicative setting-out'
              : 'Generate the plan footprint to create the sheets'}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="dw-gen">${ic('plan')} ${plan ? 'Regenerate plan' : 'Generate plan'}</button>
            ${plan ? `<button class="btn btn-secondary btn-sm" id="dw-notes">${ic('sparkles')} ${notes ? 'Re-run design notes' : 'Design notes (AI)'}</button>` : ''}
            ${plan ? `<button class="btn btn-secondary btn-sm" id="dw-print">${ic('print')} Print set</button>` : ''}
          </div>
        </div>
        ${plan ? `
          <div class="sheet-rail">
            ${SHEET_LIST.map(function (s) {
              return `<button class="docket-chip ${s.k === selectedSheet ? 'active' : ''}" data-sheet="${s.k}"><span>${s.no}</span><span>${esc(s.name)}</span></button>`;
            }).join('')}
          </div>
          <div class="sheet-toolbar">
            <span class="faint text-xs">Zoom</span>
            <button class="btn btn-ghost btn-sm" data-zoom="out">−</button>
            <span class="faint text-xs" id="zoom-val">${Math.round(sheetZoom * 100)}%</span>
            <button class="btn btn-ghost btn-sm" data-zoom="in">+</button>
            <button class="btn btn-ghost btn-sm" data-zoom="fit">Fit</button>
            <span class="faint text-xs" style="margin-left:auto;">${esc((window.PlanexDrawingEngine && window.PlanexDrawingEngine.SHEETS[selectedSheet].title) || '')}</span>
          </div>
          <div class="sheet-scroll">
            <div class="sheet-canvas" id="sheet-canvas-wrap"><canvas id="sheet-canvas"></canvas></div>
          </div>
          ${notes
            ? `<div class="sheet-notes"><div class="docket-section-title">Design Intent</div>
                 <ul class="docket-notes">${(notes.notes || []).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('')}</ul></div>`
            : `<p class="muted text-sm sheet-notes-hint">Add design notes (AI) for setting-out, furniture, ceiling and lighting rationale.</p>`}
        ` : `<p class="muted text-sm">The drawing set needs a plan footprint — generate it from your validated rooms.</p>`}
      </div>`;
  }

  function drawSheets(container) {
    const cv = container.querySelector('#sheet-canvas');
    if (!cv || !window.PlanexDrawingEngine) return;
    const S = store().state;
    if (!S.plan) return;
    window.PlanexDrawingEngine.drawSheet(cv, selectedSheet, S.plan, {
      project: S.project.name,
      date: new Date().toLocaleDateString(),
      revision: 'P0',
      provisional: !(S.floorplan && S.floorplan.validated),
      units: (selectedSheet === 'furniture' ? currentUnits : null)
    });
    cv.style.transformOrigin = 'top left';
    cv.style.transform = sheetZoom === 1 ? 'none' : 'scale(' + sheetZoom + ')';
  }

  function layoutKind(d) {
    if (d.id === 'lighting') return 'lighting';
    if (d.id === 'electrical') return 'electrical';
    if (d.id === 'plumbing') return 'plumbing';
    return null;
  }
  function layoutRooms(kind) {
    let rooms = store().state.rooms || [];
    const sp = store().activeSpace ? store().activeSpace() : null;
    if (sp) rooms = rooms.filter(function (r) { return r.id === sp.id; });
    if (kind === 'plumbing') {
      rooms = rooms.filter(function (r) { return /bath|wc|toilet|kitchen|utility|balcony/i.test(r.name); });
    }
    return rooms;
  }
  function layoutSection(d) {
    const kind = layoutKind(d);
    if (!kind || !window.PlanexLayoutEngine) return '';
    const rooms = layoutRooms(kind);
    if (!rooms.length) return '';
    currentLayoutRooms = rooms;
    const title = kind === 'lighting' ? 'Lighting Layouts' : kind === 'electrical' ? 'Electrical Layouts' : 'Sanitary Layouts';
    return `
      <div class="docket-section">
        <div class="docket-section-title">${title}</div>
        <p class="muted text-sm" style="margin-bottom:10px;">Indicative ${kind} layout per room — symbols keyed to this docket's schedule. ${esc(window.PlanexLayoutEngine.legend(kind))}</p>
        <div class="detail-grid">
          ${rooms.map(function (r, i) {
            return `<div class="detail-card"><div class="detail-head">${esc(r.name)}</div><div class="detail-canvas"><canvas data-lay="${kind}:${i}"></canvas></div></div>`;
          }).join('')}
        </div>
      </div>`;
  }

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
    const sp = store().activeSpace ? store().activeSpace() : null;
    const nm = sp ? sp.name.toLowerCase() : '';
    const indexed = s.rows.map(function (row, i) { return { row: row, i: i }; });
    const shown = sp
      ? indexed.filter(function (x) {
          return x.row.some(function (c) { return String(c).toLowerCase().indexOf(nm) >= 0; });
        })
      : indexed;
    const head = s.columns.map(function (c) { return `<th>${esc(c)}</th>`; }).join('');
    const body = shown.length
      ? shown.map(function (x) {
          const row = x.row, ri = x.i;
          const cells = s.columns.map(function (col, ci) {
            const val = row[ci] == null ? '' : row[ci];
            return `<td data-label="${esc(col)}"><input class="dcell" value="${esc(val)}" data-dcell="${d.id}:${s.key}:${ri}:${ci}" title="${esc(col)}"></td>`;
          }).join('');
          return `<tr>${cells}</tr>`;
        }).join('')
      : `<tr><td colspan="${s.columns.length}" class="muted">${sp ? 'No rows for ' + esc(sp.name) + ' — generate the scope or switch to All spaces.' : 'No rows — generate the scope first.'}</td></tr>`;
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
        size: sizeIdx >= 0 ? r[sizeIdx] : '',
        shutters: 2,
        drawers: 1
      };
    }).filter(function (u) { return u.name && u.name !== 'Unit'; });

    const quality = store().state.scopeQuality || 'standard';
    if (!currentUnits.length) return '';
    return `
      <div class="docket-section">
        <div class="docket-section-title">Unit Details — Elevation · Internal · Section</div>
        <p class="muted text-sm" style="margin-bottom:10px;">Front elevation, internal elevation and side section per unit (mm), with hardware and finish schedules. Verify on site before fabrication.</p>
        ${currentUnits.map(function (u, i) {
          const spec = window.PlanexFurnitureSpec;
          const kk = spec ? spec.kindOf(u.name) : 'generic';
          const hw = spec ? spec.hardwareFor(kk, u.shutters, u.drawers) : [];
          const fin = spec ? spec.finishFor(kk, quality) : [];
          return `
            <div class="unit-page">
              <div class="unit-page-head">
                <div>
                  <span class="unit-mark">${esc(u.mark || ('FU' + (i + 1)))}</span>
                  <strong>${esc(u.name)}</strong>
                  ${u.space ? `<span class="faint">· ${esc(u.space)}</span>` : ''}
                </div>
                <span class="faint text-xs">${esc(u.size || '')}</span>
              </div>
              <div class="detail-grid">
                <div class="detail-card"><div class="detail-canvas"><canvas data-elev="${i}"></canvas></div></div>
                <div class="detail-card"><div class="detail-canvas"><canvas data-int="${i}"></canvas></div></div>
                <div class="detail-card"><div class="detail-canvas"><canvas data-sect="${i}"></canvas></div></div>
              </div>
              <div class="docket-layout" style="margin-top:10px;">
                <div class="card">
                  <div class="docket-section-title">Data sheet</div>
                  <table class="scope-table"><tbody>
                    <tr><td>Carcass</td><td>${esc(u.carcass || '18mm BWP ply')}</td></tr>
                    <tr><td>Shutter</td><td>${esc(u.shutter || '')}</td></tr>
                    <tr><td>Finish</td><td>${esc(u.finish || '')}</td></tr>
                    <tr><td>Edge band</td><td>2mm PVC matching</td></tr>
                    <tr><td>Back panel</td><td>6mm ply + laminate</td></tr>
                  </tbody></table>
                </div>
                <div class="card">
                  <div class="docket-section-title">Hardware schedule</div>
                  <table class="scope-table"><thead><tr><th>Item</th><th>Make</th><th class="num">Qty</th></tr></thead><tbody>
                    ${hw.map(function (h) { return `<tr><td>${esc(h.item)}</td><td>${esc(h.spec)}</td><td class="num">${h.qty} ${esc(h.unit)}</td></tr>`; }).join('')}
                  </tbody></table>
                </div>
              </div>
              <div class="card" style="margin-top:10px;">
                <div class="docket-section-title">Finish schedule</div>
                <table class="scope-table"><thead><tr><th>Surface</th><th>Material</th><th>Shade</th><th>Sheen</th></tr></thead><tbody>
                  ${fin.map(function (f) { return `<tr><td>${esc(f.surface)}</td><td>${esc(f.material)}</td><td>${esc(f.shade)}</td><td>${esc(f.sheen)}</td></tr>`; }).join('')}
                </tbody></table>
              </div>
            </div>`;
        }).join('')}
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
    container.querySelectorAll('[data-int]').forEach(function (cv) {
      const u = currentUnits[Number(cv.getAttribute('data-int'))];
      if (u) window.PlanexDetailEngine.drawInternals(cv, u);
    });
    container.querySelectorAll('[data-lay]').forEach(function (cv) {
      const p = cv.getAttribute('data-lay').split(':');
      const room = currentLayoutRooms[Number(p[1])];
      if (room && window.PlanexLayoutEngine) window.PlanexLayoutEngine.draw(cv, p[0], room);
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
            ${d.id === 'furniture' ? `<button class="btn btn-secondary btn-sm" id="dk-print-furniture">${ic('print')} Furniture pack</button>` : ''}
            <button class="btn btn-secondary btn-sm" id="dk-print">${ic('print')} Print / PDF</button>
            <button class="btn btn-primary btn-sm" id="dk-enrich">${ic('sparkles')} ${d.ai ? 'Re-enrich' : 'Enrich with AI'}</button>
          </div>
        </div>
        ${d.sections.map(function (s) { return sectionTable(d, s); }).join('')}
        ${shopDrawings(d)}
        ${layoutSection(d)}
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

        ${drawingsSection()}

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
    const printFurn = container.querySelector('#dk-print-furniture');
    if (printFurn) printFurn.addEventListener('click', function () { window.print(); });

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
    drawSheets(container);

    // Drawing set controls
    const dwGen = container.querySelector('#dw-gen');
    if (dwGen) dwGen.addEventListener('click', function () {
      store().regeneratePlan();
      window.PlanexUI.toast('Plan footprint generated.');
      window.PlanexApp.renderView();
    });
    container.querySelectorAll('[data-sheet]').forEach(function (b) {
      b.addEventListener('click', function () { selectedSheet = b.getAttribute('data-sheet'); window.PlanexApp.renderView(); });
    });
    container.querySelectorAll('[data-zoom]').forEach(function (b) {
      b.addEventListener('click', function () {
        const dir = b.getAttribute('data-zoom');
        if (dir === 'in') sheetZoom = Math.min(2.5, sheetZoom + 0.2);
        else if (dir === 'out') sheetZoom = Math.max(0.6, sheetZoom - 0.2);
        else sheetZoom = 1;
        window.PlanexApp.renderView();
      });
    });
    const dwNotes = container.querySelector('#dw-notes');
    if (dwNotes) dwNotes.addEventListener('click', sheetNotes);
    const dwPrint = container.querySelector('#dw-print');
    if (dwPrint) dwPrint.addEventListener('click', function () { window.print(); });
  }

  async function sheetNotes() {
    const S = store().state;
    if (!S.plan) return;
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) { window.PlanexUI.toast('Design notes need the hosted assistant.'); return; }
    const btn = document.querySelector('#dw-notes');
    const prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Writing notes…'; }
    try {
      const res = await window.PlanexAIClient.planSheets({
        rooms: S.plan.rooms.map(function (r) { return { name: r.name, kind: r.kind, length: r.length, width: r.width, areaM2: r.areaM2 }; }),
        envelope: { widthM: S.plan.widthM, heightM: S.plan.heightM },
        projectType: (S.project && S.project.projectType) || 'ready',
        quality: S.scopeQuality || 'standard',
        brief: S.context
      });
      if (res && res.sheets) {
        ['main', 'furniture', 'ceiling', 'lighting'].forEach(function (k) {
          if (res.sheets[k]) store().setSheetNotes(k, res.sheets[k]);
        });
        window.PlanexUI.toast('Design intent notes added.');
        window.PlanexApp.renderView();
        return;
      }
      window.PlanexUI.toast('No notes returned.');
    } catch (e) {
      window.PlanexUI.toast('Design notes failed (' + (e && e.status ? e.status : 'network') + ').');
    }
    if (btn) { btn.disabled = false; btn.textContent = prev; }
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
