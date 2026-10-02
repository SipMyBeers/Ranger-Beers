// ============================================
// RANGER BEERS — Gear Data Module
// All 95 packing list items with descriptions,
// variants, image paths, and system links
// ============================================

// ── Category Gradient Fallbacks ─────────────
const CATEGORY_GRADIENTS = {
    admin:     'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.08) 100%)',
    essential: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.08) 100%)',
    critical:  'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.08) 100%)'
};

// ── System Setup Configurations ─────────────
const SYSTEM_SETUPS = {
    ruck: {
        title: 'Rucksack System Assembly',
        icon: '🎒',
        items: ['1', '2', '3', '4', '5', '6', '7', '62'],
        steps: [
            'Attach the MOLLE frame (item 2) upright — ensure the curve follows your spine.',
            'Slide the molded waist belt (item 4) onto the bottom of the frame and lock the pins.',
            'Connect the enhanced shoulder straps (item 5) to the top of the frame using male buckles (item 6).',
            'Thread the load lifter straps (item 7) from the top of the shoulder straps to the upper frame.',
            'Seat the rucksack body (item 1) onto the frame — route the internal stays into the frame channels.',
            'Attach both sustainment pouches (item 3) to the left and right sides of the ruck body using MOLLE webbing.',
            'Clip the assault pack (item 62) to the back of the rucksack using the top carry handle and bottom straps.',
            'Adjust load lifters to ~45° angle — they should pull the top of the ruck toward your shoulders.'
        ],
        proTips: [
            'Heaviest items (sleeping bag, ICW bag) go closest to your back at mid-height.',
            'Sustainment pouches are for quick-access items: food, socks, hygiene kit.',
            'The assault pack should be removable in <5 seconds for air assault operations.',
            'Dummy cord your assault pack to the ruck frame in case a buckle pops.'
        ]
    },
    tap: {
        title: 'TAP / Fighting Load Setup',
        icon: '🦺',
        items: ['13', '14', '15', '16'],
        steps: [
            'Lay the TAP (item 13) flat and orient it with the shoulder straps at top.',
            'Attach three M4 double-mag pouches (item 16) across the front — two on the left chest, one on the right.',
            'Attach one canteen pouch (item 14) to each side (left and right) at the waist level.',
            'Attach both grenade pouches (item 15) — one on each side, above or below the canteen pouches.',
            'Route the hydration bladder tube through the left or right shoulder strap channel.',
            'Adjust shoulder straps so the TAP sits high on your chest — mag pouches at sternum level.',
            'Ensure all pouches snap closed securely and open quietly (tape the snaps if needed).'
        ],
        proTips: [
            'Mag pouches on your non-firing side allow faster reloads — practice both.',
            'Tape down all loose buckle ends to prevent snagging and noise.',
            'The TAP should be tight enough to not bounce when running but loose enough to breathe.',
            'Mark your magazines 1-7 with a paint pen so you know which ones have been loaded/used.'
        ]
    },
    sleep: {
        title: 'Sleep System Configuration',
        icon: '🛏️',
        items: ['41', '42', '43', '69'],
        steps: [
            'Start with the bivy cover (item 41) — this is the waterproof outer shell.',
            'For WARM weather: insert only the patrol bag (item 43, green) into the bivy.',
            'For COLD weather: insert the ICW bag (item 42, gray) into the bivy first, then nest the patrol bag inside the ICW bag.',
            'Zip all layers together using the interlocking zipper system.',
            'Place your sleeping pad (item 69) underneath the bivy for ground insulation.',
            'In extreme cold, wear your Level 1 or Level 2 base layers inside the system.'
        ],
        proTips: [
            'Never sleep directly on the ground without the pad — you lose more heat downward than upward.',
            'Keep the bivy zipper cracked 2-3 inches to prevent condensation buildup inside.',
            'Store the sleep system in a waterproof bag during movement — a wet sleeping bag is a cold-weather emergency.',
            'The patrol bag alone is rated to ~35°F. Add the ICW bag to extend down to ~-10°F.',
            'In the Mountains phase, you will need the full system. In Florida, patrol bag only.'
        ]
    },
    hydration: {
        title: 'Hydration System Setup',
        icon: '💧',
        items: ['20', '21', '22', '23', '24', '67'],
        steps: [
            'Fill both 1QT canteens (item 20) and seat them in the canteen pouches on your TAP.',
            'Fill the 2QT canteen (item 21) and place it in the cover (item 22) — attach to ruck or TAP.',
            'Fill the hydration bladder (item 24, 70 oz minimum) and insert into the carrier (item 23).',
            'Route the hydration tube through the shoulder strap channel and secure the bite valve.',
            'Attach the canteen cup (item 67) to the bottom of a 1QT canteen with a rubber band or 550 cord.',
            'Total capacity: 2 × 32oz + 64oz + 70oz = ~198 oz (1.5 gallons) of water.'
        ],
        proTips: [
            'Water weighs 2.1 lbs per quart — a full hydration load adds ~12+ lbs to your kit.',
            'Drink from the bladder first during movement (hands-free), save canteens for halts.',
            'The canteen cup doubles as a cooking vessel — you can heat water for MREs.',
            'Mark your canteens with your last-4 to prevent mix-ups in the field.',
            'In Ranger School you will refill at every water point — never pass up water.'
        ]
    },
    hygiene: {
        title: 'Hygiene Kit Setup',
        icon: '🪥',
        items: ['58', '59', '84', '85', '86', '87', '88'],
        steps: [
            'Pack your razor (item 58) and extra blades (item 59) in a small ziplock bag.',
            'Include shaving cream (item 84), toothbrush (item 85), and toothpaste (item 86).',
            'Roll one large towel (item 87) for drying and keep one as a pack towel.',
            'Pack both wash cloths (item 88) — one for face/body, one as a general-purpose rag.',
            'Store the entire hygiene kit in a gallon ziplock inside a sustainment pouch for quick access.',
            'Shave every day unless tactical conditions prevent it — RIs will check.'
        ],
        proTips: [
            'Use a disposable razor (Bic-style) rather than a safety razor — less to lose.',
            'A large towel has many uses: pillow, extra insulation, weapon padding, tourniquet.',
            'Baby wipes (if allowed) are the #1 field hygiene item — pack extras.',
            'In the Mountains phase you will shave with cold water and no mirror. Practice this.',
            'Keep your hygiene kit in the same pocket every time so you find it in the dark.'
        ]
    },
    tmk: {
        title: 'Tool & Maintenance Kit',
        icon: '🔧',
        items: ['73'],
        steps: [
            'Ensure your cleaning kit (item 73) contains: bore brush, chamber brush, cleaning rod sections, CLP/oil, patches, and a rag.',
            'Add a multi-tool or combo tool specific to the M4 platform (bolt scraper, carbon scraper).',
            'Pack the cleaning kit in a pouch that attaches to your ruck — you will need it every night in garrison.',
            'Clean your weapon immediately after any live-fire or blank-fire exercise.',
            'During field phases, do a function check and wipe-down daily at minimum.'
        ],
        proTips: [
            'Carbon buildup on the bolt is the #1 cause of malfunctions — scrape the bolt tail and cam pin area.',
            'Pack extra CLP in a travel-size bottle — the small tubes in the kit run out fast.',
            'Pipe cleaners work great for hard-to-reach areas in the upper receiver.',
            'The RI weapons inspection is a go/no-go — a dirty weapon means a negative spot report.',
            'Use a bore snake for quick barrel cleaning in the field when time is limited.'
        ]
    }
};

