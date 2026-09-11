/* ============================================================
   Planex — Plan Reader (shared)
   One place that reads rooms from a floor plan, shows a reviewable
   diff, and applies it through the store so the spine cascades.
   Used by the Copilot, Project and Spaces surfaces.
   ============================================================ */
window.PlanexPlanReader = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  function enabled() { return window.PlanexAIClient && window.PlanexAIClient.isEnabled(); }

  function planOf(plan) {
    return plan || store().state.floorplan || null;
  }

  // Read rooms from the plan via the hosted assistant.
  async function read(plan) {
    const fp = planOf(plan);
    if (!fp) throw new Error('no_plan');
    return window.PlanexAIClient.readPlan({ kind: 'plan', name: fp.name || 'floor-plan', dataUrl: fp.dataUrl });
  }

  // Which AI rooms are new / changed / matching, and which current rooms are missing.
  function diff(aiRooms) {
    const current = store().state.rooms || [];
    const curBy = {};
    current.forEach(function (r) { curBy[String(r.name).toLowerCase()] = r; });
    const aiBy = {};
    aiRooms.forEach(function (r) { aiBy[String(r.name).toLowerCase()] = r; });

    const rows = aiRooms.map(function (r, i) {
      const cur = curBy[String(r.name).toLowerCase()];
      let status = 'new', detail = 'New room from the plan';
      if (cur) {
        const dx = Math.abs((Number(cur.length) || 0) - r.lengthM);
        const dy = Math.abs((Number(cur.width) || 0) - r.widthM);
        if (dx > 0.15 || dy > 0.15) { status = 'changed'; detail = 'Was ' + (cur.length || 0) + ' × ' + (cur.width || 0) + ' m'; }
        else { status = 'match'; detail = 'Matches your list'; }
      }
      return { index: i, room: r, cur: cur, status: status, detail: detail };
    });

    const missing = current.filter(function (r) { return !aiBy[String(r.name).toLowerCase()]; });
    return { rows: rows, missing: missing, current: current };
  }

  function reviewModal(aiRooms, opts) {
    opts = opts || {};
    const d = diff(aiRooms);

    const rows = d.rows.map(function (x) {
      const badge = x.status === 'new' ? 'badge-info' : x.status === 'changed' ? 'badge-warning' : 'badge-success';
      const label = x.status === 'new' ? 'New' : x.status === 'changed' ? 'Changed' : 'Matches';
      return `<label class="diff-row">
        <input type="checkbox" ${x.status === 'match' ? '' : 'checked'} ${x.status === 'match' ? 'disabled' : ''} data-diff-ai="${x.index}">
        <span class="diff-name">${esc(x.room.name)}</span>
        <span class="faint nowrap">${x.room.lengthM} × ${x.room.widthM} m</span>
        <span class="badge ${badge}">${label}</span>
        <span class="faint text-xs">${esc(x.detail)}</span>
      </label>`;
    }).join('');

    const missRows = d.missing.map(function (r, i) {
      return `<label class="diff-row">
        <input type="checkbox" data-diff-del="${i}">
        <span class="diff-name">${esc(r.name)}</span>
        <span class="faint nowrap">${r.length || 0} × ${r.width || 0} m</span>
        <span class="badge badge-neutral">Not found</span>
        <span class="faint text-xs">Tick to remove</span>
      </label>`;
    }).join('');

    window.PlanexUI.modal('Review rooms from the plan', `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <p class="muted text-sm">I read these rooms from your plan. Nothing changes until you apply.</p>
        <div><div class="text-xs uppercase faint bold" style="margin-bottom:6px;">From the plan</div>${rows || '<p class="muted text-sm">No rooms found.</p>'}</div>
        ${d.missing.length ? `<div><div class="text-xs uppercase faint bold" style="margin-bottom:6px;">Not found on the plan</div>${missRows}</div>` : ''}
        <p class="muted text-sm">After applying, review the Area Schedule and hit <strong>Validate plan</strong>. Dimensions are AI estimates — verify on site.</p>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
          ${d.current.length ? '<button class="btn btn-danger" id="diff-replace">Replace all</button>' : ''}
          <button class="btn btn-primary" id="diff-apply">Apply changes</button>
        </div>
      </div>
    `);

    document.querySelector('#diff-apply').addEventListener('click', function () { apply(aiRooms, d, 'merge', opts); });
    const rep = document.querySelector('#diff-replace');
    if (rep) rep.addEventListener('click', function () { apply(aiRooms, d, 'replace', opts); });
  }

  function selectedRooms(aiRooms, d) {
    const accepted = [];
    document.querySelectorAll('[data-diff-ai]').forEach(function (b) {
      if (b.disabled || b.checked) accepted.push(aiRooms[Number(b.getAttribute('data-diff-ai'))]);
    });
    const removals = [];
    document.querySelectorAll('[data-diff-del]').forEach(function (b) {
      if (b.checked) {
        const r = d.missing[Number(b.getAttribute('data-diff-del'))];
        if (r) removals.push(r.name);
      }
    });
    return { accepted: accepted, removals: removals };
  }

  function apply(aiRooms, d, mode, opts) {
    const sel = selectedRooms(aiRooms, d);
    const rooms = mode === 'replace' ? aiRooms.slice() : sel.accepted;
    if (!rooms.length && mode !== 'replace') { window.PlanexUI.toast('No rooms selected.'); return; }
    const res = store().applyRoomsDiff(rooms, { mode: mode, removals: mode === 'replace' ? [] : sel.removals });
    window.PlanexUI.closeModal();
    window.PlanexUI.toast(
      (mode === 'replace' ? 'Replaced with ' : 'Applied: ') +
      (res.added ? res.added + ' added' : '0 added') +
      (res.updated ? ', ' + res.updated + ' updated' : '') +
      (res.removed ? ', ' + res.removed + ' removed' : '') + '.'
    );
    if (typeof opts.after === 'function') { try { opts.after(res); } catch (e) { /* ignore */ } }
    window.PlanexApp.renderView();
  }

  /* Read + review. Returns the diff result or null. */
  async function readAndReview(plan, opts) {
    opts = opts || {};
    const fp = planOf(plan);
    if (!fp) { window.PlanexUI.toast('Upload a floor plan first.'); return null; }
    if (!enabled()) { window.PlanexUI.toast('Reading a plan needs the hosted assistant.'); return null; }
    if (opts.button) { opts.button.disabled = true; opts.button.textContent = opts.busyLabel || 'Reading plan…'; }
    try {
      const res = await read(fp);
      const aiRooms = (res && res.rooms) || [];
      if (!aiRooms.length) { window.PlanexUI.toast('Could not read rooms from that plan.'); return null; }
      if (opts.beforeReview) { try { opts.beforeReview(aiRooms); } catch (e) { /* ignore */ } }
      reviewModal(aiRooms, opts);
      return aiRooms;
    } catch (e) {
      window.PlanexUI.toast('Plan reading failed (' + (e && e.status ? e.status : 'network') + ').');
      return null;
    } finally {
      if (opts.button) { opts.button.disabled = false; opts.button.textContent = opts.restoreLabel || 'Read rooms (AI)'; }
    }
  }

  /* Report-only validation: compare the plan against the current room list. */
  async function validateOnly(opts) {
    opts = opts || {};
    const fp = planOf(null);
    if (!fp) return null;
    if (!enabled()) { window.PlanexUI.toast('AI validation needs the hosted assistant.'); return null; }
    try {
      const res = await read(fp);
      const aiNames = ((res && res.rooms) || []).map(function (r) { return r.name; });
      const mine = (store().state.rooms || []).map(function (r) { return r.name; });
      const missing = aiNames.filter(function (n) { return !mine.some(function (m) { return m.toLowerCase() === n.toLowerCase(); }); });
      const extra = mine.filter(function (n) { return !aiNames.some(function (a) { return a.toLowerCase() === n.toLowerCase(); }); });
      const lines = [];
      if (missing.length) lines.push('The plan appears to include: ' + missing.join(', '));
      if (extra.length) lines.push('Not clearly found on the plan: ' + extra.join(', '));
      if (!lines.length) lines.push('The room list matches what I read from the plan.');
      window.PlanexUI.modal('AI plan validation', `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <p class="muted text-sm">This only reports differences — it never changes your room list.</p>
          <div class="validation-list">${lines.map(function (l) { return `<div class="validation-row ${l.indexOf('matches') >= 0 ? 'ok' : 'warn'}">${ic('alert')} <span>${esc(l)}</span></div>`; }).join('')}</div>
          <p class="muted text-sm">AI room count: ${aiNames.length} · Your list: ${mine.length}</p>
        </div>
      `);
      return res;
    } catch (e) {
      window.PlanexUI.toast('AI validation failed (' + (e && e.status ? e.status : 'network') + ').');
      return null;
    }
  }

  return { read: read, readAndReview: readAndReview, validateOnly: validateOnly, enabled: enabled, diff: diff };
})();
