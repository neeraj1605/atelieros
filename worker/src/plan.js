// Read rooms + approximate dimensions from an uploaded floor plan.
import { isPlainObject } from './merge.js';

export function buildRoomsInstruction() {
  return `You read residential floor plans for interior fit-out.
Identify every enclosed room / space and estimate its dimensions in METRES.

Rules:
- Use standard room names: Living Room, Dining Room, Modular Kitchen, Master Bedroom, Kids Bedroom,
  Guest Bedroom, Study / Home Office, Master Bathroom, Common Bathroom, Foyer / Entrance,
  Pooja Room, Balcony, Utility, Staircase, Terrace, Servant Room.
- Estimate length and width in metres. If a scale or dimension annotation is visible, use it and
  set confidence "high". If not, estimate from typical Indian apartment proportions and set
  confidence "low" or "medium".
- Do NOT invent rooms that are not on the plan. Ignore furniture and labels that are not rooms.
- Return ONLY valid JSON:
{
  "rooms": [
    { "name": "Living Room", "lengthM": 5.4, "widthM": 3.9, "confidence": "high" }
  ]
}`;
}

export function buildRoomsPrompt(context, hasImage) {
  const lines = [buildRoomsInstruction()];
  if (context && context.project && context.project.spaceType) {
    lines.push('Project type: ' + context.project.spaceType);
  }
  if (hasImage) lines.push('Read the uploaded floor plan image and list every room with dimensions.');
  return lines.join('\n\n');
}

const ALLOWED_CONF = new Set(['high', 'medium', 'low']);

export function normalizeRooms(raw) {
  if (!isPlainObject(raw)) return null;
  const list = Array.isArray(raw.rooms) ? raw.rooms : [];
  const rooms = [];
  const seen = new Set();

  for (const r of list.slice(0, 30)) {
    if (!isPlainObject(r)) continue;
    const name = String(r.name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    const lengthM = Number(r.lengthM);
    const widthM = Number(r.widthM);
    if (!(lengthM > 0) || !(widthM > 0)) continue;
    if (lengthM > 60 || widthM > 60) continue;

    seen.add(key);
    rooms.push({
      id: 'room-' + key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name: name,
      lengthM: Math.round(lengthM * 100) / 100,
      widthM: Math.round(widthM * 100) / 100,
      confidence: ALLOWED_CONF.has(r.confidence) ? r.confidence : 'low',
      source: 'ai-plan'
    });
  }

  if (!rooms.length) return null;
  return { rooms };
}
