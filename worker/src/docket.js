// Design-docket AI enrichment: tailor schedules with Indian-market makes and specs.
// Quantities and prices are NEVER touched.
import { isPlainObject } from './merge.js';

export function buildDocketPrompt(docket, grounding) {
  const lines = [];
  lines.push(`You are a senior Indian interior design + MEP consultant (20 years) preparing the "${docket.name}" for site execution agencies and suppliers.`);
  lines.push('Enrich the schedules below with India-market makes, models, specifications, finishes, shades, CCT/lux and hardware.');
  lines.push('RULES:');
  lines.push('- Return ONLY the enrichment JSON described below.');
  lines.push('- Do NOT change quantities. NEVER include prices or rates.');
  lines.push('- Use REAL Indian makes/models (e.g. Asian Paints, Nerolac, Berger, Saint-Gobain Gyproc, Hettich, Hafele, Ebco, Blum, Havells, Legrand, Anchor, Philips, Wipro, Jaquar, Kohler, Grohe, Hindware, Cera, Kajaria, Somany, Nitco, Century, Greenply, Merino, Greenlam, Astral, Ashirvad).');
  lines.push('- Keep every value short (<= 60 characters). Return one value per row, in row order.');
  lines.push('- If a row is outside your scope, return an empty string for that row.');
  lines.push('- "notes" must be 2-4 crisp execution notes specific to this docket.');
  lines.push('OUTPUT SHAPE: {"notes":"...","sections":{"<sectionKey>":{"<exact column title>":["row1 value","row2 value"]}}}');
  lines.push('PROJECT: ' + JSON.stringify({
    projectType: grounding && grounding.projectType,
    quality: grounding && grounding.quality,
    brief: grounding && grounding.brief
  }));
  lines.push('DOCKET: ' + JSON.stringify({
    id: docket.id,
    name: docket.name,
    sections: (docket.sections || []).map((s) => ({ key: s.key, title: s.title, columns: s.columns, rows: s.rows }))
  }));
  return lines.join('\n');
}

const BLOCKED_COLUMNS = ['Qty', 'Quantity', 'Amount', 'Rate', 'Price', 'Total'];

export function sanitizeDocketEnrichment(raw, docket) {
  if (!isPlainObject(raw)) return null;
  const out = {
    notes: typeof raw.notes === 'string' ? raw.notes.replace(/\s+/g, ' ').trim().slice(0, 2000) : '',
    sections: {}
  };
  const byKey = {};
  (docket.sections || []).forEach((s) => { byKey[s.key] = s; });

  const rawSections = isPlainObject(raw.sections) ? raw.sections : {};
  Object.keys(rawSections).forEach((key) => {
    const sec = byKey[key];
    if (!sec) return;
    const cols = {};
    const rawCols = isPlainObject(rawSections[key]) ? rawSections[key] : {};
    Object.keys(rawCols).forEach((colTitle) => {
      if (sec.columns.indexOf(colTitle) < 0) return;
      if (BLOCKED_COLUMNS.indexOf(colTitle) >= 0) return; // quantities/prices are immutable
      const rows = sec.rows || [];
      const val = rawCols[colTitle];
      if (Array.isArray(val)) {
        cols[colTitle] = val.slice(0, rows.length).map((v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, 80));
      } else if (typeof val === 'string') {
        cols[colTitle] = val.replace(/\s+/g, ' ').trim().slice(0, 80);
      }
    });
    if (Object.keys(cols).length) out.sections[key] = cols;
  });

  if (!out.notes && Object.keys(out.sections).length === 0) return null;
  return out;
}
