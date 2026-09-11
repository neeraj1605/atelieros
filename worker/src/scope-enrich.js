// Scope enrichment: add India-market detail/make/spec per scope activity.
// Quantities and prices are NEVER touched.
import { isPlainObject } from './merge.js';

export function buildScopeEnrichPrompt(payload) {
  const doc = payload && payload.scopeDoc;
  const activities = [];
  (doc && doc.packages ? doc.packages : []).forEach(function (p) {
    (p.activities || []).forEach(function (a) {
      activities.push({ id: a.id, room: a.room || '', category: p.name, name: a.name, detail: a.detail || '', unit: a.unit });
    });
  });
  return [
    'You are a senior Indian interior design + MEP consultant (20 years). Enrich each scope activity with a concrete, India-market specification.',
    'For each activity return a short "detail" (materials/make/type/size), a "make" (brand/tier) and a "spec" (one-line technical spec).',
    'Use REAL Indian makes appropriate to the quality band. Keep every value short (<= 60 chars).',
    'RULES: NEVER include prices or rates. NEVER change quantities. Omit activities you cannot improve.',
    'OUTPUT JSON ONLY: {"byActivityId":{"<id>":{"detail":"...","make":"...","spec":"..."}}}',
    'PROJECT: ' + JSON.stringify({
      projectType: payload && payload.projectType,
      quality: payload && payload.quality,
      brief: payload && payload.brief,
      moodboards: payload && payload.moodboards
    }),
    'ACTIVITIES: ' + JSON.stringify(activities)
  ].join('\n');
}

const BLOCKED = /^(qty|quantity|rate|price|amount|total)$/i;
function cl(v, n) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 80); }

export function sanitizeScopeEnrichment(raw, scopeDoc) {
  if (!isPlainObject(raw) || !isPlainObject(raw.byActivityId)) return null;
  const valid = new Set();
  (scopeDoc && scopeDoc.packages ? scopeDoc.packages : []).forEach(function (p) {
    (p.activities || []).forEach(function (a) { valid.add(a.id); });
  });
  const out = {};
  Object.keys(raw.byActivityId).forEach(function (id) {
    if (!valid.has(id)) return;
    const e = raw.byActivityId[id];
    if (!isPlainObject(e)) return;
    const item = {};
    ['detail', 'make', 'spec'].forEach(function (k) {
      if (!BLOCKED.test(k) && e[k] != null) item[k] = cl(e[k], k === 'detail' ? 200 : 80);
    });
    if (Object.keys(item).length) out[id] = item;
  });
  if (!Object.keys(out).length) return null;
  return { byActivityId: out };
}
