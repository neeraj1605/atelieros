/* ============================================================
   Planex AI — Quotation Module
   Vendor quotes with locked component specifications
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Quotation = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function money(n) { return store().formatMoney(n); }

  function render(container) {
    const S = store().state;
    const quotes = store().allQuotes();
    const selected = store().selectedQuote();

    const totals = quotes.map(q => q.total);
    const minTotal = Math.min.apply(null, totals);
    const maxTotal = Math.max.apply(null, totals);

    const cards = quotes.map(q => {
      const v = q.vendor;
      const isSel = S.selectedVendorId === v.id;
      const isBest = q.total === minTotal;
      const badge = v.tier === 'premium' ? 'badge-gold' : v.tier === 'value' ? 'badge-success' : 'badge-info';
      return `
        <div class="quote-card ${isSel ? 'selected' : ''}">
          <div class="quote-vendor">
            <div class="vendor-logo">${esc(v.initials)}</div>
            <div style="flex:1;min-width:0;">
              <div class="vname">${esc(v.name)}</div>
              <div class="vmeta">${v.rating} ★ • ${v.reviews} reviews • ${esc(v.city)}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="badge ${badge}">${v.tier === 'premium' ? 'Premium' : v.tier === 'value' ? 'Best Value' : 'Craft'}</span>
            ${isBest ? '<span class="badge badge-success">Lowest</span>' : ''}
            ${isSel ? '<span class="badge badge-success">' + ic('check') + ' Selected</span>' : ''}
          </div>
          <div>
            <div class="quote-price">${money(q.total)} <small>incl. GST</small></div>
            <div class="faint text-xs" style="margin-top:2px;">Subtotal ${money(q.subtotal)} + GST ${money(q.gst)}</div>
          </div>
          <div class="quote-terms">
            <div class="quote-term"><span class="qt-label">Lead time</span><span class="qt-val">${esc(v.leadTime)}</span></div>
            <div class="quote-term"><span class="qt-label">Warranty</span><span class="qt-val">${esc(v.warranty)}</span></div>
            <div class="quote-term"><span class="qt-label">Payment</span><span class="qt-val">${esc(v.payment)}</span></div>
          </div>
          <p class="muted text-xs">${esc(v.note)}</p>
          <div class="quote-actions">
            <button class="btn ${isSel ? 'btn-primary' : 'btn-secondary'} btn-block" data-select="${v.id}">
              ${isSel ? ic('check') + ' Selected — Spec Locked' : 'Select this quote'}
            </button>
          </div>
        </div>`;
    }).join('');

    // comparison table across all BOQ lines for all vendors
    const compareRows = S.boq.map((b, idx) => {
      const cells = quotes.map((q, vi) => {
        const line = q.lines[idx];
        const amount = line.qty * line.rate;
        const isMin = amount === Math.min.apply(null, quotes.map(x => x.lines[idx].qty * x.lines[idx].rate));
        return `<td class="num ${isMin ? 'compare-best' : ''}">${money(amount)}</td>`;
      }).join('');
      return `<tr>
        <td><div class="boq-cat">${esc(b.category)}</div><div style="font-weight:600;">${esc(b.item)}</div></td>
        ${cells}
      </tr>`;
    }).join('');

    const headerCells = quotes.map(q => `<th class="num">${esc(q.vendor.name.split(' ')[0])}</th>`).join('');

    const selectedPanel = selected ? `
      <div class="section-label anim anim-3">Selected Quotation</div>
      <div class="card card-pad-lg anim anim-3">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div class="vendor-logo" style="width:52px;height:52px;font-size:17px;">${esc(selected.vendor.initials)}</div>
          <div style="flex:1;min-width:220px;">
            <div style="font-size:16px;font-weight:700;">${esc(selected.vendor.name)}</div>
            <div class="muted text-sm">${selected.lines.length} line items • Specification locked • ${esc(selected.vendor.warranty)} warranty</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:24px;font-weight:750;">${money(selected.total)}</div>
            <div class="faint text-xs">Final payable incl. GST</div>
          </div>
        </div>
        <div class="hr"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="quote-export">${ic('download')} Download Quotation (PDF)</button>
          <button class="btn btn-secondary" id="quote-to-execution">${ic('build')} Start Execution Tracking</button>
        </div>
      </div>` : '';

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <h1 class="serif">Quotation</h1>
            <p>Compare verified vendor quotes line-by-line. Component specifications stay locked so nothing is silently swapped.</p>
          </div>
          <div class="badge badge-success" style="align-self:center;">${ic('lock')} Specifications Locked</div>
        </div>

        <div class="kpi-row anim anim-1" style="margin-bottom:18px;">
          <div class="kpi"><div class="k-label">Quotes received</div><div class="k-val">${quotes.length}</div></div>
          <div class="kpi"><div class="k-label">Lowest</div><div class="k-val">${money(minTotal)}</div></div>
          <div class="kpi"><div class="k-label">Highest</div><div class="k-val">${money(maxTotal)}</div></div>
          <div class="kpi"><div class="k-label">Potential saving</div><div class="k-val">${money(maxTotal - minTotal)}</div></div>
        </div>

        <div class="quote-grid anim anim-2">${cards}</div>

        <div class="section-label anim anim-2">Line-by-Line Comparison</div>
        <div class="card anim anim-2" style="padding:0;overflow:hidden;">
          <div style="overflow-x:auto;">
            <table class="compare-table">
              <thead><tr><th>Item</th>${headerCells}</tr></thead>
              <tbody>${compareRows}</tbody>
            </table>
          </div>
        </div>

        ${selectedPanel}
      </div>
    `;

    container.querySelectorAll('[data-select]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-select');
        store().selectVendor(id);
        const v = store().state.vendors.find(x => x.id === id);
        const q = store().quoteFor(v);
        window.PlanexUI.toast(`Selected ${v.name} • ${money(q.total)} (spec locked)`);
        window.PlanexApp.renderView();
      });
    });

    const exportBtn = container.querySelector('#quote-export');
    if (exportBtn) exportBtn.addEventListener('click', () => exportQuotation(selected));

    const toExec = container.querySelector('#quote-to-execution');
    if (toExec) toExec.addEventListener('click', () => window.PlanexApp.navigate('execution'));
  }

  function exportQuotation(q) {
    if (!q) return;
    const S = store().state;
    const rows = q.lines.map(l => `
      <tr><td>${esc(l.item)}</td><td style="text-align:right;">${l.qty}</td><td>${esc(l.unit)}</td>
      <td style="text-align:right;">${money(l.rate)}</td><td style="text-align:right;">${money(l.qty * l.rate)}</td></tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Quotation — ${esc(q.vendor.name)}</title>
      <style>
        body{font-family:Inter,Arial,sans-serif;color:#18181b;padding:40px;max-width:820px;margin:0 auto;}
        h1{font-size:24px;margin:0 0 4px;}
        .muted{color:#71717a;font-size:13px;}
        table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px;}
        th,td{padding:9px 10px;border-bottom:1px solid #e4e4e7;text-align:left;}
        th{background:#fafafa;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#71717a;}
        .tot td{font-weight:700;font-size:15px;}
        .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #18181b;padding-bottom:16px;}
        .badge{display:inline-block;background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;}
      </style></head><body>
      <div class="head">
        <div><h1>Planex AI — Quotation</h1><div class="muted">${esc(S.project.name)} • ${esc(S.project.tagline)}</div></div>
        <div style="text-align:right;"><div class="badge">SPEC LOCKED</div><div class="muted" style="margin-top:8px;">${new Date().toLocaleDateString('en-IN')}</div></div>
      </div>
      <p class="muted" style="margin-top:16px;">Vendor: <strong>${esc(q.vendor.name)}</strong> • ${esc(q.vendor.city)} • ${q.vendor.rating}★<br>
      Lead time: ${esc(q.vendor.leadTime)} • Warranty: ${esc(q.vendor.warranty)} • Payment: ${esc(q.vendor.payment)}</p>
      <table><thead><tr><th>Item</th><th style="text-align:right;">Qty</th><th>Unit</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="tot"><td colspan="4" style="text-align:right;">Subtotal</td><td style="text-align:right;">${money(q.subtotal)}</td></tr>
        <tr><td colspan="4" style="text-align:right;">GST (18%)</td><td style="text-align:right;">${money(q.gst)}</td></tr>
        <tr class="tot"><td colspan="4" style="text-align:right;">Total</td><td style="text-align:right;">${money(q.total)}</td></tr>
      </tfoot></table>
      <p class="muted" style="margin-top:24px;">Generated by Planex AI • All component specifications as per approved Design Docket.</p>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    else { window.PlanexUI.toast('Please allow pop-ups to download the quotation.'); }
  }

  return { render };
})();
