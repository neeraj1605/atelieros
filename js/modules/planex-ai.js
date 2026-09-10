/* ============================================================
   Planex AI — Chat + Upload Module
   Seamless visualisation: the assistant renders inside the turn and
   then validates its own render. Falls back to the offline assistant.
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

  function brainLabel() {
    return hosted() ? 'Online • Gemini (hosted)' : 'Online • Offline assistant';
  }

  /* ---------------- Render / bind ---------------- */
  function render(container) {
    const S = store().state;

    container.innerHTML = `
      <div class="view-inner">
        <div class="module-header anim">
          <div>
            <h1 class="serif">Planex AI</h1>
            <p>Your interior design assistant. I'll reply, show you renders as the design takes shape, and keep the brief evolving.</p>
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
                <button class="icon-btn" id="tool-render" title="Ask for a render">${ic('wand')}</button>
                <button class="icon-btn" id="tool-image" title="Attach image">${ic('image')}</button>
                <button class="icon-btn" id="tool-plan" title="Attach site plan">${ic('plan')}</button>
                <button class="send-btn" id="send-btn" title="Send">${ic('send')}</button>
              </div>
            </div>
            <div class="composer-hint">
              <span>Renders appear automatically at design moments — or tap the wand to ask for one.</span>
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

    // Wand = a conversational request for a render (no separate feature path).
    container.querySelector('#tool-render').addEventListener('click', () => {
      const base = (input.value || '').trim();
      input.value = '';
      input.style.height = 'auto';
      sendText(base ? (base + ' — can you show me what this would look like?') : 'Can you show me what this would look like?', []);
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
      const buildScope = e.target.closest('[data-build-scope]');
      if (buildScope) {
        window.PlanexApp.navigate('docket');
        setTimeout(function () {
          if (window.PlanexModules.DesignDocket && window.PlanexModules.DesignDocket.buildScope) {
            window.PlanexModules.DesignDocket.buildScope();
          }
        }, 250);
        return;
      }
    });
  }

  /* ---------------- Attachments ---------------- */
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

  /* ---------------- Submit ---------------- */
  function submit() {
    if (streaming) return;
    const input = document.querySelector('#composer-input');
    const text = (input.value || '').trim();
    if (!text && !pending.length) return;
    const attachments = pending.slice();
    pending = [];
    renderAttachments();
    input.value = '';
    input.style.height = 'auto';
    sendText(text, attachments);
  }

  function sendText(text, attachments) {
    if (streaming) return;
    attachments = attachments || [];
    const hasPlan = attachments.some(a => a.kind === 'plan');
    attachments.forEach(a => store().addUpload(a));
    store().addChatMessage('user', text || (hasPlan ? 'Uploaded a site plan.' : 'Uploaded an image.'), attachments);
    renderMessages();

    if (hosted()) hostedTurn(text, attachments, hasPlan);
    else localTurn(text, attachments, hasPlan);
  }

  function offlineFallback(text, attachments, hasPlan, err) {
    if (!err) {
      return window.PlanexAI.respond(text, {
        uploaded: (attachments || []).length > 0,
        uploadKind: hasPlan ? 'plan' : 'image'
      });
    }
    return window.PlanexAI.respond(text, {
      uploaded: (attachments || []).length > 0,
      uploadKind: hasPlan ? 'plan' : 'image'
    });
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
        store().updateContext({ notes: 'Site plan received. Rooms detected (AI estimate — verify).' });
        store().addChatMessage('assistant', 'I can turn this plan into a full room-wise scope of work — flooring, painting, civil, ceiling, lighting, plumbing, joinery and more.', [], { action: 'build-scope' });
      }
      renderMessages();
    }, delay);
  }

  /* ---------------- Hosted turn (segmented) ---------------- */
  function streamBubble() {
    const scroll = document.querySelector('#chat-scroll');
    if (!scroll) return null;
    const wrap = document.createElement('div');
    wrap.className = 'msg ai';
    wrap.innerHTML = '<div class="msg-avatar">' + ic('sparkles') + '</div>' +
      '<div class="msg-body"><div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div></div>';
    scroll.appendChild(wrap);
    scroll.scrollTop = scroll.scrollHeight;
    return wrap.querySelector('.bubble');
  }

  function dropBubble(bubble) {
    if (!bubble) return;
    const msg = bubble.closest('.msg');
    if (msg) msg.remove();
  }

  function setBubbleText(bubble, text) {
    if (!bubble) return;
    bubble.textContent = text;
    const scroll = document.querySelector('#chat-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  async function hostedTurn(text, attachments, hasPlan) {
    streaming = true;
    let prose = '';
    let proposals = [];
    let critique = '';
    let gotImage = false;
    let patched = false;
    let errored = false;

    let bubble = streamBubble();
    let critiqueBubble = null;

    try {
      await window.PlanexAIClient.send({
        message: text,
        attachments: attachments,
        state: store().getGroundingState(),
        onDelta: (t) => { prose += t; setBubbleText(bubble, prose); },
        onPatch: (d) => { patched = true; store().applyContextPatch(d.patch, d.version); },
        onProposals: (list) => { proposals = list || []; },
        onImagePending: () => {
          const base = prose || '';
          setBubbleText(bubble, base + (base ? '\n\n' : '') + '🎨 Working on a render — this can take up to a minute…');
        },
        onImageReady: (d) => {
          gotImage = true;
          // Finalise prose (with any proposals) as its own message.
          dropBubble(bubble); bubble = null;
          store().addChatMessage('assistant', prose || 'Here is how I picture it.', [], proposals.length ? { proposals: proposals } : {});
          proposals = [];
          store().addChatMessage('assistant', '🎨 Concept render' + (d.reason ? ' — ' + d.reason : ''), [
            { kind: 'image', dataUrl: d.dataUrl, name: 'planex-render.jpg' }
          ]);
          store().addRender({ dataUrl: d.dataUrl, prompt: d.prompt });
          renderMessages();
          // New bubble for the assistant's validation of its own render.
          critiqueBubble = streamBubble();
        },
        onCritiqueDelta: (t) => { critique += t; setBubbleText(critiqueBubble, critique); },
        onImageFailed: () => { window.PlanexUI.toast('Could not generate a render just now — continuing.'); },
        onError: () => { errored = true; },
        onDone: () => {}
      });
    } catch (err) {
      errored = true;
      window.PlanexUI.toast('Hosted assistant unavailable — using offline assistant.');
    }

    // If no render came through, finalise the prose bubble.
    if (bubble) {
      const finalText = prose || offlineFallback(text, attachments, hasPlan, errored);
      dropBubble(bubble); bubble = null;
      store().addChatMessage('assistant', finalText, [], proposals.length ? { proposals: proposals } : {});
    }

    // Finalise the critique.
    if (critiqueBubble) {
      dropBubble(critiqueBubble); critiqueBubble = null;
      if (critique) store().addChatMessage('assistant', critique, []);
    }

    // Absolute fallback: nothing at all came back.
    if (errored && !prose && !critique && !gotImage) {
      store().addChatMessage('assistant', offlineFallback(text, attachments, hasPlan, true), []);
    }

    if (patched) store().pushAudit && store().pushAudit('context.ai_update', {});
    if (hasPlan) {
      store().updateContext({ notes: 'Site plan received. Rooms extracted as AI estimates — please verify dimensions.' });
      store().addChatMessage('assistant', 'I can turn this plan into a full room-wise scope of work — flooring, painting, civil, ceiling, lighting, plumbing, joinery and more.', [], { action: 'build-scope' });
    }

    streaming = false;
    renderMessages();
  }

  /* ---------------- Messages ---------------- */
  function renderMessages() {
    const scroll = document.querySelector('#chat-scroll');
    if (!scroll) return;
    const S = store().state;

    let html = '';

    if (S.chat.length <= 1 && !typing) {
      html += bubble(S.chat[0], 0);
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

    const action = (!isUser && m.action === 'build-scope')
      ? `<div class="proposal-stack"><div class="proposal-card"><div class="pc-head"><span class="badge badge-info">Next</span><span class="pc-title">Build your scope of work</span></div>
         <div class="pc-rationale">Room-by-room, work-package-wise: flooring, painting, civil, ceiling, lighting, plumbing, joinery and more.</div>
         <div class="pc-actions"><button class="btn btn-primary btn-sm" data-build-scope="1">${ic('plan')} Build my scope</button></div></div></div>`
      : '';

    return `
      <div class="msg ${isUser ? 'user' : 'ai'}">
        <div class="msg-avatar">${isUser ? ic('user') : ic('sparkles')}</div>
        <div class="msg-body">
          <div class="bubble">${esc(m.text)}</div>
          ${atts ? `<div class="msg-attachments">${atts}</div>` : ''}
          ${proposals}
          ${action}
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
    const msg = store().state.chat[msgIndex];
    if (!msg || !msg.proposals || !msg.proposals[propIndex]) return;
    const proposal = msg.proposals[propIndex];
    if (store().applyProposal(proposal)) {
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
    const msg = store().state.chat[msgIndex];
    if (!msg || !msg.proposals) return;
    msg.proposals.splice(propIndex, 1);
    store().commit();
    renderMessages();
  }

  /* ---------------- Brief ---------------- */
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

  return { render };
})();
