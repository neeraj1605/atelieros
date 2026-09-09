// AtelierFlow - Main Application Controller
import { stateManager, CURRENCIES } from './modules/state.js';
import { renderOverview } from './modules/overview.js';
import { renderDiscovery } from './modules/discovery.js';
import { renderDesign } from './modules/design.js';
import { renderCommercial } from './modules/commercial.js';
import { renderProjectMgmt } from './modules/project-mgmt.js';

class AppController {
  constructor() {
    this.mainContainer = document.getElementById('view-container');
    this.initHeader();
    this.initModals();
    this.initToasts();
    this.bindEvents();

    // Subscribe to state changes
    stateManager.subscribe(() => {
      this.renderCurrentView();
      this.updateHeaderBadges();
    });

    // Initial render
    this.renderCurrentView();
    this.updateHeaderBadges();
  }

  initHeader() {
    // Nav Pillar Buttons
    document.querySelectorAll('.nav-pillar-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        stateManager.setActiveView(view);
      });
    });

    // Currency Switcher
    const currencySelect = document.getElementById('currency-selector');
    if (currencySelect) {
      currencySelect.value = stateManager.state.currentCurrency;
      currencySelect.addEventListener('change', (e) => {
        stateManager.setCurrency(e.target.value);
        this.showToast(`Currency changed to ${e.target.value}`);
      });
    }

    // Client Mode Toggle in Header
    const clientToggle = document.getElementById('header-client-mode-toggle');
    if (clientToggle) {
      clientToggle.addEventListener('click', () => {
        stateManager.toggleClientMode();
        this.showToast(stateManager.state.isClientMode ? 'Client Mode Active: Margins hidden' : 'Designer Mode: Full margins shown');
      });
    }

    // Light / Dark Theme Toggle
    const themeToggle = document.getElementById('theme-toggle-btn');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeToggle.innerText = isLight ? '🌙 Dark Studio' : '☀️ Linen Light';
        this.showToast(isLight ? 'Switched to Linen Light Theme' : 'Switched to Architectural Dark Theme');
      });
    }

    // Project Reset Button
    const resetBtn = document.getElementById('btn-reset-demo');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset project back to default Bel-Air Penthouse demonstration data?')) {
          stateManager.resetToDemo();
          this.showToast('Project reset to initial demonstration state.');
        }
      });
    }
  }

  updateHeaderBadges() {
    const { activeView, isClientMode, products, tasks, snags } = stateManager.state;

    // Update active nav button
    document.querySelectorAll('.nav-pillar-btn[data-view]').forEach(btn => {
      const view = btn.getAttribute('data-view');
      btn.classList.toggle('active', view === activeView);
    });

    // Client mode indicator in header
    const clientToggle = document.getElementById('header-client-mode-toggle');
    if (clientToggle) {
      clientToggle.classList.toggle('active', isClientMode);
      clientToggle.innerHTML = isClientMode
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Client Presentation Mode`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></line><line x1="1" y1="1" x2="23" y2="23"></line></svg> Designer View (Margins)`;
    }

    // Update counts on badges
    const discBadge = document.getElementById('badge-count-discovery');
    if (discBadge) discBadge.innerText = products.length;

    const pmBadge = document.getElementById('badge-count-pm');
    if (pmBadge) {
      const openSnags = snags.filter(s => s.status === 'Open').length;
      pmBadge.innerText = `${tasks.length} tasks / ${openSnags} snags`;
    }
  }

  renderCurrentView() {
    const { activeView } = stateManager.state;
    this.mainContainer.innerHTML = '';

    switch (activeView) {
      case 'overview':
        renderOverview(this.mainContainer);
        break;
      case 'discovery':
        renderDiscovery(this.mainContainer);
        break;
      case 'design':
        renderDesign(this.mainContainer);
        break;
      case 'commercial':
        renderCommercial(this.mainContainer);
        break;
      case 'project-mgmt':
        renderProjectMgmt(this.mainContainer);
        break;
      default:
        renderOverview(this.mainContainer);
    }
  }

  bindEvents() {
    // Listen for custom modal events
    window.addEventListener('open-modal', (e) => {
      this.openModal(e.detail.modalId);
    });

    window.addEventListener('open-spec-sheet', (e) => {
      this.openSpecSheetModal(e.detail.productId);
    });

    window.addEventListener('show-toast', (e) => {
      this.showToast(e.detail.message);
    });

    window.resetFilters = () => {
      stateManager.setSelectedRoom('all');
      this.renderCurrentView();
    };
  }

  initModals() {
    // Close modal on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });

    // Close buttons inside modals
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) modal.classList.remove('open');
      });
    });

    // Add Product Form submit
    const addProductForm = document.getElementById('form-add-product');
    if (addProductForm) {
      addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('input-prod-name').value;
        const category = document.getElementById('input-prod-category').value;
        const room = document.getElementById('input-prod-room').value;
        const vendor = document.getElementById('input-prod-vendor').value;
        const finish = document.getElementById('input-prod-finish').value;
        const width = parseInt(document.getElementById('input-prod-w').value, 10) || 1200;
        const depth = parseInt(document.getElementById('input-prod-d').value, 10) || 800;
        const height = parseInt(document.getElementById('input-prod-h').value, 10) || 750;
        const tradeCost = parseFloat(document.getElementById('input-prod-cost').value) || 2000;
        const markup = parseFloat(document.getElementById('input-prod-markup').value) || 35;
        const imageUrl = document.getElementById('input-prod-image').value || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

        stateManager.addProduct({
          name,
          category,
          room,
          vendor,
          sku: `CUSTOM-${Date.now().toString().slice(-4)}`,
          style: 'Bespoke Contemporary',
          finish,
          dimensions: { width, depth, height, unit: 'mm' },
          tradeCost,
          markupPercent: markup,
          imageUrl,
          leadTimeWeeks: 6,
          sustainabilityScore: 'Grade A',
          floorplan: { x: 380, y: 240, width: Math.round(width / 25), height: Math.round(depth / 25), rotation: 0 }
        });

        document.getElementById('modal-add-product').classList.remove('open');
        addProductForm.reset();
        this.showToast(`Added "${name}" to project FF&E schedule!`);
      });
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  openSpecSheetModal(productId) {
    const product = stateManager.state.products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('modal-spec-sheet');
    const container = document.getElementById('spec-sheet-render-area');
    const room = stateManager.state.rooms.find(r => r.id === product.room);
    const { project, isClientMode } = stateManager.state;

    container.innerHTML = `
      <div class="spec-sheet-container">
        <!-- SPEC HEADER -->
        <div class="spec-sheet-header">
          <div>
            <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.15em; color:#888;">
              ${project.name} • ARCHITECTURAL SPECIFICATION CUT SHEET
            </div>
            <h1 class="spec-sheet-title">${product.name}</h1>
            <div style="font-size:0.85rem; color:#666; margin-top:4px;">
              Specification Code: <strong>${product.sku}</strong> | Allocated Room: <strong>${room ? room.name : 'General'}</strong>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.4rem; font-weight:700; color:#121316;">${stateManager.formatCurrency(product.clientPrice)}</div>
            <div style="font-size:0.75rem; color:#777;">Approved Client Unit Price</div>
            ${!isClientMode ? `
              <div style="font-size:0.75rem; color:#B45309; font-weight:600; margin-top:2px;">
                Wholesale Trade Cost: ${stateManager.formatCurrency(product.tradeCost)} (+${product.markupPercent}% markup)
              </div>
            ` : ''}
          </div>
        </div>

        <!-- SPEC GRID: IMAGE + TECH SPECS -->
        <div class="spec-sheet-grid">
          <div>
            <img src="${product.imageUrl}" alt="${product.name}" class="spec-sheet-image">
            <div style="font-size:0.72rem; color:#888; margin-top:6px; text-align:center;">
              Visual reference for fabrication & site placement
            </div>
          </div>

          <div>
            <h3 style="font-family:var(--font-serif); font-size:1.15rem; margin-bottom:12px; color:#111;">Technical Specifications</h3>
            <table class="spec-detail-table">
              <tr>
                <th>Category</th>
                <td>${product.category}</td>
              </tr>
              <tr>
                <th>Manufacturer / Vendor</th>
                <td>${product.vendor}</td>
              </tr>
              <tr>
                <th>Vendor Contact</th>
                <td>${product.vendorContact || 'procurement@atelier.com'}</td>
              </tr>
              <tr>
                <th>Specified Finish / Material</th>
                <td>${product.finish}</td>
              </tr>
              <tr>
                <th>Dimensions (W × D × H)</th>
                <td>${product.dimensions.width}mm × ${product.dimensions.depth}mm × ${product.dimensions.height}mm</td>
              </tr>
              <tr>
                <th>Lead Time to Site</th>
                <td>${product.leadTimeWeeks} Weeks from PO Deposit</td>
              </tr>
              <tr>
                <th>Environmental & Sustainability</th>
                <td>${product.sustainabilityScore || 'Grade A'}</td>
              </tr>
              <tr>
                <th>Sample Library Status</th>
                <td><span style="color:#059669; font-weight:600;">${product.sampleStatus}</span></td>
              </tr>
              <tr>
                <th>Procurement Status</th>
                <td><span style="color:#2563EB; font-weight:600;">${product.procurementStatus}</span></td>
              </tr>
            </table>

            <div style="margin-top:16px;">
              <h4 style="font-size:0.85rem; font-weight:600; margin-bottom:4px;">Description & Scope of Work:</h4>
              <p style="font-size:0.82rem; color:#4B5563; line-height:1.5;">${product.description || 'Custom architectural furnishing specified for the Bel-Air Penthouse.'}</p>
            </div>

            <div style="margin-top:12px;">
              <h4 style="font-size:0.85rem; font-weight:600; margin-bottom:4px;">Care & Maintenance:</h4>
              <p style="font-size:0.8rem; color:#6B7280; line-height:1.4;">${product.careInstructions || 'Wipe with microfiber cloth. Professional care recommended.'}</p>
            </div>
          </div>
        </div>

        <!-- FOOTER SIGN OFF -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #E5E7EB; padding-top:16px; margin-top:20px; font-size:0.75rem; color:#9CA3AF;">
          <div>
            <div>AtelierFlow Architecture & Interior Lifecycle System</div>
            <div>Lead Architect: ${project.leadArchitect}</div>
          </div>
          <div>
            Client Approval Signature: _______________________ Date: _________
          </div>
        </div>
      </div>
    `;

    // Hook up print cut sheet button inside modal
    const printBtn = document.getElementById('btn-print-cutsheet');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }

    modal.classList.add('open');
  }

  initToasts() {
    this.toastContainer = document.getElementById('toast-container');
  }

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-primary);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      <span>${message}</span>
    `;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
