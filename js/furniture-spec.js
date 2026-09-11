/* ============================================================
   Planex — Furniture Specification
   Per-unit internals, hardware schedule and finishes for joinery.
   Deterministic. No prices.
   ============================================================ */
window.PlanexFurnitureSpec = (function () {

  function kindOf(name) {
    const n = String(name || '').toLowerCase();
    if (n.indexOf('wardrobe') >= 0 || n.indexOf('sliding') >= 0) return 'wardrobe';
    if (n.indexOf('tv') >= 0) return 'tv';
    if (n.indexOf('crockery') >= 0 || n.indexOf('bar') >= 0) return 'crockery';
    if (n.indexOf('study') >= 0) return 'study';
    if (n.indexOf('foyer') >= 0 || n.indexOf('shoe') >= 0) return 'foyer';
    if (n.indexOf('pooja') >= 0 || n.indexOf('puja') >= 0) return 'pooja';
    if (n.indexOf('kitchen') >= 0 || n.indexOf('base') >= 0 || n.indexOf('wall unit') >= 0 || n.indexOf('tall') >= 0) return 'kitchen';
    if (n.indexOf('bed') >= 0) return 'bed';
    if (n.indexOf('dining') >= 0) return 'dining';
    return 'generic';
  }

  function internalsFor(kind) {
    switch (kind) {
      case 'wardrobe':
        return [
          { part: 'Top shelf', size: 'full width × 350 deep', qty: 1 },
          { part: 'Hanging rod (long)', size: 'full width × 1050 clear', qty: 1 },
          { part: 'Shelves', size: 'full width × 350 deep × 350 pitch', qty: 4 },
          { part: 'Drawer bank', size: 'half width × 150/200/250 high', qty: 3 },
          { part: 'Locker', size: '300 × 350 × 300', qty: 1 },
          { part: 'Internal mirror', size: 'full height on shutter', qty: 1 },
          { part: 'Loft shutter', size: 'full width × 450 high', qty: 1 }
        ];
      case 'tv':
        return [
          { part: 'Open shelves', size: 'full width × 350 deep', qty: 3 },
          { part: 'TV niche', size: 'full width × 500 high', qty: 1 },
          { part: 'Drawers', size: 'full width × 150 high', qty: 2 },
          { part: 'Cable chase', size: '50mm dia behind', qty: 2 }
        ];
      case 'crockery':
        return [
          { part: 'Glass shelves', size: 'full width × 300 deep', qty: 4 },
          { part: 'Drawers', size: 'full width × 150 high', qty: 2 },
          { part: 'Display lighting', size: 'LED strip per shelf', qty: 4 }
        ];
      case 'study':
        return [
          { part: 'Desk top', size: '1200 × 550 × 750 high', qty: 1 },
          { part: 'Drawers', size: '400 × 500 × 150 high', qty: 3 },
          { part: 'Overhead shelf', size: 'full width × 300 deep', qty: 2 }
        ];
      case 'foyer':
        return [
          { part: 'Shoe shelves', size: 'full width × 350 deep × 200 pitch', qty: 4 },
          { part: 'Seat', size: 'full width × 400 deep × 450 high', qty: 1 },
          { part: 'Drawer', size: 'half width × 150 high', qty: 1 }
        ];
      case 'pooja':
        return [
          { part: 'Mandir niche', size: 'arched, 900 × 450 × 600 high', qty: 1 },
          { part: 'Shelves', size: 'full width × 300 deep', qty: 2 },
          { part: 'Drawer', size: 'full width × 150 high', qty: 1 },
          { part: 'Bell / lamp provision', size: '—', qty: 1 }
        ];
      case 'kitchen':
        return [
          { part: 'Base cabinet shelves', size: '560 deep, 1 mid shelf', qty: 4 },
          { part: 'Drawer bank', size: '450 wide × 150/200/250 high', qty: 3 },
          { part: 'Wall cabinet shelves', size: '300 deep, 1 shelf', qty: 2 },
          { part: 'Cutlery tray', size: 'top drawer', qty: 1 },
          { part: 'Corner carousel', size: '900 dia', qty: 1 },
          { part: 'Waste bin pull-out', size: 'under sink × 2 bins', qty: 1 },
          { part: 'Tall unit pull-outs', size: '5 shelves', qty: 1 }
        ];
      case 'bed':
        return [
          { part: 'Bed box storage', size: 'full bed size × 250 high', qty: 1 },
          { part: 'Hydraulic lift', size: 'per bed', qty: 1 }
        ];
      default:
        return [
          { part: 'Shelves', size: 'full width × 350 deep', qty: 3 },
          { part: 'Drawers', size: 'full width × 150 high', qty: 2 }
        ];
    }
  }

  function hardwareFor(kind, shutters, drawers) {
    const s = Math.max(1, Number(shutters) || 1);
    const d = Math.max(0, Number(drawers) || 0);
    const H = [];
    H.push({ item: 'Concealed hinge 110° clip-on, soft-close', spec: 'Hettich / Hafele', qty: s * 2, unit: 'nos' });
    if (d > 0) H.push({ item: 'Tandem drawer channel, soft-close', spec: 'Hettich / Blum', qty: d, unit: 'set' });
    H.push({ item: 'Handle / profile', spec: 'SS 304 / aluminium, finish per shade', qty: s + d, unit: 'nos' });
    H.push({ item: 'Soft-close buffer', spec: 'Hettich / Ebco', qty: s, unit: 'nos' });
    if (kind === 'wardrobe') {
      H.push({ item: 'Sliding track set (top + bottom)', spec: 'Hettich / Hafele', qty: 1, unit: 'set' });
      H.push({ item: 'Anti-jump roller', spec: 'Hettich', qty: 2, unit: 'nos' });
      H.push({ item: 'Locker lock', spec: 'Godrej / Ebco', qty: 1, unit: 'no' });
      H.push({ item: 'Internal LED with door switch', spec: 'Wipro / Philips', qty: 1, unit: 'set' });
    }
    if (kind === 'kitchen') {
      H.push({ item: 'SS basket / pull-out', spec: 'Ebco / Hettich', qty: 2, unit: 'nos' });
      H.push({ item: 'Cutlery tray insert', spec: 'Ebco', qty: 1, unit: 'no' });
      H.push({ item: 'Corner carousel', spec: 'Hettich / Godrej', qty: 1, unit: 'no' });
      H.push({ item: 'Waste bin pull-out', spec: 'Ebco', qty: 1, unit: 'no' });
    }
    if (kind === 'crockery') H.push({ item: 'Glass shutter hinge', spec: 'Hettich', qty: s * 2, unit: 'nos' });
    return H;
  }

  function finishFor(kind, quality) {
    const C = { economy: '18mm MR ply', standard: '18mm BWP ply (Century/Greenply)', premium: '18mm BWP marine ply' };
    const S = { economy: '0.8mm laminate (Merino)', standard: '1mm premium laminate (Merino/Greenlam)', premium: 'Duco / PU / veneer' };
    const H = { economy: 'Matt', standard: 'Matt / texture', premium: 'Satin / gloss' };
    const q = quality || 'standard';
    return [
      { surface: 'Carcass', material: C[q] || C.standard, shade: '—', sheen: '—' },
      { surface: 'Shutter (external)', material: S[q] || S.standard, shade: 'To design', sheen: H[q] || 'Matt' },
      { surface: 'Shutter (internal)', material: '0.8mm laminate', shade: 'White', sheen: 'Matt' },
      { surface: 'Back panel', material: '6mm ply + laminate', shade: '—', sheen: '—' },
      { surface: 'Edge banding', material: '2mm PVC matching shutter', shade: 'Matching', sheen: '—' },
      { surface: kind === 'kitchen' ? 'Countertop' : 'Plinth / skirting', material: kind === 'kitchen' ? 'Quartz 20mm' : 'PVC / SS 100mm', shade: 'To design', sheen: '—' }
    ];
  }

  return { kindOf: kindOf, internalsFor: internalsFor, hardwareFor: hardwareFor, finishFor: finishFor };
})();
