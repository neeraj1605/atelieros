/* ============================================================
   Planex — Spaces
   Space-first workspace: define each space (type, dimensions,
   photos, brief, style) and drive every stage from it.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Spaces = (function () {
  let selected = null;

  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  const KINDS = [
    ['living', 'Living Room'], ['dining', 'Dining Room'], ['kitchen', 'Kitchen'],
    ['bedroom', 'Bedroom'], ['kids', 'Kids Bedroom'], ['guest', 'Guest Bedroom'],
    ['study', 'Study / Office'], ['bath', 'Bathroom'], ['gallery', 'Gallery / Sit-out'],
    ['balcony', 'Balcony'], ['foyer', 'Foyer / Entrance'], ['pooja', 'Pooja Room'],
    ['utility', 'Utility'], ['other', 'Other']
  ];

  function current() {
    const S = store().state;
    return selected ? store().spaceById(selected) : null;
  }

  function statusChip(s) {
    const st = s.status || 'define';
    const map = { define: ['badge-neutral', 'Defined'], look: ['badge-info', 'Look set'], scoped: ['badge-success', 'Scoped'], docketed: ['badge-gold', 'Docketed'] };
    const m = map[st] || map.define;
    return `<span class="badge ${m[0]}">${m[1]}</span>`;
  }

  function listHtml() {
    const rooms = store().state.rooms || [];
    if (!rooms.length) return '<p class="muted text-sm">No spaces yet. Add your first space to begin.</p>';
    return rooms.map(function (r) {
      const on = current() && current().id === r.id;
      return `<button class="space-row ${on ? 'active' : ''}" data-space="${r.id}">
        <span class="space-row-main">
          <span class="space-row-name">${esc(r.name)}</span>
          <span class="faint text-xs">${r.length || 0} × ${r.width || 0} m · ${esc(r.area || '')}</span>
        </span>
        ${statusChip(r)}
      </button>`;
    }).join('');
  }

  function detailHtml() {
    const s = current();
    if (!s) return `<div class="empty"><div class="empty-icon">${ic('home')}</div><p>Select a space, or add one to plan it independently.</p></div>`;
    const styleDirs = (s.style && s.style.directions || []).join(', ');
    return `
      <div class="space-detail">
        <div class="card-head">
          <div>
            <div class="card-title">${esc(s.name)}</div>
            <div class="card-sub">${esc(kindLabel(s.kind))} · ${s.length || 0} × ${s.width || 0} m · ${esc(s.area || '')}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" id="sp-moodboard">${ic('sparkles')} Moodboard</button>
            <button class="btn btn-ghost btn-sm" id="sp-remove">Remove</button>
          </div>
        </div>

        <div class="field-row" style="margin-top:12px;">
          <div class="field"><label>Name</label><input class="input" id="sp-name" value="${esc(s.name)}"></div>
          <div class="field"><label>Type</label>
            <select class="select" id="sp-kind">${KINDS.map(function (k) { return `<option value="${k[0]}" ${k[0] === s.kind ? 'selected' : ''}>${k[1]}</option>`; }).join('')}</select>
          </div>
        </div>
        <div class="field-row" style="margin-top:12px;">
          <div class="field"><label>Length (m)</label><input class="input" id="sp-len" type="number" step="0.1" value="${s.length || ''}"></div>
          <div class="field"><label>Width (m)</label><input class="input" id="sp-wid" type="number" step="0.1" value="${s.width || ''}"></div>
        </div>
        <div class="field" style="margin-top:12px;"><label>Brief for this space</label>
          <textarea class="textarea" id="sp-brief" rows="3" placeholder="What the customer wants in this space…">${esc(s.brief || '')}</textarea>
        </div>
        <div class="field" style="margin-top:12px;"><label>Style direction (comma-separated)</label>
          <input class="input" id="sp-style" value="${esc(styleDirs)}" placeholder="Warm Minimal, Japandi">
        </div>

        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" id="sp-save">${ic('check')} Save space</button>
          <button class="btn btn-secondary btn-sm" id="sp-add-photo">${ic('image')} Add photos</button>
        </div>
        <input type="file" id="sp-file" accept="image/*" multiple hidden>

        <div class="space-photos" style="margin-top:14px;">
          ${(s.photos || []).length
            ? s.photos.map(function (p) { return `<span class="room-img"><img src="${p.dataUrl}" alt="" data-lightbox="${p.dataUrl}"><button data-del-photo="${p.id}" title="Remove">&times;</button></span>`; }).join('')
            : '<span class="muted text-sm">No photos yet — add 2–4 photos of this space for the AI to read.</span>'}
        </div>
      </div>`;
  }

  function kindLabel(k) {
    const m = KINDS.filter(function (x) { return x[0] === k; })[0];
    return m ? m[1] : 'Space';
  }

  function planCard() {
    const S = store().state;
    const fp = S.floorplan;
    return `
      <div class="card anim anim-1">
        <div class="card-head">
          <div>
            <div class="card-title">${fp ? esc(fp.name) : 'Start with your floor plan'}</div>
            <div class="card-sub">${fp ? 'Read the rooms from it — or add spaces manually below' : 'Upload a floor plan and I will create the spaces for you'}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="sp-upload">${ic('upload')} ${fp ? 'Replace plan' : 'Upload floor plan'}</button>
            ${fp ? `<button class="btn btn-primary btn-sm" id="sp-create">${ic('sparkles')} Create spaces from plan (AI)</button>` : ''}
          </div>
        </div>
        ${fp
          ? `<div class="plan-preview"><img src="${fp.dataUrl}" alt="Floor plan" data-lightbox="${fp.dataUrl}"></div>`
          : `<p class="muted text-sm">No floor plan yet — upload one above, or add spaces individually with <strong>Add space</strong>.</p>`}
        <input type="file" id="sp-file-plan" accept="image/*" hidden>
      </div>`;
  }

  async function createSpacesFromPlan() {
    const S = store().state;
    const fp = S.floorplan;
    if (!fp) return;
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) {
      window.PlanexUI.toast('Creating spaces from a plan needs the hosted assistant.');
      return;
    }
    const btn = document.querySelector('#sp-create');
    if (btn) { btn.disabled = true; btn.textContent = 'Reading plan…'; }
    try {
      const res = await window.PlanexAIClient.readPlan({ kind: 'plan', name: fp.name, dataUrl: fp.dataUrl });
      const rooms = res.rooms || [];
      if (!rooms.length) {
        window.PlanexUI.toast('Could not read rooms from that plan — add spaces manually.');
        if (btn) { btn.disabled = false; btn.textContent = 'Create spaces from plan (AI)'; }
        return;
      }
      const existing = (S.rooms || []).length;
      const apply = function (mode) {
        if (mode === 'replace') store().state.rooms = [];
        rooms.forEach(function (r) {
          const nm = r.name;
          if (mode === 'merge' && (store().state.rooms || []).some(function (x) { return x.name.toLowerCase() === nm.toLowerCase(); })) return;
          store().addSpace({
            name: nm,
            kind: window.PlanexPlanGenerator ? window.PlanexPlanGenerator.kindOf(nm) : 'other',
            length: r.lengthM, width: r.widthM,
            source: 'ai-plan', confidence: r.confidence
          });
        });
        store().regeneratePlan();
        if (store().state.scopeDoc) store().regenerateScope();
        store().validateFloorplan({ checks: [{ ok: true, label: 'Spaces created from plan' }], warnings: ['Verify dimensions on site.'] });
        window.PlanexUI.toast('Created ' + rooms.length + ' spaces — adjust any dimensions.');
        window.PlanexApp.renderView();
      };
      if (existing) {
        window.PlanexUI.modal('Create spaces from plan', `
          <p class="text-sm" style="margin-bottom:14px;">You already have ${existing} spaces. Replace them, or add only the new rooms?</p>
          <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
            <button class="btn btn-secondary" id="cs-merge">Add new only</button>
            <button class="btn btn-danger" id="cs-replace">Replace all</button>
          </div>`);
        document.querySelector('#cs-merge').addEventListener('click', function () { window.PlanexUI.closeModal(); apply('merge'); });
        document.querySelector('#cs-replace').addEventListener('click', function () { window.PlanexUI.closeModal(); apply('replace'); });
      } else {
        apply('merge');
      }
    } catch (e) {
      window.PlanexUI.toast('Plan reading failed (' + (e && e.status ? e.status : 'network') + ').');
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Create spaces from plan (AI)'; }
  }

  function render(container) {
    const S = store().state;
    const spaces = S.rooms || [];
    const defined = spaces.filter(function (r) { return r.name && Number(r.length) > 0 && Number(r.width) > 0; }).length;

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h1 class="serif" style="margin:0;">Spaces</h1>
              <span class="badge badge-info">${defined}/${spaces.length} defined</span>
            </div>
            <p>We design <strong>one space at a time</strong> — kitchen, living, dining, bedrooms, gallery/sit-out. Define each, then plan it deeply.</p>
          </div>
          <button class="btn btn-primary btn-sm" id="sp-add">${ic('plus')} Add space</button>
        </div>

        ${planCard()}

        <div class="spaces-layout anim anim-1">
          <div class="card spaces-list">
            <div class="card-head"><div><div class="card-title">Your spaces</div><div class="card-sub">Tap to open</div></div></div>
            ${listHtml()}
          </div>
          <div class="card spaces-detail">${detailHtml()}</div>
        </div>
      </div>
    `;

    bind(container);
  }

  function bind(container) {
    container.querySelectorAll('[data-space]').forEach(function (b) {
      b.addEventListener('click', function () {
        selected = b.getAttribute('data-space');
        store().setActiveSpace(selected);
        window.PlanexApp.renderView();
      });
    });

    const add = container.querySelector('#sp-add');
    if (add) add.addEventListener('click', addSpaceDialog);

    // Floor plan upload + AI create
    const planFile = container.querySelector('#sp-file-plan');
    const upload = container.querySelector('#sp-upload');
    if (upload && planFile) upload.addEventListener('click', function () { planFile.click(); });
    if (planFile) planFile.addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) { window.PlanexUI.toast('File too large (max 4 MB).'); return; }
      const reader = new FileReader();
      reader.onload = function () {
        store().setFloorplan({ name: f.name, dataUrl: reader.result, size: f.size });
        window.PlanexUI.toast('Floor plan uploaded — now create the spaces.');
        window.PlanexApp.renderView();
      };
      reader.readAsDataURL(f);
    });
    const create = container.querySelector('#sp-create');
    if (create) create.addEventListener('click', createSpacesFromPlan);

    const s = current();
    if (!s) return;

    const save = container.querySelector('#sp-save');
    if (save) save.addEventListener('click', function () {
      store().updateSpace(s.id, {
        name: (container.querySelector('#sp-name').value || '').trim() || s.name,
        kind: container.querySelector('#sp-kind').value,
        length: Number(container.querySelector('#sp-len').value) || 0,
        width: Number(container.querySelector('#sp-wid').value) || 0,
        brief: container.querySelector('#sp-brief').value || '',
        style: { directions: (container.querySelector('#sp-style').value || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean), palette: (s.style && s.style.palette) || [] }
      });
      if (store().state.scopeDoc) store().regenerateScope();
      window.PlanexUI.toast('Space saved.');
      window.PlanexApp.renderView();
    });

    const mb = container.querySelector('#sp-moodboard');
    if (mb) mb.addEventListener('click', function () { window.PlanexApp.navigate('moodboard'); });

    const rm = container.querySelector('#sp-remove');
    if (rm) rm.addEventListener('click', async function () {
      const ok = await window.PlanexUI.confirm('Remove ' + s.name + '?', { title: 'Remove space', danger: true });
      if (!ok) return;
      store().removeSpace(s.id);
      selected = null;
      window.PlanexApp.renderView();
    });

    const file = container.querySelector('#sp-file');
    const addPhoto = container.querySelector('#sp-add-photo');
    if (addPhoto && file) addPhoto.addEventListener('click', function () { file.click(); });
    if (file) file.addEventListener('change', function (e) {
      const files = Array.from(e.target.files || []);
      files.forEach(function (f) {
        if (f.size > 2.5 * 1024 * 1024) { window.PlanexUI.toast('Photo too large (max 2.5 MB).'); return; }
        const reader = new FileReader();
        reader.onload = function () {
          const photos = (s.photos || []).slice();
          photos.push({ id: 'ph-' + Date.now() + '-' + Math.random().toString(36).slice(2, 4), name: f.name, dataUrl: reader.result });
          store().updateSpace(s.id, { photos: photos });
          window.PlanexApp.renderView();
        };
        reader.readAsDataURL(f);
      });
    });
    container.querySelectorAll('[data-del-photo]').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-del-photo');
        store().updateSpace(s.id, { photos: (s.photos || []).filter(function (p) { return p.id !== id; }) });
        window.PlanexApp.renderView();
      });
    });
    container.querySelectorAll('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () { window.PlanexUI.lightbox(el.getAttribute('data-lightbox')); });
    });
  }

  function addSpaceDialog() {
    window.PlanexUI.modal('Add a space', `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="field"><label>Type</label>
          <select class="select" id="ns-kind">${KINDS.map(function (k) { return `<option value="${k[0]}">${k[1]}</option>`; }).join('')}</select>
        </div>
        <div class="field"><label>Name</label><input class="input" id="ns-name" placeholder="e.g. Kitchen"></div>
        <div class="field-row">
          <div class="field"><label>Length (m)</label><input class="input" id="ns-len" type="number" step="0.1" value="3.6"></div>
          <div class="field"><label>Width (m)</label><input class="input" id="ns-wid" type="number" step="0.1" value="2.7"></div>
        </div>
        <button class="btn btn-primary btn-block" id="ns-save">Add space</button>
      </div>`);
    document.querySelector('#ns-save').addEventListener('click', function () {
      const kind = document.querySelector('#ns-kind').value;
      const name = (document.querySelector('#ns-name').value || '').trim() || kindLabel(kind);
      const s = store().addSpace({
        kind: kind, name: name,
        length: Number(document.querySelector('#ns-len').value) || 0,
        width: Number(document.querySelector('#ns-wid').value) || 0
      });
      if (store().state.scopeDoc) store().regenerateScope();
      window.PlanexUI.closeModal();
      selected = s.id;
      store().setActiveSpace(s.id);
      window.PlanexApp.renderView();
      window.PlanexUI.toast('Space added. Define it, then plan it.');
    });
  }

  return { render: render };
})();
