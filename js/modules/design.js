// AtelierFlow - Design & Spatial Mapping Module (Interactive 2D Floorplan & 3D Render Hotspots)
import { stateManager } from './state.js';

let selectedFloorplanItem = null;
let isDraggingItem = false;
let dragOffset = { x: 0, y: 0 };
let activeLayer = 'all'; // 'all' | 'furniture' | 'clearance' | 'snags'

export function renderDesign(container) {
  const { rooms, products, renders, snags, selectedRoomId } = stateManager.state;
  const currentRoom = rooms.find(r => r.id === selectedRoomId);

  // Products placed on the floorplan
  const placedProducts = products.filter(p => p.floorplan && (selectedRoomId === 'all' || p.room === selectedRoomId));

  container.innerHTML = `
    <!-- DESIGN HEADER -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-bottom:4px;">Design & Spatial Floorplan Mapping</h2>
        <p class="text-secondary text-sm">Interactive 2D scaled space planning, furniture layout & client render reviews</p>
      </div>

      <div style="display:flex; gap:10px; align-items:center;">
        <div style="display:flex; background:var(--bg-surface); padding:4px; border-radius:var(--radius-full); border:1px solid var(--border-subtle);">
          <button class="nav-pillar-btn layer-btn ${activeLayer === 'all' ? 'active' : ''}" data-layer="all">Full Layout</button>
          <button class="nav-pillar-btn layer-btn ${activeLayer === 'clearance' ? 'active' : ''}" data-layer="clearance">Clearance Zones</button>
          <button class="nav-pillar-btn layer-btn ${activeLayer === 'snags' ? 'active' : ''}" data-layer="snags">Defect Pins (${snags.length})</button>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-export-cad">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Plan
        </button>
      </div>
    </div>

    <!-- ROOM FILTER SELECTOR -->
    <div class="room-filter-bar">
      <button class="room-pill ${selectedRoomId === 'all' ? 'active' : ''}" data-room-id="all">
        Full Penthouse Plan (6 Zones)
      </button>
      ${rooms.map(r => `
        <button class="room-pill ${selectedRoomId === r.id ? 'active' : ''}" data-room-id="${r.id}">
          ${r.name}
        </button>
      `).join('')}
    </div>

    <!-- MAIN DESIGN WORKSPACE: 2D CANVAS + ROOM INSPECTOR -->
    <div class="design-view-grid">
      <!-- 2D INTERACTIVE CANVAS VIEWPORT -->
      <div class="floorplan-viewport" id="floorplan-viewport-box">
        <div class="floorplan-toolbar">
          <span style="font-size:0.75rem; font-weight:700; color:var(--text-accent); text-transform:uppercase; letter-spacing:0.05em;">Scale 1:50</span>
          <span style="color:var(--border-medium);">|</span>
          <span class="text-xs text-secondary">Drag furniture to re-position • Click item to inspect</span>
          <span style="color:var(--border-medium);">|</span>
          <button class="btn btn-ghost btn-sm" id="fp-rotate-btn" title="Rotate selected item 45°">↻ Rotate 45°</button>
        </div>

        <canvas class="floorplan-canvas" id="floorplan-canvas" width="1050" height="680"></canvas>
      </div>

      <!-- ROOM FINISHES & SPEC SCHEDULE SIDEBAR -->
      <div class="room-inspector-panel">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="badge badge-neutral" style="font-family:monospace;">${currentRoom ? currentRoom.code : 'ALL-ZONES'}</span>
            <span class="text-xs text-accent">Active Space Profile</span>
          </div>
          <h3 style="font-family:var(--font-serif); font-size:1.35rem; color:var(--text-primary);">
            ${currentRoom ? currentRoom.name : 'Penthouse Overall Master Plan'}
          </h3>
          <p class="text-xs text-secondary" style="margin-top:4px;">
            ${currentRoom ? currentRoom.notes : 'Complete penthouse spatial configuration featuring south-facing lounge, master wing, and ocean-view solarium.'}
          </p>
        </div>

        ${currentRoom ? `
          <div class="room-metric-box">
            <div>
              <div class="text-muted text-xs">Floor Area</div>
              <div class="font-bold">${currentRoom.sqft} sq ft <span class="text-muted">(${currentRoom.sqm} m²)</span></div>
            </div>
            <div>
              <div class="text-muted text-xs">Ceiling Height</div>
              <div class="font-bold">${currentRoom.ceilingHeight}</div>
            </div>
            <div>
              <div class="text-muted text-xs">Sun Orientation</div>
              <div class="font-bold text-accent">${currentRoom.orientation}</div>
            </div>
            <div>
              <div class="text-muted text-xs">Allocated Budget</div>
              <div class="font-bold text-gold">${stateManager.formatCurrency(currentRoom.budgetAllocated)}</div>
            </div>
          </div>

          <div style="background:var(--bg-surface-elevated); padding:12px; border-radius:var(--radius-sm); font-size:0.8rem; display:flex; flex-direction:column; gap:8px;">
            <div class="text-xs text-accent font-bold" style="text-transform:uppercase; letter-spacing:0.06em;">Architectural Finishes</div>
            <div><strong style="color:var(--text-primary);">Flooring:</strong> ${currentRoom.floorFinish}</div>
            <div><strong style="color:var(--text-primary);">Walls:</strong> ${currentRoom.wallFinish}</div>
            <div><strong style="color:var(--text-primary);">Ceiling:</strong> ${currentRoom.ceilingFinish}</div>
          </div>
        ` : ''}

        <!-- ITEMS IN THIS ROOM -->
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="font-size:0.9rem; font-weight:600;">Allocated FF&E (${placedProducts.length})</h4>
            <span class="text-xs text-muted">Click to select</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px; max-height:280px; overflow-y:auto;">
            ${placedProducts.map(p => `
              <div class="placed-item-row" data-prod-id="${p.id}" style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-surface-elevated); padding:8px 10px; border-radius:var(--radius-sm); border:1px solid ${selectedFloorplanItem === p.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}; cursor:pointer;">
                <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                  <img src="${p.imageUrl}" style="width:30px; height:30px; border-radius:var(--radius-xs); object-fit:cover;">
                  <div style="overflow:hidden;">
                    <div style="font-size:0.78rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                    <div style="font-size:0.68rem; color:var(--text-muted);">${p.dimensions.width}×${p.dimensions.depth}mm</div>
                  </div>
                </div>
                <button class="btn btn-ghost btn-sm btn-view-cutsheet" data-prod-id="${p.id}" title="View Spec">📄</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- 3D CONCEPT RENDERS & CLIENT PIN REVIEW SECTION -->
    <div class="renders-strip">
      <div class="card-header" style="margin-bottom:20px;">
        <div>
          <h3 class="card-title">3D Concept Visualizations & Client Review Pins</h3>
          <p class="text-secondary text-sm">Click anywhere on a rendering to leave a design comment or client feedback pin</p>
        </div>
        <span class="badge badge-approved">3 High-Res Renders Approved</span>
      </div>

      <div class="render-cards-grid">
        ${renders.map(r => `
          <div class="render-card">
            <div class="render-image-wrap" data-render-id="${r.id}">
              <img src="${r.imageUrl}" alt="${r.title}">
              ${r.pins.map((pin, idx) => `
                <div class="render-pin-drop" style="left:${pin.x}%; top:${pin.y}%;" title="${pin.author}: ${pin.text}">
                  ${idx + 1}
                </div>
              `).join('')}
            </div>

            <div class="render-comments-box">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-family:var(--font-serif); font-size:1.05rem;">${r.title}</strong>
                <span class="badge badge-approved" style="font-size:0.7rem;">${r.clientStatus}</span>
              </div>

              <!-- Pin comments thread -->
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                ${r.pins.map(pin => `
                  <div class="render-comment-item">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span class="font-bold text-xs" style="color:${pin.role === 'Client' ? 'var(--accent-gold)' : 'var(--text-primary)'};">
                        ${pin.author}
                      </span>
                      <span class="text-muted" style="font-size:0.68rem;">${pin.date} • ${pin.status}</span>
                    </div>
                    <p style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4;">${pin.text}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Draw 2D Floorplan Canvas
  drawFloorplanCanvas(container);

  // Attach layer buttons
  container.querySelectorAll('.layer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeLayer = btn.getAttribute('data-layer');
      container.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      drawFloorplanCanvas(container);
    });
  });

  // Attach Room pills
  container.querySelectorAll('.room-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomId = btn.getAttribute('data-room-id');
      stateManager.setSelectedRoom(roomId);
    });
  });

  // Attach rotate button
  const rotateBtn = container.querySelector('#fp-rotate-btn');
  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      if (selectedFloorplanItem) {
        const prod = stateManager.state.products.find(p => p.id === selectedFloorplanItem);
        if (prod && prod.floorplan) {
          const newRot = ((prod.floorplan.rotation || 0) + 45) % 360;
          stateManager.updateFloorplanPlacement(selectedFloorplanItem, { rotation: newRot });
          drawFloorplanCanvas(container);
        }
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Click an item on the floorplan first to rotate.' } }));
      }
    });
  }

  // Attach placed item row clicks
  container.querySelectorAll('.placed-item-row').forEach(row => {
    row.addEventListener('click', () => {
      selectedFloorplanItem = row.getAttribute('data-prod-id');
      drawFloorplanCanvas(container);
    });
  });

  container.querySelectorAll('.btn-view-cutsheet').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const prodId = btn.getAttribute('data-prod-id');
      window.dispatchEvent(new CustomEvent('open-spec-sheet', { detail: { productId: prodId } }));
    });
  });

  // Render Image Pin click to add new feedback pin
  container.querySelectorAll('.render-image-wrap').forEach(wrap => {
    wrap.addEventListener('click', (e) => {
      const renderId = wrap.getAttribute('data-render-id');
      const rect = wrap.getBoundingClientRect();
      const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

      const commentText = prompt('Add feedback comment for this rendering:', 'Please review finish detail.');
      if (commentText) {
        stateManager.addRenderPin(renderId, {
          x: clickX,
          y: clickY,
          text: commentText
        });
        renderDesign(container);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Feedback pin dropped on rendering!' } }));
      }
    });
  });
}

