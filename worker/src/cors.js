// CORS helpers. Only the configured app origins may call the Worker.
export function allowedOrigins(env) {
  const raw = [env.ALLOWED_ORIGIN, env.ALLOWED_ORIGINS_EXTRA]
    .filter(Boolean)
    .join(',');
  return new Set(
    raw.split(',').map((s) => s.trim()).filter(Boolean)
  );
}

export function resolveOrigin(env, requestOrigin) {
  const allowed = allowedOrigins(env);
  if (requestOrigin && allowed.has(requestOrigin)) return requestOrigin;
  return env.ALLOWED_ORIGIN || '';
}

export function corsHeaders(env, requestOrigin) {
  return {
    'Access-Control-Allow-Origin': resolveOrigin(env, requestOrigin),
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}
