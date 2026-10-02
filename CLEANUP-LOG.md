# Ranger Beers Supply Co. - Phase 0 cleanup log

Started 2026-10-01. Scope: PLAN.md Phase 0 ("Strip ranger-tab.png from the logo, pull the 75th
video and caption, remove banned and admin product cards, add the disclaimer") plus restoring the
shop JS deleted in ffa9ec9. Reference list: `docs/ARTB-Packing-List-V11.pdf` (V11, 2025-09-01).

## 1. Products removed

V11's "UNAUTHORIZED and grounds for" list prohibits, among others: cellular telephones or any
electronic items; any product with caffeine; tobacco or nicotine products of any type; vitamins,
energy pills, caffeine pills and other supplements of any kind. V11 item 119 allows stick gum only.
Admin documents and the CAC are V11 admin items a student brings, not things we sell.

| Page | Product | Item id | Reason |
|---|---|---|---|
| `ranger/shop.html` | ID Card | `id-card-cac` | Admin item, not a product (V11 admin: ID card / CAC, military issued) |
| `ranger/shop.html` | Ranger Physical (DA 2808 & 2807-1) | `ranger-physical` | Admin document, not a product (V11 admin: Ranger physical DA 2808/2807-1) |
| `ranger/shop.html` | Airborne Certificate/Orders (if applicable) | `airborne-certificate` | Admin document, not a product (V11 admin: Airborne certificate/orders) |
| `ranger/shop.html` | STP (Soldier Training Publication) | `stp-soldier-training` | Admin document, not a product (V11 admin: STP) |
| `ranger/shop.html` | DD-93/SGLV | `dd93-sglv` | Admin document, not a product (V11 admin: DD-93/SGLV) |
| `ranger/shop.html` | Orders to Ranger School (5 copies) | `orders-ranger-school` | Admin document, not a product (V11 admin: Orders to Ranger School) |
| `ranger/shop.html` | Prepaid Phone Cards | `prepaid-phone-cards` | V11 unauthorized: cellular telephone or any electronic items (TracFone service card) |
| `ranger/shop.html` | ZERO Long Cut - Mint | `zero-long-cut-mint` | V11 unauthorized: tobacco or nicotine products of any type (nicotine-free dip substitute) |
| `ranger/shop.html` | ZERO Pouches - Wintergreen | `zero-pouches-wintergreen` | V11 unauthorized: tobacco or nicotine products of any type (nicotine-free dip substitute) |
| `ranger/shop.html` | Energy Pouches - Cool Mint | `energy-pouches-cool-mint` | V11 unauthorized: any product with caffeine (50-100mg caffeine per pouch) |
| `ranger/shop.html` | Energy Pouches - Wintergreen | `energy-pouches-wintergreen` | V11 unauthorized: any product with caffeine (50-100mg caffeine per pouch) |
| `ranger/shop.html` | Herbal Snuff - Arctic Mint (Pouches) | `herbal-snuff-arctic-mint-pouches` | V11 unauthorized: any product with caffeine (listed as caffeinated) |
| `ranger/shop.html` | Herbal Snuff - Straight (Long Cut) | `herbal-snuff-straight-long-cut` | V11 unauthorized: tobacco or nicotine products of any type (herbal dip substitute) |
| `ranger/shop.html` | Herbal Snuff - Mint (Pouches) | `herbal-snuff-mint-pouches` | V11 unauthorized: tobacco or nicotine products of any type (herbal dip substitute) |
| `ranger/shop.html` | Herbal Snuff - Wintergreen (Long Cut) | `herbal-snuff-wintergreen-long-cut` | V11 unauthorized: tobacco or nicotine products of any type (herbal dip substitute) |
| `ranger/shop.html` | Hubba Bubba Bubble Tape (6-Pack) | `hubba-bubba-bubble-tape-6-pack` | V11 item 119: only stick gum authorized (bubble tape is not stick gum) |
| `ranger/shop.html` | Chem Lights (10-Pack) | `chem-lights-10-pack` | Not on V11; variant list includes IR, which PLAN 1.3 flags as contraband |
| `ranger/shop.html` | Electrolyte Packets (30ct) | `electrolyte-packets-30ct` | V11 unauthorized: vitamins, energy pills and other supplements of any kind |
| `ranger/shop.html` | Chem Lights - All Colors (10-Pack) | `chem-lights-all-colors-10-pack` | Not on V11; includes IR light sticks, which PLAN 1.3 flags as contraband |
| `ranger/spring.html` | Chem Lights - All Colors (10-Pack) | `chem-lights-all-colors-10-pack` | Not on V11; includes IR light sticks, which PLAN 1.3 flags as contraband |
| `ranger/summer.html` | Electrolyte Packets (30ct) | `electrolyte-packets-30ct` | V11 unauthorized: vitamins, energy pills and other supplements of any kind |

21 cards removed in total (19 on the shop page, including its hidden season panels, plus one each on
`spring.html` and `summer.html`). The shop grid now holds 188 products (the header said 205).

### Related text removed (packing lists and shop links for the same items)

- "Electrolyte Packets" and "Chem Lights (All Colors)" packing-list rows: `shop.html` season panels
  (5), `winter.html`, `spring.html`, `summer.html` (2), `fall.html`. They were tagged "Essential" or
  "Seasonal" as things to pack.
- "electrolytes" dropped from the summer blurb (`shop.html`, `summer.html`).
- `index.html` summer gear list: "Electrolyte packets - add to every canteen".
- `tiedown-sops.html`: ruck-lid rows for electrolyte packets and chem lights, and "chem lights" in
  the lid zone description.
- `course-ranger-prep.html`: "chem lights" dropped from the tactical packing line.
- `course-tmk.html`: the "Shop" link beside chem lights (product no longer sold). The training
  advice itself is unchanged.

### Kept, for Dylan and the panel to decide

These are not on V11, or are issued/controlled, but V11 does not name them as unauthorized, so they
were left in place:

- Issued or controlled items: ACH helmet and pad set, M4 magazines (V11 says students must bring
  them), blank-firing adapter, bolt-retaining pin, Rhino mount. PLAN 1.3 says the helmet and BFA go
  through the panel and JAG before they are offered.
- Not on V11: UV black-light flashlight and UV pen light (electronic), Lume Tape Infrared roll,
  G-Shock watch, spray paint, and the fixed-blade option on "Knives" (V11 #130 allows a folding
  blade of 4 inches or less).
- Laminated range card, sector sketch and OPORD planning boards: V11 bans *filled in* OPORD, FRAGO
  or annex formats. Blank boards are not named, but a panel member should confirm.
- "ID Tags with Breakaway Chain" stays: dog tags are a real product a student can buy.
- Training advice that mentions electrolytes (course-medical, course-workout-ruck, resources) is
  about training at home, not packing for the course, and was not changed.
- Product photos: `images/products/` does not exist, so every product `<img>` returned 404. The
  `<img>` tags were removed; each card keeps its text label until real photos exist.

## 2. 75th Ranger Regiment references

Dylan was never in the 75th. `grep -rniE "75th|ranger regiment|regt"` over html/js/css, handled:

| Where | Was | Now |
|---|---|---|
| `media/75th-ranger-day1.mp4` (hero on `ranger/index.html`, phase/season backgrounds on `index`, `standards`, `courses`, `shop`, `resources`) | file name implied Regiment footage | renamed `media/best-ranger-buddy-run.mp4`, all 12 references updated |
| `ranger/shop.html` Ranger Medic Handbook card | label "75th Ranger Regt 2022", variant "Official 2022 edition, 75th Ranger Regiment" | "Ranger Medic Handbook 2022", "2022 edition" |
| `ranger/index.html`, `ranger/resources.html` Ranger Creed stanza 1 | "...esprit de corps of my Ranger Regiment." | "...esprit de corps of the Rangers.", matching the site's own `course-ranger-creed.html` |

**The video.** I looked at it frame by frame (30 s, 1280x720). It is Best Ranger Competition
footage at Camp Rogers, Fort Benning: the night buddy-run start and the water confidence event.
It is not 75th-specific, so per the brief it was renamed, not replaced with a still. Two things
Dylan should still know: the first two seconds are a large Ranger Tab sign, and a third-party
channel's round logo is burned into the top-right corner of every frame. The footage source and
licence are unknown.

**Kept on purpose** (not on a Ranger page, no affiliation implied):

- `sewready/sop-library.js`: uniform regulation facts ("Tan beret: 75th Ranger Regiment", scroll
  patch placement per AR 670-1). These are reference data for a sewing shop.
- `sewready/customer.js`, `sewready/data-store.js`: a fake demo customer whose unit is "75th
  Ranger". Swap the string if Dylan wants zero hits site-wide.
- "4th/5th/6th Ranger Training Battalion" on `ranger/index.html` are the Ranger School training
  battalions (ARTB), not the Regiment.
- "Rangers Lead the Way" (hero headline) is the general Ranger motto from Omaha Beach, not a
  Regiment mark.

## 3. Ranger Tab as logo

- `ranger/index.html` hero: the `images/ranger-tab.png` logo is replaced by a plain text wordmark,
  "Ranger Beers Supply Co.", in the site's existing display face (Inter via `--font-display`),
  solid site gold, no gradient, no glow (`.hero-wordmark` in `css/military.css`).
- `images/ranger-tab.png` deleted (nothing references it now).
- `images/icon-192.png` and `images/icon-512.png` were the Ranger Tab too (PWA icons in
  `manifest.json`). Deleted, and the manifest's icon list emptied rather than inventing a new
  emblem.
- The nav brand was already text ("Ranger Beers") and is unchanged.

**Still for Dylan** (insignia, but not the Ranger Tab used as our logo, so left alone):

- Shop product "Lume Tape - Ranger Tab Stencil (Peel & Stick)" reproduces the Tab. 32 CFR 507.9(b)
  needs written Army Trademark Licensing approval for any colourable imitation of an insignia.
- Other school pages use their own tab and badge art as page imagery (`images/badges/`: Sapper,
  Mountain, SF, Jungle, Arctic tabs, Airborne wings and more). Same rule applies.
- The hero video opens on a large Ranger Tab sign (see section 2).

## 4. Non-affiliation disclaimer

"Ranger Beers Supply Co. is not affiliated with or endorsed by the U.S. Army or the Department of
Defense." added to all 510 school, MOS and Ranger pages, including every school `shop.html` and
`ranger/shop.html`. There is no shared footer include (each page is static HTML), so it is written
into each page: inside the existing `<footer>` on 502 pages, and as a small footer of its own on
the 8 `auth-callback.html` pages that had none. Style: `.site-disclaimer` in `css/military.css`.
Not added to the root portfolio (`index.html`), `business-card.html`, `admin.html` or `sewready/`.

## 5. Shop and checkout restored (catalog mode)

What was broken: commit ffa9ec9 (2026-04-04) deleted the hub JS, and commit 11ad6dd the same day
replaced `css/styles.css` with the portfolio's stylesheet. Every school page loaded 404 scripts
and rendered as an unstyled link list, and the shop showed "Shop Coming Soon" over a hidden grid.

- Restored from `ffa9ec9^`: `js/config.js`, `js/shared.js`, `js/course-auth.js`,
  `js/course-engine.js`, `js/gear-data.js`, `js/gear-modal.js`, `css/course-styles.css`,
  `css/school-landing.css`, `manifest.json`, root `shop.html` (redirect to `/ranger/shop.html`).
- Hub stylesheet recovered from `11ad6dd^` as `css/military.css`; the 502 school, MOS and Ranger
  pages now link it. The root portfolio keeps `css/styles.css`.
- Root `sw.js` added as a no-op worker that clears old caches (403 pages register `/sw.js`, which
  404'd). It caches nothing.
- `ranger/shop.html`: the 188-product grid is visible; the "Coming Soon" block is replaced by a
  one-line notice that checkout is not open yet.
- **Checkout is off on purpose.** `CONFIG.CHECKOUT_ENABLED = false` in `js/config.js`. While false,
  `js/shared.js` does not load Snipcart at all, disables every Add to Cart and course enroll button
  (label "Checkout opens soon"), hides the nav Cart button, and stops any click on them. No payment
  keys were added or changed. Setting the flag to true loads Snipcart again from `shared.js`.
- **Why Snipcart is not loaded:** the Snipcart public key already in the pages does not work. On
  the live site its session call failed in the browser, and a direct
  `POST https://app.snipcart.com/api/sessions` with that key returns HTTP 500
  `{"message":"An error has occurred."}`. A comment in `ranger/index.html` also marks it as a
  "TODO: Replace ... with your key". So checkout (products and course enrollment) was already
  broken before this cleanup; now it fails visibly and quietly instead of throwing errors. The
  static `snipcart.js` tag was removed from 502 pages; the 10 Jungle and Arctic course pages that
  did not load `shared.js` now load `config.js` and `shared.js`.
- To open checkout later, Dylan needs: the payment rail decision (PLAN decision 5: Stripe Checkout
  on Cloudflare, or Shopify Basic, or a working Snipcart account with this domain allowed), live
  keys for it, supplier accounts, and product liability cover.
- Bugs fixed while verifying: duplicate `const observer` in `ranger/courses.html`,
  `ranger/standards.html` and `ranger/resources.html` threw a SyntaxError that stopped the second
  script; `gear-modal.js` no longer requests the 95 gear photos that do not exist
  (`GEAR_PHOTOS_READY = false`).
- Reduced motion: `css/military.css` already shortened transitions; it now also lands every
  `.fade-in` at full opacity. Checked red/green with JS off: 204 of 204 shop reveals at opacity 0
  without the block, 0 of 204 with it.
