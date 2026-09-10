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
    const fp = store().state.floorplan;
    if (!fp) { window.PlanexUI.toast('Upload a floor plan first.'); return; }
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) { window.PlanexUI.toast('Reading a plan needs the hosted assistant.'); return; }
    if (store().state.rooms.length && !confirm('Replace the current rooms with rooms read from the plan?')) return;

    const btn = document.querySelector('#fp-read');
    const prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Reading plan…'; }
    try {
      const res = await window.PlanexAIClient.readPlan({ kind: 'plan', name: fp.name, dataUrl: fp.dataUrl });
      const rooms = (res.rooms || []).map(function (r) {
        return {
          id: r.id || ('room-' + Date.now() + '-' + Math.random().toString(36).slice(2, 4)),
          name: r.name,
          length: r.lengthM,
          width: r.widthM,
          area: (Number(r.lengthM) * Number(r.widthM)).toFixed(1) + ' m²',
          color: '#9db8c9',
          type: 'private',
          source: 'ai-plan',
          confidence: r.confidence || 'low'
        };
      });
      if (!rooms.length) { window.PlanexUI.toast('Could not read rooms from that plan.'); if (btn) { btn.disabled = false; btn.textContent = prev; } return; }
      store().state.rooms = rooms;
      store().unvalidateFloorplan();
      store().commit();
      window.PlanexUI.toast('Read ' + rooms.length + ' rooms. Review and validate.');
      window.PlanexApp.renderView();
    } catch (e) {
      window.PlanexUI.toast('Plan reading failed (' + (e && e.status ? e.status : 'network') + ').');
      if (btn) { btn.disabled = false; btn.textContent = prev; }
    }
  }

  async function aiValidate() {
    const fp = store().state.floorplan;
    if (!fp) return;
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) { window.PlanexUI.toast('AI validation needs the hosted assistant.'); return; }
    const btn = document.querySelector('#fp-aivalidate');
    const prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Checking…'; }
    try {
      const res = await window.PlanexAIClient.readPlan({ kind: 'plan', name: fp.name, dataUrl: fp.dataUrl });
      const aiRooms = (res.rooms || []).map(function (r) { return r.name; });
      const mine = store().state.rooms.map(function (r) { return r.name; });
      const missing = aiRooms.filter(function (n) { return !mine.some(function (m) { return m.toLowerCase() === n.toLowerCase(); }); });
      const extra = mine.filter(function (n) { return !aiRooms.some(function (a) { return a.toLowerCase() === n.toLowerCase(); }); });
      const lines = [];
      if (missing.length) lines.push('The plan appears to include: ' + missing.join(', '));
      if (extra.length) lines.push('Not clearly found on the plan: ' + extra.join(', '));
      if (!lines.length) lines.push('The room list matches what I read from the plan.');
      window.PlanexUI.modal('AI plan validation', `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <p class="muted text-sm">This only reports differences — it never changes your room list.</p>
          <div class="validation-list">${lines.map(function (l) { return `<div class="validation-row ${lines.length && l.indexOf('matches') >= 0 ? 'ok' : 'warn'}">${ic('alert')} <span>${esc(l)}</span></div>`; }).join('')}</div>
          <p class="muted text-sm">AI room count: ${aiRooms.length} · Your list: ${mine.length}</p>
        </div>
      `);
    } catch (e) {
      window.PlanexUI.toast('AI validation failed (' + (e && e.status ? e.status : 'network') + ').');
    }
    if (btn) { btn.disabled = false; btn.textContent = prev; }
  }

  return { render: render };
})();
