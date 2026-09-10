/* ============================================================
   Planex AI — Shared context helpers (client mirror of worker)
   RFC 7386 JSON Merge Patch + the evolving brief shape.
   ============================================================ */
window.PlanexContext = (function () {
  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function mergePatch(target, patch) {
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
      return patch;
    }
    const base = isPlainObject(target) ? target : {};
    const out = Object.assign({}, base);
    Object.keys(patch).forEach(function (key) {
      const value = patch[key];
      if (value === null) {
        delete out[key];
      } else {
        out[key] = mergePatch(out[key], value);
      }
    });
    return out;
  }

  function emptyContext() {
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

  return { mergePatch: mergePatch, emptyContext: emptyContext, isPlainObject: isPlainObject };
})();
