// Architectural design-intent notes for the drawing set sheets.
// The model supplies planning expertise; geometry and dimensions stay deterministic.
import { isPlainObject } from './merge.js';

const SHEET_KINDS = ['main', 'furniture', 'ceiling', 'lighting'];

export function buildSheetsPrompt(payload) {
  return [
    'You are a principal architect and interior designer with 20 years of Indian residential practice.',
    'Write the DESIGN INTENT notes for an architectural drawing set so a site team can execute.',
    'For each sheet give 3-5 crisp, specific notes that reference the actual rooms provided.',
    'RULES:',
    '- Never invent rooms; use only the rooms listed.',
    '- Never state dimensions, quantities or rates — the drawings carry those.',
    '- Keep each note under 140 characters, imperative and practical.',
    'SCHEMES TO COVER:',
    '- main: setting-out — adjacencies, circulation, entry and sightlines, clustering wet areas, column/beam coordination, optional Vastu cues.',
    '- furniture: arrangement — anchor walls, focal points, circulation clearances (900 mm), storage wall, TV/feature wall.',
    '- ceiling: intent — perimeter drop + centre level, cove strategy, feature zone, AC and light cut-out discipline, access panels.',
    '- lighting: scheme — ambient/task/accent layers, CCT by room (living 3000K, kitchen/study 4000K), lux targets, switching and dimming.',
    'OUTPUT JSON ONLY: {"sheets":{"main":{"notes":["..."]},"furniture":{"notes":["..."]},"ceiling":{"notes":["..."]},"lighting":{"notes":["..."]}}}',
    'PROJECT: ' + JSON.stringify({
      projectType: payload && payload.projectType,
      quality: payload && payload.quality,
      brief: payload && payload.brief,
      envelope: payload && payload.envelope
    }),
    'ROOMS: ' + JSON.stringify((payload && payload.rooms) || [])
  ].join('\n');
}

export function sanitizeSheetNotes(raw) {
  if (!isPlainObject(raw)) return null;
  const src = isPlainObject(raw.sheets) ? raw.sheets : {};
  const out = {};
  let any = false;

  SHEET_KINDS.forEach(function (k) {
    const s = src[k];
    if (!isPlainObject(s)) return;
    const notes = Array.isArray(s.notes) ? s.notes : [];
    const clean = notes.slice(0, 8).map(function (n) {
      return String(n == null ? '' : n).replace(/\s+/g, ' ').trim().slice(0, 180);
    }).filter(Boolean);
    if (clean.length) { out[k] = { notes: clean }; any = true; }
  });

  return any ? out : null;
}
