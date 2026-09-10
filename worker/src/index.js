// Planex AI — Cloudflare Worker entry point.
// Routes: /health, /session/start, /chat (SSE), /context, /audit
import { corsHeaders } from './cors.js';
import { issueToken, verifyToken, newProjectId, sha256Hex } from './session.js';
import { verifyTurnstile } from './turnstile.js';
import { checkAndIncrementDaily, checkSessionRate, addTokens } from './quota.js';
import * as db from './db.js';
import { mergePatch } from './merge.js';
import { sanitizeContextPatch, sanitizeProposals, emptyContext } from './schema.js';
import { buildSystemInstruction, buildExtractionPrompt } from './prompts.js';
import { toGeminiContents, streamReply, extractStructured } from './gemini.js';

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
  const context = latest.context || emptyContext();
  const history = await db.recentMessages(env, auth.projectId, 20);

  if (!env.GEMINI_API_KEY) {
    return json({ error: 'model_not_configured' }, 503, env, origin);
  }

  const grounding = body.state && typeof body.state === 'object' ? body.state : {};
  const systemInstruction = buildSystemInstruction(context, grounding);
  const contents = toGeminiContents(history, att.attachments);
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
          const reply = await streamReply(env, systemInstruction, contents, (delta) => {
            full += delta;
            send('reply.delta', { text: delta });
          });
          full = reply.text || full;
          tokens = reply.tokens || 0;
        } catch (e) {
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
        }
        if (proposals.length) send('proposals', { proposals });

        await db.addMessage(env, auth.projectId, 'assistant', full, []);
        await addTokens(env, tokens + (extraction.tokens || 0));
        send('done', { version: newVersion, tokens });
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
