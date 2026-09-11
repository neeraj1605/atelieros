/* ============================================================
   Planex — Moodboard
   Room-specific, theme-aware look-and-feel: palette, materials,
   furniture direction, lighting mood, reference render, intent.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Moodboard = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function money(n) { return store().formatMoney(n || 0); }

  function currentSpace() {
    const S = store().state;
    return (S.activeSpaceId && S.activeSpaceId !== 'all') ? store().spaceById(S.activeSpaceId) : (S.rooms[0] || null);
  }

  function spaceSwitcher() {
    const S = store().state;
    return `<div class="space-chip-row">
      ${(S.rooms || []).map(function (r) {
        return `<button class="chip-toggle ${r.id === S.activeSpaceId ? 'active' : ''}" data-mb-space="${r.id}">${esc(r.name)}</button>`;
      }).join('')}
    </div>`;
  }

  function paletteHtml(palette) {
    if (!palette || !palette.length) return '<p class="muted text-sm">No palette yet.</p>';
    return `<div class="palette-grid">
      ${palette.map(function (c) {
        return `<button class="palette-card" data-hex="${esc(c.hex)}" title="Copy ${esc(c.hex)}">
          <span class="palette-swatch" style="background:${esc(c.hex)}"></span>
          <span class="palette-role">${esc(c.role || '')}</span>
          <span class="palette-name">${esc(c.name || '')}</span>
          <span class="palette-hex mono">${esc(c.hex || '')}</span>
        </button>`;
      }).join('')}
    </div>`;
  }

  function materialsHtml(materials) {
    if (!materials || !materials.length) return '';
    return `<table class="scope-table"><thead><tr><th>Surface</th><th>Material / Make</th><th>Note</th></tr></thead><tbody>
      ${materials.map(function (m) { return `<tr><td>${esc(m.surface)}</td><td>${esc(m.material)}</td><td class="muted">${esc(m.note || '')}</td></tr>`; }).join('')}
    </tbody></table>`;
  }

  function render(container) {
    const S = store().state;
    const s = currentSpace();
    const mb = s ? S.moodboards[s.id] : null;

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h1 class="serif" style="margin:0;">Moodboard</h1>
              ${s ? `<span class="badge badge-info">${esc(s.name)}</span>` : ''}
            </div>
            <p>The look for each space — palette, materials, furniture and light — set within your home theme.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${s ? `<button class="btn btn-secondary btn-sm" id="mb-render">${ic('wand')} Reference image</button>` : ''}
            ${s ? `<button class="btn btn-primary btn-sm" id="mb-gen">${ic('sparkles')} ${mb ? 'Regenerate' : 'Generate moodboard'}</button>` : ''}
            ${mb ? `<button class="btn btn-secondary btn-sm" id="mb-copy">${ic('download')} Copy palette</button>` : ''}
            ${mb ? `<button class="btn btn-secondary btn-sm" id="mb-print">${ic('print')} Print</button>` : ''}
          </div>
        </div>

        ${(S.rooms || []).length > 1 ? spaceSwitcher() : ''}

        ${!s ? `
          <div class="empty anim anim-1"><div class="empty-icon">${ic('home')}</div>
          <p>Add spaces first, then set the look for each.</p></div>` : !mb ? `
          <div class="empty anim anim-1"><div class="empty-icon">${ic('sparkles')}</div>
          <p>No moodboard for <strong>${esc(s.name)}</strong> yet. Generate one — palette, materials, furniture and lighting for this space.</p>
          <button class="btn btn-primary" id="mb-gen2">${ic('sparkles')} Generate moodboard</button></div>` : `

          <div class="card anim anim-1">
            <div class="card-head">
              <div><div class="card-title">Theme</div><div class="card-sub">${esc((S.theme && S.theme.directions || []).join(' + '))}</div></div>
              <span class="badge badge-gold">${esc(s.name)}</span>
            </div>
            <p class="text-sm" style="margin-top:6px;">${esc(mb.themeInterpretation || '')}</p>
          </div>

          <div class="section-label anim anim-1">Colour Palette</div>
          <div class="card anim anim-1">${paletteHtml(mb.palette)}</div>

          <div class="docket-layout" style="margin-top:14px;">
            <div class="card anim anim-2">
              <div class="card-head"><div><div class="card-title">Materials &amp; Finishes</div><div class="card-sub">By quality band</div></div></div>
              ${materialsHtml(mb.materials)}
            </div>
            <div class="card anim anim-2">
              <div class="card-head"><div><div class="card-title">Lighting mood</div></div></div>
              <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
                <div><span class="muted">Colour temperature</span> · <strong>${esc(mb.lighting && mb.lighting.cct || '—')}</strong></div>
                <div><span class="muted">Target</span> · <strong>${esc(mb.lighting && mb.lighting.lux || '—')}</strong></div>
                <p class="muted text-sm">${esc(mb.lighting && mb.lighting.note || '')}</p>
              </div>
            </div>
          </div>

          ${mb.furniture && mb.furniture.length ? `
          <div class="section-label anim anim-2">Furniture Direction</div>
          <div class="card anim anim-2">
            <ul class="docket-notes">${mb.furniture.map(function (f) { return `<li><strong>${esc(f.item)}</strong> — ${esc(f.note || '')}</li>`; }).join('')}</ul>
          </div>` : ''}

          ${mb.refImage ? `
          <div class="section-label anim anim-2">Reference</div>
          <div class="card anim anim-2"><div class="plan-preview"><img src="${mb.refImage}" alt="Reference" data-lightbox="${mb.refImage}"></div></div>` : ''}

          <div class="docket-layout" style="margin-top:14px;">
            <div class="card anim anim-3">
              <div class="card-head"><div><div class="card-title">Design intent</div></div></div>
              <p class="text-sm">${esc(mb.intent || '')}</p>
            </div>
            <div class="card anim anim-3">
              <div class="card-head"><div><div class="card-title">Do / Don't</div></div></div>
              <ul class="docket-notes">
                ${(mb.dos || []).map(function (d) { return '<li>✓ ' + esc(d) + '</li>'; }).join('')}
                ${(mb.donts || []).map(function (d) { return '<li>✗ ' + esc(d) + '</li>'; }).join('')}
              </ul>
            </div>
          </div>`}
      </div>
    `;

    bind(container, s);
  }

  function bind(container, s) {
    container.querySelectorAll('[data-mb-space]').forEach(function (b) {
      b.addEventListener('click', function () { store().setActiveSpace(b.getAttribute('data-mb-space')); window.PlanexApp.renderView(); });
    });
    container.querySelectorAll('[data-hex]').forEach(function (b) {
      b.addEventListener('click', function () {
        const hex = b.getAttribute('data-hex');
        try { navigator.clipboard.writeText(hex); window.PlanexUI.toast('Copied ' + hex); } catch (e) { window.PlanexUI.toast(hex); }
      });
    });
    const gen = container.querySelector('#mb-gen') || container.querySelector('#mb-gen2');
    if (gen) gen.addEventListener('click', generate);
    const copy = container.querySelector('#mb-copy');
    if (copy) copy.addEventListener('click', function () {
      const mb = store().state.moodboards[s.id];
      if (!mb) return;
      const text = (mb.palette || []).map(function (c) { return c.role + ': ' + c.hex + ' (' + c.name + ')'; }).join('\n');
      try { navigator.clipboard.writeText(text); window.PlanexUI.toast('Palette copied.'); } catch (e) { window.PlanexUI.toast('Copy failed'); }
    });
    const print = container.querySelector('#mb-print');
    if (print) print.addEventListener('click', function () { window.print(); });
    const ref = container.querySelector('#mb-render');
    if (ref) ref.addEventListener('click', referenceImage);
    container.querySelectorAll('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () { window.PlanexUI.lightbox(el.getAttribute('data-lightbox')); });
    });
  }

  async function generate() {
    const s = currentSpace();
    if (!s) return;
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) { window.PlanexUI.toast('Moodboard needs the hosted assistant.'); return; }
    const btn = document.querySelector('#mb-gen') || document.querySelector('#mb-gen2');
    const prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Designing…'; }
    try {
      const S = store().state;
      const scopePkgs = S.scopeDoc ? S.scopeDoc.packages.map(function (p) { return p.name; }) : [];
      const res = await window.PlanexAIClient.buildMoodboard({
        space: { name: s.name, kind: s.kind, length: s.length, width: s.width, brief: s.brief },
        theme: S.theme, projectType: (S.project && S.project.projectType) || 'ready',
        quality: S.scopeQuality || 'standard', scopePackages: scopePkgs, brief: S.context
      });
      if (res && res.moodboard) {
        store().setMoodboard(s.id, res.moodboard);
        store().updateSpace(s.id, { status: 'look' });
        store().setArtifact('moodboard:' + s.id);
        window.PlanexUI.toast('Moodboard ready for ' + s.name + '.');
        window.PlanexApp.renderView();
        return;
      }
      window.PlanexUI.toast('No moodboard returned.');
    } catch (e) {
      window.PlanexUI.toast('Moodboard failed (' + (e && e.status ? e.status : 'network') + ').');
    }
    if (btn) { btn.disabled = false; btn.textContent = prev; }
  }

  async function referenceImage() {
    const s = currentSpace();
    const mb = store().state.moodboards[s.id];
    if (!s || !mb) return;
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) { window.PlanexUI.toast('Reference render needs the hosted assistant.'); return; }
    const btn = document.querySelector('#mb-render');
    const prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Rendering…'; }
    try {
      const palette = (mb.palette || []).map(function (c) { return c.name; }).join(', ');
      const mats = (mb.materials || []).map(function (m) { return m.material; }).join(', ');
      const prompt = s.name + ' interior, ' + (store().state.theme.directions || []).join(' ') + ' style, palette ' + palette + ', materials ' + mats;
      const dataUrl = await window.PlanexAIClient.generateImage(prompt, { width: 1024, height: 768 });
      mb.refImage = dataUrl;
      store().setMoodboard(s.id, mb);
      window.PlanexApp.renderView();
    } catch (e) {
      window.PlanexUI.toast('Render failed (' + (e && e.status ? e.status : 'network') + ').');
      if (btn) { btn.disabled = false; btn.textContent = prev; }
    }
  }

  return { render: render };
})();
