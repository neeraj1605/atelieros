// RFC 7386 JSON Merge Patch. Arrays and scalars replace wholesale; null deletes.
// Pure — no Cloudflare APIs, so it is unit-testable in Node.
export function mergePatch(target, patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return patch;
  }
  const base = (target && typeof target === 'object' && !Array.isArray(target)) ? target : {};
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete out[key];
    } else {
      out[key] = mergePatch(out[key], value);
    }
  }
  return out;
}

export function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
