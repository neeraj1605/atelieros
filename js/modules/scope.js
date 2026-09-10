/* ============================================================
   Planex — Scope Tab
   The controlling document: area -> scope of activities -> split -> BOQ.
   Project-type aware (ready / renovation / bare-shell).
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Scope = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function money(n) { return store().formatMoney(n || 0); }

  function lib() { return window.PlanexScopeData; }

  function activityRows(pkg) {
    // group by room for room-scoped packages
    const groups = {};
    const order = [];
    pkg.activities.forEach(function (a) {
      const key = a.room || '';
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(a);
    });

    return order.map(function (roomName) {
      const rows = groups[roomName].map(function (a) {
        const idx = pkg.activities.indexOf(a);
        return `
          <tr class="${a.included === false ? 'scope-off' : ''}">
            <td><input type="checkbox" ${a.included === false ? '' : 'checked'} data-scope-toggle="${pkg.id}:${idx}"></td>
            <td><div style="font-weight:600;">${esc(a.name)}</div><div class="scope-detail">${esc(a.detail)}</div></td>
            <td class="num"><input class="scope-qty" type="number" min="0" value="${a.qty}" data-scope-qty="${pkg.id}:${idx}"></td>
            <td class="scope-unit">${esc(a.unit)}</td>
            <td class="num"><input class="scope-qty" type="number" min="0" value="${a.rate}" data-scope-rate="${pkg.id}:${idx}"></td>
            <td class="num bold">${money(a.amount)}</td>
          </tr>`;
      }).join('');
      return (roomName ? `<tr class="scope-roomrow"><td colspan="6">${esc(roomName)}</td></tr>` : '') + rows;
    }).join('');
  }

  function packageHtml(pkg) {
    const included = (pkg.activities || []).filter(function (a) { return a.included !== false; }).length;
    return `
      <details class="scope-pkg">
        <summary>
          <span class="scope-pkg-name">${esc(pkg.name)}</span>
          <span class="scope-pkg-meta">${included}/${pkg.activities.length} items · ${money(pkg.subtotal)} · ${pkg.sharePct}%</span>
        </summary>
        <p class="muted text-sm" style="margin:6px 0 10px;">${esc(pkg.description)}</p>
        <div style="overflow-x:auto;">
          <table class="scope-table">
            <thead><tr><th></th><th>Activity</th><th class="num">Qty</th><th>Unit</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
            <tbody>${activityRows(pkg)}</tbody>
          </table>
        </div>
        <div class="scope-pkg-actions">
          <button class="btn btn-secondary btn-sm" data-scope-pkg-boq="${pkg.id}">Add this package to BOQ</button>
          <span class="muted text-sm">Subtotal ${money(pkg.subtotal)}</span>
        </div>
      </details>`;
  }

  function areaTable(doc) {
    const rooms = (doc && doc.area && doc.area.rooms) || [];
    const rows = rooms.map(function (r, i) {
      return `
        <tr>
          <td>${esc(r.name)}</td>
          <td class="num"><input class="scope-qty" type="number" step="0.1" min="0" value="${r.lengthM || ''}" data-area-len="${i}"></td>
          <td class="num"><input class="scope-qty" type="number" step="0.1" min="0" value="${r.widthM || ''}" data-area-wid="${i}"></td>
          <td class="num">${Math.round(r.areaSqft)}</td>
          <td class="num"><button class="btn btn-ghost btn-sm" data-area-del="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <table class="scope-table">
        <thead><tr><th>Room</th><th class="num">Length (m)</th><th class="num">Width (m)</th><th class="num">Area (sqft)</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="muted">No rooms yet.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="3" class="num">Total</td><td class="num bold">${doc ? doc.area.totalSqft : 0} sqft</td><td class="num muted">carpet ≈ ${doc ? doc.area.carpetSqft : 0}</td></tr></tfoot>
      </table>
      <div style="margin-top:10px;"><button class="btn btn-ghost btn-sm" id="scope-add-room">${ic('plus')} Add room</button></div>`;
  }

  function splitHtml(doc) {
    if (!doc || !doc.packages.length) return '';
    const bar = doc.packages.map(function (p) {
      const hue = (p.id.length * 47) % 360;
      return `<span class="split-seg" style="width:${p.sharePct}%;background:hsl(${hue} 45% 62%)" title="${esc(p.name)} ${p.sharePct}%"></span>`;
    }).join('');
    const table = doc.packages.map(function (p) {
      return `<tr><td>${esc(p.name)}</td><td class="num">${money(p.subtotal)}</td><td class="num">${p.sharePct}%</td></tr>`;
    }).join('');
    return `
      <div class="split-bar">${bar}</div>
      <table class="scope-table" style="margin-top:12px;"><thead><tr><th>Work package</th><th class="num">Amount</th><th class="num">Share</th></tr></thead>
      <tbody>${table}</tbody></table>`;
  }

  function render(container) {
    const S = store().state;
    const doc = S.scopeDoc;
    const types = lib().PROJECT_TYPES;
    const qualities = lib().QUALITY;
    const currentType = (S.project && S.project.projectType) || 'ready';
    const summary = doc ? doc.summary : null;

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
            <h1 class="serif">Scope of Work</h1>
            <p>The controlling document — area, activities, work-package split and BOQ. The Design Docket is generated from this.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${doc ? `<button class="btn btn-secondary btn-sm" id="scope-print">${ic('print')} Print / PDF</button>` : ''}
            <button class="btn btn-secondary btn-sm" id="scope-regen">${ic('sparkles')} ${doc ? 'Regenerate' : 'Generate scope'}</button>
            ${doc ? `<button class="btn btn-primary btn-sm" id="scope-to-boq">${ic('plus')} Add all to BOQ</button>` : ''}
          </div>
        </div>

        <div class="card anim anim-1">
          <div class="card-head">
            <div><div class="card-title">Project type</div><div class="card-sub">${esc((types.filter(function (t) { return t.id === currentType; })[0] || types[0]).description)}</div></div>
            <div class="field" style="min-width:150px;">
              <select class="select" id="scope-quality">${qualityOptions}</select>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">${typeButtons}</div>
        </div>

        ${doc ? `
        <div class="section-label anim anim-1">Area Schedule</div>
        <div class="card anim anim-1">${areaTable(doc)}</div>

        <div class="section-label anim anim-2">Scope of Activities</div>
        <div class="anim anim-2">${doc.packages.map(packageHtml).join('')}</div>

        <div class="section-label anim anim-3">Cost Split</div>
        <div class="card anim anim-3">${splitHtml(doc)}</div>

        <div class="section-label anim anim-3">Estimate</div>
        <div class="card anim anim-3">
          <div class="scope-summary">
            <div><span class="muted">Subtotal</span><strong>${money(summary.subtotal)}</strong></div>
            <div><span class="muted">GST (18%)</span><strong>${money(summary.gst)}</strong></div>
            <div><span class="muted">Total</span><strong style="font-size:20px;">${money(summary.total)}</strong></div>
            <div><span class="muted">Budget</span><strong>${summary.budget ? money(summary.budget) : '—'}</strong></div>
            <div><span class="muted">Variance</span><strong class="${summary.variance >= 0 ? 'compare-best' : ''}" style="${summary.variance < 0 ? 'color:var(--danger)' : ''}">${summary.budget ? money(summary.variance) : '—'}</strong></div>
          </div>
          <p class="muted text-sm" style="margin-top:10px;">Rates are indicative library values — review and edit before quoting. Quantities are AI estimates.</p>
        </div>` : `
        <div class="empty anim anim-1">
          <div class="empty-icon">${ic('ruler')}</div>
          <p>Set the project type and areas, then <strong>Generate scope</strong> to build the room-wise, package-wise scope and BOQ.</p>
        </div>`}
      </div>
    `;

    bind(container);
  }

  function bind(container) {
    const doc = store().state.scopeDoc;

    // project type
    container.querySelectorAll('[data-project-type]').forEach(function (el) {
      el.addEventListener('click', function () {
        const next = el.getAttribute('data-project-type');
        const cur = (store().state.project && store().state.project.projectType) || 'ready';
        if (next === cur) return;
        if (store().state.scopeDoc && !confirm('Switching project type will rebuild the scope (your edits will be replaced). Continue?')) return;
        store().setProjectType(next);
        store().regenerateScope();
        window.PlanexUI.toast('Scope rebuilt for ' + next.replace('-', ' ') + '.');
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
      if (store().state.scopeDoc && !confirm('Regenerate the scope? Edits to quantities and rates will be replaced.')) return;
      const result = store().regenerateScope();
      if (result) window.PlanexUI.toast('Scope generated: ' + result.packages.length + ' work packages.');
      window.PlanexApp.renderView();
    });

    const toBoq = container.querySelector('#scope-to-boq');
    if (toBoq) toBoq.addEventListener('click', function () {
      const n = store().addScopeToBOQ();
      window.PlanexUI.toast(n + ' scope items added to the BOQ.');
      window.PlanexApp.renderView();
    });

    const print = container.querySelector('#scope-print');
    if (print) print.addEventListener('click', function () { window.print(); });

    container.querySelectorAll('[data-scope-pkg-boq]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-scope-pkg-boq');
        const n = store().addScopeToBOQ(id);
        window.PlanexUI.toast(n + ' items added to the BOQ.');
        window.PlanexApp.renderView();
      });
    });

    // activity edits
    const doc2 = store().state.scopeDoc;
    function findActivity(key) {
      const parts = key.split(':');
      const pkg = doc2.packages.filter(function (p) { return p.id === parts[0]; })[0];
      if (!pkg) return null;
      return pkg.activities[Number(parts[1])] || null;
    }
    function edited() {
      store().recomputeScope();
      window.PlanexApp.renderView();
    }
    container.querySelectorAll('[data-scope-toggle]').forEach(function (el) {
      el.addEventListener('change', function () {
        const a = findActivity(el.getAttribute('data-scope-toggle'));
        if (a) { a.included = el.checked; edited(); }
      });
    });
    container.querySelectorAll('[data-scope-qty]').forEach(function (el) {
      el.addEventListener('change', function () {
        const a = findActivity(el.getAttribute('data-scope-qty'));
        if (a) { a.qty = Math.max(0, Number(el.value) || 0); edited(); }
      });
    });
    container.querySelectorAll('[data-scope-rate]').forEach(function (el) {
      el.addEventListener('change', function () {
        const a = findActivity(el.getAttribute('data-scope-rate'));
        if (a) { a.rate = Math.max(0, Number(el.value) || 0); a.rateSource = 'manual'; edited(); }
      });
    });

    // area edits
    container.querySelectorAll('[data-area-len]').forEach(function (el) {
      el.addEventListener('change', function () { setRoomDim(Number(el.getAttribute('data-area-len')), 'length', el.value); });
    });
    container.querySelectorAll('[data-area-wid]').forEach(function (el) {
      el.addEventListener('change', function () { setRoomDim(Number(el.getAttribute('data-area-wid')), 'width', el.value); });
    });
    container.querySelectorAll('[data-area-del]').forEach(function (el) {
      el.addEventListener('click', function () {
        const i = Number(el.getAttribute('data-area-del'));
        const room = store().state.rooms[i];
        if (!room || !confirm('Remove ' + room.name + ' from the area schedule?')) return;
        store().state.rooms.splice(i, 1);
        store().commit();
        store().regenerateScope();
        window.PlanexApp.renderView();
      });
    });
    const addRoom = container.querySelector('#scope-add-room');
    if (addRoom) addRoom.addEventListener('click', addRoomDialog);
  }

  function setRoomDim(index, key, value) {
    const room = store().state.rooms[index];
    if (!room) return;
    room[key] = Math.max(0, Number(value) || 0);
    store().commit();
    store().regenerateScope();
    window.PlanexApp.renderView();
  }

  function addRoomDialog() {
    window.PlanexUI.modal('Add Room', `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="field"><label>Room name</label><input class="input" id="ar-name" placeholder="e.g. Guest Bedroom"></div>
        <div class="field-row">
          <div class="field"><label>Length (m)</label><input class="input" id="ar-len" type="number" step="0.1" value="3.6"></div>
          <div class="field"><label>Width (m)</label><input class="input" id="ar-wid" type="number" step="0.1" value="3.0"></div>
        </div>
        <button class="btn btn-primary btn-block" id="ar-save">Add room</button>
      </div>
    `);
    document.querySelector('#ar-save').addEventListener('click', function () {
      const name = (document.querySelector('#ar-name').value || '').trim();
      if (!name) { window.PlanexUI.toast('Please enter a room name.'); return; }
      const len = Number(document.querySelector('#ar-len').value) || 0;
      const wid = Number(document.querySelector('#ar-wid').value) || 0;
      store().state.rooms.push({
        id: 'room-' + Date.now(),
        name: name,
        length: len,
        width: wid,
        area: (len * wid).toFixed(1) + ' m²',
        color: '#9db8c9',
        type: 'private'
      });
      store().commit();
      store().regenerateScope();
      window.PlanexUI.closeModal();
      window.PlanexApp.renderView();
      window.PlanexUI.toast('Room added and scope updated.');
    });
  }

  return { render: render };
})();
