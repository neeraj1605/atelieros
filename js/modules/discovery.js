// AtelierFlow - Product Discovery (FF&E, Moodboard & Samples) Module
import { stateManager } from './state.js';

let activeSubTab = 'catalog'; // 'catalog' | 'moodboard' | 'samples'
let searchQuery = '';
let selectedCategory = 'all';
let selectedStyle = 'all';

export function renderDiscovery(container) {
  const { products, rooms, moodboard, samples, selectedRoomId, isClientMode } = stateManager.state;

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesRoom = selectedRoomId === 'all' || p.room === selectedRoomId;
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesStyle = selectedStyle === 'all' || p.style === selectedStyle;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.finish.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRoom && matchesCategory && matchesStyle && matchesSearch;
  });

  // Unique categories and styles
  const categories = Array.from(new Set(products.map(p => p.category))).sort();
  const styles = Array.from(new Set(products.map(p => p.style))).sort();

  container.innerHTML = `
    <!-- DISCOVERY HEADER & SUB-NAVIGATION -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-bottom:4px;">Product Discovery & FF&E</h2>
        <p class="text-secondary text-sm">Curate materials, furniture, lighting & tactile finishes for the project</p>
      </div>

      <div style="display:flex; gap:10px; align-items:center;">
        <!-- Sub-tabs -->
        <div style="display:flex; background:var(--bg-surface); padding:4px; border-radius:var(--radius-full); border:1px solid var(--border-subtle);">
          <button class="nav-pillar-btn subtab-btn ${activeSubTab === 'catalog' ? 'active' : ''}" data-subtab="catalog">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            FF&E Catalog (${products.length})
          </button>
          <button class="nav-pillar-btn subtab-btn ${activeSubTab === 'moodboard' ? 'active' : ''}" data-subtab="moodboard">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
            Moodboard Studio
          </button>
          <button class="nav-pillar-btn subtab-btn ${activeSubTab === 'samples' ? 'active' : ''}" data-subtab="samples">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            Sample Tracker (${samples.length})
          </button>
        </div>

        <button class="btn btn-primary" id="btn-open-add-product">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Custom Item
        </button>
      </div>
    </div>

    <!-- ROOM FILTER PILL STRIP -->
    <div class="room-filter-bar">
      <button class="room-pill ${selectedRoomId === 'all' ? 'active' : ''}" data-room-id="all">
        All Rooms (${products.length})
      </button>
      ${rooms.map(r => {
        const count = products.filter(p => p.room === r.id).length;
        return `
          <button class="room-pill ${selectedRoomId === r.id ? 'active' : ''}" data-room-id="${r.id}">
            ${r.name} (${count})
          </button>
        `;
      }).join('')}
    </div>

    <!-- SUBTAB CONTENT -->
    <div id="subtab-content-area">
      ${activeSubTab === 'catalog' ? renderCatalogView(filteredProducts, categories, styles, rooms, isClientMode) : ''}
      ${activeSubTab === 'moodboard' ? renderMoodboardView(moodboard, products) : ''}
      ${activeSubTab === 'samples' ? renderSamplesView(samples) : ''}
    </div>
  `;

  // Attach Sub-tab listeners
  container.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSubTab = btn.getAttribute('data-subtab');
      renderDiscovery(container);
    });
  });

  // Attach Room pill listeners
  container.querySelectorAll('.room-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomId = btn.getAttribute('data-room-id');
      stateManager.setSelectedRoom(roomId);
    });
  });

  // Attach Catalog filter & search events
  const searchInput = container.querySelector('#product-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderDiscovery(container);
    });
  }

  const categorySelect = container.querySelector('#filter-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      selectedCategory = e.target.value;
      renderDiscovery(container);
    });
  }

  const styleSelect = container.querySelector('#filter-style');
  if (styleSelect) {
    styleSelect.addEventListener('change', (e) => {
      selectedStyle = e.target.value;
      renderDiscovery(container);
    });
  }

  // Add Custom Item Button
  const addBtn = container.querySelector('#btn-open-add-product');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'modal-add-product' } }));
    });
  }

  // Product card action buttons
  container.querySelectorAll('.btn-spec-sheet').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.getAttribute('data-prod-id');
      window.dispatchEvent(new CustomEvent('open-spec-sheet', { detail: { productId: prodId } }));
    });
  });

  container.querySelectorAll('.btn-place-floorplan').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.getAttribute('data-prod-id');
      const product = stateManager.state.products.find(p => p.id === prodId);
      if (product) {
        stateManager.setSelectedRoom(product.room || 'all');
        stateManager.setActiveView('design');
      }
    });
  });

  container.querySelectorAll('.btn-pin-moodboard').forEach(btn => {
    btn.addEventListener('click', () => {
      const prodId = btn.getAttribute('data-prod-id');
      const product = stateManager.state.products.find(p => p.id === prodId);
      if (product) {
        stateManager.addMoodboardItem({
          type: 'image',
          title: product.name,
          imageUrl: product.imageUrl,
          caption: `${product.name} - ${product.vendor}`,
          productId: product.id,
          x: 100 + Math.random() * 100,
          y: 100 + Math.random() * 100
        });
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Pinned "${product.name}" to Moodboard!` } }));
      }
    });
  });

  // Attach Moodboard Canvas drag listeners if in moodboard tab
  if (activeSubTab === 'moodboard') {
    initMoodboardInteractions(container);
  }

  // Attach Sample status change listeners
  container.querySelectorAll('.sample-status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const sampleId = select.getAttribute('data-sample-id');
      stateManager.updateSampleStatus(sampleId, e.target.value);
    });
  });
}

function renderCatalogView(products, categories, styles, rooms, isClientMode) {
  return `
    <!-- CATALOG TOOLBAR -->
    <div class="catalog-toolbar">
      <div class="search-input-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" id="product-search-input" class="search-input" placeholder="Search furniture, finishes, vendors, SKUs..." value="${searchQuery}">
      </div>

      <div class="catalog-filter-group">
        <select id="filter-category" class="filter-select">
          <option value="all">All Categories</option>
          ${categories.map(c => `<option value="${c}" ${selectedCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>

        <select id="filter-style" class="filter-select">
          <option value="all">All Styles</option>
          ${styles.map(s => `<option value="${s}" ${selectedStyle === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        
        <span class="text-xs text-muted" style="margin-left:8px;">Showing ${products.length} specifications</span>
      </div>
    </div>

    <!-- PRODUCT SPECIFICATION GRID -->
    <div class="product-grid">
      ${products.length === 0 ? `
        <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px; background:var(--bg-surface); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <p class="text-secondary" style="font-size:1.1rem; margin-bottom:12px;">No products match the selected filters.</p>
          <button class="btn btn-secondary btn-sm" onclick="window.resetFilters()">Clear Filters</button>
        </div>
      ` : products.map(p => {
        const roomObj = rooms.find(r => r.id === p.room);
        const statusBadgeClass = p.procurementStatus.includes('Approved') || p.procurementStatus === 'Delivered' 
          ? 'badge-approved' 
          : p.procurementStatus.includes('Production') || p.procurementStatus.includes('PO') 
          ? 'badge-progress' 
          : 'badge-pending';

        return `
          <div class="product-card">
            <div class="product-thumb-wrap">
              <img class="product-thumb" src="${p.imageUrl}" alt="${p.name}" loading="lazy">
              <span class="product-category-tag">${p.category}</span>
              <span class="product-status-tag badge ${statusBadgeClass}">${p.procurementStatus}</span>
            </div>

            <div class="product-body">
              <div style="display:flex; justify-content:space-between; align-items:baseline;">
                <span class="product-vendor">${p.vendor}</span>
                <span class="text-xs text-muted" style="font-family:monospace;">${p.sku}</span>
              </div>
              <h3 class="product-name">${p.name}</h3>

              <div class="product-specs-compact">
                <div style="color:var(--text-accent); font-size:0.75rem; margin-bottom:4px;">
                  📍 ${roomObj ? roomObj.name : 'Unassigned'}
                </div>
                <div style="margin-bottom:4px;"><strong>Finish:</strong> ${p.finish}</div>
                <div><strong>Dimensions:</strong> ${p.dimensions.width}W × ${p.dimensions.depth}D × ${p.dimensions.height}H ${p.dimensions.unit}</div>
              </div>

              <div class="product-price-row">
                <div>
                  <div class="client-price-tag">${stateManager.formatCurrency(p.clientPrice)}</div>
                  <div class="text-xs text-muted">Client Unit Price</div>
                </div>

                ${!isClientMode ? `
                  <div style="text-align:right;">
                    <div class="trade-cost-tag">Cost: ${stateManager.formatCurrency(p.tradeCost)}</div>
                    <div class="text-xs text-gold">+${p.markupPercent || 35}% Markup</div>
                  </div>
                ` : `
                  <div class="badge badge-approved" style="font-size:0.7rem;">Verified Spec</div>
                `}
              </div>

              <div class="product-card-actions">
                <button class="btn btn-secondary btn-sm btn-spec-sheet" data-prod-id="${p.id}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Cut Sheet
                </button>
                <button class="btn btn-ghost btn-sm btn-place-floorplan" data-prod-id="${p.id}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon></svg>
                  Floorplan
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderMoodboardView(moodboard, products) {
  return `
    <div class="moodboard-workspace">
      <!-- CANVAS -->
      <div>
        <div class="moodboard-canvas-container" id="moodboard-canvas-box">
          <div class="moodboard-canvas-toolbar">
            <button class="btn btn-ghost btn-sm" id="mb-zoom-in" title="Zoom In">+</button>
            <button class="btn btn-ghost btn-sm" id="mb-zoom-out" title="Zoom Out">-</button>
            <span style="color:var(--border-medium);">|</span>
            <button class="btn btn-ghost btn-sm" id="mb-add-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Add Note
            </button>
            <button class="btn btn-ghost btn-sm" id="mb-reset-canvas">Reset Layout</button>
          </div>

          <div class="moodboard-canvas-inner" id="moodboard-canvas-inner">
            ${moodboard.items.map(item => {
              if (item.type === 'image' || item.type === 'swatch') {
                return `
                  <div class="moodboard-item-elem" data-item-id="${item.id}" style="left:${item.x}px; top:${item.y}px; width:${item.width}px; height:${item.height}px; transform: rotate(${item.rotation || 0}deg); z-index:${item.zIndex || 1};">
                    <img src="${item.imageUrl}" alt="${item.title}">
                    <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(14,15,18,0.85); backdrop-filter:blur(6px); padding:6px 10px; font-size:0.72rem; color:var(--text-primary); border-top:1px solid rgba(255,255,255,0.08);">
                      ${item.title}
                    </div>
                  </div>
                `;
              } else if (item.type === 'note') {
                return `
                  <div class="moodboard-item-elem" data-item-id="${item.id}" style="left:${item.x}px; top:${item.y}px; width:${item.width}px; height:${item.height}px; transform: rotate(${item.rotation || 0}deg); z-index:${item.zIndex || 1}; background:${item.bgColor || '#1C1E26'}; color:${item.textColor || '#F4F2EE'}; padding:16px; border:1px solid var(--border-accent);">
                    <div style="font-family:var(--font-serif); font-size:0.95rem; font-weight:600; margin-bottom:8px; color:var(--accent-gold);">${item.title}</div>
                    <p style="font-size:0.8rem; line-height:1.4;">${item.text}</p>
                  </div>
                `;
              }
              return '';
            }).join('')}
          </div>
        </div>

        <!-- EXTRACTED HARMONIOUS PALETTE STRIP -->
        <div style="margin-top:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="font-family:var(--font-serif); font-size:1.05rem;">Curated Material Palette</h4>
            <span class="text-xs text-secondary">6 Cohesive Architectural Tones</span>
          </div>
          <div class="moodboard-palette-strip">
            ${moodboard.palette.map(p => `
              <div class="palette-swatch-box">
                <div class="swatch-color-pill" style="background-color: ${p.hex};"></div>
                <div class="swatch-name">${p.name}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="swatch-hex">${p.hex}</span>
                  <span class="text-xs text-accent" style="font-size:0.65rem;">${p.role}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- SIDEBAR PINNER & SWATCHES -->
      <div class="card" style="padding:18px;">
        <div class="card-header">
          <h4 class="card-title" style="font-size:1.05rem;">Pin to Board</h4>
          <span class="text-xs text-muted">Drag or click</span>
        </div>
        <p class="text-xs text-secondary" style="margin-bottom:14px;">Quickly add key items from the FF&E schedule onto your freeform concept canvas:</p>
        
        <div style="display:flex; flex-direction:column; gap:10px; max-height:520px; overflow-y:auto; padding-right:4px;">
          ${products.slice(0, 10).map(p => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-surface-elevated); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                <img src="${p.imageUrl}" style="width:34px; height:34px; border-radius:var(--radius-xs); object-fit:cover;">
                <div style="overflow:hidden;">
                  <div style="font-size:0.8rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                  <div style="font-size:0.7rem; color:var(--text-muted);">${p.category}</div>
                </div>
              </div>
              <button class="btn btn-ghost btn-sm btn-pin-moodboard" data-prod-id="${p.id}" title="Add to Board">+</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSamplesView(samples) {
  return `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Physical Sample Library & Client Sign-offs</h3>
          <p class="text-secondary text-sm">Track physical stone slabs, wood finishes, fabrics, and metal chips</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-add-sample">
          + Request New Sample
        </button>
      </div>

      <div style="overflow-x:auto;">
        <table class="boq-table">
          <thead>
            <tr>
              <th>Material / Swatch</th>
              <th>Category</th>
              <th>Vendor</th>
              <th>Studio Location</th>
              <th>Requested</th>
              <th>Received</th>
              <th>Client Approval</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${samples.map(s => `
              <tr>
                <td>
                  <strong>${s.productName}</strong>
                  <div class="text-xs text-muted">${s.notes}</div>
                </td>
                <td><span class="badge badge-neutral">${s.category}</span></td>
                <td>${s.vendor}</td>
                <td style="font-family:monospace; font-size:0.8rem;">${s.location}</td>
                <td class="text-muted">${s.dateRequested}</td>
                <td>${s.dateReceived}</td>
                <td>
                  <span style="color:${s.clientSignoff.includes('Approved') ? 'var(--status-approved)' : 'var(--text-secondary)'}; font-weight:500;">
                    ${s.clientSignoff}
                  </span>
                </td>
                <td>
                  <select class="filter-select sample-status-select" data-sample-id="${s.id}" style="padding:4px 8px; font-size:0.78rem;">
                    <option value="Requested" ${s.status === 'Requested' ? 'selected' : ''}>Requested</option>
                    <option value="In Transit" ${s.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
                    <option value="Received" ${s.status === 'Received' ? 'selected' : ''}>Received</option>
                    <option value="Approved" ${s.status === 'Approved' ? 'selected' : ''}>Approved</option>
                    <option value="Rejected" ${s.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function initMoodboardInteractions(container) {
  const canvasInner = container.querySelector('#moodboard-canvas-inner');
  if (!canvasInner) return;

  let activeItem = null;
  let offsetX = 0;
  let offsetY = 0;

  canvasInner.querySelectorAll('.moodboard-item-elem').forEach(elem => {
    elem.addEventListener('mousedown', (e) => {
      activeItem = elem;
      const rect = elem.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      elem.style.zIndex = '99';
      e.stopPropagation();
    });
  });

  window.addEventListener('mousemove', (e) => {
    if (!activeItem) return;
    const canvasRect = canvasInner.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - offsetX;
    const newY = e.clientY - canvasRect.top - offsetY;

    activeItem.style.left = `${Math.max(0, newX)}px`;
    activeItem.style.top = `${Math.max(0, newY)}px`;
  });

  window.addEventListener('mouseup', () => {
    if (activeItem) {
      const itemId = activeItem.getAttribute('data-item-id');
      const left = parseInt(activeItem.style.left, 10);
      const top = parseInt(activeItem.style.top, 10);
      stateManager.updateMoodboardItem(itemId, { x: left, y: top });
      activeItem = null;
    }
  });

  const addNoteBtn = container.querySelector('#mb-add-note');
  if (addNoteBtn) {
    addNoteBtn.addEventListener('click', () => {
      const noteText = prompt('Enter design principle or concept note:', 'Layered natural textures with warm ambient lighting.');
      if (noteText) {
        stateManager.addMoodboardItem({
          type: 'note',
          title: 'Design Note',
          text: noteText,
          x: 200,
          y: 200,
          width: 240,
          height: 160
        });
      }
    });
  }
}
