// Cloudflare Turnstile verification. Called once at session start.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(env, token, remoteIp) {
  if (!env.TURNSTILE_SECRET) {
    // Not configured: fail closed so the endpoint is not silently unprotected.
    return { ok: false, reason: 'turnstile_not_configured' };
  }
  if (!token || typeof token !== 'string') return { ok: false, reason: 'missing_token' };

  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  if (remoteIp) body.append('remoteip', remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body });
    const data = await res.json();
    return data && data.success
      ? { ok: true }
      : { ok: false, reason: 'failed', codes: data && data['error-codes'] };
  } catch (err) {
    return { ok: false, reason: 'verify_error', error: String(err) };
  }
}
