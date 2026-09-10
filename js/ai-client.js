/* ============================================================
   Planex AI — Hosted assistant client
   Session bootstrap (Turnstile), SSE streaming, graceful fallback.
   ============================================================ */
window.PlanexAIClient = (function () {
  const KEY_PROJECT = 'PLANEX_PROJECT_ID';
  const KEY_TOKEN = 'PLANEX_SESSION_TOKEN';

  function cfg() { return window.PLANEX_CONFIG || {}; }

  function isEnabled() {
    const url = cfg().workerUrl;
    return typeof url === 'string' && url.length > 0;
  }

  function base() { return String(cfg().workerUrl || '').replace(/\/$/, ''); }

  function readSession() {
    try {
      return {
        projectId: localStorage.getItem(KEY_PROJECT) || '',
        token: localStorage.getItem(KEY_TOKEN) || ''
      };
    } catch (e) { return { projectId: '', token: '' }; }
  }

  function writeSession(s) {
    try {
      if (s.projectId) localStorage.setItem(KEY_PROJECT, s.projectId);
      if (s.token) localStorage.setItem(KEY_TOKEN, s.token);
    } catch (e) { /* ignore */ }
  }

  function clearSession() {
    try {
      localStorage.removeItem(KEY_PROJECT);
      localStorage.removeItem(KEY_TOKEN);
    } catch (e) { /* ignore */ }
  }

  /* ---------- Turnstile ---------- */
  function solveTurnstile() {
    return new Promise(function (resolve, reject) {
      const siteKey = cfg().turnstileSiteKey;
      if (!siteKey) { resolve(''); return; }
      if (!window.turnstile || typeof window.turnstile.render !== 'function') {
        reject(new Error('turnstile_unavailable'));
        return;
      }
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:650;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;';
      const box = document.createElement('div');
      box.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:22px;text-align:center;max-width:360px;box-shadow:var(--shadow-lg);';
      box.innerHTML = '<div style="font-weight:700;margin-bottom:4px;">Quick check</div>' +
        '<div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px;">Verifying you are human to enable Planex AI.</div>';
      const widget = document.createElement('div');
      box.appendChild(widget);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      let widgetId = null;
      function cleanup() {
        try { if (widgetId !== null) window.turnstile.remove(widgetId); } catch (e) { /* ignore */ }
        overlay.remove();
      }
      widgetId = window.turnstile.render(widget, {
        sitekey: siteKey,
        callback: function (token) { cleanup(); resolve(token); },
        'error-callback': function () { cleanup(); reject(new Error('turnstile_error')); },
        'timeout-callback': function () { cleanup(); reject(new Error('turnstile_timeout')); }
      });
    });
  }

  /* ---------- Session ---------- */
  async function ensureSession(forceNew) {
    const existing = readSession();
    if (!forceNew && existing.token) return existing;

    const turnstileToken = await solveTurnstile();
    const res = await fetch(base() + '/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnstileToken: turnstileToken, projectId: existing.projectId || undefined })
    });
    if (!res.ok) {
      const err = new Error('session_start_' + res.status);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    writeSession({ projectId: data.projectId, token: data.token });
    if (data.context && window.PlanexStore && window.PlanexStore.adoptServerContext) {
      window.PlanexStore.adoptServerContext(data.context, data.version);
    }
    return { projectId: data.projectId, token: data.token };
  }

  /* ---------- Attachments ---------- */
  function toApiAttachments(pending) {
    return (pending || []).map(function (a) {
      const dataUrl = a.dataUrl || '';
      const comma = dataUrl.indexOf(',');
      const meta = dataUrl.slice(0, comma);
      const data = dataUrl.slice(comma + 1);
      const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
      return { kind: a.kind === 'plan' ? 'plan' : 'image', mime: mime, data: data, name: a.name || '' };
    }).filter(function (a) { return a.data; });
  }

  /* ---------- Chat (SSE) ---------- */
  async function send(opts) {
    const handlers = opts || {};
    let session = await ensureSession(false);
    let res = await postChat(session, opts);

    if (res.status === 401) {
      clearSession();
      session = await ensureSession(true);
      res = await postChat(session, opts);
    }

    if (!res.ok) {
      let detail = {};
      try { detail = await res.json(); } catch (e) { /* ignore */ }
      const err = new Error(detail.error || ('chat_' + res.status));
      err.status = res.status;
      err.detail = detail;
      throw err;
    }

    await consumeSSE(res, handlers);
  }

  function postChat(session, opts) {
    const body = {
      message: opts.message || '',
      attachments: toApiAttachments(opts.attachments),
      state: opts.state || {}
    };
    return fetch(base() + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + session.token
      },
      body: JSON.stringify(body)
    });
  }

  async function consumeSSE(res, handlers) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    function handleBlock(block) {
      const lines = block.split('\n');
      let event = 'message';
      let dataStr = '';
      for (const line of lines) {
        if (line.indexOf('event:') === 0) event = line.slice(6).trim();
        else if (line.indexOf('data:') === 0) dataStr += line.slice(5).trim();
      }
      if (!dataStr) return;
      let data = {};
      try { data = JSON.parse(dataStr); } catch (e) { return; }

      if (event === 'meta' && handlers.onMeta) handlers.onMeta(data);
      else if (event === 'reply.delta' && handlers.onDelta) handlers.onDelta(data.text || '');
      else if (event === 'context.patch' && handlers.onPatch) handlers.onPatch(data);
      else if (event === 'proposals' && handlers.onProposals) handlers.onProposals(data.proposals || []);
      else if (event === 'image.pending' && handlers.onImagePending) handlers.onImagePending(data);
      else if (event === 'image.ready' && handlers.onImageReady) handlers.onImageReady(data);
      else if (event === 'critique.delta' && handlers.onCritiqueDelta) handlers.onCritiqueDelta(data.text || '');
      else if (event === 'image.failed' && handlers.onImageFailed) handlers.onImageFailed(data);
      else if (event === 'done' && handlers.onDone) handlers.onDone(data);
      else if (event === 'error' && handlers.onError) handlers.onError(data);
    }

    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');
      let sep;
      while ((sep = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        handleBlock(block);
      }
    }
    if (buffer.trim()) handleBlock(buffer);
  }

  async function getContext() {
    const session = await ensureSession(false);
    const res = await fetch(base() + '/context', {
      headers: { Authorization: 'Bearer ' + session.token }
    });
    if (!res.ok) throw new Error('context_' + res.status);
    return res.json();
  }

  async function audit(kind, detail) {
    if (!isEnabled()) return;
    try {
      const session = await ensureSession(false);
      await fetch(base() + '/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.token },
        body: JSON.stringify({ kind: kind, detail: detail || {} })
      });
    } catch (e) { /* non-fatal */ }
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('read_failed')); };
      reader.readAsDataURL(blob);
    });
  }

  async function generateImage(prompt, opts) {
    const session = await ensureSession(false);
    const res = await fetch(base() + '/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + session.token
      },
      body: JSON.stringify({
        prompt: prompt,
        width: opts && opts.width,
        height: opts && opts.height
      })
    });
    if (!res.ok) {
      const err = new Error('image_' + res.status);
      err.status = res.status;
      throw err;
    }
    const blob = await res.blob();
    return blobToDataUrl(blob);
  }

  return {
    isEnabled: isEnabled,
    ensureSession: ensureSession,
    send: send,
    generateImage: generateImage,
    getContext: getContext,
    audit: audit,
    clearSession: clearSession,
    toApiAttachments: toApiAttachments
  };
})();
