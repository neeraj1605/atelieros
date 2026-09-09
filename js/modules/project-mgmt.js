// AtelierFlow - Project Management & Execution Module (Gantt, Kanban, Snags, Handover)
import { stateManager } from './state.js';

let activeTradeFilter = 'all';
let snagFilterSeverity = 'all';

export function renderProjectMgmt(container) {
  const { timeline, tasks, snags, rooms } = stateManager.state;

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    return activeTradeFilter === 'all' || t.trade === activeTradeFilter;
  });

  // Filter snags
  const filteredSnags = snags.filter(s => {
    return snagFilterSeverity === 'all' || s.severity === snagFilterSeverity;
  });

  const trades = Array.from(new Set(tasks.map(t => t.trade))).sort();
  const kanbanColumns = ['Backlog', 'To Do', 'In Progress', 'Quality Review', 'Completed'];

  container.innerHTML = `
    <!-- PROJECT MANAGEMENT HEADER -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-bottom:4px;">Project Management & Site Execution</h2>
        <p class="text-secondary text-sm">7-phase architectural timeline, contractor Kanban, floorplan snagging & white-glove handover</p>
      </div>

      <div style="display:flex; gap:10px; align-items:center;">
        <button class="btn btn-secondary btn-sm" id="btn-add-snag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"></path></svg>
          Log Site Snag
        </button>
        <button class="btn btn-primary btn-sm" id="btn-add-task">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Trade Task
        </button>
      </div>
    </div>

    <!-- 1. INTERACTIVE PHASED GANTT TIMELINE -->
    <div class="card" style="margin-bottom:28px;">
      <div class="card-header">
        <div>
          <h3 class="card-title">Architectural Lifecycle Gantt Timeline</h3>
          <p class="text-secondary text-sm">7 core project phases from discovery to turnkey handover. Check milestones to update progress.</p>
        </div>
        <span class="badge badge-progress">Current: Phase 05 & 06</span>
      </div>

      <div class="gantt-container">
        ${timeline.map(phase => {
          const statusBadge = phase.status === 'Completed' ? 'badge-approved' : phase.status === 'In Progress' ? 'badge-progress' : 'badge-neutral';
          return `
            <div class="gantt-phase-row" data-phase-id="${phase.id}">
              <div class="gantt-phase-meta">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="project-code" style="font-size:0.7rem;">PHASE ${phase.number}</span>
                  <span class="badge ${statusBadge}" style="font-size:0.65rem;">${phase.status}</span>
                </div>
                <div class="gantt-phase-name">${phase.name}</div>
                <div class="gantt-phase-dates">${phase.dates} • Lead: ${phase.lead}</div>
                
                <!-- Milestones checklist -->
                <div style="margin-top:8px; display:flex; flex-direction:column; gap:4px;">
                  ${phase.milestones.map((m, mIdx) => `
                    <label style="font-size:0.75rem; display:flex; align-items:center; gap:6px; cursor:pointer; color:${m.done ? 'var(--text-secondary)' : 'var(--text-primary)'};">
                      <input type="checkbox" class="milestone-chk" data-phase-id="${phase.id}" data-milestone-idx="${mIdx}" ${m.done ? 'checked' : ''}>
                      <span style="${m.done ? 'text-decoration:line-through;' : ''}">${m.name}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <div>
                <div class="gantt-bar-track">
                  <div class="gantt-bar-fill" style="width: ${phase.progress}%;">
                    ${phase.progress}%
                  </div>
                </div>
              </div>

              <div style="text-align:right;">
                <input type="range" min="0" max="100" class="phase-progress-slider" data-phase-id="${phase.id}" value="${phase.progress}" style="width:90px;">
                <div class="text-xs text-muted" style="margin-top:2px;">Adjust %</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 2. MULTI-TRADE KANBAN EXECUTION BOARD -->
    <div class="card" style="margin-bottom:28px;">
      <div class="card-header">
        <div>
          <h3 class="card-title">Multi-Trade Execution Kanban</h3>
          <p class="text-secondary text-sm">Coordinate General Contractors, Joiners, Electricians, Stone Masons, and Stylists</p>
        </div>

        <div style="display:flex; gap:10px;">
          <select id="filter-trade" class="filter-select">
            <option value="all">All Contractor Trades</option>
            ${trades.map(t => `<option value="${t}" ${activeTradeFilter === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="kanban-board">
        ${kanbanColumns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col);
          return `
            <div class="kanban-column" data-column="${col}">
              <div class="kanban-col-header">
                <span class="kanban-col-title">${col}</span>
                <span class="nav-pillar-badge">${colTasks.length}</span>
              </div>

              <div class="kanban-cards-stack">
                ${colTasks.map(t => {
                  const prioBadge = t.priority === 'Urgent' ? 'badge-urgent' : t.priority === 'High' ? 'badge-pending' : 'badge-neutral';
                  const roomObj = rooms.find(r => r.id === t.room);
                  return `
                    <div class="kanban-card" data-task-id="${t.id}">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span class="badge ${prioBadge}" style="font-size:0.65rem;">${t.priority}</span>
                        <span class="text-xs text-muted" style="font-size:0.7rem;">${t.dueDate}</span>
                      </div>
                      <div class="kanban-card-title">${t.title}</div>
                      <div style="font-size:0.75rem; color:var(--text-accent); margin-bottom:8px;">
                        📍 ${roomObj ? roomObj.name : 'General Penthouse'}
                      </div>
                      <div class="kanban-card-meta">
                        <span>👤 ${t.assignee}</span>
                        <div style="display:flex; gap:4px;">
                          ${col !== 'Backlog' ? `
                            <button class="btn btn-ghost btn-sm btn-move-task" data-task-id="${t.id}" data-dir="prev" style="padding:2px 6px;">←</button>
                          ` : ''}
                          ${col !== 'Completed' ? `
                            <button class="btn btn-ghost btn-sm btn-move-task" data-task-id="${t.id}" data-dir="next" style="padding:2px 6px;">→</button>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 3. DIGITAL SNAGGING & DEFECT PUNCH LIST -->
    <div class="card" style="margin-bottom:28px;">
      <div class="card-header">
        <div>
          <h3 class="card-title">Site Snagging & Quality Punch List</h3>
          <p class="text-secondary text-sm">Defects pinned to floorplan coordinates with contractor assignment and photo verification</p>
        </div>

        <div style="display:flex; gap:10px;">
          <select id="filter-snag-severity" class="filter-select">
            <option value="all">All Severities</option>
            <option value="Critical" ${snagFilterSeverity === 'Critical' ? 'selected' : ''}>Critical</option>
            <option value="Major" ${snagFilterSeverity === 'Major' ? 'selected' : ''}>Major</option>
            <option value="Minor" ${snagFilterSeverity === 'Minor' ? 'selected' : ''}>Minor</option>
            <option value="Cosmetic" ${snagFilterSeverity === 'Cosmetic' ? 'selected' : ''}>Cosmetic</option>
          </select>
        </div>
      </div>

      <div class="snags-grid">
        ${filteredSnags.map(s => {
          const sevBadge = s.severity === 'Critical' ? 'badge-urgent' : s.severity === 'Major' ? 'badge-pending' : 'badge-neutral';
          const statusBadge = s.status === 'Resolved' ? 'badge-approved' : s.status === 'In Progress' ? 'badge-progress' : 'badge-urgent';
          return `
            <div class="snag-card">
              <div class="snag-card-header">
                <span class="badge ${sevBadge}">${s.severity}</span>
                <span class="badge ${statusBadge}">${s.status}</span>
              </div>
              <div class="snag-body">
                <div class="text-xs text-accent">📍 ${s.roomName} • Reported by ${s.reportedBy}</div>
                <div class="snag-title">${s.title}</div>
                <p class="snag-desc">${s.description}</p>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                  Assigned Sub: <strong>${s.assignedTo}</strong>
                </div>
              </div>
              <div class="snag-footer">
                <span class="text-xs text-muted">Date: ${s.dateReported}</span>
                <select class="filter-select snag-status-dropdown" data-snag-id="${s.id}" style="padding:4px 8px; font-size:0.75rem;">
                  <option value="Open" ${s.status === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="In Progress" ${s.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Resolved" ${s.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 4. WHITE-GLOVE HANDOVER PROTOCOL & DIGITAL SIGN-OFF -->
    <div class="card handover-container">
      <div class="card-header">
        <div>
          <h3 class="card-title">White-Glove Turnkey Handover & Sign-Off</h3>
          <p class="text-secondary text-sm">Final architectural inspection protocol, O&M warranty package delivery, and client digital signature</p>
        </div>
        <span class="badge badge-neutral">Scheduled: Nov 28, 2026</span>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:32px; align-items:start;">
        <div>
          <h4 style="font-size:0.95rem; font-weight:600; margin-bottom:12px;">Final Commissioning Checklist</h4>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label style="display:flex; align-items:center; gap:8px; font-size:0.82rem; cursor:pointer;">
              <input type="checkbox" checked>
              <span>Smart Home Automation (Lutron lighting scenes, motorized drapes, HVAC zones verified)</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; font-size:0.82rem; cursor:pointer;">
              <input type="checkbox" checked>
              <span>Natural Stone Sealing (Travertine tables, quartzite countertops, honed bath marble impregnated)</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; font-size:0.82rem; cursor:pointer;">
              <input type="checkbox" checked>
              <span>White-Glove FF&E Styling (All 20 bespoke furniture, rug, and lighting elements placed and leveled)</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; font-size:0.82rem; cursor:pointer;">
              <input type="checkbox">
              <span>Deep Post-Construction Clean & HEPA Air Scrubbing</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; font-size:0.82rem; cursor:pointer;">
              <input type="checkbox">
              <span>Delivery of O&M Binder, Vendor Warranties, and Care Schedule</span>
            </label>
          </div>
        </div>

        <div>
          <h4 style="font-size:0.95rem; font-weight:600; margin-bottom:12px;">Client Handover Acceptance Signature</h4>
          <p class="text-xs text-secondary" style="margin-bottom:8px;">Sign below to formally certify the turnkey completion of The Bel-Air Penthouse.</p>
          <div class="signature-pad-box" id="sig-pad-box">
            <canvas id="sig-canvas" width="400" height="140" class="signature-canvas"></canvas>
            <span class="text-xs text-muted" id="sig-placeholder" style="position:absolute; pointer-events:none;">Click & drag to sign</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
            <button class="btn btn-ghost btn-sm" id="btn-clear-sig">Clear Signature</button>
            <button class="btn btn-primary btn-sm" id="btn-certify-handover">
              Certify Handover & Generate Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Milestone Checkboxes
  container.querySelectorAll('.milestone-chk').forEach(chk => {
    chk.addEventListener('change', () => {
      const phaseId = chk.getAttribute('data-phase-id');
      const idx = parseInt(chk.getAttribute('data-milestone-idx'), 10);
      stateManager.toggleMilestone(phaseId, idx);
    });
  });

  // Attach Progress Sliders
  container.querySelectorAll('.phase-progress-slider').forEach(slider => {
    slider.addEventListener('change', (e) => {
      const phaseId = slider.getAttribute('data-phase-id');
      stateManager.updateTimelineProgress(phaseId, parseInt(e.target.value, 10));
    });
  });

  // Trade Filter
  const tradeSelect = container.querySelector('#filter-trade');
  if (tradeSelect) {
    tradeSelect.addEventListener('change', (e) => {
      activeTradeFilter = e.target.value;
      renderProjectMgmt(container);
    });
  }

  // Snag Severity Filter
  const snagSevSelect = container.querySelector('#filter-snag-severity');
  if (snagSevSelect) {
    snagSevSelect.addEventListener('change', (e) => {
      snagFilterSeverity = e.target.value;
      renderProjectMgmt(container);
    });
  }

  // Kanban Move Task buttons
  container.querySelectorAll('.btn-move-task').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-task-id');
      const dir = btn.getAttribute('data-dir');
      const task = stateManager.state.tasks.find(t => t.id === taskId);
      if (task) {
        const curIdx = kanbanColumns.indexOf(task.status);
        const nextIdx = dir === 'next' ? Math.min(kanbanColumns.length - 1, curIdx + 1) : Math.max(0, curIdx - 1);
        stateManager.moveTask(taskId, kanbanColumns[nextIdx]);
      }
    });
  });

  // Snag status dropdowns
  container.querySelectorAll('.snag-status-dropdown').forEach(select => {
    select.addEventListener('change', (e) => {
      const snagId = select.getAttribute('data-snag-id');
      stateManager.updateSnagStatus(snagId, e.target.value);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Snag status updated to ${e.target.value}` } }));
    });
  });

  // Add Snag Button
  const addSnagBtn = container.querySelector('#btn-add-snag');
  if (addSnagBtn) {
    addSnagBtn.addEventListener('click', () => {
      const title = prompt('Enter defect / snag description:', 'Cabinet hinge misaligned');
      if (title) {
        stateManager.addSnag({
          title,
          room: 'room-living',
          roomName: 'Great Room & Lounge',
          x: 400,
          y: 250,
          description: 'Inspected during site walkthrough. Requires contractor repair.',
          severity: 'Minor',
          trade: 'Joinery / Millwork',
          assignedTo: 'Atelier Woodcraft'
        });
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'New snag logged on site plan!' } }));
      }
    });
  }

  // Add Task Button
  const addTaskBtn = container.querySelector('#btn-add-task');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      const title = prompt('Enter contractor trade task title:', 'Grout sealing in Master Ensuite');
      if (title) {
        stateManager.addTask({
          title,
          trade: 'Plumbing & Stone',
          room: 'room-master',
          assignee: 'Apex Tile Specialist',
          priority: 'Normal',
          dueDate: '2026-09-22'
        });
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Trade task added to Kanban!' } }));
      }
    });
  }

  // Digital Signature Canvas
  initSignaturePad(container);
}

function initSignaturePad(container) {
  const canvas = container.querySelector('#sig-canvas');
  const placeholder = container.querySelector('#sig-placeholder');
  const clearBtn = container.querySelector('#btn-clear-sig');
  const certifyBtn = container.querySelector('#btn-certify-handover');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#C5A880';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  let isDrawing = false;
  let hasSigned = false;

  canvas.onmousedown = (e) => {
    isDrawing = true;
    hasSigned = true;
    if (placeholder) placeholder.style.display = 'none';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  canvas.onmousemove = (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  window.addEventListener('mouseup', () => {
    isDrawing = false;
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasSigned = false;
      if (placeholder) placeholder.style.display = 'block';
    });
  }

  if (certifyBtn) {
    certifyBtn.addEventListener('click', () => {
      if (!hasSigned) {
        alert('Please draw your client signature before certifying handover.');
      } else {
        alert('🏆 Handover Acceptance Certified!\n\nThe Bel-Air Penthouse Suite has been formally signed off by the client and Lead Architect Sienna Cole.\nHandover Certificate generated and archived.');
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Handover Certificate successfully signed!' } }));
      }
    });
  }
}
