// ══════════════════════════════════════════════════════════════
//  SmokeReady — Shared Inventory Data (Smoke / Vape Shop)
//  Loaded by inventory.html AND customer.html
// ══════════════════════════════════════════════════════════════

const INV_WK_SMOKE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';

const storeInventorySmoke = [
  // ── Vape Devices ────────────────────────────────────────────
  { id: 'SMINV-001', name: 'Box Mod — Dual Battery 220W', category: 'Vape Devices', price: 59.99, stock: 12, maxStock: 20, image: INV_WK_SMOKE + '2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg', icon: '\u26A1' },
  { id: 'SMINV-002', name: 'Pod System — Refillable', category: 'Vape Devices', price: 24.99, stock: 30, maxStock: 40, image: INV_WK_SMOKE + 'e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg', icon: '\u26A1' },
  { id: 'SMINV-003', name: 'Disposable Vape — 5000 Puffs', category: 'Vape Devices', price: 14.99, stock: 80, maxStock: 120, image: INV_WK_SMOKE + 'e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg', icon: '\u26A1' },
  { id: 'SMINV-004', name: 'Starter Kit — Beginner Bundle', category: 'Vape Devices', price: 34.99, stock: 18, maxStock: 25, image: INV_WK_SMOKE + '2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg', icon: '\u26A1' },
  { id: 'SMINV-005', name: 'Mechanical Mod — Brass Tube', category: 'Vape Devices', price: 79.99, stock: 5, maxStock: 10, image: INV_WK_SMOKE + '2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg', icon: '\u26A1' },

  // ── E-Liquids ───────────────────────────────────────────────
  { id: 'SMINV-006', name: 'E-Liquid — Classic Tobacco (60ml)', category: 'E-Liquids', price: 16.99, stock: 25, maxStock: 40, image: INV_WK_SMOKE + '2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg', icon: '\uD83C\uDF2B' },
  { id: 'SMINV-007', name: 'E-Liquid — Mango Tango Fruit (60ml)', category: 'E-Liquids', price: 16.99, stock: 35, maxStock: 50, image: INV_WK_SMOKE + 'e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg', icon: '\uD83C\uDF2B' },
  { id: 'SMINV-008', name: 'E-Liquid — Vanilla Custard Dessert (60ml)', category: 'E-Liquids', price: 18.99, stock: 20, maxStock: 35, image: INV_WK_SMOKE + '2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg', icon: '\uD83C\uDF2B' },
  { id: 'SMINV-009', name: 'E-Liquid — Arctic Menthol (60ml)', category: 'E-Liquids', price: 16.99, stock: 28, maxStock: 40, image: INV_WK_SMOKE + 'e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg', icon: '\uD83C\uDF2B' },
  { id: 'SMINV-010', name: 'Nicotine Salt — Smooth Tobacco (30ml)', category: 'E-Liquids', price: 14.99, stock: 22, maxStock: 30, image: INV_WK_SMOKE + '2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg', icon: '\uD83C\uDF2B' },

  // ── Cigars ──────────────────────────────────────────────────
  { id: 'SMINV-011', name: 'Premium Cigar — Robusto (Single)', category: 'Cigars', price: 12.99, stock: 40, maxStock: 60, image: INV_WK_SMOKE + '5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg', icon: '\uD83D\uDCA8' },
  { id: 'SMINV-012', name: 'Mild Cigar — Connecticut Wrapper (Single)', category: 'Cigars', price: 8.99, stock: 35, maxStock: 50, image: INV_WK_SMOKE + '5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg', icon: '\uD83D\uDCA8' },
  { id: 'SMINV-013', name: 'Medium-Body Cigar — Habano (Single)', category: 'Cigars', price: 10.99, stock: 25, maxStock: 40, image: INV_WK_SMOKE + '5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg', icon: '\uD83D\uDCA8' },
  { id: 'SMINV-014', name: 'Full-Body Cigar — Maduro (Single)', category: 'Cigars', price: 14.99, stock: 20, maxStock: 35, image: INV_WK_SMOKE + '5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg', icon: '\uD83D\uDCA8' },
  { id: 'SMINV-015', name: 'Cigar Sampler Pack (5-Pack Assorted)', category: 'Cigars', price: 39.99, stock: 10, maxStock: 20, image: INV_WK_SMOKE + '5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg', icon: '\uD83D\uDCA8' },

  // ── Pipes ───────────────────────────────────────────────────
  { id: 'SMINV-016', name: 'Glass Hand Pipe — Spoon Style', category: 'Pipes', price: 19.99, stock: 24, maxStock: 35, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83D\uDEAC' },
  { id: 'SMINV-017', name: 'Wood Tobacco Pipe — Briar', category: 'Pipes', price: 34.99, stock: 10, maxStock: 15, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83D\uDEAC' },
  { id: 'SMINV-018', name: 'Metal One-Hitter Pipe', category: 'Pipes', price: 9.99, stock: 40, maxStock: 50, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83D\uDEAC' },
  { id: 'SMINV-019', name: 'Water Pipe — 12" Beaker Base', category: 'Pipes', price: 49.99, stock: 8, maxStock: 15, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83D\uDEAC' },
  { id: 'SMINV-020', name: 'Bubbler — Glass Hammer Style', category: 'Pipes', price: 29.99, stock: 12, maxStock: 20, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83D\uDEAC' },

  // ── Accessories ─────────────────────────────────────────────
  { id: 'SMINV-021', name: 'Zippo Lighter — Classic Chrome', category: 'Accessories', price: 24.99, stock: 20, maxStock: 30, image: INV_WK_SMOKE + 'c/c5/Zippo-Lighter.jpg/400px-Zippo-Lighter.jpg', icon: '\uD83D\uDD25' },
  { id: 'SMINV-022', name: 'Torch Lighter — Triple Flame', category: 'Accessories', price: 18.99, stock: 15, maxStock: 25, image: INV_WK_SMOKE + 'c/c5/Zippo-Lighter.jpg/400px-Zippo-Lighter.jpg', icon: '\uD83D\uDD25' },
  { id: 'SMINV-023', name: 'Rolling Papers — King Size (50ct)', category: 'Accessories', price: 3.99, stock: 60, maxStock: 100, image: INV_WK_SMOKE + 'c/c5/Zippo-Lighter.jpg/400px-Zippo-Lighter.jpg', icon: '\u2702' },
  { id: 'SMINV-024', name: 'Herb Grinder — 4-Piece Aluminum', category: 'Accessories', price: 14.99, stock: 18, maxStock: 25, image: INV_WK_SMOKE + 'c/c5/Zippo-Lighter.jpg/400px-Zippo-Lighter.jpg', icon: '\u2699' },
  { id: 'SMINV-025', name: 'Cigar Case — Leather 3-Finger', category: 'Accessories', price: 22.99, stock: 10, maxStock: 15, image: INV_WK_SMOKE + '5/56/Davidoff_cigar_box.jpg/400px-Davidoff_cigar_box.jpg', icon: '\uD83D\uDCBC' },
  { id: 'SMINV-026', name: 'Filter Tips — Glass (6-Pack)', category: 'Accessories', price: 7.99, stock: 25, maxStock: 40, image: INV_WK_SMOKE + 'c/c5/Zippo-Lighter.jpg/400px-Zippo-Lighter.jpg', icon: '\u25CB' },

  // ── CBD ─────────────────────────────────────────────────────
  { id: 'SMINV-027', name: 'CBD Gummies — 30ct (750mg)', category: 'CBD', price: 29.99, stock: 20, maxStock: 30, image: INV_WK_SMOKE + '2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg', icon: '\u2618' },
  { id: 'SMINV-028', name: 'CBD Tincture — Full Spectrum (1000mg)', category: 'CBD', price: 44.99, stock: 12, maxStock: 20, image: INV_WK_SMOKE + '2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg', icon: '\u2618' },
  { id: 'SMINV-029', name: 'CBD Flower — 3.5g Jar', category: 'CBD', price: 24.99, stock: 15, maxStock: 25, image: INV_WK_SMOKE + '2/2e/Vaporizer_%28e-cigarette%29.jpg/400px-Vaporizer_%28e-cigarette%29.jpg', icon: '\u2618' },
  { id: 'SMINV-030', name: 'CBD Cartridge — 510 Thread (500mg)', category: 'CBD', price: 34.99, stock: 18, maxStock: 25, image: INV_WK_SMOKE + 'e/e0/E-Cigarette_%2816280546498%29.jpg/400px-E-Cigarette_%2816280546498%29.jpg', icon: '\u2618' },

  // ── Tobacco ─────────────────────────────────────────────────
  { id: 'SMINV-031', name: 'Rolling Tobacco — Virginia Blend (1.5oz)', category: 'Tobacco', price: 11.99, stock: 20, maxStock: 30, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83C\uDF3F' },
  { id: 'SMINV-032', name: 'Pipe Tobacco — English Blend (2oz)', category: 'Tobacco', price: 14.99, stock: 12, maxStock: 20, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83C\uDF3F' },
  { id: 'SMINV-033', name: 'Pipe Tobacco — Aromatic Cherry (2oz)', category: 'Tobacco', price: 13.99, stock: 14, maxStock: 20, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83C\uDF3F' },
  { id: 'SMINV-034', name: 'Cigarette Tubes — King Size (200ct)', category: 'Tobacco', price: 5.99, stock: 30, maxStock: 50, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83C\uDF3F' },
  { id: 'SMINV-035', name: 'Tube Injector Machine — Manual', category: 'Tobacco', price: 19.99, stock: 8, maxStock: 15, image: INV_WK_SMOKE + '0/08/Tabakspfeife.jpg/400px-Tabakspfeife.jpg', icon: '\uD83C\uDF3F' }
];

const invCategoriesSmoke = ['Vape Devices', 'E-Liquids', 'Cigars', 'Pipes', 'Accessories', 'CBD', 'Tobacco'];
