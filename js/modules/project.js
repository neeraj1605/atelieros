/* ============================================================
   Planex — Project Tab
   Step 1 of the journey: project basics, floor plan (validated),
   and a photo gallery per room.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Project = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function money(n) { return store().formatMoney(n || 0); }

  function planChecks(rooms) {
    const checks = [];
    const warnings = [];
    if (!rooms.length) {
      return { checks: [{ ok: false, label: 'No rooms captured' }], warnings: ['Read the plan or add rooms to begin.'], totalSqft: 0 };
    }
    checks.push({ ok: true, label: rooms.length + ' rooms captured' });

    const bad = rooms.filter(function (r) {
      return !(Number(r.length) > 0) || !(Number(r.width) > 0) || Number(r.length) > 60 || Number(r.width) > 60;
    });
    if (bad.length) warnings.push(bad.length + ' room(s) have missing or out-of-range dimensions.');

    const names = rooms.map(function (r) { return String(r.name).toLowerCase(); });
    const dups = names.filter(function (n, i) { return names.indexOf(n) !== i; });
    if (dups.length) warnings.push('Duplicate room names: ' + Array.from(new Set(dups)).join(', '));

    if (!names.some(function (n) { return n.indexOf('kitchen') >= 0; })) warnings.push('No kitchen found — confirm the plan.');
    if (!names.some(function (n) { return n.indexOf('bath') >= 0; })) warnings.push('No bathroom found — confirm the plan.');

    const low = rooms.filter(function (r) { return r.confidence && r.confidence !== 'high'; }).length;
    if (low) warnings.push(low + ' room(s) with estimated dimensions (low/medium confidence) — verify on site.');

    const totalSqft = Math.round(rooms.reduce(function (s, r) {
      return s + (Number(r.length) || 0) * (Number(r.width) || 0) * 10.7639;
    }, 0));
    checks.push({ ok: true, label: 'Total floor area ≈ ' + totalSqft + ' sqft' });
    return { checks: checks, warnings: warnings, totalSqft: totalSqft };
  }

  function areaSchedule() {
    const S = store().state;
    const rooms = S.rooms || [];
    const sqft = function (r) { return Math.round((Number(r.length) || 0) * (Number(r.width) || 0) * 10.7639); };
    const total = rooms.reduce(function (s, r) { return s + sqft(r); }, 0);
    const rows = rooms.map(function (r, i) {
      return `<tr>
        <td>${esc(r.name)}</td>
        <td class="num"><input class="scope-qty" type="number" step="0.1" min="0" value="${r.length || ''}" data-ar-len="${i}"></td>
        <td class="num"><input class="scope-qty" type="number" step="0.1" min="0" value="${r.width || ''}" data-ar-wid="${i}"></td>
        <td class="num">${sqft(r)}</td>
        <td class="num"><button class="btn btn-ghost btn-sm" data-ar-del="${i}">Remove</button></td>
      </tr>`;
    }).join('');
    return `
      <div class="section-label anim anim-2">Area Schedule</div>
      <div class="card anim anim-2">
        <div class="card-head">
          <div><div class="card-title">Rooms &amp; dimensions</div><div class="card-sub">From the plan — edit if needed</div></div>
          <button class="btn btn-ghost btn-sm" id="ar-add">${ic('plus')} Add room</button>
        </div>
        <div style="overflow-x:auto;">
          <table class="scope-table">
            <thead><tr><th>Room</th><th class="num">Length (m)</th><th class="num">Width (m)</th><th class="num">Area (sqft)</th><th></th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5" class="muted">No rooms yet — read the plan.</td></tr>'}</tbody>
            <tfoot><tr><td colspan="3" class="num">Total</td><td class="num bold">${total} sqft</td><td></td></tr></tfoot>
          </table>
        </div>
      </div>`;
  }

  function roomGallery(room) {
    const imgs = (store().state.roomImages[room.id] || []);
    return `
      <div class="room-gallery">
        <div class="room-gallery-head">
          <span class="room-gallery-name">${esc(room.name)}</span>
          <span class="faint text-xs">${room.length || 0} × ${room.width || 0} m${room.confidence ? ' · ' + esc(room.confidence) : ''}</span>
          <button class="btn btn-ghost btn-sm" data-add-img="${room.id}">${ic('image')} Add photos</button>
        </div>
        <div class="room-gallery-imgs">
          ${imgs.length
            ? imgs.map(function (im) { return `<span class="room-img"><img src="${im.dataUrl}" alt="" data-lightbox="${im.dataUrl}"><button data-del-img="${room.id}:${im.id}" title="Remove">&times;</button></span>`; }).join('')
            : '<span class="muted text-sm">No photos yet.</span>'}
        </div>
        <input type="file" accept="image/*" multiple hidden data-img-input="${room.id}">
      </div>`;
  }

  function render(container) {
    const S = store().state;
    const types = window.PlanexScopeData.PROJECT_TYPES;
    const currentType = (S.project && S.project.projectType) || 'ready';
    const fp = S.floorplan;
    const checks = fp && fp.validation ? fp.validation : null;
    const rooms = S.rooms || [];

    const typeButtons = types.map(function (t) {
      return `<button class="chip-toggle ${t.id === currentType ? 'active' : ''}" data-project-type="${t.id}" title="${esc(t.description)}">${esc(t.short)}</button>`;
    }).join('');

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <h1 class="serif">Project</h1>
            <p>Set up the project, upload the floor plan, validate it, and add photos of each room.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${fp ? `<button class="btn btn-secondary btn-sm" id="fp-upload">${ic('upload')} Replace plan</button>` : ''}
            ${fp && !fp.validated ? `<button class="btn btn-primary btn-sm" id="fp-validate">${ic('check')} Validate plan</button>` : ''}
            ${fp && fp.validated ? `<button class="btn btn-secondary btn-sm" id="fp-revalidate">${ic('check')} Re-validate</button>` : ''}
          </div>
        </div>

        <div class="card anim anim-1">
          <div class="card-head">
            <div><div class="card-title">Project basics</div><div class="card-sub">Drives the whole scope and costing</div></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Project name</label><input class="input" id="pj-name" value="${esc(S.project.name || '')}"></div>
            <div class="field"><label>Location</label><input class="input" id="pj-loc" value="${esc(S.project.location || '')}"></div>
          </div>
          <div class="field-row" style="margin-top:12px;">
            <div class="field"><label>Budget (₹)</label><input class="input" id="pj-budget" type="number" value="${S.project.budget || ''}"></div>
            <div class="field"><label>Handover target</label><input class="input" id="pj-date" value="${esc(S.project.handoverDate || '')}"></div>
          </div>
          <div style="margin-top:14px;">
            <div class="text-xs uppercase faint bold" style="margin-bottom:8px;">Project type</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">${typeButtons}</div>
          </div>
          <div style="margin-top:14px;"><button class="btn btn-secondary btn-sm" id="pj-save">Save project</button></div>
        </div>

        <div class="section-label anim anim-1">Floor Plan</div>
        <div class="card anim anim-1">
          <div class="card-head">
            <div>
              <div class="card-title">${fp ? esc(fp.name) : 'Upload your floor plan'}</div>
              <div class="card-sub">${fp ? (fp.validated ? 'Validated ' + (fp.validatedAt ? new Date(fp.validatedAt).toLocaleDateString() : '') : 'Not validated yet') : 'Shared with Scope and the Design Docket'}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" id="fp-upload2">${ic('upload')} ${fp ? 'Replace' : 'Upload'}</button>
              ${fp ? `<button class="btn btn-secondary btn-sm" id="fp-read">${ic('sparkles')} Read rooms (AI)</button>` : ''}
              ${fp ? `<button class="btn btn-secondary btn-sm" id="fp-aivalidate">${ic('check')} AI validate</button>` : ''}
            </div>
          </div>
          ${fp
            ? `<div class="plan-preview"><img src="${fp.dataUrl}" alt="Floor plan" data-lightbox="${fp.dataUrl}"></div>`
            : `<p class="muted text-sm">Upload a photo or image of the floor plan. We read the rooms and sizes from it.</p>`}
          <input type="file" id="fp-file" accept="image/*" hidden>

          ${fp && checks ? `
            <div class="hr"></div>
            <div class="text-xs uppercase faint bold" style="margin-bottom:8px;">Plan validation</div>
            <div class="validation-list">
              ${(checks.checks || []).map(function (c) { return `<div class="validation-row ${c.ok ? 'ok' : 'warn'}">${ic(c.ok ? 'check' : 'alert')} <span>${esc(c.label)}</span></div>`; }).join('')}
              ${(checks.warnings || []).map(function (w) { return `<div class="validation-row warn">${ic('alert')} <span>${esc(w)}</span></div>`; }).join('')}
            </div>` : ''}
        </div>

        ${areaSchedule()}

        <div class="section-label anim anim-2">Room Photos</div>
        <div class="card anim anim-2">
          <div class="card-sub" style="margin-bottom:10px;">Add photos of each room. Planex AI looks at them when you discuss that room.</div>
          ${rooms.length ? rooms.map(roomGallery).join('') : '<p class="muted text-sm">Read the plan or add rooms first.</p>'}
        </div>
      </div>
    `;

    bind(container);
  }

  function bind(container) {
    // project basics
    const save = container.querySelector('#pj-save');
    if (save) save.addEventListener('click', function () {
      const S = store().state;
      S.project.name = (container.querySelector('#pj-name').value || '').trim() || S.project.name;
      S.project.location = (container.querySelector('#pj-loc').value || '').trim();
      S.project.budget = Number(container.querySelector('#pj-budget').value) || 0;
      S.project.handoverDate = (container.querySelector('#pj-date').value || '');
      store().commit();
      window.PlanexUI.toast('Project saved.');
    });

    container.querySelectorAll('[data-project-type]').forEach(function (el) {
      el.addEventListener('click', function () {
        store().setProjectType(el.getAttribute('data-project-type'));
        window.PlanexApp.renderView();
      });
    });

    // floor plan
    const file = container.querySelector('#fp-file');
    ['#fp-upload', '#fp-upload2'].forEach(function (sel) {
      const b = container.querySelector(sel);
      if (b && file) b.addEventListener('click', function () { file.click(); });
    });
    if (file) file.addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) { window.PlanexUI.toast('File too large (max 4 MB).'); return; }
      const reader = new FileReader();
      reader.onload = function () {
        store().setFloorplan({ name: f.name, dataUrl: reader.result, size: f.size });
        window.PlanexUI.toast('Floor plan uploaded. Now read the rooms.');
        window.PlanexApp.renderView();
      };
      reader.readAsDataURL(f);
    });

    const read = container.querySelector('#fp-read');
    if (read) read.addEventListener('click', readRooms);

    const validate = container.querySelector('#fp-validate') || container.querySelector('#fp-revalidate');
    if (validate) validate.addEventListener('click', function () {
      const result = planChecks(store().state.rooms);
      store().validateFloorplan(result);
      window.PlanexUI.toast(result.warnings.length ? 'Plan validated with ' + result.warnings.length + ' warning(s).' : 'Plan validated.');
      window.PlanexApp.renderView();
    });

    const aiVal = container.querySelector('#fp-aivalidate');
    if (aiVal) aiVal.addEventListener('click', aiValidate);

    // area schedule
    container.querySelectorAll('[data-ar-len]').forEach(function (inp) {
      inp.addEventListener('change', function () { updateRoomDim(Number(inp.getAttribute('data-ar-len')), 'length', inp.value); });
    });
    container.querySelectorAll('[data-ar-wid]').forEach(function (inp) {
      inp.addEventListener('change', function () { updateRoomDim(Number(inp.getAttribute('data-ar-wid')), 'width', inp.value); });
    });
    container.querySelectorAll('[data-ar-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        const i = Number(b.getAttribute('data-ar-del'));
        const room = store().state.rooms[i];
        if (!room) return;
        window.PlanexUI.confirm('Remove ' + room.name + ' from the area schedule?').then(function (ok) {
          if (!ok) return;
          store().state.rooms.splice(i, 1);
          store().unvalidateFloorplan();
          store().commit();
          if (store().state.scopeDoc) store().regenerateScope();
          window.PlanexApp.renderView();
        });
      });
    });
    const arAdd = container.querySelector('#ar-add');
    if (arAdd) arAdd.addEventListener('click', addRoomDialog);

    // room images
    container.querySelectorAll('[data-add-img]').forEach(function (b) {
      b.addEventListener('click', function () {
        const roomId = b.getAttribute('data-add-img');
        const input = container.querySelector('[data-img-input="' + roomId + '"]');
        if (input) input.click();
      });
    });
    container.querySelectorAll('[data-img-input]').forEach(function (input) {
      input.addEventListener('change', function (e) {
        const roomId = input.getAttribute('data-img-input');
        const files = Array.from(e.target.files || []);
        files.forEach(function (f) {
          if (f.size > 2.5 * 1024 * 1024) { window.PlanexUI.toast('Photo too large (max 2.5 MB): ' + f.name); return; }
          const reader = new FileReader();
          reader.onload = function () { store().addRoomImage(roomId, { name: f.name, dataUrl: reader.result, size: f.size }); window.PlanexApp.renderView(); };
          reader.readAsDataURL(f);
        });
      });
    });
    container.querySelectorAll('[data-del-img]').forEach(function (b) {
      b.addEventListener('click', function () {
        const parts = b.getAttribute('data-del-img').split(':');
        store().removeRoomImage(parts[0], parts[1]);
        window.PlanexApp.renderView();
      });
    });

    container.querySelectorAll('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () { window.PlanexUI.lightbox(el.getAttribute('data-lightbox')); });
    });
  }

  async function readRooms() {
    const btn = document.querySelector('#fp-read');
    const prev = btn ? btn.textContent : '';
    const aiRooms = await window.PlanexPlanReader.readAndReview(null, {
      button: btn, busyLabel: 'Reading plan…', restoreLabel: prev,
      after: function () { window.PlanexUI.toast('Review the Area Schedule, then hit Validate plan.'); }
    });
    if (btn) { btn.disabled = false; btn.textContent = prev; }
    return aiRooms;
  }

  async function aiValidate() {
    if (!store().state.floorplan) return;
    const btn = document.querySelector('#fp-aivalidate');
    const prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Checking…'; }
    await window.PlanexPlanReader.validateOnly();
    if (btn) { btn.disabled = false; btn.textContent = prev; }
  }

  function updateRoomDim(i, key, value) {
    const room = store().state.rooms[i];
    if (!room) return;
    room[key] = Math.max(0, Number(value) || 0);
    room.area = (Number(room.length) * Number(room.width)).toFixed(1) + ' m²';
    store().unvalidateFloorplan();
    store().rebuildDerived();
    store().commit();
    window.PlanexApp.renderView();
  }

  function addRoomDialog() {
    window.PlanexUI.modal('Add room', `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="field"><label>Room name</label><input class="input" id="ar-name" placeholder="e.g. Guest Bedroom"></div>
        <div class="field-row">
          <div class="field"><label>Length (m)</label><input class="input" id="ar-len2" type="number" step="0.1" value="3.6"></div>
          <div class="field"><label>Width (m)</label><input class="input" id="ar-wid2" type="number" step="0.1" value="3.0"></div>
        </div>
        <button class="btn btn-primary btn-block" id="ar-save2">Add room</button>
      </div>`);
    document.querySelector('#ar-save2').addEventListener('click', function () {
      const name = (document.querySelector('#ar-name').value || '').trim();
      if (!name) { window.PlanexUI.toast('Enter a room name.'); return; }
      const len = Number(document.querySelector('#ar-len2').value) || 0;
      const wid = Number(document.querySelector('#ar-wid2').value) || 0;
      store().state.rooms.push({
        id: 'room-' + Date.now(), name: name, length: len, width: wid,
        area: (len * wid).toFixed(1) + ' m²', color: '#9db8c9', type: 'private', source: 'user'
      });
      store().unvalidateFloorplan();
      store().commit();
      if (store().state.scopeDoc) store().regenerateScope();
      window.PlanexUI.closeModal();
      window.PlanexApp.renderView();
      window.PlanexUI.toast('Room added.');
    });
  }

  return { render: render };
})();
