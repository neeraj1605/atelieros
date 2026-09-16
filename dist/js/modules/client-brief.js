/* ============================================================
   Planex — Client Brief
   The evolving project context owned by the client: family, style,
   budget, priorities, constraints, preferences, pain points, notes.
   Edited here by hand and surfaced to the AI throughout.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.ClientBrief = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  function ctx() { return store().state.context; }

  function render(container) {
    const C = ctx();
    const S = store().state;

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h1 class="serif" style="margin:0;">Client Brief</h1>
              <span class="badge badge-gold">Version ${esc(C.version || store().state.contextVersion || 1)}</span>
            </div>
            <p>Capture the project story once, and the brief evolves with you — into moodboards, scope, costing and dockets.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="cb-save">${ic('check')} Save brief</button>
            <button class="btn btn-secondary btn-sm" id="cb-version-history">${ic('history')} Version history</button>
            ${S.context && S.context.painPoints && S.context.painPoints.length ? `<button class="btn btn-secondary btn-sm" id="cb-clear-notes">${ic('x')} Clear notes</button>` : ''}
          </div>
        </div>

        ${briefGrid(C)}
      </div>
    `;

    bind(container);
  }

  function briefGrid(C) {
    const fam = C.family || {};
    const bud = C.budget || {};
    const con = C.constraints || {};
    return `
      <div class="brief-grid anim anim-1">
        <div class="card anim anim-1">
          <div class="card-head"><div><div class="card-title">Family</div></div></div>
          <div class="field"><label>Family size (members)</label><input class="input" id="cb-family-size" type="number" step="1" value="${esc(fam.members || '')}"></div>
          <div class="field"><label>Children</label><input class="input" id="cb-children" type="number" step="1" value="${esc(fam.children || '')}"></div>
          <div class="field"><label>Pets</label><input class="input" id="cb-pets" type="number" step="1" value="${esc(fam.pets || '')}"></div>
        </div>

        <div class="card anim anim-1">
          <div class="card-head"><div><div class="card-title">Budget</div></div></div>
          <div class="field"><label>Target budget (${esc(bud.currency || 'INR')})</label>
            <input class="input" id="cb-budget" type="number" step="1000" value="${esc(bud.target || '')}">
          </div>
          <div class="field"><label>Flexibility</label>
            <select class="select" id="cb-flex">
              ${option('no flexibility', bud.flexibility, 'no flexibility')}
              ${option('tight', bud.flexibility, 'tight')}
              ${option('some', bud.flexibility, 'some')}
              ${option('flexible', bud.flexibility, 'flexible')}
            </select>
          </div>
        </div>

        <div class="card anim anim-1" style="flex-basis:100%;">
          <div class="card-head"><div><div class="card-title">Design priorities</div><div class="card-sub">Rank what matters most — helps the AI trade off choices.</div></div></div>
          <div class="field"><label>Primary priorities (comma-separated)</label>
            <input class="input" id="cb-priorities" value="${esc((C.priorities || []).join(', '))}" placeholder="storage, low-maintenance, daylight">
          </div>
        </div>

        <div class="card anim anim-1">
          <div class="card-head"><div><div class="card-title">Style direction</div></div></div>
          <div class="field"><label>Directions (comma-separated)</label>
            <input class="input" id="cb-directions" value="${esc((C.style && C.style.directions || []).join(', '))}" placeholder="Warm Minimal, Japandi">
          </div>
          <div class="field"><label>Avoid (comma-separated)</label>
            <input class="input" id="cb-avoids" value="${esc((C.style && C.style.avoids || []).join(', '))}" placeholder="dark woods, chrome">
          </div>
        </div>

        <div class="card anim anim-1">
          <div class="card-head"><div><div class="card-title">Constraints</div></div></div>
          <div class="field"><label>Keep existing furniture (comma-separated)</label>
            <input class="input" id="cb-keep" value="${esc((con.keepFurniture || []).join(', '))}">
          </div>
          <div class="field"><label>Handover date</label>
            <input class="input" id="cb-handover" type="date" value="${esc(con.timeline || '')}">
          </div>
          <div class="field" style="display:flex;gap:8px;align-items:center;">
            <input type="checkbox" id="cb-vastu" ${con.vastu ? 'checked' : ''}>
            <label style="margin:0;">Vastu-aligned design required</label>
          </div>
        </div>

        <div class="card anim anim-1">
          <div class="card-head"><div><div class="card-title">Pain points</div><div class="card-sub">What's not working today.</div></div></div>
          <ul class="pain-list">
            ${(C.painPoints || []).map(function (p) { return `<li>${ic('dot')} ${esc(p)}</li>`; }).join('')}
          </ul>
          ${(!C.painPoints || !C.painPoints.length) ? `<li class="muted text-sm">No pain points captured yet — type them below.</li>` : ''}
          <textarea class="textarea" id="cb-painpoints" rows="3" placeholder="E.g. poor kitchen lighting, no storage in hall">${esc((C.painPoints || []).join('\n'))}</textarea>
        </div>

        <div class="card anim anim-1" style="flex-basis:100%;">
          <div class="card-head"><div><div class="card-title">Open questions</div><div class="card-sub">Things you still need decided.</div></div></div>
          <textarea class="textarea" id="cb-questions" rows="3" placeholder="E.g. Is quartz OK for the kitchen counter?">${esc((C.openQuestions || []).join('\n'))}</textarea>
        </div>
      </div>
    `;
  }

  function option(label, value, compare) {
    return '<option value="' + esc(label) + '" ' + (value === label || (!value && compare === 'some') ? 'selected' : '') + '>' + esc(label) + '</option>';
  }

  function splitList(v) {
    return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function splitLines(v) {
    return String(v || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function bind(container) {
    const save = container.querySelector('#cb-save');
    if (save) save.addEventListener('click', commitBrief);
    const hist = container.querySelector('#cb-version-history');
    if (hist) hist.addEventListener('click', showVersionHistory);
  }

  function commitBrief() {
    const C = ctx();
    const fam = (C.family || {});
    const bud = (C.budget || {});
    const con = (C.constraints || {});
    const patch = {
      family: {
        members: Number(document.querySelector('#cb-family-size').value) || (fam.members || 0),
        children: Number(document.querySelector('#cb-children').value) || (fam.children || 0),
        pets: Number(document.querySelector('#cb-pets').value) || (fam.pets || 0)
      },
      budget: Object.assign({}, bud, {
        target: Number(document.querySelector('#cb-budget').value) || (bud.target || 0),
        flexibility: document.querySelector('#cb-flex').value
      }),
      style: {
        directions: splitList(document.querySelector('#cb-directions').value),
        palette: (C.style && C.style.palette) || [],
        avoids: splitList(document.querySelector('#cb-avoids').value)
      },
      priorities: splitList(document.querySelector('#cb-priorities').value),
      constraints: {
        keepFurniture: splitList(document.querySelector('#cb-keep').value),
        timeline: document.querySelector('#cb-handover').value || (con.timeline || ''),
        vastu: !!document.querySelector('#cb-vastu').checked
      },
      painPoints: splitLines(document.querySelector('#cb-painpoints').value),
      openQuestions: splitLines(document.querySelector('#cb-questions').value)
    };
    store().updateContext(patch);
    window.PlanexUI.toast('Client brief saved (version ' + (store().state.contextVersion) + ').');
  }

  function showVersionHistory() {
    const versions = store().state.contextVersions || [];
    if (!versions.length) { window.PlanexUI.toast('No version history yet — save once to begin.'); return; }
    const rows = versions.map(function (v) {
      const at = v.at ? new Date(v.at).toLocaleString() : '—';
      return `<tr><td class="mono text-xs">${v.version}</td><td class="muted text-xs">${at}</td><td class="muted text-xs">${esc(v.source || 'ai')}</td>` +
        `<td><button class="btn btn-ghost btn-sm" data-revert="${v.version}">Revert</button></td></tr>`;
    }).join('');
    const html = `<table class="scope-table"><thead><tr><th>Ver</th><th>Saved</th><th>By</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
    window.PlanexUI.modal('Brief version history', html);
    setTimeout(function () {
      const box = document.querySelector('.planex-modal'); if (!box) return;
      const body = box.querySelector('.modal-body');
      if (body) {
        body.querySelectorAll('[data-revert]').forEach(function (b) {
          b.addEventListener('click', function () {
            const ok = store().revertContext(Number(b.getAttribute('data-revert')));
            if (ok) { window.PlanexUI.toast('Reverted brief.'); } else { window.PlanexUI.toast('Revert failed.'); }
            window.PlanexUI.closeModal();
            window.PlanexApp.renderView();
          });
        });
      }
    }, 0);
  }

  return { render: render };
})();
