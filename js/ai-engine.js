/* ============================================================
   Planex AI — Assistant Engine
   Local, domain-aware response engine for the interior journey.
   (Backend LLM can replace `respond` via OpenRouter later.)
   ============================================================ */
window.PlanexAI = (function () {
  function respond(input, ctx) {
    const store = window.PlanexStore;
    const text = (input || '').toLowerCase().trim();
    const S = store.state;
    const fin = store.getFinancials();
    const money = (n) => store.formatMoney(n);

    const has = (...words) => words.some(w => text.includes(w));

    // Uploaded plan detection
    const planUploaded = (ctx && ctx.planUploaded) || has('site plan', 'floor plan', 'floorplan');

    if (!text && !(ctx && ctx.uploaded)) {
      return "I didn't catch that — tell me about your space or upload a photo/site plan.";
    }

    if (ctx && ctx.uploaded && !text) {
      if (ctx.uploadKind === 'plan') {
        return "Got the site plan — thanks! 📐 I've marked it up and detected your room boundaries.\n\n" +
          "Here's what I read:\n" +
          "• Living Room — approx. 5.4 × 3.9 m\n" +
          "• Modular Kitchen — approx. 3.6 × 2.7 m\n" +
          "• Master Bedroom — approx. 4.5 × 3.6 m\n\n" +
          "I can now generate a furniture layout and a first-pass BOQ. Want me to build the Design Docket?";
      }
      return "Thanks for the photo! 📸 I can see your current space. I'll use it to match finishes and proportions.\n\n" +
        "A few quick questions to sharpen the design:\n" +
        "• What's the feeling you want — warm & cosy, or bright & airy?\n" +
        "• Any must-keep furniture?\n" +
        "• What's your realistic budget range?";
    }

    if (has('hi', 'hello', 'hey', 'namaste') && text.length < 18) {
      return "Hello! 👋 Ready to shape your interior. Tell me which room you'd like to start with, or upload a site plan and I'll map it out.";
    }

    if (has('budget', 'cost', 'price', 'estimate', 'how much', 'expensive')) {
      return "Here's a live estimate from your current BOQ:\n\n" +
        `• Subtotal: ${money(fin.subtotal)}\n` +
        `• GST (18%): ${money(fin.gst)}\n` +
        `• Total: ${money(fin.total)}\n` +
        `• Your budget: ${money(fin.budget)}\n\n` +
        (fin.withinBudget
          ? `You're within budget with about ${money(fin.variance)} to spare. I can suggest a premium upgrade for the living room or kitchen.`
          : `You're over by ${money(Math.abs(fin.variance))}. I can value-engineer the modular kitchen and flooring to bring this back in line — want me to?`) +
        "\n\nI can send this as a Planex Quotation to 3 vendors.";
    }

    if (has('kitchen')) {
      return "For your modular kitchen (3.6 × 2.7 m), I'd recommend an L-shape layout with an island if space permits.\n\n" +
        "Suggested specification:\n" +
        "• Cabinets: BWP ply carcass + acrylic shutter (low-maintenance)\n" +
        "• Counter: Quartz, veined — ₹5,200/ft\n" +
        "• Chimney: auto-clean, 90cm\n" +
        "• Sink: under-mount SS with pull-down faucet\n\n" +
        "Estimated kitchen spend: " + money(18 * 6400 + 16 * 5200 + 48000 + 16500) + ".\n" +
        "Want me to lock this spec into the Design Docket?";
    }

    if (has('living', 'hall', 'drawing')) {
      return "Your living room is 5.4 × 3.9 m (21 m²). Here's a layout thought:\n\n" +
        "• Sofa against the long wall, 3-seater + 2 accent chairs\n" +
        "• Coffee table with 450 mm walkway all around\n" +
        "• Fluted panel TV wall with concealed lighting\n" +
        "• Engineered oak flooring for warmth\n\n" +
        "Want a 3D-style layout sketch? I can add furniture footprints to your plan.";
    }

    if (has('bedroom', 'master bed', 'bed')) {
      return "For the master bedroom (4.5 × 3.6 m):\n\n" +
        "• King bed centred on the headboard wall\n" +
        "• 8 ft sliding-door wardrobe (saves swing space)\n" +
        "• Two bedside tables\n" +
        "• Warm 2700K bedside lighting with dimmers\n\n" +
        "Shall I add these to the Design Docket?";
    }

    if (has('kids', 'child', 'bunk')) {
      return "For the kids' room, a bunk bed with an integrated study is efficient and fun. I'd add safe rounded edges, soft-close storage drawers, and a washable paint finish. Want me to factor this in?";
    }

    if (has('sofa', 'furniture', 'furnish')) {
      return "For furniture, here's what fits well in your spaces:\n\n" +
        "• Living: 3-seater fabric sofa + 2 accent chairs\n" +
        "• Dining: 6-seater solid wood table\n" +
        "• Bedrooms: upholstered beds + sliding wardrobes\n\n" +
        "I've pre-loaded these into your BOQ. Want me to compare vendors for the furniture package specifically?";
    }

    if (has('style', 'japandi', 'minimal', 'modern', 'contemporary', 'theme')) {
      return "For a warm minimal / Japandi direction:\n\n" +
        "• Palette: warm oak, oatmeal linen, charcoal accents\n" +
        "• Materials: matte finishes, natural wood, stone\n" +
        "• Lighting: layered — cove + accent spots, 2700K\n" +
        "• Declutter: concealed storage everywhere\n\n" +
        "This suits your low-maintenance preference. Want me to apply this palette to the Design Docket?";
    }

    if (has('flooring', 'floor', 'wooden', 'marble', 'tile')) {
      return "Flooring recommendation:\n\n" +
        "• Living & bedrooms: engineered oak (₹4,200/m²) — warm, stable, low-maintenance\n" +
        "• Kitchen & baths: anti-skid porcelain (₹3,800/m²)\n\n" +
        "Avoid natural marble in wet areas — quartz or vitrified is more forgiving. Shall I lock these in?";
    }

    if (has('storage', 'wardrobe', 'closet')) {
      return "Storage plan:\n\n" +
        "• Master: 8 ft sliding wardrobe with loft\n" +
        "• Kids: bunk with under-bed drawers\n" +
        "• Study: wall-mounted unit with overhead cabinets\n" +
        "• Living: TV unit with concealed drawers\n\n" +
        "That should cover your 'more storage' note. Want me to add it to the docket?";
    }

    if (has('lighting', 'light', 'lamp')) {
      return "Lighting scheme:\n\n" +
        "• Ambient: cove lighting in living & bedrooms\n" +
        "• Task: under-cabinet strips in kitchen, study lamps\n" +
        "• Accent: track spots on the fluted panel\n" +
        "All 2700K warm white with dimmers in bedrooms. Estimated ₹34,000 for the living area scheme.";
    }

    if (has('time', 'how long', 'duration', 'timeline', 'schedule', 'when')) {
      return "Your project timeline runs about 96 days (15 Sep → 20 Dec):\n\n" +
        "• Design & freeze: 1 week\n" +
        "• Civil + services: 3 weeks\n" +
        "• Modular + millwork: 3 weeks\n" +
        "• Finishes + styling: 3 weeks\n\n" +
        "You're currently in 'Demolition & Civil' (60% done). I'll flag any delays automatically.";
    }

    if (has('vendor', 'quote', 'quotation', 'contractor')) {
      return "I've matched 3 vendors for your BOQ:\n\n" +
        "• Studio Axis Interiors — 4.8★, premium finish\n" +
        "• Casa Craft — 4.5★, best value\n" +
        "• The Woodsmith Co. — 4.7★, 5-yr warranty\n\n" +
        "Head to the Quotation stage to compare them side-by-side. I keep the component specs locked so nothing gets swapped silently.";
    }

    if (has('plan', 'site plan', 'floor', 'layout') || planUploaded) {
      return "I can work from a site plan. Upload a photo/PDF of the plan, and I'll:\n\n" +
        "1. Detect room boundaries and proportions\n" +
        "2. Build a scaled 2D layout\n" +
        "3. Place furniture footprints with clearances\n" +
        "4. Generate a first-pass BOQ\n\nGo ahead and attach it, or use the Upload button below.";
    }

    if (has('thank', 'thanks', 'great', 'awesome', 'perfect')) {
      return "Anytime! 🙌 When you're ready, I can generate your Design Docket, send the Quotation to vendors, or start the Execution tracker.";
    }

    // Fallback — contextual
    return "Got it — let me capture that. Based on your project (" + S.project.spaceType + ", " + S.project.location + "):\n\n" +
      "I can help you with layouts, materials, furniture, costs, and timelines. Try:\n" +
      "• \"What's the cost for a modular kitchen?\"\n" +
      "• \"Suggest a layout for my living room\"\n" +
      "• \"Upload a site plan\"\n\n" +
      "What would you like to focus on?";
  }

  /* Generate a short brief string from context */
  function brief(ctx) {
    const c = ctx || {};
    const parts = [];
    if (c.spaceType) parts.push(c.spaceType);
    if (c.spaces && c.spaces.length) parts.push(c.spaces.join(', '));
    if (c.style && c.style.length) parts.push(c.style.join(' + '));
    return parts.join(' • ');
  }

  return { respond, brief };
})();
