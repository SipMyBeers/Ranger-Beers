// ══════════════════════════════════════════════════════════════
//  SewReady — Shared Service Data
//  Loaded by services.html AND customer.html
// ══════════════════════════════════════════════════════════════

const SVC_WK = 'https://upload.wikimedia.org/wikipedia/commons/';

const svcImages = {
  // Name tapes / tapes
  'SVC-001': SVC_WK + '6/67/Operational_Camouflage_Pattern_2015.jpg',
  'SVC-002': SVC_WK + '6/67/Operational_Camouflage_Pattern_2015.jpg',
  'SVC-003': SVC_WK + 'thumb/2/23/Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg/400px-Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg',
  'SVC-004': SVC_WK + '6/67/Operational_Camouflage_Pattern_2015.jpg',
  // Sew-on services
  'SVC-010': SVC_WK + '6/67/Operational_Camouflage_Pattern_2015.jpg',
  'SVC-011': SVC_WK + '6/67/Operational_Camouflage_Pattern_2015.jpg',
  'SVC-012': SVC_WK + 'thumb/0/0b/Army-USA-OR-06.svg/400px-Army-USA-OR-06.svg.png',
  'SVC-013': SVC_WK + 'thumb/0/0b/Army-USA-OR-06.svg/400px-Army-USA-OR-06.svg.png',
  'SVC-014': SVC_WK + 'thumb/a/a1/OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg/400px-OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg',
  'SVC-015': SVC_WK + 'thumb/a/a1/OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg/400px-OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg',
  'SVC-016': SVC_WK + 'thumb/e/e2/Flag_of_the_United_States_%28Pantone%29.svg/400px-Flag_of_the_United_States_%28Pantone%29.svg.png',
  'SVC-017': SVC_WK + 'thumb/f/f7/Badge_Pathfinder.svg/400px-Badge_Pathfinder.svg.png',
  'SVC-018': SVC_WK + 'thumb/5/55/Ranger_Tab.svg/400px-Ranger_Tab.svg.png',
  'SVC-019': SVC_WK + 'thumb/0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg',
  'SVC-020': SVC_WK + 'thumb/e/e2/Flag_of_the_United_States_%28Pantone%29.svg/400px-Flag_of_the_United_States_%28Pantone%29.svg.png',
  'SVC-021': SVC_WK + 'thumb/f/fe/TimWalzServiceAwardsRack.png/400px-TimWalzServiceAwardsRack.png',
  'SVC-022': SVC_WK + 'thumb/b/b2/PEO_Soldier_illustration_of_Black_Beret_portrait.jpg/400px-PEO_Soldier_illustration_of_Black_Beret_portrait.jpg',
  'SVC-023': SVC_WK + 'thumb/d/d1/Brigadier_General_Michael_B._Siegl_AGSU.jpg/400px-Brigadier_General_Michael_B._Siegl_AGSU.jpg',
  'SVC-024': SVC_WK + '9/9c/Army_Combat_Boot_%28Temperate%29.jpg',
  // Removal
  'SVC-030': SVC_WK + 'thumb/5/5a/Seam_ripper.jpg/400px-Seam_ripper.jpg',
  'SVC-031': SVC_WK + 'thumb/5/5a/Seam_ripper.jpg/400px-Seam_ripper.jpg',
  'SVC-032': SVC_WK + 'thumb/5/5a/Seam_ripper.jpg/400px-Seam_ripper.jpg',
  'SVC-033': SVC_WK + 'thumb/4/4d/Scissors_01.jpg/400px-Scissors_01.jpg',
  'SVC-034': SVC_WK + 'thumb/f/fe/TimWalzServiceAwardsRack.png/400px-TimWalzServiceAwardsRack.png',
  // Combo / Bundle
  'SVC-040': SVC_WK + '6/67/Operational_Camouflage_Pattern_2015.jpg',
  'SVC-041': SVC_WK + 'thumb/0/0b/Army-USA-OR-06.svg/400px-Army-USA-OR-06.svg.png',
  'SVC-042': SVC_WK + 'thumb/5/55/Ranger_Tab.svg/400px-Ranger_Tab.svg.png',
  'SVC-043': SVC_WK + 'thumb/a/a1/OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg/400px-OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg',
  'SVC-044': SVC_WK + 'thumb/d/d1/Brigadier_General_Michael_B._Siegl_AGSU.jpg/400px-Brigadier_General_Michael_B._Siegl_AGSU.jpg',
  'SVC-045': SVC_WK + 'thumb/0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/400px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg',
  // Alteration
  'SVC-050': SVC_WK + 'thumb/8/80/Army_greens.jpg/400px-Army_greens.jpg',
  'SVC-051': SVC_WK + 'thumb/7/7e/U.S._Army_Reserve_Soldiers_in_Army_Service_Uniform_170725-A-TI382-0757.jpg/400px-U.S._Army_Reserve_Soldiers_in_Army_Service_Uniform_170725-A-TI382-0757.jpg',
  'SVC-052': SVC_WK + '6/67/Operational_Camouflage_Pattern_2015.jpg',
  'SVC-053': SVC_WK + 'thumb/b/b2/PEO_Soldier_illustration_of_Black_Beret_portrait.jpg/400px-PEO_Soldier_illustration_of_Black_Beret_portrait.jpg',
  'SVC-054': SVC_WK + 'thumb/0/04/Measuring_tape.jpg/400px-Measuring_tape.jpg',
  'SVC-055': SVC_WK + 'thumb/0/04/Measuring_tape.jpg/400px-Measuring_tape.jpg'
};

