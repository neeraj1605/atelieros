// Moodboard generation: room-specific, theme-aware palette + materials + intent.
import { isPlainObject } from './merge.js';

const ROLES = ['base', 'primary', 'secondary', 'accent', 'neutral', 'wood', 'metal'];

export function buildMoodboardPrompt(payload) {
  return [
    'You are a senior Indian interior designer with 20 years of practice, setting the LOOK for ONE space.',
    'Return a cohesive, implementable moodboard for this space, consistent with the home theme.',
    'RULES:',
    '- palette: 5-7 entries {"hex":"#RRGGBB","name":"colour name","role":"base|primary|secondary|accent|neutral|wood|metal"}.',
    '- materials: floor, walls, ceiling, joinery finish, soft furnishings, metal/accents — each {"surface","material","make","note"} using REAL Indian makes (e.g. Asian Paints, Nerolac, Jaquar, Kohler, Hettich, Hafele, Kajaria, Somany, Saint-Gobain, Century, Greenlam, Merino) appropriate to the quality band.',
    '- lighting: {"cct","lux","note"}.',
    '- furniture: 3-5 key pieces {"item","note"} suited to the space kind.',
    '- intent: 2-3 sentences on the design idea for this space.',
    '- dos / donts: 2-4 short, practical items each.',
    '- NEVER include prices. Do not invent rooms.',
    'OUTPUT JSON ONLY: {"themeInterpretation":"...","palette":[...],"materials":[...],"lighting":{...},"furniture":[...],"intent":"...","dos":[...],"donts":[...]}',
    'SPACE: ' + JSON.stringify(payload && payload.space),
    'PROJECT: ' + JSON.stringify({
      theme: payload && payload.theme,
      projectType: payload && payload.projectType,
      quality: payload && payload.quality,
      scopePackages: payload && payload.scopePackages,
      brief: payload && payload.brief
    })
  ].join('\n');
}

function cl(v, n) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 120); }
function hexOk(h) { return typeof h === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h.trim()); }

export function sanitizeMoodboard(raw) {
  if (!isPlainObject(raw)) return null;

  const palette = (Array.isArray(raw.palette) ? raw.palette : []).slice(0, 8).map(function (c) {
    if (!isPlainObject(c) || !hexOk(c.hex)) return null;
    const role = cl(c.role, 20).toLowerCase();
    return { hex: c.hex.trim(), name: cl(c.name, 40), role: ROLES.indexOf(role) >= 0 ? role : 'accent' };
  }).filter(Boolean);

  const materials = (Array.isArray(raw.materials) ? raw.materials : []).slice(0, 8).map(function (m) {
    if (!isPlainObject(m) || !cl(m.surface, 30)) return null;
    return { surface: cl(m.surface, 30), material: cl(m.material, 90), make: cl(m.make, 60), note: cl(m.note, 120) };
  }).filter(Boolean);

  const furniture = (Array.isArray(raw.furniture) ? raw.furniture : []).slice(0, 6).map(function (f) {
    if (!isPlainObject(f) || !cl(f.item, 60)) return null;
    return { item: cl(f.item, 60), note: cl(f.note, 120) };
  }).filter(Boolean);

  const lighting = isPlainObject(raw.lighting)
    ? { cct: cl(raw.lighting.cct, 20), lux: cl(raw.lighting.lux, 40), note: cl(raw.lighting.note, 160) }
    : {};

  const out = {
    themeInterpretation: cl(raw.themeInterpretation, 300),
    palette: palette,
    materials: materials,
    lighting: lighting,
    furniture: furniture,
    intent: cl(raw.intent, 400),
    dos: (Array.isArray(raw.dos) ? raw.dos : []).slice(0, 5).map(function (d) { return cl(d, 140); }).filter(Boolean),
    donts: (Array.isArray(raw.donts) ? raw.donts : []).slice(0, 5).map(function (d) { return cl(d, 140); }).filter(Boolean)
  };

  if (!out.palette.length && !out.materials.length && !out.intent) return null;
  return out;
}
