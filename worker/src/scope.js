// Scope building — room-wise, category-wise interior scope for Indian homes.
// Encodes the work-package taxonomy an interior professional scopes against.
import { isPlainObject } from './merge.js';

export const ROOM_TYPES = [
  'Living Room', 'Dining Room', 'Kitchen', 'Master Bedroom', 'Kids Bedroom',
  'Guest Bedroom', 'Study / Home Office', 'Master Bathroom', 'Common Bathroom',
  'Foyer / Entrance', 'Pooja Room', 'Balcony', 'Utility', 'Staircase',
  'Terrace', 'Servant Room'
];

// Work packages (categories) with typical Indian-residential items used as hints.
export const SCOPE_CATEGORIES = [
  { name: 'Demolition & Debris', typical: ['Dismantling of existing finishes', 'Breakage of masonry', 'Rubble removal & disposal'] },
  { name: 'Civil & Masonry', typical: ['Brickwork', 'Internal plaster', 'POP punning', 'Lintels & thresholds', 'Crack repair'] },
  { name: 'Waterproofing', typical: ['Wet-area waterproofing', 'Sunken slab treatment', 'Balcony / terrace waterproofing'] },
  { name: 'Flooring', typical: ['Vitrified tiles', 'Italian marble', 'Granite', 'Engineered wood / laminate', 'Anti-skid tiles', 'Screed & levelling', 'Grouting'] },
  { name: 'Skirting, Thresholds & Sills', typical: ['Skirting', 'Door thresholds', 'Window sills'] },
  { name: 'Wall Finishes & Cladding', typical: ['Putty & levelling', 'Texture paint', 'Wallpaper', 'Fluted / WPC louvers', '3D wall panels', 'Dado tiling', 'Wainscoting', 'Stone cladding'] },
  { name: 'Painting & Polishing', typical: ['Primer coat', 'Interior emulsion', 'Enamel on woodwork', 'Texture coat', 'Melamine / PU polish'] },
  { name: 'False Ceiling', typical: ['Gypsum ceiling', 'POP ceiling', 'Grid ceiling', 'Cove & cornice', 'Access panel'] },
  { name: 'Electrical & Wiring', typical: ['Conduit & wiring', 'Light points', 'Fan points', '6A / 16A sockets', 'Modular switches', 'DB & MCBs', 'Earthing', 'Inverter point'] },
  { name: 'Lighting', typical: ['Cove lighting', 'Profile lights', 'Spot / track lights', 'Pendant lights', 'Wall sconces', 'Mirror light', 'Chandelier'] },
  { name: 'Plumbing & Sanitary (WC)', typical: ['Concealed plumbing (CPVC)', 'Drainage lines', 'WC / commode', 'Wash basin', 'Faucets & diverters', 'Rain shower', 'Health faucet', 'Floor trap', 'Geyser point', 'RO / washing machine point'] },
  { name: 'Modular & Joinery (Millwork)', typical: ['Wardrobe', 'TV unit', 'Crockery unit', 'Study table', 'Shoe rack', 'Foyer unit', 'Bookshelf', 'Bar unit', 'Wall panelling'] },
  { name: 'Kitchen Systems', typical: ['Base / wall / tall units', 'Carcass & shutters', 'Countertop', 'Backsplash', 'Chimney & hob', 'Sink & faucet', 'Pantry pull-outs', 'Corner carousels', 'Waste bin', 'Cutlery tray'] },
  { name: 'Wardrobe Internals', typical: ['Hanging rods', 'Shelves', 'Drawers', 'Pull-outs', 'Internal mirror', 'Internal lighting'] },
  { name: 'Bathroom Systems', typical: ['Vanity unit', 'Mirror cabinet', 'Shower partition', 'Shower niche', 'Exhaust fan', 'Storage'] },
  { name: 'Doors & Windows', typical: ['Main door', 'Internal doors', 'Frames & architraves', 'Hardware & locks', 'Sliding / folding doors', 'UPVC / aluminium windows', 'Window grills', 'Mosquito mesh'] },
  { name: 'Loose Furniture', typical: ['Sofa set', 'Beds & mattresses', 'Dining table & chairs', 'Coffee / side tables', 'Ottomans', 'Patio furniture'] },
  { name: 'Soft Furnishings', typical: ['Curtains', 'Blinds', 'Upholstery', 'Cushions', 'Rugs / carpets', 'Wall art', 'Mirrors', 'Decor accessories'] },
  { name: 'Pooja Unit', typical: ['Mandir unit', 'Storage', 'Marble cladding', 'Lighting'] },
  { name: 'Balcony & Outdoor', typical: ['Deck / anti-skid flooring', 'Railing', 'Planters', 'Seating', 'Outdoor lighting'] },
  { name: 'Home Automation & Network', typical: ['Smart switches', 'Smart curtains', 'Video door phone', 'Sensors & hub', 'Wi-Fi / data points'] },
  { name: 'HVAC & Ventilation', typical: ['AC points', 'Copper piping', 'Condensate drain', 'Cassette / ducted / VRV', 'Exhaust & ducting'] },
  { name: 'Kitchen Gas & Utility', typical: ['Gas piping', 'Water softener', 'Solar point', 'Loft storage'] },
  { name: 'Glass & Mirrors', typical: ['Glass partitions', 'Shower cubicle', 'Glass railing', 'Mirrors', 'Glass film'] },
  { name: 'Safety & Security', typical: ['CCTV', 'Smoke detectors', 'Fire safety'] },
  { name: 'Cleaning, Pest Control & Handover', typical: ['Deep cleaning', 'Pest control', 'Snag rectification', 'Handover'] }
];

