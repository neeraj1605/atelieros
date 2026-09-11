/* ============================================================
   Planex — How it works
   First-run (and revisitable) introduction: make the journey look easy,
   then choose how much support you want (plans A / B / C).
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.HowItWorks = (function () {
  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  const PLANS = [
    { id: 'ai', name: 'Do it myself with AI', tag: 'Plan A · AI-assisted', desc: 'You design and build with Planex AI at every step. Full drawings, BOQ and blueprint — you execute.' },
    { id: 'remote', name: 'AI with a remote expert', tag: 'Plan B · Remote support', desc: 'Same AI journey, plus a remote interior expert available to review your design, scope and drawings.' },
    { id: 'onground', name: 'AI with someone on site', tag: 'Plan C · On-ground support', desc: 'Same AI journey, plus on-ground support for site visits, checks and coordination.' }
  ];

  function render(container) {
    const S = store().state;
    const current = (S.project && S.project.plan) || 'ai';
    const seen = !!(S.ui && S.ui.seenHowItWorks);

    container.innerHTML = `
      <div class="view-inner hiw">
        <div class="hiw-hero anim">
          <div class="hero-mesh"></div>
          <div style="position:relative;">
            <div class="hero-eyebrow">${ic('sparkles')} Interiors, made easy</div>
            <h1 class="hero-title" style="margin-top:12px;">Design it. Cost it. Build it.</h1>
            <p class="hero-sub">You don't need to be an expert. You bring your home — Planex AI brings 20 years of interiors, drawings and a priced plan you can actually build.</p>
            <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
              <button class="btn btn-lg" id="hiw-start" style="background:#fff;color:#18181b;">${seen ? 'Continue to Design' : 'Start with your floor plan'} ${ic('arrowRight')}</button>
              ${seen ? '' : '<span class="badge badge-neutral" style="align-self:center;background:rgba(255,255,255,.15);color:#fff;border:0;">No commitment · Change anytime</span>'}
            </div>
          </div>
        </div>

        <div class="section-label anim anim-1">Three simple steps</div>
        <div class="hiw-steps anim anim-1">
          <div class="hiw-step">
            <div class="hiw-num">1</div>
            <div class="hiw-step-title">Design it</div>
            <p class="muted text-sm">Add your floor plan, define each space and see the look — palette, materials and drawings.</p>
            <span class="badge badge-info">AI design</span>
          </div>
          <div class="hiw-step">
            <div class="hiw-num">2</div>
            <div class="hiw-step-title">Cost it</div>
            <p class="muted text-sm">Get what's included, a firm BOQ, and quotes from suppliers — compared like for like.</p>
            <span class="badge badge-info">AI-assisted procurement</span>
          </div>
          <div class="hiw-step">
            <div class="hiw-num">3</div>
            <div class="hiw-step-title">Build it</div>
            <p class="muted text-sm">A blueprint your site team can follow, with a schedule, quality checks and a snag list.</p>
            <span class="badge badge-info">AI blueprint</span>
          </div>
        </div>

        <div class="section-label anim anim-2">How much support do you want?</div>
        <div class="hiw-plans anim anim-2">
          ${PLANS.map(function (p) {
            return `<button class="hiw-plan ${p.id === current ? 'active' : ''}" data-plan="${p.id}">
              <span class="faint text-xs">${esc(p.tag)}</span>
              <span class="hiw-plan-name">${esc(p.name)}</span>
              <span class="muted text-sm">${esc(p.desc)}</span>
            </button>`;
          }).join('')}
        </div>
        <p class="muted text-sm anim anim-2" style="margin-top:10px;">You can change this anytime. Nothing is committed until you approve.</p>
      </div>
    `;

    bind(container);
  }

  function bind(container) {
    container.querySelectorAll('[data-plan]').forEach(function (b) {
      b.addEventListener('click', function () {
        store().setServicePlan(b.getAttribute('data-plan'));
        window.PlanexApp.renderView();
      });
    });
    const start = container.querySelector('#hiw-start');
    if (start) start.addEventListener('click', function () {
      store().markHowItWorksSeen();
      window.PlanexApp.navigate('design');
      if (!store().state.floorplan) window.PlanexUI.toast('Start by adding your floor plan in Design.');
    });
  }

  return { render: render };
})();
