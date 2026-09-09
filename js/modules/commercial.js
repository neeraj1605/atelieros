// AtelierFlow - Commercial & Procurement Module (BOQ, Spec Sheets, POs)
import { stateManager } from './state.js';

let commercialFilterRoom = 'all';
let commercialFilterCategory = 'all';

export function renderCommercial(container) {
  const { products, rooms, purchaseOrders, isClientMode } = stateManager.state;
  const financials = stateManager.getFinancials();

  // Filter products for BOQ
  const filteredProducts = products.filter(p => {
    const matchesRoom = commercialFilterRoom === 'all' || p.room === commercialFilterRoom;
    const matchesCat = commercialFilterCategory === 'all' || p.category === commercialFilterCategory;
    return matchesRoom && matchesCat;
  });

  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  container.innerHTML = `
    <!-- COMMERCIAL HEADER -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-bottom:4px;">Commercial & Procurement Engine</h2>
        <p class="text-secondary text-sm">Dynamic Bill of Quantities (BOQ), trade discounts, client markups, and purchase orders</p>
      </div>

      <div style="display:flex; gap:10px; align-items:center;">
        <button class="client-mode-toggle ${isClientMode ? 'active' : ''}" id="btn-toggle-client-mode">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          ${isClientMode ? 'Client Mode: ACTIVE (Margins Hidden)' : 'Designer Mode (Full Trade Margins)'}
        </button>

        <button class="btn btn-primary btn-sm" id="btn-create-po">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          Generate Purchase Order
        </button>
      </div>
    </div>

    <!-- KPI STRIP -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Client Commercial Total</div>
        <div class="kpi-value text-accent">${stateManager.formatCurrency(financials.totalClientPrice)}</div>
        <div class="kpi-sub text-secondary">
          Target Budget: ${stateManager.formatCurrency(financials.targetBudget)} 
          <span style="color:${financials.isUnderBudget ? 'var(--status-approved)' : 'var(--status-urgent)'}; font-weight:600;">
            (${financials.isUnderBudget ? 'Under Target' : 'Variance Over Target'})
          </span>
        </div>
      </div>

      ${!isClientMode ? `
        <div class="kpi-card">
          <div class="kpi-label">Total Trade Procurement Cost</div>
          <div class="kpi-value text-primary">${stateManager.formatCurrency(financials.totalCostPrice)}</div>
          <div class="kpi-sub text-secondary">Wholesale Trade Cost Baseline</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Studio Gross Profit Margin</div>
          <div class="kpi-value text-gold">${stateManager.formatCurrency(financials.grossMarginDollars)}</div>
          <div class="kpi-sub text-secondary">
            Average Realized Margin: <strong style="color:var(--text-primary);">${Math.round(financials.grossMarginPercent)}%</strong>
          </div>
        </div>
      ` : `
        <div class="kpi-card">
          <div class="kpi-label">Payment Schedule</div>
          <div class="kpi-value text-primary">50% / 50%</div>
          <div class="kpi-sub text-secondary">Deposit on PO • Balance on Warehouse Arrival</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Client Guarantee</div>
          <div class="kpi-value" style="color:var(--status-approved);">100% Guaranteed</div>
          <div class="kpi-sub text-secondary">Manufacturer warranties + Atelier installation care</div>
        </div>
      `}

      <div class="kpi-card">
        <div class="kpi-label">Committed Vendor Orders</div>
        <div class="kpi-value text-primary">${stateManager.formatCurrency(financials.totalCommittedPO)}</div>
        <div class="kpi-sub text-secondary">${purchaseOrders.length} Active Purchase Orders</div>
      </div>
    </div>

    <!-- BOQ MATRIX CONTROLS -->
    <div class="card" style="margin-bottom:28px;">
      <div class="card-header">
        <div>
          <h3 class="card-title">Bill of Quantities (BOQ) Schedule</h3>
          <p class="text-secondary text-sm">Real-time spreadsheet matrix with live trade markup & quantity calculation</p>
        </div>

        <div style="display:flex; gap:10px;">
          <select id="boq-filter-room" class="filter-select">
            <option value="all">All Rooms</option>
            ${rooms.map(r => `<option value="${r.id}" ${commercialFilterRoom === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
          </select>

          <select id="boq-filter-category" class="filter-select">
            <option value="all">All Categories</option>
            ${categories.map(c => `<option value="${c}" ${commercialFilterCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>

          <button class="btn btn-secondary btn-sm" id="btn-print-proposal">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Proposal
          </button>
        </div>
      </div>

      <div class="boq-table-container">
        <table class="boq-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Item & Finish</th>
              <th>Room</th>
              <th>Vendor</th>
              <th>Qty</th>
              ${!isClientMode ? `
                <th>Trade Cost</th>
                <th>Markup %</th>
              ` : ''}
              <th>Client Price</th>
              ${!isClientMode ? `
                <th>Total Cost</th>
              ` : ''}
              <th>Total Client Price</th>
              ${!isClientMode ? `
                <th>Profit Margin</th>
              ` : ''}
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${filteredProducts.map(p => {
              const qty = p.quantity || 1;
              const cost = (p.tradeCost || 0) * qty;
              const clientTotal = (p.clientPrice || 0) * qty;
              const marginDol = clientTotal - cost;
              const roomObj = rooms.find(r => r.id === p.room);

              return `
                <tr>
                  <td><span class="project-code" style="font-size:0.75rem;">${p.sku}</span></td>
                  <td>
                    <div class="boq-item-cell">
                      <img src="${p.imageUrl}" class="boq-item-thumb" alt="${p.name}">
                      <div>
                        <strong style="color:var(--text-primary);">${p.name}</strong>
                        <div class="text-xs text-muted" style="max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                          ${p.finish}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge badge-neutral" style="font-size:0.7rem;">${roomObj ? roomObj.name : 'General'}</span></td>
                  <td><span class="text-secondary">${p.vendor}</span></td>
                  <td>
                    <input type="number" min="1" max="99" class="boq-qty-input" data-prod-id="${p.id}" value="${qty}">
                  </td>

                  ${!isClientMode ? `
                    <td>${stateManager.formatCurrency(p.tradeCost)}</td>
                    <td>
                      <input type="number" min="0" max="200" class="boq-markup-input" data-prod-id="${p.id}" value="${p.markupPercent || 35}">%
                    </td>
                  ` : ''}

                  <td class="font-medium">${stateManager.formatCurrency(p.clientPrice)}</td>

                  ${!isClientMode ? `
                    <td class="text-secondary">${stateManager.formatCurrency(cost)}</td>
                  ` : ''}

                  <td class="font-bold text-accent">${stateManager.formatCurrency(clientTotal)}</td>

                  ${!isClientMode ? `
                    <td class="text-gold font-medium">+${stateManager.formatCurrency(marginDol)}</td>
                  ` : ''}

                  <td><span class="badge badge-progress" style="font-size:0.68rem;">${p.procurementStatus}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm btn-spec-sheet" data-prod-id="${p.id}" title="Generate Architectural Spec Cut Sheet">
                      Cut Sheet
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- PURCHASE ORDER PIPELINE -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Procurement Pipeline & Purchase Orders</h3>
          <p class="text-secondary text-sm">Track deposits, vendor contracts, and shipping fulfillment</p>
        </div>
        <span class="text-xs text-secondary">${purchaseOrders.length} Issued POs</span>
      </div>

      <div style="overflow-x:auto;">
        <table class="boq-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Vendor / Manufacturer</th>
              <th>Date Issued</th>
              <th>Est. Delivery</th>
              <th>Total Order</th>
              <th>Deposit Paid (50%)</th>
              <th>Balance Due</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${purchaseOrders.map(po => `
              <tr>
                <td><span class="project-code font-bold">${po.poNumber}</span></td>
                <td>
                  <strong>${po.vendor}</strong>
                  <div class="text-xs text-muted">${po.vendorEmail}</div>
                </td>
                <td class="text-muted">${po.orderDate}</td>
                <td class="font-medium">${po.deliveryDateEst}</td>
                <td class="font-bold">${stateManager.formatCurrency(po.totalAmount)}</td>
                <td style="color:var(--status-approved);">${stateManager.formatCurrency(po.depositPaid)}</td>
                <td class="text-secondary">${stateManager.formatCurrency(po.balanceDue)}</td>
                <td>
                  <select class="filter-select po-status-select" data-po-id="${po.id}" style="padding:4px 8px; font-size:0.75rem;">
                    <option value="Draft" ${po.status === 'Draft' ? 'selected' : ''}>Draft</option>
                    <option value="Deposit Paid (50%)" ${po.status.includes('Deposit Paid') ? 'selected' : ''}>Deposit Paid (50%)</option>
                    <option value="In Production" ${po.status === 'In Production' ? 'selected' : ''}>In Production</option>
                    <option value="Delivered to Warehouse" ${po.status.includes('Delivered') ? 'selected' : ''}>Delivered to Warehouse</option>
                  </select>
                </td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="alert('Viewing Purchase Order ${po.poNumber}\\nVendor: ${po.vendor}\\nTotal: $${po.totalAmount}')">
                    View PO
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach Client Mode Toggle
  const clientToggle = container.querySelector('#btn-toggle-client-mode');
  if (clientToggle) {
    clientToggle.addEventListener('click', () => {
      stateManager.toggleClientMode();
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: stateManager.state.isClientMode ? 'Client Mode Enabled: Trade margins hidden for presentation' : 'Designer Mode Enabled: Full trade costs and markups visible' } 
      }));
    });
  }

  // Attach BOQ Room and Category Filters
  const roomFilter = container.querySelector('#boq-filter-room');
  if (roomFilter) {
    roomFilter.addEventListener('change', (e) => {
      commercialFilterRoom = e.target.value;
      renderCommercial(container);
    });
  }

  const catFilter = container.querySelector('#boq-filter-category');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      commercialFilterCategory = e.target.value;
      renderCommercial(container);
    });
  }

  // Attach editable Qty inputs
  container.querySelectorAll('.boq-qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const prodId = input.getAttribute('data-prod-id');
      const val = parseInt(e.target.value, 10) || 1;
      stateManager.updateProduct(prodId, { quantity: val });
    });
  });

  // Attach editable Markup inputs
  container.querySelectorAll('.boq-markup-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const prodId = input.getAttribute('data-prod-id');
      const val = parseFloat(e.target.value) || 35;
      stateManager.updateProduct(prodId, { markupPercent: val });
    });
  });

  // Attach Spec Sheet buttons
  container.querySelectorAll('.btn-spec-sheet').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.getAttribute('data-prod-id');
      window.dispatchEvent(new CustomEvent('open-spec-sheet', { detail: { productId: prodId } }));
    });
  });

  // Attach PO status dropdowns
  container.querySelectorAll('.po-status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const poId = select.getAttribute('data-po-id');
      stateManager.updatePOStatus(poId, e.target.value);
    });
  });

  // Generate Purchase Order modal trigger
  const createPoBtn = container.querySelector('#btn-create-po');
  if (createPoBtn) {
    createPoBtn.addEventListener('click', () => {
      const vendorName = prompt('Enter vendor name for new Purchase Order:', 'Atelier Woodcraft Bespoke');
      if (vendorName) {
        stateManager.createPurchaseOrder({
          vendor: vendorName,
          vendorEmail: 'orders@vendor.com',
          totalAmount: 18500,
          deliveryDateEst: '2026-11-15'
        });
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Purchase order created for ${vendorName}!` } }));
      }
    });
  }

  // Print Proposal button
  const printBtn = container.querySelector('#btn-print-proposal');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}
