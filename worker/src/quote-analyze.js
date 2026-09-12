// Vendor quote analysis: read an uploaded quotation (PDF/image) and compare it
// to the issued Scope Sheet. Advisory only — never invents rates.
import { isPlainObject } from './merge.js';

export function buildQuoteAnalyzePrompt(payload) {
  const sheet = (payload && payload.sheet) || {};
  const lines = (sheet.lines || []).map(function (l) {
    return { id: l.id, description: l.description, spec: l.spec || '', qty: l.qty, unit: l.unit, basis: l.basis };
  });
  return [
    'You read a vendor quotation for an Indian interior fit-out and compare it to the issued scope sheet.',
    'Extract what the vendor actually quoted, then map each quoted line to a scope-sheet line id where possible.',
    'Return ONLY valid JSON:',
    '{"vendorName":"...","currency":"INR","total":0,"lineItems":[{"description":"...","qty":0,"unit":"...","rate":0,"amount":0,"sheetLineId":null,"confidence":"high|medium|low"}],"coverage":{"quoted":["<sheetLineId>"],"missing":["<sheetLineId>"],"extra":["..."]},"compliance":{"deviations":[{"sheetLineId":"...","field":"spec|size|finish|basis|qty","expected":"...","found":"...","severity":"high|medium|low"}],"basisMismatches":["..."]},"summary":"..."}',
    'RULES:',
    '- Report only what is present in the quotation. If the total is not stated, omit it (0).',
    '- NEVER invent a rate or a line that is not in the document.',
    '- sheetLineId must be one of the provided ids, or null if unmatched.',
    '- confidence reflects how certain the extraction/mapping is.',
    '- summary: 2-3 sentences a user can act on (what is missing, what deviates, what to confirm).',
    'SCOPE SHEET LINES: ' + JSON.stringify(lines),
    'SHEET: ' + JSON.stringify({ packageId: sheet.packageId, trade: sheet.trade, projectType: sheet.projectType, quality: sheet.quality })
  ].join('\n');
}

function cl(v, n) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 160); }
function nm(v) { const n = Number(v); return isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0; }
function conf(v) { const s = cl(v, 10).toLowerCase(); return ['high', 'medium', 'low'].indexOf(s) >= 0 ? s : 'low'; }
function strList(v, max, len) { return (Array.isArray(v) ? v : []).slice(0, max).map(function (x) { return cl(x, len); }).filter(Boolean); }

export function sanitizeQuoteAnalysis(raw, sheet) {
  if (!isPlainObject(raw)) return null;
  const ids = new Set((sheet && sheet.lines ? sheet.lines : []).map(function (l) { return l.id; }));
  const idOk = function (v) { return ids.has(v) ? v : null; };

  const lineItems = (Array.isArray(raw.lineItems) ? raw.lineItems : []).slice(0, 200).map(function (li) {
    if (!isPlainObject(li)) return null;
    const desc = cl(li.description, 200);
    if (!desc) return null;
    return {
      description: desc,
      qty: nm(li.qty),
      unit: cl(li.unit, 20),
      rate: nm(li.rate),
      amount: nm(li.amount),
      sheetLineId: idOk(li.sheetLineId),
      confidence: conf(li.confidence)
    };
  }).filter(Boolean);

  const cov = isPlainObject(raw.coverage) ? raw.coverage : {};
  const devRaw = isPlainObject(raw.compliance) ? raw.compliance : {};
  const deviations = (Array.isArray(devRaw.deviations) ? devRaw.deviations : []).slice(0, 100).map(function (d) {
    if (!isPlainObject(d)) return null;
    const field = cl(d.field, 20).toLowerCase();
    return {
      sheetLineId: idOk(d.sheetLineId),
      field: ['spec', 'size', 'finish', 'basis', 'qty'].indexOf(field) >= 0 ? field : 'spec',
      expected: cl(d.expected, 160),
      found: cl(d.found, 160),
      severity: conf(d.severity)
    };
  }).filter(Boolean);

  const out = {
    vendorName: cl(raw.vendorName, 120),
    currency: cl(raw.currency, 6) || 'INR',
    total: nm(raw.total),
    lineItems: lineItems,
    coverage: {
      quoted: (Array.isArray(cov.quoted) ? cov.quoted : []).slice(0, 200).map(idOk).filter(Boolean),
      missing: (Array.isArray(cov.missing) ? cov.missing : []).slice(0, 200).map(idOk).filter(Boolean),
      extra: strList(cov.extra, 60, 160)
    },
    compliance: {
      deviations: deviations,
      basisMismatches: strList(devRaw.basisMismatches, 40, 160)
    },
    summary: cl(raw.summary, 600)
  };
  if (!out.lineItems.length && !out.total && !out.summary) return null;
  return out;
}
