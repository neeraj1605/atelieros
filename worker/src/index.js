// Planex AI — Cloudflare Worker entry point.
// Routes: /health, /session/start, /chat (SSE), /context, /audit
import { corsHeaders } from './cors.js';
import { issueToken, verifyToken, newProjectId, sha256Hex } from './session.js';
import { verifyTurnstile } from './turnstile.js';
import { checkAndIncrementDaily, checkSessionRate, addTokens } from './quota.js';
import * as db from './db.js';
import { mergePatch } from './merge.js';
import { sanitizeContextPatch, sanitizeProposals, sanitizeImageSpec, aspectToSize, emptyContext } from './schema.js';
import { buildSystemInstruction, buildExtractionPrompt, CRITIQUE_INSTRUCTION, buildCritiquePrompt } from './prompts.js';
import { toGeminiContents, streamReply, extractStructured, streamCritique } from './gemini.js';
import { generateImage } from './image.js';
import { hasVisualIntent, synthesizeImageSpec, contextIsSufficient } from './intent.js';
import { buildScopePrompt, normalizeScope } from './scope.js';
import { buildRoomsPrompt, normalizeRooms } from './plan.js';
import { buildDocketPrompt, sanitizeDocketEnrichment } from './docket.js';

const MAX_MESSAGE_CHARS = 4000;
const MAX_ATTACHMENTS = 4;

function json(data, status, env, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(env, origin) }
  });
}

function sseHeaders(env, origin) {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    ...corsHeaders(env, origin)
  };
}

