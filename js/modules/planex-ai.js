/* ============================================================
   Planex AI — Chat + Upload Module
   ============================================================ */
window.PlanexModules = window.PlanexModules || {};

window.PlanexModules.PlanexAI = (function () {
  let pending = [];      // staged attachments {id,name,kind,dataUrl,size}
  let typing = false;

  function ic(name) { return window.PlanexIcons.get(name); }
  function store() { return window.PlanexStore; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
              <div class="chat-head-status"><span class="status-pulse"></span> Online • Interior Design Expert</div>
            </div>
            <div class="chat-head-actions">
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

    // delegation for suggestion buttons
    container.addEventListener('click', (e) => {
      const sug = e.target.closest('[data-suggest]');
      if (sug) { input.value = sug.getAttribute('data-suggest'); submit(); }
      const img = e.target.closest('[data-lightbox]');
      if (img) openLightbox(img.getAttribute('data-lightbox'));
    });
  }

  function handleFiles(files, kind) {
    if (!files || !files.length) return;
    Array.from(files).forEach(file => {
      if (file.size > 4 * 1024 * 1024) {
        toast('File too large (max 4 MB). Please attach a smaller image.');
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
    // reset inputs so same file can be re-picked
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
    const input = document.querySelector('#composer-input');
    const text = (input.value || '').trim();
    if (!text && !pending.length) return;

    const attachments = pending.slice();
    const uploadKinds = attachments.map(a => a.kind);
    const hasPlan = uploadKinds.includes('plan');

    // persist uploads into store
    attachments.forEach(a => store().addUpload(a));
    store().addChatMessage('user', text || (hasPlan ? 'Uploaded a site plan.' : 'Uploaded an image.'), attachments);

    input.value = '';
    input.style.height = 'auto';
    pending = [];
    renderAttachments();

    typing = true;
    renderMessages();

    const delay = 650 + Math.random() * 550;
    setTimeout(() => {
      const reply = window.PlanexAI.respond(text, {
        uploaded: attachments.length > 0,
        uploadKind: hasPlan ? 'plan' : 'image'
      });
      store().addChatMessage('ai', reply, []);
      typing = false;

      if (hasPlan) {
        store().updateContext({ notes: 'Site plan received. Rooms detected: Living, Kitchen, Master, Kids, Study, Bath.' });
      }
      renderMessages();
    }, delay);
  }

  function renderMessages() {
    const scroll = document.querySelector('#chat-scroll');
    if (!scroll) return;
    const S = store().state;

    let html = '';

    if (S.chat.length <= 1 && !typing) {
      // welcome + suggestions
      const seed = S.chat[0];
      html += bubble(seed, true);
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
      html += S.chat.map((m, i) => bubble(m, false)).join('');
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

  function bubble(m, isSeed) {
    const isUser = m.role === 'user';
    const atts = (m.attachments || []).map(a => {
      if (a.kind === 'image') {
        return `<img src="${a.dataUrl}" alt="" data-lightbox="${a.dataUrl}">`;
      }
      if (a.kind === 'plan') {
        // plan may be pdf or image
        if (a.dataUrl && a.dataUrl.startsWith('data:image')) {
          return `<span class="msg-file" data-lightbox="${a.dataUrl}">${ic('plan')} ${esc(a.name)}</span>`;
        }
        return `<span class="msg-file">${ic('plan')} ${esc(a.name)}</span>`;
      }
      return '';
    }).join('');

    return `
      <div class="msg ${isUser ? 'user' : 'ai'}">
        <div class="msg-avatar">${isUser ? ic('user') : ic('sparkles')}</div>
        <div class="msg-body">
          <div class="bubble">${esc(m.text)}</div>
          ${atts ? `<div class="msg-attachments">${atts}</div>` : ''}
          <span class="msg-time">${esc(m.time || '')}</span>
        </div>
      </div>`;
  }

  function showBrief() {
    const S = store().state;
    const c = S.context;
    const fin = store().getFinancials();
    modal('Project Brief', `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <p class="muted text-sm">Planex AI has built this evolving context from your conversation. It follows you across every stage.</p>
        <div class="card">
          <div class="text-xs uppercase faint bold" style="margin-bottom:8px;">Space</div>
          <div style="font-size:14px;">${esc(c.spaceType)} • ${esc(c.spaces.join(', '))}</div>
        </div>
        <div class="field-row">
          <div class="card"><div class="text-xs uppercase faint bold">Style</div><div style="margin-top:6px;">${esc(c.style.join(' + '))}</div></div>
          <div class="card"><div class="text-xs uppercase faint bold">Family</div><div style="margin-top:6px;">${esc(c.family)}</div></div>
        </div>
        <div class="card"><div class="text-xs uppercase faint bold">Budget</div><div style="margin-top:6px;">${store().formatMoney(c.budget)} <span class="muted">• Est. ${store().formatMoney(fin.total)}</span></div></div>
        <div class="card"><div class="text-xs uppercase faint bold">Notes</div><div style="margin-top:6px;font-size:13px;">${esc(c.notes)}</div></div>
      </div>
    `);
  }

  /* ---------- shared helpers (assigned onto a small util) ---------- */
  function toast(msg) { window.PlanexUI.toast(msg); }
  function modal(title, bodyHtml) { window.PlanexUI.modal(title, bodyHtml); }
  function openLightbox(src) { window.PlanexUI.lightbox(src); }

  return { render };
})();
