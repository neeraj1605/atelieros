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

            <!-- DYNAMIC STAGE 3 FORK WORKFLOW -->
            ${this.state.currentStage === 3 ? `
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
              </div>
            ` : `
              <div class="canvas-mock">
                <div class="canvas-placeholder-content">
                  <span class="room-tag">${activeSpace.name} (${activeSpace.buildMethod.toUpperCase()})</span>
                  <div class="metric-readout">
                    <div><strong>Clearance:</strong> ${activeSpace.clearanceMm} mm</div>
                    <div><strong>Substrate:</strong> ${activeSpace.substrate.toUpperCase()}</div>
                    <div><strong>Est. Cost:</strong> ₹${activeSpace.currentEstimate.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            `}

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

// Global attachment for easy console inspection & rapid wiring
window.PlanexLifecycleEngine = PlanexLifecycleEngine;
