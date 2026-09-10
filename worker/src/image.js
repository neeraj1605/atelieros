// Image generation with a swappable provider.
// Default: Pollinations.ai (free, no API key). FLUX-based.
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

function clamp(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
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

export async function generateImage(env, prompt, opts = {}) {
  const provider = env.IMAGE_PROVIDER || 'pollinations';
  const width = clamp(opts.width, 512, 1280, 1024);
  const height = clamp(opts.height, 512, 1280, 768);
  const full = buildRenderPrompt(prompt);

  if (provider === 'pollinations') {
    const seed = Math.floor(Math.random() * 1e9);
    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(full)}?width=${width}&height=${height}&nologo=true&model=flux&seed=${seed}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PlanexAI/1.0' } });
    if (!res.ok) throw new Error('image_provider_' + res.status);
    const bytes = await res.arrayBuffer();
    const mime = res.headers.get('content-type') || 'image/jpeg';
    return { bytes, mime, provider, url, prompt: full };
  }

  throw new Error('image_provider_unsupported:' + provider);
}