// ── 55 Services ─────────────────────────────────────────────
const services = [
  // ── Creation ──────────────────────────────────────────────
  { id: 'SVC-001', name: 'Name Tape — Creation (OCP)', price: 8.00, category: 'creation',
    desc: 'Custom name tape embroidered on OCP-pattern fabric. Includes matching hook-and-loop backing.',
    tags: ['OCP', 'Custom', 'Hook & Loop'], time: '15 min' },
  { id: 'SVC-002', name: 'Custom Nametape', price: 6.00, category: 'creation',
    desc: 'Custom name tape embroidered on your choice of OCP or UCP fabric. Choose velcro or sew-on backing.',
    tags: ['OCP', 'UCP', 'Custom', 'Configurable'], time: '10 min' },
  { id: 'SVC-003', name: 'Name Tape — Creation (AGSU)', price: 10.00, category: 'creation',
    desc: 'Custom name tape for Army Green Service Uniform. Gold lettering on dark green fabric.',
    tags: ['AGSU', 'Custom'], time: '15 min' },
  { id: 'SVC-004', name: 'US Army Tape — Creation (OCP)', price: 8.00, category: 'creation',
    desc: 'Standard US Army branch tape, OCP pattern with hook-and-loop backing.',
    tags: ['OCP', 'Standard', 'Hook & Loop'], time: '10 min' },

  // ── Sewing / Attach ───────────────────────────────────────
  { id: 'SVC-010', name: 'Name Tape — Sew On', price: 5.00, category: 'sewing',
    desc: 'Sew customer-provided name tape onto uniform. All four edges, matching thread.',
    tags: ['OCP', 'AGSU', 'Quick'], time: '8 min' },
  { id: 'SVC-011', name: 'US Army Tape — Sew On', price: 5.00, category: 'sewing',
    desc: 'Sew customer-provided US Army tape onto left breast pocket area.',
    tags: ['OCP', 'Quick'], time: '8 min' },
  { id: 'SVC-012', name: 'Rank Insignia — Attach (Hook & Loop)', price: 4.00, category: 'sewing',
    desc: 'Attach hook-and-loop rank insignia backing to uniform. Quick swap ready.',
    tags: ['OCP', 'Patrol Cap', 'Hook & Loop'], time: '5 min' },
  { id: 'SVC-013', name: 'Rank Insignia — Sew On (Permanent)', price: 8.00, category: 'sewing',
    desc: 'Permanently sew rank insignia onto OCP coat or patrol cap. More durable than hook-and-loop.',
    tags: ['OCP', 'Permanent'], time: '10 min' },
  { id: 'SVC-014', name: 'Unit Patch (SSI) — Sew On', price: 10.00, category: 'sewing',
    desc: 'Sew unit patch to left shoulder sleeve, 1/2" below shoulder seam per AR 670-1.',
    tags: ['OCP', 'Left Shoulder'], time: '12 min' },
  { id: 'SVC-015', name: 'Combat Patch (SSI-FWTS) — Sew On', price: 10.00, category: 'sewing',
    desc: 'Sew combat/deployment patch to right shoulder, 1/8" below flag per AR 670-1.',
    tags: ['OCP', 'Right Shoulder'], time: '12 min' },
  { id: 'SVC-016', name: 'US Flag — Sew On', price: 8.00, category: 'sewing',
    desc: 'Sew US flag (full color or IR) to right shoulder, 1/2" below seam, stars forward.',
    tags: ['OCP', 'Right Shoulder'], time: '10 min' },
  { id: 'SVC-017', name: 'Skill Badge — Sew On', price: 10.00, category: 'sewing',
    desc: 'Sew skill badge (Airborne, Air Assault, Pathfinder, CIB, etc.) per DA PAM 670-1 spacing.',
    tags: ['OCP', 'AGSU', 'Badge'], time: '12 min' },
  { id: 'SVC-018', name: 'Tab — Sew On (Ranger/Airborne/Sapper/SF)', price: 10.00, category: 'sewing',
    desc: 'Sew tab above unit patch on left shoulder per AR 670-1 para 21-30 precedence.',
    tags: ['OCP', 'Left Shoulder', 'Tab'], time: '10 min' },
  { id: 'SVC-019', name: 'Cat Eyes — Sew On', price: 6.00, category: 'sewing',
    desc: 'Sew luminous cat eyes strips to rear of patrol cap. Two 1/2"x1" strips, 1" apart.',
    tags: ['Patrol Cap', 'Field'], time: '8 min' },
  { id: 'SVC-020', name: 'IR Flag / IR Square — Sew On', price: 8.00, category: 'sewing',
    desc: 'Sew IR identification flag or square. Right shoulder or patrol cap per unit SOP.',
    tags: ['OCP', 'Patrol Cap', 'Tactical'], time: '10 min' },
  { id: 'SVC-021', name: 'Awards Rack — Mount & Attach', price: 25.00, category: 'sewing',
    desc: 'Mount ribbon rack on bar, level above left breast pocket per DA PAM 670-1 para 21-9.',
    tags: ['AGSU', 'ASU', 'Awards'], time: '20 min' },
  { id: 'SVC-022', name: 'Beret Flash — Sew On', price: 8.00, category: 'sewing',
    desc: 'Sew unit flash onto beret. Center flash over left eye per AR 670-1.',
    tags: ['Beret', 'Headgear'], time: '10 min' },
  { id: 'SVC-023', name: 'AGSU Nameplate — Attach', price: 5.00, category: 'sewing',
    desc: 'Attach nameplate to AGSU jacket, centered 1-3" above top button on right side.',
    tags: ['AGSU', 'Quick'], time: '5 min' },
  { id: 'SVC-024', name: 'Boot Blousing — Elastic Bands', price: 4.00, category: 'sewing',
    desc: 'Attach blousing elastic bands inside trouser legs for clean boot tuck.',
    tags: ['OCP', 'Boots', 'Quick'], time: '5 min' },

  // ── Removal ───────────────────────────────────────────────
  { id: 'SVC-030', name: 'Rank Removal (Old Rank)', price: 5.00, category: 'removal',
    desc: 'Carefully remove old rank insignia and hook-and-loop backing. Clean area for new rank.',
    tags: ['Promotion', 'Clean'], time: '8 min' },
  { id: 'SVC-031', name: 'Patch Removal — Single', price: 6.00, category: 'removal',
    desc: 'Remove one sewn patch (unit patch, combat patch, flag, tab). Clean leftover thread.',
    tags: ['Any Uniform'], time: '10 min' },
  { id: 'SVC-032', name: 'Name Tape Removal', price: 4.00, category: 'removal',
    desc: 'Remove old name tape. Seam rip and clean all residual thread.',
    tags: ['OCP', 'Quick'], time: '5 min' },
  { id: 'SVC-033', name: 'Full Strip — All Items', price: 20.00, category: 'removal',
    desc: 'Remove all patches, tapes, badges, and insignia from one uniform item. Complete clean.',
    tags: ['Any Uniform', 'PCS', 'Reissue'], time: '25 min' },
  { id: 'SVC-034', name: 'Awards Rack — Disassemble', price: 10.00, category: 'removal',
    desc: 'Remove awards rack from jacket and disassemble individual ribbons from mounting bar.',
    tags: ['AGSU', 'ASU'], time: '10 min' },

  // ── Combo / Bundle ────────────────────────────────────────
  { id: 'SVC-040', name: 'OCP Top — Full Setup', price: 45.00, category: 'combo',
    desc: 'Complete OCP coat setup: name tape, US Army tape, rank, unit patch, flag. All items per AR 670-1.',
    tags: ['OCP', 'Full Service', 'Popular'], time: '45 min' },
  { id: 'SVC-041', name: 'OCP Top — Promotion Re-sew', price: 18.00, category: 'combo',
    desc: 'Remove old rank + attach new rank. Includes inspection of all existing items.',
    tags: ['OCP', 'Promotion'], time: '15 min' },
  { id: 'SVC-042', name: 'Ranger Bundle (Cap + Coat)', price: 30.00, category: 'combo',
    desc: 'Cat eyes on patrol cap, IR flag on right shoulder, Ranger tab above unit patch.',
    tags: ['Ranger', 'OCP', 'Bundle'], time: '30 min' },
  { id: 'SVC-043', name: 'PCS Bundle — Strip & Re-sew', price: 55.00, category: 'combo',
    desc: 'Full strip of old unit items + sew on new unit patch, combat patch (if applicable). PCS ready.',
    tags: ['PCS', 'Full Service'], time: '50 min' },
  { id: 'SVC-044', name: 'AGSU Jacket — Full Setup', price: 65.00, category: 'combo',
    desc: 'Complete AGSU jacket: awards rack, skill badges, rank, unit crest, RDI, nameplate. DA PAM 670-1.',
    tags: ['AGSU', 'Full Service', 'Premium'], time: '60 min' },
  { id: 'SVC-045', name: 'Patrol Cap — Full Setup', price: 20.00, category: 'combo',
    desc: 'Rank insignia, cat eyes, and IR square on patrol cap per AR 670-1 and unit SOP.',
    tags: ['Patrol Cap', 'Bundle'], time: '25 min' },

  // ── Alteration ────────────────────────────────────────────
  { id: 'SVC-050', name: 'AGSU Trousers — Hem', price: 22.00, category: 'alteration',
    desc: 'Hem AGSU trousers to regulation length. Slight break at front, 1/2" longer at back per AR 670-1.',
    tags: ['AGSU', 'Hemming'], time: '25 min' },
  { id: 'SVC-051', name: 'ASU Trousers — Hem', price: 22.00, category: 'alteration',
    desc: 'Hem ASU dress blue trousers to regulation length with blind stitch.',
    tags: ['ASU', 'Hemming'], time: '25 min' },
  { id: 'SVC-052', name: 'OCP Trousers — Hem', price: 15.00, category: 'alteration',
    desc: 'Hem OCP trousers. Match original hem style, Tan 499 thread.',
    tags: ['OCP', 'Hemming'], time: '20 min' },
  { id: 'SVC-053', name: 'Beret — Shave & Shape', price: 12.00, category: 'alteration',
    desc: 'Shave excess fuzz, shape beret to regulation form. Includes flash alignment.',
    tags: ['Beret', 'Headgear'], time: '15 min' },
  { id: 'SVC-054', name: 'Jacket — Take In / Let Out', price: 25.00, category: 'alteration',
    desc: 'Alter jacket sides for better fit. AGSU or ASU. Must maintain regulation appearance.',
    tags: ['AGSU', 'ASU', 'Fitting'], time: '30 min' },
  { id: 'SVC-055', name: 'Sleeve Shortening', price: 18.00, category: 'alteration',
    desc: 'Shorten AGSU or ASU jacket sleeves. Re-hem to regulation length.',
    tags: ['AGSU', 'ASU'], time: '20 min' }
];

