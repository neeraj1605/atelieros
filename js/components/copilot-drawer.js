/* ============================================================
   Planex — Copilot
   Desktop: a persistent docked right rail (always visible).
   Mobile: a labelled FAB + overlay drawer.
   Hosts the PlanexAI chat in compact mode.
   ============================================================ */
window.PlanexCopilot = (function () {
  let fab = null;
  let drawer = null;
  let drawerBody = null;
  let backdrop = null;
  let rail = null;
  let railBody = null;
  let isOpen = false;      // mobile drawer state
  let collapsed = false;   // desktop rail state

  function ic(n) { return window.PlanexIcons.get(n); }
  function isDesktop() {
    return !!(window.matchMedia && window.matchMedia('(min-width: 1101px)').matches);
  }

  function mount() {
    if (document.getElementById('copilot-rail')) return;

    // Mobile FAB
    fab = document.createElement('button');
    fab.id = 'copilot-fab';
    fab.className = 'copilot-fab';
    fab.title = 'Planex AI';
    fab.setAttribute('aria-label', 'Open Planex AI');
    fab.innerHTML = ic('sparkles') + '<span>Planex AI</span>';
    fab.addEventListener('click', open);
    document.body.appendChild(fab);

    // Mobile overlay drawer
    backdrop = document.createElement('div');
    backdrop.id = 'copilot-backdrop';
    backdrop.className = 'copilot-backdrop';
    backdrop.addEventListener('click', close);
    document.body.appendChild(backdrop);

    drawer = document.createElement('aside');
    drawer.id = 'copilot-drawer';
    drawer.className = 'copilot-drawer';
    drawer.innerHTML = headHtml('copilot-close-d') + '<div class="copilot-body" id="copilot-drawer-body"></div>';
    document.body.appendChild(drawer);
    drawerBody = drawer.querySelector('#copilot-drawer-body');
    drawer.querySelector('#copilot-close-d').addEventListener('click', close);

    // Desktop docked rail
    rail = document.createElement('aside');
    rail.id = 'copilot-rail';
    rail.className = 'copilot-rail';
    rail.innerHTML = headHtml('copilot-collapse', true) + '<div class="copilot-body" id="copilot-rail-body"></div>';
    const shell = document.querySelector('.app-shell') || document.body;
    shell.appendChild(rail);
    railBody = rail.querySelector('#copilot-rail-body');
    rail.querySelector('#copilot-collapse').addEventListener('click', collapse);
    const dockBtn = rail.querySelector('#copilot-dock');
    if (dockBtn) dockBtn.addEventListener('click', function () {
      const order = ['right', 'left', 'float'];
      const cur = (window.PlanexStore.state.ui && window.PlanexStore.state.ui.dock) || 'right';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      window.PlanexStore.setUI({ dock: next });
      applyDock();
      window.PlanexUI.toast('Panel: ' + next);
    });
    applyDock();

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) close();
    });

    window.addEventListener('resize', function () {
      // Re-home the chat if the device class changed.
      if (!isDesktop() && rail) rail.classList.remove('collapsed');
      ensureRendered();
    });

    // Desktop: render immediately and hide the FAB.
    if (isDesktop()) {
      ensureRendered();
      if (fab) fab.style.display = 'none';
    }
  }

  function headHtml(closeId, withDock) {
    return `
      <div class="copilot-head">
        <div class="copilot-title">${ic('sparkles')}
          <span>Planex AI</span>
          <span class="copilot-tag">Interior Expert</span>
        </div>
        <div style="display:flex;gap:4px;">
          ${withDock ? `<button class="icon-btn" id="copilot-dock" title="Move panel">${ic('move')}</button>` : ''}
          <button class="icon-btn" id="${closeId}" title="Close">${ic('collapse')}</button>
        </div>
      </div>`;
  }

  function applyDock() {
    if (!rail) return;
    const dock = (window.PlanexStore.state.ui && window.PlanexStore.state.ui.dock) || 'right';
    rail.classList.toggle('dock-left', dock === 'left');
    rail.classList.toggle('dock-float', dock === 'float');
  }

  function target() {
    return isDesktop() ? railBody : drawerBody;
  }

  function ensureRendered() {
    const t = target();
    if (!t || t.__rendered) return;
    const M = window.PlanexModules;
    if (M && M.PlanexAI && M.PlanexAI.renderIn) {
      M.PlanexAI.renderIn(t, { compact: true });
      t.__rendered = true;
    }
  }

  function focusInput() {
    const t = target();
    const inp = t && t.querySelector('#composer-input');
    if (inp) setTimeout(function () { inp.focus(); }, 260);
  }

  function open() {
    if (isDesktop()) {
      collapsed = false;
      rail.classList.remove('collapsed');
      if (fab) fab.style.display = 'none';
      ensureRendered();
      focusInput();
      return;
    }
    ensureRendered();
    isOpen = true;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    if (fab) fab.style.display = 'none';
    focusInput();
  }

  function close() {
    isOpen = false;
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (fab) fab.style.display = '';
  }

  function collapse() {
    collapsed = true;
    rail.classList.add('collapsed');
    if (fab) fab.style.display = '';
  }

  function toggle() { if (isDesktop()) { collapsed ? open() : collapse(); } else { isOpen ? close() : open(); } }

  return {
    mount: mount,
    open: open,
    close: close,
    toggle: toggle,
    isOpen: function () { return isOpen; }
  };
})();