function bearer(req) {
  const h = req.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

async function readJSON(req, maxBytes = 7_000_000) {
  const text = await req.text();
  if (text.length > maxBytes) throw new Error('payload_too_large');
  if (!text) return {};
  return JSON.parse(text);
}

function normalizeAttachments(input, env) {
  if (!Array.isArray(input)) return { ok: true, attachments: [], meta: [] };
  const maxBytes = Number(env.MAX_ATTACHMENT_BYTES || 4500000);
  const out = [];
  const meta = [];
  let total = 0;
  for (const a of input.slice(0, MAX_ATTACHMENTS)) {
    if (!a || typeof a.data !== 'string' || !a.mime) continue;
    const bytes = Math.floor((a.data.length * 3) / 4);
    total += bytes;
    if (total > maxBytes) return { ok: false, reason: 'attachment_too_large' };
    out.push({ kind: a.kind === 'plan' ? 'plan' : 'image', mime: String(a.mime).slice(0, 80), data: a.data });
    meta.push({ kind: a.kind === 'plan' ? 'plan' : 'image', mime: String(a.mime).slice(0, 80), name: String(a.name || '').slice(0, 120), bytes });
  }
  return { ok: true, attachments: out, meta };
}

function bufToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Merge the server brief with the client's grounding so rendering works even
// before the server-side brief has filled in.
function buildRenderContext(context, grounding) {
  const brief = (grounding && grounding.brief) || {};
  const rooms = (grounding && grounding.rooms) || [];
  const c = context || {};
  const hasSpaces = c.spaces && c.spaces.length;
  const briefSpaces = brief.spaces && brief.spaces.length;
  const spaces = hasSpaces ? c.spaces : (briefSpaces ? brief.spaces : rooms.map((r) => ({ name: r.name })));
  const style = (c.style && c.style.directions && c.style.directions.length) ? c.style : (brief.style || c.style);
  const project = (c.project && (c.project.spaceType || c.project.type)) ? c.project : (brief.project || c.project);
  return {
    project: project,
    spaces: spaces,
    style: style,
    preferences: c.preferences || brief.preferences,
    painPoints: (c.painPoints && c.painPoints.length) ? c.painPoints : (brief.painPoints || [])
  };
}

function normalizeRoomImages(input, env) {
  if (!Array.isArray(input)) return [];
  const maxBytes = Number(env.MAX_ATTACHMENT_BYTES || 4500000);
  const out = [];
  let total = 0;
  for (const a of input.slice(0, 2)) {
    if (!a || typeof a.data !== 'string' || !a.mime) continue;
    total += Math.floor((a.data.length * 3) / 4);
    if (total > maxBytes) break;
    out.push({ kind: 'image', mime: String(a.mime).slice(0, 80), data: a.data });
  }
  return out;
}

async function requireSession(env, req) {
  const token = bearer(req);
  if (!token) return { ok: false, status: 401, error: 'missing_token' };
  const verified = await verifyToken(env.SESSION_SIGNING_KEY, token);
  if (!verified.ok) return { ok: false, status: 401, error: verified.reason };
  const session = await db.getSession(env, verified.projectId);
  if (!session) return { ok: false, status: 401, error: 'unknown_session' };
  return { ok: true, projectId: verified.projectId };
}

function toTranscript(messages) {
  return messages.map((m) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
    }

    // Fail clearly if the Worker has not been fully configured.
    if (url.pathname !== '/health' && !env.SESSION_SIGNING_KEY) {
      return json({ error: 'server_not_configured' }, 503, env, origin);
    }

    try {
      if (url.pathname === '/health' && request.method === 'GET') {
        return json({ ok: true, time: Date.now() }, 200, env, origin);
      }

      if (url.pathname === '/session/start' && request.method === 'POST') {
        return await handleSessionStart(request, env, origin);
      }

      if (url.pathname === '/image' && request.method === 'POST') {
        return await handleImage(request, env, origin);
      }

      if (url.pathname === '/scope' && request.method === 'POST') {
        return await handleScope(request, env, origin);
      }

      if (url.pathname === '/plan/rooms' && request.method === 'POST') {
        return await handlePlanRooms(request, env, origin);
      }

      if (url.pathname === '/docket/enrich' && request.method === 'POST') {
        return await handleDocketEnrich(request, env, origin);
      }

      if (url.pathname === '/chat' && request.method === 'POST') {
        return await handleChat(request, env, origin);
      }

      if (url.pathname === '/context' && request.method === 'GET') {
        const auth = await requireSession(env, request);
        if (!auth.ok) return json({ error: auth.error }, auth.status, env, origin);
        const latest = await db.latestContext(env, auth.projectId);
        return json({ context: latest.context || emptyContext(), version: latest.version }, 200, env, origin);
      }

      if (url.pathname === '/context' && request.method === 'PUT') {
        const auth = await requireSession(env, request);
        if (!auth.ok) return json({ error: auth.error }, auth.status, env, origin);
        const body = await readJSON(request);
        if (body.context === undefined) return json({ error: 'missing_context' }, 400, env, origin);
        const version = await db.saveContext(env, auth.projectId, body.context, 'user');
        await db.addAudit(env, auth.projectId, 'context.edit', { version });
        return json({ version }, 200, env, origin);
      }

      if (url.pathname === '/audit' && request.method === 'POST') {
        const auth = await requireSession(env, request);
        if (!auth.ok) return json({ error: auth.error }, auth.status, env, origin);
        const body = await readJSON(request);
        await db.addAudit(env, auth.projectId, String(body.kind || 'unknown').slice(0, 60), body.detail || {});
        return json({ ok: true }, 200, env, origin);
      }

      return json({ error: 'not_found' }, 404, env, origin);
    } catch (err) {
      const message = String(err && err.message ? err.message : err);
      const status = message === 'payload_too_large' ? 413 : 500;
      return json({ error: message }, status, env, origin);
    }
  }
};

async function handleSessionStart(request, env, origin) {
  const body = await readJSON(request);
  const ip = request.headers.get('CF-Connecting-IP') || undefined;
  const check = await verifyTurnstile(env, body.turnstileToken, ip);
  if (!check.ok) return json({ error: 'turnstile_failed', reason: check.reason }, 403, env, origin);

  let projectId = typeof body.projectId === 'string' && body.projectId.length <= 64 ? body.projectId : '';
  const existing = projectId ? await db.getSession(env, projectId) : null;
  if (!existing) projectId = newProjectId();

  const token = await issueToken(env.SESSION_SIGNING_KEY, projectId);
  const tokenHash = await sha256Hex(token);
  await db.upsertSession(env, projectId, tokenHash);

  let latest = await db.latestContext(env, projectId);
  if (!latest.context) {
    await db.saveContext(env, projectId, emptyContext(), 'ai');
    latest = { version: 1, context: emptyContext() };
  }

  return json({ projectId, token, context: latest.context, version: latest.version }, 200, env, origin);
}

