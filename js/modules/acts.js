/* ============================================================
   Planex — Acts
   Three acts (Design · Procurement · Execution) with sub-navigation.
   Keeps the whole product in three places instead of nine tabs.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

(function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  const PLAN_LABEL = { ai: 'AI-assisted', remote: 'AI + Remote expert', onground: 'AI + On-ground support' };

  function actShell(title, subtitle, subs, activeKey, subKey) {
    const S = store().state;
    const plan = (S.project && S.project.plan) || 'ai';
    return `
      <div class="view-inner">
        <div class="act-head anim">
          <div>
            <div class="act-title-row">
              <h1 class="serif" style="margin:0;">${esc(title)}</h1>
              <span class="badge badge-gold">${esc(PLAN_LABEL[plan] || 'AI-assisted')}</span>
            </div>
            <p class="act-sub">${esc(subtitle)}</p>
          </div>
        </div>
        <div class="act-subnav anim">
          ${subs.map(function (s) {
            return '<button class="chip-toggle ' + (s.k === activeKey ? 'active' : '') + '" data-sub="' + s.k + '">' + esc(s.label) + '</button>';
          }).join('')}
        </div>
        <div id="act-body"></div>
      </div>`;
  }

  function mountSub(container, subs, activeKey, subKey) {
    const active = subs.filter(function (s) { return s.k === activeKey; })[0] || subs[0];
    const body = container.querySelector('#act-body');
    const mod = window.PlanexModules[active.mod];
    if (mod && mod.render) mod.render(body);
    container.querySelectorAll('[data-sub]').forEach(function (b) {
      b.addEventListener('click', function () {
        const patch = {}; patch[subKey] = b.getAttribute('data-sub');
        store().setUI(patch);
        window.PlanexApp.renderView();
      });
    });
  }

  const DESIGN_SUBS = [
    { k: 'spaces', label: 'Spaces', mod: 'Spaces' },
    { k: 'moodboard', label: 'Moodboard', mod: 'Moodboard' },
    { k: 'docket', label: 'Dockets', mod: 'DesignDocket' }
  ];
  const PROC_SUBS = [
    { k: 'scope', label: 'Scope', mod: 'Scope' },
    { k: 'costing', label: 'Costing', mod: 'Costing' },
    { k: 'quotation', label: 'Buy', mod: 'Quotation' }
  ];

  window.PlanexModules.Design = {
    render: function (container) {
      const S = store().state;
      const active = (S.ui && S.ui.designSub) || 'spaces';
      container.innerHTML = actShell('Design', 'Decide what each space looks like — and how it will be built.', DESIGN_SUBS, active, 'designSub');
      mountSub(container, DESIGN_SUBS, active, 'designSub');
    }
  };

  window.PlanexModules.Procurement = {
    render: function (container) {
      const S = store().state;
      const active = (S.ui && S.ui.procurementSub) || 'scope';
      container.innerHTML = actShell('Procurement', 'What work is included, what it costs, and who supplies it.', PROC_SUBS, active, 'procurementSub');
      mountSub(container, PROC_SUBS, active, 'procurementSub');
    }
  };
})();
