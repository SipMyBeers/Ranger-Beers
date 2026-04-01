document.addEventListener('DOMContentLoaded', () => {

  // Wikimedia Commons base
  const WK = 'https://upload.wikimedia.org/wikipedia/commons/';

  const sops = [
    // ═══════════════════════════════════════════════════════════
    //  OCP UNIFORMS
    // ═══════════════════════════════════════════════════════════
    {
      id: 'sop-ocp-top',
      title: 'OCP Top (ACU Coat)',
      category: 'ocp',
      categoryLabel: 'OCP Combat Uniform',
      image: WK + '6/67/Operational_Camouflage_Pattern_2015.jpg',
      standards: [
        { item: 'Name Tape', location: 'Right breast pocket', method: 'Hook-and-loop or sew-on', regulation: 'DA PAM 670-1, para 4-7',
          detail: 'Centered on hook-and-loop fastener area on right breast pocket. Top of tape 1/4" below top seam of pocket. OCP-pattern fabric, matching thread Tan 499.' },
        { item: 'US Army Tape', location: 'Left breast pocket', method: 'Hook-and-loop or sew-on', regulation: 'DA PAM 670-1, para 4-7',
          detail: 'Centered on hook-and-loop fastener area on left breast pocket. Same vertical alignment as name tape.' },
        { item: 'Rank Insignia', location: 'Center chest', method: 'Hook-and-loop', regulation: 'DA PAM 670-1, para 4-7; AR 670-1, para 21-6',
          detail: 'Centered on chest hook-and-loop area. Subdued pattern for OCP. Soldiers may permanently sew on as alternative.' },
        { item: 'Unit Patch (SSI)', location: 'Left shoulder sleeve', method: 'Sew-on', regulation: 'AR 670-1, para 21-17',
          detail: 'Centered on hook-and-loop area, 1/2" below shoulder seam. Full-color or subdued per unit directive.' },
        { item: 'US Flag', location: 'Right shoulder sleeve', method: 'Sew-on', regulation: 'AR 670-1, para 21-18',
          detail: '1/2" below right shoulder seam. Stars (union) face forward — reverse orientation ("assaulting forward"). Full-color or IR per deployment status.' },
        { item: 'Combat Patch (SSI-FWTS)', location: 'Right shoulder, below flag', method: 'Sew-on', regulation: 'AR 670-1, para 21-18',
          detail: '1/8" below bottom edge of US flag. Authorized for soldiers who served in combat zones per AR 600-8-22.' },
        { item: 'Skill Badges (Group 4)', location: 'Above US Army tape', method: 'Sew-on or pin', regulation: 'DA PAM 670-1, para 21-12',
          detail: '1 badge: centered 1/8" above US Army tape. 2 badges: 1/4" between, lowest 1/8" above tape. Up to 5 authorized. Group 4 includes Airborne Wings, Air Assault, Pathfinder.' },
        { item: 'Combat/Special Skill Badges (Groups 1-3)', location: 'Above US Army tape', method: 'Sew-on or pin', regulation: 'DA PAM 670-1, para 21-12',
          detail: 'Group 1 (CIB, CMB, CAB, etc.) worn above Group 2. Group 2 above Group 3. Precedence order per DA PAM 670-1 Table 21-1.' },
        { item: 'Tabs (Ranger/Airborne/Sapper/SF)', location: 'Left shoulder, above SSI', method: 'Sew-on', regulation: 'AR 670-1, para 21-30',
          detail: 'Centered above unit patch. 1/8" gap between tab and SSI. Precedence top-to-bottom: Special Forces, Ranger, Sapper. Airborne tab may be integral to division patch (82nd, 101st).' }
      ]
    },
    {
      id: 'sop-ocp-bottom',
      title: 'OCP Bottom (ACU Trousers)',
      category: 'ocp',
      categoryLabel: 'OCP Combat Uniform',
      image: WK + 'thumb/a/a1/OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg/500px-OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg',
      standards: [
        { item: 'Name Tape', location: 'Above right cargo pocket', method: 'Sew-on', regulation: 'DA PAM 670-1, para 4-7(b)',
          detail: 'Centered above right cargo pocket, 1/4" above pocket flap. All four edges sewn with matching Tan 499 thread.' },
        { item: 'Hemming', location: 'Bottom of trouser legs', method: 'Sew', regulation: 'AR 670-1, para 4-1',
          detail: 'Trousers are bloused over boots or tucked inside. Hem as needed to prevent excess bunching. Elastic blousing bands authorized.' },
        { item: 'Boot Blousing', location: 'Inside trouser legs', method: 'Elastic bands', regulation: 'AR 670-1, para 4-1',
          detail: 'Trousers bloused using blousing rubbers, bands, or hook-and-loop straps. Blousing must appear neat and uniform, not excessively ballooned.' }
      ]
    },

    // ═══════════════════════════════════════════════════════════
    //  AGSU UNIFORMS
    // ═══════════════════════════════════════════════════════════
    {
      id: 'sop-agsu-ss',
      title: 'AGSU Short-Sleeve Shirt',
      category: 'agsu',
      categoryLabel: 'Army Green Service Uniform',
      image: WK + 'thumb/2/23/Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg/500px-Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg',
      standards: [
        { item: 'Rank Insignia (Enlisted)', location: 'Both sleeves', method: 'Sew-on', regulation: 'DA PAM 670-1, para 21-6',
          detail: 'Centered on the outside of each sleeve, midway between shoulder seam and elbow.' },
        { item: 'Rank Insignia (Officer)', location: 'Both shoulder loops', method: 'Pin-on or slide-on', regulation: 'DA PAM 670-1, para 21-6',
          detail: 'Positioned on shoulder loops (epaulets). Centered, with insignia point facing collar.' },
        { item: 'Nameplate', location: 'Right side of chest', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-25',
          detail: 'Centered on right side, between 1" and 3" above top button. Black nameplate with white lettering.' },
        { item: 'Skill Badges', location: 'Above left pocket area', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-12',
          detail: 'When worn without jacket: centered above left pocket, same rules as jacket placement. Up to 5 authorized.' }
      ]
    },
    {
      id: 'sop-agsu-ls',
      title: 'AGSU Long-Sleeve Shirt',
      category: 'agsu',
      categoryLabel: 'Army Green Service Uniform',
      image: WK + 'thumb/2/23/Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg/500px-Pair_of_soldiers_demonstrate_Army_pink_and_green_prototypes.jpg',
      standards: [
        { item: 'Rank Insignia (Enlisted)', location: 'Both sleeves', method: 'Sew-on', regulation: 'DA PAM 670-1, para 21-6',
          detail: 'Centered on the outside of each sleeve, midway between shoulder seam and elbow.' },
        { item: 'Rank Insignia (Officer)', location: 'Both shoulder loops', method: 'Pin-on or slide-on', regulation: 'DA PAM 670-1, para 21-6',
          detail: 'Positioned on shoulder loops. Centered, insignia point facing collar.' },
        { item: 'Nameplate', location: 'Right side of chest', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-25',
          detail: 'Centered on right side, between 1" and 3" above top button.' },
        { item: 'Skill Badges', location: 'Above left pocket area', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-12',
          detail: 'When worn without jacket: centered above left pocket. Same spacing rules as jacket.' },
        { item: 'Cuff Links', location: 'Shirt cuffs', method: 'Insert', regulation: 'DA PAM 670-1, para 21-27',
          detail: 'Gold-colored cuff links authorized with long-sleeve shirt. Plain or with Army insignia.' }
      ]
    },
    {
      id: 'sop-agsu-coat',
      title: 'AGSU Coat (Jacket)',
      category: 'agsu',
      categoryLabel: 'Army Green Service Uniform',
      image: WK + 'thumb/d/d1/Brigadier_General_Michael_B._Siegl_AGSU.jpg/500px-Brigadier_General_Michael_B._Siegl_AGSU.jpg',
      standards: [
        { item: 'Awards Rack (Ribbons)', location: 'Above left breast pocket', method: 'Pin-on (mounted)', regulation: 'DA PAM 670-1, para 21-9',
          detail: 'Centered 1/8" above left breast pocket seam. Parallel to ground. Rows of 3 or 4 ribbons. Right to left in order of precedence per AR 600-8-22. May be commercially mounted.' },
        { item: 'Skill Badges (Group 1: Combat)', location: 'Above ribbons / left pocket', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-12',
          detail: 'CIB, CMB, CAB, CFMB, EIB, EMB, EAB, EFMB, ESB — centered 1/4" above awards rack or 1/8" above pocket if no rack.' },
        { item: 'Skill Badges (Group 4: Parachutist, AA, PF)', location: 'Above ribbons / left pocket', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-12',
          detail: 'Airborne Wings, Air Assault, Pathfinder — below Group 1 badges, 1/4" spacing. Wearer chooses internal order within Group 4.' },
        { item: 'Rank Insignia (Enlisted)', location: 'Both sleeves', method: 'Sew-on', regulation: 'DA PAM 670-1, para 21-6',
          detail: 'Centered on outside of each sleeve, midway between shoulder seam and elbow.' },
        { item: 'Rank Insignia (Officer)', location: 'Both shoulder loops (epaulets)', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-6',
          detail: 'Centered on epaulets. General officers: stars. Field grade: oak leaf or eagle. Company grade: bars.' },
        { item: 'Unit Crest (DUI)', location: 'Epaulets', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-22',
          detail: 'Centered on epaulets, 1/4" from shoulder seam. One per shoulder. Enlisted soldiers center DUI between shoulder seam and rank.' },
        { item: 'Regimental Insignia (RDI)', location: 'Right lapel', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-23',
          detail: 'Centered on right lapel, 5/8" below notch. Gold-colored metal insignia of the soldier\'s regiment or branch.' },
        { item: 'Branch Insignia', location: 'Left lapel', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-10',
          detail: 'Officers: centered on left lapel, 5/8" below notch. Enlisted: "US" insignia on right collar, branch on left collar (when worn without jacket).' },
        { item: 'Nameplate', location: 'Right side of chest', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-25',
          detail: 'Black nameplate with white letters. Centered on right side, between 1" and 3" above the top button.' },
        { item: 'Service Stripes', location: 'Left sleeve (bottom)', method: 'Sew-on', regulation: 'DA PAM 670-1, para 21-28',
          detail: 'One stripe per 3 years of honorable service. Gold on AG shade 450 background. Centered on outside of left sleeve, 4" from sleeve hem.' },
        { item: 'Overseas Service Bars', location: 'Right sleeve (bottom)', method: 'Sew-on', regulation: 'DA PAM 670-1, para 21-29',
          detail: 'One bar per 6 months of overseas deployment in hostile zone. Gold on AG shade 450 background. 4" from sleeve hem.' },
        { item: 'Unit Patch (SSI)', location: 'Left shoulder sleeve', method: 'Sew-on', regulation: 'AR 670-1, para 21-17',
          detail: 'Full-color SSI, centered 1/2" below shoulder seam.' },
        { item: 'Tabs', location: 'Left shoulder, above SSI', method: 'Sew-on', regulation: 'AR 670-1, para 21-30',
          detail: 'Full-color tabs. Same precedence as OCP: SF, Ranger, Sapper.' }
      ]
    },
    {
      id: 'sop-agsu-trousers',
      title: 'AGSU Trousers',
      category: 'agsu',
      categoryLabel: 'Army Green Service Uniform',
      image: WK + 'thumb/8/80/Army_greens.jpg/500px-Army_greens.jpg',
      standards: [
        { item: 'Hemming', location: 'Bottom of trouser legs', method: 'Blind stitch', regulation: 'AR 670-1, para 4-10(c); DA PAM 670-1, para 4-10',
          detail: 'Slight break at front of shoe. Rear 1/2" longer than front. Trousers must not touch the ground. Hem with matching Blue 154 thread, blind stitch.' },
        { item: 'Trouser Stripe (NCO/Officer)', location: 'Outside seam, both legs', method: 'Sew-on (comes pre-attached)', regulation: 'DA PAM 670-1, para 4-10',
          detail: 'Gold braid stripe on outside seam of each leg. 1/2" wide for NCO (E-7+), 1-1/2" for general officers. Comes factory-attached; verify alignment after hemming.' },
        { item: 'Waist Alteration', location: 'Waistband', method: 'Take in / let out', regulation: 'AR 670-1, para 4-10',
          detail: 'Trousers should fit comfortably at the waist without being excessively tight or loose. Belt line at natural waist.' }
      ]
    },

    // ═══════════════════════════════════════════════════════════
    //  ASU (ARMY SERVICE UNIFORM / DRESS BLUES)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'sop-asu',
      title: 'ASU (Army Service Uniform / Blues)',
      category: 'asu',
      categoryLabel: 'Army Service Uniform (Dress Blues)',
      image: WK + 'thumb/7/7e/U.S._Army_Reserve_Soldiers_in_Army_Service_Uniform_170725-A-TI382-0757.jpg/500px-U.S._Army_Reserve_Soldiers_in_Army_Service_Uniform_170725-A-TI382-0757.jpg',
      standards: [
        { item: 'Awards Rack (Ribbons)', location: 'Above left breast pocket', method: 'Pin-on (mounted)', regulation: 'DA PAM 670-1, para 21-9',
          detail: 'Centered 1/8" above left pocket. Parallel to ground. Ribbons in order of precedence right to left per AR 600-8-22.' },
        { item: 'Full-Size Medals', location: 'Below ribbons (formal occasions)', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-8',
          detail: 'Worn for formal events. Centered on left side. Suspended from mounting bar. Up to 4 medals per row, overlapping if more than 4.' },
        { item: 'Skill Badges', location: 'Above ribbons/medals', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-12',
          detail: 'Same group precedence as AGSU. CIB/CMB/CAB above others. Up to 5 total.' },
        { item: 'Rank Insignia', location: 'Sleeves (enlisted) / Epaulets (officer)', method: 'Sew-on / Pin-on', regulation: 'DA PAM 670-1, para 21-6',
          detail: 'Enlisted: gold-bullion rank centered on both sleeves. Officers: shoulder board insignia or epaulet pins.' },
        { item: 'Unit Crest (DUI)', location: 'Epaulets', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-22',
          detail: 'Centered on each epaulet, 1/4" from shoulder seam.' },
        { item: 'Regimental Insignia (RDI)', location: 'Right collar (enlisted) / Right lapel (officer)', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-23',
          detail: 'Enlisted: centered on right collar, 1" from collar edge. Officers: right lapel, 5/8" below notch.' },
        { item: 'Branch Insignia (US/Branch)', location: 'Collar', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-10',
          detail: 'Enlisted: "US" on right collar, branch insignia on left. Officers: "US" on left lapel. Centered, 1" from collar point.' },
        { item: 'Nameplate', location: 'Right side of chest', method: 'Pin-on', regulation: 'DA PAM 670-1, para 21-25',
          detail: 'Centered between 1" and 3" above top button.' },
        { item: 'Service Stripes', location: 'Left sleeve', method: 'Sew-on', regulation: 'DA PAM 670-1, para 21-28',
          detail: 'Gold on blue. One per 3 years. Centered, 4" from sleeve hem.' },
        { item: 'Overseas Service Bars', location: 'Right sleeve', method: 'Sew-on', regulation: 'DA PAM 670-1, para 21-29',
          detail: 'Gold on blue. One per 6 months in combat zone. 4" from sleeve hem.' },
        { item: 'Hemming (Trousers)', location: 'Bottom of legs', method: 'Blind stitch', regulation: 'AR 670-1, para 4-10',
          detail: 'Same as AGSU: slight break at front, 1/2" longer at back. Blue thread, blind stitch. Gold trouser braid for NCO/officers.' },
        { item: 'Shoulder Cords / Aiguillette', location: 'Shoulder', method: 'Pin/loop attachment', regulation: 'DA PAM 670-1, para 21-31',
          detail: 'Authorized for aides, honor guard, military attaches. Right or left shoulder per specific regulation.' }
      ]
    },

    // ═══════════════════════════════════════════════════════════
    //  HEADGEAR
    // ═══════════════════════════════════════════════════════════
    {
      id: 'sop-patrol-cap',
      title: 'Patrol Cap (OCP)',
      category: 'headgear',
      categoryLabel: 'Headgear',
      image: WK + 'thumb/0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/500px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg',
      standards: [
        { item: 'Rank Insignia', location: 'Front center', method: 'Hook-and-loop or pin-on', regulation: 'AR 670-1, para 4-10(a); DA PAM 670-1, para 4-10(a)',
          detail: 'Centered on front of cap. Subdued, matching OCP pattern. Hook-and-loop or pin-on authorized. Must be straight, not tilted.' },
        { item: 'Cat Eyes', location: 'Rear of cap', method: 'Sew-on', regulation: 'Unit SOP (not in AR 670-1)',
          detail: 'Two luminous strips, each 1/2" x 1", centered on rear of cap, 1" apart. Luminous side out. Required by most combat units for low-light identification.' },
        { item: 'IR Square / Patch', location: 'Top or side', method: 'Sew-on or Velcro', regulation: 'Unit SOP',
          detail: 'IR-reflective square for NVG identification. Placement per unit SOP — typically top of cap or left/right side. Required for field operations.' },
        { item: 'Unit Identification', location: 'Varies by unit', method: 'Sew-on', regulation: 'Unit SOP',
          detail: 'Some units authorize small unit identifiers or colored markings on patrol caps per local SOP.' }
      ]
    },
    {
      id: 'sop-beret',
      title: 'Beret (All Colors)',
      category: 'headgear',
      categoryLabel: 'Headgear',
      image: WK + 'thumb/b/b2/PEO_Soldier_illustration_of_Black_Beret_portrait.jpg/500px-PEO_Soldier_illustration_of_Black_Beret_portrait.jpg',
      standards: [
        { item: 'Beret Flash', location: 'Left front', method: 'Sew-on', regulation: 'AR 670-1, para 4-10(b); DA PAM 670-1, para 4-10(b)',
          detail: 'Unit flash centered over left eye, vertical midline aligned with nose. Flash is unit-specific. Sew through both layers of beret.' },
        { item: 'Rank Insignia', location: 'Centered on flash', method: 'Pin-on', regulation: 'DA PAM 670-1, para 4-10(b)',
          detail: 'Pin-on rank insignia centered on the flash. Officers: branch/rank insignia. Enlisted: rank insignia. Must be shined and secure.' },
        { item: 'Beret Colors', location: 'N/A — color identifies unit type', method: 'N/A', regulation: 'AR 670-1, para 4-10(b)',
          detail: 'Black: standard Army. Tan (khaki): 75th Ranger Regiment. Maroon: Airborne units. Green: Special Forces. All require proper shaving and shaping.' },
        { item: 'Shave & Shape', location: 'Entire beret', method: 'Razor shave, cold water soak, form to head', regulation: 'AR 670-1, para 4-10(b)',
          detail: 'New berets must be shaved of excess fuzz, soaked in cold water, and formed to the wearer\'s head. Excess material drapes to right side, pulled down to ear level.' }
      ]
    },

    // ═══════════════════════════════════════════════════════════
    //  BUNDLES / SPECIAL
    // ═══════════════════════════════════════════════════════════
    {
      id: 'sop-ranger-bundle',
      title: 'Ranger Bundle',
      category: 'ocp',
      categoryLabel: 'OCP Combat Uniform',
      image: WK + 'thumb/5/55/Ranger_Tab.svg/200px-Ranger_Tab.svg.png',
      standards: [
        { item: 'Ranger Tab', location: 'Left shoulder, above SSI', method: 'Sew-on', regulation: 'AR 670-1, para 21-30; DA PAM 670-1, para 21-30',
          detail: 'Centered above unit patch with 1/8" gap. Tab precedence top-to-bottom: Special Forces, Ranger, Sapper. Subdued on OCP, full-color on AGSU/ASU.' },
        { item: 'IR Flag (Reverse)', location: 'Right shoulder', method: 'Sew-on', regulation: 'AR 670-1, para 21-18',
          detail: 'Right shoulder, 1/2" below seam. Stars facing forward (reverse orientation). All four edges sewn with matching OCP thread. Required in combat/field environments.' },
        { item: 'Cat Eyes', location: 'Rear of patrol cap', method: 'Sew-on', regulation: 'Unit SOP',
          detail: 'Two luminous strips, 1/2" x 1", 1" apart, centered on rear of patrol cap. Luminous side out for low-light identification.' },
        { item: 'Airborne Wings (if qualified)', location: 'Above US Army tape', method: 'Sew-on', regulation: 'DA PAM 670-1, para 21-12',
          detail: 'Centered 1/8" above US Army tape. Most Rangers are Airborne-qualified. Basic, Senior, or Master wings per qualification.' },
        { item: 'Scroll Patch (75th Ranger)', location: 'Left shoulder (SSI)', method: 'Sew-on', regulation: 'AR 670-1, para 21-17',
          detail: '75th Ranger Regiment scroll worn as SSI. Tan/black/red scroll, 1/2" below shoulder seam.' }
      ]
    },
    {
      id: 'sop-boots',
      title: 'Combat Boots',
      category: 'accessories',
      categoryLabel: 'Accessories',
      image: WK + '9/9c/Army_Combat_Boot_%28Temperate%29.jpg',
      standards: [
        { item: 'Boot Color', location: 'N/A', method: 'N/A', regulation: 'AR 670-1, para 4-1',
          detail: 'OCP uniform requires coyote brown (shade 499) boots. Black boots are NOT authorized with OCP. AGSU/ASU requires brown leather oxford shoes or authorized alternatives.' },
        { item: 'Boot Sole', location: 'Bottom', method: 'N/A', regulation: 'AR 670-1, para 4-1',
          detail: 'Sole must be plain (no brand logos visible). Rubber or polyether polyurethane sole. Sole color must match upper.' },
        { item: 'Boot Height', location: 'N/A', method: 'N/A', regulation: 'AR 670-1, para 4-1',
          detail: '8-10 inches in height. Must be lace-up with plain toe (no zipper, no steel toe). Temperate or hot weather variants authorized.' },
        { item: 'Blousing', location: 'Trouser-boot interface', method: 'Elastic bands or tuck', regulation: 'AR 670-1, para 4-1',
          detail: 'OCP trousers must be bloused over the top of boots using authorized methods (elastic bands, rubbers, or hook-and-loop straps). Blousing should be neat, not excessively ballooned.' },
        { item: 'Boot Care', location: 'Entire boot', method: 'Clean and condition', regulation: 'AR 670-1, para 1-1 (general appearance)',
          detail: 'Boots must be clean, serviceable, and in good repair. No excessive scuffing or wear. Coyote brown boot polish authorized but not required.' }
      ]
    }
  ];

  const grid = document.getElementById('sopGrid');
  const searchInput = document.getElementById('sopSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const detailOverlay = document.getElementById('sopDetail');
  const detailContent = document.getElementById('sopDetailContent');

  function render() {
    const q = searchInput.value.toLowerCase();
    const cat = categoryFilter.value;

    const filtered = sops.filter(s => {
      const matchSearch = !q ||
        s.title.toLowerCase().includes(q) ||
        s.standards.some(st => st.item.toLowerCase().includes(q) || st.detail.toLowerCase().includes(q));
      const matchCat = cat === 'all' || s.category === cat;
      return matchSearch && matchCat;
    });

    // Group by category
    const groups = {};
    filtered.forEach(s => {
      if (!groups[s.category]) groups[s.category] = { label: s.categoryLabel, items: [] };
      groups[s.category].items.push(s);
    });

    grid.innerHTML = '';

    if (Object.keys(groups).length === 0) {
      grid.innerHTML = '<div class="sop-empty">No uniform standards match your search.</div>';
      return;
    }

    Object.entries(groups).forEach(([key, group]) => {
      const section = document.createElement('div');
      section.className = 'sop-group';
      section.innerHTML = '<h2 class="sop-group-title">' + group.label + '</h2>';

      const cardsWrap = document.createElement('div');
      cardsWrap.className = 'sop-cards';

      group.items.forEach(sop => {
        const card = document.createElement('div');
        card.className = 'sop-card';

        const diagramHtml = sop.image
          ? '<img src="' + sop.image + '" alt="' + sop.title + '" loading="lazy">'
          : '<span class="img-label">' + sop.title + '</span>';

        const stdCount = sop.standards.length;
        const previewItems = sop.standards.slice(0, 4).map(s =>
          '<span class="sop-mod-tag">' + s.item + '</span>'
        ).join('');
        const moreCount = stdCount > 4 ? '<span class="sop-mod-more">+' + (stdCount - 4) + ' more</span>' : '';

        card.innerHTML =
          '<div class="sop-card-diagram">' + diagramHtml + '</div>' +
          '<div class="sop-card-body">' +
            '<h3 class="sop-card-title">' + sop.title + '</h3>' +
            '<div class="sop-card-mods">' + previewItems + moreCount + '</div>' +
            '<div class="sop-card-meta">' +
              '<span class="sop-time">' + stdCount + ' standards</span>' +
            '</div>' +
          '</div>';

        card.addEventListener('click', () => showDetail(sop));
        cardsWrap.appendChild(card);
      });

      section.appendChild(cardsWrap);
      grid.appendChild(section);
    });
  }

  function showDetail(sop) {
    const imgHtml = sop.image
      ? '<img src="' + sop.image + '" alt="' + sop.title + '" loading="lazy" style="display:block;margin:0 auto;">'
      : '<div class="img-placeholder sop-reference" style="aspect-ratio:16/9;min-height:200px;"><span class="img-label">' + sop.title + '</span></div>';

    // Build standards table
    const standardsHtml = sop.standards.map(st =>
      '<div class="sop-doctrine-ref" style="margin-bottom:10px;">' +
        '<div class="sop-doctrine-ref-title">' + st.item + '</div>' +
        '<div class="sop-doctrine-ref-body">' +
          '<strong>' + st.regulation + '</strong><br>' +
          '<ul class="sop-doctrine-ref-list">' +
            '<li><strong>Location:</strong> ' + st.location + '</li>' +
            '<li><strong>Method:</strong> ' + st.method + '</li>' +
            '<li>' + st.detail + '</li>' +
          '</ul>' +
        '</div>' +
      '</div>'
    ).join('');

    detailContent.innerHTML =
      '<button class="sop-detail-close" id="sopDetailClose">&times;</button>' +
      '<div class="sop-detail-header">' +
        '<h2>' + sop.title + '</h2>' +
        '<div class="sop-detail-badges">' +
          '<span class="sop-time">' + sop.standards.length + ' standards</span>' +
        '</div>' +
      '</div>' +
      '<div class="sop-detail-body">' +
        '<div class="sop-detail-diagram">' + imgHtml + '</div>' +
        '<div class="sop-detail-info">' +
          '<h4>Placement Standards & Doctrine</h4>' +
          standardsHtml +
        '</div>' +
      '</div>';

    detailOverlay.style.display = 'flex';
    document.getElementById('sopDetailClose').addEventListener('click', closeDetail);
  }

  function closeDetail() {
    detailOverlay.style.display = 'none';
  }

  detailOverlay.addEventListener('click', (e) => {
    if (e.target === detailOverlay) closeDetail();
  });

  searchInput.addEventListener('input', render);
  categoryFilter.addEventListener('change', render);

  // ── Sidebar Toggle ────────────────────────────────────────
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  render();
});