// ── Category Labels & Classes ───────────────────────────────
const catLabels = {
  creation: 'Creation', sewing: 'Sewing / Attach', removal: 'Removal',
  combo: 'Combo / Bundle', alteration: 'Alteration'
};
const catClass = {
  creation: 'svc-cat-creation', sewing: 'svc-cat-sewing', removal: 'svc-cat-removal',
  combo: 'svc-cat-combo', alteration: 'svc-cat-alteration'
};

// ── Korean Translations ─────────────────────────────────────
const catLabelsKO = {
  creation: '제작', sewing: '봉제 / 부착', removal: '제거',
  combo: '콤보 / 번들', alteration: '수선'
};

const servicesKO = {
  'SVC-001': { name: '이름 테이프 — 제작 (OCP)', desc: 'OCP 패턴 원단에 맞춤 자수 이름 테이프. 벨크로 포함.' },
  'SVC-002': { name: '이름 테이프 — 제작 (벨크로 없음)', desc: 'OCP 패턴 원단에 맞춤 자수 이름 테이프. 봉제 전용, 벨크로 없음.' },
  'SVC-003': { name: '이름 테이프 — 제작 (AGSU)', desc: '육군 정복용 맞춤 이름 테이프. 짙은 녹색 원단에 금색 글자.' },
  'SVC-004': { name: 'US Army 테이프 — 제작 (OCP)', desc: '표준 US Army 소속 테이프, OCP 패턴, 벨크로 포함.' },
  'SVC-010': { name: '이름 테이프 — 봉제', desc: '고객 제공 이름 테이프를 군복에 봉제. 사방 가장자리, 색상 맞춤 실.' },
  'SVC-011': { name: 'US Army 테이프 — 봉제', desc: '고객 제공 US Army 테이프를 왼쪽 가슴 포켓에 봉제.' },
  'SVC-012': { name: '계급장 — 부착 (벨크로)', desc: '벨크로 계급장 받침을 군복에 부착. 빠른 교체 가능.' },
  'SVC-013': { name: '계급장 — 봉제 (영구)', desc: 'OCP 상의 또는 전투모에 계급장 영구 봉제. 벨크로보다 내구성 우수.' },
  'SVC-014': { name: '부대 패치 (SSI) — 봉제', desc: '좌측 어깨에 부대 패치 봉제, 어깨 솔기 아래 1/2인치. AR 670-1 준수.' },
  'SVC-015': { name: '전투 패치 (SSI-FWTS) — 봉제', desc: '우측 어깨에 전투/파견 패치 봉제. AR 670-1 준수.' },
  'SVC-016': { name: '미국 국기 — 봉제', desc: '우측 어깨에 미국 국기(풀컬러 또는 IR) 봉제. 별이 앞을 향하도록.' },
  'SVC-017': { name: '기술 배지 — 봉제', desc: '공수, 강습, 패스파인더, CIB 등 기술 배지 봉제. DA PAM 670-1 간격 준수.' },
  'SVC-018': { name: '탭 — 봉제 (레인저/공수/공병/특전)', desc: '좌측 어깨 부대 패치 위에 탭 봉제. AR 670-1 우선순위 준수.' },
  'SVC-019': { name: '캣 아이즈 — 봉제', desc: '전투모 후면에 야광 캣 아이즈 스트립 봉제.' },
  'SVC-020': { name: 'IR 국기 / IR 사각 — 봉제', desc: 'IR 식별 국기 또는 사각 봉제. 우측 어깨 또는 전투모.' },
  'SVC-021': { name: '훈장 랙 — 장착 및 부착', desc: '리본 랙을 바에 장착, 좌측 가슴 포켓 위에 부착. DA PAM 670-1 준수.' },
  'SVC-022': { name: '베레모 플래시 — 봉제', desc: '부대 플래시를 베레모에 봉제. 왼쪽 눈 위 중앙. AR 670-1 준수.' },
  'SVC-023': { name: 'AGSU 명패 — 부착', desc: 'AGSU 자켓에 명패 부착, 우측 상단 버튼 위 1-3인치 중앙.' },
  'SVC-024': { name: '부츠 블라우징 — 고무줄', desc: '바지 안쪽에 블라우징 고무줄 부착.' },
  'SVC-030': { name: '계급 제거 (구 계급)', desc: '구 계급장 및 벨크로 받침 정밀 제거. 새 계급을 위한 정리.' },
  'SVC-031': { name: '패치 제거 — 단일', desc: '봉제된 패치 1개 제거 (부대, 전투, 국기, 탭). 잔여 실 정리.' },
  'SVC-032': { name: '이름 테이프 제거', desc: '구 이름 테이프 제거. 솔기 뜯기 및 잔여 실 정리.' },
  'SVC-033': { name: '전체 제거 — 모든 항목', desc: '군복 한 벌의 모든 패치, 테이프, 배지, 계급장 제거. 완전 정리.' },
  'SVC-034': { name: '훈장 랙 — 분해', desc: '자켓에서 훈장 랙 제거 및 개별 리본 분리.' },
  'SVC-040': { name: 'OCP 상의 — 풀 셋업', desc: 'OCP 상의 완전 셋업: 이름 테이프, US Army 테이프, 계급, 부대 패치, 국기. AR 670-1 준수.' },
  'SVC-041': { name: 'OCP 상의 — 진급 재봉제', desc: '구 계급 제거 + 신규 계급 부착. 기존 항목 점검 포함.' },
  'SVC-042': { name: '레인저 번들 (모자 + 상의)', desc: '전투모 캣 아이즈, 우측 어깨 IR 국기, 부대 패치 위 레인저 탭.' },
  'SVC-043': { name: 'PCS 번들 — 제거 및 재봉제', desc: '구 부대 항목 전체 제거 + 신규 부대 패치, 전투 패치(해당 시) 봉제.' },
  'SVC-044': { name: 'AGSU 자켓 — 풀 셋업', desc: 'AGSU 자켓 완전 셋업: 훈장 랙, 기술 배지, 계급, 부대 문장, 명패. DA PAM 670-1.' },
  'SVC-045': { name: '전투모 — 풀 셋업', desc: '전투모 계급장, 캣 아이즈, IR 사각. AR 670-1 및 부대 SOP 준수.' },
  'SVC-050': { name: 'AGSU 바지 — 밑단', desc: 'AGSU 바지 규정 길이로 밑단 처리. AR 670-1 준수.' },
  'SVC-051': { name: 'ASU 바지 — 밑단', desc: 'ASU 정복 바지 규정 길이로 밑단 처리. 블라인드 스티치.' },
  'SVC-052': { name: 'OCP 바지 — 밑단', desc: 'OCP 바지 밑단 처리. 원래 밑단 스타일 맞춤, Tan 499 실.' },
  'SVC-053': { name: '베레모 — 털 정리 및 성형', desc: '베레모 보풀 제거, 규정 형태로 성형. 플래시 정렬 포함.' },
  'SVC-054': { name: '자켓 — 줄이기 / 늘리기', desc: '자켓 옆면 수선. AGSU 또는 ASU. 규정 외관 유지.' },
  'SVC-055': { name: '소매 단축', desc: 'AGSU 또는 ASU 자켓 소매 단축. 규정 길이로 재밑단.' }
};

// Helper functions for localized service/category names
function svcName(svc) {
  if (typeof getCurrentLang === 'function' && getCurrentLang() === 'ko' && servicesKO[svc.id]) {
    return servicesKO[svc.id].name;
  }
  return svc.name;
}

function svcDesc(svc) {
  if (typeof getCurrentLang === 'function' && getCurrentLang() === 'ko' && servicesKO[svc.id]) {
    return servicesKO[svc.id].desc;
  }
  return svc.desc;
}

function catLabel(cat) {
  if (typeof getCurrentLang === 'function' && getCurrentLang() === 'ko' && catLabelsKO[cat]) {
    return catLabelsKO[cat];
  }
  return catLabels[cat] || cat;
}
