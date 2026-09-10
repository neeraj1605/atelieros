/* ============================================================
   Planex AI — Chat + Upload Module (hosted Gemini + offline fallback)
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.PlanexAI = (function () {
  let pending = [];      // staged attachments {id,name,kind,dataUrl,size}
  let typing = false;
  let streaming = false;

  function ic(name) { return window.PlanexIcons.get(name); }
  function store() { return window.PlanexStore; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function hosted() {
    return window.PlanexAIClient && window.PlanexAIClient.isEnabled();
  }

  function nowTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function brainLabel() {
    return hosted() ? 'Online • Gemini (hosted)' : 'Online • Offline assistant';
  }

  function render(container) {
    const S = store().state;
    const D = window.PlanexData;

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <h1 class="serif">Planex AI</h1>
            <p>Your interior design assistant. Upload images and site plans, and shape the whole project in conversation.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="ai-add-plan">${ic('upload')} Upload Site Plan</button>
            <button class="btn btn-secondary btn-sm" id="ai-add-image">${ic('image')} Upload Image</button>
          </div>
        </div>

        <div class="chat-wrap anim anim-1">
          <div class="chat-head">
            <div class="chat-avatar">${ic('sparkles')}</div>
            <div>
              <div class="chat-head-name">Planex AI Assistant</div>
              <div class="chat-head-status"><span class="status-pulse"></span> ${brainLabel()}</div>
            </div>
            <div class="chat-head-actions">
              <span class="badge ${hosted() ? 'badge-success' : 'badge-neutral'}" title="Assistant mode">${hosted() ? 'Gemini' : 'Offline'}</span>
              <button class="icon-btn" id="ai-brief" title="View project brief">${ic('docket')}</button>
            </div>
          </div>

          <div class="chat-scroll" id="chat-scroll"></div>

          <div class="chat-composer">
            <div class="attachment-strip" id="attach-strip"></div>
            <div class="composer-box">
              <textarea class="composer-input" id="composer-input" rows="1"
                placeholder="Describe your space, ask about costs, or attach a site plan..."></textarea>
              <div class="composer-tools">
                <button class="icon-btn" id="tool-render" title="Generate a render">${ic('wand')}</button>
                <button class="icon-btn" id="tool-image" title="Attach image">${ic('image')}</button>
                <button class="icon-btn" id="tool-plan" title="Attach site plan">${ic('plan')}</button>
                <button class="send-btn" id="send-btn" title="Send">${ic('send')}</button>
              </div>
            </div>
            <div class="composer-hint">
              <span>Tip: attach a site plan photo and I'll map rooms automatically.</span>
              <span style="margin-left:auto;">${S.boq.length} BOQ items tracked</span>
            </div>
          </div>
        </div>

        <input type="file" id="file-image" accept="image/*" hidden>
        <input type="file" id="file-plan" accept="image/*,application/pdf" hidden>
      </div>
    `;

    bind(container);
    renderMessages();
    renderAttachments();
  }

  function bind(container) {
    const input = container.querySelector('#composer-input');
    const send = container.querySelector('#send-btn');
    const fileImage = container.querySelector('#file-image');
    const filePlan = container.querySelector('#file-plan');

    const clickImage = () => fileImage.click();
    const clickPlan = () => filePlan.click();

    container.querySelector('#ai-add-image').addEventListener('click', clickImage);
    container.querySelector('#tool-image').addEventListener('click', clickImage);
    container.querySelector('#ai-add-plan').addEventListener('click', clickPlan);
    container.querySelector('#tool-plan').addEventListener('click', clickPlan);
    container.querySelector('#tool-render').addEventListener('click', () => {
      const t = (input.value || '').trim();
      generateRender(t || lastUserText());
    });

    fileImage.addEventListener('change', (e) => handleFiles(e.target.files, 'image'));
    filePlan.addEventListener('change', (e) => handleFiles(e.target.files, 'plan'));

    send.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(140, input.scrollHeight) + 'px';
    });

    container.querySelector('#ai-brief').addEventListener('click', showBrief);

    container.addEventListener('click', (e) => {
      const sug = e.target.closest('[data-suggest]');
      if (sug) { input.value = sug.getAttribute('data-suggest'); submit(); return; }
      const img = e.target.closest('[data-lightbox]');
      if (img) { window.PlanexUI.lightbox(img.getAttribute('data-lightbox')); return; }
      const apply = e.target.closest('[data-apply]');
      if (apply) { applyProposal(apply.getAttribute('data-apply')); return; }
      const dismiss = e.target.closest('[data-dismiss]');
      if (dismiss) { dismissProposal(dismiss.getAttribute('data-dismiss')); return; }
    });
  }

  function handleFiles(files, kind) {
    if (!files || !files.length) return;
    Array.from(files).forEach(file => {
      if (file.size > 4 * 1024 * 1024) {
        window.PlanexUI.toast('File too large (max 4 MB). Please attach a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        pending.push({
          id: 'up-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          name: file.name,
          kind,
          dataUrl: reader.result,
          size: file.size
        });
        renderAttachments();
      };
      reader.readAsDataURL(file);
    });
    const fi = document.querySelector('#file-image');
    const fp = document.querySelector('#file-plan');
    if (fi) fi.value = '';
    if (fp) fp.value = '';
  }

  function renderAttachments() {
    const strip = document.querySelector('#attach-strip');
    if (!strip) return;
    if (!pending.length) { strip.innerHTML = ''; return; }
    strip.innerHTML = pending.map(a => `
      <div class="attachment-chip">
        ${a.kind === 'image' ? `<img src="${a.dataUrl}" alt="">` : ic('plan')}
        <span class="nowrap">${esc(a.name.length > 22 ? a.name.slice(0, 20) + '…' : a.name)}</span>
        <button data-remove="${a.id}" title="Remove">&times;</button>
      </div>`).join('');
    strip.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        pending = pending.filter(p => p.id !== btn.getAttribute('data-remove'));
        renderAttachments();
      });
    });
  }

  function submit() {
    if (streaming) return;
    const input = document.querySelector('#composer-input');
    const text = (input.value || '').trim();
    if (!text && !pending.length) return;

    const attachments = pending.slice();
    const hasPlan = attachments.some(a => a.kind === 'plan');

    attachments.forEach(a => store().addUpload(a));
    store().addChatMessage('user', text || (hasPlan ? 'Uploaded a site plan.' : 'Uploaded an image.'), attachments);

    input.value = '';
    input.style.height = 'auto';
    pending = [];
    renderAttachments();
    renderMessages();

    if (hosted()) {
      hostedTurn(text, attachments, hasPlan);
    } else {
      localTurn(text, attachments, hasPlan);
    }
  }

  function localTurn(text, attachments, hasPlan) {
    typing = true;
    renderMessages();
    const delay = 550 + Math.random() * 450;
    setTimeout(() => {
      const reply = window.PlanexAI.respond(text, {
        uploaded: attachments.length > 0,
        uploadKind: hasPlan ? 'plan' : 'image'
      });
      typing = false;
      store().addChatMessage('assistant', reply, []);
      if (hasPlan) {
        store().updateContext({ notes: 'Site plan received. Rooms detected from the uploaded plan (AI estimate — verify).' });
      }
      renderMessages();
    }, delay);
  }

  async function hostedTurn(text, attachments, hasPlan) {
    streaming = true;
    const scroll = document.querySelector('#chat-scroll');
    let tmp = null;
    let bubble = null;

    if (scroll) {
      tmp = document.createElement('div');
      tmp.className = 'msg ai';
      tmp.innerHTML = '<div class="msg-avatar">' + ic('sparkles') + '</div>' +
        '<div class="msg-body"><div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div></div>';
      scroll.appendChild(tmp);
      bubble = tmp.querySelector('.bubble');
      scroll.scrollTop = scroll.scrollHeight;
    }

    let acc = '';
    let proposals = [];
    let patched = false;
    let errored = false;

    try {
      await window.PlanexAIClient.send({
        message: text,
        attachments: attachments,
        state: store().getGroundingState(),
        onDelta: (t) => {
          acc += t;
          if (bubble) { bubble.textContent = acc; scroll.scrollTop = scroll.scrollHeight; }
        },
        onPatch: (d) => {
          patched = true;
          store().applyContextPatch(d.patch, d.version);
        },
        onProposals: (list) => { proposals = list || []; },
        onError: () => { errored = true; },
        onDone: () => {}
      });
    } catch (err) {
      errored = true;
      window.PlanexUI.toast('Hosted assistant unavailable — using offline assistant.');
    }

    if (!acc) {
      acc = window.PlanexAI.respond(text, {
        uploaded: attachments.length > 0,
        uploadKind: hasPlan ? 'plan' : 'image'
      });
      if (bubble) bubble.textContent = acc;
    }

    if (tmp) tmp.remove();
    store().addChatMessage('assistant', acc, [], proposals.length ? { proposals: proposals } : {});

    if (patched) {
      store().pushAudit && store().pushAudit('context.ai_update', {});
    }
    if (hasPlan) {
      store().updateContext({ notes: 'Site plan received. Rooms extracted as AI estimates — please verify dimensions.' });
    }

    streaming = false;
    renderMessages();
    if (wantsRender(text)) generateRender(text);
  }

  function renderMessages() {
    const scroll = document.querySelector('#chat-scroll');
    if (!scroll) return;
    const S = store().state;

    let html = '';

    if (S.chat.length <= 1 && !typing) {
      const seed = S.chat[0];
      html += bubble(seed, 0);
      html += `
        <div style="display:flex;justify-content:center;margin-top:6px;">
          <div class="chat-suggestions">
            ${window.PlanexData.suggestionPrompts.map(s => `
              <button class="suggestion" data-suggest="${esc(s.text)}">
                ${ic(s.icon)}<span>${esc(s.text)}</span>
              </button>`).join('')}
          </div>
        </div>`;
    } else {
      html += S.chat.map((m, i) => bubble(m, i)).join('');
    }

    if (typing) {
      html += `
        <div class="msg ai">
          <div class="msg-avatar">${ic('sparkles')}</div>
          <div class="msg-body"><div class="typing"><span></span><span></span><span></span></div></div>
        </div>`;
    }

    scroll.innerHTML = html;
    scroll.scrollTop = scroll.scrollHeight;
  }

  function bubble(m, msgIndex) {
    const isUser = m.role === 'user';
    const atts = (m.attachments || []).map(a => {
      if (a.kind === 'image') return `<img src="${a.dataUrl}" alt="" data-lightbox="${a.dataUrl}">`;
      if (a.kind === 'plan') {
        if (a.dataUrl && a.dataUrl.indexOf('data:image') === 0) {
          return `<span class="msg-file" data-lightbox="${a.dataUrl}">${ic('plan')} ${esc(a.name)}</span>`;
        }
        return `<span class="msg-file">${ic('plan')} ${esc(a.name)}</span>`;
      }
      return '';
    }).join('');

    const proposals = (!isUser && Array.isArray(m.proposals) && m.proposals.length)
      ? `<div class="proposal-stack">${m.proposals.map((p, pi) => proposalCard(p, msgIndex, pi)).join('')}</div>`
      : '';

    return `
      <div class="msg ${isUser ? 'user' : 'ai'}">
        <div class="msg-avatar">${isUser ? ic('user') : ic('sparkles')}</div>
        <div class="msg-body">
          <div class="bubble">${esc(m.text)}</div>
          ${atts ? `<div class="msg-attachments">${atts}</div>` : ''}
          ${proposals}
          <span class="msg-time">${esc(m.time || '')}</span>
        </div>
      </div>`;
  }

  function proposalSummary(p) {
    const d = p.payload || {};
    if (p.type === 'boq.add') {
      return `Add to BOQ · ${d.item} · ${d.qty || 1} ${d.unit || 'nos'} @ ${window.PlanexStore.formatMoney(d.rate || 0)}`;
    }
    if (p.type === 'room.upsert') {
      return `Set room · ${d.name} · ${d.lengthM} × ${d.widthM} m`;
    }
    if (p.type === 'style.apply') {
      return `Apply style · ${(d.directions || []).join(', ')}`;
    }
    return p.type;
  }

  function proposalCard(p, msgIndex, propIndex) {
    const applied = !!p.applied;
    return `
      <div class="proposal-card ${applied ? 'applied' : ''}">
        <div class="pc-head">
          <span class="badge ${applied ? 'badge-success' : 'badge-info'}">${applied ? 'Applied' : 'Proposal'}</span>
          <span class="pc-title">${esc(proposalSummary(p))}</span>
        </div>
        ${p.rationale ? `<div class="pc-rationale">${esc(p.rationale)}</div>` : ''}
        ${applied ? '' : `
        <div class="pc-actions">
          <button class="btn btn-primary btn-sm" data-apply="${msgIndex}:${propIndex}">${ic('check')} Apply</button>
          <button class="btn btn-ghost btn-sm" data-dismiss="${msgIndex}:${propIndex}">Dismiss</button>
        </div>`}
      </div>`;
  }

  function applyProposal(ref) {
    const parts = String(ref).split(':');
    const msgIndex = Number(parts[0]);
    const propIndex = Number(parts[1]);
    const S = store().state;
    const msg = S.chat[msgIndex];
    if (!msg || !msg.proposals || !msg.proposals[propIndex]) return;
    const proposal = msg.proposals[propIndex];
    const ok = store().applyProposal(proposal);
    if (ok) {
      proposal.applied = true;
      if (window.PlanexAIClient && window.PlanexAIClient.audit) {
        window.PlanexAIClient.audit('proposal.apply', { type: proposal.type, id: proposal.id });
      }
      window.PlanexUI.toast('Applied: ' + proposalSummary(proposal));
      store().commit();
      renderMessages();
    } else {
      window.PlanexUI.toast('Could not apply that proposal.');
    }
  }

  function dismissProposal(ref) {
    const parts = String(ref).split(':');
    const msgIndex = Number(parts[0]);
    const propIndex = Number(parts[1]);
    const S = store().state;
    const msg = S.chat[msgIndex];
    if (!msg || !msg.proposals) return;
    msg.proposals.splice(propIndex, 1);
    store().commit();
    renderMessages();
  }

  function showBrief() {
    const S = store().state;
    const c = S.context || {};
    const money = (n) => store().formatMoney(n || 0);

    const spaces = (c.spaces || []).map(s => `
      <div class="brief-space">
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <span style="font-weight:600;">${esc(s.name)}</span>
          <span class="muted">${s.lengthM} × ${s.widthM} m</span>
        </div>
        ${s.source === 'ai-estimate' ? '<span class="badge badge-warning" style="margin-top:4px;">AI estimate — verify</span>' : ''}
      </div>`).join('') || '<p class="muted text-sm">No spaces captured yet.</p>';

    const palette = (c.style && c.style.palette || []).map(col =>
      `<span class="palette-dot" style="background:${esc(col)}" title="${esc(col)}"></span>`).join('') || '<span class="muted text-sm">—</span>';

    const versions = (S.contextVersions || []).slice(0, 8).map(v => `
      <div class="brief-version">
        <div>
          <span class="badge badge-neutral">v${v.version}</span>
          <span class="muted text-sm" style="margin-left:8px;">${esc(v.source)}</span>
        </div>
        ${v.version === S.contextVersion ? '<span class="faint text-xs">current</span>'
          : `<button class="btn btn-ghost btn-sm" data-revert="${v.version}">Revert</button>`}
      </div>`).join('') || '<p class="muted text-sm">No prior versions.</p>';

    window.PlanexUI.modal('Evolving Project Brief', `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <p class="muted text-sm">Planex AI maintains this brief from your conversation and carries it into every stage. Current version: <strong>v${S.contextVersion || 1}</strong>.</p>

        <div class="card">
          <div class="text-xs uppercase faint bold" style="margin-bottom:6px;">Project</div>
          <div style="font-size:14px;">${esc((c.project && c.project.spaceType) || '—')} • ${esc((c.project && c.project.type) || '—')}</div>
          <div class="muted text-sm">${esc((c.project && c.project.location) || '')}</div>
        </div>

        <div class="card">
          <div class="text-xs uppercase faint bold" style="margin-bottom:8px;">Spaces</div>
          <div style="display:flex;flex-direction:column;gap:8px;">${spaces}</div>
        </div>

        <div class="field-row">
          <div class="card"><div class="text-xs uppercase faint bold">Style</div>
            <div style="margin-top:6px;">${esc((c.style && c.style.directions || []).join(' + ') || '—')}</div>
            <div style="margin-top:8px;display:flex;gap:6px;">${palette}</div>
          </div>
          <div class="card"><div class="text-xs uppercase faint bold">Budget</div>
            <div style="margin-top:6px;">${money(c.budget && c.budget.target)}</div>
            <div class="muted text-sm">flexibility: ${esc((c.budget && c.budget.flexibility) || '—')}</div>
          </div>
        </div>

        <div class="card">
          <div class="text-xs uppercase faint bold" style="margin-bottom:6px;">Priorities &amp; pain points</div>
          <div style="font-size:13px;">${esc((c.priorities || []).join(', ') || '—')}</div>
          <div class="muted text-sm" style="margin-top:4px;">${esc((c.painPoints || []).join(', ') || '')}</div>
        </div>

        <div class="card">
          <div class="text-xs uppercase faint bold" style="margin-bottom:6px;">Notes</div>
          <div style="font-size:13px;">${esc(c.notes || '—')}</div>
        </div>

        <div class="card">
          <div class="text-xs uppercase faint bold" style="margin-bottom:8px;">Version history</div>
          <div style="display:flex;flex-direction:column;gap:6px;">${versions}</div>
        </div>
      </div>
    `);

    document.querySelectorAll('[data-revert]').forEach(btn => {
      btn.addEventListener('click', () => {
        const version = Number(btn.getAttribute('data-revert'));
        if (store().revertContext(version)) {
          window.PlanexUI.closeModal();
          window.PlanexUI.toast('Brief reverted to v' + version);
          renderMessages();
          showBrief();
        }
      });
    });
  }

  function wantsRender(text) {
    return /\b(render|renders|3d|visuali[sz]e|mood ?board|photorealistic|image of|picture of|sketch|preview)\b/i.test(text || '');
  }

  function lastUserText() {
    const chat = store().state.chat || [];
    for (let i = chat.length - 1; i >= 0; i--) {
      if (chat[i].role === 'user' && chat[i].text) return chat[i].text;
    }
    const c = store().state.context || {};
    return [
      c.project && c.project.spaceType,
      (c.style && c.style.directions || []).join(' + ')
    ].filter(Boolean).join(', ') || 'a modern Indian living room';
  }

  function buildRenderPromptFrom(text) {
    const c = store().state.context || {};
    const bits = [];
    if (text) bits.push(text);
    if (c.project && c.project.spaceType) bits.push(c.project.spaceType);
    if (c.style && c.style.directions && c.style.directions.length) bits.push(c.style.directions.join(' + ') + ' style');
    return bits.join(', ').slice(0, 600);
  }

  async function generateRender(promptText) {
    if (!hosted()) {
      window.PlanexUI.toast('Image generation needs the hosted assistant. Set workerUrl in config.');
      return;
    }
    const prompt = buildRenderPromptFrom(promptText);
    const idx = store().state.chat.length;
    store().addChatMessage('assistant', '🎨 Creating your render — this takes a few seconds...', []);
    renderMessages();

    try {
      const dataUrl = await window.PlanexAIClient.generateImage(prompt, { width: 1024, height: 768 });
      const m = store().state.chat[idx];
      if (m) {
        m.text = 'Here is a concept render based on your brief. (AI render — indicative, not a final visualisation.)';
        m.attachments = [{ kind: 'image', dataUrl: dataUrl, name: 'planex-render.jpg' }];
      }
      store().addRender({ dataUrl: dataUrl, prompt: prompt });
      if (window.PlanexAIClient.audit) window.PlanexAIClient.audit('image.render', { prompt: prompt.slice(0, 120) });
      store().commit();
      renderMessages();
      window.PlanexUI.toast('Render generated and saved to Concept Renders.');
    } catch (err) {
      const m = store().state.chat[idx];
      const code = err && err.status ? err.status : 'network';
      if (m) {
        m.text = code === 429
          ? 'The image service is busy right now (rate limited). Please try again in a moment.'
          : 'Sorry, I could not generate the render just now (' + code + ').';
      }
      store().commit();
      renderMessages();
    }
  }

  return { render };
})();
