// ══════════════════════════════════════════════════════════════
//  SmokeReady — Shared Service Data (Smoke / Vape Shop)
//  Loaded by services.html AND customer.html
// ══════════════════════════════════════════════════════════════

const SVC_WK_SMOKE = 'https://upload.wikimedia.org/wikipedia/commons/';

const svcImagesSmoke = {
  // Custom Vape
  'SMOKE-001': SVC_WK_SMOKE + 'thumb/e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg',
  'SMOKE-002': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  'SMOKE-003': SVC_WK_SMOKE + 'thumb/e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg',
  'SMOKE-004': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  'SMOKE-005': SVC_WK_SMOKE + 'thumb/e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg',
  'SMOKE-006': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  // Repair
  'SMOKE-007': SVC_WK_SMOKE + 'thumb/e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg',
  'SMOKE-008': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  'SMOKE-009': SVC_WK_SMOKE + 'thumb/e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg',
  'SMOKE-010': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  'SMOKE-011': SVC_WK_SMOKE + 'thumb/e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg',
  'SMOKE-012': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  // Engraving
  'SMOKE-013': SVC_WK_SMOKE + 'thumb/c/c5/Zippo-Lighter.jpg/400px-Zippo-Lighter.jpg',
  'SMOKE-014': SVC_WK_SMOKE + 'thumb/0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg',
  'SMOKE-015': SVC_WK_SMOKE + 'thumb/c/c5/Zippo-Lighter.jpg/400px-Zippo-Lighter.jpg',
  'SMOKE-016': SVC_WK_SMOKE + 'thumb/c/c5/Zippo-Lighter.jpg/400px-Zippo-Lighter.jpg',
  'SMOKE-017': SVC_WK_SMOKE + 'thumb/0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg',
  'SMOKE-018': SVC_WK_SMOKE + 'thumb/c/c5/Zippo-Lighter.jpg/400px-Zippo-Lighter.jpg',
  // Consultation
  'SMOKE-019': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  'SMOKE-020': SVC_WK_SMOKE + 'thumb/e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg',
  'SMOKE-021': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  'SMOKE-022': SVC_WK_SMOKE + 'thumb/e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg',
  'SMOKE-023': SVC_WK_SMOKE + 'thumb/5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg',
  'SMOKE-024': SVC_WK_SMOKE + 'thumb/0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg',
  // Membership
  'SMOKE-025': SVC_WK_SMOKE + 'thumb/5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg',
  'SMOKE-026': SVC_WK_SMOKE + 'thumb/5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg',
  'SMOKE-027': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  'SMOKE-028': SVC_WK_SMOKE + 'thumb/5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg',
  'SMOKE-029': SVC_WK_SMOKE + 'thumb/2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg',
  'SMOKE-030': SVC_WK_SMOKE + 'thumb/5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg'
};

