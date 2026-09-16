/* ============================================================
   Planex — Scope Sheets
   Vendor-facing RFQ scope documents per work package, with a
   no-assumption audit, embedded drawings, and a vendor quotes
   section (issue / upload / AI analysis / acknowledge / finalise).
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.ScopeSheets = (function () {
  let selectedId = null;
  let openSub = 'supply';
  let layoutRooms = [];
  let uploading = false;

  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function money(n, cur) {
    const c = (store().CURRENCIES && store().CURRENCIES[cur || store().state.currency]) || store().CURRENCIES.INR;
    const v = Number(n) || 0;
    return c.symbol + v.toLocaleString(c.locale, { maximumFractionDigits: 0 });
  }
  function sheets() { return store().state.scopeSheets || {}; }
  function quotesFor(pid) { return (store().state.scopeSheetQuotes || {})[pid] || []; }
  function current() {
    const all = sheets();
    if (selectedId && all[selectedId]) return all[selectedId];
    const ids = Object.keys(all);
    selectedId = ids.length ? ids[0] : null;
    return selectedId ? all[selectedId] : null;
  }

  const BASIS_LABEL = { firm: 'Firm', site: 'To be measured on site', actual: 'As per actual', unit: 'Per unit' };
  const SUBNAV = [
    ['supply', 'Scope of supply'], ['inclusions', 'Inclusions & exclusions'], ['assumptions', 'Site conditions'],
    ['drawings', 'Drawings'], ['commercial', 'Commercial & QC'], ['audit', 'Audit'], ['quotes', 'Vendor quotes']
  ];

  /* ---------------- Render ---------------- */
  function render(container) {
    const S = store().state;
    const all = sheets();
    const ids = Object.keys(all);

    if (!ids.length) {
      container.innerHTML = headerHtml(null) + `
        <div class="empty anim anim-1">
          <div class="empty-icon">${ic('docket')}</div>
          <p>${S.scopeDoc
            ? 'Generate the vendor scope sheets from your <strong>Scope of Work</strong>. Each trade gets a self-contained sheet for RFQ.'
            : 'Build the <strong>Scope of Work</strong> first — scope sheets derive from it.'}</p>
          <button class="btn btn-primary" id="ss-generate">${ic('sparkles')} ${S.scopeDoc ? 'Generate scope sheets' : 'Go to Scope'}</button>
        </div>`;
      bindEmpty(container);
      return;
    }

    const s = current();
    const stale = S.stale && S.stale.scopeSheets;
    container.innerHTML = `
      <div class="view-inner">
        ${headerHtml(s, stale)}
        <div class="ss-layout">
          <div class="card ss-list">
            <div class="card-head"><div><div class="card-title">Scope sheets</div><div class="card-sub">${ids.length} work packages</div></div></div>
            ${ids.map(function (id) { return sheetRow(all[id]); }).join('')}
          </div>
          <div class="ss-detail">
            <div class="ss-subnav">
              ${SUBNAV.map(function (x) { return `<button class="chip-toggle ${openSub === x[0] ? 'active' : ''}" data-ss-sub="${x[0]}">${esc(x[1])}</button>`; }).join('')}
            </div>
            <div class="ss-doc scope-sheet-printable" id="scope-sheet-doc">
              ${docHeader(s)}
              ${openSub === 'supply' ? supplySection(s) : ''}
              ${openSub === 'inclusions' ? inclusionsSection(s) : ''}
              ${openSub === 'assumptions' ? assumptionsSection(s) : ''}
              ${openSub === 'drawings' ? drawingsSection(s) : ''}
              ${openSub === 'commercial' ? commercialSection(s) : ''}
              ${openSub === 'audit' ? auditSection(s) : ''}
              ${openSub === 'quotes' ? quotesSection(s) : ''}
            </div>
          </div>
        </div>
      </div>`;

    bind(container, s);
    if (openSub === 'drawings') drawAll(container, s);
  }

  function headerHtml(s, stale) {
    const S = store().state;
    const anyIssue = Object.keys(sheets()).some(function (id) { return sheets()[id].status === 'issued' || sheets()[id].status === 'finalized'; });
    return `
      <div class="module-header anim">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <h1 class="serif" style="margin:0;">Scope Sheets</h1>
            ${s ? `<span class="badge ${s.audit && s.audit.passed ? 'badge-success' : 'badge-warning'}">${s.audit && s.audit.passed ? 'Audit passed' : (s.audit ? s.audit.blocking + ' blocking' : 'Audit')}</span>` : ''}
            ${stale ? '<span class="badge badge-warning">Inputs changed — new revision needed</span>' : ''}
          </div>
          <p>The vendor-facing scope for each trade: what is supplied, to what specification, on what measurement basis, with the drawings — so every quotation is on the same basis.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" id="ss-generate">${ic('sparkles')} ${s ? 'Regenerate' : 'Generate sheets'}</button>
          ${s ? `<button class="btn btn-secondary btn-sm" id="ss-enrich">${ic('wand')} Enrich (AI)</button>` : ''}
          <button class="btn btn-secondary btn-sm" id="ss-print">${ic('print')} Print sheet</button>
          <button class="btn btn-primary btn-sm" id="ss-print-pack">${ic('download')} Print pack</button>
        </div>
      </div>`;
  }

  function sheetRow(x) {
    const a = x.audit || { passed: false, blocking: 0 };
    const dot = a.passed ? 'ok' : 'warn';
    const st = x.status || 'draft';
    const badge = st === 'finalized' ? 'badge-success' : st === 'issued' ? 'badge-info' : a.passed ? 'badge-success' : 'badge-warning';
    return `<button class="ss-row ${selectedId === x.packageId ? 'active' : ''}" data-ss="${x.packageId}">
      <span class="ss-row-main">
        <span class="ss-row-name">${esc(x.title.replace(' — Scope Sheet', ''))}</span>
        <span class="faint text-xs">${esc(x.trade)} · R${x.revision || 0} · ${(x.lines || []).length} lines</span>
      </span>
      <span class="badge ${badge}">${st === 'finalized' ? 'Finalised' : st === 'issued' ? 'Issued' : (a.passed ? 'Ready' : a.blocking + ' gaps')}</span>
    </button>`;
  }

  function docHeader(s) {
    const S = store().state;
    const fp = S.floorplan;
    return `
      <div class="card ss-head">
        <div class="ss-head-top">
          <div>
            <div class="text-xs uppercase faint bold">${esc(store().state.project.name || 'Project')}</div>
            <h2 class="serif" style="margin:2px 0;">${esc(s.title)}</h2>
            <div class="muted text-sm">${esc(s.trade)} · ${esc(s.subjective ? 'Subjective trade — full specification' : 'Specified trade')}</div>
          </div>
          <div class="ss-head-meta">
            <div><span class="faint text-xs">Sheet</span><strong>${esc(s.packageId.toUpperCase())}</strong></div>
            <div><span class="faint text-xs">Revision</span><strong>R${s.revision || 0}</strong></div>
            <div><span class="faint text-xs">Plan rev</span><strong>${esc((fp && fp.id) || '—')}</strong></div>
            <div><span class="faint text-xs">Status</span><strong>${esc((s.status || 'draft').toUpperCase())}</strong></div>
          </div>
        </div>
        ${s.moodboardRef ? `<div class="ss-mood">${ic('sparkles')} <span>Finish reference${s.moodboardRef.space ? ' · ' + esc(s.moodboardRef.space) : ''}: ${esc((s.moodboardRef.materials || []).slice(0, 3).join(' · ') || (s.moodboardRef.palette || []).slice(0, 4).join(' · '))}</span></div>` : ''}
      </div>`;
  }

  function lineInput(s, l, field, placeholder) {
    return `<input class="dcell" data-pkg="${esc(s.packageId)}" data-line="${esc(l.id)}" data-field="${field}" value="${esc(l[field] || '')}" placeholder="${esc(placeholder || '')}">`;
  }

  function supplySection(s) {
    const rows = (s.lines || []).map(function (l) {
      return `<tr>
        <td data-label="Item">
          <div style="font-weight:600;">${esc(l.description)}</div>
          ${l.room ? `<div class="faint text-xs">${esc(l.room)}</div>` : ''}
          ${l.detail ? `<div class="faint text-xs">${esc(l.detail)}</div>` : ''}
        </td>
        <td data-label="Specification">${lineInput(s, l, 'spec', 'Material / make / type')}</td>
        <td data-label="Size">${lineInput(s, l, 'size', 'W×D×H mm')}</td>
        <td data-label="Finish">${lineInput(s, l, 'finish', 'Finish / shade')}</td>
        <td class="num" data-label="Qty">${l.qty} <span class="faint">${esc(l.unit)}</span></td>
        <td data-label="Basis">
          <select class="select ss-basis" data-pkg="${esc(s.packageId)}" data-line="${esc(l.id)}" data-field="basis">
            ${Object.keys(BASIS_LABEL).map(function (k) { return `<option value="${k}" ${l.basis === k ? 'selected' : ''}>${BASIS_LABEL[k]}</option>`; }).join('')}
          </select>
        </td>
        <td data-label="Measurement">${lineInput(s, l, 'method', 'How it is measured / paid')}</td>
        <td data-label="Drawing">${lineInput(s, l, 'drawingRef', 'A-01, A-02…')}</td>
      </tr>`;
    }).join('');
    return `
      <div class="card">
        <div class="card-head"><div><div class="card-title">Scope of Supply &amp; Install</div>
          <div class="card-sub">Quantities are indicative from the plan; the basis and method govern measurement. No prices here — the vendor quotes against this.</div></div></div>
        <div style="overflow-x:auto;">
          <table class="ss-table">
            <thead><tr><th>Item</th><th>Specification / Make</th><th>Size</th><th>Finish</th><th class="num">Qty</th><th>Basis</th><th>Measurement method</th><th>Drawing</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="8" class="muted">No lines — build the scope first.</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
  }

  function listEditor(s, section, title, sub) {
    const arr = s[section] || [];
    return `
      <div class="card">
        <div class="card-head"><div><div class="card-title">${esc(title)}</div><div class="card-sub">${esc(sub)}</div></div></div>
        <textarea class="textarea ss-list-edit" rows="${Math.max(4, Math.min(12, arr.length + 2))}" data-pkg="${esc(s.packageId)}" data-section="${section}">${esc(arr.join('\n'))}</textarea>
        <p class="faint text-xs" style="margin-top:6px;">One item per line.</p>
      </div>`;
  }

  function inclusionsSection(s) {
    return `
      <div class="ss-2col">
        ${listEditor(s, 'inclusions', 'Inclusions', 'What the vendor supplies and installs.')}
        ${listEditor(s, 'exclusions', 'Exclusions', 'Explicitly not in this vendor scope.')}
      </div>
      <div class="ss-2col">
        <div class="card">
          <div class="card-head"><div><div class="card-title">Client supplied</div></div></div>
          <textarea class="textarea ss-list-edit" rows="4" data-pkg="${esc(s.packageId)}" data-section="suppliedClient">${esc((s.supplied && s.supplied.client || []).join('\n'))}</textarea>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">Vendor supplied</div></div></div>
          <textarea class="textarea ss-list-edit" rows="4" data-pkg="${esc(s.packageId)}" data-section="suppliedVendor">${esc((s.supplied && s.supplied.vendor || []).join('\n'))}</textarea>
        </div>
      </div>`;
  }

  function assumptionsSection(s) {
    return `
      <div class="card">
        <div class="card-head"><div><div class="card-title">Site conditions &amp; assumptions</div>
          <div class="card-sub">Every assumption must be confirmed or answered — this is the no-assumption gate. Vendor prices on this basis.</div></div></div>
        <div class="ss-assumptions">
          ${(s.assumptions || []).map(function (a) {
            const answered = String(a.answer || '').trim();
            return `<div class="ss-assumption ${answered ? '' : 'open'}">
              <div class="ss-assumption-label">${ic(answered ? 'check' : 'alert')} <span>${esc(a.label)}</span></div>
              <input class="input" data-pkg="${esc(s.packageId)}" data-assumption="${esc(a.id)}" value="${esc(a.answer || '')}" placeholder="Confirm or note the deviation…">
            </div>`;
          }).join('') || '<p class="muted text-sm">No assumptions defined.</p>'}
        </div>
      </div>`;
  }

  function drawingsSection(s) {
    const S = store().state;
    if (!S.plan) {
      return `<div class="card"><div class="empty"><div class="empty-icon">${ic('plan')}</div>
        <p>The drawing set needs a plan footprint.</p>
        <button class="btn btn-primary btn-sm" id="ss-gen-plan">${ic('plan')} Generate plan</button></div></div>`;
    }
    return `
      <div class="card">
        <div class="card-head"><div><div class="card-title">Referenced drawings</div>
          <div class="card-sub">Issued with this sheet so the vendor builds to the same plan.</div></div></div>
        ${(s.drawings || []).map(function (d) {
          if (d.kind === 'sheet') {
            return `<div class="ss-drawing"><div class="ss-drawing-head">${esc(d.no || '')} · ${esc(d.label)}</div>
              <div class="sheet-scroll"><canvas data-drw="sheet:${esc(d.key)}"></canvas></div></div>`;
          }
          if (d.kind === 'layout') {
            const rooms = layoutRoomsFor(d.key);
            return `<div class="ss-drawing"><div class="ss-drawing-head">${esc(d.label)}</div>
              <p class="faint text-xs">${esc(window.PlanexLayoutEngine ? window.PlanexLayoutEngine.legend(d.key) : '')}</p>
              <div class="detail-grid">${rooms.map(function (r, i) {
                return `<div class="detail-card"><div class="detail-head">${esc(r.name)}</div><div class="detail-canvas"><canvas data-lay="${esc(d.key)}" data-lay-i="${i}"></canvas></div></div>`;
              }).join('') || '<p class="muted text-sm">No applicable rooms.</p>'}</div></div>`;
          }
          if (d.kind === 'unit') {
            const units = unitsFor(s);
            return `<div class="ss-drawing"><div class="ss-drawing-head">${esc(d.label)}</div>
              <div class="detail-grid">${units.map(function (u, i) {
                return `<div class="detail-card"><div class="detail-head">${esc((u.mark || '') + ' ' + (u.name || ''))}</div><div class="detail-canvas"><canvas data-unit="${i}"></canvas></div></div>`;
              }).join('') || '<p class="muted text-sm">No units in this schedule.</p>'}</div></div>`;
          }
          return '';
        }).join('')}
      </div>`;
  }

  function commercialSection(s) {
    const c = s.commercial || {};
    const row = function (k, label, ph) { return `<div class="field"><label>${esc(label)}</label><input class="input" data-pkg="${esc(s.packageId)}" data-commercial="${k}" value="${esc(c[k] || '')}" placeholder="${esc(ph || '')}"></div>`; };
    const t = s.timeline || {};
    return `
      <div class="card">
        <div class="card-head"><div><div class="card-title">Commercial basis</div><div class="card-sub">Basis only — no prices. The vendor quotes against this.</div></div></div>
        <div class="field-row">${row('gst', 'GST / taxes', 'GST at applicable rate, extra')}${row('payment', 'Payment stages', 'Advance / delivery / installation')}</div>
        <div class="field-row" style="margin-top:12px;">${row('retention', 'Retention', 'As agreed')}${row('warranty', 'Warranty', 'Minimum 2 years')}</div>
        <div style="margin-top:12px;">${row('defectLiability', 'Defect liability', 'Snag closure window')}</div>
      </div>
      <div class="card" style="margin-top:14px;">
        <div class="card-head"><div><div class="card-title">Quality, samples &amp; programme</div></div></div>
        <div class="field"><label>Duration / programme</label><input class="input" data-pkg="${esc(s.packageId)}" data-timeline="duration" value="${esc(t.duration || '')}" placeholder="As per the project programme"></div>
        <div class="ss-2col" style="margin-top:12px;">
          <div><div class="text-xs uppercase faint bold" style="margin-bottom:6px;">QC &amp; samples</div>
            <textarea class="textarea ss-list-edit" rows="5" data-pkg="${esc(s.packageId)}" data-section="qc">${esc((s.qc || []).join('\n'))}</textarea></div>
          <div><div class="text-xs uppercase faint bold" style="margin-bottom:6px;">Coordination</div>
            <textarea class="textarea ss-list-edit" rows="5" data-pkg="${esc(s.packageId)}" data-section="coordination">${esc((t.coordination || []).join('\n'))}</textarea></div>
        </div>
      </div>`;
  }

  function auditSection(s) {
    const a = s.audit || { gaps: [], blocking: 0, passed: false, override: null };
    const blocking = (a.gaps || []).filter(function (g) { return g.block; });
    const warnings = (a.gaps || []).filter(function (g) { return !g.block; });
    const rows = function (list, kind) {
      if (!list.length) return '';
      return list.map(function (g) { return `<div class="validation-row ${kind}">${ic(kind === 'ok' ? 'check' : 'alert')} <span>${esc(g.message)}</span></div>`; }).join('');
    };
    return `
      <div class="card">
        <div class="card-head">
          <div><div class="card-title">No-assumption audit</div><div class="card-sub">Issuing is blocked while any item below is open, unless you record an override.</div></div>
          <span class="badge ${a.passed ? 'badge-success' : 'badge-danger'}">${a.passed ? 'Passed' : a.blocking + ' blocking'}</span>
        </div>
        <div class="validation-list">
          ${a.passed ? `<div class="validation-row ok">${ic('check')} <span>All specifications, sizes, finishes, bases and drawings are complete.</span></div>` : rows(blocking, 'warn')}
          ${rows(warnings, 'warn')}
        </div>
        <div class="field" style="margin-top:14px;">
          <label>Override reason ${a.override ? '<span class="badge badge-warning" style="margin-left:6px;">Override active</span>' : ''}</label>
          <input class="input" id="ss-override" value="${esc(a.override ? a.override.reason : '')}" placeholder="Record why you are issuing with open items…">
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" id="ss-override-save">Save override</button>
          <button class="btn btn-primary btn-sm" id="ss-issue" ${a.passed || a.override ? '' : 'disabled'}>${ic('send')} Issue RFQ</button>
        </div>
      </div>
      <div class="card" style="margin-top:14px;">
        <div class="card-head"><div><div class="card-title">Revision history</div><div class="card-sub">Frozen on each issue.</div></div></div>
        ${(s.revisions || []).length ? (s.revisions || []).slice().reverse().map(function (r) {
          return `<div class="brief-version"><div><span class="badge badge-neutral">R${r.rev}</span>
            <span class="muted text-sm" style="margin-left:8px;">${esc(new Date(r.at).toLocaleString())} · plan ${esc(r.planRevision || '—')}</span>
            ${r.override ? '<span class="badge badge-warning" style="margin-left:8px;">Override</span>' : ''}</div></div>`;
        }).join('') : '<p class="muted text-sm">Not issued yet.</p>'}
      </div>
      <div class="card ss-ack" style="margin-top:14px;">
        <div class="card-head"><div><div class="card-title">Vendor acknowledgement</div><div class="card-sub">Signed acceptance that this scope (this revision) is the basis of the quotation.</div></div></div>
        <div class="ss-ack-grid">
          <div><span class="faint text-xs">Vendor</span><div class="ss-sign"></div></div>
          <div><span class="faint text-xs">Name &amp; designation</span><div class="ss-sign"></div></div>
          <div><span class="faint text-xs">Signature</span><div class="ss-sign"></div></div>
          <div><span class="faint text-xs">Date</span><div class="ss-sign"></div></div>
        </div>
      </div>`;
  }

  /* ---------------- Vendor quotes ---------------- */
  function quotesSection(s) {
    const S = store().state;
    const list = quotesFor(s.packageId);
    return `
      <div class="card">
        <div class="card-head">
          <div><div class="card-title">Vendor quotes</div><div class="card-sub">Issue the sheet, upload vendor quotes, let Planex AI analyse them, then acknowledge and finalise.</div></div>
          <button class="btn btn-primary btn-sm" id="ss-issue2">${ic('send')} Issue RFQ</button>
        </div>
        ${list.length ? list.map(function (q) { return quoteCard(s, q); }).join('') : '<p class="muted text-sm">No quotes yet. Issue the RFQ to a vendor to begin.</p>'}
      </div>`;
  }

  function quoteCard(s, q) {
    const st = q.status || 'received';
    const badge = st === 'finalized' ? 'badge-success' : st === 'analyzed' ? 'badge-info' : st === 'acknowledged' ? 'badge-gold' : 'badge-neutral';
    const staleQuote = q.againstRevision !== (s.revision || 0);
    const cov = q.coverage || {};
    const comp = q.compliance || {};
    return `
      <div class="ss-quote">
        <div class="ss-quote-head">
          <div>
            <div style="font-weight:650;">${esc(q.vendorName || 'Vendor')}</div>
            <div class="faint text-xs">Against R${q.againstRevision} ${staleQuote ? '<span class="badge badge-warning" style="margin-left:6px;">older revision</span>' : ''} · ${esc(st)}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="badge ${badge}">${esc(st)}</span>
            ${q.amount ? `<strong>${money(q.amount, q.currency)}</strong>` : ''}
          </div>
        </div>
        ${q.analysis ? `<p class="text-sm">${esc(q.analysis.summary || '')}</p>` : ''}
        ${cov && (cov.quoted || cov.missing || cov.extra) ? `
          <div class="ss-quote-cov">
            <span class="badge badge-success">${(cov.quoted || []).length} quoted</span>
            <span class="badge badge-warning">${(cov.missing || []).length} missing</span>
            ${(cov.extra || []).length ? `<span class="badge badge-neutral">${cov.extra.length} extra</span>` : ''}
          </div>` : ''}
        ${comp && (comp.deviations || []).length ? `
          <div class="ss-quote-dev">
            ${comp.deviations.slice(0, 6).map(function (d) { return `<div class="faint text-xs">• ${esc(d.field)}: expected <strong>${esc(d.expected)}</strong>, found <strong>${esc(d.found)}</strong></div>`; }).join('')}
          </div>` : ''}
        ${(q.lineItems || []).length ? `
          <div style="overflow-x:auto;margin-top:8px;"><table class="scope-table"><thead><tr><th>Quoted item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th><th>Maps to</th></tr></thead><tbody>
            ${q.lineItems.slice(0, 12).map(function (li) { return `<tr><td>${esc(li.description)}</td><td class="num">${li.qty}</td><td class="num">${money(li.rate, q.currency)}</td><td class="num">${money(li.amount, q.currency)}</td><td class="faint text-xs">${esc(li.sheetLineId || 'unmatched')}</td></tr>`; }).join('')}
          </tbody></table></div>` : ''}
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" data-ss-upload="${esc(q.id)}">${ic('upload')} Upload quote</button>
          <button class="btn btn-secondary btn-sm" data-ss-analyze="${esc(q.id)}" ${q.file || (q.lineItems || []).length ? '' : 'disabled'}>${ic('sparkles')} ${q.analysis ? 'Re-analyse' : 'Analyse with AI'}</button>
          ${st !== 'acknowledged' && st !== 'finalized' ? `<button class="btn btn-ghost btn-sm" data-ss-ack="${esc(q.id)}">Acknowledge</button>` : ''}
          ${st !== 'finalized' ? `<button class="btn btn-primary btn-sm" data-ss-final="${esc(q.id)}">Finalise</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-ss-del="${esc(q.id)}">Remove</button>
        </div>
        <input type="file" accept="application/pdf,image/*" hidden data-ss-file="${esc(q.id)}">
      </div>`;
  }

  /* ---------------- Bind ---------------- */
  function bindEmpty(container) {
    const b = container.querySelector('#ss-generate');
    if (b) b.addEventListener('click', function () {
      if (!store().state.scopeDoc) { window.PlanexApp.navigate('scope'); return; }
      const n = store().regenerateScopeSheets();
      window.PlanexUI.toast(n + ' scope sheets generated.');
      window.PlanexApp.renderView();
    });
  }

  function bind(container, s) {
    container.querySelectorAll('[data-ss]').forEach(function (b) {
      b.addEventListener('click', function () {
        selectedId = b.getAttribute('data-ss');
        window.PlanexApp.renderView();
      });
    });
    container.querySelectorAll('[data-ss-sub]').forEach(function (b) {
      b.addEventListener('click', function () { openSub = b.getAttribute('data-ss-sub'); window.PlanexApp.renderView(); });
    });

    const gen = container.querySelector('#ss-generate');
    if (gen) gen.addEventListener('click', function () {
      if (!store().state.scopeDoc) { window.PlanexApp.navigate('scope'); return; }
      const n = store.regenerateScopeSheets();
      window.PlanexUI.toast(n + ' scope sheets regenerated — edits kept.');
      window.PlanexApp.renderView();
    });
    const enrich = container.querySelector('#ss-enrich');
    if (enrich) enrich.addEventListener('click', function () { enrichSheet(s, enrich); });
    const print = container.querySelector('#ss-print');
    if (print) print.addEventListener('click', printSheet);
    const pack = container.querySelector('#ss-print-pack');
    if (pack) pack.addEventListener('click', printPack);

    // line edits
    container.querySelectorAll('[data-line][data-field]').forEach(function (inp) {
      const ev = inp.tagName === 'SELECT' ? 'change' : 'change';
      inp.addEventListener(ev, function () {
        store().updateSheetLine(inp.getAttribute('data-pkg'), inp.getAttribute('data-line'), { [inp.getAttribute('data-field')]: inp.value });
      });
    });
    // list editors
    container.querySelectorAll('.ss-list-edit').forEach(function (ta) {
      ta.addEventListener('change', function () {
        const arr = String(ta.value || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        const sec = ta.getAttribute('data-section');
        const pkg = ta.getAttribute('data-pkg');
        const s2 = sheets()[pkg];
        if (!s2) return;
        if (sec === 'suppliedClient') s2.supplied = Object.assign({ client: [], vendor: [] }, s2.supplied, { client: arr });
        else if (sec === 'suppliedVendor') s2.supplied = Object.assign({ client: [], vendor: [] }, s2.supplied, { vendor: arr });
        else if (sec === 'coordination') s2.timeline = Object.assign({ duration: '', coordination: [] }, s2.timeline, { coordination: arr });
        else store().setSheetSection(pkg, sec, arr);
      });
    });
    // assumptions
    container.querySelectorAll('[data-assumption]').forEach(function (inp) {
      inp.addEventListener('change', function () { store().setSheetAssumption(inp.getAttribute('data-pkg'), inp.getAttribute('data-assumption'), inp.value); });
    });
    // commercial + timeline
    container.querySelectorAll('[data-commercial]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        const s2 = sheets()[inp.getAttribute('data-pkg')]; if (!s2) return;
        s2.commercial = Object.assign({}, s2.commercial, { [inp.getAttribute('data-commercial')]: inp.value });
        store().commit();
      });
    });
    container.querySelectorAll('[data-timeline]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        const s2 = sheets()[inp.getAttribute('data-pkg')]; if (!s2) return;
        s2.timeline = Object.assign({ duration: '', coordination: [] }, s2.timeline, { [inp.getAttribute('data-timeline')]: inp.value });
        store().commit();
      });
    });
    // audit override + issue
    const ovSave = container.querySelector('#ss-override-save');
    if (ovSave) ovSave.addEventListener('click', function () {
      const v = container.querySelector('#ss-override').value;
      store().setSheetOverride(s.packageId, v);
      window.PlanexUI.toast(v ? 'Override recorded.' : 'Override cleared.');
      window.PlanexApp.renderView();
    });
    const issue = container.querySelector('#ss-issue');
    if (issue) issue.addEventListener('click', function () { issueDialog(s); });
    const issue2 = container.querySelector('#ss-issue2');
    if (issue2) issue2.addEventListener('click', function () { issueDialog(s); });

    // plan generation from drawings tab
    const gp = container.querySelector('#ss-gen-plan');
    if (gp) gp.addEventListener('click', function () { store().regeneratePlan(); window.PlanexApp.renderView(); });

    // quotes
    container.querySelectorAll('[data-ss-upload]').forEach(function (b) {
      b.addEventListener('click', function () {
        const input = container.querySelector('[data-ss-file="' + b.getAttribute('data-ss-upload') + '"]');
        if (input) input.click();
      });
    });
    container.querySelectorAll('[data-ss-file]').forEach(function (input) {
      input.addEventListener('change', function (e) {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        if (f.size > 4 * 1024 * 1024) { window.PlanexUI.toast('Quote too large (max 4 MB).'); return; }
        const qid = input.getAttribute('data-ss-file');
        const reader = new FileReader();
        reader.onload = function () {
          store().updateSheetQuote(s.packageId, qid, { file: { name: f.name, mime: f.type || 'application/pdf', size: f.size, dataUrl: reader.result }, source: 'upload', receivedAt: new Date().toISOString(), status: 'received' });
          window.PlanexUI.toast('Quote attached. Running AI analysis…');
          analyzeQuote(s, qid);
        };
        reader.readAsDataURL(f);
      });
    });
    container.querySelectorAll('[data-ss-analyze]').forEach(function (b) {
      b.addEventListener('click', function () { analyzeQuote(s, b.getAttribute('data-ss-analyze')); });
    });
    container.querySelectorAll('[data-ss-ack]').forEach(function (b) {
      b.addEventListener('click', function () { store().setSheetQuoteStatus(s.packageId, b.getAttribute('data-ss-ack'), 'acknowledged'); window.PlanexApp.renderView(); });
    });
    container.querySelectorAll('[data-ss-final]').forEach(function (b) {
      b.addEventListener('click', async function () {
        const ok = await window.PlanexUI.confirm('Finalise this quote? It will be locked against R' + (s.revision || 0) + '.', { title: 'Finalise quote' });
        if (!ok) return;
        store().setSheetQuoteStatus(s.packageId, b.getAttribute('data-ss-final'), 'finalized');
        window.PlanexUI.toast('Quote finalised.');
        window.PlanexApp.renderView();
      });
    });
    container.querySelectorAll('[data-ss-del]').forEach(function (b) {
      b.addEventListener('click', async function () {
        const ok = await window.PlanexUI.confirm('Remove this quote?', { title: 'Remove quote', danger: true });
        if (!ok) return;
        store().deleteSheetQuote(s.packageId, b.getAttribute('data-ss-del'));
        window.PlanexApp.renderView();
      });
    });
  }

  /* ---------------- AI ---------------- */
  async function enrichSheet(s, btn) {
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) { window.PlanexUI.toast('Enrichment needs the hosted assistant.'); return; }
    const prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Enriching…'; }
    try {
      const S = store().state;
      const res = await window.PlanexAIClient.enrichScopeSheet({
        sheet: { packageId: s.packageId, trade: s.trade, title: s.title, lines: s.lines, inclusions: s.inclusions, exclusions: s.exclusions },
        projectType: (S.project && S.project.projectType) || 'ready',
        quality: S.scopeQuality || 'standard',
        rooms: (S.rooms || []).map(function (r) { return r.name; }),
        planSummary: S.plan ? { widthM: S.plan.widthM, heightM: S.plan.heightM, rooms: S.plan.rooms.length } : null,
        moodboard: s.moodboardRef,
        theme: S.theme
      });
      if (res && res.enrichment) {
        const n = store().mergeSheetEnrichment(s.packageId, res.enrichment, res.model);
        window.PlanexUI.toast(n + ' lines enriched — quantities unchanged.');
        window.PlanexApp.renderView();
        return;
      }
      window.PlanexUI.toast('No enrichment returned.');
    } catch (e) {
      window.PlanexUI.toast('Enrichment failed (' + (e && e.status ? e.status : 'network') + ').');
    }
    if (btn) { btn.disabled = false; btn.textContent = prev; }
  }

  async function analyzeQuote(s, quoteId) {
    const q = quotesFor(s.packageId).filter(function (x) { return x.id === quoteId; })[0];
    if (!q) return;
    if (!q.file || !q.file.dataUrl) { window.PlanexUI.toast('Upload a quote file first.'); return; }
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) { window.PlanexUI.toast('Analysis needs the hosted assistant.'); return; }
    if (uploading) return;
    uploading = true;
    try {
      const comma = String(q.file.dataUrl).indexOf(',');
      const data = comma >= 0 ? q.file.dataUrl.slice(comma + 1) : '';
      const res = await window.PlanexAIClient.analyzeQuote({
        sheet: { packageId: s.packageId, trade: s.trade, lines: s.lines, projectType: (store().state.project && store().state.project.projectType) || 'ready', quality: store().state.scopeQuality },
        file: { mime: q.file.mime, data: data },
        vendorName: q.vendorName
      });
      if (res && res.analysis) {
        store().mergeQuoteAnalysis(s.packageId, quoteId, res.analysis, res.model);
        window.PlanexUI.toast('Quote analysed — review the coverage and deviations.');
        window.PlanexApp.renderView();
        return;
      }
      window.PlanexUI.toast('No analysis returned.');
    } catch (e) {
      window.PlanexUI.toast('Analysis failed (' + (e && e.status ? e.status : 'network') + ').');
    } finally {
      uploading = false;
    }
  }

  function issueDialog(s) {
    const S = store().state;
    const a = s.audit || {};
    if (!window.PlanexScopeSheetEngine.canIssue(s)) {
      window.PlanexUI.toast('Audit has ' + (a.blocking || 0) + ' blocking item(s). Resolve them or record an override.');
      openSub = 'audit';
      window.PlanexApp.renderView();
      return;
    }
    const vendors = S.vendors || [];
    window.PlanexUI.modal('Issue RFQ — ' + esc(s.trade), `
      <p class="muted text-sm" style="margin-bottom:10px;">This freezes R${(s.revision || 0) + 1} with the plan revision and drawings, then records a quote request per vendor.</p>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
        ${vendors.map(function (v) {
          return `<label class="diff-row"><input type="checkbox" data-issue-vendor="${esc(v.id)}" checked>
            <span class="diff-name">${esc(v.name)}</span><span class="faint text-xs">${esc(v.city || '')} · ${esc(v.tier || '')}</span></label>`;
        }).join('')}
      </div>
      <button class="btn btn-primary btn-block" id="ss-issue-go">${ic('send')} Issue &amp; freeze R${(s.revision || 0) + 1}</button>
    `);
    document.querySelector('#ss-issue-go').addEventListener('click', function () {
      const ids = [];
      document.querySelectorAll('[data-issue-vendor]').forEach(function (b) { if (b.checked) ids.push(b.getAttribute('data-issue-vendor')); });
      const r = store().issueScopeSheet(s.packageId, { vendorIds: ids });
      if (r && r.error) { window.PlanexUI.toast('Could not issue — audit blocked.'); return; }
      window.PlanexUI.closeModal();
      openSub = 'quotes';
      window.PlanexUI.toast('Issued R' + (r ? r.revision : '') + ' to ' + ids.length + ' vendor(s).');
      window.PlanexApp.renderView();
    });
  }

  /* ---------------- Drawings ---------------- */
  function layoutRoomsFor(kind) {
    let rooms = store().state.rooms || [];
    const sp = store().activeSpace ? store().activeSpace() : null;
    if (sp) rooms = rooms.filter(function (r) { return r.id === sp.id; });
    if (kind === 'plumbing') rooms = rooms.filter(function (r) { return /bath|wc|toilet|kitchen|utility|balcony/i.test(r.name); });
    return rooms;
  }
  function unitsFor(s) {
    const set = store().state.docketSet;
    if (!set) return [];
    const furn = (set.dockets || []).filter(function (d) { return d.id === 'furniture'; })[0];
    return (furn && furn.units) || [];
  }

  function drawAll(container, s) {
    const S = store().state;
    const plan = S.plan;
    (s.drawings || []).forEach(function (d) {
      if (d.kind === 'sheet' && plan && window.PlanexDrawingEngine) {
        const cv = container.querySelector('[data-drw="sheet:' + d.key + '"]');
        if (cv) window.PlanexDrawingEngine.drawSheet(cv, d.key, plan, {
          project: S.project.name, date: new Date().toLocaleDateString(), revision: 'P0',
          provisional: !(S.floorplan && S.floorplan.validated)
        });
      } else if (d.kind === 'layout' && window.PlanexLayoutEngine) {
        const rooms = layoutRoomsFor(d.key);
        container.querySelectorAll('[data-lay="' + d.key + '"]').forEach(function (cv) {
          const r = rooms[Number(cv.getAttribute('data-lay-i'))];
          if (r) window.PlanexLayoutEngine.draw(cv, d.key, r);
        });
      } else if (d.kind === 'unit' && window.PlanexDetailEngine) {
        const units = unitsFor(s);
        container.querySelectorAll('[data-unit]').forEach(function (cv) {
          const u = units[Number(cv.getAttribute('data-unit'))];
          if (u) window.PlanexDetailEngine.drawUnit(cv, u);
        });
      }
    });
  }

  /* ---------------- Print ---------------- */
  function printSheet() {
    document.body.classList.add('printing-sheet');
    setTimeout(function () {
      window.print();
      setTimeout(function () { document.body.classList.remove('printing-sheet'); }, 400);
    }, 60);
  }

  function renderSheetToHtml(s) {
    const S = store().state;
    const canv = document.createElement('canvas');
    const imgs = [];
    (s.drawings || []).forEach(function (d) {
      try {
        if (d.kind === 'sheet' && S.plan && window.PlanexDrawingEngine) {
          window.PlanexDrawingEngine.drawSheet(canv, d.key, S.plan, { project: S.project.name, date: new Date().toLocaleDateString(), revision: 'P0', provisional: !(S.floorplan && S.floorplan.validated) });
          imgs.push({ label: (d.no || '') + ' · ' + d.label, url: canv.toDataURL('image/png') });
        } else if (d.kind === 'unit' && window.PlanexDetailEngine) {
          unitsFor(s).forEach(function (u) {
            window.PlanexDetailEngine.drawUnit(canv, u);
            imgs.push({ label: (u.mark || '') + ' ' + (u.name || ''), url: canv.toDataURL('image/png') });
          });
        } else if (d.kind === 'layout' && window.PlanexLayoutEngine) {
          layoutRoomsFor(d.key).forEach(function (r) {
            window.PlanexLayoutEngine.draw(canv, d.key, r);
            imgs.push({ label: r.name + ' — ' + d.label, url: canv.toDataURL('image/png') });
          });
        }
      } catch (e) { /* skip */ }
    });
    const lineRows = (s.lines || []).map(function (l) {
      return `<tr><td>${esc(l.description)}${l.room ? ' <span class="muted">· ' + esc(l.room) + '</span>' : ''}</td>
        <td>${esc(l.spec || '')}</td><td>${esc(l.size || '')}</td><td>${esc(l.finish || '')}</td>
        <td>${l.qty} ${esc(l.unit || '')}</td><td>${esc(BASIS_LABEL[l.basis] || l.basis || '')}</td>
        <td>${esc(l.method || '')}</td><td>${esc(l.drawingRef || '')}</td></tr>`;
    }).join('');
    const ul = function (title, arr) { return (arr && arr.length) ? `<h3>${esc(title)}</h3><ul>${arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('')}</ul>` : ''; };
    const c = s.commercial || {};
    return `
      <section class="pack-sheet">
        <div class="pack-head">
          <div><div class="muted">${esc(S.project.name || '')}</div><h1>${esc(s.title)}</h1>
          <div class="muted">${esc(s.trade)} · Sheet ${esc(s.packageId.toUpperCase())} · R${s.revision || 0} · Plan ${esc((S.floorplan && S.floorplan.id) || '—')}</div></div>
          <div class="muted">${esc(new Date().toLocaleDateString())}</div>
        </div>
        <h2>Scope of Supply &amp; Install</h2>
        <table><thead><tr><th>Item</th><th>Spec / Make</th><th>Size</th><th>Finish</th><th>Qty</th><th>Basis</th><th>Measurement</th><th>Drawing</th></tr></thead><tbody>${lineRows}</tbody></table>
        ${ul('Inclusions', s.inclusions)}${ul('Exclusions', s.exclusions)}
        ${ul('Client supplied', s.supplied && s.supplied.client)}${ul('Vendor supplied', s.supplied && s.supplied.vendor)}
        ${ul('Site conditions & assumptions', (s.assumptions || []).map(function (a) { return a.label + (a.answer ? ' — ' + a.answer : ''); }))}
        ${ul('Measurement & rate basis', s.measurement)}
        ${ul('QC & samples', s.qc)}
        <h3>Commercial basis</h3>
        <ul><li>GST: ${esc(c.gst || '')}</li><li>Payment: ${esc(c.payment || '')}</li><li>Retention: ${esc(c.retention || '')}</li><li>Warranty: ${esc(c.warranty || '')}</li><li>Defect liability: ${esc(c.defectLiability || '')}</li></ul>
        ${imgs.length ? '<h3>Drawings</h3>' + imgs.map(function (im) { return `<div class="pack-drw"><div class="muted">${esc(im.label)}</div><img src="${im.url}"></div>`; }).join('') : ''}
        <div class="pack-ack"><div>Vendor: ____________________</div><div>Signature: ____________________</div><div>Date: ____________</div></div>
        <p class="muted">Planex scope sheet · revision R${s.revision || 0} · quantities indicative; measurement per the stated basis. No prices.</p>
      </section>`;
  }

  function printPack() {
    const all = sheets();
    const ids = Object.keys(all);
    if (!ids.length) { window.PlanexUI.toast('No sheets to print.'); return; }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Planex — Scope Sheet Pack</title>
      <style>
        body{font-family:Inter,Arial,sans-serif;color:#18181b;padding:32px;max-width:900px;margin:0 auto;font-size:12px;}
        h1{font-size:20px;margin:2px 0;} h2{font-size:14px;margin:18px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px;} h3{font-size:12px;margin:12px 0 4px;text-transform:uppercase;letter-spacing:.05em;color:#52525b;}
        .muted{color:#71717a;font-size:11px;}
        table{width:100%;border-collapse:collapse;margin-top:6px;font-size:10.5px;} th,td{border:1px solid #e4e4e7;padding:5px 6px;text-align:left;vertical-align:top;}
        th{background:#fafafa;font-size:9.5px;text-transform:uppercase;color:#71717a;}
        ul{margin:4px 0 0 16px;padding:0;} li{margin:2px 0;}
        .pack-sheet{page-break-after:always;padding-bottom:20px;} .pack-head{display:flex;justify-content:space-between;border-bottom:2px solid #18181b;padding-bottom:8px;}
        .pack-drw{margin:8px 0;} .pack-drw img{width:100%;border:1px solid #e4e4e7;margin-top:4px;}
        .pack-ack{display:flex;gap:24px;margin-top:18px;font-size:11px;}
      </style></head><body>
      ${ids.map(function (id) { return renderSheetToHtml(all[id]); }).join('')}
      <script>window.onload=function(){window.print();}<\/script></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    else window.PlanexUI.toast('Please allow pop-ups to print the pack.');
  }

  return { render: render };
})();
