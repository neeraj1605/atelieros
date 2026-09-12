/* ============================================================
   Planex AI — App Bootstrap
   Icons, UI helpers, router and chrome.
   ============================================================ */
(function () {
  'use strict';

  function escAttr(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

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
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    move: '<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>',
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

    // Inline confirmation dialog (replaces window.confirm). Resolves true/false.
    confirm: function (message, opts) {
      return new Promise(function (resolve) {
        window.PlanexUI.modal((opts && opts.title) || 'Please confirm', `
          <p style="margin-bottom:18px;">${String(message).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>
          <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button class="btn btn-secondary" id="pf-no">Cancel</button>
            <button class="btn ${opts && opts.danger ? 'btn-danger' : 'btn-primary'}" id="pf-yes">${escAttr((opts && opts.confirmLabel) || 'Confirm')}</button>
          </div>
        `);
        document.querySelector('#pf-yes').addEventListener('click', function () {
          window.PlanexUI.closeModal(); resolve(true);
        });
        document.querySelector('#pf-no').addEventListener('click', function () {
          window.PlanexUI.closeModal(); resolve(false);
        });
      });
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
    { view: 'home', label: 'Home', icon: 'home', step: '' },
    { view: 'design', label: 'Design', icon: 'sparkles', step: '1' },
    { view: 'procurement', label: 'Procurement', icon: 'rupee', step: '2' },
    { view: 'execution', label: 'Execution', icon: 'build', step: '3' }
  ];

  const LABELS = {
    home: 'Home', dashboard: 'Home', how: 'How it works', design: 'Design', procurement: 'Procurement',
    execution: 'Execution', project: 'Project', spaces: 'Spaces', scope: 'Scope of Work',
    sheets: 'Scope Sheets', moodboard: 'Moodboard', docket: 'Design Dockets', costing: 'Costing & BOQ', quotation: 'Buy'
  };

  function moduleFor(view) {
    const M = window.PlanexModules;
    switch (view) {
      case 'home': return M.Home;
      case 'how': return M.HowItWorks;
      case 'design': return M.Design;
      case 'procurement': return M.Procurement;
      case 'project': return M.Project;
      case 'spaces': return M.Spaces;
      case 'scope': return M.Scope;
      case 'sheets': return M.ScopeSheets;
      case 'moodboard': return M.Moodboard;
      case 'ai': return M.PlanexAI;
      case 'docket': return M.DesignDocket;
      case 'costing': return M.Costing;
      case 'quotation': return M.Quotation;
      case 'execution': return M.Execution;
      default: return M.Dashboard;
    }
  }

  const VIEW_TO_UI = {
    dashboard: { act: 'design', designSub: 'spaces' },
    project: { act: 'design', designSub: 'spaces' },
    spaces: { act: 'design', designSub: 'spaces' },
    moodboard: { act: 'design', designSub: 'moodboard' },
    docket: { act: 'design', designSub: 'docket' },
    scope: { act: 'procurement', procurementSub: 'scope' },
    sheets: { act: 'procurement', procurementSub: 'sheets' },
    costing: { act: 'procurement', procurementSub: 'costing' },
    quotation: { act: 'procurement', procurementSub: 'quotation' },
    execution: { act: 'execution' },
    design: { act: 'design' },
    procurement: { act: 'procurement' }
  };

  function renderView() {
    const S = window.PlanexStore.state;
    const el = document.getElementById('app-view');
    if (!el) return;
    el.innerHTML = '';
    const M = window.PlanexModules;
    const seen = !!(S.ui && S.ui.seenHowItWorks);
    const entered = !!(S.ui && S.ui.enteredApp);
    const showHome = !entered || S.activeView === 'home';
    document.body.classList.toggle('landing', showHome);
    document.documentElement.classList.remove('landing-pre');

    if (showHome && M.Home) {
      M.Home.render(el);
    } else if (!seen) {
      M.HowItWorks.render(el);
    } else if (S.ui && S.ui.view === 'workspace') {
      const act = S.ui.act || 'design';
      const bar = document.createElement('div');
      bar.className = 'workspace-bar';
      bar.innerHTML =
        '<div class="wb-left">' + window.PlanexIcons.get('docket') + '<strong>Workspace</strong></div>' +
        '<button class="btn btn-primary btn-sm wb-back" id="wb-back">← Back to Planex Copilot</button>';
      el.appendChild(bar);
      const body = document.createElement('div');
      el.appendChild(body);
      const mod = act === 'procurement' ? M.Procurement : act === 'execution' ? M.Execution : M.Design;
      if (mod && mod.render) mod.render(body);
      const back = bar.querySelector('#wb-back');
      if (back) back.addEventListener('click', function () {
        window.PlanexStore.setUI({ view: 'copilot' });
        renderView();
      });
    } else {
      M.PlanexAI.render(el);
    }

    el.scrollTop = 0;
    window.scrollTo({ top: 0 });
    updateChrome();
    if (M.PlanexAI && M.PlanexAI.refreshChips) M.PlanexAI.refreshChips();
  }

  function navigate(view) {
    const S = window.PlanexStore.state;
    if (view === 'home') {
      window.PlanexStore.setUI({ enteredApp: false });
      window.PlanexStore.setView('home');
      location.hash = 'home';
      renderView();
      closeSidebar();
      return;
    }
    if (view === 'ai') { window.PlanexStore.setUI({ view: 'copilot', enteredApp: true }); renderView(); return; }
    if (VIEW_TO_UI[view]) {
      const patch = Object.assign({ view: 'workspace', enteredApp: true }, VIEW_TO_UI[view]);
      window.PlanexStore.setUI(patch);
      S.activeView = view;
      location.hash = view;
      renderView();
      closeSidebar();
      return;
    }
    window.PlanexStore.setUI({ enteredApp: true });
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

    // left journey rail
    const nav = document.getElementById('sidebar-nav');
    if (nav && window.PlanexJourneyRail) window.PlanexJourneyRail.render(nav);

    // topbar plan badge
    const pb = document.getElementById('plan-badge');
    if (pb) {
      const plan = (S.project && S.project.plan) || 'ai';
      pb.textContent = plan === 'remote' ? 'Plan B · AI + Remote' : plan === 'onground' ? 'Plan C · On-ground' : 'Plan A · AI-assisted';
    }
    // surface switch (Planex Copilot / Workspace)
    const swEl = document.getElementById('surface-switch');
    if (swEl) {
      const view = (S.ui && S.ui.view) || 'copilot';
      swEl.querySelectorAll('[data-surface]').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-surface') === view);
        if (!b.__bound) {
          b.__bound = true;
          b.addEventListener('click', function () {
            const target = b.getAttribute('data-surface');
            window.PlanexStore.setUI({ view: target });
            renderView();
            window.PlanexUI.toast(target === 'workspace' ? 'Workspace' : 'Planex Copilot');
          });
        }
      });
    }
    // journey progress line
    const jf = document.getElementById('journey-line-fill');
    if (jf && window.PlanexJourneyRail) {
      const p = window.PlanexJourneyRail.progress(S);
      jf.style.width = Math.round((p.design + p.procurement + p.execution) / 3) + '%';
    }
    // live artifact rail
    const ar = document.getElementById('artifact-rail');
    if (ar && window.PlanexArtifactRail) window.PlanexArtifactRail.render(ar);

    // AI-centric: collapse the left rail on demand
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.toggle('no-rail', !!(S.ui && S.ui.leftRailCollapsed));

    // bottom nav (acts)
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
    let stageIdx = 0;
    if (S.floorplan && S.floorplan.validated) stageIdx = 1;
    if (S.scopeDoc) stageIdx = 2;
    if (S.selectedVendorId) stageIdx = 4;
    if (S.timeline.some(function (p) { return p.progress > 0; })) stageIdx = 5;
    const stageLabels = ['Project', 'Scope', 'Planex AI', 'Design Docket', 'Quotation', 'Execution'];
    const sl = document.getElementById('psc-stage-label');
    if (sl) sl.textContent = stageLabels[stageIdx];
    const ss = document.getElementById('psc-stage-step');
    if (ss) ss.textContent = (stageIdx + 1) + ' / 6';
    const bar = document.getElementById('psc-bar-fill');
    if (bar) bar.style.width = ((stageIdx + 1) / 6 * 100) + '%';

    // Space switcher
    const sw = document.getElementById('space-switcher');
    if (sw) {
      const rooms = window.PlanexStore.state.rooms || [];
      const cur = window.PlanexStore.state.activeSpaceId || 'all';
      const opts = ['<option value="all">All spaces</option>'].concat(
        rooms.map(function (r) {
          const on = r.id === cur ? ' selected' : '';
          return '<option value="' + r.id + '"' + on + '>' + String(r.name).replace(/</g, '&lt;') + '</option>';
        })
      ).join('');
      sw.innerHTML = opts;
      if (!sw.__bound) {
        sw.__bound = true;
        sw.addEventListener('change', function () {
          window.PlanexStore.setActiveSpace(sw.value);
          renderView();
        });
      }
    }

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
    applyTheme(S.uiTheme || 'light');

    // restore view from hash (deep-link straight into the right surface)
    const hash = (location.hash || '').replace('#', '');
    if (hash && LABELS[hash]) {
      S.activeView = hash;
      S.ui = Object.assign({
        dock: 'right', collapsed: false, act: 'design', designSub: 'spaces',
        procurementSub: 'scope', seenHowItWorks: false, enteredApp: (hash !== 'home')
      }, S.ui, { enteredApp: hash !== 'home' });
      if (VIEW_TO_UI[hash]) {
        S.ui = Object.assign(S.ui, { view: 'workspace' }, VIEW_TO_UI[hash]);
      }
    }
    // First run: land on the public homepage.
    if (!(S.ui && S.ui.enteredApp) && !hash) S.activeView = 'home';

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
      const next = store.state.uiTheme === 'dark' ? 'light' : 'dark';
      store.setUITheme(next);
      applyTheme(next);
      renderView();
    });

    // workspace / copilot surface toggle
    const wt = document.getElementById('workspace-toggle');
    if (wt) wt.addEventListener('click', function () {
      const cur = (store.state.ui && store.state.ui.view) || 'copilot';
      store.setUI({ view: cur === 'workspace' ? 'copilot' : 'workspace' });
      renderView();
    });

    // collapse the left rail to give the AI more room
    const railToggle = document.getElementById('rail-toggle');
    if (railToggle) railToggle.addEventListener('click', function () {
      const cur = !!(store.state.ui && store.state.ui.leftRailCollapsed);
      store.setUI({ leftRailCollapsed: !cur });
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
    if (reset) reset.addEventListener('click', async function () {
      const ok = await window.PlanexUI.confirm('Reset the demo project back to its starting state?', { title: 'Reset project', danger: true });
      if (ok) {
        store.reset();
        applyTheme(store.state.uiTheme || 'light');
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

    // keyboard: 1 = Planex Copilot, 2 = Workspace
    document.addEventListener('keydown', function (e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (document.querySelector('.modal-backdrop')) return;
      if (e.key === '1') { store.setUI({ view: 'copilot' }); renderView(); }
      if (e.key === '2') { store.setUI({ view: 'workspace' }); renderView(); }
    });

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
        if (v === 'home') {
          window.PlanexStore.setUI({ enteredApp: false });
        } else {
          window.PlanexStore.setUI(Object.assign({ enteredApp: true }, VIEW_TO_UI[v] ? { view: 'workspace' } : {}, VIEW_TO_UI[v] || {}));
        }
        renderView();
      }
    });

    renderView();

    // Ambient Copilot drawer (available on every screen)
    if (window.PlanexCopilot) window.PlanexCopilot.mount();
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