async function handleChat(request, env, origin) {
  const auth = await requireSession(env, request);
  if (!auth.ok) return json({ error: auth.error }, auth.status, env, origin);

  const body = await readJSON(request);
  const message = typeof body.message === 'string' ? body.message.slice(0, MAX_MESSAGE_CHARS) : '';
  const att = normalizeAttachments(body.attachments, env);
  if (!att.ok) return json({ error: att.reason }, 413, env, origin);
  if (!message && att.attachments.length === 0) {
    return json({ error: 'empty_message' }, 400, env, origin);
  }

  const rate = await checkSessionRate(env, auth.projectId);
  if (!rate.ok) return json({ error: 'rate_limited', limit: rate.limit }, 429, env, origin);

  const daily = await checkAndIncrementDaily(env);
  if (!daily.ok) return json({ error: 'daily_cap', cap: daily.cap }, 429, env, origin);

  await db.addMessage(env, auth.projectId, 'user', message, att.meta);
  await db.touchSession(env, auth.projectId);

  const latest = await db.latestContext(env, auth.projectId);
  let context = latest.context || emptyContext();
  const history = await db.recentMessages(env, auth.projectId, 20);

  if (!env.GEMINI_API_KEY) {
    return json({ error: 'model_not_configured' }, 503, env, origin);
  }

  const grounding = body.state && typeof body.state === 'object' ? body.state : {};
  const roomImages = normalizeRoomImages(grounding.roomImages, env);
  const groundingForPrompt = Object.assign({}, grounding);
  delete groundingForPrompt.roomImages;
  const systemInstruction = buildSystemInstruction(context, groundingForPrompt);
  const contents = toGeminiContents(history, (att.attachments || []).concat(roomImages));
  const extractionPrompt = buildExtractionPrompt(context, toTranscript(history));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event, data) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); }
        catch { closed = true; }
      };

      try {
        // Flash-Lite extraction runs concurrently with the streamed reply.
        const extractionPromise = extractStructured(env, extractionPrompt)
          .catch((e) => ({ parsed: {}, tokens: 0, error: String(e && e.message ? e.message : e) }));

        send('meta', { projectId: auth.projectId, version: latest.version });

        let full = '';
        let tokens = 0;
        try {
          // Fall back across models if one is rate-limited (429).
          const models = [env.GEMINI_FLASH_MODEL, env.GEMINI_LITE_MODEL].filter(Boolean);
          let started = false;
          let lastErr = null;
          let done = false;
          for (const m of models) {
            try {
              const reply = await streamReply(env, systemInstruction, contents, (delta) => {
                started = true;
                full += delta;
                send('reply.delta', { text: delta });
              }, m);
              full = reply.text || full;
              tokens = reply.tokens || 0;
              done = true;
              break;
            } catch (e) {
              lastErr = e;
              if (started) break; // cannot retry once tokens have streamed
            }
          }
          if (!done) throw lastErr || new Error('reply_failed');
        } catch (e) {
          console.error('reply_failed', String(e && e.message ? e.message : e));
          send('error', { message: 'assistant_unavailable' });
        }

        const extraction = await extractionPromise;
        const parsed = extraction.parsed || {};
        const patch = sanitizeContextPatch(parsed.contextPatch);
        const proposals = sanitizeProposals(parsed.proposals);

        let newVersion = latest.version;
        if (patch) {
          const merged = mergePatch(context, patch);
          newVersion = await db.saveContext(env, auth.projectId, merged, 'ai');
          send('context.patch', { patch, version: newVersion, context: merged });
          context = merged;
        }
        if (proposals.length) send('proposals', { proposals });

        // ---- Seamless visualisation: automatic at design moments, forced on request ----
        const forced = hasVisualIntent(message);
        const renderCtx = buildRenderContext(context, grounding);
        let spec = sanitizeImageSpec(parsed.image);
        if (!spec && forced && contextIsSufficient(renderCtx)) {
          spec = synthesizeImageSpec(renderCtx, message);
        }

        let images = 0;
        if (spec && contextIsSufficient(renderCtx)) {
          let backToBack = false;
          if (!forced) {
            const lastImg = await db.lastImageAt(env, auth.projectId);
            const prevUser = await db.previousUserMessageAt(env, auth.projectId);
            backToBack = lastImg > 0 && prevUser > 0 && lastImg > prevUser;
          }
          if (forced || !backToBack) {
            send('image.pending', { reason: spec.reason || 'so you can see it' });
            try {
              const size = aspectToSize(spec.aspect);
              const img = await generateImage(env, spec.prompt, { width: size.width, height: size.height });
              const b64 = bufToBase64(img.bytes);
              const dataUrl = `data:${img.mime};base64,${b64}`;
              send('image.ready', { dataUrl: dataUrl, prompt: img.prompt, reason: spec.reason || '', aspect: spec.aspect, seed: img.seed });
              images = 1;
              await db.addAudit(env, auth.projectId, 'image.generate', {
                provider: img.provider, aspect: spec.aspect, forced: !!forced, prompt: spec.prompt.slice(0, 160)
              });

              // The assistant looks at the render it just made and validates it.
              try {
                let critique = '';
                await streamCritique(
                  env, CRITIQUE_INSTRUCTION, buildCritiquePrompt(img.prompt, spec.reason), b64, img.mime,
                  (d) => { critique += d; send('critique.delta', { text: d }); }
                );
                if (critique) await db.addMessage(env, auth.projectId, 'assistant', critique, []);
              } catch (e) {
                console.error('critique_failed', String(e && e.message ? e.message : e));
              }
            } catch (e) {
              send('image.failed', { message: 'image_unavailable' });
            }
          }
        }

        await db.addMessage(env, auth.projectId, 'assistant', full, []);
        await addTokens(env, tokens + (extraction.tokens || 0));
        send('done', { version: newVersion, tokens, images });
      } catch (e) {
        send('error', { message: 'internal_error' });
      } finally {
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      }
    }
  });

  return new Response(stream, { status: 200, headers: sseHeaders(env, origin) });
}

