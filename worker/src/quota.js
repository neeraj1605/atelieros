// Quota + rate limiting backed by D1.
export function today() {
  return new Date().toISOString().slice(0, 10);
}

// Global daily cap across all sessions.
export async function checkAndIncrementDaily(env) {
  const cap = Number(env.DAILY_TURN_CAP || 2000);
  const day = today();
  const row = await env.DB.prepare('SELECT turns FROM usage_counters WHERE day = ?').bind(day).first();
  const turns = row ? row.turns : 0;
  if (turns >= cap) return { ok: false, reason: 'daily_cap', turns, cap };
  await env.DB.prepare(
    `INSERT INTO usage_counters (day, turns, tokens) VALUES (?, 1, 0)
     ON CONFLICT(day) DO UPDATE SET turns = turns + 1`
  ).bind(day).run();
  return { ok: true, turns: turns + 1, cap };
}

export async function addTokens(env, count) {
  if (!count || count <= 0) return;
  const day = today();
  await env.DB.prepare(
    `INSERT INTO usage_counters (day, turns, tokens) VALUES (?, 0, ?)
     ON CONFLICT(day) DO UPDATE SET tokens = tokens + ?`
  ).bind(day, count, count).run();
}

// Per-session hourly message limit to stop a single client flooding.
export async function checkSessionRate(env, sessionId) {
  const limit = Number(env.SESSION_HOURLY_LIMIT || 30);
  const since = Date.now() - 60 * 60 * 1000;
  const row = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM messages WHERE session_id = ? AND role = ? AND created_at > ?'
  ).bind(sessionId, 'user', since).first();
  const count = row ? row.c : 0;
  if (count >= limit) return { ok: false, reason: 'session_rate', count, limit };
  return { ok: true, count, limit };
}
