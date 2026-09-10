/* ============================================================
   Planex AI — App Bootstrap
   Icons, UI helpers, router and chrome.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- Icons ---------------- */
  const ICONS = {
    sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
    chat: '<path d="M21 12c0 4.4-4 8-9 8a9.6 9.6 0 01-4.3-.9L3 20l1.4-4.3A7.6 7.6 0 013 12c0-4.4 4-8 9-8s9 3.6 9 8z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
    docket: '<path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7z"/><path d="M14 2v5h5"/><path d="M9 12h6M9 16h6"/>',
    rupee: '<path d="M6 3h12M6 8h12M6 13h5a5 5 0 000-10"/><path d="M6 13l7 8"/>',
    build: '<path d="M3 21h18"/><path d="M5 21V9l7-6 7 6v12"/><path d="M9 21v-6h6v6"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3"/><path d="M13 21v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5"/>',
    user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
    plan: '<path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/><path d="M15 15h3v3"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    print: '<path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>',
    download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    ruler: '<path d="M3 17l14-14 4 4-14 14z"/><path d="M7 11l2 2M10 8l2 2M13 5l2 2"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    wand: '<path d="M15 4V2M15 10V8M11 6H9M21 6h-2M18.5 3.5l-1.4 1.4M18.5 8.5l-1.4-1.4M11.5 3.5l1.4 1.4"/><path d="M3 21l9.5-9.5"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    collapse: '<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>'
  };

  window.PlanexIcons = {
    get: function (name) {
      const body = ICONS[name] || ICONS.sparkles;
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
    }
  };

  /* ---------------- UI helpers ---------------- */
  let modalEl = null;

  window.PlanexUI = {
    toast: function (msg) {
      const stack = document.getElementById('toast-stack');
      if (!stack) return;
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = window.PlanexIcons.get('check') + '<span>' + String(msg).replace(/</g, '&lt;') + '</span>';
      stack.appendChild(el);
      setTimeout(function () {
        el.classList.add('out');
        setTimeout(function () { el.remove(); }, 260);
      }, 3200);
    },

    modal: function (title, bodyHtml) {
      this.closeModal();
      modalEl = document.createElement('div');
      modalEl.className = 'modal-backdrop';
      modalEl.innerHTML =
        '<div class="modal-dialog" role="dialog" aria-modal="true">' +
          '<div class="modal-head">' +
            '<div class="modal-title">' + title + '</div>' +
            '<button class="modal-close" aria-label="Close">&times;</button>' +
          '</div>' +
          '<div class="modal-body">' + bodyHtml + '</div>' +
        '</div>';
      document.body.appendChild(modalEl);
      modalEl.addEventListener('click', function (e) {
        if (e.target === modalEl) window.PlanexUI.closeModal();
      });
      modalEl.querySelector('.modal-close').addEventListener('click', function () {
        window.PlanexUI.closeModal();
      });
    },

    closeModal: function () {
      if (modalEl) { modalEl.remove(); modalEl = null; }
    },

    lightbox: function (src) {
      const lb = document.getElementById('lightbox');
      const img = document.getElementById('lightbox-img');
      if (!lb || !img) return;
      img.src = src;
      lb.classList.add('open');
    }
  };

  /* ---------------- App ---------------- */
  const NAV = [
    { view: 'dashboard', label: 'Dashboard', icon: 'home', step: '' },
    { view: 'ai', label: 'Planex AI', icon: 'sparkles', step: '1' },
    { view: 'docket', label: 'Design Docket', icon: 'docket', step: '2' },
    { view: 'quotation', label: 'Quotation', icon: 'rupee', step: '3' },
    { view: 'execution', label: 'Execution', icon: 'build', step: '4' }
  ];

  const LABELS = { dashboard: 'Dashboard', ai: 'Planex AI', docket: 'Design Docket', quotation: 'Quotation', execution: 'Execution Dockets' };

  function moduleFor(view) {
    const M = window.PlanexModules;
    switch (view) {
      case 'ai': return M.PlanexAI;
      case 'docket': return M.DesignDocket;
      case 'quotation': return M.Quotation;
      case 'execution': return M.Execution;
      default: return M.Dashboard;
    }
  }

  function renderView() {
    const view = window.PlanexStore.state.activeView;
    const el = document.getElementById('app-view');
    if (!el) return;
    el.innerHTML = '';
    const mod = moduleFor(view);
    if (mod && mod.render) mod.render(el);
    el.scrollTop = 0;
    window.scrollTo({ top: 0 });
    updateChrome();
  }

  function navigate(view) {
    window.PlanexStore.setView(view);
    location.hash = view;
    renderView();
    closeSidebar();
  }

  function updateChrome() {
    const S = window.PlanexStore.state;
    const ic = window.PlanexIcons.get;

    // crumb
    const crumb = document.getElementById('crumb-current');
    if (crumb) crumb.textContent = LABELS[S.activeView] || 'Dashboard';

    // sidebar nav
    const nav = document.getElementById('sidebar-nav');
    if (nav) {
      nav.innerHTML = NAV.map(function (item) {
        const active = item.view === S.activeView ? 'active' : '';
        return '<button class="nav-link ' + active + '" data-nav="' + item.view + '">' +
          ic(item.icon) + '<span>' + item.label + '</span>' +
          (item.step ? '<span class="nav-step">' + item.step + '</span>' : '') +
          '</button>';
      }).join('');
    }

    // bottom nav
    const bn = document.getElementById('bottom-nav');
    if (bn) {
      bn.innerHTML = '<div class="bottom-nav-inner">' + NAV.map(function (item) {
        const active = item.view === S.activeView ? 'active' : '';
        return '<button class="bn-item ' + active + '" data-nav="' + item.view + '">' +
          ic(item.icon) + '<span>' + item.label.split(' ')[0] + '</span></button>';
      }).join('') + '</div>';
    }

    // project status card
    const pn = document.getElementById('psc-project-name');
    if (pn) pn.textContent = S.project.name;
    const stageOrder = ['ideate', 'docket', 'quotation', 'execution'];
    let stageIdx = stageOrder.indexOf(S.project.stage === 'plan' ? 'docket' : S.project.stage);
    if (S.selectedVendorId) stageIdx = Math.max(stageIdx, 2);
    if (S.timeline.some(function (p) { return p.progress > 0; })) stageIdx = 3;
    if (stageIdx < 0) stageIdx = 0;
    const stageLabels = ['Ideate', 'Design Docket', 'Quotation', 'Execution'];
    const sl = document.getElementById('psc-stage-label');
    if (sl) sl.textContent = stageLabels[stageIdx];
    const ss = document.getElementById('psc-stage-step');
    if (ss) ss.textContent = (stageIdx + 1) + ' / 4';
    const bar = document.getElementById('psc-bar-fill');
    if (bar) bar.style.width = ((stageIdx + 1) / 4 * 100) + '%';

    // delegate nav clicks
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      if (el.__navBound) return;
      el.__navBound = true;
      el.addEventListener('click', function () { navigate(el.getAttribute('data-nav')); });
    });
  }

  /* ---------------- Theme ---------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#09090b' : '#fafafa');
  }

  /* ---------------- Sidebar (mobile) ---------------- */
  function openSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    if (sb) sb.classList.add('open');
    if (ov) ov.classList.add('open');
  }
  function closeSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    if (sb) sb.classList.remove('open');
    if (ov) ov.classList.remove('open');
  }

  /* ---------------- Init ---------------- */
  function init() {
    const store = window.PlanexStore;
    const S = store.state;

    // theme
    applyTheme(S.theme);

    // restore view from hash
    const hash = (location.hash || '').replace('#', '');
    if (hash && LABELS[hash]) S.activeView = hash;

    // overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeSidebar);

    // menu toggle
    const menu = document.getElementById('menu-toggle');
    if (menu) menu.addEventListener('click', openSidebar);

    // theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      const next = store.state.theme === 'dark' ? 'light' : 'dark';
      store.setTheme(next);
      applyTheme(next);
      renderView();
    });

    // currency
    const cur = document.getElementById('currency-select');
    if (cur) {
      cur.value = S.currency;
      cur.addEventListener('change', function () {
        store.setCurrency(cur.value);
        renderView();
        window.PlanexUI.toast('Currency changed to ' + cur.value);
      });
    }

    // reset
    const reset = document.getElementById('reset-demo');
    if (reset) reset.addEventListener('click', function () {
      if (confirm('Reset the demo project back to its starting state?')) {
        store.reset();
        applyTheme(store.state.theme);
        const c = document.getElementById('currency-select');
        if (c) c.value = store.state.currency;
        renderView();
        window.PlanexUI.toast('Project reset to demo state.');
      }
    });

    // lightbox
    const lbClose = document.getElementById('lightbox-close');
    const lb = document.getElementById('lightbox');
    if (lbClose) lbClose.addEventListener('click', function () { lb.classList.remove('open'); });
    if (lb) lb.addEventListener('click', function (e) { if (e.target === lb) lb.classList.remove('open'); });

    // keyboard: escape closes modal/lightbox
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { window.PlanexUI.closeModal(); if (lb) lb.classList.remove('open'); }
    });

    // chrome updates on state change
    store.subscribe(updateChrome);

    // hash navigation
    window.addEventListener('hashchange', function () {
      const v = (location.hash || '').replace('#', '');
      if (LABELS[v] && v !== store.state.activeView) {
        store.state.activeView = v;
        renderView();
      }
    });

    renderView();
  }

  window.PlanexApp = {
    navigate: navigate,
    renderView: renderView,
    updateChrome: updateChrome
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
