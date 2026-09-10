/* ============================================================
   Planex AI — Design Docket Module
   Floorplan canvas + furniture footprints + editable BOQ
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.DesignDocket = (function () {
  let showGrid = true;
  let showFurniture = true;

  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  function scopeRoomsHtml(scope) {
    return '<div class="scope-rooms">' + scope.rooms.map((room, ri) => {
      const count = room.categories.reduce((n, c) => n + c.items.length, 0);
      const cats = room.categories.map((cat, ci) => `
        <div class="scope-cat">
          <div class="scope-cat-name">${esc(cat.name)}${cat.known ? '' : ' <span class="faint text-xs">(custom)</span>'}</div>
          ${cat.items.map((it, ii) => `
            <label class="scope-item">
              <input type="checkbox" ${it.included === false ? '' : 'checked'} data-scope-toggle="${ri}:${ci}:${ii}">
              <span class="scope-item-name">${esc(it.name)}</span>
              <input class="scope-qty" type="number" min="0" value="${it.qty}" data-scope-qty="${ri}:${ci}:${ii}">
              <span class="scope-unit">${esc(it.unit)}</span>
              ${it.note ? `<span class="scope-note">${esc(it.note)}</span>` : ''}
            </label>`).join('')}
        </div>`).join('');
      return `
        <details class="scope-room" open>
          <summary>
            <span class="scope-room-name">${esc(room.name)}</span>
            <span class="faint text-xs">${count} items</span>
          </summary>
          ${cats}
          <div class="scope-room-actions">
            <button class="btn btn-secondary btn-sm" data-scope-room-add="${ri}">Add this room to BOQ</button>
          </div>
        </details>`;
    }).join('') + '</div>';
  }

  function furnitureFor(room) {
    // returns items in metres relative to room L (x) × W (y)
    const L = room.length, W = room.width;
    const n = room.name.toLowerCase();
    const F = [];
    const add = (x, y, w, h, label, color) => F.push({ x, y, w, h, label, color });

    if (n.includes('living')) {
      add(0.25, 0.3, 2.2, 0.9, 'Sofa', '#8a6f52');
      add(2.7, 0.3, 0.9, 0.9, 'Chair', '#a98a68');
      add(3.75, 0.3, 0.9, 0.9, 'Chair', '#a98a68');
      add(2.0, 1.9, 1.1, 0.6, 'Coffee Table', '#9c8a68');
      add(0.25, W - 1.2, 2.4, 0.45, 'TV Unit', '#6f6f76');
    } else if (n.includes('kitchen')) {
      add(0.2, 0.2, L - 0.4, 0.6, 'Counter', '#7f8c8d');
      add(0.2, 0.8, 0.6, W - 1.0, 'Counter', '#7f8c8d');
      add(1.6, 1.2, 1.2, 0.8, 'Island', '#95a5a6');
    } else if (n.includes('master')) {
      add((L - 1.9) / 2, 0.3, 1.9, 2.1, 'King Bed', '#7d6b8a');
      add((L - 1.9) / 2 - 0.55, 0.35, 0.45, 0.45, 'Side', '#9b8aa8');
      add((L + 1.9) / 2 + 0.1, 0.35, 0.45, 0.45, 'Side', '#9b8aa8');
      add(0.2, W - 0.8, 2.4, 0.6, 'Wardrobe', '#6b5f78');
    } else if (n.includes('kids')) {
      add(0.3, 0.3, 1.0, 2.0, 'Bunk Bed', '#c98f4a');
      add(L - 1.5, 0.3, 1.2, 0.6, 'Study', '#b07c3f');
      add(0.3, W - 0.8, 1.6, 0.5, 'Storage', '#d0a468');
    } else if (n.includes('study')) {
      add(0.2, 0.2, 1.6, 0.6, 'Desk', '#6f8a6a');
      add(0.2, W - 0.7, 1.8, 0.5, 'Shelving', '#5f7a5a');
    } else if (n.includes('bath')) {
      add(0.2, 0.2, 0.6, 0.7, 'WC', '#6f9bb0');
      add(L - 1.1, 0.2, 0.9, 0.5, 'Vanity', '#6f9bb0');
      add(0.2, W - 1.0, 0.9, 0.8, 'Shower', '#7fb0c9');
    }
    return F;
  }

  function drawPlan(canvas, room) {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.parentElement.clientWidth || 560;
    const maxH = 380;
    const ratio = room.width / room.length;
    let cssH = cssW * ratio;
    if (cssH > maxH) { cssH = maxH; }
    const drawW = cssH / ratio > cssW ? cssW : cssH / ratio;
    const drawH = drawW * ratio;

    canvas.width = Math.round(drawW * dpr);
    canvas.height = Math.round(drawH * dpr);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = drawW, H = drawH;

    const styles = getComputedStyle(document.documentElement);
    const cBg = styles.getPropertyValue('--bg-inset').trim() || '#f4f4f5';
    const cBorder = styles.getPropertyValue('--border-strong').trim() || '#d4d4d8';
    const cText = styles.getPropertyValue('--text-secondary').trim() || '#52525b';
    const cAccent = styles.getPropertyValue('--text-muted').trim() || '#a1a1aa';

    ctx.clearRect(0, 0, W, H);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = cBorder;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      const step = W / (room.length * 2); // every 0.5 m
      for (let x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      const stepY = H / (room.width * 2);
      for (let y = 0; y <= H; y += stepY) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }

    // Room fill
    ctx.fillStyle = hexA(room.color, 0.14);
    ctx.fillRect(0, 0, W, H);

    // Furniture
    if (showFurniture) {
      const items = furnitureFor(room);
      const sx = W / room.length;
      const sy = H / room.width;
      items.forEach(it => {
        const x = it.x * sx, y = it.y * sy, w = it.w * sx, h = it.h * sy;
        ctx.fillStyle = hexA(it.color, 0.85);
        roundRect(ctx, x, y, w, h, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, w, h, 6);
        ctx.stroke();
        // label
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (w > 42 && h > 16) {
          ctx.fillText(it.label, x + w / 2, y + h / 2);
        }
      });
    }

    // Room border
    ctx.strokeStyle = cAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Dimensions
    ctx.fillStyle = cText;
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${room.length.toFixed(1)} m`, W / 2, H - 8 > 0 ? H - 8 : 12);
    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${room.width.toFixed(1)} m`, 0, 0);
    ctx.restore();

    // Scale note
    ctx.fillStyle = cAccent;
    ctx.font = '500 10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Scale ≈ 1:50', W - 8, 16);
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function hexA(hex, a) {
    if (!hex) return 'rgba(0,0,0,' + a + ')';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  function render(container) {
    const S = store().state;
    const active = S.rooms.find(r => r.id === S.activeRoomId) || S.rooms[0];
    const fin = store().getFinancials();
    const money = (n) => store().formatMoney(n);

    const roomRows = S.rooms.map(r => `
      <div class="room-row ${r.id === active.id ? 'active' : ''}" data-room="${r.id}">
        <div class="room-swatch" style="background:${r.color}"></div>
        <div class="room-info">
          <div class="rn">${esc(r.name)}</div>
          <div class="rd">${r.length.toFixed(1)} × ${r.width.toFixed(1)} m</div>
        </div>
        <div class="room-area">${r.area}</div>
      </div>`).join('');

    const rows = S.boq.map(b => `
      <tr>
        <td><div class="boq-cat">${esc(b.category)}</div><div style="font-weight:600;">${esc(b.item)}</div></td>
        <td class="num"><input class="input" style="width:74px;padding:6px 8px;text-align:right;" type="number" min="0" value="${b.qty}" data-qty="${b.id}"></td>
        <td class="num muted">${esc(b.unit)}</td>
        <td class="num"><input class="input" style="width:104px;padding:6px 8px;text-align:right;" type="number" min="0" value="${b.rate}" data-rate="${b.id}"></td>
        <td class="num bold">${money(b.qty * b.rate)}</td>
      </tr>`).join('');

    const scope = S.scope;
    const scopeSection = `
        <div class="section-label anim anim-3">Scope of Work</div>
        <div class="card anim anim-3">
          <div class="card-head">
            <div>
              <div class="card-title">${scope ? 'Room-wise Scope' : 'Build the Scope'}</div>
              <div class="card-sub">${scope ? 'Review, adjust quantities and push to the BOQ' : 'From your floor plan or brief — flooring, painting, civil, ceiling, lighting, plumbing, joinery and more'}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${scope
                ? `<button class="btn btn-secondary btn-sm" id="scope-rebuild">${ic('sparkles')} Rebuild</button>
                   <button class="btn btn-primary btn-sm" id="scope-add-all">${ic('plus')} Add selected to BOQ</button>`
                : `<button class="btn btn-primary btn-sm" id="scope-build">${ic('plan')} Build scope</button>`}
            </div>
          </div>
          ${scope
            ? scopeRoomsHtml(scope)
            : `<p class="muted text-sm">Upload a floor plan in <strong>Planex AI</strong>, then build a room-by-room scope of work. Every item is an AI estimate you can adjust before it reaches the BOQ.</p>`}
        </div>`;

    const rendersSection = (S.renders && S.renders.length) ? `
        <div class="section-label anim anim-3">Concept Renders</div>
        <div class="card anim anim-3">
          <div class="card-head">
            <div><div class="card-title">Generated Concepts</div><div class="card-sub">AI renders from your Planex AI conversations</div></div>
            <div class="badge badge-neutral">${S.renders.length}</div>
          </div>
          <div class="renders-grid">
            ${S.renders.map(r => `<img class="render-thumb" src="${r.dataUrl}" alt="Concept render" data-lightbox="${r.dataUrl}" title="${esc(r.prompt || '')}">`).join('')}
          </div>
        </div>` : '';

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <h1 class="serif">Design Docket</h1>
            <p>Your scaled floorplan, furniture layout, and detailed bill of quantities — the blueprint for execution.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="docket-print">${ic('print')} Print / PDF</button>
            <button class="btn btn-secondary btn-sm" id="docket-add">${ic('plus')} Add Item</button>
          </div>
        </div>

        <div class="docket-layout">
          <div class="card anim anim-1">
            <div class="card-head">
              <div>
                <div class="card-title">${esc(active.name)} <span class="faint" style="font-weight:400;">• ${active.area}</span></div>
                <div class="card-sub">Furniture layout with clearances</div>
              </div>
              <div class="badge badge-neutral mono">1:50</div>
            </div>
            <div class="plan-toolbar">
              <button class="chip-toggle ${showGrid ? 'active' : ''}" id="toggle-grid">Grid</button>
              <button class="chip-toggle ${showFurniture ? 'active' : ''}" id="toggle-furniture">Furniture</button>
              <div class="spacer"></div>
              <span class="faint text-xs">${ic('ruler')} mm precision</span>
            </div>
            <div class="plan-canvas-wrap">
              <canvas id="plan-canvas"></canvas>
            </div>
          </div>

          <div class="card anim anim-2">
            <div class="card-head">
              <div>
                <div class="card-title">Rooms</div>
                <div class="card-sub">Tap to view layout &amp; BOQ</div>
              </div>
              <div class="badge badge-info">${S.rooms.length}</div>
            </div>
            <div class="room-list">${roomRows}</div>
          </div>
        </div>

        ${scopeSection}
        ${rendersSection}
        <div class="section-label anim anim-3">Bill of Quantities</div>
        <div class="card anim anim-3" style="padding:0;overflow:hidden;">
          <div style="overflow-x:auto;">
            <table class="boq-table">
              <thead>
                <tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Rate</th><th class="num">Amount</th></tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr><td colspan="4" class="num muted">Subtotal</td><td class="num">${money(fin.subtotal)}</td></tr>
                <tr><td colspan="4" class="num muted">GST (18%)</td><td class="num">${money(fin.gst)}</td></tr>
                <tr><td colspan="4" class="num">Total Estimate</td><td class="num" style="font-size:17px;">${money(fin.total)}</td></tr>
                <tr><td colspan="4" class="num muted">Budget</td><td class="num ${fin.withinBudget ? 'compare-best' : ''}" style="color:${fin.withinBudget ? '' : 'var(--danger)'}">${money(fin.budget)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `;

    const canvas = container.querySelector('#plan-canvas');
    const redraw = () => drawPlan(canvas, store().state.rooms.find(r => r.id === store().state.activeRoomId) || store().state.rooms[0]);
    requestAnimationFrame(redraw);

    container.querySelectorAll('[data-room]').forEach(el => {
      el.addEventListener('click', () => {
        store().setActiveRoom(el.getAttribute('data-room'));
        window.PlanexApp.renderView();
      });
    });

    container.querySelector('#toggle-grid').addEventListener('click', () => { showGrid = !showGrid; window.PlanexApp.renderView(); });
    container.querySelector('#toggle-furniture').addEventListener('click', () => { showFurniture = !showFurniture; window.PlanexApp.renderView(); });

    container.querySelectorAll('[data-qty]').forEach(inp => {
      inp.addEventListener('change', () => {
        store().updateBOQItem(inp.getAttribute('data-qty'), { qty: Math.max(0, Number(inp.value) || 0) });
        window.PlanexApp.renderView();
      });
    });
    container.querySelectorAll('[data-rate]').forEach(inp => {
      inp.addEventListener('change', () => {
        store().updateBOQItem(inp.getAttribute('data-rate'), { rate: Math.max(0, Number(inp.value) || 0) });
        window.PlanexApp.renderView();
      });
    });

    container.querySelector('#docket-print').addEventListener('click', () => window.print());
    container.querySelector('#docket-add').addEventListener('click', addItemDialog);
    container.querySelectorAll('[data-lightbox]').forEach(el => {
      el.addEventListener('click', () => window.PlanexUI.lightbox(el.getAttribute('data-lightbox')));
    });

    // ---- Scope ----
    const buildBtn = container.querySelector('#scope-build') || container.querySelector('#scope-rebuild');
    if (buildBtn) buildBtn.addEventListener('click', buildScope);

    const addAll = container.querySelector('#scope-add-all');
    if (addAll) addAll.addEventListener('click', () => {
      const n = store().addScopeToBOQ();
      window.PlanexUI.toast(n + ' scope items added to the BOQ (rates blank).');
      window.PlanexApp.renderView();
    });

    container.querySelectorAll('[data-scope-room-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ri = Number(btn.getAttribute('data-scope-room-add'));
        const room = store().state.scope.rooms[ri];
        const n = store().addScopeToBOQ(room.id);
        window.PlanexUI.toast(n + ' items from ' + room.name + ' added to the BOQ.');
        window.PlanexApp.renderView();
      });
    });

    container.querySelectorAll('[data-scope-toggle]').forEach(el => {
      el.addEventListener('change', () => {
        const p = el.getAttribute('data-scope-toggle').split(':').map(Number);
        const it = store().state.scope.rooms[p[0]].categories[p[1]].items[p[2]];
        it.included = el.checked;
        store().commit();
      });
    });

    container.querySelectorAll('[data-scope-qty]').forEach(el => {
      el.addEventListener('change', () => {
        const p = el.getAttribute('data-scope-qty').split(':').map(Number);
        const it = store().state.scope.rooms[p[0]].categories[p[1]].items[p[2]];
        it.qty = Math.max(0, Number(el.value) || 0);
        store().commit();
      });
    });

    // redraw on resize
    if (!window.__planexResizeBound) {
      window.__planexResizeBound = true;
      let t;
      window.addEventListener('resize', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          if (window.PlanexStore.state.activeView === 'docket') window.PlanexApp.renderView();
        }, 180);
      });
    }
  }

  function addItemDialog() {
    const S = store().state;
    const roomOpts = S.rooms.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('');
    window.PlanexUI.modal('Add BOQ Item', `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="field-row">
          <div class="field"><label>Room</label><select class="select" id="ni-room">${roomOpts}</select></div>
          <div class="field"><label>Category</label>
            <select class="select" id="ni-cat">
              <option>Furniture</option><option>Civil</option><option>Flooring</option>
              <option>Wall</option><option>Millwork</option><option>Lighting</option>
              <option>Paint</option><option>Sanitary</option><option>Appliance</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Item description</label><input class="input" id="ni-item" placeholder="e.g. Study desk with drawers"></div>
        <div class="field-row">
          <div class="field"><label>Quantity</label><input class="input" id="ni-qty" type="number" value="1" min="0"></div>
          <div class="field"><label>Unit</label><input class="input" id="ni-unit" value="nos"></div>
        </div>
        <div class="field"><label>Rate (₹)</label><input class="input" id="ni-rate" type="number" value="10000" min="0"></div>
        <button class="btn btn-primary btn-block" id="ni-save">Add to Docket</button>
      </div>
    `);
    document.querySelector('#ni-save').addEventListener('click', () => {
      const item = (document.querySelector('#ni-item').value || '').trim();
      if (!item) { window.PlanexUI.toast('Please enter an item description.'); return; }
      window.PlanexStore.state.boq.push({
        id: 'b-' + Date.now(),
        room: document.querySelector('#ni-room').value,
        category: document.querySelector('#ni-cat').value,
        item,
        qty: Math.max(0, Number(document.querySelector('#ni-qty').value) || 0),
        unit: (document.querySelector('#ni-unit').value || 'nos').trim(),
        rate: Math.max(0, Number(document.querySelector('#ni-rate').value) || 0)
      });
      window.PlanexStore.commit();
      window.PlanexUI.closeModal();
      window.PlanexApp.renderView();
      window.PlanexUI.toast('Item added to design docket.');
    });
  }

  async function buildScope() {
    if (!window.PlanexAIClient || !window.PlanexAIClient.isEnabled()) {
      window.PlanexUI.toast('Scope building needs the hosted assistant (set workerUrl in config).');
      return;
    }
    const uploads = store().state.uploads || [];
    const plans = uploads.filter((u) => u.kind === 'plan');
    const plan = plans.length ? plans[plans.length - 1] : null;

    const btn = document.querySelector('#scope-build') || document.querySelector('#scope-rebuild');
    const prev = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Building scope…'; }

    try {
      const res = await window.PlanexAIClient.buildScope({
        attachments: plan ? [plan] : [],
        state: store().getGroundingState()
      });
      if (res && res.scope && Array.isArray(res.scope.rooms) && res.scope.rooms.length) {
        store().setScope(res.scope);
        if (window.PlanexAIClient.audit) window.PlanexAIClient.audit('scope.build', { rooms: res.scope.rooms.length });
        window.PlanexUI.toast('Scope built for ' + res.scope.rooms.length + ' rooms.');
        window.PlanexApp.renderView();
        return;
      }
      window.PlanexUI.toast('Could not build a scope yet — upload a floor plan or add rooms first.');
    } catch (err) {
      const code = err && err.status ? err.status : 'network';
      window.PlanexUI.toast('Scope build failed (' + code + ').');
    }
    if (btn) { btn.disabled = false; btn.textContent = prev; }
  }

  return { render, buildScope };
})();
