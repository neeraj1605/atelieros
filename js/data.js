/* ============================================================
   Planex AI — Seed Data (B2C homeowner project)
   ============================================================ */
window.PlanexData = (function () {
  const project = {
    id: 'PRJ-2026-0142',
    name: 'Mehta Residence',
    tagline: '3BHK Apartment Renovation',
    type: 'renovation',
    spaceType: '3BHK Apartment',
    location: 'Powai, Mumbai',
    client: 'Rahul & Priya Mehta',
    budget: 1850000,
    currency: 'INR',
    startDate: '2026-09-15',
    handoverDate: '2026-12-20',
    stage: 'ideate'
  };

  const rooms = [
    { id: 'room-living', name: 'Living Room', length: 5.4, width: 3.9, color: '#c9a27a', area: '21.1 m²', type: 'common' },
    { id: 'room-kitchen', name: 'Modular Kitchen', length: 3.6, width: 2.7, color: '#8aa4a0', area: '9.7 m²', type: 'wet' },
    { id: 'room-master', name: 'Master Bedroom', length: 4.5, width: 3.6, color: '#b9a3c9', area: '16.2 m²', type: 'private' },
    { id: 'room-kids', name: 'Kids Bedroom', length: 3.6, width: 3.0, color: '#e0b98a', area: '10.8 m²', type: 'private' },
    { id: 'room-study', name: 'Study / Home Office', length: 3.0, width: 2.7, color: '#a8b89a', area: '8.1 m²', type: 'private' },
    { id: 'room-bath', name: 'Master Bathroom', length: 2.7, width: 1.8, color: '#9db8c9', area: '4.9 m²', type: 'wet' }
  ];

  const boq = [
    { id: 'b1', room: 'room-living', category: 'Civil', item: 'Demolition & debris removal', qty: 1, unit: 'LS', rate: 22000 },
    { id: 'b2', room: 'room-living', category: 'Flooring', item: 'Engineered oak wood flooring', qty: 21, unit: 'm²', rate: 4200 },
    { id: 'b3', room: 'room-living', category: 'Wall', item: 'Fluted panel accent wall', qty: 12, unit: 'ft', rate: 2800 },
    { id: 'b4', room: 'room-living', category: 'Furniture', item: '3-seater fabric sofa', qty: 1, unit: 'nos', rate: 68000 },
    { id: 'b5', room: 'room-living', category: 'Furniture', item: 'Solid wood coffee table', qty: 1, unit: 'nos', rate: 18500 },
    { id: 'b6', room: 'room-living', category: 'Lighting', item: 'Cove + spot lighting scheme', qty: 1, unit: 'LS', rate: 34000 },
    { id: 'b7', room: 'room-kitchen', category: 'Millwork', item: 'Modular lower + upper cabinets', qty: 18, unit: 'ft', rate: 6400 },
    { id: 'b8', room: 'room-kitchen', category: 'Counter', item: 'Quartz countertop (Veined)', qty: 16, unit: 'ft', rate: 5200 },
    { id: 'b9', room: 'room-kitchen', category: 'Appliance', item: 'Chimney + hob set', qty: 1, unit: 'nos', rate: 48000 },
    { id: 'b10', room: 'room-kitchen', category: 'Plumbing', item: 'Under-mount steel sink + faucet', qty: 1, unit: 'set', rate: 16500 },
    { id: 'b11', room: 'room-master', category: 'Millwork', item: 'Sliding door wardrobe', qty: 8, unit: 'ft', rate: 7200 },
    { id: 'b12', room: 'room-master', category: 'Furniture', item: 'Upholstered king bed', qty: 1, unit: 'nos', rate: 56000 },
    { id: 'b13', room: 'room-master', category: 'Furniture', item: 'Bedside tables (pair)', qty: 2, unit: 'nos', rate: 9800 },
    { id: 'b14', room: 'room-kids', category: 'Furniture', item: 'Bunk bed with study', qty: 1, unit: 'nos', rate: 42000 },
    { id: 'b15', room: 'room-study', category: 'Millwork', item: 'Wall-mounted study unit', qty: 1, unit: 'LS', rate: 38000 },
    { id: 'b16', room: 'room-bath', category: 'Sanitary', item: 'Concealed cistern + WC', qty: 1, unit: 'set', rate: 24000 },
    { id: 'b17', room: 'room-bath', category: 'Wall', item: 'Anti-skid tile + waterproofing', qty: 5, unit: 'm²', rate: 3800 },
    { id: 'b18', room: 'room-living', category: 'Paint', item: 'Premium low-VOC emulsion', qty: 480, unit: 'sqft', rate: 38 }
  ];

  const vendors = [
    {
      id: 'v1',
      name: 'Studio Axis Interiors',
      initials: 'SA',
      rating: 4.8,
      reviews: 124,
      city: 'Mumbai',
      leadTime: '45 days',
      warranty: '3 years',
      payment: '40 / 40 / 20',
      tier: 'premium',
      multiplier: 1.08,
      note: 'Highest finish quality, dedicated project manager, slightly above budget.'
    },
    {
      id: 'v2',
      name: 'Casa Craft',
      initials: 'CC',
      rating: 4.5,
      reviews: 89,
      city: 'Navi Mumbai',
      leadTime: '52 days',
      warranty: '2 years',
      payment: '50 / 30 / 20',
      tier: 'value',
      multiplier: 0.93,
      note: 'Best value for money, strong modular kitchen portfolio, moderate lead time.'
    },
    {
      id: 'v3',
      name: 'The Woodsmith Co.',
      initials: 'WC',
      rating: 4.7,
      reviews: 156,
      city: 'Thane',
      leadTime: '40 days',
      warranty: '5 years',
      payment: '30 / 50 / 20',
      tier: 'craft',
      multiplier: 1.02,
      note: 'Bespoke joinery specialist, longest warranty, fastest execution.'
    }
  ];

  const timeline = [
    { id: 'p1', name: 'Design & Freeze', start: '15 Sep', end: '22 Sep', status: 'done', progress: 100, milestones: [
      { label: 'Site measurement', done: true }, { label: 'Design docket sign-off', done: true }, { label: 'Material selection', done: true }
    ]},
    { id: 'p2', name: 'Demolition & Civil', start: '23 Sep', end: '02 Oct', status: 'active', progress: 60, milestones: [
      { label: 'Breakage of existing finishes', done: true }, { label: 'Debris clearance', done: true }, { label: 'Wiring & plumbing chase', done: false }
    ]},
    { id: 'p3', name: 'Plumbing & Electrical', start: '03 Oct', end: '12 Oct', status: 'upcoming', progress: 0, milestones: [
      { label: 'Concealed conduit layout', done: false }, { label: 'Plumbing pressure test', done: false }
    ]},
    { id: 'p4', name: 'Ceiling & Wall Finishes', start: '13 Oct', end: '28 Oct', status: 'upcoming', progress: 0, milestones: [
      { label: 'False ceiling framework', done: false }, { label: 'Putty & primer coat', done: false }
    ]},
    { id: 'p5', name: 'Modular & Millwork', start: '29 Oct', end: '20 Nov', status: 'upcoming', progress: 0, milestones: [
      { label: 'Kitchen carcass install', done: false }, { label: 'Wardrobes & study units', done: false }
    ]},
    { id: 'p6', name: 'Flooring & Paint', start: '21 Nov', end: '05 Dec', status: 'upcoming', progress: 0, milestones: [
      { label: 'Wooden flooring laying', done: false }, { label: 'Final paint coats', done: false }
    ]},
    { id: 'p7', name: 'Furniture & Styling', start: '06 Dec', end: '20 Dec', status: 'upcoming', progress: 0, milestones: [
      { label: 'Furniture delivery', done: false }, { label: 'Soft styling & handover', done: false }
    ]}
  ];

  const qc = [
    { id: 'q1', title: 'Uneven grout line near kitchen sink', severity: 'Minor', trade: 'Tiling', status: 'Open', date: '2026-10-04' },
    { id: 'q2', title: 'Living room niche paint touch-up', severity: 'Cosmetic', trade: 'Painting', status: 'Open', date: '2026-10-06' },
    { id: 'q3', title: 'Wardrobe door alignment (master)', severity: 'Major', trade: 'Joinery', status: 'In Progress', date: '2026-10-02' },
    { id: 'q4', title: 'Verified water pressure - all points', severity: 'Critical', trade: 'Plumbing', status: 'Resolved', date: '2026-09-28' }
  ];

  const chatSeed = [
    {
      role: 'ai',
      text: "Hello — I'm Planex AI, your interior design consultant with 20 years across Indian homes.\n\nI work through your project space by space: living, kitchen, dining, bedrooms, gallery/sit-out. Then we scope it, cost it, and I produce the drawings your site team builds from.\n\nHere's the journey:\n1. Add your floor plan and validate it\n2. Define each space — dimensions, photos, what you want\n3. Set the look (Moodboard) for each space, with a colour palette\n4. Scope → Costing → Dockets → Execution\n\nTell me which space to start with, or ask me anything — clearances, materials, costs, layouts.",
      time: '09:12'
    }
  ];

  const suggestionPrompts = [
    { text: 'Renovate my 3BHK living room', icon: 'home' },
    { text: 'Estimate cost for modular kitchen', icon: 'rupee' },
    { text: 'Suggest a warm Japandi theme', icon: 'sparkles' },
    { text: 'What furniture fits a 12x15 ft room?', icon: 'ruler' }
  ];

  return { project, rooms, boq, vendors, timeline, qc, chatSeed, suggestionPrompts };
})();
