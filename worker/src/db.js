// D1 data accessors.
export async function getSession(env, id) {
  return env.DB.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first();
}

export async function upsertSession(env, id, tokenHash) {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO sessions (id, token_hash, created_at, last_seen_at, turnstile_ok)
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET token_hash = excluded.token_hash, last_seen_at = excluded.last_seen_at, turnstile_ok = 1`
  ).bind(id, tokenHash, now, now).run();
}

export async function touchSession(env, id) {
  await env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(Date.now(), id).run();
}

export async function addMessage(env, sessionId, role, content, attachments) {
  await env.DB.prepare(
    'INSERT INTO messages (session_id, role, content, attachments, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(sessionId, role, content || '', JSON.stringify(attachments || []), Date.now()).run();
}

export async function recentMessages(env, sessionId, limit = 20) {
  const { results } = await env.DB.prepare(
    `SELECT role, content, created_at FROM messages
     WHERE session_id = ? ORDER BY created_at DESC LIMIT ?`
  ).bind(sessionId, limit).all();
  return (results || []).reverse();
}

export async function latestContext(env, sessionId) {
  const row = await env.DB.prepare(
    `SELECT version, context_json FROM context_versions
     WHERE session_id = ? ORDER BY version DESC LIMIT 1`
  ).bind(sessionId).first();
  if (!row) return { version: 0, context: null };
  let context = null;
  try { context = JSON.parse(row.context_json); } catch { context = null; }
  return { version: row.version, context };
}

export async function saveContext(env, sessionId, context, source = 'ai') {
  const { version } = await latestContext(env, sessionId);
  const next = version + 1;
  await env.DB.prepare(
    'INSERT INTO context_versions (session_id, version, context_json, source, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(sessionId, next, JSON.stringify(context || {}), source, Date.now()).run();
  return next;
}

export async function listContextVersions(env, sessionId, limit = 20) {
  const { results } = await env.DB.prepare(
    `SELECT version, source, created_at FROM context_versions
     WHERE session_id = ? ORDER BY version DESC LIMIT ?`
  ).bind(sessionId, limit).all();
  return results || [];
}

export async function getContextVersion(env, sessionId, version) {
  const row = await env.DB.prepare(
    'SELECT version, context_json FROM context_versions WHERE session_id = ? AND version = ?'
  ).bind(sessionId, version).first();
  if (!row) return null;
  try { return { version: row.version, context: JSON.parse(row.context_json) }; }
  catch { return null; }
}

export async function addAudit(env, sessionId, kind, detail) {
  await env.DB.prepare(
    'INSERT INTO audit_log (session_id, kind, detail, created_at) VALUES (?, ?, ?, ?)'
  ).bind(sessionId, kind, JSON.stringify(detail || {}), Date.now()).run();
}

// Timestamp of the most recent generated image (0 if none).
export async function lastImageAt(env, sessionId) {
  const row = await env.DB.prepare(
    "SELECT created_at FROM audit_log WHERE session_id = ? AND kind = 'image.generate' ORDER BY created_at DESC LIMIT 1"
  ).bind(sessionId).first();
  return row ? row.created_at : 0;
}

// Timestamp of the user message from the previous turn (0 if none).
export async function previousUserMessageAt(env, sessionId) {
  const { results } = await env.DB.prepare(
    "SELECT created_at FROM messages WHERE session_id = ? AND role = 'user' ORDER BY created_at DESC LIMIT 2"
  ).bind(sessionId).all();
  const rows = results || [];
  return rows.length >= 2 ? rows[1].created_at : 0;
}