async function handleImage(request, env, origin) {
  const auth = await requireSession(env, request);
  if (!auth.ok) return json({ error: auth.error }, auth.status, env, origin);

  const body = await readJSON(request);
  const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 800).trim() : '';
  if (!prompt) return json({ error: 'empty_prompt' }, 400, env, origin);

  const rate = await checkSessionRate(env, auth.projectId);
  if (!rate.ok) return json({ error: 'rate_limited', limit: rate.limit }, 429, env, origin);

  const daily = await checkAndIncrementDaily(env);
  if (!daily.ok) return json({ error: 'daily_cap', cap: daily.cap }, 429, env, origin);

  try {
    const img = await generateImage(env, prompt, { width: body.width, height: body.height });
    await db.addAudit(env, auth.projectId, 'image.generate', { provider: img.provider, prompt: prompt.slice(0, 200) });
    return new Response(img.bytes, {
      status: 200,
      headers: {
        'Content-Type': img.mime,
        'Cache-Control': 'no-store',
        'X-Image-Provider': img.provider,
        ...corsHeaders(env, origin)
      }
    });
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    return json({ error: 'image_failed', detail: message.slice(0, 160) }, 502, env, origin);
  }
}

async function handleScope(request, env, origin) {
  const auth = await requireSession(env, request);
  if (!auth.ok) return json({ error: auth.error }, auth.status, env, origin);

  const body = await readJSON(request);
  const att = normalizeAttachments(body.attachments, env);
  if (!att.ok) return json({ error: att.reason }, 413, env, origin);
  if (!env.GEMINI_API_KEY) return json({ error: 'model_not_configured' }, 503, env, origin);

  const rate = await checkSessionRate(env, auth.projectId);
  if (!rate.ok) return json({ error: 'rate_limited', limit: rate.limit }, 429, env, origin);
  const daily = await checkAndIncrementDaily(env);
  if (!daily.ok) return json({ error: 'daily_cap', cap: daily.cap }, 429, env, origin);

  const latest = await db.latestContext(env, auth.projectId);
  const context = latest.context || emptyContext();
  const grounding = body.state && typeof body.state === 'object' ? body.state : {};

  const attachments = att.attachments || [];
  const plan = attachments.find((a) => a.kind === 'plan') || attachments[0] || null;
  const prompt = buildScopePrompt(context, grounding, !!plan);

  try {
    const result = await extractStructured(
      env, prompt, plan ? { mime: plan.mime, data: plan.data } : null, env.GEMINI_SCOPE_MODEL
    );
    const scope = normalizeScope(result.parsed);
    if (!scope) {
      console.error('scope_empty', String(result.raw || '').slice(0, 600));
      return json({ error: 'scope_empty' }, 422, env, origin);
    }
    await db.addAudit(env, auth.projectId, 'scope.generate', {
      rooms: scope.rooms.length, source: plan ? 'plan' : 'brief'
    });
    await addTokens(env, result.tokens || 0);
    return json({ scope }, 200, env, origin);
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    console.error('scope_failed', message);
    return json({ error: 'scope_failed', detail: message.slice(0, 160) }, 502, env, origin);
  }
}

