// Explicit visual-request detection + spec synthesis for forced renders.
// Pure — unit-testable in Node.

const VISUAL_PATTERNS = [
  /\bshow me\b/i,
  /\blet me see\b/i,
  /\bcan i see\b/i,
  /\bcould i see\b/i,
  /\b(want|wanna|would like) to see\b/i,
  /\bvisuali[sz]e\b/i,
  /\brender(s|ing|ed)?\b/i,
  /\bmood ?board\b/i,
  /\bwhat would (it|that|this) look like\b/i,
  /\bsketch\b/i,
  /\b3d\b/i,
  /\bimage of\b/i,
  /\bpicture of\b/i,
  /\b(design|draw) (it|this|that)\b/i
];

export function hasVisualIntent(text) {
  const t = String(text || '');
  if (!t) return false;
  return VISUAL_PATTERNS.some((re) => re.test(t));
}

// Enough context to produce a meaningful image?
export function contextIsSufficient(context) {
  const c = context || {};
  const hasSpaces = Array.isArray(c.spaces) && c.spaces.length > 0;
  const hasProject = !!(c.project && (c.project.spaceType || c.project.type));
  const hasStyle = !!(c.style && Array.isArray(c.style.directions) && c.style.directions.length);
  return hasSpaces || hasProject || hasStyle;
}

// Build a render spec from the brief when the user asked to see something.
export function synthesizeImageSpec(context, text) {
  const c = context || {};
  const bits = [];
  let hasSignal = false;

  const spaces = Array.isArray(c.spaces) ? c.spaces : [];
  if (spaces[0] && spaces[0].name) { bits.push(spaces[0].name); hasSignal = true; }
  if (c.project && c.project.spaceType) { bits.push(c.project.spaceType); hasSignal = true; }
  if (c.project && c.project.location) { bits.push('in ' + c.project.location); hasSignal = true; }

  const style = c.style && c.style.directions;
  if (Array.isArray(style) && style.length) {
    bits.push(style.join(' + ') + ' style');
    hasSignal = true;
  } else {
    bits.push('modern Indian interior');
  }

  const materials = c.preferences && c.preferences.materials;
  if (Array.isArray(materials) && materials.length) { bits.push(materials.join(', ')); hasSignal = true; }
  const pain = Array.isArray(c.painPoints) ? c.painPoints : [];
  if (pain.length) { bits.push(pain.join(', ')); hasSignal = true; }

  const clean = String(text || '')
    .replace(/\b(show me|let me see|visuali[sz]e|render|please|can you|could you|what would (it|that|this) look like)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean) { bits.push(clean); hasSignal = true; }

  if (!hasSignal) return null;

  const prompt = bits.join(', ').replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim().slice(0, 600);
  if (prompt.length < 8) return null;
  return { generate: true, prompt, reason: 'requested by the user', aspect: '16:9' };
}
