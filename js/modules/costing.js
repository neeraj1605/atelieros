/* ============================================================
   Planex — Costing & BOQ Tab
   The ONLY place with firm, line-item money. Scope stays indicative.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Costing = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function money(n) { return store().formatMoney(n || 0); }

  function groupByPackage(boq) {
    const map = {};
    boq.forEach(function (b) {
      const key = b.category || 'Other';
      if (!map[key]) map[key] = { name: key, amount: 0, items: 0 };
      map[key].amount += (Number(b.qty) || 0) * (Number(b.rate) || 0);
      map[key].items += 1;
    });
    return Object.values(map).sort(function (a, b) { return b.amount - a.amount; });
  }

  function render(container) {
    const S = store().state;
    const boq = S.boq || [];
    const fin = store().getFinancials();
    const groups = groupByPackage(boq);

    if (!boq.length) {
      container.innerHTML = `
        <div class="view-inner">
          <div class="module-header anim">
            <div><h1 class="serif">Costing &amp; BOQ</h1>
            <p>The firm, line-item costing. Confirm your scope first, then price it here.</p></div>
          </div>
          <div class="empty anim anim-1">
            <div class="empty-icon">${ic('rupee')}</div>
            <p>${S.scopeDoc ? 'Your scope is ready. Price it to create the BOQ.' : 'Build the <strong>Scope of Work</strong> first — costing derives from it.'}</p>
            <button class="btn btn-primary" id="cost-price">${ic('plus')} ${S.scopeDoc ? 'Price the scope' : 'Go to Scope'}</button>
          </div>
        </div>`;
      const b = container.querySelector('#cost-price');
      if (b) b.addEventListener('click', function () {
        if (!store().state.scopeDoc) { window.PlanexApp.navigate('scope'); return; }
        const n = store().addScopeToBOQ();
        window.PlanexUI.toast(n + ' scope items priced into the BOQ.');
        window.PlanexApp.renderView();
      });
      return;
    }

    const summaryRows = groups.map(function (g) {
      const pct = fin.subtotal ? Math.round((g.amount / fin.subtotal) * 1000) / 10 : 0;
      return `<tr><td><div style="font-weight:600;">${esc(g.name)}</div><div class="faint text-xs">${g.items} items</div></td>
        <td class="num">${money(g.amount)}</td><td class="num">${pct}%</td></tr>`;
    }).join('');

    const bar = groups.map(function (g) {
      const pct = fin.subtotal ? (g.amount / fin.subtotal) * 100 : 0;
      const hue = (g.name.length * 47) % 360;
      return `<span class="split-seg" style="width:${pct}%;background:hsl(${hue} 45% 62%)" title="${esc(g.name)}"></span>`;
    }).join('');

    const lines = boq.map(function (b, i) {
      return `<tr>
        <td data-label="Item"><div class="boq-cat">${esc(b.category)}</div><div style="font-weight:600;">${esc(b.item)}</div></td>
        <td class="num" data-label="Qty"><input class="scope-qty" type="number" min="0" value="${b.qty}" data-cost-qty="${i}"></td>
        <td class="num muted" data-label="Unit">${esc(b.unit)}</td>
        <td class="num" data-label="Rate"><input class="scope-qty" type="number" min="0" value="${b.rate}" data-cost-rate="${i}"></td>
        <td class="num bold" data-label="Amount">${money((Number(b.qty) || 0) * (Number(b.rate) || 0))}</td>
      </tr>`;
    }).join('');

    const top = groups.slice(0, 3);

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h1 class="serif" style="margin:0;">Costing &amp; BOQ</h1>
              <span class="badge badge-info">Firm</span>
            </div>
            <p>Firm, line-item costing. Quantities come from the confirmed scope.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="cost-print">${ic('print')} Print / PDF</button>
            <button class="btn btn-secondary btn-sm" id="cost-refresh">${ic('plus')} Re-price scope</button>
            <button class="btn btn-primary btn-sm" id="cost-rfq">${ic('rupee')} Send RFQ</button>
          </div>
        </div>

        <div class="kpi-row anim anim-1" style="margin-bottom:16px;">
          <div class="kpi"><div class="k-label">Subtotal</div><div class="k-val">${money(fin.subtotal)}</div></div>
          <div class="kpi"><div class="k-label">GST 18%</div><div class="k-val">${money(fin.gst)}</div></div>
          <div class="kpi"><div class="k-label">Total</div><div class="k-val">${money(fin.total)}</div></div>
          <div class="kpi"><div class="k-label">${fin.withinBudget ? 'Within budget' : 'Over budget'}</div><div class="k-val" style="${fin.withinBudget ? '' : 'color:var(--danger)'}">${money(Math.abs(fin.variance))}</div></div>
        </div>

        <div class="card anim anim-1">
          <div class="card-head"><div><div class="card-title">Cost split by package</div><div class="card-sub">Where the money goes</div></div></div>
          <div class="split-bar">${bar}</div>
          <table class="scope-table" style="margin-top:12px;"><thead><tr><th>Work package</th><th class="num">Amount</th><th class="num">Share</th></tr></thead><tbody>${summaryRows}</tbody></table>
        </div>

        <div class="card anim anim-2" style="margin-top:14px;">
          <div class="card-head"><div><div class="card-title">Value engineering</div><div class="card-sub">Largest lines to review if you need to trim</div></div></div>
          <ul class="docket-notes">
            ${top.map(function (g) { return '<li><strong>' + esc(g.name) + '</strong> — ' + money(g.amount) + '. Review specifications before reducing scope.</li>'; }).join('')}
          </ul>
        </div>

        <div class="section-label anim anim-3">Line Items</div>
        <div class="card anim anim-3" style="padding:0;overflow:hidden;">
          <div style="overflow-x:auto;">
            <table class="boq-table">
              <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
              <tbody>${lines}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    bind(container);
  }

  function bind(container) {
    container.querySelectorAll('[data-cost-qty]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        const i = Number(inp.getAttribute('data-cost-qty'));
        const b = store().state.boq[i];
        if (b) { b.qty = Math.max(0, Number(inp.value) || 0); store().commit(); window.PlanexApp.renderView(); }
      });
    });
    container.querySelectorAll('[data-cost-rate]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        const i = Number(inp.getAttribute('data-cost-rate'));
        const b = store().state.boq[i];
        if (b) { b.rate = Math.max(0, Number(inp.value) || 0); store().commit(); window.PlanexApp.renderView(); }
      });
    });
    const print = container.querySelector('#cost-print');
    if (print) print.addEventListener('click', function () { window.print(); });
    const rfq = container.querySelector('#cost-rfq');
    if (rfq) rfq.addEventListener('click', function () { window.PlanexApp.navigate('quotation'); });
    const refresh = container.querySelector('#cost-refresh');
    if (refresh) refresh.addEventListener('click', async function () {
      const ok = await window.PlanexUI.confirm('Re-price the scope? This replaces the current BOQ.', { title: 'Re-price scope', danger: true });
      if (!ok) return;
      const n = store().addScopeToBOQ();
      window.PlanexUI.toast(n + ' items re-priced.');
      window.PlanexApp.renderView();
    });
  }

  return { render: render };
})();
