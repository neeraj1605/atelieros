/* ============================================================
   Planex — Home (public homepage)
   Market-ready landing for three audiences: homeowners (B2C),
   businesses (B2B) and partner companies (connect directly).
   Plans are shown per segment; the product is one click away.
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.Home = (function () {
  let seg = 'b2c';

  function store() { return window.PlanexStore; }
  function ic(n) { return window.PlanexIcons.get(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  const SEGMENTS = [
    { id: 'b2c', label: 'For homeowners', short: 'Homeowners', icon: 'home' },
    { id: 'b2b', label: 'For business', short: 'Business', icon: 'build' },
    { id: 'partner', label: 'Partners', short: 'Partners', icon: 'sparkles' }
  ];

  const B2C_PLANS = [
    {
      id: 'essential', name: 'Essential', tag: 'AI-assisted', price: '₹4,999', unit: '/ project', servicePlan: 'ai',
      desc: 'Design, price and build with Planex AI beside you at every step.',
      features: ['Floor plan → spaces → moodboard', 'Room-wise scope of work', 'Firm BOQ priced in ₹', 'A-01–A-04 drawings & 13 trade dockets', 'Vendor-ready scope sheets', 'Change anytime'],
      cta: 'Start free'
    },
    {
      id: 'signature', name: 'Signature', tag: 'AI + remote expert', price: '₹24,999', unit: '/ project', popular: true, servicePlan: 'remote',
      desc: 'The AI journey plus a remote interior expert to review and sign off.',
      features: ['Everything in Essential', '1:1 video consult with an expert', 'Expert review of design & scope', 'Drawing set sign-off', 'Vendor quote comparison', '3 revision cycles'],
      cta: 'Choose Signature'
    },
    {
      id: 'bespoke', name: 'Bespoke', tag: 'AI + on-ground', price: 'Custom', unit: '', servicePlan: 'onground',
      desc: 'Hands-on delivery with on-ground support from survey to handover.',
      features: ['Everything in Signature', 'Site visits & measurements', 'Contractor coordination', 'Stage-wise QC & snag closure', 'Dedicated project manager', 'Handover documentation'],
      cta: 'Talk to us'
    }
  ];

  const B2B_PLANS = [
    {
      id: 'studio', name: 'Studio', tag: 'Independent designers', price: '₹49,999', unit: '/ year',
      desc: 'Win more work and cut drawing time with a full AI back office.',
      features: ['Up to 20 projects / year', 'Client-ready drawings & BOQ', 'White-label PDF exports', 'Scope sheets & RFQ packs', 'Priority AI capacity', 'Email support'],
      cta: 'Start Studio'
    },
    {
      id: 'firm', name: 'Firm', tag: 'Interior firms & contractors', price: '₹1,49,999', unit: '/ year', popular: true,
      desc: 'Standardise scope, price every job on the same basis and protect margin.',
      features: ['Up to 100 projects / year', 'Team seats & shared libraries', 'Procurement + vendor quotes', 'Spec-compliance checks', 'Branded templates', 'API access', 'Dedicated success manager'],
      cta: 'Start Firm'
    },
    {
      id: 'enterprise', name: 'Enterprise', tag: 'Developers, hospitality & retail', price: 'Custom', unit: '',
      desc: 'Roll out Planex across projects, teams and rate cards.',
      features: ['Unlimited projects', 'SSO & role controls', 'Custom rate cards & libraries', 'Multi-project dashboards', 'Onboarding & training', 'SLA & priority support'],
      cta: 'Talk to sales'
    }
  ];

  const B2C_VALUE = [
    { icon: 'plan', title: 'A real design, not a guess', desc: 'Your floor plan becomes room-wise spaces, layouts and an approved look — with drawings your team can build from.' },
    { icon: 'rupee', title: 'Know the cost before you build', desc: 'A GST-ready BOQ with makes, quantities and rates — so you compare quotes on the same basis.' },
    { icon: 'build', title: 'Build without surprises', desc: 'Trade dockets, vendor scope sheets, a programme and QC checks keep the site moving and snags closing.' }
  ];

  const B2B_VALUE = [
    { icon: 'sparkles', title: 'Quote in hours, not weeks', desc: 'Turn a plan into a priced proposal with drawings, scope and BOQ — consistently across every project.' },
    { icon: 'docket', title: 'Same basis, every vendor', desc: 'Scope sheets with inclusions, exclusions and measurement basis remove the assumptions that leak margin.' },
    { icon: 'check', title: 'Deliver predictably', desc: 'Dockets, procurement and execution tracking in one thread, with revision control you can defend.' }
  ];

  const PARTNER_TYPES = [
    { icon: 'build', title: 'Manufacturers & brands', desc: 'Get specced into plans, BOQs and scope sheets at the moment of design.' },
    { icon: 'docket', title: 'Contractors & vendors', desc: 'Receive RFQs on a fixed scope basis and quote faster, with fewer disputes.' },
    { icon: 'sparkles', title: 'Design studios & consultants', desc: 'Use Planex as your back office and scale your project pipeline.' },
    { icon: 'plan', title: 'Developers & proptech', desc: 'Standardise interiors across projects, towers and handover packages.' },
    { icon: 'rupee', title: 'Channel & franchise partners', desc: 'Build a Planex practice in your city with our tools and support.' },
    { icon: 'wand', title: 'Technology & AI partners', desc: 'Integrate via API for catalogs, pricing, rendering or ERP.' }
  ];

  const DELIVERABLES = [
    { icon: 'plan', title: 'Drawing set', desc: 'A-01 Main, A-02 Furniture, A-03 Ceiling, A-04 Lighting — with dimensions and title block.' },
    { icon: 'ruler', title: 'Scope of work', desc: 'Room-by-room, package-by-package: 22 work packages, nothing missed.' },
    { icon: 'rupee', title: 'Firm BOQ', desc: 'Quantities with makes and rates, GST-ready and editable.' },
    { icon: 'docket', title: 'Design dockets', desc: '13 trade dockets: joinery, kitchen, ceiling, lighting, electrical, plumbing and more.' },
    { icon: 'send', title: 'Scope sheets', desc: 'Vendor-facing RFQ documents with inclusions, exclusions and measurement basis.' },
    { icon: 'build', title: 'Execution pack', desc: 'Programme, QC checkpoints, snag list and handover checklist.' }
  ];

  const GUARANTEES = [
    { title: 'Spec-locked quotes', desc: 'Vendors quote against the same written scope — no silent swaps.' },
    { title: 'Revision control', desc: 'Every issued scope sheet is frozen with its plan revision and drawings.' },
    { title: 'No hidden cost', desc: 'Makes, quantities and rates are explicit in the BOQ, down to GST.' },
    { title: 'Your data, your plan', desc: 'Your drawings and documents stay yours, exportable at any time.' }
  ];

  const HOW = [
    { n: '1', title: 'Add your floor plan', desc: 'Upload a plan or image. Planex AI reads the rooms and areas; you confirm the dimensions.' },
    { n: '2', title: 'Design & specify', desc: 'Set the look for each space. Planex turns it into a scope, a BOQ and trade-wise dockets.' },
    { n: '3', title: 'Price & build', desc: 'Issue scope sheets, compare vendor quotes on one basis, then track execution to handover.' }
  ];

  const FAQ = [
    { q: 'How is Planex different from an interior designer or a marketplace?', a: 'Planex is the planning layer underneath both. It gives you the drawings, scope, BOQ and vendor-ready documents — so you can build with your own team, or hand the pack to a professional.' },
    { q: 'Do I need to be technical to use it?', a: 'No. You upload a plan and answer a few questions. Planex AI explains each step in plain language and shows the cost and scope as they evolve.' },
    { q: 'Are the prices final?', a: 'The BOQ gives you firm, editable indicative rates for your city and quality band. Vendor quotes then land against a fixed scope sheet, so comparison is like-for-like.' },
    { q: 'Can I use Planex for my business?', a: 'Yes. Studio, Firm and Enterprise plans add team seats, procurement, branded outputs and API access for designers, contractors and developers.' },
    { q: 'What does a partner company get?', a: 'Partners are specced into designs, BOQs and scope sheets, or integrate with Planex. There is no self-serve plan — we design the partnership with you directly.' },
    { q: 'Does it work across India?', a: 'Yes. Scope, rates and makes are built for Indian homes and the Indian market, with GST-ready documents and city-wise rate bands.' }
  ];

  /* ---------------- Actions ---------------- */
  function enterApp(target) {
    store().setUI({ enteredApp: true });
    const seen = !!(store().state.ui && store().state.ui.seenHowItWorks);
    window.PlanexApp.navigate(target || (seen ? 'design' : 'how'));
  }

  function scrollTo(id) {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function choosePlan(planList, plan) {
    if (seg === 'partner') { scrollTo('#partner'); return; }
    if (seg === 'b2c') {
      if (plan.servicePlan) store().setServicePlan(plan.servicePlan);
      store().addLead({ segment: 'b2c', plan: plan.id, planName: plan.name });
      window.PlanexUI.toast(plan.name + ' plan selected.');
      enterApp();
      return;
    }
    // B2B
    store().addLead({ segment: 'b2b', plan: plan.id, planName: plan.name });
    window.PlanexUI.toast(plan.name + ' selected — our team will help you get set up.');
    enterApp();
  }

  function submitPartner(container) {
    const val = function (id) { const el = container.querySelector(id); return el ? String(el.value || '').trim() : ''; };
    const lead = {
      segment: 'partner',
      company: val('#hp-company'),
      contactName: val('#hp-name'),
      email: val('#hp-email'),
      phone: val('#hp-phone'),
      city: val('#hp-city'),
      category: val('#hp-category'),
      volume: val('#hp-volume'),
      message: val('#hp-message')
    };
    if (!lead.company || !lead.contactName || !lead.email) {
      window.PlanexUI.toast('Please add company, name and email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      window.PlanexUI.toast('Please enter a valid email.');
      return;
    }
    const consent = container.querySelector('#hp-consent');
    if (consent && !consent.checked) { window.PlanexUI.toast('Please accept the contact consent.'); return; }
    const saved = store().addLead(lead);
    const box = container.querySelector('#hp-form-wrap');
    if (box) {
      box.innerHTML = `
        <div class="home-form-success">
          <div class="home-success-ico">${ic('check')}</div>
          <h3>Thank you — we have your details.</h3>
          <p class="muted">Our partnerships team will reach out to <strong>${esc(lead.email)}</strong> within one working day.</p>
          <p class="faint text-xs">Reference: ${esc(saved.id)}</p>
          <a class="btn btn-secondary" href="mailto:partners@planex.ai?subject=${encodeURIComponent('Partnership enquiry — ' + lead.company)}">Email us directly</a>
        </div>`;
    }
    window.PlanexUI.toast('Enquiry received. We will be in touch.');
  }

  /* ---------------- Sections ---------------- */
  function header() {
    return `
      <header class="home-nav" id="home-top">
        <div class="home-nav-inner">
          <button class="home-brand" data-enter="1">
            <span class="brand-mark">${ic('home')}</span>
            <span class="brand-text"><span class="brand-name">Planex AI</span><span class="brand-tag">Plan &amp; Execute</span></span>
          </button>
          <nav class="home-links">
            <button data-seg="b2c">Homeowners</button>
            <button data-seg="b2b">Business</button>
            <button data-seg="partner">Partners</button>
            <button data-scroll="#how">How it works</button>
            <button data-scroll="#plans">Pricing</button>
          </nav>
          <div class="home-nav-actions">
            <button class="icon-btn" id="home-theme" aria-label="Toggle theme">${ic('sparkles')}</button>
            <button class="btn btn-secondary btn-sm" data-enter="1">Open app</button>
            <button class="btn btn-primary btn-sm" data-enter="1">Start free</button>
          </div>
        </div>
      </header>`;
  }

  function hero() {
    return `
      <section class="home-hero">
        <div class="home-hero-mesh"></div>
        <div class="home-hero-grid">
          <div class="home-hero-copy">
            <div class="home-eyebrow">${ic('sparkles')} AI interiors for the Indian market</div>
            <h1 class="home-h1">Design it. Cost it. Build it.<br><span class="home-h1-accent">With zero guesswork.</span></h1>
            <p class="home-hero-sub">Planex AI turns a floor plan into a fully specified, priced, buildable interior — drawings, a GST-ready BOQ, trade dockets and vendor-ready scope sheets. Every quote lands on the same basis, and nothing is left to assumption.</p>
            <div class="home-cta-row">
              <button class="btn btn-lg btn-primary" data-enter="1">${ic('arrowRight')} Start your project — free</button>
              <button class="btn btn-lg btn-secondary" data-seg="b2b">For business</button>
            </div>
            <div class="home-trustline">
              <span>${ic('check')} No card needed</span>
              <span>${ic('check')} Your plan stays yours</span>
              <span>${ic('check')} GST-ready BOQ</span>
            </div>
          </div>
          <div class="home-hero-art" aria-hidden="true">
            <div class="home-art-card">
              <div class="home-art-head"><span class="home-dot"></span><span class="home-art-title">Living Room · 5.4 × 4.2 m</span><span class="badge badge-success">Validated</span></div>
              <div class="home-art-plan">
                <div class="hp-room r1">Living</div><div class="hp-room r2">Dining</div>
                <div class="hp-room r3">Kitchen</div><div class="hp-room r4">Bedroom</div>
              </div>
              <div class="home-art-rows">
                <div class="home-art-row"><span>Scope</span><strong>22 packages</strong></div>
                <div class="home-art-row"><span>BOQ</span><strong>₹36.7L · GST ready</strong></div>
                <div class="home-art-row"><span>Dockets</span><strong>13 trades</strong></div>
                <div class="home-art-row"><span>Scope sheets</span><strong>RFQ ready</strong></div>
                <div class="home-art-row"><span>Drawings</span><strong>A-01 – A-04</strong></div>
              </div>
            </div>
          </div>
        </div>
        <div class="home-strip">
          <span>${ic('check')} 20 years of interiors, encoded</span>
          <span>${ic('check')} 22 work packages</span>
          <span>${ic('check')} 13 trade dockets</span>
          <span>${ic('check')} A-01–A-04 drawings</span>
          <span>${ic('check')} Spec-locked RFQs</span>
          <span>${ic('check')} Revision control</span>
        </div>
      </section>`;
  }

  function segmentTabs() {
    return `
      <div class="home-segs">
        ${SEGMENTS.map(function (s) {
          return `<button class="home-seg ${seg === s.id ? 'active' : ''}" data-seg="${s.id}">
            <span class="home-seg-ico">${ic(s.icon)}</span>
            <span class="home-seg-label">${esc(s.label)}</span>
          </button>`;
        }).join('')}
      </div>`;
  }

  function valueCards(list) {
    return `<div class="home-value-grid">${list.map(function (v) {
      return `<div class="home-value card"><div class="home-value-ico">${ic(v.icon)}</div><h3>${esc(v.title)}</h3><p class="muted text-sm">${esc(v.desc)}</p></div>`;
    }).join('')}</div>`;
  }

  function planCards(list, isPartner) {
    if (isPartner) return '';
    return `<div class="home-plans">${list.map(function (p) {
      return `<div class="home-plan ${p.popular ? 'popular' : ''}">
        ${p.popular ? '<span class="home-plan-flag">Most popular</span>' : ''}
        <div class="home-plan-tag">${esc(p.tag)}</div>
        <h3 class="home-plan-name">${esc(p.name)}</h3>
        <div class="home-plan-price">${esc(p.price)}<small>${esc(p.unit)}</small></div>
        <p class="muted text-sm">${esc(p.desc)}</p>
        <ul class="home-plan-feat">${p.features.map(function (f) { return `<li>${ic('check')} <span>${esc(f)}</span></li>`; }).join('')}</ul>
        <button class="btn ${p.popular ? 'btn-primary' : 'btn-secondary'} btn-block" data-plan="${p.id}">${esc(p.cta)}</button>
      </div>`;
    }).join('')}</div>
    <p class="home-price-note">Indicative pricing for the Indian market · GST extra · Final scope and price are confirmed after your plan review.</p>`;
  }

  function partnerForm() {
    return `
      <div class="home-partner" id="partner">
        <div class="home-partner-copy">
          <div class="home-eyebrow">${ic('sparkles')} Partner programme</div>
          <h2 class="home-h2">Connect with us directly.</h2>
          <p class="muted">Partners don't pick a plan — we design the partnership together. Tell us who you are and we'll set up a working session.</p>
          <div class="home-partner-grid">
            ${PARTNER_TYPES.map(function (p) {
              return `<div class="home-partner-item"><span class="home-value-ico">${ic(p.icon)}</span><div><strong>${esc(p.title)}</strong><p class="muted text-xs">${esc(p.desc)}</p></div></div>`;
            }).join('')}
          </div>
        </div>
        <div class="home-form card card-pad-lg" id="hp-form-wrap">
          <h3 style="margin-bottom:4px;">Partner enquiry</h3>
          <p class="muted text-sm" style="margin-bottom:14px;">We reply within one working day.</p>
          <div class="field-row">
            <div class="field"><label>Company *</label><input class="input" id="hp-company" placeholder="Company / studio name"></div>
            <div class="field"><label>Contact name *</label><input class="input" id="hp-name" placeholder="Full name"></div>
          </div>
          <div class="field-row" style="margin-top:12px;">
            <div class="field"><label>Work email *</label><input class="input" id="hp-email" placeholder="name@company.com"></div>
            <div class="field"><label>Phone</label><input class="input" id="hp-phone" placeholder="+91"></div>
          </div>
          <div class="field-row" style="margin-top:12px;">
            <div class="field"><label>City</label><input class="input" id="hp-city" placeholder="City"></div>
            <div class="field"><label>Partner category</label>
              <select class="select" id="hp-category">
                <option value="">Select</option>
                ${PARTNER_TYPES.map(function (p) { return '<option value="' + esc(p.title) + '">' + esc(p.title) + '</option>'; }).join('')}
              </select>
            </div>
          </div>
          <div class="field" style="margin-top:12px;">
            <label>Monthly project volume</label>
            <select class="select" id="hp-volume">
              <option value="">Select</option>
              <option>1–5 projects</option><option>6–20 projects</option><option>21–50 projects</option><option>50+ projects</option>
            </select>
          </div>
          <div class="field" style="margin-top:12px;"><label>What would you like to build with Planex?</label><textarea class="textarea" id="hp-message" rows="3" placeholder="Tell us briefly…"></textarea></div>
          <label class="home-consent"><input type="checkbox" id="hp-consent"> I agree to be contacted about a Planex partnership.</label>
          <button class="btn btn-primary btn-block" id="hp-submit" style="margin-top:12px;">${ic('send')} Send enquiry</button>
        </div>
      </div>`;
  }

  function segmentSection() {
    if (seg === 'partner') {
      return `<section class="home-section" id="segment">${segmentTabs()}
        <div class="home-seg-head">
          <h2 class="home-h2">Build the category with us.</h2>
          <p class="muted">Planex sits at the moment of design — where materials, vendors and technology get decided.</p>
        </div>
        ${partnerForm()}
      </section>`;
    }
    const isB2B = seg === 'b2b';
    return `<section class="home-section" id="segment">
      ${segmentTabs()}
      <div class="home-seg-head">
        <h2 class="home-h2">${isB2B ? 'Quote faster. Deliver predictably. Protect margin.' : 'Your home, planned end to end.'}</h2>
        <p class="muted">${isB2B
          ? 'Planex gives your team one thread from the first plan to the final handover — so every project is priced and delivered on the same basis.'
          : 'From a single floor plan to a priced, buildable interior — with the drawings, specifications and documents your contractor actually needs.'}</p>
      </div>
      ${valueCards(isB2B ? B2B_VALUE : B2C_VALUE)}
      <div class="home-plans-head" id="plans">
        <h2 class="home-h2">${isB2B ? 'Business plans' : 'Homeowner plans'}</h2>
        <p class="muted">${isB2B ? 'Per-year plans that scale with your practice.' : 'Transparent, project-based pricing. Change anytime.'}</p>
      </div>
      ${planCards(isB2B ? B2B_PLANS : B2C_PLANS, false)}
    </section>`;
  }

  function deliverables() {
    return `<section class="home-section" id="deliverables">
      <div class="home-seg-head"><h2 class="home-h2">What you get on every project.</h2>
      <p class="muted">The same documents a professional practice issues — generated from your plan.</p></div>
      <div class="home-deliver-grid">
        ${DELIVERABLES.map(function (d) {
          return `<div class="home-deliver card"><div class="home-value-ico">${ic(d.icon)}</div><div><strong>${esc(d.title)}</strong><p class="muted text-xs">${esc(d.desc)}</p></div></div>`;
        }).join('')}
      </div>
    </section>`;
  }

  function how() {
    return `<section class="home-band" id="how">
      <div class="home-seg-head"><h2 class="home-h2">How it works.</h2><p class="muted">Three steps from plan to handover.</p></div>
      <div class="home-how">
        ${HOW.map(function (s) {
          return `<div class="home-how-step"><div class="home-how-num">${esc(s.n)}</div><h3>${esc(s.title)}</h3><p class="muted text-sm">${esc(s.desc)}</p></div>`;
        }).join('')}
      </div>
    </section>`;
  }

  function trust() {
    return `<section class="home-section" id="trust">
      <div class="home-seg-head"><h2 class="home-h2">Confidence, built in.</h2><p class="muted">Why professionals and homeowners trust the Planex pack.</p></div>
      <div class="home-value-grid">${GUARANTEES.map(function (g) {
        return `<div class="home-value card"><div class="home-value-ico">${ic('check')}</div><h3>${esc(g.title)}</h3><p class="muted text-sm">${esc(g.desc)}</p></div>`;
      }).join('')}</div>
    </section>`;
  }

  function faq() {
    return `<section class="home-section" id="faq">
      <div class="home-seg-head"><h2 class="home-h2">Questions, answered.</h2></div>
      <div class="home-faq">
        ${FAQ.map(function (f) {
          return `<details class="home-faq-item"><summary>${esc(f.q)}</summary><p class="muted text-sm">${esc(f.a)}</p></details>`;
        }).join('')}
      </div>
    </section>`;
  }

  function ctaBand() {
    return `<section class="home-cta-band">
      <div>
        <h2 class="home-h2" style="color:inherit;">Start with your floor plan.</h2>
        <p style="opacity:.85;margin-top:6px;">Free to begin. See your rooms, scope and cost take shape in minutes.</p>
      </div>
      <div class="home-cta-band-actions">
        <button class="btn btn-lg" data-enter="1" style="background:#fff;color:#18181b;">${ic('arrowRight')} Start free</button>
        <button class="btn btn-lg btn-secondary" data-seg="partner" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4);">Partner with us</button>
      </div>
    </section>`;
  }

  function footer() {
    return `<footer class="home-footer">
      <div class="home-footer-brand">
        <span class="brand-mark">${ic('home')}</span>
        <div><strong>Planex AI</strong><p class="faint text-xs">Plan &amp; Execute · Interiors for India</p></div>
      </div>
      <div class="home-footer-cols">
        <div><strong>Product</strong><button data-enter="1">Homeowners</button><button data-seg="b2b">Business</button><button data-scroll="#how">How it works</button><button data-scroll="#plans">Pricing</button></div>
        <div><strong>Partners</strong><button data-seg="partner">Partner programme</button><a href="mailto:partners@planex.ai">partners@planex.ai</a></div>
        <div><strong>Company</strong><a href="#home-top" data-scroll="#home-top">Back to top</a><button data-nav="execution">Execution</button></div>
      </div>
      <div class="home-footer-base"><span>© ${new Date().getFullYear()} Planex AI. All rights reserved.</span><span>Made for the Indian interior market.</span></div>
    </footer>`;
  }

  /* ---------------- Render ---------------- */
  function render(container) {
    container.innerHTML = `
      <div class="home">
        ${header()}
        ${hero()}
        ${segmentSection()}
        ${deliverables()}
        ${how()}
        ${trust()}
        ${faq()}
        ${ctaBand()}
        ${footer()}
      </div>`;
    bind(container);
  }

  function bind(container) {
    container.querySelectorAll('[data-enter]').forEach(function (b) {
      b.addEventListener('click', function () { enterApp(); });
    });
    container.querySelectorAll('[data-scroll]').forEach(function (b) {
      b.addEventListener('click', function () { scrollTo(b.getAttribute('data-scroll')); });
    });
    container.querySelectorAll('[data-seg]').forEach(function (b) {
      b.addEventListener('click', function () {
        seg = b.getAttribute('data-seg');
        window.PlanexApp.renderView();
        scrollTo('#segment');
      });
    });
    container.querySelectorAll('[data-plan]').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-plan');
        const list = seg === 'b2b' ? B2B_PLANS : B2C_PLANS;
        const plan = list.filter(function (p) { return p.id === id; })[0];
        if (plan) choosePlan(list, plan);
      });
    });
    const theme = container.querySelector('#home-theme');
    if (theme) theme.addEventListener('click', function () {
      const next = (store().state.uiTheme === 'dark') ? 'light' : 'dark';
      store().setUITheme(next);
      document.documentElement.setAttribute('data-theme', next);
      window.PlanexApp.renderView();
    });
    const submit = container.querySelector('#hp-submit');
    if (submit) submit.addEventListener('click', function () { submitPartner(container); });
  }

  return { render: render };
})();
