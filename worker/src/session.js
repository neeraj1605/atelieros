// Session identity: anonymous project id + HMAC-signed token.
// Uses Web Crypto (available in Workers and Node 22) so it is unit-testable.
const enc = new TextEncoder();

function b64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToString(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b64);
}

export function newProjectId() {
  return crypto.randomUUID();
}

export async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// token = projectId.expiryMs.signature
export async function issueToken(secret, projectId, ttlMs = 1000 * 60 * 60 * 24 * 7) {
  const exp = Date.now() + ttlMs;
  const sig = await hmacSign(secret, `${projectId}.${exp}`);
  return `${projectId}.${exp}.${sig}`;
}

export async function verifyToken(secret, token) {
  if (typeof token !== 'string') return { ok: false, reason: 'missing' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [projectId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!projectId || !Number.isFinite(exp)) return { ok: false, reason: 'malformed' };
  if (Date.now() > exp) return { ok: false, reason: 'expired' };
  const expected = await hmacSign(secret, `${projectId}.${exp}`);
  if (!timingSafeEqual(expected, sig)) return { ok: false, reason: 'bad_signature' };
  return { ok: true, projectId, exp };
}

// Exported for tests only.
export const __test = { b64url, b64urlToString, timingSafeEqual };
