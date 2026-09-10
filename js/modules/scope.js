/* ============================================================
   Planex — Scope Tab
   WHAT gets done. Indicative only — no rates, no line-item money.
   Firm costing lives in the Costing tab.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Scope = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function compact(n) { return store().formatCompact(n || 0); }

  function lib() { return window.PlanexScopeData; }

  function roomScoped(doc) { return doc.packages.filter(function (p) { return p.scope === 'room'; }); }
  function projectScoped(doc) { return doc.packages.filter(function (p) { return p.scope === 'project'; }); }

  function cellState(pkg, roomName) {
    const acts = pkg.activities.filter(function (a) { return a.room === roomName; });
    if (!acts.length) return 'na';
    return acts.some(function (a) { return a.included !== false; }) ? 'in' : 'out';
  }
  function toggleCell(pkg, roomName) {
    const acts = pkg.activities.filter(function (a) { return a.room === roomName; });
    const on = acts.some(function (a) { return a.included !== false; });
    acts.forEach(function (a) { a.included = !on; });
  }
  function projectState(pkg) {
    return pkg.activities.some(function (a) { return a.included !== false; }) ? 'in' : 'out';
  }
  function toggleProject(pkg) {
    const on = pkg.activities.some(function (a) { return a.included !== false; });
    pkg.activities.forEach(function (a) { a.included = !on; });
  }

  function matrix(doc) {
    const rooms = (doc.area && doc.area.rooms) || [];
    const pkgs = roomScoped(doc);
    if (!rooms.length || !pkgs.length) return '<p class="muted text-sm">No room-scoped packages.</p>';
    const head = pkgs.map(function (p) { return `<th title="${esc(p.name)}">${esc(shortName(p.name))}</th>`; }).join('');
    const body = rooms.map(function (room) {
      const cells = pkgs.map(function (p) {
        const st = cellState(p, room.name);
        if (st === 'na') return '<td class="mx-na">·</td>';
        return `<td><button class="mx-cell ${st}" data-mx="${esc(p.id)}|${esc(room.name)}">${st === 'in' ? '✓' : '✗'}</button></td>`;
      }).join('');
      return `<tr><th class="mx-room">${esc(room.name)}</th>${cells}</tr>`;
    }).join('');
    const proj = projectScoped(doc);
    const projRow = proj.length ? `
      <tr class="mx-projrow"><th class="mx-room">Project-wide</th>${pkgs.map(function () { return '<td class="mx-na">·</td>'; }).join('')}</tr>` : '';
    return `
      <div style="overflow-x:auto;">
        <table class="mx-table"><thead><tr><th class="mx-room">Room</th>${head}</tr></thead><tbody>${body}</tbody></table>
      </div>
      ${proj.length ? `<div class="mx-projectwide"><span class="faint text-xs">Project-wide</span> ${proj.map(function (p) {
        const st = projectState(p);
        return `<button class="mx-pill ${st}" data-mxp="${esc(p.id)}">${st === 'in' ? '✓' : '✗'} ${esc(p.name)}</button>`;
      }).join('')}</div>` : ''}`;
  }

  function shortName(n) {
    return String(n)
      .replace('Demolition & Debris', 'Demo')
      .replace('Civil & Masonry', 'Civil')
      .replace('Wall Finishes & Cladding', 'Walls')
      .replace('Painting & Polishing', 'Paint')
      .replace('False Ceiling', 'Ceiling')
      .replace('Electrical & Wiring', 'Elec')
      .replace('Modular & Joinery (Millwork)', 'Joinery')
      .replace('Wardrobe Internals', 'Wardrobe')
      .replace('Plumbing & Sanitary (WC)', 'Plumbing')
      .replace('Bathroom Systems', 'Bath')
      .replace('Kitchen Systems', 'Kitchen')
      .replace('Doors & Windows', 'Doors')
      .replace('Loose Furniture', 'Furniture')
      .replace('Soft Furnishings', 'Soft')
      .replace('Home Automation & Network', 'Automation')
      .replace('HVAC & Ventilation', 'HVAC')
      .replace('Kitchen Gas & Utility', 'Gas')
      .replace('Glass & Mirrors', 'Glass')
      .replace('Safety & Security', 'Safety')
      .replace('Cleaning, Pest Control & Handover', 'Handover')
      .replace('Skirting, Thresholds & Sills', 'Skirting')
      .replace('Waterproofing', 'WP');
  }

  function includedList(doc) {
    return doc.packages.map(function (pkg) {
      const shown = pkg.activities.filter(function (a) { return a.included !== false; });
      if (!shown.length) return '';
      // group by room
      const groups = {};
      shown.forEach(function (a) { const k = a.room || 'Project-wide'; if (!groups[k]) groups[k] = []; groups[k].push(a); });
      const body = Object.keys(groups).map(function (room) {
        return `<div class="inc-room">${esc(room)}</div>` + groups[room].map(function (a) {
          return `<div class="inc-item"><span>${esc(a.name)}</span><span class="faint">${a.qty} ${esc(a.unit)}</span></div>`;
        }).join('');
      }).join('');
      return `
        <details class="scope-pkg">
          <summary><span class="scope-pkg-name">${esc(pkg.name)}</span><span class="scope-pkg-meta">${shown.length} items</span></summary>
          <p class="muted text-sm" style="margin:6px 0 10px;">${esc(pkg.description)}</p>
          ${body}
        </details>`;
    }).join('');
  }

  function band(doc) {
    const t = doc.summary ? doc.summary.total : 0;
    const low = Math.round(t * 0.88), high = Math.round(t * 1.12);
    const tier = (lib().QUALITY.filter(function (q) { return q.id === doc.quality; })[0] || {}).name || doc.quality;
    return `
      <div class="card anim anim-2" style="border-color:var(--border-strong);">
        <div class="card-head">
          <div><div class="card-title">Indicative magnitude</div><div class="card-sub">Not a firm cost — a range to guide decisions</div></div>
          <span class="badge badge-warning">Indicative</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;">
          <div style="font-size:30px;font-weight:750;letter-spacing:-0.03em;">${compact(low)} – ${compact(high)}</div>
          <div class="muted text-sm">${esc(tier)} tier · ${doc.area ? doc.area.totalSqft : 0} sqft</div>
        </div>
        <p class="muted text-sm" style="margin-top:8px;">Firm, line-item costing is produced in <strong>Costing</strong> once you confirm the scope.</p>
      </div>`;
  }

  function render(container) {
    const S = store().state;
    const doc = S.scopeDoc;
    const types = lib().PROJECT_TYPES;
    const qualities = lib().QUALITY;
    const currentType = (S.project && S.project.projectType) || 'ready';
    const planValidated = !!(S.floorplan && S.floorplan.validated);
    const confirmed = !!S.scopeConfirmed;

    const typeButtons = types.map(function (t) {
      return `<button class="chip-toggle ${t.id === currentType ? 'active' : ''}" data-project-type="${t.id}" title="${esc(t.description)}">${esc(t.short)}</button>`;
    }).join('');
    const qualityOptions = qualities.map(function (q) {
      return `<option value="${q.id}" ${q.id === (S.scopeQuality || 'standard') ? 'selected' : ''}>${esc(q.name)}</option>`;
    }).join('');

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h1 class="serif" style="margin:0;">Scope of Work</h1>
              <span class="badge ${confirmed ? 'badge-success' : 'badge-warning'}">${confirmed ? 'Confirmed' : 'Indicative'}</span>
            </div>
            <p>What gets done — room by room, package by package. Indicative only.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="scope-regen">${ic('sparkles')} ${doc ? 'Rebuild' : 'Build scope'}</button>
            ${doc ? `<button class="btn btn-primary btn-sm" id="scope-confirm">${ic('check')} ${confirmed ? 'Go to Costing' : 'Confirm scope'}</button>` : ''}
          </div>
        </div>

        ${!planValidated ? `
        <div class="card anim anim-1" style="border-color:var(--warning);">
          <div style="display:flex;align-items:center;gap:10px;">${ic('alert')}<span>Validate your floor plan in <strong>Project</strong> for plan-specific scope. You can still build from manual areas.</span></div>
        </div>` : ''}

        <div class="card anim anim-1">
          <div class="card-head">
            <div><div class="card-title">Project type</div><div class="card-sub">${esc((types.filter(function (t) { return t.id === currentType; })[0] || types[0]).description)}</div></div>
            <div class="field" style="min-width:150px;"><select class="select" id="scope-quality">${qualityOptions}</select></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">${typeButtons}</div>
        </div>

        ${doc ? `
          <div class="section-label anim anim-1">What's Included — Room × Package</div>
          <div class="card anim anim-1">
            <div class="card-sub" style="margin-bottom:10px;">Tap a cell to include or exclude that package for that room.</div>
            ${matrix(doc)}
          </div>

          ${band(doc)}

          <div class="section-label anim anim-3">Details</div>
          <div class="anim anim-3">${includedList(doc)}</div>
        ` : `
          <div class="empty anim anim-1">
            <div class="empty-icon">${ic('ruler')}</div>
            <p>Set the project type and areas, then <strong>Build scope</strong> to see what's included room by room.</p>
          </div>`}
      </div>
    `;

    bind(container);
  }

  function bind(container) {
    const doc = store().state.scopeDoc;

    container.querySelectorAll('[data-project-type]').forEach(function (el) {
      el.addEventListener('click', function () {
        const next = el.getAttribute('data-project-type');
        const cur = (store().state.project && store().state.project.projectType) || 'ready';
        if (next === cur) return;
        if (store().state.scopeDoc && !confirm('Switching project type rebuilds the scope. Continue?')) return;
        store().setProjectType(next);
        store().regenerateScope();
        window.PlanexUI.toast('Scope rebuilt.');
        window.PlanexApp.renderView();
      });
    });

    const q = container.querySelector('#scope-quality');
    if (q) q.addEventListener('change', function () {
      store().setScopeQuality(q.value);
      if (store().state.scopeDoc) store().regenerateScope();
      window.PlanexApp.renderView();
    });

    const regen = container.querySelector('#scope-regen');
    if (regen) regen.addEventListener('click', function () {
      const fpv = store().state.floorplan && store().state.floorplan.validated;
      if (!fpv && !confirm('The floor plan is not validated. Build from current (unverified) areas anyway?')) return;
      if (store().state.scopeDoc && !confirm('Rebuild the scope? Your include/exclude edits will be replaced.')) return;
      const r = store().regenerateScope();
      if (r) window.PlanexUI.toast('Scope built: ' + r.packages.length + ' work packages.');
      window.PlanexApp.renderView();
    });

    const confirmBtn = container.querySelector('#scope-confirm');
    if (confirmBtn) confirmBtn.addEventListener('click', function () {
      store().confirmScope();
      window.PlanexUI.toast('Scope confirmed. Price it in Costing.');
      window.PlanexApp.navigate('costing');
    });

    // matrix toggles
    container.querySelectorAll('[data-mx]').forEach(function (b) {
      b.addEventListener('click', function () {
        const parts = b.getAttribute('data-mx').split('|');
        const pkg = doc.packages.filter(function (p) { return p.id === parts[0]; })[0];
        if (!pkg) return;
        toggleCell(pkg, parts[1]);
        store().recomputeScope();
        window.PlanexApp.renderView();
      });
    });
    container.querySelectorAll('[data-mxp]').forEach(function (b) {
      b.addEventListener('click', function () {
        const pkg = doc.packages.filter(function (p) { return p.id === b.getAttribute('data-mxp'); })[0];
        if (!pkg) return;
        toggleProject(pkg);
        store().recomputeScope();
        window.PlanexApp.renderView();
      });
    });
  }

  return { render: render };
})();
