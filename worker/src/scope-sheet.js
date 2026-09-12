// Scope-sheet AI enrichment: product/spec detail per line + trade inclusions,
// exclusions and no-assumption notes. Quantities and prices are NEVER touched.
import { isPlainObject } from './merge.js';

export function buildScopeSheetEnrichPrompt(payload) {
  const sheet = (payload && payload.sheet) || {};
  const lines = (sheet.lines || []).map(function (l) {
    return { id: l.id, description: l.description, detail: l.detail || '', room: l.room || '', qty: l.qty, unit: l.unit, spec: l.spec || '' };
  });
  return [
    'You are a senior Indian interior design + MEP consultant (20 years) preparing a VENDOR-FACING scope sheet so a trade vendor can quote with ZERO assumptions.',
    'For each scheduled line, fill the product detail the vendor needs:',
    '- spec: exact material/type/size/make as a short spec.',
    '- make: brand / tier appropriate to the quality band (real Indian makes).',
    '- size: dimensions (mm) where relevant, else "As per site".',
    '- finish: finish/shade/sheen where relevant, else "".',
    '- method: ONLY fill if the line has no measurement method.',
    'Also return: inclusions[], exclusions[], assumptions[] (site conditions the vendor must confirm), noAssumptionNotes[] (crisp notes that remove ambiguity).',
    'RULES:',
    '- Do NOT change quantities. NEVER include prices, rates or amounts.',
    '- Use REAL Indian makes appropriate to the quality band.',
    '- Keep every value short (<= 80 chars); notes <= 140 chars.',
    '- Return values for the given line ids only; omit lines you cannot improve.',
    'OUTPUT JSON ONLY: {"byLineId":{"<id>":{"spec":"...","make":"...","size":"...","finish":"...","method":"..."}},"inclusions":[],"exclusions":[],"assumptions":[],"noAssumptionNotes":[]}',
    'PROJECT: ' + JSON.stringify({
      projectType: payload && payload.projectType,
      quality: payload && payload.quality,
      rooms: (payload && payload.rooms) || [],
      planSummary: (payload && payload.planSummary) || null,
      moodboard: (payload && payload.moodboard) || null,
      theme: (payload && payload.theme) || null
    }),
    'SHEET: ' + JSON.stringify({ packageId: sheet.packageId, trade: sheet.trade, title: sheet.title, lines: lines })
  ].join('\n');
}

const ALLOWED = ['spec', 'make', 'size', 'finish', 'method'];
const BLOCKED = /^(qty|quantity|rate|price|amount|total|cost)$/i;
function cl(v, n) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 80); }
function strList(v, max, len) {
  return (Array.isArray(v) ? v : []).slice(0, max).map(function (x) { return cl(x, len || 140); }).filter(Boolean);
}

export function sanitizeScopeSheetEnrichment(raw, sheet) {
  if (!isPlainObject(raw)) return null;
  const valid = new Set((sheet && sheet.lines ? sheet.lines : []).map(function (l) { return l.id; }));
  const byLineId = {};
  const rawLines = isPlainObject(raw.byLineId) ? raw.byLineId : {};
  Object.keys(rawLines).forEach(function (id) {
    if (!valid.has(id)) return;
    const e = rawLines[id];
    if (!isPlainObject(e)) return;
    const item = {};
    ALLOWED.forEach(function (k) {
      if (BLOCKED.test(k)) return;
      if (e[k] != null && e[k] !== '') item[k] = cl(e[k], k === 'method' ? 200 : 80);
    });
    if (Object.keys(item).length) byLineId[id] = item;
  });
  const out = {
    byLineId: byLineId,
    inclusions: strList(raw.inclusions, 12, 160),
    exclusions: strList(raw.exclusions, 12, 160),
    assumptions: strList(raw.assumptions, 14, 180),
    noAssumptionNotes: strList(raw.noAssumptionNotes, 10, 180)
  };
  if (!Object.keys(byLineId).length && !out.inclusions.length && !out.assumptions.length && !out.noAssumptionNotes.length) return null;
  return out;
}
