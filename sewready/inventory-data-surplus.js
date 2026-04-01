// ══════════════════════════════════════════════════════════════
//  Military Surplus Store — Shared Inventory Data
//  Loaded by inventory.html AND customer.html
// ══════════════════════════════════════════════════════════════

const INV_WK_SURPLUS = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';

const storeInventorySurplus = [
  // ── Clothing ────────────────────────────────────────────────
  { id: 'SINV-001', name: 'BDU Jacket — Woodland Camo', category: 'Clothing', price: 28.00, stock: 15, maxStock: 30, image: INV_WK_SURPLUS + 'e/e9/BDU_Woodland.jpg/400px-BDU_Woodland.jpg', icon: '\uD83E\uDDE5' },
  { id: 'SINV-002', name: 'BDU Trousers — Woodland Camo', category: 'Clothing', price: 24.00, stock: 18, maxStock: 30, image: INV_WK_SURPLUS + 'e/e9/BDU_Woodland.jpg/400px-BDU_Woodland.jpg', icon: '\uD83D\uDC56' },
  { id: 'SINV-003', name: 'Flight Suit — CWU-27/P (Green)', category: 'Clothing', price: 65.00, stock: 6, maxStock: 12, image: INV_WK_SURPLUS + '2/23/Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg/400px-Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg', icon: '\u2708' },
  { id: 'SINV-004', name: 'Army PT Shorts — Black', category: 'Clothing', price: 8.00, stock: 25, maxStock: 40, image: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Operational_Camouflage_Pattern_2015.jpg', icon: '\u26A1' },
  { id: 'SINV-005', name: 'Combat Boots — Belleville (Used)', category: 'Clothing', price: 45.00, stock: 10, maxStock: 20, image: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Army_Combat_Boot_%28Temperate%29.jpg', icon: '\uD83E\uDD7E' },
  { id: 'SINV-006', name: 'Gore-Tex Parka — OCP (Gen III)', category: 'Clothing', price: 85.00, stock: 5, maxStock: 15, image: INV_WK_SURPLUS + 'a/a1/OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg/400px-OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg', icon: '\u2602' },

  // ── Field Gear ──────────────────────────────────────────────
  { id: 'SINV-007', name: 'ALICE Pack — Large (Used)', category: 'Field Gear', price: 55.00, stock: 8, maxStock: 15, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\uD83C\uDF92' },
  { id: 'SINV-008', name: 'MOLLE II Rucksack — OCP', category: 'Field Gear', price: 75.00, stock: 6, maxStock: 12, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\uD83C\uDF92' },
  { id: 'SINV-009', name: 'Military Poncho — OD Green', category: 'Field Gear', price: 18.00, stock: 20, maxStock: 35, image: INV_WK_SURPLUS + '8/80/Army_greens.jpg/400px-Army_greens.jpg', icon: '\u2614' },
  { id: 'SINV-010', name: 'Modular Sleep System (MSS)', category: 'Field Gear', price: 95.00, stock: 4, maxStock: 10, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\uD83D\uDECC' },
  { id: 'SINV-011', name: 'Shelter Half — Canvas', category: 'Field Gear', price: 22.00, stock: 12, maxStock: 20, image: INV_WK_SURPLUS + '8/80/Army_greens.jpg/400px-Army_greens.jpg', icon: '\u26FA' },

  // ── Tactical ────────────────────────────────────────────────
  { id: 'SINV-012', name: 'Plate Carrier — Condor Sentry', category: 'Tactical', price: 65.00, stock: 7, maxStock: 15, image: INV_WK_SURPLUS + '4/4b/USMC_Flak_Jacket.jpg/400px-USMC_Flak_Jacket.jpg', icon: '\uD83D\uDEE1' },
  { id: 'SINV-013', name: 'MOLLE Magazine Pouch — Triple', category: 'Tactical', price: 14.00, stock: 22, maxStock: 40, image: INV_WK_SURPLUS + '4/4b/USMC_Flak_Jacket.jpg/400px-USMC_Flak_Jacket.jpg', icon: '\u25AE' },
  { id: 'SINV-014', name: 'Drop-Leg Holster — Universal', category: 'Tactical', price: 28.00, stock: 9, maxStock: 20, image: INV_WK_SURPLUS + '4/4b/USMC_Flak_Jacket.jpg/400px-USMC_Flak_Jacket.jpg', icon: '\u2316' },
  { id: 'SINV-015', name: 'Tactical Knee Pads — OD Green', category: 'Tactical', price: 18.00, stock: 14, maxStock: 25, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\u26D1' },
  { id: 'SINV-016', name: 'IFAK Pouch — Empty', category: 'Tactical', price: 16.00, stock: 18, maxStock: 30, image: INV_WK_SURPLUS + '4/4b/USMC_Flak_Jacket.jpg/400px-USMC_Flak_Jacket.jpg', icon: '\u2695' },

  // ── Rations ─────────────────────────────────────────────────
  { id: 'SINV-017', name: 'MRE — Single Meal (Random Menu)', category: 'Rations', price: 12.00, stock: 50, maxStock: 100, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/MRE_Contents.jpg/400px-MRE_Contents.jpg', icon: '\uD83C\uDF5E' },
  { id: 'SINV-018', name: 'MRE — Case of 12', category: 'Rations', price: 120.00, stock: 5, maxStock: 12, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/MRE_Contents.jpg/400px-MRE_Contents.jpg', icon: '\uD83D\uDCE6' },
  { id: 'SINV-019', name: 'Water Purification Tablets (50ct)', category: 'Rations', price: 8.00, stock: 30, maxStock: 50, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/MRE_Contents.jpg/400px-MRE_Contents.jpg', icon: '\uD83D\uDCA7' },
  { id: 'SINV-020', name: 'Canteen — 1 Quart w/ Cover', category: 'Rations', price: 10.00, stock: 20, maxStock: 35, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\u2615' },

  // ── Tools ───────────────────────────────────────────────────
  { id: 'SINV-021', name: 'Gerber Multi-Tool (Used)', category: 'Tools', price: 32.00, stock: 8, maxStock: 15, image: INV_WK_SURPLUS + 'b/b1/Ka-Bar_USMC_knife.jpg/400px-Ka-Bar_USMC_knife.jpg', icon: '\uD83D\uDD27' },
  { id: 'SINV-022', name: 'Entrenching Tool (E-Tool)', category: 'Tools', price: 18.00, stock: 12, maxStock: 25, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\u2692' },
  { id: 'SINV-023', name: 'Lensatic Compass — Tritium', category: 'Tools', price: 45.00, stock: 6, maxStock: 12, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\uD83E\uDDED' },
  { id: 'SINV-024', name: 'Angle-Head Flashlight — OD Green', category: 'Tools', price: 12.00, stock: 15, maxStock: 25, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\uD83D\uDD26' },
  { id: 'SINV-025', name: 'Ka-Bar USMC Knife', category: 'Tools', price: 55.00, stock: 4, maxStock: 10, image: INV_WK_SURPLUS + 'b/b1/Ka-Bar_USMC_knife.jpg/400px-Ka-Bar_USMC_knife.jpg', icon: '\uD83D\uDD2A' },

  // ── Collectibles ────────────────────────────────────────────
  { id: 'SINV-026', name: 'Challenge Coin — Assorted Units', category: 'Collectibles', price: 10.00, stock: 35, maxStock: 60, image: INV_WK_SURPLUS + 'f/f7/Badge_Pathfinder.svg/400px-Badge_Pathfinder.svg.png', icon: '\uD83E\uDE99' },
  { id: 'SINV-027', name: 'Unit Crest / DUI — Various', category: 'Collectibles', price: 8.00, stock: 40, maxStock: 75, image: INV_WK_SURPLUS + '0/0b/Army-USA-OR-06.svg/400px-Army-USA-OR-06.svg.png', icon: '\u2694' },
  { id: 'SINV-028', name: 'Vintage Patch Collection — 5 Pack', category: 'Collectibles', price: 20.00, stock: 10, maxStock: 20, image: INV_WK_SURPLUS + 'a/a4/Patch_of_the_82nd_Airborne_Division_%28OCP%29.svg/400px-Patch_of_the_82nd_Airborne_Division_%28OCP%29.svg.png', icon: '\u2605' },
  { id: 'SINV-029', name: 'Service Medal — Assorted (Used)', category: 'Collectibles', price: 15.00, stock: 20, maxStock: 40, image: INV_WK_SURPLUS + 'f/fe/TimWalzServiceAwardsRack.png/400px-TimWalzServiceAwardsRack.png', icon: '\uD83C\uDFC5' },
  { id: 'SINV-030', name: 'Dog Tags — Vintage (Pair)', category: 'Collectibles', price: 12.00, stock: 15, maxStock: 25, image: INV_WK_SURPLUS + '4/41/Dog_tag_%28military%29.jpg/400px-Dog_tag_%28military%29.jpg', icon: '\uD83C\uDFF7' },

  // ── Camping ─────────────────────────────────────────────────
  { id: 'SINV-031', name: 'Pup Tent — Complete (2-Man)', category: 'Camping', price: 35.00, stock: 8, maxStock: 15, image: INV_WK_SURPLUS + '8/80/Army_greens.jpg/400px-Army_greens.jpg', icon: '\u26FA' },
  { id: 'SINV-032', name: 'Sleeping Pad — Closed Cell Foam', category: 'Camping', price: 14.00, stock: 16, maxStock: 30, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\u2261' },
  { id: 'SINV-033', name: 'Canteen Cup Stove', category: 'Camping', price: 8.00, stock: 20, maxStock: 35, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\uD83D\uDD25' },
  { id: 'SINV-034', name: 'Trioxane Fire Starter Bars (3-Pack)', category: 'Camping', price: 5.00, stock: 30, maxStock: 50, image: INV_WK_SURPLUS + '0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\u2668' },
  { id: 'SINV-035', name: '550 Paracord — 100ft (OD Green)', category: 'Camping', price: 7.00, stock: 25, maxStock: 40, image: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Operational_Camouflage_Pattern_2015.jpg', icon: '\u27B0' }
];

const invCategoriesSurplus = ['Clothing', 'Field Gear', 'Tactical', 'Rations', 'Tools', 'Collectibles', 'Camping'];