// ── 30 Services ─────────────────────────────────────────────
const servicesSmoke = [
  // ── Custom Vape ─────────────────────────────────────────────
  { id: 'SMOKE-001', name: 'Single Coil Build', price: 15.00, category: 'custom-vape',
    desc: 'Hand-wrapped single coil build for your RDA or RTA. Includes wicking with premium organic cotton.',
    tags: ['Coil', 'RDA', 'RTA', 'Custom'], time: '15 min' },
  { id: 'SMOKE-002', name: 'Dual Coil Build — Advanced', price: 25.00, category: 'custom-vape',
    desc: 'Precision dual coil build with exotic wire (Clapton, fused, alien). Balanced resistance and wicking.',
    tags: ['Coil', 'Exotic', 'Clapton', 'Premium'], time: '25 min' },
  { id: 'SMOKE-003', name: 'Tank Setup & Prime', price: 10.00, category: 'custom-vape',
    desc: 'Full tank disassembly, clean, coil install, wicking, and priming. Ready to vape when you leave.',
    tags: ['Tank', 'Setup', 'Quick'], time: '10 min' },
  { id: 'SMOKE-004', name: 'Mod Programming & Wattage Tuning', price: 20.00, category: 'custom-vape',
    desc: 'Custom wattage curves, TCR settings, preheat configuration. Optimized for your coil and juice.',
    tags: ['Mod', 'Programming', 'TC'], time: '20 min' },
  { id: 'SMOKE-005', name: 'Custom Juice Mixing — 60ml', price: 18.00, category: 'custom-vape',
    desc: 'Custom e-liquid blend in your choice of flavor profile and nicotine strength. 60ml bottle.',
    tags: ['Juice', 'Custom', 'Mix', 'Popular'], time: '15 min' },
  { id: 'SMOKE-006', name: 'Custom Juice Mixing — 120ml', price: 30.00, category: 'custom-vape',
    desc: 'Large batch custom e-liquid mix. Choose up to 3 flavor combinations. VG/PG ratio customizable.',
    tags: ['Juice', 'Custom', 'Mix', 'Bulk'], time: '20 min' },

  // ── Repair ──────────────────────────────────────────────────
  { id: 'SMOKE-007', name: 'Vape Device Diagnosis', price: 8.00, category: 'repair',
    desc: 'Full diagnostic check on your vape device. Test firing, battery check, connection test, airflow inspection.',
    tags: ['Diagnostic', 'Any Device'], time: '10 min' },
  { id: 'SMOKE-008', name: 'Pod System Repair', price: 12.00, category: 'repair',
    desc: 'Fix common pod system issues: connection cleaning, pod contact repair, airflow sensor reset.',
    tags: ['Pod', 'Repair', 'Quick'], time: '15 min' },
  { id: 'SMOKE-009', name: 'Box Mod Repair — Basic', price: 20.00, category: 'repair',
    desc: 'Repair box mod issues including 510 pin adjustment, button fix, and screen troubleshooting.',
    tags: ['Mod', 'Repair', '510'], time: '20 min' },
  { id: 'SMOKE-010', name: 'Box Mod Repair — Advanced', price: 35.00, category: 'repair',
    desc: 'Advanced mod repair: board-level fix, chip reset, solder reflow, internal wiring repair.',
    tags: ['Mod', 'Advanced', 'Solder'], time: '45 min' },
  { id: 'SMOKE-011', name: 'Battery Replacement — Single', price: 10.00, category: 'repair',
    desc: 'Replace single 18650/21700 battery. Includes battery safety check and proper disposal of old cell.',
    tags: ['Battery', '18650', '21700'], time: '5 min' },
  { id: 'SMOKE-012', name: 'Battery Replacement — Dual', price: 18.00, category: 'repair',
    desc: 'Replace matched pair of batteries for dual-battery mods. Marriage-tested for balanced discharge.',
    tags: ['Battery', 'Dual', 'Matched'], time: '10 min' },

  // ── Engraving ───────────────────────────────────────────────
  { id: 'SMOKE-013', name: 'Lighter Engraving — Text Only', price: 15.00, category: 'engraving',
    desc: 'Custom text engraving on Zippo or metal lighter. Up to 3 lines, choice of fonts.',
    tags: ['Lighter', 'Zippo', 'Text', 'Gift'], time: '15 min' },
  { id: 'SMOKE-014', name: 'Pipe Engraving — Initials', price: 20.00, category: 'engraving',
    desc: 'Engrave initials or monogram on wood or briar pipe bowl or stem. Elegant script or block letters.',
    tags: ['Pipe', 'Initials', 'Monogram'], time: '20 min' },
  { id: 'SMOKE-015', name: 'Lighter Engraving — Logo/Image', price: 25.00, category: 'engraving',
    desc: 'Custom logo or image engraved on metal lighter. Bring your design or choose from our catalog.',
    tags: ['Lighter', 'Logo', 'Custom Art', 'Premium'], time: '30 min' },
  { id: 'SMOKE-016', name: 'Vape Mod Engraving', price: 22.00, category: 'engraving',
    desc: 'Custom engraving on metal vape mod body. Name, initials, or small design. Laser-etched precision.',
    tags: ['Mod', 'Laser', 'Custom'], time: '25 min' },
  { id: 'SMOKE-017', name: 'Pipe Stand Engraving', price: 18.00, category: 'engraving',
    desc: 'Engrave dedication or name on wooden pipe stand or display case. Great for gifts and collectors.',
    tags: ['Pipe', 'Stand', 'Gift'], time: '20 min' },
  { id: 'SMOKE-018', name: 'Custom Case Engraving', price: 20.00, category: 'engraving',
    desc: 'Engrave text or design on cigar cases, cigarette cases, or carry cases. Metal surfaces only.',
    tags: ['Case', 'Cigar', 'Custom'], time: '20 min' },

  // ── Consultation ────────────────────────────────────────────
  { id: 'SMOKE-019', name: 'Flavor Profile Consultation', price: 10.00, category: 'consultation',
    desc: 'One-on-one session to find your ideal flavor profile. Sample up to 5 e-liquid flavors with guidance.',
    tags: ['Flavor', 'Tasting', 'Beginner'], time: '20 min' },
  { id: 'SMOKE-020', name: 'Nicotine Step-Down Program', price: 25.00, category: 'consultation',
    desc: 'Personalized 4-week nicotine reduction plan. Graduated strength schedule with flavor matching at each level.',
    tags: ['Nicotine', 'Health', 'Program', 'Popular'], time: '30 min' },
  { id: 'SMOKE-021', name: 'Beginner Device Consultation', price: 0.00, category: 'consultation',
    desc: 'Free consultation for first-time vapers. Device recommendations, nicotine guidance, and basic usage tutorial.',
    tags: ['Beginner', 'Free', 'Tutorial'], time: '15 min' },
  { id: 'SMOKE-022', name: 'Advanced Mod Consultation', price: 12.00, category: 'consultation',
    desc: 'Expert advice on advanced mods, rebuildable atomizers, and mechanical mod safety. For experienced vapers.',
    tags: ['Advanced', 'Mech Mod', 'Safety'], time: '20 min' },
  { id: 'SMOKE-023', name: 'Cigar Pairing Consultation', price: 15.00, category: 'consultation',
    desc: 'Guided cigar tasting and pairing session. Learn flavor profiles, strength ratings, and drink pairings.',
    tags: ['Cigar', 'Pairing', 'Tasting', 'Premium'], time: '30 min' },
  { id: 'SMOKE-024', name: 'Pipe Tobacco Tasting', price: 12.00, category: 'consultation',
    desc: 'Sample 3-4 pipe tobacco blends with guidance on packing, lighting, and cadence. Great for new pipe smokers.',
    tags: ['Pipe', 'Tobacco', 'Tasting'], time: '25 min' },

  // ── Membership ──────────────────────────────────────────────
  { id: 'SMOKE-025', name: 'VIP Membership — Monthly', price: 19.99, category: 'membership',
    desc: 'Monthly VIP membership: 15% off all products, early access to new arrivals, free coil builds, members-only events.',
    tags: ['VIP', 'Monthly', 'Discount', 'Popular'], time: '5 min' },
  { id: 'SMOKE-026', name: 'VIP Membership — Annual', price: 199.99, category: 'membership',
    desc: 'Annual VIP membership: 20% off all products, priority service, free repairs, birthday gift, 2 months free.',
    tags: ['VIP', 'Annual', 'Best Value'], time: '5 min' },
  { id: 'SMOKE-027', name: 'Vape Subscription Box — Monthly', price: 39.99, category: 'membership',
    desc: 'Monthly curated box: 2 premium e-liquids, 1 coil pack, and a surprise accessory. Tailored to your flavor profile.',
    tags: ['Subscription', 'Monthly', 'Curated'], time: '5 min' },
  { id: 'SMOKE-028', name: 'Cigar of the Month Club', price: 49.99, category: 'membership',
    desc: 'Monthly selection of 5 premium cigars from around the world. Includes tasting notes and pairing suggestions.',
    tags: ['Cigar', 'Monthly', 'Premium'], time: '5 min' },
  { id: 'SMOKE-029', name: 'Loyalty Punch Card (10 Visits)', price: 0.00, category: 'membership',
    desc: 'Free loyalty punch card. Earn a punch with every $20+ purchase. 10 punches = $25 store credit.',
    tags: ['Loyalty', 'Free', 'Rewards'], time: '2 min' },
  { id: 'SMOKE-030', name: 'CBD Wellness Subscription', price: 34.99, category: 'membership',
    desc: 'Monthly CBD wellness box: tincture, gummies, and rotating specialty product. Lab-tested, full spectrum.',
    tags: ['CBD', 'Wellness', 'Monthly', 'Subscription'], time: '5 min' }
];

// ── Category Labels & Classes ───────────────────────────────
const catLabelsSmoke = {
  'custom-vape': 'Custom Vape', repair: 'Repair', engraving: 'Engraving',
  consultation: 'Consultation', membership: 'Membership'
};
const catClassSmoke = {
  'custom-vape': 'svc-cat-custom-vape', repair: 'svc-cat-repair', engraving: 'svc-cat-engraving',
  consultation: 'svc-cat-consultation', membership: 'svc-cat-membership'
};
