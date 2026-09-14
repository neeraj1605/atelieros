/**
 * Planex AI / AtelierOS - Production Lifecycle & Co-Pilot Engine
 * Neutral 6-Stage B2C Architecture with Modular/Carpentry Bifurcation
 */

class PlanexLifecycleEngine {
  constructor(containerId, initialData = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found.`);

    this.STAGES = [
      { id: 1, key: 'blueprint', label: 'Blueprint', hint: 'Walls, household profile & address' },
      { id: 2, key: 'layout',    label: 'Layout',    hint: 'Zoning, clearances & circulation' },
      { id: 3, key: 'build',     label: 'Build',     hint: 'Factory modular vs. site carpentry' },
      { id: 4, key: 'finish',    label: 'Finish',    hint: 'Core boards, laminates & hardware' },
      { id: 5, key: 'cost',      label: 'Cost',      hint: 'Itemized BoQ, wastage & labor rates' },
      { id: 6, key: 'handover',  label: 'Handover',  hint: 'Shop drawings, cut-lists & site pack' }
    ];

    // Core Reactive State
    this.state = {
      currentStage: initialData.stage || 1,
      maxUnlockedStage: initialData.maxUnlockedStage || 1,
      project: {
        name: initialData.projectName || 'My Home Project',
        pincode: initialData.pincode || '400053',
        city: initialData.city || 'Mumbai',
        currency: initialData.currency || 'INR',
        activeSpace: 'kitchen',
        household: initialData.household || { toddlers: false, seniors: true, wfh: true }
      },
      // Architectural & Engineering Data
      spaces: {
        kitchen: {
          name: 'Modular Kitchen',
          buildMethod: 'modular', // 'modular' | 'carpentry'
          clearanceMm: 820,       // Triggers <900mm alert
          hasWetZonePlumbing: true,
          substrate: 'commercial_mr', // Triggers wet-zone warning
          finish: 'matte_acrylic',
          sqft: 110,
          budgetCap: 350000,
          currentEstimate: 382000
        },
        living: {
          name: 'Living & Dining',
          buildMethod: 'carpentry',
          clearanceMm: 950,
          substrate: 'bwp_is_710',
          finish: 'veneer_pu',
          sqft: 220,
          budgetCap: 500000,
          currentEstimate: 480000
        }
      },
      conflicts: []
    };

    this.init();
  }

  init() {
    this.runValidationEngine();
    this.render();
  }

  // Production-Grade Validation Rules (Indian Context + Ergonomics)
  runValidationEngine() {
    const conflicts = [];
    const space = this.state.spaces[this.state.project.activeSpace];

    // Stage 1 & 2 Rule: Ergonomic Walkway & Senior Safety
    if (this.state.project.household.seniors && space.clearanceMm < 900) {
      conflicts.push({
        id: 'c_clearance_senior',
        stage: 2,
        severity: 'critical',
        title: 'Corridor Clearance Alert',
        message: `Passage is ${space.clearanceMm} mm. Minimum 900 mm required for senior-friendly circulation.`,
        actionLabel: 'Auto-adjust to 950 mm',
        resolve: () => {
          space.clearanceMm = 950;
          this.refresh();
        }
      });
    }

    // Stage 3 Rule: Carpentry vs Society Noise Rules
    if (space.buildMethod === 'carpentry' && this.state.project.pincode) {
      conflicts.push({
        id: 'c_carpentry_delay',
        stage: 3,
        severity: 'warning',
        title: 'Site Work Noise Restrictions',
        message: 'Society permits heavy cutting only from 10 AM - 1 PM. Site fabrication will take ~45 days.',
        actionLabel: 'Switch to Factory Modular (21 Days)',
        resolve: () => {
          space.buildMethod = 'modular';
          this.refresh();
        }
      });
    }

    // Stage 4 Rule: Indian Wet Kitchen Substrate Failure
    if (this.state.project.activeSpace === 'kitchen' && space.substrate === 'commercial_mr') {
      conflicts.push({
        id: 'c_wet_substrate',
        stage: 4,
        severity: 'critical',
        title: 'Substrate Degradation Risk',
        message: 'Commercial MR board specified under sink. High risk of swelling from water purifier / RO leaks.',
        actionLabel: 'Upgrade to BWP Marine Ply (+₹3,400)',
        resolve: () => {
          space.substrate = 'bwp_is_710';
          space.currentEstimate += 3400;
          this.refresh();
        }
      });
    }

    // Stage 5 Rule: Cost Ceiling Alert
    if (space.currentEstimate > space.budgetCap) {
      const delta = space.currentEstimate - space.budgetCap;
      conflicts.push({
        id: 'c_cost_overrun',
        stage: 5,
        severity: 'warning',
        title: 'Budget Exceeded',
        message: `Current specifications exceed target allocation by ₹${delta.toLocaleString('en-IN')}.`,
        actionLabel: 'Optimize Carcass Internals (-₹35,000)',
        resolve: () => {
          space.currentEstimate -= 35000;
          this.refresh();
        }
      });
    }

    this.state.conflicts = conflicts;
  }

  setStage(stageId) {
    if (stageId > this.state.maxUnlockedStage) return;
    this.state.currentStage = stageId;
    this.refresh();
  }

  setBuildMethod(method) {
    const space = this.state.spaces[this.state.project.activeSpace];
    space.buildMethod = method;
    this.refresh();
  }

  resolveConflict(conflictId) {
    const conflict = this.state.conflicts.find(c => c.id === conflictId);
    if (conflict && typeof conflict.resolve === 'function') {
      conflict.resolve();
    }
  }

  advanceStage() {
    const currentConflicts = this.state.conflicts.filter(
      c => c.stage === this.state.currentStage && c.severity === 'critical'
    );

    if (currentConflicts.length > 0) {
      alert('Please resolve critical blockers before advancing to the next stage.');
      return;
    }

    if (this.state.currentStage < 6) {
      this.state.currentStage += 1;
      if (this.state.currentStage > this.state.maxUnlockedStage) {
        this.state.maxUnlockedStage = this.state.currentStage;
      }
      this.refresh();
    }
  }

  refresh() {
    this.runValidationEngine();
    this.render();
  }

  render() {
    const activeSpace = this.state.spaces[this.state.project.activeSpace];
    const stageConflicts = this.state.conflicts.filter(c => c.stage <= this.state.currentStage);
    const activeStageObj = this.STAGES.find(s => s.id === this.state.currentStage);

    this.container.innerHTML = `
      <div class="planex-app-shell">
        <!-- TOP STAGE RIBBON -->
        <header class="planex-topbar">
          <div class="brand-cluster">
            <span class="brand-logo">PX</span>
            <span class="brand-name">Planex AI</span>
            <span class="location-badge">📍 ${this.state.project.city} (${this.state.project.pincode})</span>
          </div>

          <nav class="stepper-ribbon">
            ${this.STAGES.map(s => {
              const isPassed = s.id < this.state.currentStage;
              const isActive = s.id === this.state.currentStage;
              const isLocked = s.id > this.state.maxUnlockedStage;
              const hasConflict = this.state.conflicts.some(c => c.stage === s.id);

              let classes = ['step-pill'];
              if (isPassed) classes.push('passed');
              if (isActive) classes.push('active');
              if (isLocked) classes.push('locked');
              if (hasConflict) classes.push('alert');

              return `
                <button class="${classes.join(' ')}" 
                        onclick="window.planexEngine.setStage(${s.id})"
                        ${isLocked ? 'disabled' : ''}>
                  <span class="step-num">${isPassed ? '✓' : s.id}</span>
                  <span class="step-label">${s.label}</span>
                </button>
              `;
            }).join('<span class="step-divider">›</span>')}
          </nav>
        </header>

        <!-- MAIN WORKSPACE -->
        <div class="planex-canvas-body">
          <div class="canvas-viewport">
            <div class="stage-banner">
              <div>
                <h2>${activeStageObj.id}. ${activeStageObj.label}</h2>
                <p class="stage-hint">${activeStageObj.hint}</p>
              </div>
              <div class="space-selector-wrap">
                <label>Active Space:</label>
                <select onchange="window.planexEngine.state.project.activeSpace=this.value; window.planexEngine.refresh();">
                  <option value="kitchen" ${this.state.project.activeSpace === 'kitchen' ? 'selected' : ''}>Kitchen</option>
                  <option value="living" ${this.state.project.activeSpace === 'living' ? 'selected' : ''}>Living & Dining</option>
                </select>
              </div>
            </div>

            <!-- DYNAMIC STAGE BODY -->
            ${this.renderStageBody(activeSpace)}

            <!-- STAGE ADVANCE ACTION BAR -->
            <div class="stage-footer">
              <span class="status-summary">
                ${stageConflicts.length > 0 ? `⚠️ ${stageConflicts.length} item(s) require review` : `✓ Ready for next milestone`}
              </span>
              <button class="btn-primary" onclick="window.planexEngine.advanceStage()">
                Lock ${activeStageObj.label} & Continue ›
              </button>
            </div>
          </div>

          <!-- AMBIENT AI CO-PILOT DOCK -->
          <aside class="planex-copilot-dock">
            <div class="copilot-header">
              <span class="ai-sparkle">✦</span>
              <h3>Planex Co-Pilot</h3>
              <span class="pulse-indicator"></span>
            </div>

            <div class="copilot-feed">
              ${stageConflicts.length === 0 ? `
                <div class="copilot-empty">
                  <p>All ergonomics, materials, and tolerances match verified standards for ${this.state.project.city}.</p>
                </div>
              ` : stageConflicts.map(c => `
                <div class="copilot-card ${c.severity}">
                  <div class="copilot-card-head">
                    <span class="card-stage-tag">Stage ${c.stage}</span>
                    <span class="severity-pill">${c.severity}</span>
                  </div>
                  <h4>${c.title}</h4>
                  <p>${c.message}</p>
                  <button class="btn-resolve" onclick="window.planexEngine.resolveConflict('${c.id}')">
                    ${c.actionLabel}
                  </button>
                </div>
              `).join('')}
            </div>
          </aside>
        </div>
      </div>
    `;
  }
}

// =============================================================================
// Extension: Stage-Specific Views & BoQ Generator (PlanexLifecycleEngine)
// =============================================================================

PlanexLifecycleEngine.prototype.renderStageBody = function(activeSpace) {
  switch (this.state.currentStage) {
    case 1: // Blueprint
      return `
        <div class="stage-view blueprint-view">
          <div class="panel-section">
            <h4>Spatial Footprint & Site Parameters</h4>
            <div class="grid-form">
              <div class="form-group">
                <label>Carpet Area (sq. ft.)</label>
                <input type="number" value="${activeSpace.sqft}" 
                  onchange="window.planexEngine.updateSpaceProp('sqft', Number(this.value))" />
              </div>
              <div class="form-group">
                <label>City & Tier Zone</label>
                <input type="text" value="${this.state.project.city}" disabled />
              </div>
              <div class="form-group">
                <label>Wet Zone / Plumbing Exists</label>
                <select onchange="window.planexEngine.updateSpaceProp('hasWetZonePlumbing', this.value === 'true')">
                  <option value="true" ${activeSpace.hasWetZonePlumbing ? 'selected' : ''}>Yes (Sinks / RO line present)</option>
                  <option value="false" ${!activeSpace.hasWetZonePlumbing ? 'selected' : ''}>No (Dry carcass only)</option>
                </select>
              </div>
            </div>
          </div>
        </div>`;

    case 2: // Layout & Ergonomics
      return `
        <div class="stage-view layout-view">
          <div class="ergonomic-card">
            <h4>Circulation & Clearance Matrix</h4>
            <div class="clearance-gauge">
              <span class="gauge-val ${activeSpace.clearanceMm < 900 ? 'text-warn' : 'text-ok'}">
                ${activeSpace.clearanceMm} mm
              </span>
              <p class="gauge-hint">IS Code / Ergonomic Walkway standard: min 900mm (1050mm for two-way kitchen corridor).</p>
            </div>
            <div class="slider-wrap">
              <label>Corridor Width: ${activeSpace.clearanceMm} mm</label>
              <input type="range" min="700" max="1400" step="10" value="${activeSpace.clearanceMm}" 
                oninput="window.planexEngine.updateSpaceProp('clearanceMm', Number(this.value))" />
            </div>
          </div>
        </div>`;

    case 3: // Build Selection (modular vs carpentry fork)
      return `
        <div class="build-fork-panel">
          <h3>Select Furniture Construction Method</h3>
          <div class="fork-cards">
            <div class="fork-card ${activeSpace.buildMethod === 'modular' ? 'selected' : ''}"
                 onclick="window.planexEngine.setBuildMethod('modular')">
              <div class="fork-icon">🏭</div>
              <h4>Factory Modular</h4>
              <p class="fork-desc">Engineered panels, laser edge-banding, standard carcasses. Clean 3-day on-site assembly.</p>
              <ul class="fork-bullets">
                <li>Lead time: 21 days</li>
                <li>Zero dust & noise on-site</li>
                <li>Standard 450/600/900mm carcass grid</li>
              </ul>
              <span class="badge">${activeSpace.buildMethod === 'modular' ? 'Active Choice' : 'Select'}</span>
            </div>

            <div class="fork-card ${activeSpace.buildMethod === 'carpentry' ? 'selected' : ''}"
                 onclick="window.planexEngine.setBuildMethod('carpentry')">
              <div class="fork-icon">🪚</div>
              <h4>Site Carpentry</h4>
              <p class="fork-desc">Built completely inside the room using calibrated plywood sheets, adhesives, and manual joinery.</p>
              <ul class="fork-bullets">
                <li>Lead time: 45–60 days</li>
                <li>Requires society noise permissions</li>
                <li>Handles uneven walls & custom niches</li>
              </ul>
              <span class="badge">${activeSpace.buildMethod === 'carpentry' ? 'Active Choice' : 'Select'}</span>
            </div>
          </div>
        </div>`;

    case 4: // Finish & Core Substrate
      return `
        <div class="stage-view finish-view">
          <div class="finish-selectors">
            <div class="selector-card">
              <h4>Core Board Substrate</h4>
              <p class="sub-hint">Substrate selection dictates water resistance and core durability.</p>
              <div class="option-pills">
                <button class="pill-btn ${activeSpace.substrate === 'commercial_mr' ? 'selected' : ''}"
                  onclick="window.planexEngine.updateSpaceProp('substrate', 'commercial_mr')">
                  MR Commercial (IS 303)
                </button>
                <button class="pill-btn ${activeSpace.substrate === 'bwp_is_710' ? 'selected' : ''}"
                  onclick="window.planexEngine.updateSpaceProp('substrate', 'bwp_is_710')">
                  BWP Marine Ply (IS 710)
                </button>
                <button class="pill-btn ${activeSpace.substrate === 'hdhmr' ? 'selected' : ''}"
                  onclick="window.planexEngine.updateSpaceProp('substrate', 'hdhmr')">
                  HDHMR (High Density)
                </button>
              </div>
            </div>

            <div class="selector-card">
              <h4>External Shutter Finish</h4>
              <div class="option-pills">
                <button class="pill-btn ${activeSpace.finish === 'matte_acrylic' ? 'selected' : ''}"
                  onclick="window.planexEngine.updateSpaceProp('finish', 'matte_acrylic')">
                  Matte Acrylic (Anti-scratch)
                </button>
                <button class="pill-btn ${activeSpace.finish === 'veneer_pu' ? 'selected' : ''}"
                  onclick="window.planexEngine.updateSpaceProp('finish', 'veneer_pu')">
                  Natural Veneer + PU Polish
                </button>
                <button class="pill-btn ${activeSpace.finish === 'laminate_1mm' ? 'selected' : ''}"
                  onclick="window.planexEngine.updateSpaceProp('finish', 'laminate_1mm')">
                  1mm High-Pressure Laminate
                </button>
              </div>
            </div>
          </div>
        </div>`;

    case 5: // Cost & BoQ
      const boq = this.computeBoQ(activeSpace);
      return `
        <div class="stage-view cost-view">
          <div class="boq-header-row">
            <div>
              <h3>Itemized Bill of Quantities (BoQ)</h3>
              <p>Dynamic estimation based on ${activeSpace.sqft} sq. ft. run & selected finishes</p>
            </div>
            <div class="boq-summary-metric">
              <span>Total Est: ₹${boq.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <table class="boq-table">
            <thead>
              <tr>
                <th>Scope Line Item</th>
                <th>Qty / Spec</th>
                <th>Rate (INR)</th>
                <th>Wastage (%)</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${boq.items.map(item => `
                <tr>
                  <td><strong>${item.name}</strong><br><small>${item.spec}</small></td>
                  <td>${item.qty} ${item.unit}</td>
                  <td>₹${item.rate.toLocaleString('en-IN')}</td>
                  <td>${item.wastage}%</td>
                  <td>₹${Math.round(item.amount).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;

    case 6: // Handover & Execution Pack
      return `
        <div class="stage-view handover-view">
          <div class="handover-checklist">
            <h3>Milestone Sign-Off & Site Pack</h3>
            <p>Export engineered cut-lists, panel schedules, and MEP conduit drawings.</p>
            <div class="deliverables-grid">
              <div class="pack-card">
                <span class="file-icon">📋</span>
                <div>
                  <strong>Cut-List & Optimization Sheet</strong>
                  <p>Ready for beam-saw / CNC nesting</p>
                </div>
                <button class="btn-dl">Export CSV</button>
              </div>
              <div class="pack-card">
                <span class="file-icon">📐</span>
                <div>
                  <strong>GFC Elevation & MEP Markings</strong>
                  <p>Plumbing & electrical service grid</p>
                </div>
                <button class="btn-dl">Export PDF</button>
              </div>
              <div class="pack-card">
                <span class="file-icon">📦</span>
                <div>
                  <strong>Hardware Procurement Schedule</strong>
                  <p>Hinges, tandem boxes, channels list</p>
                </div>
                <button class="btn-dl">Export BoQ</button>
              </div>
            </div>
          </div>
        </div>`;
    default:
      return '';
  }
};

PlanexLifecycleEngine.prototype.updateSpaceProp = function(prop, value) {
  const space = this.state.spaces[this.state.project.activeSpace];
  space[prop] = value;
  this.refresh();
};

PlanexLifecycleEngine.prototype.computeBoQ = function(space) {
  const isModular = space.buildMethod === 'modular';
  const sqft = space.sqft;

  const carcassRate = space.substrate === 'bwp_is_710' ? 1450 : 1100;
  const shutterRate = space.finish === 'matte_acrylic' ? 1200 : space.finish === 'veneer_pu' ? 1800 : 750;
  const hardwareRate = 650;
  const wastageFactor = isModular ? 1.05 : 1.15;

  const carcassTotal = sqft * carcassRate * wastageFactor;
  const shutterTotal = sqft * shutterRate * wastageFactor;
  const hardwareTotal = sqft * hardwareRate;

  const total = carcassTotal + shutterTotal + hardwareTotal;
  space.currentEstimate = Math.round(total);

  return {
    total,
    items: [
      { name: 'Carcass Fabrication', spec: `${space.substrate.toUpperCase()} + 0.8mm liner`, qty: sqft, unit: 'sqft', rate: carcassRate, wastage: isModular ? 5 : 15, amount: carcassTotal },
      { name: 'External Shutters', spec: space.finish.replace('_', ' ').toUpperCase(), qty: sqft, unit: 'sqft', rate: shutterRate, wastage: isModular ? 5 : 15, amount: shutterTotal },
      { name: 'Functional Hardware', spec: 'Soft-close hinges & under-mount slides', qty: sqft, unit: 'sqft', rate: hardwareRate, wastage: 0, amount: hardwareTotal }
    ]
  };
};

// Global attachment for easy console inspection & rapid wiring
window.PlanexLifecycleEngine = PlanexLifecycleEngine;