async function handlePlanRooms(request, env, origin) {
  const auth = await requireSession(env, request);
  if (!auth.ok) return json({ error: auth.error }, auth.status, env, origin);

  const body = await readJSON(request);
  const att = normalizeAttachments(body.attachments, env);
  if (!att.ok) return json({ error: att.reason }, 413, env, origin);
  if (!env.GEMINI_API_KEY) return json({ error: 'model_not_configured' }, 503, env, origin);

  const plan = (att.attachments || []).find((a) => a.kind === 'plan') || (att.attachments || [])[0];
  if (!plan) return json({ error: 'no_plan' }, 422, env, origin);

  const rate = await checkSessionRate(env, auth.projectId);
  if (!rate.ok) return json({ error: 'rate_limited', limit: rate.limit }, 429, env, origin);
  const daily = await checkAndIncrementDaily(env);
  if (!daily.ok) return json({ error: 'daily_cap', cap: daily.cap }, 429, env, origin);

  const latest = await db.latestContext(env, auth.projectId);
  const context = latest.context || emptyContext();

  try {
    const result = await extractStructured(
      env, buildRoomsPrompt(context, true), { mime: plan.mime, data: plan.data }, env.GEMINI_SCOPE_MODEL
    );
    const parsedRooms = normalizeRooms(result.parsed);
    if (!parsedRooms) {
      console.error('plan_rooms_empty', String(result.raw || '').slice(0, 500));
      return json({ error: 'rooms_empty' }, 422, env, origin);
    }
    await db.addAudit(env, auth.projectId, 'plan.read_rooms', { rooms: parsedRooms.rooms.length });
    await addTokens(env, result.tokens || 0);
    return json({ rooms: parsedRooms.rooms }, 200, env, origin);
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    console.error('plan_rooms_failed', message);
    return json({ error: 'plan_rooms_failed', detail: message.slice(0, 160) }, 502, env, origin);
  }
}

async function handleDocketEnrich(request, env, origin) {
  const auth = await requireSession(env, request);
  if (!auth.ok) return json({ error: auth.error }, auth.status, env, origin);

  const body = await readJSON(request);
  const docket = body.docket;
  if (!docket || !Array.isArray(docket.sections)) return json({ error: 'no_docket' }, 400, env, origin);
  if (!env.GEMINI_API_KEY) return json({ error: 'model_not_configured' }, 503, env, origin);

  const rate = await checkSessionRate(env, auth.projectId);
  if (!rate.ok) return json({ error: 'rate_limited', limit: rate.limit }, 429, env, origin);
  const daily = await checkAndIncrementDaily(env);
  if (!daily.ok) return json({ error: 'daily_cap', cap: daily.cap }, 429, env, origin);

  const grounding = body.grounding && typeof body.grounding === 'object' ? body.grounding : {};
  const prompt = buildDocketPrompt(docket, grounding);
  const models = [env.GEMINI_DOCKET_MODEL, env.GEMINI_FLASH_MODEL, env.GEMINI_LITE_MODEL].filter(Boolean);

  let result = null;
  let lastErr = null;
  for (const m of models) {
    try { result = await extractStructured(env, prompt, null, m); break; }
    catch (e) { lastErr = e; }
  }
  if (!result) {
    const msg = String(lastErr && lastErr.message ? lastErr.message : lastErr);
    console.error('enrich_failed', msg);
    return json({ error: 'enrich_failed', detail: msg.slice(0, 160) }, 502, env, origin);
  }

  const enrichment = sanitizeDocketEnrichment(result.parsed, docket);
  if (!enrichment) {
    console.error('enrich_empty', String(result.raw || '').slice(0, 400));
    return json({ error: 'enrich_empty' }, 422, env, origin);
  }
  enrichment.model = models[0];
  await db.addAudit(env, auth.projectId, 'docket.enrich', { docket: docket.id });
  await addTokens(env, result.tokens || 0);
  return json({ enrichment }, 200, env, origin);
}
