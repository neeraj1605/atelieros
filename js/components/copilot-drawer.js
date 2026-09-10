/* ============================================================
   Planex — Copilot Drawer
   The assistant is ambient: a floating button + right-side drawer,
   available on every screen. Hosts the PlanexAI chat in compact mode.
   ============================================================ */
window.PlanexCopilot = (function () {
  let fab = null;
  let drawer = null;
  let bodyEl = null;
  let backdrop = null;
  let isOpen = false;
  let rendered = false;

  function ic(n) { return window.PlanexIcons.get(n); }

  function mount() {
    if (document.getElementById('copilot-fab')) return;

    fab = document.createElement('button');
    fab.id = 'copilot-fab';
    fab.className = 'copilot-fab';
    fab.title = 'Planex Copilot';
    fab.setAttribute('aria-label', 'Open Planex Copilot');
    fab.innerHTML = ic('sparkles');
    fab.addEventListener('click', toggle);
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
        <div class="copilot-title">${ic('sparkles')} <span>Copilot</span></div>
        <button class="icon-btn" id="copilot-close" title="Close">${ic('collapse')}</button>
      </div>
      <div class="copilot-body" id="copilot-body"></div>
    `;
    document.body.appendChild(drawer);
    bodyEl = drawer.querySelector('#copilot-body');
    drawer.querySelector('#copilot-close').addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  function ensureRendered() {
    if (rendered || !bodyEl) return;
    const M = window.PlanexModules;
    if (M && M.PlanexAI && M.PlanexAI.renderIn) {
      M.PlanexAI.renderIn(bodyEl, { compact: true });
      rendered = true;
    }
  }

  function open() {
    ensureRendered();
    isOpen = true;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    if (fab) fab.style.display = 'none';
    const inp = bodyEl && bodyEl.querySelector('#composer-input');
    if (inp) setTimeout(function () { inp.focus(); }, 260);
  }

  function close() {
    isOpen = false;
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (fab) fab.style.display = '';
  }

  function toggle() { if (isOpen) close(); else open(); }

  return { mount: mount, open: open, close: close, toggle: toggle, isOpen: function () { return isOpen; } };
})();