// ── Main Gear Data ──────────────────────────
const GEAR_DATA = {

    // ════════════════════════════════════════
    // ADMINISTRATIVE ITEMS (A1–A7)
    // ════════════════════════════════════════

    "A1": {
        name: "Orders to Ranger School (5 copies)",
        category: "admin",
        qty: "5 ea.",
        weight: 0.2,
        image: "images/gear/orders-ranger-school.webp",
        description: "Five hard copies of your orders assigning you to Ranger School. These must be originals or certified copies — photocopies may not be accepted. Keep them in a waterproof bag. Missing orders on Day 0 = immediate dismissal from the course.",
        variants: [
            { name: "Printed Orders (DA Form 1610)", image: "images/gear/orders-da1610.webp", note: "Standard TDY/TCS orders format" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "orders-ranger-school"
    },
    "A2": {
        name: "DD-93/SGLV",
        category: "admin",
        qty: "2 ea.",
        weight: 0.1,
        image: "images/gear/dd93-sglv.webp",
        description: "DD Form 93 (Record of Emergency Data) and SGLV 8286 (Servicemembers' Group Life Insurance Election). Two copies each. These designate your beneficiaries and emergency contacts. Must be current and signed.",
        variants: [
            { name: "DD-93 / SGLV 8286 Packet", image: "images/gear/dd93-packet.webp", note: "Standard forms, two copies each" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: "https://armypubs.army.mil/pub/eforms/DR_a/ARN32154-DD_FORM_93-001-EDIT-1.pdf",
        shopSlug: "dd93-sglv"
    },
    "A3": {
        name: "STP (Soldier Training Publication)",
        category: "admin",
        qty: "2 ea.",
        weight: 0.1,
        image: "images/gear/stp.webp",
        description: "Soldier Training Publication — your individual training record. Two copies. Documents your MOS qualification, APFT/ACFT scores, and training history. Needed for in-processing at ARTB.",
        variants: [
            { name: "STP 21-1-SMCT", image: "images/gear/stp-smct.webp", note: "Soldier's Manual of Common Tasks" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "stp-soldier-training"
    },
    "A4": {
        name: "Airborne Certificate/Orders (if applicable)",
        category: "admin",
        qty: "2 ea.",
        weight: 0.1,
        image: "images/gear/airborne-cert.webp",
        description: "If you are airborne qualified, bring two copies of your Airborne certificate or orders. Required for any airborne operations during the course. Non-airborne students will be assigned to the non-jump roster.",
        variants: [
            { name: "Airborne Graduation Certificate", image: "images/gear/airborne-grad-cert.webp", note: "Fort Moore Basic Airborne Course completion" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "airborne-certificate"
    },
    "A5": {
        name: "Ranger Physical (DA 2808 & 2807-1)",
        category: "admin",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/ranger-physical.webp",
        description: "DA Form 2808 (Report of Medical Examination) and DA Form 2807-1 (Report of Medical History). Must be completed within 90 days of your report date. The physical must clear you for Ranger School specifically — a standard PHA is not sufficient.",
        variants: [
            { name: "DA 2808 + 2807-1 Packet", image: "images/gear/da2808-packet.webp", note: "Must be within 90 days of class date" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: "https://armypubs.army.mil/pub/eforms/DR_a/pdf/A2808.pdf",
        shopSlug: "ranger-physical"
    },
    "A6": {
        name: "ID Card",
        category: "admin",
        qty: "1 ea.",
        weight: 0.0,
        image: "images/gear/id-card.webp",
        description: "Common Access Card (CAC) or valid military identification. Must not be expired. You will need this for in-processing, meal cards, and re-entry to the ARTB compound.",
        variants: [
            { name: "Common Access Card (CAC)", image: "images/gear/cac-card.webp", note: "Standard DoD smart card ID" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "id-card-cac"
    },
    "A7": {
        name: "ID Tags with Breakaway Chain & Medical Alert",
        category: "admin",
        qty: "2 sets",
        weight: 0.1,
        image: "images/gear/id-tags.webp",
        description: "Two sets of dog tags on regulation breakaway chains. Tags must include: last name, first name, SSN (last 4), blood type, and religious preference. One long chain worn around neck, one short chain attached to boot lace. Include any medical alert tags if applicable.",
        variants: [
            { name: "Standard Stainless Dog Tags", image: "images/gear/dog-tags-standard.webp", note: "Regulation stamped tags with breakaway chain" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "id-tags-dog-tags"
    },

    // ════════════════════════════════════════
    // ESSENTIAL ITEMS (1–61)
    // ════════════════════════════════════════

    "1": {
        name: "Rucksack Large Field Pack MOLLE",
        category: "essential",
        qty: "1 ea.",
        weight: 7.0,
        image: "images/gear/rucksack-molle.webp",
        description: "MOLLE II Large Rucksack — the backbone of your load-carrying system. Approximately 4,000 cubic inches of storage. Features internal frame stays, compression straps, and MOLLE webbing for attaching sustainment pouches. This is your home for 61 days.",
        variants: [
            { name: "MOLLE II Large Ruck (OCP)", image: "images/gear/rucksack-molle-ocp.webp", note: "Current OCP (Scorpion W2) pattern" },
            { name: "MOLLE II Large Ruck (UCP)", image: "images/gear/rucksack-molle-ucp.webp", note: "Legacy UCP pattern — still accepted" }
        ],
        systemSetup: "ruck",
        tiedown: false,
        formUrl: null,
        shopSlug: "rucksack-molle"
    },
    "2": {
        name: "Pack Frame MOLLE",
        category: "essential",
        qty: "1 ea.",
        weight: 3.5,
        image: "images/gear/pack-frame-molle.webp",
        description: "MOLLE rucksack frame — the aluminum/polymer external frame that supports the rucksack body. Transfers weight from your shoulders to your hips via the waist belt. Critical for load distribution on long movements.",
        variants: [
            { name: "MOLLE II Frame (Gen IV)", image: "images/gear/pack-frame-gen4.webp", note: "Current issue polymer/aluminum frame" },
            { name: "MOLLE II Frame (Legacy)", image: "images/gear/pack-frame-legacy.webp", note: "Older all-aluminum frame — heavier but durable" }
        ],
        systemSetup: "ruck",
        tiedown: false,
        formUrl: null,
        shopSlug: "pack-frame-molle"
    },
    "3": {
        name: "Sustainment Pouch (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 1.5,
        image: "images/gear/sustainment-pouch.webp",
        description: "Two MOLLE sustainment pouches that attach to the sides of your rucksack. Use these for quick-access items you need without opening the main ruck compartment: food, socks, hygiene kit, map, and admin supplies.",
        variants: [
            { name: "MOLLE II Sustainment Pouch (OCP)", image: "images/gear/sustainment-pouch-ocp.webp", note: "Current OCP pattern" }
        ],
        systemSetup: "ruck",
        tiedown: false,
        formUrl: null,
        shopSlug: "sustainment-pouch"
    },
    "4": {
        name: "Molded Waist Belt",
        category: "essential",
        qty: "1 ea.",
        weight: 1.0,
        image: "images/gear/waist-belt.webp",
        description: "Padded MOLLE waist belt that connects to the rucksack frame. Transfers approximately 70% of the ruck weight to your hips. Must be properly fitted — the belt pads should sit on top of your hip bones.",
        variants: [
            { name: "MOLLE II Molded Waist Belt", image: "images/gear/waist-belt-molle.webp", note: "Standard padded waist belt for MOLLE frame" }
        ],
        systemSetup: "ruck",
        tiedown: false,
        formUrl: null,
        shopSlug: "molded-waist-belt"
    },
    "5": {
        name: "Enhanced Frame Shoulder Straps MOLLE",
        category: "essential",
        qty: "1 ea.",
        weight: 1.5,
        image: "images/gear/shoulder-straps.webp",
        description: "Padded shoulder straps for the MOLLE rucksack frame. Feature sternum strap and attachment points for load lifters. Proper adjustment is critical — straps should wrap over your shoulders with no gap between pad and body.",
        variants: [
            { name: "Enhanced Shoulder Straps (Padded)", image: "images/gear/shoulder-straps-enhanced.webp", note: "Current thick-padded version" }
        ],
        systemSetup: "ruck",
        tiedown: false,
        formUrl: null,
        shopSlug: "shoulder-straps-molle"
    },
    "6": {
        name: "Buckle, Male Shoulder Suspension (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 0.2,
        image: "images/gear/buckle-shoulder.webp",
        description: "Two male buckle clips that connect the shoulder straps to the rucksack frame. Small but critical — if one breaks, your ruck becomes nearly impossible to carry. Bring one spare in your repair kit.",
        variants: [
            { name: "Standard MOLLE Buckle (1-inch)", image: "images/gear/buckle-molle-1in.webp", note: "Standard replacement buckle" }
        ],
        systemSetup: "ruck",
        tiedown: false,
        formUrl: null,
        shopSlug: "buckle-shoulder-suspension"
    },
    "7": {
        name: "Load Lifter Attachment Strap (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 0.2,
        image: "images/gear/load-lifter-strap.webp",
        description: "Two straps connecting the top of the shoulder straps to the upper rucksack frame. When tightened, they pull the load closer to your body and shift weight from shoulders to hips. Ideal angle is 45 degrees from horizontal.",
        variants: [
            { name: "MOLLE Load Lifter Strap", image: "images/gear/load-lifter-molle.webp", note: "Standard nylon webbing load lifter" }
        ],
        systemSetup: "ruck",
        tiedown: false,
        formUrl: null,
        shopSlug: "load-lifter-strap"
    },
    "8": {
        name: "Helmet, Advanced Combat (Subdued Color)",
        category: "essential",
        qty: "1 ea.",
        weight: 3.0,
        image: "images/gear/ach-helmet.webp",
        description: "Advanced Combat Helmet (ACH) in subdued OD/foliage color. Provides ballistic protection (NIJ Level IIIA). Must have a functional chin strap, NVG mount bracket, and be fitted with the correct pad set for your head size.",
        variants: [
            { name: "ACH (Standard)", image: "images/gear/ach-standard.webp", note: "Standard ACH, Kevlar composite, ~3.0 lbs" },
            { name: "ECH (Enhanced Combat Helmet)", image: "images/gear/ech-enhanced.webp", note: "Newer UHMWPE, better protection, same weight class" }
        ],
        systemSetup: null,
        tiedown: true,
        formUrl: null,
        shopSlug: "ach-helmet"
    },
    "9": {
        name: "Pad Set, Advanced Combat Helmet",
        category: "essential",
        qty: "1 set",
        weight: 0.3,
        image: "images/gear/ach-pad-set.webp",
        description: "Replacement pad set for ACH/ECH. Provides comfort and impact absorption. Pads degrade over time — if yours are flat, compressed, or have lost their Velcro adhesion, replace them before Ranger School.",
        variants: [
            { name: "Standard ACH 7-Pad Kit", image: "images/gear/ach-pads-7kit.webp", note: "Standard issue Velcro-attach pad system" },
            { name: "Team Wendy EPIC Pads", image: "images/gear/ach-pads-team-wendy.webp", note: "Aftermarket upgrade — better comfort and protection" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "ach-pad-set"
    },
    "10": {
        name: "ACH Bracket / Rhino Mount / J Arm",
        category: "essential",
        qty: "1 ea.",
        weight: 0.3,
        image: "images/gear/rhino-mount.webp",
        description: "NVG mounting system for the ACH: includes the front bracket (baseplate), the rhino arm (swing arm), and the J-arm adapter for PVS-14/PVS-7 connection. Must be fully functional — you will use NVGs extensively during night patrols.",
        variants: [
            { name: "Standard Rhino Mount + J-Arm", image: "images/gear/rhino-mount-standard.webp", note: "Standard issue NVG mounting hardware" }
        ],
        systemSetup: null,
        tiedown: true,
        formUrl: null,
        shopSlug: "nvg-mount-rhino-arm"
    },
    "11": {
        name: "Cat-Eyes Band PASGT",
        category: "essential",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/cat-eyes-band.webp",
        description: "Luminescent / infrared band that wraps around the rear of the helmet. Provides a visible reference point for the person behind you during night movement. Glows faintly in low light; also visible under IR illumination.",
        variants: [
            { name: "Standard Cat-Eyes (OD Green Band)", image: "images/gear/cat-eyes-standard.webp", note: "Standard OD elastic band with luminous patches" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "cat-eyes-band"
    },
    "12": {
        name: "Eye Protection APEL (Clear Lens)",
        category: "essential",
        qty: "1 pr.",
        weight: 0.2,
        image: "images/gear/eye-pro-apel.webp",
        description: "Authorized Protective Eyewear List (APEL) approved ballistic eye protection with clear lens. Must be on the current APEL list — non-APEL eyewear will not be accepted. Clear lens is required; bring tinted as a backup if desired.",
        variants: [
            { name: "Oakley M-Frame 3.0", image: "images/gear/eye-pro-oakley.webp", note: "APEL listed, wide field of view, interchangeable lenses" },
            { name: "ESS Crossbow", image: "images/gear/eye-pro-ess-crossbow.webp", note: "APEL listed, comfortable fit, anti-fog coating" },
            { name: "Revision Sawfly", image: "images/gear/eye-pro-revision-sawfly.webp", note: "APEL listed, standard CIF issue, prescription insert available" }
        ],
        systemSetup: null,
        tiedown: true,
        formUrl: null,
        shopSlug: "eye-protection-apel"
    },
    "13": {
        name: "MOLLE Tactical Assault Panel (TAP)",
        category: "essential",
        qty: "1 ea.",
        weight: 2.5,
        image: "images/gear/tap-molle.webp",
        description: "MOLLE Tactical Assault Panel — your fighting load carrier. Worn over body armor or standalone. Provides MOLLE attachment points for magazine pouches, canteen pouches, grenade pouches, and other mission-essential equipment.",
        variants: [
            { name: "Standard MOLLE TAP", image: "images/gear/tap-standard.webp", note: "Standard issue H-harness style TAP" },
            { name: "Fighting Load Carrier (FLC)", image: "images/gear/tap-flc.webp", note: "Alternative vest-style carrier — also accepted" }
        ],
        systemSetup: "tap",
        tiedown: false,
        formUrl: null,
        shopSlug: "tactical-assault-panel"
    },
    "14": {
        name: "Pouch, 1 QT Canteen-General (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 0.5,
        image: "images/gear/pouch-canteen-1qt.webp",
        description: "Two MOLLE canteen pouches sized for 1-quart canteens. Attach to your TAP at the waist level, one on each side. Feature snap or buckle closure and drain holes at the bottom.",
        variants: [
            { name: "MOLLE Canteen/GP Pouch (OCP)", image: "images/gear/pouch-canteen-ocp.webp", note: "Standard issue, fits 1QT canteen snugly" }
        ],
        systemSetup: "tap",
        tiedown: false,
        formUrl: null,
        shopSlug: "canteen-pouch-1qt"
    },
    "15": {
        name: "Pouch, Hand Grenade (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 0.3,
        image: "images/gear/pouch-grenade.webp",
        description: "Two MOLLE hand grenade pouches. Used for carrying practice and smoke grenades during tactical exercises. Attach to your TAP — placement should allow easy, positive-grip extraction with either hand.",
        variants: [
            { name: "MOLLE Grenade Pouch (OCP)", image: "images/gear/pouch-grenade-ocp.webp", note: "Standard snap-closure grenade pouch" }
        ],
        systemSetup: "tap",
        tiedown: false,
        formUrl: null,
        shopSlug: "grenade-pouch"
    },
    "16": {
        name: "Pouch, M4 Two Magazine (x3)",
        category: "essential",
        qty: "3 ea.",
        weight: 0.6,
        image: "images/gear/pouch-m4-mag.webp",
        description: "Three MOLLE double-magazine pouches for M4/M16 magazines. Each holds two 30-round magazines. Attach across the front of your TAP for rapid access during magazine changes. Total capacity: 6 magazines on your TAP.",
        variants: [
            { name: "MOLLE Double Mag Pouch (OCP)", image: "images/gear/pouch-mag-ocp.webp", note: "Standard snap-closure double pouch" }
        ],
        systemSetup: "tap",
        tiedown: false,
        formUrl: null,
        shopSlug: "m4-magazine-pouch"
    },
    "17": {
        name: "Compass, Lensatic",
        category: "essential",
        qty: "1 ea.",
        weight: 0.4,
        image: "images/gear/compass-lensatic.webp",
        description: "Tritium lensatic compass for land navigation. Must be a military-spec compass (e.g., Cammenga 3H or equivalent) with tritium vials for night use. Your primary navigation tool — do NOT bring a civilian compass. Dummy-cord this to your TAP or uniform.",
        variants: [
            { name: "Cammenga 3H Tritium Compass", image: "images/gear/compass-cammenga-3h.webp", note: "Standard issue, tritium illumination, no batteries needed" },
            { name: "Cammenga S27 Phosphorescent", image: "images/gear/compass-cammenga-s27.webp", note: "Glow-in-dark model — requires light charging, no tritium" }
        ],
        systemSetup: null,
        tiedown: true,
        formUrl: null,
        shopSlug: "compass-lensatic"
    },
    "18": {
        name: "Magazine, M4 30-round (x7)",
        category: "essential",
        qty: "7 ea.",
        weight: 1.0,
        image: "images/gear/magazine-m4.webp",
        description: "Seven 30-round USGI or EPM magazines for the M4 carbine. Must function reliably — test each magazine with snap caps before attending. Mark each magazine 1-7 so you can track which ones cause malfunctions.",
        variants: [
            { name: "USGI Aluminum 30-rd (Tan follower)", image: "images/gear/mag-usgi-tan.webp", note: "Standard issue, tan anti-tilt follower" },
            { name: "Magpul PMAG Gen M3 (30-rd)", image: "images/gear/mag-pmag-gen3.webp", note: "Polymer, popular aftermarket — confirm unit allows" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "m4-magazine-30rd"
    },
    "19": {
        name: "Adapter, Firing (M4 Yellow)",
        category: "essential",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/blank-firing-adapter.webp",
        description: "Yellow blank firing adapter (BFA) for the M4. Attaches to the muzzle to allow cycling of blank ammunition. Required for all force-on-force and tactical field exercises. Do not lose this — it is a controlled item.",
        variants: [
            { name: "M4 BFA (Yellow)", image: "images/gear/bfa-yellow-m4.webp", note: "Standard yellow BFA for M4/M16A4" }
        ],
        systemSetup: null,
        tiedown: true,
        formUrl: null,
        shopSlug: "blank-firing-adapter"
    },
    "20": {
        name: "Canteen 1QT (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 2.0,
        image: "images/gear/canteen-1qt.webp",
        description: "Two 1-quart canteens. Primary water source when mounted on your TAP. Weight listed is filled (each holds ~2 lbs of water). Keep them full at all times — dehydration is the #1 preventable cause of recycling.",
        variants: [
            { name: "Standard Plastic 1QT (OD Green)", image: "images/gear/canteen-1qt-plastic.webp", note: "Standard USGI plastic canteen" },
            { name: "Stainless Steel 1QT", image: "images/gear/canteen-1qt-steel.webp", note: "Can be used to boil water directly — heavier" }
        ],
        systemSetup: "hydration",
        tiedown: false,
        formUrl: null,
        shopSlug: "canteen-1qt"
    },
    "21": {
        name: "Canteen, Water 2QT",
        category: "essential",
        qty: "1 ea.",
        weight: 1.5,
        image: "images/gear/canteen-2qt.webp",
        description: "One 2-quart collapsible or rigid canteen. Provides additional water capacity beyond your 1QTs and hydration bladder. Typically carried on the ruck or attached to the TAP via the 2QT cover.",
        variants: [
            { name: "Standard 2QT Collapsible (OD)", image: "images/gear/canteen-2qt-collapsible.webp", note: "Foldable when empty — saves space" }
        ],
        systemSetup: "hydration",
        tiedown: false,
        formUrl: null,
        shopSlug: "canteen-2qt"
    },
    "22": {
        name: "Cover Canteen 2QT",
        category: "essential",
        qty: "1 ea.",
        weight: 0.3,
        image: "images/gear/cover-canteen-2qt.webp",
        description: "MOLLE-compatible cover for the 2QT canteen. Features MOLLE straps for attachment to ruck or TAP, and insulation to help regulate water temperature. Keeps the canteen from sloshing and rattling during movement.",
        variants: [
            { name: "MOLLE 2QT Canteen Cover (OCP)", image: "images/gear/cover-2qt-ocp.webp", note: "Standard insulated MOLLE cover" }
        ],
        systemSetup: "hydration",
        tiedown: false,
        formUrl: null,
        shopSlug: "canteen-cover-2qt"
    },
    "23": {
        name: "Carrier, Hydration System w/ Bladder",
        category: "essential",
        qty: "1 ea.",
        weight: 1.0,
        image: "images/gear/hydration-carrier.webp",
        description: "MOLLE hydration carrier that holds the hydration bladder on your back or inside your ruck. Features a tube routing channel through the shoulder strap area. Can be worn standalone or integrated into the ruck/TAP.",
        variants: [
            { name: "MOLLE Hydration Carrier (OCP)", image: "images/gear/hydration-carrier-ocp.webp", note: "Standard issue MOLLE-compatible carrier" },
            { name: "CamelBak ThermoBak (Mil-Spec)", image: "images/gear/hydration-carrier-camelbak.webp", note: "Aftermarket — insulated, 100oz capacity" }
        ],
        systemSetup: "hydration",
        tiedown: false,
        formUrl: null,
        shopSlug: "hydration-carrier"
    },
    "24": {
        name: "Bladder, Hydration w/ Bite Valve (70 oz min)",
        category: "essential",
        qty: "1 ea.",
        weight: 0.5,
        image: "images/gear/hydration-bladder.webp",
        description: "Hydration bladder with bite valve, minimum 70 oz (2L) capacity. Must be compatible with your carrier. Hands-free drinking during movement is critical on long ruck marches. Clean and dry after each use to prevent mold.",
        variants: [
            { name: "CamelBak Mil-Spec Crux Reservoir (3L)", image: "images/gear/bladder-camelbak-3l.webp", note: "3L capacity, quick-disconnect, anti-microbial" },
            { name: "Source WXP 3L Bladder", image: "images/gear/bladder-source-3l.webp", note: "Wide opening, easy cleaning, glass-like interior" }
        ],
        systemSetup: "hydration",
        tiedown: false,
        formUrl: null,
        shopSlug: "hydration-bladder"
    },
    "25": {
        name: "GEN III Level 1 LW CW Drawers (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 0.6,
        image: "images/gear/ecwcs-l1-drawers.webp",
        description: "Two pairs of ECWCS Gen III Level 1 Lightweight Cold Weather drawers (base layer bottoms). Silk-weight moisture-wicking material. Worn as a base layer under your ACU trousers in cold weather or as a sleep layer.",
        variants: [
            { name: "Level 1 LW Silkweight Drawers", image: "images/gear/ecwcs-l1-drawers-lw.webp", note: "Lightest base layer — best for moderate cold" },
            { name: "Level 2 MW Grid-Fleece Drawers", image: "images/gear/ecwcs-l2-drawers-mw.webp", note: "Thicker grid fleece — better insulation for extreme cold" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "ecwcs-l1-drawers"
    },
    "26": {
        name: "GEN III Level 2 Mid-Weight CW Drawers (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 1.0,
        image: "images/gear/ecwcs-l2-drawers.webp",
        description: "Two pairs of ECWCS Gen III Level 2 Mid-Weight Cold Weather drawers. Grid fleece construction provides better insulation than Level 1 while still wicking moisture. Primary cold-weather base layer for Mountains phase.",
        variants: [
            { name: "Level 2 MW Grid-Fleece Drawers (Coyote)", image: "images/gear/ecwcs-l2-drawers-coyote.webp", note: "Standard coyote brown grid fleece" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "ecwcs-l2-drawers"
    },
    "27": {
        name: "GEN III Level 1 LW CW Undershirt (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 0.6,
        image: "images/gear/ecwcs-l1-shirt.webp",
        description: "Two ECWCS Gen III Level 1 Lightweight Cold Weather undershirts (base layer tops). Silk-weight material for moisture management. Can be worn under ACU coat or alone as a sleep layer.",
        variants: [
            { name: "Level 1 LW Silkweight Top", image: "images/gear/ecwcs-l1-shirt-lw.webp", note: "Lightest base layer top — crew neck" },
            { name: "Level 2 MW Grid-Fleece Top", image: "images/gear/ecwcs-l2-shirt-mw.webp", note: "Thicker grid fleece with quarter-zip" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "ecwcs-l1-undershirt"
    },
    "28": {
        name: "GEN III Level 2 Midweight CW Undershirt (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 1.0,
        image: "images/gear/ecwcs-l2-shirt.webp",
        description: "Two ECWCS Gen III Level 2 Mid-Weight Cold Weather undershirts. Quarter-zip grid fleece for better temperature regulation. Layer under your ACU coat for insulation during cold-weather operations.",
        variants: [
            { name: "Level 2 MW Grid-Fleece Top (Coyote)", image: "images/gear/ecwcs-l2-shirt-coyote.webp", note: "Standard coyote brown with quarter-zip" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "ecwcs-l2-undershirt"
    },
    "29": {
        name: "Gaiter Neck (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 0.2,
        image: "images/gear/neck-gaiter.webp",
        description: "Two neck gaiters (fleece or polypro). Worn around the neck for cold weather protection, can be pulled up to cover the face. Also useful as a dust mask, sweatband, or emergency bandage.",
        variants: [
            { name: "Fleece Neck Gaiter (Coyote/OD)", image: "images/gear/neck-gaiter-fleece.webp", note: "Standard fleece — warm and quick-drying" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "neck-gaiter"
    },
    "30": {
        name: "Gloves Combat",
        category: "essential",
        qty: "1 ea.",
        weight: 0.3,
        image: "images/gear/gloves-combat.webp",
        description: "Fire-resistant combat gloves. Must provide dexterity for weapon manipulation and trigger control. Must be subdued color (coyote, OD, or black). These are your primary tactical gloves for patrols and operations.",
        variants: [
            { name: "Massif FR Combat Gloves (Coyote)", image: "images/gear/gloves-combat-massif.webp", note: "Fire-resistant, good dexterity, coyote" },
            { name: "Standard Issue CG (Coyote)", image: "images/gear/gloves-combat-std.webp", note: "Standard issue leather palm, FR back" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "gloves-combat"
    },
    "31": {
        name: "Work Gloves, Heavy Duty (Leather)",
        category: "essential",
        qty: "1 pr.",
        weight: 0.5,
        image: "images/gear/gloves-work-leather.webp",
        description: "Heavy-duty leather work gloves for manual labor tasks: digging, handling concertina wire, rigging, and construction. Not for tactical use — these are for work details and position improvement.",
        variants: [
            { name: "Standard Leather Work Gloves", image: "images/gear/gloves-work-std.webp", note: "Full grain leather, general purpose" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "gloves-work-leather"
    },
    "32": {
        name: "Gloves, Cold Weather Flyers / ICW",
        category: "essential",
        qty: "1 min.",
        weight: 0.4,
        image: "images/gear/gloves-cw.webp",
        description: "Cold weather gloves — either flyers-type Nomex or ICW (Intermediate Cold Weather) system. Must provide warmth while maintaining enough dexterity for weapon operation and knot-tying.",
        variants: [
            { name: "Flyers Nomex CW Gloves", image: "images/gear/gloves-cw-nomex.webp", note: "Fire-resistant, thin insulation, good dexterity" },
            { name: "ICW Glove System (Liner + Shell)", image: "images/gear/gloves-cw-icw.webp", note: "Two-piece system — warmer, bulkier" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "gloves-cold-weather"
    },
    "33": {
        name: "Overshoes, Vinyl",
        category: "essential",
        qty: "1 ea.",
        weight: 1.5,
        image: "images/gear/overshoes-vinyl.webp",
        description: "Vinyl overshoes (boot covers) for wet weather. Slip over your combat boots to keep them dry during extended rain operations or water crossings. Bulky but effective at preventing trench foot.",
        variants: [
            { name: "Standard Vinyl Overshoes (Black)", image: "images/gear/overshoes-vinyl-black.webp", note: "Standard issue pull-over boot covers" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "overshoes-vinyl"
    },
    "34": {
        name: "Boots, Intermediate Cold Weather",
        category: "essential",
        qty: "1 ea.",
        weight: 4.0,
        image: "images/gear/boots-icw.webp",
        description: "Intermediate Cold Weather boots for Mountains phase and winter operations. Must be broken in before arrival. Insulated and waterproof. Typically worn with thick wool-blend socks for maximum warmth.",
        variants: [
            { name: "Belleville 675ST ICW Boot", image: "images/gear/boots-icw-belleville-675.webp", note: "Steel toe, insulated, waterproof — standard issue" },
            { name: "McRae 8189 ICW Boot", image: "images/gear/boots-icw-mcrae-8189.webp", note: "Alternate issue — insulated, composite toe" },
            { name: "Rocky S2V ICW Boot", image: "images/gear/boots-icw-rocky-s2v.webp", note: "Drainage vents, insulated, popular choice" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "boots-cold-weather"
    },
    "35": {
        name: "Poncho Wet Weather or Tarpaulin",
        category: "essential",
        qty: "1 ea.",
        weight: 1.5,
        image: "images/gear/poncho.webp",
        description: "Standard military wet weather poncho or tarpaulin/shelter half. Multi-purpose: rain protection, ground cloth, hasty shelter (poncho hooch), litter, and water collection. One of the most versatile items on the packing list.",
        variants: [
            { name: "Standard Wet Weather Poncho (OD)", image: "images/gear/poncho-od.webp", note: "Ripstop nylon, grommeted edges, hood with drawstring" },
            { name: "Tarpaulin / Shelter Half", image: "images/gear/poncho-shelter-half.webp", note: "Heavier canvas — better as shelter, less practical as poncho" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "poncho-wet-weather"
    },
    "36": {
        name: "Liner Wet Weather Poncho",
        category: "essential",
        qty: "1 ea.",
        weight: 1.0,
        image: "images/gear/poncho-liner.webp",
        description: "Poncho liner ('woobie') — quilted nylon/polyester blanket that snaps into the poncho. One of the most beloved items in the military. Provides insulation as a blanket, can be worn as a makeshift coat, or used as additional sleeping bag insulation.",
        variants: [
            { name: "Standard Poncho Liner (Woodland/OCP)", image: "images/gear/poncho-liner-std.webp", note: "Classic 'woobie' — nylon shell, polyester fill" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "poncho-liner-woobie"
    },
    "37": {
        name: "Extreme Wet/Cold Weather Jacket Level VI",
        category: "essential",
        qty: "1 ea.",
        weight: 1.5,
        image: "images/gear/ecwcs-l6-jacket.webp",
        description: "ECWCS Gen III Level 6 Gore-Tex jacket — your primary rain and wind protection. Waterproof, windproof, and breathable. Worn as the outermost layer during rain, snow, or high wind conditions.",
        variants: [
            { name: "Level VI Gore-Tex Jacket (OCP)", image: "images/gear/ecwcs-l6-jacket-ocp.webp", note: "Current OCP pattern, pit zips, adjustable hood" },
            { name: "Level VI Gore-Tex Jacket (UCP)", image: "images/gear/ecwcs-l6-jacket-ucp.webp", note: "Legacy UCP — still accepted if serviceable" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "ecwcs-l6-jacket"
    },
    "38": {
        name: "Trousers Wet Weather / ECWCS Level VI",
        category: "essential",
        qty: "1 ea.",
        weight: 1.0,
        image: "images/gear/ecwcs-l6-trousers.webp",
        description: "ECWCS Gen III Level 6 Gore-Tex trousers. Waterproof over-trousers worn over your ACU pants during rain. Side zips allow you to put them on over boots. Essential for Mountains and Swamp phases.",
        variants: [
            { name: "Level VI Gore-Tex Trousers (OCP)", image: "images/gear/ecwcs-l6-trousers-ocp.webp", note: "Current OCP, full side zips, drawstring waist" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "ecwcs-l6-trousers"
    },
    "39": {
        name: "Stuff Sack, LRG",
        category: "essential",
        qty: "1 ea.",
        weight: 0.3,
        image: "images/gear/stuff-sack-lg.webp",
        description: "Large stuff sack for compressing your sleeping bag system. Water-resistant nylon with drawstring closure. Keeps your sleep system compressed and organized inside the ruck.",
        variants: [
            { name: "MOLLE Large Stuff Sack (OD)", image: "images/gear/stuff-sack-lg-od.webp", note: "Standard issue compression sack" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "stuff-sack-large"
    },
    "40": {
        name: "Stuff Sack, SML",
        category: "essential",
        qty: "1 ea.",
        weight: 0.2,
        image: "images/gear/stuff-sack-sm.webp",
        description: "Small stuff sack for organizing ECWCS base layers, socks, or other small items inside your ruck. Helps with compartmentalization and prevents items from becoming a jumbled mess at the bottom of the ruck.",
        variants: [
            { name: "MOLLE Small Stuff Sack (OD)", image: "images/gear/stuff-sack-sm-od.webp", note: "Standard issue small compression sack" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "stuff-sack-small"
    },
    "41": {
        name: "Bivy Cover, Modular System",
        category: "essential",
        qty: "1 ea.",
        weight: 2.5,
        image: "images/gear/bivy-cover.webp",
        description: "Gore-Tex bivy cover — the waterproof outer shell of the Modular Sleep System (MSS). Protects your sleeping bags from rain, wind, and ground moisture. Can be used alone in warm weather as a minimalist shelter.",
        variants: [
            { name: "MSS Gore-Tex Bivy Cover (Woodland)", image: "images/gear/bivy-cover-woodland.webp", note: "Standard issue, woodland pattern, full-zip" }
        ],
        systemSetup: "sleep",
        tiedown: false,
        formUrl: null,
        shopSlug: "bivy-cover"
    },
    "42": {
        name: "Sleeping Bag ICW (Winter-Gray)",
        category: "essential",
        qty: "1 ea.",
        weight: 4.0,
        image: "images/gear/sleeping-bag-icw.webp",
        description: "Intermediate Cold Weather sleeping bag (gray) — the heavier, warmer component of the MSS. Rated to approximately -10°F when combined with the patrol bag and bivy cover. Used primarily during Mountains phase and winter classes.",
        variants: [
            { name: "MSS ICW Bag (Gray)", image: "images/gear/sleeping-bag-icw-gray.webp", note: "Standard issue gray mummy bag — synthetic fill" }
        ],
        systemSetup: "sleep",
        tiedown: false,
        formUrl: null,
        shopSlug: "sleeping-bag-icw"
    },
    "43": {
        name: "Sleeping Bag (Patrol-Green)",
        category: "essential",
        qty: "1 ea.",
        weight: 2.5,
        image: "images/gear/sleeping-bag-patrol.webp",
        description: "Patrol sleeping bag (green) — the lighter component of the MSS. Rated to approximately 35°F alone. Used as a standalone bag in warm weather (Darby/Florida phases) or nested inside the ICW bag for cold weather.",
        variants: [
            { name: "MSS Patrol Bag (Green)", image: "images/gear/sleeping-bag-patrol-green.webp", note: "Standard issue green mummy bag — lightweight synthetic" }
        ],
        systemSetup: "sleep",
        tiedown: false,
        formUrl: null,
        shopSlug: "sleeping-bag-patrol"
    },
    "44": {
        name: "Cap, Patrol ACU (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 0.2,
        image: "images/gear/patrol-cap.webp",
        description: "Two OCP/ACU patrol caps. Worn during all non-tactical activities and in garrison. Must have your name tape and rank sewn on. Bring two because they get destroyed — rain, sweat, and mud take their toll.",
        variants: [
            { name: "OCP Patrol Cap (Standard)", image: "images/gear/patrol-cap-ocp.webp", note: "Standard Scorpion W2 / OCP pattern" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "patrol-cap-acu"
    },
    "45": {
        name: "Coat, ACU/OCP (x4)",
        category: "essential",
        qty: "4 ea.",
        weight: 6.0,
        image: "images/gear/acu-coat.webp",
        description: "Four ACU/OCP combat uniform coats. Four is the minimum — you will rotate through them as they get wet, torn, and muddy. Must have proper name tapes, rank, and unit patches sewn on all four.",
        variants: [
            { name: "OCP Combat Coat (Standard)", image: "images/gear/acu-coat-ocp.webp", note: "Standard Scorpion W2 OCP pattern" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "coat-acu-ocp"
    },
    "46": {
        name: "Trousers, ACU/OCP (x4)",
        category: "essential",
        qty: "4 ea.",
        weight: 5.0,
        image: "images/gear/acu-trousers.webp",
        description: "Four ACU/OCP combat uniform trousers. Knee pad inserts must be removed (or use trousers without knee pad pockets). Bring all four properly hemmed to correct length — you don't want loose trouser legs catching on branches.",
        variants: [
            { name: "OCP Combat Trousers (Standard)", image: "images/gear/acu-trousers-ocp.webp", note: "Standard OCP trousers with cargo pockets" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "trousers-acu-ocp"
    },
    "47": {
        name: "T-Shirts, Tan 499 (x7)",
        category: "essential",
        qty: "7 ea.",
        weight: 2.0,
        image: "images/gear/tshirt-tan499.webp",
        description: "Seven Tan 499 undershirts. Worn under the ACU coat at all times. Seven gives you one per day for a full week rotation. Moisture-wicking material is strongly recommended over basic cotton.",
        variants: [
            { name: "Tan 499 Crew Neck (Standard)", image: "images/gear/tshirt-tan499-std.webp", note: "Standard cotton/poly blend crew neck" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "tshirts-tan-499"
    },
    "48": {
        name: "Belt, brown non-elastic (rigger style)",
        category: "essential",
        qty: "1 ea.",
        weight: 0.3,
        image: "images/gear/belt-rigger.webp",
        description: "Coyote/tan rigger-style belt. Must be non-elastic with a secure buckle. Worn with ACU trousers. A rigger belt doubles as an emergency extraction harness and rappel anchor — this is why non-elastic is mandatory.",
        variants: [
            { name: "Rigger Belt (Coyote, D-Ring)", image: "images/gear/belt-rigger-coyote.webp", note: "Standard nylon rigger belt with D-ring buckle" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "belt-rigger"
    },
    "49": {
        name: "Socks, cushion sole wool blend (x7 min)",
        category: "essential",
        qty: "7 pr.",
        weight: 1.5,
        image: "images/gear/socks-wool.webp",
        description: "Minimum seven pairs of cushion-sole wool-blend boot socks. Wool wicks moisture and insulates even when wet — cotton socks are a guaranteed recipe for blisters and trench foot. Change socks twice daily.",
        variants: [
            { name: "Standard Issue Wool-Blend Boot Socks (OD)", image: "images/gear/socks-wool-od.webp", note: "Standard issue — thick cushion sole" },
            { name: "Fox River / Darn Tough Merino", image: "images/gear/socks-wool-darn-tough.webp", note: "Premium merino wool — better fit, moisture wicking" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "socks-wool-blend"
    },
    "50": {
        name: "Boots, Hot Weather Desert (x2)",
        category: "essential",
        qty: "2 ea.",
        weight: 5.0,
        image: "images/gear/boots-hot-weather.webp",
        description: "Two pairs of AR 670-1 compliant hot weather combat boots. Your primary footwear for Darby and Florida phases. MUST be broken in before arrival — new boots guarantee blisters. Weight per pair is ~2.5 lbs.",
        variants: [
            { name: "Garmont T8 Bifida", image: "images/gear/boots-hw-garmont-t8.webp", note: "Lightweight, excellent ankle support, fast break-in" },
            { name: "Belleville TR696Z", image: "images/gear/boots-hw-belleville-696.webp", note: "Side-zip, hot weather optimized, quick on/off" },
            { name: "Rocky S2V", image: "images/gear/boots-hw-rocky-s2v.webp", note: "Drain vents for water operations, durable" },
            { name: "Nike SFB Gen 2", image: "images/gear/boots-hw-nike-sfb.webp", note: "Ultra-lightweight — check current AR 670-1 compliance" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "boots-hot-weather"
    },
    "51": {
        name: "PT Uniform (Full Set)",
        category: "essential",
        qty: "1 set",
        weight: 2.0,
        image: "images/gear/pt-uniform.webp",
        description: "Complete APFU (Army Physical Fitness Uniform) set: shorts, t-shirt, and jacket/pants. You will PT in garrison and during RAP week. Must be properly fitted and in good condition with proper markings.",
        variants: [
            { name: "APFU Set (Shorts + Shirt + Jacket + Pants)", image: "images/gear/pt-uniform-apfu.webp", note: "Standard Army PFU — black and gold" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "pt-uniform"
    },
    "52": {
        name: "Socks, white/black PT (x2)",
        category: "essential",
        qty: "2 pr.",
        weight: 0.2,
        image: "images/gear/socks-pt.webp",
        description: "Two pairs of PT socks (white or black, matching your shoes). Standard ankle-length athletic socks. Only worn during PT — never in the field.",
        variants: [
            { name: "Standard PT Socks (White/Black)", image: "images/gear/socks-pt-std.webp", note: "Standard athletic socks for PT sessions" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "socks-pt"
    },
    "53": {
        name: "Watch Cap, Black Micro Fleece",
        category: "essential",
        qty: "1 ea.",
        weight: 0.2,
        image: "images/gear/watch-cap.webp",
        description: "Black micro fleece watch cap (beanie). Worn during cold weather for heat retention — you lose significant body heat through your head. Can be worn under your ACH for added warmth during winter patrols.",
        variants: [
            { name: "Standard Black Micro Fleece Watch Cap", image: "images/gear/watch-cap-black.webp", note: "Standard issue fleece beanie" },
            { name: "Polartec Fleece Watch Cap", image: "images/gear/watch-cap-polartec.webp", note: "Alternative — thicker Polartec fleece" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "watch-cap-fleece"
    },
    "54": {
        name: "Belt, reflective (high vis yellow)",
        category: "essential",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/belt-reflective.webp",
        description: "High-visibility reflective PT belt (yellow). Worn during all road marches, runs, and PT sessions conducted near roadways. Required for visibility and safety — also used for accountability formations.",
        variants: [
            { name: "Standard PT Reflective Belt (Yellow)", image: "images/gear/belt-reflective-yellow.webp", note: "Standard reflective belt — the iconic PT belt" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "belt-reflective-pt"
    },
    "55": {
        name: "PT Shoes",
        category: "essential",
        qty: "1 pr.",
        weight: 1.5,
        image: "images/gear/pt-shoes.webp",
        description: "Running shoes for PT and the 5-mile run during RAP week. Must be broken in and comfortable for long runs. Minimal/neutral cushion preferred — you need shoes that perform on pavement and packed dirt.",
        variants: [
            { name: "Running Shoes (Your Preference)", image: "images/gear/pt-shoes-running.webp", note: "Pick what works for you — broken in before arrival" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "pt-shoes"
    },
    "56": {
        name: "Ear Plugs with Case (Triple Flange min)",
        category: "essential",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/ear-plugs.webp",
        description: "Hearing protection — triple-flange minimum. Required for all weapons firing, demolitions, and artillery simulations. Dummy cord the case to your TAP. Losing hearing protection could result in permanent damage.",
        variants: [
            { name: "Triple Flange Ear Plugs (w/ Case)", image: "images/gear/ear-plugs-triple.webp", note: "Standard issue triple-flange rubber plugs" }
        ],
        systemSetup: null,
        tiedown: true,
        formUrl: null,
        shopSlug: "ear-plugs"
    },
    "57": {
        name: "Protractor (GTA 5-2-12)",
        category: "essential",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/protractor.webp",
        description: "Military map protractor (GTA 5-2-12 or equivalent). Used for plotting grid coordinates, measuring azimuths, and calculating distances on 1:50,000 and 1:25,000 scale maps. Essential for land navigation.",
        variants: [
            { name: "GTA 5-2-12 Map Protractor", image: "images/gear/protractor-gta.webp", note: "Standard issue — 1:25K and 1:50K scales" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "protractor-military"
    },
    "58": {
        name: "Razor, shaving (non electric)",
        category: "essential",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/razor.webp",
        description: "Non-electric shaving razor. You will shave daily. Electric razors are not allowed. Disposable razors are recommended — they are lighter, cheaper, and easier to replace if lost or broken.",
        variants: [
            { name: "Disposable Razor (Bic / Gillette)", image: "images/gear/razor-disposable.webp", note: "Lightweight, cheap, replaceable — bring several" }
        ],
        systemSetup: "hygiene",
        tiedown: false,
        formUrl: null,
        shopSlug: "razor-shaving"
    },
    "59": {
        name: "Razor Blades (x12)",
        category: "essential",
        qty: "12 ea.",
        weight: 0.2,
        image: "images/gear/razor-blades.webp",
        description: "Twelve replacement razor blades or cartridges. You will shave every day for 61+ days. Dull blades cause razor burn and cuts. If using disposable razors, this count includes your backup razors.",
        variants: [
            { name: "Cartridge Refills / Disposables Pack", image: "images/gear/razor-blades-pack.webp", note: "12+ count pack for the duration of the course" }
        ],
        systemSetup: "hygiene",
        tiedown: false,
        formUrl: null,
        shopSlug: "razor-blades"
    },
    "60": {
        name: "Alcohol Marker, permanent (4 pack)",
        category: "essential",
        qty: "1 ea.",
        weight: 0.2,
        image: "images/gear/markers-permanent.webp",
        description: "Four permanent markers (Sharpie-style). Used for marking magazines, equipment, maps, and sector sketches. Black is primary; bring at least one red and one blue for map overlays.",
        variants: [
            { name: "Sharpie Fine Point (4-pack)", image: "images/gear/markers-sharpie.webp", note: "Black/Red/Blue/Green — covers all marking needs" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "permanent-markers"
    },
    "61": {
        name: "Camouflage Stick (x3, green/loam)",
        category: "essential",
        qty: "3 ea.",
        weight: 0.3,
        image: "images/gear/camo-stick.webp",
        description: "Three camouflage face paint sticks in green and loam (brown). Applied before all tactical operations. Cover all exposed skin: face, neck, ears, and backs of hands. Use the two-color pattern appropriate to your environment.",
        variants: [
            { name: "NATO Camo Stick (Green/Loam)", image: "images/gear/camo-stick-nato.webp", note: "Standard two-tone twist stick — compact" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "camo-face-paint"
    },

    // ════════════════════════════════════════
    // CRITICAL ITEMS (62–88)
    // ════════════════════════════════════════

    "62": {
        name: "Pack, Assault, MOLLE",
        category: "critical",
        qty: "1 ea.",
        weight: 2.0,
        image: "images/gear/assault-pack.webp",
        description: "MOLLE assault pack — a 3-day pack that attaches to the rear of your rucksack or can be worn independently. Used for patrol operations where the full ruck stays at the ORP. Carries your patrol essentials: ammo, water, food, and mission-critical equipment.",
        variants: [
            { name: "MOLLE II Assault Pack (OCP)", image: "images/gear/assault-pack-ocp.webp", note: "Standard 3-day pack, clips to ruck frame" }
        ],
        systemSetup: "ruck",
        tiedown: true,
        formUrl: null,
        shopSlug: "assault-pack-molle"
    },
    "63": {
        name: "Name-Tape, Cloth sew-on (x4)",
        category: "critical",
        qty: "4 ea.",
        weight: 0.1,
        image: "images/gear/name-tape.webp",
        description: "Four cloth sew-on name tapes. Extra name tapes for replacing those that fall off or for marking additional gear. Have your name tapes ready to go — sewing in Ranger School is done in the dark with cold fingers.",
        variants: [
            { name: "OCP Sew-On Name Tape", image: "images/gear/name-tape-ocp.webp", note: "Standard Scorpion W2 pattern name tape" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "name-tapes"
    },
    "64": {
        name: "Bag Clothing Waterproof (x2)",
        category: "critical",
        qty: "2 ea.",
        weight: 0.5,
        image: "images/gear/waterproof-bag.webp",
        description: "Two waterproof clothing bags (dry bags). Keep your dry clothing and sleep system inside these at all times. A wet sleeping bag in cold weather is a medical emergency. Size should fit your sleeping bag system and one full change of dry clothes.",
        variants: [
            { name: "Standard USGI Waterproof Bag (OD)", image: "images/gear/waterproof-bag-od.webp", note: "Roll-top closure, heavy-duty vinyl" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "waterproof-bag"
    },
    "65": {
        name: "Carrier, Intrenching",
        category: "critical",
        qty: "1 ea.",
        weight: 0.5,
        image: "images/gear/e-tool-carrier.webp",
        description: "MOLLE carrier/pouch for the intrenching tool (E-tool). Attaches to the outside of your rucksack or waist belt. Must hold the E-tool securely and allow rapid extraction when needed for hasty fighting positions.",
        variants: [
            { name: "MOLLE E-Tool Carrier (OCP)", image: "images/gear/e-tool-carrier-ocp.webp", note: "Standard snap-closure MOLLE carrier" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "e-tool-carrier"
    },
    "66": {
        name: "Intrenching Tool, Hand (E-Tool)",
        category: "critical",
        qty: "1 ea.",
        weight: 2.5,
        image: "images/gear/e-tool.webp",
        description: "Tri-fold intrenching tool (E-tool). Used for digging fighting positions, ranger graves, cat holes, and fire pits. Folds into three sections for compact storage. Can be locked in shovel or pick configuration.",
        variants: [
            { name: "Standard Tri-Fold E-Tool", image: "images/gear/e-tool-trifold.webp", note: "Standard issue aluminum/steel tri-fold entrenching tool" }
        ],
        systemSetup: null,
        tiedown: true,
        formUrl: null,
        shopSlug: "e-tool"
    },
    "67": {
        name: "Cup Water Canteen",
        category: "critical",
        qty: "1 ea.",
        weight: 0.3,
        image: "images/gear/canteen-cup.webp",
        description: "Stainless steel canteen cup. Nests under the 1QT canteen. Used for heating water, cooking MRE components, making coffee/cocoa, and boiling water for purification. One of the most useful multi-purpose items in your kit.",
        variants: [
            { name: "Standard Stainless Canteen Cup", image: "images/gear/canteen-cup-stainless.webp", note: "Standard USGI cup — fits under 1QT canteen" },
            { name: "Canteen Cup w/ Folding Handle + Stove", image: "images/gear/canteen-cup-stove.webp", note: "Cup with integrated stove stand — heat tabs/trioxane" }
        ],
        systemSetup: "hydration",
        tiedown: false,
        formUrl: null,
        shopSlug: "canteen-cup"
    },
    "68": {
        name: "Knee Pad Set",
        category: "critical",
        qty: "1 ea.",
        weight: 0.5,
        image: "images/gear/knee-pads.webp",
        description: "Knee pad set for wear during tactical operations. Protects your knees during extended kneeling positions, prone shooting, and low crawls. Must be securely strapped — loose knee pads that slide down are worse than none.",
        variants: [
            { name: "Standard Issue Knee Pads (OD/Coyote)", image: "images/gear/knee-pads-std.webp", note: "Standard strap-on knee pads" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "knee-pads"
    },
    "69": {
        name: "Mat Sleeping Pad / PT Mat",
        category: "critical",
        qty: "1 ea.",
        weight: 1.0,
        image: "images/gear/sleeping-pad.webp",
        description: "Closed-cell foam sleeping pad / PT mat. Provides ground insulation and cushioning. You lose more body heat to the ground than to the air — a sleeping pad is essential for cold weather survival. Also used for PT stretching.",
        variants: [
            { name: "Z-Fold Foam Mat (Accordion)", image: "images/gear/sleeping-pad-zfold.webp", note: "Lighter, folds flat, straps to outside of ruck — 0.75 lb" },
            { name: "Closed-Cell Thick Foam Pad (Roll)", image: "images/gear/sleeping-pad-roll.webp", note: "More insulation, bulkier roll — 1.0 lb, better R-value" }
        ],
        systemSetup: "sleep",
        tiedown: false,
        formUrl: null,
        shopSlug: "sleeping-pad"
    },
    "70": {
        name: "Black Tape, friction/electrical (x2 rolls)",
        category: "critical",
        qty: "2 rolls",
        weight: 0.3,
        image: "images/gear/black-tape.webp",
        description: "Two rolls of black friction tape or electrical tape. Used for noise discipline (taping down loose equipment), marking gear, improvised repairs, taping sling swivels, and preventing reflections from metal surfaces.",
        variants: [
            { name: "Black Electrical Tape (2 rolls)", image: "images/gear/black-tape-rolls.webp", note: "Standard electrical tape — multi-purpose" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "black-tape"
    },
    "71": {
        name: "Eye glasses, prescription (x2, if required)",
        category: "critical",
        qty: "2 pr.",
        weight: 0.2,
        image: "images/gear/prescription-glasses.webp",
        description: "Two pairs of prescription glasses if you require corrective lenses. Must be military-issue (GI glasses) or APEL-approved inserts for your ballistic eyewear. Bring two pairs because one WILL break, get lost, or get scratched beyond use.",
        variants: [
            { name: "Military Prescription Inserts (APEL)", image: "images/gear/glasses-apel-inserts.webp", note: "Inserts that fit inside APEL ballistic eyewear" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "prescription-glasses"
    },
    "72": {
        name: "Civilian clothes (Shirt, Pants, Jacket)",
        category: "critical",
        qty: "1 set",
        weight: 2.0,
        image: "images/gear/civilian-clothes.webp",
        description: "One set of civilian clothes: shirt, pants, and a jacket. Kept in your duffel bag in the barracks for travel to and from Ranger School. Not carried in the field. Must be conservative and appropriate.",
        variants: [
            { name: "Civilian Outfit (Casual/Conservative)", image: "images/gear/civilian-clothes-set.webp", note: "Plain shirt, jeans/khakis, jacket — nothing flashy" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "civilian-clothes"
    },
    "73": {
        name: "Cleaning Kit, Gun (complete)",
        category: "critical",
        qty: "1 ea.",
        weight: 0.5,
        image: "images/gear/cleaning-kit.webp",
        description: "Complete weapon cleaning kit for the M4 carbine. Must include: cleaning rod sections, bore brush, chamber brush, patches, CLP (or equivalent lubricant/cleaner), rag, and pipe cleaners. A clean weapon is a functioning weapon.",
        variants: [
            { name: "USGI M4 Cleaning Kit (OTIS or Standard)", image: "images/gear/cleaning-kit-usgi.webp", note: "Standard issue cleaning kit in OD pouch" },
            { name: "OTIS M4/M16 Soft-Pack Kit", image: "images/gear/cleaning-kit-otis.webp", note: "Compact pull-through system — lighter, smaller" }
        ],
        systemSetup: "tmk",
        tiedown: false,
        formUrl: null,
        shopSlug: "weapon-cleaning-kit"
    },
    "74": {
        name: "Whistle (subdued color)",
        category: "critical",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/whistle.webp",
        description: "Subdued (OD/black/coyote) whistle. Emergency signaling device for lost soldiers, water emergencies, and recall signals. Dummy-cord to your TAP. Must be pea-less (no ball inside) for reliability in cold/wet conditions.",
        variants: [
            { name: "Fox 40 Pea-Less Whistle (Black)", image: "images/gear/whistle-fox40.webp", note: "Pea-less, works wet/cold, 115 dB" }
        ],
        systemSetup: null,
        tiedown: true,
        formUrl: null,
        shopSlug: "whistle-subdued"
    },
    "75": {
        name: "Combination Locks (x3, no key locks)",
        category: "critical",
        qty: "3 ea.",
        weight: 1.0,
        image: "images/gear/combo-locks.webp",
        description: "Three combination padlocks — NO keyed locks (keys get lost). Used for securing your wall locker, duffel bag, and footlocker in the barracks. Write the combinations on a card and keep it in your admin folder.",
        variants: [
            { name: "Standard Combination Lock (3-dial)", image: "images/gear/combo-lock-std.webp", note: "Standard rotary combination lock" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "combination-locks"
    },
    "76": {
        name: "Batteries (AA/AAA/123 cell)",
        category: "critical",
        qty: "As needed",
        weight: 0.3,
        image: "images/gear/batteries.webp",
        description: "Spare batteries for your headlamp, and any other battery-powered equipment. Bring a mix of AA, AAA, and CR123A cells based on your gear. Lithium batteries perform better in cold weather than alkaline.",
        variants: [
            { name: "Lithium Battery Pack (AA/AAA/CR123A)", image: "images/gear/batteries-lithium.webp", note: "Lithium — lighter, longer life, cold-weather rated" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "batteries"
    },
    "77": {
        name: "Headlamp (red/white compatible)",
        category: "critical",
        qty: "1 min.",
        weight: 0.2,
        image: "images/gear/headlamp.webp",
        description: "Headlamp with red AND white light capability. Red light preserves night vision; white light for admin tasks. Must be subdued color (black/OD/coyote). Needs to be reliable — you will use this every single night.",
        variants: [
            { name: "Princeton Tec MPLS (Modular)", image: "images/gear/headlamp-princeton-mpls.webp", note: "Compact, helmet or head-mountable, red/white/IR" },
            { name: "Petzl Tactikka +RGB", image: "images/gear/headlamp-petzl-tactikka.webp", note: "Lightweight, red/green/blue + white, 350 lumens" },
            { name: "Streamlight Sidewinder Compact II", image: "images/gear/headlamp-streamlight-sidewinder.webp", note: "Helmet-mountable, 4 colors, CR123A powered" }
        ],
        systemSetup: null,
        tiedown: true,
        formUrl: null,
        shopSlug: "headlamp"
    },
    "78": {
        name: "Luminous tape 1\"x6\" strip",
        category: "critical",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/luminous-tape.webp",
        description: "Glow-in-the-dark luminous tape strip, 1 inch by 6 inches. Used for marking equipment, weapon, or position in low-light conditions. Charges in light and glows green. Cut small pieces as needed — a little goes a long way.",
        variants: [
            { name: "Standard Luminous Tape Strip (1\"×6\")", image: "images/gear/luminous-tape-strip.webp", note: "Standard photoluminescent tape — OD backing" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "luminous-tape"
    },
    "79": {
        name: "Nylon Cord 550 type (300 ft)",
        category: "critical",
        qty: "300 ft",
        weight: 1.5,
        image: "images/gear/paracord-550.webp",
        description: "300 feet of Type III 550 parachute cord. One of the most versatile items in your kit: shelter construction, equipment lashing, clotheslines, dummy cords, snare traps, fishing line (inner strands), and emergency repairs.",
        variants: [
            { name: "550 Paracord (OD Green, 300ft)", image: "images/gear/paracord-550-od.webp", note: "Standard MIL-C-5040 Type III — 550 lb tensile" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "paracord-550"
    },
    "80": {
        name: "Pens (black)",
        category: "critical",
        qty: "As needed",
        weight: 0.1,
        image: "images/gear/pens-black.webp",
        description: "Black ink pens for admin tasks, OPORD writing, map marking, and note-taking. Bring several — they run out of ink, get lost, and break. A pen that writes in the rain (like a Fisher Space Pen) is worth the investment.",
        variants: [
            { name: "Standard Black Pens (multi-pack)", image: "images/gear/pens-black-std.webp", note: "Bring plenty — they disappear quickly" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "pens-black"
    },
    "81": {
        name: "Pencils",
        category: "critical",
        qty: "As needed",
        weight: 0.1,
        image: "images/gear/pencils.webp",
        description: "Pencils for map work and note-taking. Pencils work when pens freeze or get wet. Essential for marking on acetate overlays and making erasable notes on maps. Mechanical pencils are fine but bring spare lead.",
        variants: [
            { name: "Standard #2 / Mechanical Pencils", image: "images/gear/pencils-std.webp", note: "Bring both regular and mechanical with spare lead" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "pencils"
    },
    "82": {
        name: "Notebook, pocket size (x2)",
        category: "critical",
        qty: "2 ea.",
        weight: 0.3,
        image: "images/gear/notebook.webp",
        description: "Two pocket-sized notebooks for field notes, OPORDs, patrol orders, and leadership positions. Rite in the Rain (waterproof) notebooks are strongly recommended — standard paper dissolves in the rain.",
        variants: [
            { name: "Rite in the Rain (3.5\"×5\", 2-pack)", image: "images/gear/notebook-ritr.webp", note: "Waterproof — writes in any conditions, spiral bound" },
            { name: "Standard Memo Pad", image: "images/gear/notebook-std.webp", note: "Basic pocket notepad — keep in ziplock bag" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "notebook-pocket"
    },
    "83": {
        name: "Sewing Kit",
        category: "critical",
        qty: "1 ea.",
        weight: 0.2,
        image: "images/gear/sewing-kit.webp",
        description: "Compact sewing kit with needles, thread (OCP-matching colors), and a few buttons. Used for field repairs to your uniform, rucksack, and equipment. Sewing in the dark is a Ranger School rite of passage.",
        variants: [
            { name: "Compact Field Sewing Kit", image: "images/gear/sewing-kit-compact.webp", note: "Mini kit with OCP-matching thread, needles, buttons" }
        ],
        systemSetup: null,
        tiedown: false,
        formUrl: null,
        shopSlug: "sewing-kit"
    },
    "84": {
        name: "Shaving Cream",
        category: "critical",
        qty: "1 can",
        weight: 0.4,
        image: "images/gear/shaving-cream.webp",
        description: "One can or tube of shaving cream. Travel size is fine — you won't have much time to shave anyway. Some Rangers prefer shaving oil or even just water. Whatever works fast with cold water and no mirror.",
        variants: [
            { name: "Travel Shaving Cream / Gel", image: "images/gear/shaving-cream-travel.webp", note: "Small can or tube — don't over-pack this" }
        ],
        systemSetup: "hygiene",
        tiedown: false,
        formUrl: null,
        shopSlug: "shaving-cream"
    },
    "85": {
        name: "Toothbrush (non-electric)",
        category: "critical",
        qty: "1 ea.",
        weight: 0.1,
        image: "images/gear/toothbrush.webp",
        description: "Non-electric toothbrush. Maintain dental hygiene even in the field — dental emergencies can get you dropped from the course. Cut the handle down to save space if desired. Bring a cover/case.",
        variants: [
            { name: "Standard Toothbrush with Cover", image: "images/gear/toothbrush-std.webp", note: "Basic manual toothbrush — nothing fancy needed" }
        ],
        systemSetup: "hygiene",
        tiedown: false,
        formUrl: null,
        shopSlug: "toothbrush"
    },
    "86": {
        name: "Toothpaste (large tube)",
        category: "critical",
        qty: "1 ea.",
        weight: 0.3,
        image: "images/gear/toothpaste.webp",
        description: "One large tube of toothpaste. Must last the duration of the course (61+ days). A standard 6 oz tube is sufficient. Store in a ziplock to prevent it from leaking inside your hygiene kit.",
        variants: [
            { name: "Standard Toothpaste (6 oz tube)", image: "images/gear/toothpaste-std.webp", note: "Full-size tube — needs to last 2+ months" }
        ],
        systemSetup: "hygiene",
        tiedown: false,
        formUrl: null,
        shopSlug: "toothpaste"
    },
    "87": {
        name: "Towels, large (x2, green/brown)",
        category: "critical",
        qty: "2 ea.",
        weight: 1.0,
        image: "images/gear/towels-large.webp",
        description: "Two large towels in subdued colors (green, brown, or OD). Used for drying off after hygiene, as a makeshift pillow, weapon padding, or extra insulation layer. Pack flat in the ruck to save space.",
        variants: [
            { name: "Standard Military Towel (OD/Brown)", image: "images/gear/towels-large-od.webp", note: "Standard cotton towel — subdued color" }
        ],
        systemSetup: "hygiene",
        tiedown: false,
        formUrl: null,
        shopSlug: "towels-large"
    },
    "88": {
        name: "Towels, wash cloth (x2, green/brown)",
        category: "critical",
        qty: "2 ea.",
        weight: 0.2,
        image: "images/gear/towels-washcloth.webp",
        description: "Two wash cloths in subdued colors. One for face/body washing, one as a general-purpose rag. Can also be used for weapon cleaning, as a pot holder with the canteen cup, or for wiping down gear.",
        variants: [
            { name: "Standard Wash Cloth (OD/Brown)", image: "images/gear/towels-washcloth-od.webp", note: "Small terry cloth — subdued color" }
        ],
        systemSetup: "hygiene",
        tiedown: false,
        formUrl: null,
        shopSlug: "towels-washcloth"
    }
};
