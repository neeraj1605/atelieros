// Validation + sanitisation for model output.
// Pure — unit-testable in Node.
import { isPlainObject } from './merge.js';

const MAX_PATCH_BYTES = 24000;
const MAX_PROPOSALS = 12;
const MAX_STRING = 600;
const MAX_ARRAY = 60;

const ALLOWED_TOP_KEYS = new Set([
  'project', 'spaces', 'style', 'budget', 'family', 'priorities',
  'constraints', 'preferences', 'painPoints', 'openQuestions', 'decisions', 'notes'
]);

const ALLOWED_PROPOSAL_TYPES = new Set(['boq.add', 'room.upsert', 'style.apply']);

function clampString(v) {
  if (typeof v !== 'string') return v;
  return v.length > MAX_STRING ? v.slice(0, MAX_STRING) : v;
}

// Recursively strip functions/undefined, clamp strings, and cap array lengths.
function clean(value, depth = 0) {
  if (depth > 8) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') return clampString(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY).map((v) => clean(v, depth + 1)).filter((v) => v !== undefined);
  }
  if (isPlainObject(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = clean(v, depth + 1);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return undefined;
}

// Returns a safe patch (only known top-level keys) or null if unusable.
export function sanitizeContextPatch(patch) {
  if (!isPlainObject(patch)) return null;
  const cleaned = clean(patch);
  if (!isPlainObject(cleaned)) return null;
  const out = {};
  for (const [k, v] of Object.entries(cleaned)) {
    if (ALLOWED_TOP_KEYS.has(k)) out[k] = v;
  }
  if (Object.keys(out).length === 0) return null;
  if (JSON.stringify(out).length > MAX_PATCH_BYTES) return null;
  return out;
}

// Validate and normalise proposals. Invalid entries are dropped, never thrown.
export function sanitizeProposals(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const raw of list.slice(0, MAX_PROPOSALS)) {
    if (!isPlainObject(raw)) continue;
    const type = raw.type;
    if (!ALLOWED_PROPOSAL_TYPES.has(type)) continue;
    const payload = clean(raw.payload || {});
    if (!isPlainObject(payload)) continue;

    if (type === 'boq.add') {
      const item = payload.item;
      const qty = Number(payload.qty);
      const rate = Number(payload.rate);
      if (typeof item !== 'string' || !item.trim()) continue;
      if (!Number.isFinite(qty) || qty < 0 || qty > 100000) continue;
      if (!Number.isFinite(rate) || rate < 0 || rate > 100000000) continue;
      out.push({
        id: typeof raw.id === 'string' ? raw.id.slice(0, 64) : `p-${out.length}-${Date.now()}`,
        type,
        rationale: clampString(raw.rationale || ''),
        payload: {
          room: typeof payload.room === 'string' ? payload.room : '',
          category: typeof payload.category === 'string' ? payload.category : 'Furniture',
          item: clampString(item),
          qty,
          unit: typeof payload.unit === 'string' ? payload.unit.slice(0, 16) : 'nos',
          rate
        }
      });
    } else if (type === 'room.upsert') {
      const name = payload.name;
      const lengthM = Number(payload.lengthM);
      const widthM = Number(payload.widthM);
      if (typeof name !== 'string' || !name.trim()) continue;
      if (!Number.isFinite(lengthM) || lengthM <= 0 || lengthM > 100) continue;
      if (!Number.isFinite(widthM) || widthM <= 0 || widthM > 100) continue;
      out.push({
        id: typeof raw.id === 'string' ? raw.id.slice(0, 64) : `p-${out.length}-${Date.now()}`,
        type,
        rationale: clampString(raw.rationale || ''),
        payload: {
          id: typeof payload.id === 'string' ? payload.id.slice(0, 64) : '',
          name: clampString(name),
          lengthM: Math.round(lengthM * 100) / 100,
          widthM: Math.round(widthM * 100) / 100
        }
      });
    } else if (type === 'style.apply') {
      const directions = Array.isArray(payload.directions) ? payload.directions.map(clampString).slice(0, 8) : [];
      if (directions.length === 0) continue;
      out.push({
        id: typeof raw.id === 'string' ? raw.id.slice(0, 64) : `p-${out.length}-${Date.now()}`,
        type,
        rationale: clampString(raw.rationale || ''),
        payload: {
          directions,
          palette: Array.isArray(payload.palette) ? payload.palette.map(clampString).slice(0, 12) : []
        }
      });
    }
  }
  return out;
}

// A minimal seed brief used when a brand-new session has no context yet.
export function emptyContext() {
  return {
    project: { type: '', spaceType: '', location: '' },
    spaces: [],
    style: { directions: [], palette: [], avoids: [] },
    budget: { target: 0, currency: 'INR', flexibility: '' },
    family: {},
    priorities: [],
    constraints: {},
    preferences: { materials: [], exclusions: [] },
    painPoints: [],
    openQuestions: [],
    decisions: [],
    notes: ''
  };
}

const IMAGE_ASPECTS = new Set(['16:9', '4:3', '1:1', '3:4', '9:16']);

// Validate an image spec coming from the model. Returns null unless it truly wants one.
export function sanitizeImageSpec(spec) {
  if (!isPlainObject(spec)) return null;
  if (spec.generate !== true) return null;
  const prompt = typeof spec.prompt === 'string' ? spec.prompt.replace(/\s+/g, ' ').trim() : '';
  if (prompt.length < 8) return null;
  return {
    generate: true,
    prompt: clampString(prompt).slice(0, 700),
    reason: clampString(spec.reason || ''),
    aspect: IMAGE_ASPECTS.has(spec.aspect) ? spec.aspect : '16:9'
  };
}

export function aspectToSize(aspect) {
  switch (aspect) {
    case '4:3': return { width: 1024, height: 768 };
    case '1:1': return { width: 1024, height: 1024 };
    case '3:4': return { width: 768, height: 1024 };
    case '9:16': return { width: 720, height: 1280 };
    default: return { width: 1280, height: 720 };
  }
}

export const ALLOWED_TOP = ALLOWED_TOP_KEYS;