const CATEGORY_NAMES = new Set(SCOPE_CATEGORIES.map((c) => c.name));
const UNITS = new Set(['sqft', 'sqm', 'rft', 'nos', 'set', 'LS', 'point', 'm', 'ft', 'kg', 'ltr']);

function str(v, max = 160) {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}
function slug(s, fallback) {
  return (str(s, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || fallback;
}

export function buildScopeInstruction() {
  return `You are a senior Indian interior design consultant (20 years) preparing a detailed SCOPE OF WORK.
You scope a home room-by-room and work-package by work-package so it can be priced and executed.

Work packages to consider (use this exact naming where applicable):
${SCOPE_CATEGORIES.map((c) => '- ' + c.name + ': ' + c.typical.join(', ')).join('\n')}

Rules:
- Cover every relevant room. For each room include ONLY the work packages that genuinely apply.
- Give concrete, Indian-market line items (materials, makes/types, sizes) — not vague headings.
- Provide a sensible unit (sqft, sqm, rft, nos, set, LS, point, m, ft) and an indicative quantity
  based on the room's dimensions when known; otherwise use 1 with unit LS.
- NEVER include prices or rates.
- Be thorough but realistic; do not pad. Aim for 4-12 items per category.
- Room names: use standard names (Living Room, Modular Kitchen, Master Bedroom, Master Bathroom, etc.).

Return ONLY valid JSON:
{
  "rooms": [
    {
      "name": "Living Room",
      "type": "living",
      "categories": [
        { "name": "Flooring", "items": [ { "name": "Vitrified tiles 600x600, Kajaria / equivalent", "unit": "sqft", "qty": 230, "note": "includes 8% wastage" } ] }
      ]
    }
  ]
}`;
}

export function buildScopePrompt(context, grounding, hasImage) {
  const hasServerBrief = context && (context.project || (context.spaces && context.spaces.length) || context.style);
  const brief = hasServerBrief ? context : ((grounding && grounding.brief) || context || {});
  const rooms = (grounding && grounding.rooms) || [];
  const lines = [
    buildScopeInstruction(),
    'PROJECT BRIEF:',
    JSON.stringify(brief || {}, null, 2)
  ];
  if (rooms.length) {
    lines.push('KNOWN ROOMS (dimensions in metres):');
    lines.push(rooms.map((r) => `- ${r.name}${r.lengthM ? ` — ${r.lengthM} x ${r.widthM} m` : ''}`).join('\n'));
  }
  if (hasImage) lines.push('The uploaded drawing is a floor plan. Read the rooms, their names and approximate sizes from it.');
  lines.push('Produce the scope JSON now.');
  return lines.join('\n\n');
}

// Validate + normalise the model's scope into a stable structure.
export function normalizeScope(raw) {
  if (!isPlainObject(raw)) return null;
  const roomsRaw = Array.isArray(raw.rooms) ? raw.rooms : [];
  const rooms = [];
  const usedRoomIds = new Set();

  for (const r of roomsRaw.slice(0, 24)) {
    if (!isPlainObject(r)) continue;
    const name = str(r.name, 80);
    if (!name) continue;

    let rid = slug(name, 'room');
    let n = 2;
    while (usedRoomIds.has(rid)) { rid = slug(name, 'room') + '-' + n++; }
    usedRoomIds.add(rid);

    const categories = [];
    const usedCatNames = new Set();
    for (const c of (Array.isArray(r.categories) ? r.categories : []).slice(0, 30)) {
      if (!isPlainObject(c)) continue;
      const cname = str(c.name, 80);
      if (!cname || usedCatNames.has(cname)) continue;
      usedCatNames.add(cname);

      const items = [];
      for (const it of (Array.isArray(c.items) ? c.items : []).slice(0, 60)) {
        if (!isPlainObject(it)) continue;
        const iname = str(it.name, 180);
        if (!iname) continue;
        const unitRaw = str(it.unit, 12);
        items.push({
          id: slug(iname, 'item') + '-' + items.length,
          name: iname,
          unit: UNITS.has(unitRaw) ? unitRaw : (unitRaw || 'LS'),
          qty: num(it.qty) || 1,
          note: str(it.note, 200),
          included: true
        });
      }
      if (items.length) {
        categories.push({
          id: slug(cname, 'cat'),
          name: cname,
          known: CATEGORY_NAMES.has(cname),
          items
        });
      }
    }
    if (categories.length) {
      rooms.push({ id: rid, name, type: str(r.type, 40) || slug(name, 'room'), categories });
    }
  }

  if (!rooms.length) return null;
  return { rooms, generatedAt: new Date().toISOString() };
}
