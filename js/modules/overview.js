// AtelierFlow - Overview & Lifecycle Health Map Module
import { stateManager } from './state.js';

export function renderOverview(container) {
  const { project, rooms, products, samples, timeline, tasks, snags, renders, isClientMode } = stateManager.state;
  const financials = stateManager.getFinancials();

  // Calculate pillar completion metrics
  const approvedSamples = samples.filter(s => s.status === 'Approved').length;
  const sampleProgress = Math.round((approvedSamples / (samples.length || 1)) * 100);

  const approvedRenders = renders.filter(r => r.clientStatus.includes('Approved')).length;
  const designProgress = Math.round((approvedRenders / (renders.length || 1)) * 100);

  const poItemsCount = products.filter(p => ['PO Issued', 'Deposit Paid', 'In Production', 'Shipped', 'Delivered', 'Installed'].includes(p.procurementStatus)).length;
  const commercialProgress = Math.round((poItemsCount / (products.length || 1)) * 100);

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const taskProgress = Math.round((completedTasks / (tasks.length || 1)) * 100);

  const openSnags = snags.filter(s => s.status === 'Open').length;
  const resolvedSnags = snags.filter(s => s.status === 'Resolved').length;

  container.innerHTML = `
    <!-- PROJECT HERO BANNER -->
    <div class="overview-hero">
      <div class="hero-grid">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom: 12px;">
            <span class="badge badge-approved" style="font-size:0.75rem;">${project.status}</span>
            <span class="badge badge-neutral" style="font-family:monospace;">${project.code}</span>
          </div>
          <h1 class="hero-meta-title">${project.name}</h1>
          <div class="hero-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${project.location}</span>
            <span style="color:var(--border-medium);">|</span>
            <span>Client: <strong>${project.client}</strong></span>
          </div>
          <p class="hero-description">${project.description}</p>
        </div>

        <div class="hero-stats-panel">
          <div class="hero-stat-row">
            <span class="text-secondary">Lead Architect</span>
            <span class="font-medium">${project.leadArchitect}</span>
          </div>
          <div class="hero-stat-row">
            <span class="text-secondary">General Contractor</span>
            <span class="font-medium">${project.contractor}</span>
          </div>
          <div class="hero-stat-row">
            <span class="text-secondary">Total Area</span>
            <span class="font-medium">${project.totalAreaSqm} m² / ${project.totalAreaSqft} sq ft</span>
          </div>
          <div class="hero-stat-row">
            <span class="text-secondary">Target Handover</span>
            <span class="font-medium text-accent">${project.handoverDate}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- THE 4-PILLAR LIFECYCLE MAP (INTERACTIVE FLOW) -->
    <div class="card lifecycle-flow-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Interior Project Lifecycle Nerve Center</h2>
          <p class="text-secondary text-sm">Unified tracking across all 4 pillars from product curation to turnkey delivery</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-sm" id="btn-export-json">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Project Data
          </button>
        </div>
      </div>

      <div class="lifecycle-stages-bar">
        <!-- Stage 1 -->
        <div class="stage-step-card" data-nav-target="discovery" style="--step-progress: ${sampleProgress}%;">
          <div class="stage-num">PILLAR 01</div>
          <div class="stage-name">Product Discovery</div>
          <div class="stage-subtext">FF&E catalog, moodboards, material swatches & physical sample approval.</div>
          <div class="stage-progress-badge">
            <span>${products.length} Products Curated</span>
            <span>•</span>
            <span style="color:var(--status-approved);">${sampleProgress}% Samples Approved</span>
          </div>
        </div>

        <!-- Stage 2 -->
        <div class="stage-step-card" data-nav-target="design" style="--step-progress: ${designProgress}%;">
          <div class="stage-num">PILLAR 02</div>
          <div class="stage-name">Design & Spatial</div>
          <div class="stage-subtext">2D scaled floorplans, furniture placement, room finishes & 3D render feedback.</div>
          <div class="stage-progress-badge">
            <span>${rooms.length} Rooms Mapped</span>
            <span>•</span>
            <span style="color:var(--status-approved);">${designProgress}% Visuals Signed</span>
          </div>
        </div>

        <!-- Stage 3 -->
        <div class="stage-step-card" data-nav-target="commercial" style="--step-progress: ${commercialProgress}%;">
          <div class="stage-num">PILLAR 03</div>
          <div class="stage-name">Commercial & BOQ</div>
          <div class="stage-subtext">Bill of Quantities, trade pricing, margin modeling, spec sheets & PO issuance.</div>
          <div class="stage-progress-badge">
            <span>${stateManager.formatCurrency(financials.totalClientPrice)}</span>
            <span>•</span>
            <span style="color:var(--status-progress);">${commercialProgress}% Procured</span>
          </div>
        </div>

        <!-- Stage 4 -->
        <div class="stage-step-card" data-nav-target="project-mgmt" style="--step-progress: ${taskProgress}%;">
          <div class="stage-num">PILLAR 04</div>
          <div class="stage-name">Project Management</div>
          <div class="stage-subtext">7-phase Gantt timeline, multi-trade Kanban, site snag list & white-glove handover.</div>
          <div class="stage-progress-badge">
            <span>${taskProgress}% Tasks Done</span>
            <span>•</span>
            <span style="color:${openSnags > 0 ? 'var(--status-urgent)' : 'var(--status-approved)'};">${openSnags} Open Snags</span>
          </div>
        </div>
      </div>
    </div>

    <!-- LIVE KPI METRIC STRIP -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Commercial Value</div>
        <div class="kpi-value text-accent">${stateManager.formatCurrency(financials.totalClientPrice)}</div>
        <div class="kpi-sub ${financials.isUnderBudget ? 'text-secondary' : 'text-urgent'}">
          Target Budget: ${stateManager.formatCurrency(financials.targetBudget)}
          <span style="color:${financials.isUnderBudget ? 'var(--status-approved)' : 'var(--status-urgent)'}; font-weight:600;">
            (${financials.isUnderBudget ? 'Under Budget' : 'Over Target'})
          </span>
        </div>
      </div>

      ${!isClientMode ? `
      <div class="kpi-card">
        <div class="kpi-label">Designer Gross Profit / Margin</div>
        <div class="kpi-value text-gold">${stateManager.formatCurrency(financials.grossMarginDollars)}</div>
        <div class="kpi-sub text-secondary">
          Average Markup: <strong style="color:var(--text-primary);">${Math.round(financials.grossMarginPercent)}%</strong>
          <span>(Cost: ${stateManager.formatCurrency(financials.totalCostPrice)})</span>
        </div>
      </div>
      ` : `
      <div class="kpi-card">
        <div class="kpi-label">Client Approval Status</div>
        <div class="kpi-value" style="color:var(--status-approved);">94.8%</div>
        <div class="kpi-sub text-secondary">
          19 of 20 FF&E items client approved
        </div>
      </div>
      `}

      <div class="kpi-card">
        <div class="kpi-label">Committed Purchase Orders</div>
        <div class="kpi-value text-primary">${stateManager.formatCurrency(financials.totalCommittedPO)}</div>
        <div class="kpi-sub text-secondary">
          Across 4 vendor POs in production
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Site Quality & Snagging</div>
        <div class="kpi-value ${openSnags > 0 ? 'text-urgent' : 'text-approved'}" style="display:flex; align-items:baseline; gap:8px;">
          ${openSnags} <span style="font-size:1rem; color:var(--text-muted); font-family:var(--font-sans);">open / ${snags.length} logged</span>
        </div>
        <div class="kpi-sub text-secondary">
          <span style="color:var(--status-approved); font-weight:600;">${resolvedSnags} defects cleared</span>
        </div>
      </div>
    </div>

    <!-- QUICK ROOM BREAKDOWN TABLE -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Room-by-Room Schedule & Allocation</h3>
        <span class="text-sm text-secondary">${rooms.length} Architectural Spaces</span>
      </div>
      <div style="overflow-x:auto;">
        <table class="boq-table">
          <thead>
            <tr>
              <th>Room Code</th>
              <th>Room Name</th>
              <th>Area (Sq Ft / M²)</th>
              <th>Ceiling Height</th>
              <th>Primary Floor & Wall Finishes</th>
              <th>Allocated Budget</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${rooms.map(room => {
              const roomProducts = products.filter(p => p.room === room.id);
              const roomSpent = roomProducts.reduce((sum, p) => sum + (p.clientPrice * (p.quantity || 1)), 0);
              return `
                <tr>
                  <td><span class="project-code">${room.code}</span></td>
                  <td><strong style="color:var(--text-primary);">${room.name}</strong></td>
                  <td>${room.sqft} sq ft <span class="text-muted">(${room.sqm} m²)</span></td>
                  <td>${room.ceilingHeight}</td>
                  <td>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">${room.floorFinish}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${room.wallFinish}</div>
                  </td>
                  <td>
                    <div class="font-medium">${stateManager.formatCurrency(roomSpent)}</div>
                    <div class="text-xs text-muted">Budget: ${stateManager.formatCurrency(room.budgetAllocated)}</div>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-sm btn-jump-room" data-room-id="${room.id}">
                      View Floorplan →
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach event listeners for interactive stage navigation
  container.querySelectorAll('.stage-step-card').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-nav-target');
      if (target) stateManager.setActiveView(target);
    });
  });

  container.querySelectorAll('.btn-jump-room').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomId = btn.getAttribute('data-room-id');
      stateManager.setSelectedRoom(roomId);
      stateManager.setActiveView('design');
    });
  });

  const exportBtn = container.querySelector('#btn-export-json');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      stateManager.exportProjectJSON();
    });
  }
}
