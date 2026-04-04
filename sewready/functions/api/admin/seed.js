// POST /api/admin/seed
// One-time migration: seeds the D1 shops table with the 30 existing shop configs.
// Idempotent — skips shops that already exist.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const EXISTING_SHOPS = [
  { slug: 'aaa-tailor', name: 'AAA Tailor Shop', owner: 'Al D.', address: '5710 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0129', email: 'al@aaatailor.com', tagline: 'First-class tailoring. A+ service for military uniforms.', primary: '#f44336', secondary: '#1c2833', accent: '#ffeb3b', adminPassword: 'lu46hn' },
  { slug: 'chois-sewing', name: "Choi's Sewing & Cleaning", owner: 'Choi Y.', address: '3410 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0109', email: 'info@choissewing.com', tagline: 'Expert sewing and cleaning services. Trusted by Fort Liberty service members.', primary: '#2ecc71', secondary: '#1b2631', accent: '#e67e22', adminPassword: 'djjh1r' },
  { slug: 'connies-sewing', name: "Connie's Sewing Room", owner: 'Connie L.', address: '3985 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0114', email: 'connie@conniessewing.com', tagline: 'Cozy sewing shop with personal service. Military uniform specialists.', primary: '#9b59b6', secondary: '#2c2c54', accent: '#f1c40f', adminPassword: 'ui4cng' },
  { slug: 'final-stitch', name: 'Final Stitch: Alterations & Clothing', owner: 'Rachel G.', address: '5365 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0126', email: 'info@finalstitch.com', tagline: 'Where every alteration is the final word. Military uniform perfection.', primary: '#b71c1c', secondary: '#0e1528', accent: '#c9a84c', adminPassword: 'g2xssx' },
  { slug: 'jans-cleaners', name: "Jan's Cleaners & Alterations", owner: 'Jan B.', address: '3065 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0106', email: 'jan@janscleaners.com', tagline: 'Professional cleaning and alterations. Trusted by Fort Liberty soldiers.', primary: '#16a085', secondary: '#1a252f', accent: '#e74c3c', adminPassword: '3lzvrs' },
  { slug: 'jeans-alterations', name: "Jean's Alterations", owner: 'Jean P.', address: '5480 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0127', email: 'jean@jeansalterations.com', tagline: 'Reliable alterations you can trust. Serving soldiers with care.', primary: '#1976d2', secondary: '#141d33', accent: '#ff8f00', adminPassword: 'vf8v16' },
  { slug: 'jin-sewing', name: 'Jin Sewing', owner: 'Jin H.', address: '3640 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0111', email: 'jin@jinsewing.com', tagline: 'Precision sewing for military uniforms. Fast, reliable, regulation-compliant.', primary: '#3498db', secondary: '#1c2833', accent: '#f1c40f', adminPassword: 'frzcep' },
  { slug: 'kims-1-sewing', name: "Kim's #1 Sewing & Dry Cleaning", owner: 'Kim P.', address: '2501 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0101', email: 'kim@kims1sewing.com', tagline: 'Professional uniform alterations & dry cleaning. AR 670-1 compliant. Trusted by soldiers at Fort Liberty.', primary: '#c0392b', secondary: '#2c3e50', accent: '#c9a84c', adminPassword: 'ksb187' },
  { slug: 'kims-speedy', name: "Kim's Speedy Sewing Shop", owner: 'Kim D.', address: '3870 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0113', email: 'kim@kimsspeedy.com', tagline: 'Fast, reliable uniform sewing. Same-day service available near Fort Liberty.', primary: '#e74c3c', secondary: '#1a252f', accent: '#f39c12', adminPassword: '3saf39' },
  { slug: 'lees-alterations', name: "Lee's Alterations & Sewing", owner: 'Lee S.', address: '2950 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0105', email: 'info@leesalterations.com', tagline: 'Quality alterations and sewing for military uniforms. AR 670-1 compliant work.', primary: '#d35400', secondary: '#1c2833', accent: '#3498db', adminPassword: 'q1nxhn' },
  { slug: 'lees-tailors', name: "Lee's Tailors", owner: 'Lee J.', address: '5020 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0123', email: 'lee@leestailors.com', tagline: 'Professional tailoring for military and formal wear. Excellence in every stitch.', primary: '#3f51b5', secondary: '#0e1528', accent: '#ffc107', adminPassword: '15uuuo' },
  { slug: 'make-it-fit', name: 'Make It Fit', owner: 'Dana K.', address: '4330 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0117', email: 'dana@makeitfit.com', tagline: 'Custom fitting and alterations. Making uniforms fit perfectly.', primary: '#e67e22', secondary: '#1b2631', accent: '#2980b9', adminPassword: 'ar18nx' },
  { slug: 'marys-alterations', name: "Mary's Alterations", owner: 'Mary J.', address: '3525 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0110', email: 'mary@marysalterations.com', tagline: 'Personalized alterations with attention to detail. AR 670-1 compliant.', primary: '#a855f7', secondary: '#141d33', accent: '#06b6d4', adminPassword: 'xl2ply' },
  { slug: 'mcmurray-fabrics', name: 'McMurray Fabrics', owner: 'Pat M.', address: '4905 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0122', email: 'info@mcmurrayfabrics.com', tagline: 'Fabric supply and alterations. Everything you need for uniform care.', primary: '#795548', secondary: '#1a1a2e', accent: '#ff9800', adminPassword: 'hck25q' },
  { slug: 'minhs-alteration', name: "Minh's Alteration Shop", owner: 'Minh T.', address: '4790 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0121', email: 'minh@minhsalteration.com', tagline: 'Expert alterations for military and civilian clothing. Fast turnaround.', primary: '#c0392b', secondary: '#1c2833', accent: '#4caf50', adminPassword: '0ov3mf' },
  { slug: 'monarch-cleaners', name: 'Monarch Cleaners', owner: 'Rick A.', address: '3295 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0108', email: 'info@monarchcleaners.com', tagline: 'Premium cleaning and embroidery services. Serving the Fort Liberty community.', primary: '#8e44ad', secondary: '#1a1a2e', accent: '#c9a84c', adminPassword: 'zpu3we' },
  { slug: 'nans-cleaners', name: "Nan's Cleaners", owner: 'Nan W.', address: '4215 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0116', email: 'nan@nanscleaners.com', tagline: 'Reliable cleaning and pressing. Military uniforms our specialty.', primary: '#27ae60', secondary: '#1a1a2e', accent: '#3498db', adminPassword: 'oumbqd' },
  { slug: 'one-stop-sewing', name: 'One Stop Sewing & Cleaning', owner: 'James W.', address: '2835 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0104', email: 'info@onestopsewing.com', tagline: 'Your one-stop shop for sewing, cleaning, and uniform services near Fort Liberty.', primary: '#27ae60', secondary: '#1b2631', accent: '#f39c12', adminPassword: '7toryd' },
  { slug: 'otreblas-tailoring', name: "Otrebla's Tailoring", owner: 'Alberto V.', address: '2720 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0103', email: 'info@otreblas.com', tagline: 'Expert tailoring for military and formal wear. Precision alterations near Fort Liberty.', primary: '#8e44ad', secondary: '#2c3e50', accent: '#e67e22', adminPassword: 'puvetr' },
  { slug: 'pak-cleaners', name: 'Pak Cleaners', owner: 'Pak M.', address: '3755 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0112', email: 'info@pakcleaners.com', tagline: 'Professional dry cleaning and uniform care. Trusted by the military community.', primary: '#1abc9c', secondary: '#0e1528', accent: '#e74c3c', adminPassword: 'sjqp1a' },
  { slug: 'perfit', name: 'Perfit', owner: 'Amanda R.', address: '5595 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0128', email: 'info@perfit.com', tagline: 'Perfect fit, every time. Military uniform tailoring specialists.', primary: '#388e3c', secondary: '#1a1a2e', accent: '#e91e63', adminPassword: '1bjaq2' },
  { slug: 'sewing-sensations', name: 'Sewing Sensations', owner: 'Lisa M.', address: '4445 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0118', email: 'lisa@sewingsensations.com', tagline: 'Creative sewing and uniform alterations. Where quality meets artistry.', primary: '#e91e63', secondary: '#1a252f', accent: '#ffd700', adminPassword: 'jnrudy' },
  { slug: 'sf-sewing', name: 'S & F Sewing And Alterations', owner: 'Steve B.', address: '5135 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0124', email: 'info@sfsewing.com', tagline: 'Full-service sewing and alterations. Serving Fort Liberty with pride.', primary: '#009688', secondary: '#1b2631', accent: '#ff5722', adminPassword: 'rr4x7k' },
  { slug: 'spotless-cleaners', name: 'Spotless Cleaners & Alterations', owner: 'Sam T.', address: '4560 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0119', email: 'info@spotlesscleaners.com', tagline: 'Spotless cleaning and expert alterations. Uniforms that pass every inspection.', primary: '#00bcd4', secondary: '#0e1528', accent: '#ff5722', adminPassword: 'jjz5d3' },
  { slug: 'star-sewing', name: 'STAR Sewing & Cleaners', owner: 'David R.', address: '2615 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0102', email: 'info@starsewing.com', tagline: 'Full-service sewing and cleaning for military uniforms. Fast turnaround near Fort Liberty.', primary: '#2980b9', secondary: '#1a1a2e', accent: '#f1c40f', adminPassword: 'dbju74' },
  { slug: 'sues-sewing', name: "Sue's Sewing & Laundry", owner: 'Sue N.', address: '3180 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0107', email: 'sue@suessewing.com', tagline: 'Sewing, alterations, and laundry services for military personnel near Fort Liberty.', primary: '#e74c3c', secondary: '#2c2c54', accent: '#f1c40f', adminPassword: 'j1xyu6' },
  { slug: 'tailorite', name: 'Tailorite', owner: 'Alex N.', address: '5250 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0125', email: 'alex@tailorite.com', tagline: 'Modern tailoring with traditional craftsmanship. Military uniform experts.', primary: '#673ab7', secondary: '#1a252f', accent: '#ffd54f', adminPassword: '6iql67' },
  { slug: 'tinas-alterations', name: "Tina's Alterations", owner: 'Tina V.', address: '4675 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0120', email: 'tina@tinasalterations.com', tagline: 'Quality alterations with a personal touch. Military uniform specialists.', primary: '#d4834e', secondary: '#141d33', accent: '#5ba4a4', adminPassword: 'yt05sk' },
  { slug: 'ts-cleaning', name: 'T & S Cleaning', owner: 'Terry S.', address: '5825 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0130', email: 'terry@tscleaning.com', tagline: 'Professional cleaning services for military and civilian garments.', primary: '#0097a7', secondary: '#0e1528', accent: '#ff6f00', adminPassword: 'tz2e1v' },
  { slug: 'tt-tailor', name: 'T & T Tailor & Alterations', owner: 'Tony M.', address: '4100 Bragg Blvd, Fayetteville, NC 28303', phone: '(910) 555-0115', email: 'info@tttailor.com', tagline: 'Expert tailoring and alterations. Dress uniforms and combat gear specialists.', primary: '#2c3e50', secondary: '#0e1528', accent: '#c0392b', adminPassword: '5mizlq' },
];

export async function onRequestPost(context) {
  const env = context.env;
  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (const shop of EXISTING_SHOPS) {
    try {
      // Check if already exists
      const existing = await env.DB.prepare(
        'SELECT slug FROM shops WHERE slug = ?'
      ).bind(shop.slug).first();

      if (existing) {
        skipped++;
        continue;
      }

      await env.DB.prepare(
        `INSERT INTO shops (slug, name, tier, owner, address, phone, email, tagline, theme_primary, theme_secondary, theme_accent, admin_password, active)
         VALUES (?, ?, 'full', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).bind(
        shop.slug,
        shop.name,
        shop.owner,
        shop.address,
        shop.phone,
        shop.email,
        shop.tagline,
        shop.primary,
        shop.secondary,
        shop.accent,
        shop.adminPassword
      ).run();

      inserted++;
    } catch (err) {
      errors.push({ slug: shop.slug, error: err.message });
    }
  }

  return json({
    ok: true,
    inserted,
    skipped,
    total: EXISTING_SHOPS.length,
    errors: errors.length > 0 ? errors : undefined
  });
}
