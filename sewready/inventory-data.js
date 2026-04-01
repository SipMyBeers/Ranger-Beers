// ══════════════════════════════════════════════════════════════
//  SewReady — Shared Inventory Data
//  Loaded by inventory.html AND customer.html
// ══════════════════════════════════════════════════════════════

const INV_WK = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';

const storeInventory = [
  { id: 'INV-001', name: 'Name Tape (OCP)', category: 'Tapes', price: 5.00, stock: 48, maxStock: 60, image: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Operational_Camouflage_Pattern_2015.jpg', icon: 'Aa' },
  { id: 'INV-002', name: 'US Army Tape (OCP)', category: 'Tapes', price: 5.00, stock: 35, maxStock: 50, image: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Operational_Camouflage_Pattern_2015.jpg', icon: 'US' },
  { id: 'INV-003', name: 'Name Tape (AGSU)', category: 'Tapes', price: 6.00, stock: 20, maxStock: 30, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg/400px-Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg', icon: 'Aa' },
  { id: 'INV-004', name: 'Rank Insignia — Hook & Loop', category: 'Insignia', price: 8.00, stock: 60, maxStock: 80, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Army-USA-OR-06.svg/400px-Army-USA-OR-06.svg.png', icon: '\u2605' },
  { id: 'INV-005', name: 'Rank Insignia — Pin-on (AGSU)', category: 'Insignia', price: 12.00, stock: 25, maxStock: 40, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Army-USA-OR-06.svg/400px-Army-USA-OR-06.svg.png', icon: '\u2605' },
  { id: 'INV-006', name: 'Unit Patch — 82nd Airborne', category: 'Patches', price: 12.00, stock: 15, maxStock: 25,
    image: INV_WK + 'a/a4/Patch_of_the_82nd_Airborne_Division_%28OCP%29.svg/200px-Patch_of_the_82nd_Airborne_Division_%28OCP%29.svg.png' },
  { id: 'INV-007', name: 'Unit Patch — 101st Airborne', category: 'Patches', price: 12.00, stock: 12, maxStock: 25,
    image: INV_WK + '9/98/US_101st_Airborne_Division_patch.svg/200px-US_101st_Airborne_Division_patch.svg.png' },
  { id: 'INV-008', name: 'Unit Patch — 3rd Infantry', category: 'Patches', price: 12.00, stock: 10, maxStock: 25,
    image: INV_WK + '4/48/3rd_Infantry_Division_SSI_%281918-2015%29.svg/200px-3rd_Infantry_Division_SSI_%281918-2015%29.svg.png' },
  { id: 'INV-009', name: 'Unit Patch — 10th Mountain', category: 'Patches', price: 12.00, stock: 8, maxStock: 25,
    image: INV_WK + '3/3d/Shoulder_sleeve_insignia_of_the_10th_Mountain_Division_%281944-2015%29.svg/200px-Shoulder_sleeve_insignia_of_the_10th_Mountain_Division_%281944-2015%29.svg.png' },
  { id: 'INV-010', name: 'Unit Patch — 1st Cavalry', category: 'Patches', price: 12.00, stock: 14, maxStock: 25,
    image: INV_WK + '7/7f/1st_Cavalry_Division_SSI_%28full_color%29.svg/200px-1st_Cavalry_Division_SSI_%28full_color%29.svg.png' },
  { id: 'INV-011', name: 'Unit Patch — 4th Infantry', category: 'Patches', price: 12.00, stock: 11, maxStock: 25,
    image: INV_WK + '0/0a/4th_Infantry_Division_SSI.svg/200px-4th_Infantry_Division_SSI.svg.png' },
  { id: 'INV-012', name: 'Combat Patch (Right Sleeve)', category: 'Patches', price: 12.00, stock: 20, maxStock: 30, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg/400px-OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg', icon: '\u272A' },
  { id: 'INV-013', name: 'IR Flag (Reverse)', category: 'Patches', price: 15.00, stock: 18, maxStock: 25,
    image: INV_WK + '7/79/Flag_of_the_United_States_%28reversed%29.svg/200px-Flag_of_the_United_States_%28reversed%29.svg.png' },
  { id: 'INV-014', name: 'US Flag Patch (Full Color)', category: 'Patches', price: 10.00, stock: 22, maxStock: 30,
    image: INV_WK + 'a/a4/Flag_of_the_United_States.svg/200px-Flag_of_the_United_States.svg.png' },
  { id: 'INV-015', name: 'Cat Eyes Strip', category: 'Accessories', price: 6.00, stock: 22, maxStock: 30, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg', icon: '\u25AE\u25AE' },
  { id: 'INV-016', name: 'Ranger Tab', category: 'Tabs', price: 10.00, stock: 14, maxStock: 20,
    image: INV_WK + '5/55/Ranger_Tab.svg/200px-Ranger_Tab.svg.png' },
  { id: 'INV-017', name: 'Airborne Tab', category: 'Tabs', price: 10.00, stock: 16, maxStock: 20,
    image: INV_WK + '6/6d/Airborne_Tab.svg/200px-Airborne_Tab.svg.png' },
  { id: 'INV-018', name: 'Sapper Tab', category: 'Tabs', price: 10.00, stock: 3, maxStock: 15, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Sapper_Tab.svg/200px-Sapper_Tab.svg.png', icon: '\u2692' },
  { id: 'INV-019', name: 'Special Forces Tab', category: 'Tabs', price: 10.00, stock: 5, maxStock: 15,
    image: INV_WK + 'd/da/US_Army_Special_Forces_Insignia_incl_SP_tab.svg/200px-US_Army_Special_Forces_Insignia_incl_SP_tab.svg.png' },
  { id: 'INV-020', name: 'Skill Badge — Airborne Wings', category: 'Badges', price: 14.00, stock: 20, maxStock: 30,
    image: INV_WK + 'f/fd/US_Army_Airborne_basic_parachutist_badge-vector.svg/200px-US_Army_Airborne_basic_parachutist_badge-vector.svg.png' },
  { id: 'INV-021', name: 'Skill Badge — Air Assault', category: 'Badges', price: 14.00, stock: 15, maxStock: 25,
    image: INV_WK + '0/0a/AirAssault.svg/200px-AirAssault.svg.png' },
  { id: 'INV-022', name: 'Skill Badge — Pathfinder', category: 'Badges', price: 14.00, stock: 8, maxStock: 20,
    image: INV_WK + 'f/f7/Badge_Pathfinder.svg/200px-Badge_Pathfinder.svg.png' },
  { id: 'INV-023', name: 'Skill Badge — Ranger', category: 'Badges', price: 14.00, stock: 10, maxStock: 20,
    image: INV_WK + '5/55/Ranger_Tab.svg/200px-Ranger_Tab.svg.png' },
  { id: 'INV-024', name: 'Skill Badge — Combat Infantry (CIB)', category: 'Badges', price: 16.00, stock: 12, maxStock: 20,
    image: INV_WK + '8/82/Combat_Infantry_Badge.svg/200px-Combat_Infantry_Badge.svg.png' },
  { id: 'INV-025', name: 'Awards Rack — Mounting Bar', category: 'Awards', price: 20.00, stock: 10, maxStock: 15, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/TimWalzServiceAwardsRack.png/400px-TimWalzServiceAwardsRack.png', icon: '\u2550' },
  { id: 'INV-026', name: 'Purple Heart Medal', category: 'Awards', price: 25.00, stock: 5, maxStock: 10,
    image: INV_WK + 'e/e3/Purple_Heart_ribbon.svg/200px-Purple_Heart_ribbon.svg.png' },
  { id: 'INV-027', name: 'Bronze Star Medal', category: 'Awards', price: 25.00, stock: 4, maxStock: 10,
    image: INV_WK + '9/95/Bronze_Star_Medal_ribbon.svg/200px-Bronze_Star_Medal_ribbon.svg.png' },
  { id: 'INV-028', name: 'Army Commendation Medal', category: 'Awards', price: 18.00, stock: 8, maxStock: 15,
    image: INV_WK + '3/3b/Army_Commendation_Medal_ribbon.svg/200px-Army_Commendation_Medal_ribbon.svg.png' },
  { id: 'INV-029', name: 'Army Achievement Medal', category: 'Awards', price: 15.00, stock: 12, maxStock: 20,
    image: INV_WK + '2/2f/Army_Achievement_Medal_ribbon.svg/200px-Army_Achievement_Medal_ribbon.svg.png' },
  { id: 'INV-030', name: 'OCP Thread Spool (Tan 499)', category: 'Supplies', price: 3.00, stock: 30, maxStock: 50, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Spools_of_thread.jpg/400px-Spools_of_thread.jpg', icon: '\u2699' },
  { id: 'INV-031', name: 'AGSU Thread Spool (Blue 154)', category: 'Supplies', price: 3.50, stock: 18, maxStock: 30, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Spools_of_thread.jpg/400px-Spools_of_thread.jpg', icon: '\u2699' },
  { id: 'INV-032', name: 'Hook & Loop Roll (1" x 5yd)', category: 'Supplies', price: 7.00, stock: 12, maxStock: 20, image: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Operational_Camouflage_Pattern_2015.jpg', icon: '\u2261' },
  { id: 'INV-033', name: 'Seam Ripper (Replacement)', category: 'Supplies', price: 2.50, stock: 8, maxStock: 15, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Seam_ripper.jpg/400px-Seam_ripper.jpg', icon: '\u2702' },
  { id: 'INV-034', name: 'Fabric Marker (Chalk)', category: 'Supplies', price: 1.50, stock: 15, maxStock: 25, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Measuring_tape.jpg/400px-Measuring_tape.jpg', icon: '\u270E' },
  { id: 'INV-035', name: 'Pins Box (100ct)', category: 'Supplies', price: 4.00, stock: 6, maxStock: 12, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Dressmaker_pins.jpg/400px-Dressmaker_pins.jpg', icon: '\u25C8' }
];

const invCategories = ['Tapes', 'Insignia', 'Patches', 'Tabs', 'Badges', 'Accessories', 'Awards', 'Supplies'];

// ── Korean Translations ─────────────────────────────────────
const invCategoriesKO = ['테이프', '계급장', '패치', '탭', '배지', '부속품', '훈장', '소모품'];

const inventoryKO = {
  'INV-001': { name: '이름 테이프 (OCP)' },
  'INV-002': { name: 'US Army 테이프 (OCP)' },
  'INV-003': { name: '이름 테이프 (AGSU)' },
  'INV-004': { name: '계급장 — 벨크로' },
  'INV-005': { name: '계급장 — 핀형 (AGSU)' },
  'INV-006': { name: '부대 패치 — 제82공수사단' },
  'INV-007': { name: '부대 패치 — 제101공수사단' },
  'INV-008': { name: '부대 패치 — 제3보병사단' },
  'INV-009': { name: '부대 패치 — 제10산악사단' },
  'INV-010': { name: '부대 패치 — 제1기갑사단' },
  'INV-011': { name: '부대 패치 — 제4보병사단' },
  'INV-012': { name: '전투 패치 (우측 소매)' },
  'INV-013': { name: 'IR 국기 (반전)' },
  'INV-014': { name: '미국 국기 패치 (풀컬러)' },
  'INV-015': { name: '캣 아이즈 스트립' },
  'INV-016': { name: '레인저 탭' },
  'INV-017': { name: '공수 탭' },
  'INV-018': { name: '공병 탭' },
  'INV-019': { name: '특수부대 탭' },
  'INV-020': { name: '기술 배지 — 공수 날개' },
  'INV-021': { name: '기술 배지 — 공중강습' },
  'INV-022': { name: '기술 배지 — 패스파인더' },
  'INV-023': { name: '기술 배지 — 레인저' },
  'INV-024': { name: '기술 배지 — 전투보병 (CIB)' },
  'INV-025': { name: '훈장 랙 — 장착 바' },
  'INV-026': { name: '퍼플 하트 훈장' },
  'INV-027': { name: '브론즈 스타 훈장' },
  'INV-028': { name: '육군 공로 훈장' },
  'INV-029': { name: '육군 공적 훈장' },
  'INV-030': { name: 'OCP 실 (Tan 499)' },
  'INV-031': { name: 'AGSU 실 (Blue 154)' },
  'INV-032': { name: '벨크로 롤 (1" x 5야드)' },
  'INV-033': { name: '솔기 뜯개 (교체용)' },
  'INV-034': { name: '원단 마커 (분필)' },
  'INV-035': { name: '핀 상자 (100개)' }
};

const invCatMap = {
  'Tapes': '테이프', 'Insignia': '계급장', 'Patches': '패치',
  'Tabs': '탭', 'Badges': '배지', 'Accessories': '부속품',
  'Awards': '훈장', 'Supplies': '소모품'
};

function invName(item) {
  if (typeof getCurrentLang === 'function' && getCurrentLang() === 'ko' && inventoryKO[item.id]) {
    return inventoryKO[item.id].name;
  }
  return item.name;
}

function invCatName(cat) {
  if (typeof getCurrentLang === 'function' && getCurrentLang() === 'ko' && invCatMap[cat]) {
    return invCatMap[cat];
  }
  return cat;
}