function drawFloorplanCanvas(container) {
  const canvas = container.querySelector('#floorplan-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { products, snags, selectedRoomId } = stateManager.state;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background architectural grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridSize = 30;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Architectural Penthouse Zones & Walls
  const architecturalRooms = [
    { id: 'room-terrace', name: 'SUNSET TERRACE & SOLARIUM', x: 280, y: 20, w: 460, h: 120, fill: 'rgba(158, 130, 104, 0.06)' },
    { id: 'room-study', name: 'EXECUTIVE STUDY', x: 80, y: 380, w: 220, h: 250, fill: 'rgba(63, 74, 66, 0.08)' },
    { id: 'room-living', name: 'GREAT ROOM & LOUNGE', x: 280, y: 150, w: 320, h: 280, fill: 'rgba(197, 168, 128, 0.08)' },
    { id: 'room-dining', name: 'DINING PAVILION', x: 620, y: 150, w: 340, h: 200, fill: 'rgba(94, 104, 88, 0.08)' },
    { id: 'room-kitchen', name: "CHEF'S KITCHEN", x: 620, y: 20, w: 340, h: 120, fill: 'rgba(164, 126, 91, 0.08)' },
    { id: 'room-master', name: 'MASTER SANCTUARY SUITE', x: 620, y: 360, w: 340, h: 270, fill: 'rgba(126, 107, 93, 0.08)' }
  ];

  architecturalRooms.forEach(room => {
    const isFocused = selectedRoomId === 'all' || selectedRoomId === room.id;
    ctx.fillStyle = isFocused ? room.fill : 'rgba(255,255,255,0.01)';
    ctx.fillRect(room.x, room.y, room.w, room.h);

    // Wall outlines
    ctx.strokeStyle = isFocused ? 'rgba(197, 168, 128, 0.7)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = isFocused ? 3 : 1.5;
    ctx.strokeRect(room.x, room.y, room.w, room.h);

    // Room name tag
    ctx.fillStyle = isFocused ? '#C5A880' : 'rgba(255,255,255,0.3)';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(room.name, room.x + 12, room.y + 20);

    // Door Swing indicators
    ctx.strokeStyle = 'rgba(197, 168, 128, 0.3)';
    ctx.beginPath();
    ctx.arc(room.x, room.y + room.h / 2, 24, 0, Math.PI / 2);
    ctx.stroke();
  });

  // Circulation / Clearance Corridor overlay
  if (activeLayer === 'clearance') {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    // Corridors
    ctx.fillRect(240, 150, 40, 280);
    ctx.fillRect(600, 150, 20, 480);
    ctx.fillRect(280, 430, 340, 30);
    
    ctx.fillStyle = '#60A5FA';
    ctx.font = '500 10px sans-serif';
    ctx.fillText('900mm CLEARANCE CORRIDOR', 320, 450);
  }

  // Draw Furniture Footprints
  products.forEach(p => {
    if (!p.floorplan) return;
    const fp = p.floorplan;
    const isSelected = selectedFloorplanItem === p.id;
    const isRoomVisible = selectedRoomId === 'all' || p.room === selectedRoomId;

    if (!isRoomVisible) return;

    ctx.save();
    ctx.translate(fp.x, fp.y);
    ctx.rotate(((fp.rotation || 0) * Math.PI) / 180);

    // Furniture Body
    ctx.fillStyle = isSelected ? 'rgba(212, 175, 55, 0.45)' : 'rgba(28, 30, 38, 0.9)';
    ctx.strokeStyle = isSelected ? '#D4AF37' : '#C5A880';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;

    const halfW = fp.width / 2;
    const halfH = fp.height / 2;

    // Rounded rectangle for furniture
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, fp.width, fp.height, 4);
    ctx.fill();
    ctx.stroke();

    // Furniture Inner Label
    ctx.fillStyle = isSelected ? '#FFF' : '#E8E2D5';
    ctx.font = '600 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Truncate name
    const shortName = p.name.length > 14 ? p.name.substring(0, 12) + '..' : p.name;
    ctx.fillText(shortName, 0, 0);

    ctx.restore();
  });

  // Snags / Defect Pins overlay
  if (activeLayer === 'all' || activeLayer === 'snags') {
    snags.forEach((snag, idx) => {
      ctx.save();
      ctx.fillStyle = snag.severity === 'Critical' ? '#EF4444' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(snag.x, snag.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`!`, snag.x, snag.y);
      ctx.restore();
    });
  }

  // Canvas Mouse Dragging & Selection Handling
  canvas.onmousedown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find if clicked a product
    let hitProduct = null;
    for (const p of products) {
      if (!p.floorplan) continue;
      const fp = p.floorplan;
      const dist = Math.hypot(mouseX - fp.x, mouseY - fp.y);
      if (dist < Math.max(fp.width, fp.height) / 1.5) {
        hitProduct = p;
        break;
      }
    }

    if (hitProduct) {
      selectedFloorplanItem = hitProduct.id;
      isDraggingItem = true;
      dragOffset = { x: mouseX - hitProduct.floorplan.x, y: mouseY - hitProduct.floorplan.y };
      drawFloorplanCanvas(container);
    } else {
      selectedFloorplanItem = null;
      drawFloorplanCanvas(container);
    }
  };

  canvas.onmousemove = (e) => {
    if (!isDraggingItem || !selectedFloorplanItem) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = Math.round(mouseX - dragOffset.x);
    const newY = Math.round(mouseY - dragOffset.y);

    stateManager.updateFloorplanPlacement(selectedFloorplanItem, { x: newX, y: newY });
    drawFloorplanCanvas(container);
  };

  canvas.onmouseup = () => {
    isDraggingItem = false;
  };
}
