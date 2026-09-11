/* ============================================================
   Planex — Copilot
   The AI is the primary surface (rendered by app.js in the centre).
   Mobile keeps a labelled FAB + overlay drawer; desktop uses the centre.
   ============================================================ */
window.PlanexCopilot = (function () {
  let fab = null;
  let drawer = null;
  let drawerBody = null;
  let backdrop = null;
  let isOpen = false;

  function ic(n) { return window.PlanexIcons.get(n); }
  function isDesktop() {
    return !!(window.matchMedia && window.matchMedia('(min-width: 1101px)').matches);
  }

  function mount() {
    if (document.getElementById('copilot-fab')) return;

    fab = document.createElement('button');
    fab.id = 'copilot-fab';
    fab.className = 'copilot-fab';
    fab.title = 'Planex AI';
    fab.setAttribute('aria-label', 'Open Planex AI');
    fab.innerHTML = ic('sparkles') + '<span>Planex Copilot</span>';
    fab.addEventListener('click', open);
    document.body.appendChild(fab);

    backdrop = document.createElement('div');
    backdrop.id = 'copilot-backdrop';
    backdrop.className = 'copilot-backdrop';
    backdrop.addEventListener('click', close);
    document.body.appendChild(backdrop);

    drawer = document.createElement('aside');
    drawer.id = 'copilot-drawer';
    drawer.className = 'copilot-drawer';
    drawer.innerHTML = `
      <div class="copilot-head">
        <div class="copilot-title">${ic('sparkles')}<span>Planex Copilot</span><span class="copilot-tag">Interior Expert</span></div>
        <button class="icon-btn" id="copilot-close" title="Close">${ic('collapse')}</button>
      </div>
      <div class="copilot-body" id="copilot-drawer-body"></div>`;
    document.body.appendChild(drawer);
    drawerBody = drawer.querySelector('#copilot-drawer-body');
    drawer.querySelector('#copilot-close').addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) close();
    });

    if (isDesktop() && fab) fab.style.display = 'none';
  }

  function ensureRendered() {
    if (!drawerBody || drawerBody.__rendered) return;
    const M = window.PlanexModules;
    if (M && M.PlanexAI && M.PlanexAI.renderIn) {
      M.PlanexAI.renderIn(drawerBody, { compact: true });
      drawerBody.__rendered = true;
    }
  }

  function focusCenter() {
    const inp = document.querySelector('#app-view #composer-input');
    if (inp) setTimeout(function () { inp.focus(); }, 200);
  }

  function open() {
    if (isDesktop()) {
      window.PlanexStore.setUI({ view: 'copilot' });
      window.PlanexApp.renderView();
      focusCenter();
      return;
    }
    ensureRendered();
    isOpen = true;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    if (fab) fab.style.display = 'none';
    const inp = drawerBody && drawerBody.querySelector('#composer-input');
    if (inp) setTimeout(function () { inp.focus(); }, 260);
  }

  function close() {
    isOpen = false;
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (fab && !isDesktop()) fab.style.display = '';
  }

  function toggle() { isOpen ? close() : open(); }

  return { mount: mount, open: open, close: close, toggle: toggle, isOpen: function () { return isOpen; } };
})();
