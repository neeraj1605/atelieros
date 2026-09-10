// Image generation with a swappable provider.
// Default: Pollinations.ai (free, no API key). FLUX-based, but free-tier latency
// varies a lot, so we retry once and cap each attempt with a timeout.
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

function clamp(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Wrap the user's idea in interior-render prompt scaffolding.
export function buildRenderPrompt(input) {
  const clean = String(input || '').replace(/\s+/g, ' ').trim().slice(0, 700);
  return [
    'photorealistic interior design render',
    clean,
    'warm natural light, soft shadows, realistic materials, high detail, architectural photography, magazine quality, no text, no watermark, no people'
  ].filter(Boolean).join(', ');
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { headers: { 'User-Agent': 'PlanexAI/1.0' }, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function generateImage(env, prompt, opts = {}) {
  const provider = env.IMAGE_PROVIDER || 'pollinations';
  const model = env.IMAGE_MODEL || 'flux';
  const width = clamp(opts.width, 512, 1280, 1024);
  const height = clamp(opts.height, 512, 1280, 768);
  const full = buildRenderPrompt(prompt);

  if (provider === 'pollinations') {
    const seed = Number.isFinite(Number(opts.seed)) ? Number(opts.seed) : Math.floor(Math.random() * 1e9);
    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(full)}?width=${width}&height=${height}&nologo=true&model=${encodeURIComponent(model)}&seed=${seed}`;

    const attempts = 2;
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetchWithTimeout(url, 75000);
        if (!res.ok) throw new Error('image_provider_' + res.status);
        const bytes = await res.arrayBuffer();
        if (!bytes || bytes.byteLength < 1000) throw new Error('image_empty');
        const mime = res.headers.get('content-type') || 'image/jpeg';
        return { bytes, mime, provider, url, prompt: full, seed, model };
      } catch (e) {
        lastErr = e;
        if (i < attempts - 1) await sleep(1500);
      }
    }
    throw lastErr || new Error('image_failed');
  }

  throw new Error('image_provider_unsupported:' + provider);
}
