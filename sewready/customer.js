// ══════════════════════════════════════════════════════════════
//  SewReady — Customer Portal
//  Auth, landing page, dashboard, order wizard, appointment cal
// ══════════════════════════════════════════════════════════════

// ── Shop-Specific localStorage Key Prefix ─────────────────
const _CUST_PREFIX = (typeof shopConfig !== 'undefined' && shopConfig.slug)
  ? shopConfig.slug : 'sewready';
function _ck(base) { return _CUST_PREFIX + '-' + base; }

// ── Tier Gating ────────────────────────────────────────────
const _SHOP_TIER = (typeof shopConfig !== 'undefined' && shopConfig.tier) || 'full';

// ── Globals ─────────────────────────────────────────────────
let currentSession = null;

// Wizard state
let orderStep = 1;
let orderItems = [];           // [{ key: 'ocp-top', name: 'OCP Top', qty: 1 }, ...]
let orderServices = [];        // array of service IDs
let orderCustomFields = {};    // { 'SVC-001': { name: 'RODRIGUEZ' }, 'SVC-012': { rank: 'SGT' } }
let orderNotes = '';
let orderDeadline = null;      // '2026-03-10' — "when do you need this done?"
let orderDropoffDate = null;   // '2026-03-02' — "when can you drop it off?"
let orderDropoffTime = null;   // '09:00' — selected time slot
let expandedItem = null;       // key of currently expanded item card

// Name/rank input service IDs
const NAME_INPUT_SVCS = ['SVC-001', 'SVC-002', 'SVC-003', 'SVC-004'];
const RANK_INPUT_SVCS = ['SVC-012', 'SVC-013'];

// Services that involve attaching an item the customer may or may not provide
// (sewing/attach services where the customer can bring their own or purchase)
const PROVISION_SVCS = [
  'SVC-010', 'SVC-011', 'SVC-012', 'SVC-013', 'SVC-014', 'SVC-015',
  'SVC-016', 'SVC-017', 'SVC-018', 'SVC-019', 'SVC-020', 'SVC-021',
  'SVC-022', 'SVC-023', 'SVC-024'
];

// Uniform types for order wizard
const WK = 'https://upload.wikimedia.org/wikipedia/commons/';
const uniformTypes = [
  { key: 'ocp-top', name: 'OCP Top', tagKeys: ['OCP'],
    desc: 'Operational Camouflage Pattern coat. Standard Army combat uniform top \u2014 name tapes, rank, unit patch, flag, skill badges.',
    img: WK + '6/67/Operational_Camouflage_Pattern_2015.jpg' },
  { key: 'ocp-bottom', name: 'OCP Bottom', tagKeys: ['OCP'],
    desc: 'OCP trousers. Hemming, blousing bands, and trouser modifications.',
    img: WK + 'thumb/a/a1/OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg/500px-OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg' },
  { key: 'agsu', name: 'AGSU Jacket', tagKeys: ['AGSU'],
    desc: 'Army Green Service Uniform jacket. Awards rack, skill badges, rank, unit crest, nameplate.',
    img: WK + 'thumb/d/d1/Brigadier_General_Michael_B._Siegl_AGSU.jpg/500px-Brigadier_General_Michael_B._Siegl_AGSU.jpg' },
  { key: 'patrol-cap', name: 'Patrol Cap', tagKeys: ['Patrol Cap'],
    desc: 'Patrol cap. Rank insignia, cat eyes, IR square per AR 670-1.',
    img: WK + 'thumb/0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/500px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg' },
  { key: 'ranger-bundle', name: 'Ranger Bundle', tagKeys: ['Ranger', 'OCP'],
    desc: 'Ranger tab, cat eyes, IR flag \u2014 cap and coat combo for Ranger-qualified soldiers.',
    img: WK + 'thumb/5/55/Ranger_Tab.svg/200px-Ranger_Tab.svg.png' },
  { key: 'asu', name: 'ASU (Dress Blues)', tagKeys: ['ASU'],
    desc: 'Army Service Uniform. Hemming, awards rack, fitting alterations.',
    img: WK + 'thumb/7/7e/U.S._Army_Reserve_Soldiers_in_Army_Service_Uniform_170725-A-TI382-0757.jpg/500px-U.S._Army_Reserve_Soldiers_in_Army_Service_Uniform_170725-A-TI382-0757.jpg' },
  { key: 'beret', name: 'Beret', tagKeys: ['Beret'],
    desc: 'Beret flash sew-on, shaving, and shaping to regulation form.',
    img: WK + 'thumb/b/b2/PEO_Soldier_illustration_of_Black_Beret_portrait.jpg/400px-PEO_Soldier_illustration_of_Black_Beret_portrait.jpg' }
];

// ── Helpers ─────────────────────────────────────────────────
function fmt(n) { return '$' + n.toFixed(2); }

function showToast(msg) {
  const t = document.getElementById('custToast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail').value.trim();
  if (!email || !email.includes('@')) { showToast('Please enter a valid email address'); return; }
  showToast('Thanks for subscribing! Check your email for your 10% discount code.');
  document.getElementById('newsletterEmail').value = '';
}

const _dayKeys = ['day.sunday','day.monday','day.tuesday','day.wednesday','day.thursday','day.friday','day.saturday'];
const _shortDayKeys = ['day.sun','day.mon','day.tue','day.wed','day.thu','day.fri','day.sat'];
const _monthKeys = ['month.jan','month.feb','month.mar','month.apr','month.may','month.jun','month.jul','month.aug','month.sep','month.oct','month.nov','month.dec'];

function dayName(d) {
  return t(_dayKeys[d]);
}

function shortDay(d) {
  return t(_shortDayKeys[d]);
}

function monthName(m) {
  return t(_monthKeys[m]);
}

// ══════════════════════════════════════════════════════════════
//  AUTH SYSTEM
// ══════════════════════════════════════════════════════════════

function seedDemoAccounts() {
  const existing = JSON.parse(localStorage.getItem(_ck('customers')) || '[]');
  if (existing.length > 0) return;
  const demos = [
    { id: 'C-001', name: 'SGT Rodriguez', phone: '(555) 201-4488', email: 'rodriguez.j@army.mil', password: 'demo123', unit: '82nd Airborne' },
    { id: 'C-002', name: 'SPC Chen', phone: '(555) 339-7102', email: 'chen.w@army.mil', password: 'demo123', unit: '3rd Infantry' },
    { id: 'C-003', name: '1LT Adams', phone: '(555) 442-8830', email: 'adams.r@army.mil', password: 'demo123', unit: '75th Ranger' },
    { id: 'C-004', name: 'SSG Petrov', phone: '(555) 581-2269', email: 'petrov.a@army.mil', password: 'demo123', unit: '10th Mountain' },
    { id: 'C-005', name: 'PFC Williams', phone: '(555) 773-0154', email: 'williams.t@army.mil', password: 'demo123', unit: '1st Cavalry' },
    { id: 'C-006', name: 'CPT Hayes', phone: '(555) 604-9917', email: 'hayes.m@army.mil', password: 'demo123', unit: '4th Infantry' }
  ];
  localStorage.setItem(_ck('customers'), JSON.stringify(demos));
}

function getCustomers() {
  return JSON.parse(localStorage.getItem(_ck('customers')) || '[]');
}

function saveCustomers(arr) {
  localStorage.setItem(_ck('customers'), JSON.stringify(arr));
}

function openContactModal() {
  document.getElementById('contactOverlay').style.display = 'flex';
}
function closeContactModal() {
  document.getElementById('contactOverlay').style.display = 'none';
}

function submitContactForm() {
  const name = document.getElementById('contactFormName').value.trim();
  const phone = document.getElementById('contactFormPhone').value.trim();
  const msg = document.getElementById('contactFormMsg').value.trim();
  const statusEl = document.getElementById('contactFormStatus');
  if (!name || !msg) {
    statusEl.textContent = 'Please enter your name and message.';
    statusEl.style.color = '#e74c3c';
    return;
  }
  statusEl.textContent = 'Sending...';
  statusEl.style.color = 'var(--accent,#c9a84c)';
  const shopSlug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'unknown';
  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_slug: shopSlug, name, phone, message: msg })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      statusEl.textContent = 'Message sent! We\'ll get back to you soon.';
      statusEl.style.color = '#4caf50';
      document.getElementById('contactFormName').value = '';
      document.getElementById('contactFormPhone').value = '';
      document.getElementById('contactFormMsg').value = '';
    } else {
      statusEl.textContent = data.error || 'Failed to send. Please call or email instead.';
      statusEl.style.color = '#e74c3c';
    }
  })
  .catch(() => {
    statusEl.textContent = 'Network error. Please call or email instead.';
    statusEl.style.color = '#e74c3c';
  });
}

function openAboutModal() {
  var overlay = document.getElementById('aboutOverlay');
  if (!overlay) { switchToAbout(); return; } // fallback for non-tier3
  var cfg = _getShopCfg();

  var nameEl = document.getElementById('aboutModalName');
  if (nameEl) nameEl.textContent = cfg.name || 'SewReady';

  var estEl = document.getElementById('aboutModalEst');
  if (estEl && cfg.established) { estEl.textContent = 'Est. ' + cfg.established; estEl.style.display = ''; }

  var storyEl = document.getElementById('aboutModalStory');
  if (storyEl) storyEl.textContent = cfg.story || '';

  var ownerEl = document.getElementById('aboutModalOwner');
  var ownerSection = document.getElementById('aboutModalOwnerSection');
  if (ownerEl && cfg.owner) { ownerEl.textContent = cfg.owner; }
  else if (ownerSection) { ownerSection.style.display = 'none'; }

  var hoursList = document.getElementById('aboutModalHours');
  if (hoursList && typeof shopHours !== 'undefined') {
    var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var html = '';
    for (var d = 0; d < 7; d++) {
      var h = shopHours[d];
      html += '<li' + (!h ? ' class="closed"' : '') + '><span class="day">' + dayNames[d] + '</span><span class="hours">' + (h ? formatTime(h.start) + ' - ' + formatTime(h.end) : 'Closed') + '</span></li>';
    }
    hoursList.innerHTML = html;
  }

  var addrEl = document.getElementById('aboutModalAddr');
  var addrText = document.getElementById('aboutModalAddrText');
  if (addrEl && addrText && cfg.address) {
    addrText.textContent = cfg.address;
    addrEl.href = 'https://maps.google.com/maps?q=' + encodeURIComponent(cfg.address);
  }

  overlay.style.display = 'flex';
}
function closeAboutModal() {
  var overlay = document.getElementById('aboutOverlay');
  if (overlay) overlay.style.display = 'none';
}

function openAuth() {
  if (_SHOP_TIER === 'storefront' || _SHOP_TIER === 'tier3') return; // no auth for storefront/tier3
  document.getElementById('authOverlay').style.display = 'flex';
  switchAuthTab('signin');
}

function closeAuth() {
  document.getElementById('authOverlay').style.display = 'none';
}

function switchAuthTab(tab) {
  document.getElementById('tabSignIn').classList.toggle('active', tab === 'signin');
  document.getElementById('tabCreate').classList.toggle('active', tab === 'create');
  document.getElementById('authSignIn').style.display = tab === 'signin' ? 'block' : 'none';
  document.getElementById('authCreate').style.display = tab === 'create' ? 'block' : 'none';
}

function signIn() {
  const email = document.getElementById('siEmail').value.trim().toLowerCase();
  const pass = document.getElementById('siPassword').value;
  if (!email || !pass) { showToast('Enter email and password'); return; }

  const shopSlug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'sewready';

  // Try API auth first, fall back to localStorage
  fetch('/api/customers/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_slug: shopSlug, email: email, password: pass })
  })
  .then(function (r) {
    if (r.ok) return r.json();
    throw new Error('api-fail');
  })
  .then(function (user) {
    user.password = pass; // keep for local cache
    currentSession = user;
    localStorage.setItem(_ck('session'), JSON.stringify(user));
    closeAuth();
    switchToDashboard();
    showToast('Welcome back, ' + user.name + '!');
  })
  .catch(function () {
    // Fallback to localStorage auth
    const custs = getCustomers();
    const user = custs.find(c => c.email.toLowerCase() === email && c.password === pass);
    if (!user) { showToast('Invalid email or password'); return; }
    currentSession = user;
    localStorage.setItem(_ck('session'), JSON.stringify(user));
    closeAuth();
    switchToDashboard();
    showToast('Welcome back, ' + user.name + '!');
  });
}

function signOut() {
  currentSession = null;
  localStorage.removeItem(_ck('session'));
  switchToLanding();
  showToast('Signed out');
}

function createAccount() {
  const name = document.getElementById('caName').value.trim();
  const phone = document.getElementById('caPhone').value.trim();
  const email = document.getElementById('caEmail').value.trim().toLowerCase();
  const pass = document.getElementById('caPassword').value;
  const unit = document.getElementById('caUnit').value.trim();
  if (!name || !phone || !email || !pass) { showToast('Fill in all required fields'); return; }
  const custs = getCustomers();
  if (custs.find(c => c.email.toLowerCase() === email)) { showToast('Email already registered'); return; }
  const newCust = { id: 'C-' + String(custs.length + 1).padStart(3, '0'), name, phone, email, password: pass, unit };
  custs.push(newCust);
  saveCustomers(custs);
  currentSession = newCust;
  localStorage.setItem(_ck('session'), JSON.stringify(newCust));
  closeAuth();
  switchToDashboard();
  showToast('Account created! Welcome, ' + name);

  // Persist to D1
  var shopSlug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'sewready';
  fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ shop_slug: shopSlug }, newCust))
  }).catch(function () { /* offline — localStorage has the data */ });
}

// ══════════════════════════════════════════════════════════════
//  VIEW SWITCHING
// ══════════════════════════════════════════════════════════════

function _hideAllPages() {
  document.getElementById('custLanding').style.display = 'none';
  document.getElementById('custDashboard').style.display = 'none';
  document.getElementById('custShopPage').style.display = 'none';
  var about = document.getElementById('custAboutPage');
  if (about) about.style.display = 'none';
}

function switchToLanding() {
  _hideAllPages();
  document.getElementById('custLanding').style.display = 'block';
  updateNavAuth();
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function switchToDashboard() {
  _hideAllPages();
  document.getElementById('custDashboard').style.display = 'block';
  updateNavAuth();
  renderWelcome();
  renderMyOrders();
  renderWizard();
}

function switchToShop() {
  _hideAllPages();
  document.getElementById('custShopPage').style.display = 'block';
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function switchToAbout() {
  _hideAllPages();
  var about = document.getElementById('custAboutPage');
  if (about) about.style.display = 'block';
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function updateNavAuth() {
  const nav = document.getElementById('navAuth');
  if (_SHOP_TIER === 'storefront' || _SHOP_TIER === 'tier3') {
    nav.innerHTML = ''; // no auth UI for storefront/tier3
    return;
  }
  if (currentSession) {
    nav.innerHTML =
      '<div class="cust-nav-user">' +
        '<span class="cust-nav-user-name">' + currentSession.name + '</span>' +
        '<button class="cust-nav-signout" onclick="signOut()">Sign Out</button>' +
      '</div>';
  } else {
    nav.innerHTML = '<button class="cust-btn-primary cust-btn-sm" id="navSignIn" onclick="openAuth()">Sign In</button>';
  }
}

function handleBookAppt() {
  if (_SHOP_TIER === 'storefront' || _SHOP_TIER === 'tier3') {
    showToast('Online ordering is not available for this shop. Please visit in person or call us!');
    return;
  }
  if (currentSession) {
    switchToDashboard();
    setTimeout(() => {
      const el = document.getElementById('custNewOrder');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    openAuth();
  }
}

function handleMakeOrder() {
  if (_SHOP_TIER === 'storefront' || _SHOP_TIER === 'tier3') {
    showToast('Online ordering is not available for this shop. Please visit in person or call us!');
    return;
  }
  if (currentSession) {
    switchToDashboard();
    setTimeout(() => {
      const el = document.getElementById('custNewOrder');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    switchToShop();
  }
}

// ══════════════════════════════════════════════════════════════
//  LANDING PAGE RENDERERS
// ══════════════════════════════════════════════════════════════

// ── Public Services ─────────────────────────────────────────
function renderPublicServices() {
  const pills = document.getElementById('svcFilterPills');
  const grid = document.getElementById('custSvcGrid');
  if (!pills || !grid) return;
  const cats = ['all', 'creation', 'sewing', 'removal', 'combo', 'alteration'];
  const catNames = function() {
    return { all: t('cat.all'), creation: t('cat.creation'), sewing: t('cat.sewing'), removal: t('cat.removal'), combo: t('cat.combo'), alteration: t('cat.alteration') };
  };

  pills.innerHTML = cats.map(c =>
    '<button class="cust-pill' + (c === 'all' ? ' active' : '') + '" data-cat="' + c + '">' + catNames()[c] + '</button>'
  ).join('');

  let svcShowAll = false;

  // Remove any existing toggle button
  function removeSvcToggle() {
    const old = document.getElementById('svcShowMoreBtn');
    if (old) old.remove();
  }

  function renderGrid(cat) {
    let pool = services;
    if (typeof shopConfig !== 'undefined' && shopConfig.enabledServiceIds) {
      pool = services.filter(s => shopConfig.enabledServiceIds.includes(s.id));
    }
    const filtered = cat === 'all' ? pool : pool.filter(s => s.category === cat);
    grid.innerHTML = '';
    removeSvcToggle();
    const limit = svcShowAll ? filtered.length : 9;
    const visible = filtered.slice(0, limit);
    visible.forEach(svc => {
      const card = document.createElement('div');
      card.className = 'cust-svc-card';
      const imgUrl = svcImages[svc.id] || (SVC_WK + '6/67/Operational_Camouflage_Pattern_2015.jpg');
      card.innerHTML =
        '<div class="cust-svc-card-img">' +
          '<img src="' + imgUrl + '" alt="' + svc.name + '" loading="lazy">' +
        '</div>' +
        '<div class="cust-svc-card-header">' +
          '<span class="cust-svc-card-name">' + svcName(svc) + '</span>' +
          '<div class="cust-svc-card-right">' +
            '<button class="cust-add-cart" data-svc-id="' + svc.id + '">' + t('misc.addToCart') + '</button>' +
            '<span class="cust-svc-card-price">' + fmt(svc.price) + '</span>' +
            '<span class="cust-svc-card-arrow">&#9654;</span>' +
          '</div>' +
        '</div>' +
        '<div class="cust-svc-card-preview">' +
          '<span class="cust-cat-label ' + catClass[svc.category] + '">' + catLabel(svc.category) + '</span>' +
          '<span class="cust-svc-card-time">&#9202; ' + svc.time + '</span>' +
        '</div>' +
        '<div class="cust-svc-card-details">' +
          '<div class="cust-svc-card-desc">' + svcDesc(svc) + '</div>' +
          '<div class="cust-svc-card-tags">' +
            svc.tags.map(t => '<span class="cust-svc-tag">' + t + '</span>').join('') +
          '</div>' +
        '</div>';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.cust-add-cart')) return;
        card.classList.toggle('cust-svc-card-open');
      });
      const cartBtn = card.querySelector('.cust-add-cart');
      cartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart('svc', svc.id);
      });
      grid.appendChild(card);
    });

    if (filtered.length > 9) {
      const btn = document.createElement('button');
      btn.id = 'svcShowMoreBtn';
      btn.className = 'cust-btn-secondary cust-show-more-btn';
      btn.textContent = svcShowAll ? t('services.showLess') : t('services.showAll', { count: filtered.length });
      btn.addEventListener('click', () => {
        svcShowAll = !svcShowAll;
        const activeCat = pills.querySelector('.cust-pill.active');
        renderGrid(activeCat ? activeCat.dataset.cat : 'all');
      });
      grid.parentNode.insertBefore(btn, grid.nextSibling);
    }
  }

  pills.addEventListener('click', e => {
    if (!e.target.matches('.cust-pill')) return;
    pills.querySelectorAll('.cust-pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    svcShowAll = false;
    renderGrid(e.target.dataset.cat);
  });

  renderGrid('all');
}

// ── Team ────────────────────────────────────────────────────
function renderTeam() {
  const grid = document.getElementById('custTeam');
  if (!grid) return;
  grid.innerHTML = employees.map(emp =>
    '<a href="employee.html?id=' + emp.id + '" class="cust-team-card" style="text-decoration:none;color:inherit">' +
      '<div class="cust-team-avatar" style="background:' + emp.color + '">' + emp.name.charAt(0) + '</div>' +
      '<div class="cust-team-name">' + emp.name + '</div>' +
      '<div class="cust-team-role">' + emp.role + '</div>' +
    '</a>'
  ).join('');
}

// ── Gallery / Portfolio ──────────────────────────────────────
function renderGallery() {
  const container = document.getElementById('galleryGrid');
  const section = document.getElementById('custGallery');
  if (!container || !section) return;
  const shopSlug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : '';
  if (!shopSlug) return;
  fetch('/api/photos?shop_slug=' + encodeURIComponent(shopSlug) + '&limit=12')
    .then(r => r.json())
    .then(data => {
      if (!data.photos || data.photos.length === 0) return;
      section.style.display = '';
      container.innerHTML = '';
      data.photos.forEach(p => {
        const div = document.createElement('div');
        div.style.cssText = 'border-radius:12px;overflow:hidden;aspect-ratio:1;cursor:pointer;border:1px solid rgba(255,255,255,0.06)';
        const img = document.createElement('img');
        img.src = '/api/photos/' + p.r2_key;
        img.alt = p.caption || 'Work sample';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover';
        img.loading = 'lazy';
        div.appendChild(img);
        container.appendChild(div);
      });
    })
    .catch(() => {});
}

// ── Shop Hours ──────────────────────────────────────────────
function renderShopHours() {
  const list = document.getElementById('custHours');
  const today = new Date().getDay();
  const days = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
  list.innerHTML = days.map(d => {
    const hrs = shopHours[d];
    const isToday = d === today;
    const cls = (isToday ? ' cust-hours-today' : '') + (!hrs ? ' cust-hours-closed' : '');
    return '<li class="' + cls + '">' +
      '<span>' + dayName(d) + (isToday ? ' (Today)' : '') + '</span>' +
      '<span>' + (hrs ? formatTime(hrs.start) + ' – ' + formatTime(hrs.end) : 'Closed') + '</span>' +
    '</li>';
  }).join('');
}

// ── Order Tracker ───────────────────────────────────────────
function trackOrder() {
  const orderId = document.getElementById('trackOrderId').value.trim().toUpperCase();
  const phone = document.getElementById('trackPhone').value.trim();
  const result = document.getElementById('trackResult');

  if (!orderId || !phone) {
    showToast(t('tracker.enterBoth'));
    return;
  }

  const order = sharedOrders.find(o => o.id === orderId && o.phone === phone);
  if (!order) {
    result.innerHTML = '<div class="cust-track-not-found">' + t('tracker.notFound') + '</div>';
    return;
  }

  result.innerHTML =
    '<div class="cust-track-result">' +
      '<div class="cust-track-header">' +
        '<span class="cust-track-id">' + order.id + '</span>' +
        '<span class="cust-track-uniform">' + order.uniform + '</span>' +
      '</div>' +
      renderTimeline(order.status) +
      '<div style="margin-top:12px">' +
        '<div style="font-size:13px;color:var(--text-muted)"><strong>Customer:</strong> ' + order.customer + '</div>' +
        '<div style="font-size:13px;color:var(--text-muted)"><strong>Deadline:</strong> ' + order.deadline + '</div>' +
        '<div style="font-size:13px;color:var(--text-muted)"><strong>Services:</strong> ' + order.modifications.join(', ') + '</div>' +
      '</div>' +
    '</div>';
}

// ── Auth Modal Order Tracker ─────────────────────────────────
function trackOrderFromAuth() {
  const orderId = document.getElementById('authTrackOrderId').value.trim().toUpperCase();
  const phone = document.getElementById('authTrackPhone').value.trim();
  const result = document.getElementById('authTrackResult');

  if (!orderId || !phone) {
    showToast('Enter order number and phone');
    return;
  }

  const order = sharedOrders.find(o => o.id === orderId && o.phone === phone);
  if (!order) {
    result.innerHTML = '<div class="cust-track-not-found">' + t('tracker.notFound') + '</div>';
    return;
  }

  result.innerHTML =
    '<div class="cust-track-result">' +
      '<div class="cust-track-header">' +
        '<span class="cust-track-id">' + order.id + '</span>' +
        '<span class="cust-track-uniform">' + order.uniform + '</span>' +
      '</div>' +
      renderTimeline(order.status) +
      '<div style="margin-top:12px">' +
        '<div style="font-size:13px;color:var(--text-muted)"><strong>Customer:</strong> ' + order.customer + '</div>' +
        '<div style="font-size:13px;color:var(--text-muted)"><strong>Deadline:</strong> ' + order.deadline + '</div>' +
        '<div style="font-size:13px;color:var(--text-muted)"><strong>Services:</strong> ' + order.modifications.join(', ') + '</div>' +
      '</div>' +
    '</div>';
}

// ── Timeline Renderer ───────────────────────────────────────
function renderTimeline(status) {
  const steps = ['received', 'in-progress', 'ready', 'completed'];
  const labels = { 'received': t('status.received'), 'in-progress': t('status.inProgress'), 'ready': t('status.ready'), 'completed': t('status.completed') };
  const currentIdx = steps.indexOf(status);

  return '<div class="cust-timeline">' +
    steps.map((s, i) => {
      let cls = 'cust-timeline-step';
      if (i < currentIdx) cls += ' completed';
      else if (i === currentIdx) cls += ' active';
      return '<div class="' + cls + '">' +
        '<div class="cust-timeline-dot"></div>' +
        (i < steps.length - 1 ? '<div class="cust-timeline-line"></div>' : '') +
        '<div class="cust-timeline-label">' + labels[s] + '</div>' +
      '</div>';
    }).join('') +
  '</div>';
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════

function renderWelcome() {
  const el = document.getElementById('custWelcome');
  const myOrders = sharedOrders.filter(o => o.phone === currentSession.phone);
  const active = myOrders.filter(o => o.status !== 'completed').length;
  el.innerHTML =
    '<div class="cust-welcome-inner">' +
      '<span class="cust-welcome-name">' + t('dash.welcome', { name: currentSession.name }) + '</span>' +
      '<span class="cust-welcome-count">' + (active !== 1 ? t('dash.activeOrdersPlural', { count: active }) : t('dash.activeOrders', { count: active })) + '</span>' +
    '</div>';
}

function renderMyOrders() {
  const container = document.getElementById('custMyOrders');
  const myOrders = sharedOrders.filter(o => o.phone === currentSession.phone);

  if (myOrders.length === 0) {
    container.innerHTML = '<div class="cust-empty-orders">' + t('dash.noOrders') + '</div>';
    return;
  }

  container.innerHTML = myOrders.map(order => {
    const statusCls = 'cust-status-' + order.status;
    const statusLabel = order.status === 'in-progress' ? 'In Progress' :
      order.status.charAt(0).toUpperCase() + order.status.slice(1);

    return '<div class="cust-order-card" data-id="' + order.id + '">' +
      '<div class="cust-order-header" onclick="toggleOrderCard(this)">' +
        '<div>' +
          '<span class="cust-order-id">' + order.id + '</span>' +
          '<span class="cust-order-uniform" style="margin-left:12px">' + order.uniform + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<span class="cust-order-date">Due: ' + order.deadline + '</span>' +
          '<span class="cust-order-status-badge ' + statusCls + '">' + statusLabel + '</span>' +
          '<span class="cust-order-expand">&#9654;</span>' +
        '</div>' +
      '</div>' +
      renderTimeline(order.status) +
      '<div class="cust-order-body">' +
        '<div class="cust-order-detail">' +
          '<h4>Services</h4>' +
          '<ul class="cust-order-checklist">' +
            order.modifications.map(m => '<li>' + m + '</li>').join('') +
          '</ul>' +
          (order.scheduledBlock ?
            '<h4>Appointment</h4>' +
            '<div class="cust-order-pickup">' +
              order.scheduledBlock.date + ' at ' + formatTime(order.scheduledBlock.startTime) +
              ' – ' + formatTime(order.scheduledBlock.endTime) +
            '</div>' : '') +
          '<h4>Estimated Time</h4>' +
          '<div class="cust-order-pickup">' + (order.sopTime || 'TBD') + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function toggleOrderCard(el) {
  el.closest('.cust-order-card').classList.toggle('cust-order-card-open');
}

// ══════════════════════════════════════════════════════════════
//  NEW ORDER WIZARD
// ══════════════════════════════════════════════════════════════

function renderWizard() {
  orderStep = 1;
  orderItems = [];
  orderServices = [];
  orderCustomFields = {};
  orderNotes = '';
  orderDeadline = null;
  orderDropoffDate = null;
  orderDropoffTime = null;
  expandedItem = null;
  renderWizardSteps();
  renderWizardContent();
  renderWizardNav();
}

function renderWizardSteps() {
  const labels = [t('wizard.step1'), t('wizard.step2'), t('wizard.step3'), t('wizard.step4')];
  document.getElementById('wizardSteps').innerHTML = labels.map((l, i) => {
    let cls = 'cust-wizard-step';
    if (i + 1 === orderStep) cls += ' active';
    else if (i + 1 < orderStep) cls += ' done';
    return '<div class="' + cls + '">' + (i + 1) + '. ' + l + '</div>';
  }).join('');
}

function renderWizardContent() {
  const el = document.getElementById('wizardContent');
  if (orderStep === 1) renderStep1(el);
  else if (orderStep === 2) renderStep2(el);
  else if (orderStep === 3) renderStep3(el);
  else if (orderStep === 4) renderStep4(el);
}

function renderWizardNav() {
  const nav = document.getElementById('wizardNav');
  let html = '';
  if (orderStep > 1) {
    html += '<button class="cust-btn-secondary" onclick="wizardPrev()">' + t('wizard.back') + '</button>';
  } else {
    html += '<span></span>';
  }
  if (orderStep < 4) {
    html += '<button class="cust-btn-primary" onclick="wizardNext()">' + t('wizard.next') + '</button>';
  } else {
    html += '<button class="cust-btn-primary" onclick="submitOrder()">' + t('wizard.submit') + '</button>';
  }
  nav.innerHTML = html;
}

function wizardPrev() {
  if (orderStep > 1) {
    orderStep--;
    renderWizardSteps();
    renderWizardContent();
    renderWizardNav();
  }
}

function wizardNext() {
  if (orderStep === 1 && orderItems.length === 0) { showToast(t('wizard.selectAtLeastItem')); return; }
  if (orderStep === 2 && orderServices.length === 0) { showToast(t('wizard.selectAtLeastService')); return; }
  if (orderStep < 4) {
    // Save step 2 custom fields before advancing
    if (orderStep === 2) {
      saveCustomFieldInputs();
    }
    // Save step 3 fields before advancing
    if (orderStep === 3) {
      const notesEl = document.getElementById('wizNotes');
      if (notesEl) orderNotes = notesEl.value;
      const dlEl = document.getElementById('wizDeadline');
      if (dlEl && dlEl.value) orderDeadline = dlEl.value;
    }
    orderStep++;
    renderWizardSteps();
    renderWizardContent();
    renderWizardNav();
  }
}

function saveCustomFieldInputs() {
  NAME_INPUT_SVCS.forEach(id => {
    if (orderServices.includes(id)) {
      const inp = document.getElementById('cf-name-' + id);
      if (inp && inp.value.trim()) {
        if (!orderCustomFields[id]) orderCustomFields[id] = {};
        orderCustomFields[id].name = inp.value.trim().toUpperCase();
      }
    }
  });
  RANK_INPUT_SVCS.forEach(id => {
    if (orderServices.includes(id)) {
      const inp = document.getElementById('cf-rank-' + id);
      if (inp && inp.value.trim()) {
        if (!orderCustomFields[id]) orderCustomFields[id] = {};
        orderCustomFields[id].rank = inp.value.trim().toUpperCase();
      }
    }
  });
}

// ── Step 1: Item(s) Selection ────────────────────────────────
function renderStep1(el) {
  let html = '<h3 style="margin-bottom:16px;font-size:16px">' + t('wizard.selectItems') + '</h3>';
  html += '<div class="cust-uniform-grid">';
  uniformTypes.forEach(u => {
    const inOrder = orderItems.find(i => i.key === u.key);
    const isExpanded = expandedItem === u.key;
    const matchCount = getServiceCountForItem(u);
    let cls = 'cust-uniform-card';
    if (inOrder) cls += ' selected';
    if (isExpanded) cls += ' cust-item-expanded';

    html += '<div class="' + cls + '" onclick="toggleItemDetail(\'' + u.key + '\')">';
    if (inOrder) html += '<div class="cust-item-check">&#10003;</div>';
    html += '<img src="' + u.img + '" alt="' + u.name + '" onerror="this.style.display=\'none\'">';
    html += '<div class="cust-uniform-card-name">' + u.name + '</div>';

    if (isExpanded) {
      html += '<div class="cust-item-detail" onclick="event.stopPropagation()">';
      html += '<p class="cust-item-desc">' + u.desc + '</p>';
      html += '<p class="cust-item-svc-count">' + t('wizard.servicesAvailable', { count: matchCount }) + '</p>';
      html += '<div class="cust-item-add-row">';
      html += '<div class="cust-item-qty">';
      html += '<button onclick="event.stopPropagation();adjustAddQty(-1)">-</button>';
      html += '<span id="addItemQty">' + (inOrder ? inOrder.qty : 1) + '</span>';
      html += '<button onclick="event.stopPropagation();adjustAddQty(1)">+</button>';
      html += '</div>';
      html += '<button class="cust-btn-primary cust-item-add-btn" onclick="event.stopPropagation();addItemToOrder(\'' + u.key + '\')">';
      html += inOrder ? t('wizard.update') : t('wizard.addToOrder');
      html += '</button>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
  });
  html += '</div>';

  // Selected items summary bar
  if (orderItems.length > 0) {
    html += '<div class="cust-items-summary">';
    html += '<div class="cust-items-summary-title">' + t('wizard.selectedItems') + '</div>';
    html += '<div class="cust-items-summary-list">';
    orderItems.forEach(item => {
      html += '<div class="cust-items-summary-item">';
      html += '<span class="cust-items-summary-name">' + (item.qty > 1 ? item.qty + 'x ' : '') + item.name + '</span>';
      html += '<div class="cust-item-qty">';
      html += '<button onclick="adjustItemQty(\'' + item.key + '\', -1)">-</button>';
      html += '<span>' + item.qty + '</span>';
      html += '<button onclick="adjustItemQty(\'' + item.key + '\', 1)">+</button>';
      html += '</div>';
      html += '<button class="cust-items-summary-remove" onclick="removeItem(\'' + item.key + '\')" title="Remove">&times;</button>';
      html += '</div>';
    });
    html += '</div></div>';
  }

  el.innerHTML = html;
}

function getServiceCountForItem(uType) {
  return services.filter(svc =>
    svc.tags.some(t => uType.tagKeys.includes(t) || t === 'Any Uniform')
  ).length;
}

function toggleItemDetail(key) {
  expandedItem = expandedItem === key ? null : key;
  renderStep1(document.getElementById('wizardContent'));
}

function adjustAddQty(delta) {
  const span = document.getElementById('addItemQty');
  if (!span) return;
  let val = parseInt(span.textContent) + delta;
  if (val < 1) val = 1;
  if (val > 10) val = 10;
  span.textContent = val;
}

function addItemToOrder(key) {
  const span = document.getElementById('addItemQty');
  const qty = span ? parseInt(span.textContent) : 1;
  const uType = uniformTypes.find(u => u.key === key);
  const existing = orderItems.find(i => i.key === key);
  if (existing) {
    existing.qty = qty;
  } else {
    orderItems.push({ key: key, name: uType.name, qty: qty });
  }
  expandedItem = null;
  renderStep1(document.getElementById('wizardContent'));
}

function adjustItemQty(key, delta) {
  const item = orderItems.find(i => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeItem(key);
    return;
  }
  if (item.qty > 10) item.qty = 10;
  renderStep1(document.getElementById('wizardContent'));
}

function removeItem(key) {
  orderItems = orderItems.filter(i => i.key !== key);
  renderStep1(document.getElementById('wizardContent'));
}

// ── Step 2: Service Selection (filtered) ────────────────────
function getRelevantServices() {
  const activeTags = new Set();
  orderItems.forEach(item => {
    const uType = uniformTypes.find(u => u.key === item.key);
    if (uType) uType.tagKeys.forEach(t => activeTags.add(t));
  });
  return services.filter(svc =>
    svc.tags.some(t => activeTags.has(t) || t === 'Any Uniform')
  );
}

function renderStep2(el) {
  const relevant = getRelevantServices();
  const cats = ['creation', 'sewing', 'removal', 'combo', 'alteration'];
  let html = '<h3 style="margin-bottom:16px;font-size:16px">' + t('wizard.selectServices') + '</h3>';

  // Item pills summary
  const itemNames = orderItems.map(i => (i.qty > 1 ? i.qty + 'x ' : '') + i.name);
  html += '<div class="cust-svc-filter-bar">' + t('wizard.showingFor') + ' ' +
    itemNames.map(n => '<span class="cust-svc-filter-pill">' + n + '</span>').join(' ') +
    '</div>';

  cats.forEach(cat => {
    const catSvcs = relevant.filter(s => s.category === cat);
    if (catSvcs.length === 0) return;
    html += '<div class="cust-svc-select-group">' +
      '<h4>' + catLabel(cat) + '</h4>';
    catSvcs.forEach(svc => {
      const checked = orderServices.includes(svc.id) ? ' checked' : '';
      const selectedCls = orderServices.includes(svc.id) ? ' selected' : '';
      const imgUrl = svcImages[svc.id] || (SVC_WK + '6/67/Operational_Camouflage_Pattern_2015.jpg');
      
      html += '<label class="cust-svc-check' + selectedCls + '">' +
        '<input type="checkbox" value="' + svc.id + '"' + checked + ' onchange="toggleService(\'' + svc.id + '\')">' +
        '<img src="' + imgUrl + '" class="cust-svc-check-img" alt="' + svc.name + '" loading="lazy">' +
        '<div class="cust-svc-check-info">' +
          '<span class="cust-svc-check-name">' + svcName(svc) + '</span>' +
          '<span class="cust-svc-check-time">' + svc.time + '</span>' +
        '</div>' +
        '<span class="cust-svc-check-price">' + fmt(svc.price) + '</span>' +
      '</label>';

      // Provision toggle for sewing/attach services
      if (PROVISION_SVCS.includes(svc.id) && orderServices.includes(svc.id)) {
        const cf = orderCustomFields[svc.id] || {};
        const prov = cf.provision || 'own';
        html += '<div class="cust-custom-field cust-provision-field">' +
          '<label>' + t('wizard.itemSource') + '</label>' +
          '<div class="cust-provision-toggle">' +
            '<button class="cust-provision-btn' + (prov === 'own' ? ' active' : '') + '" onclick="event.preventDefault();setProvision(\'' + svc.id + '\',\'own\')">' + t('wizard.bringingOwn') + '</button>' +
            '<button class="cust-provision-btn' + (prov === 'purchase' ? ' active' : '') + '" onclick="event.preventDefault();setProvision(\'' + svc.id + '\',\'purchase\')">' + t('wizard.needPurchase') + '</button>' +
          '</div>' +
        '</div>';
      }

      // Name input for name tape services
      if (NAME_INPUT_SVCS.includes(svc.id) && orderServices.includes(svc.id)) {
        const val = (orderCustomFields[svc.id] && orderCustomFields[svc.id].name) || '';
        html += '<div class="cust-custom-field">' +
          '<label>' + t('wizard.nameForTape') + '</label>' +
          '<input type="text" id="cf-name-' + svc.id + '" value="' + val + '" placeholder="e.g. RODRIGUEZ" class="cust-custom-field-input">' +
        '</div>';
      }

      // Rank input for rank insignia services
      if (RANK_INPUT_SVCS.includes(svc.id) && orderServices.includes(svc.id)) {
        const val = (orderCustomFields[svc.id] && orderCustomFields[svc.id].rank) || '';
        html += '<div class="cust-custom-field">' +
          '<label>' + t('wizard.rank') + '</label>' +
          '<input type="text" id="cf-rank-' + svc.id + '" value="' + val + '" placeholder="e.g. SGT, SSG, 1LT" class="cust-custom-field-input">' +
        '</div>';
      }
    });
    html += '</div>';
  });

  const total = orderServices.reduce((sum, id) => {
    const svc = services.find(s => s.id === id);
    return sum + (svc ? svc.price : 0);
  }, 0);
  html += '<div class="cust-running-total">' + t('wizard.total') + ' ' + fmt(total) + '</div>';

  el.innerHTML = html;
}

function toggleService(id) {
  // Save any existing custom field inputs before re-render
  saveCustomFieldInputs();

  const idx = orderServices.indexOf(id);
  if (idx >= 0) {
    orderServices.splice(idx, 1);
    delete orderCustomFields[id];
  } else {
    orderServices.push(id);
  }

  // Re-render step 2 to show/hide custom field inputs, provision toggles, and selection state
  renderStep2(document.getElementById('wizardContent'));
}

function setProvision(svcId, value) {
  saveCustomFieldInputs();
  if (!orderCustomFields[svcId]) orderCustomFields[svcId] = {};
  orderCustomFields[svcId].provision = value;
  renderStep2(document.getElementById('wizardContent'));
}

// ── Step 3: Deadline, Drop-off & Details ────────────────────
function renderStep3(el) {
  // Default deadline to today + 7 days if not set
  if (!orderDeadline) {
    const dl = new Date();
    dl.setDate(dl.getDate() + 7);
    orderDeadline = dl.toISOString().split('T')[0];
  }
  const todayStr = new Date().toISOString().split('T')[0];

  let html = '<h3 style="margin-bottom:16px;font-size:16px">' + t('wizard.details') + '</h3>';

  // A. Deadline
  html += '<div class="cust-form-group">' +
    '<label>' + t('wizard.whenDone') + '</label>' +
    '<input type="date" class="cust-deadline-input" id="wizDeadline" min="' + todayStr + '" value="' + (orderDeadline || '') + '">' +
  '</div>';

  // B. Drop-off appointment
  html += '<div class="cust-form-group">' +
    '<label>' + t('wizard.whenDropoff') + '</label>' +
    '<div id="custCalendar"></div>' +
    '<div id="custSlots"></div>' +
  '</div>';

  // C. Special Instructions
  html += '<div class="cust-form-group">' +
    '<label>' + t('wizard.specialInstructions') + '</label>' +
    '<textarea class="cust-textarea" id="wizNotes" placeholder="...">' + orderNotes + '</textarea>' +
  '</div>';

  // D. Driver pickup / delivery scheduling
  html += '<div class="cust-driver-section" style="margin-top:16px;padding:16px;border-radius:12px;background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.15)">' +
    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:12px">' +
      '<input type="checkbox" id="wizDriverToggle" ' + (window._wizDriverRequested ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:#a855f7">' +
      '<span style="font-weight:600">&#128666; ' + t('wizard.driverBannerTitle') + '</span>' +
    '</label>' +
    '<div id="wizDriverFields" style="display:' + (window._wizDriverRequested ? 'block' : 'none') + '">' +
      '<div class="cust-form-group" style="margin-bottom:10px">' +
        '<label>' + t('wizard.pickupAddress') + '</label>' +
        '<input type="text" class="cust-input" id="wizPickupAddr" placeholder="' + t('wizard.pickupAddressPlaceholder') + '" value="' + (window._wizPickupAddr || '') + '">' +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<div class="cust-form-group" style="flex:1">' +
          '<label>' + t('wizard.pickupDate') + '</label>' +
          '<input type="date" class="cust-input" id="wizPickupDate" value="' + (window._wizPickupDate || '') + '">' +
        '</div>' +
        '<div class="cust-form-group" style="flex:1">' +
          '<label>' + t('wizard.pickupTime') + '</label>' +
          '<input type="time" class="cust-input" id="wizPickupTime" value="' + (window._wizPickupTime || '') + '">' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

  // E. Photo upload
  html += '<div class="cust-form-group" style="margin-top:16px">' +
    '<label>' + t('wizard.photoUpload') + '</label>' +
    '<p style="font-size:12px;color:rgba(240,232,220,0.5);margin:4px 0 8px">' + t('wizard.photoUploadSub') + '</p>' +
    '<input type="file" id="wizPhotoInput" accept="image/*" capture="environment" multiple ' +
      'style="padding:8px;border-radius:8px;border:1px solid rgba(240,232,220,0.1);background:rgba(240,232,220,0.06);color:#f0e8dc;width:100%;box-sizing:border-box">' +
    '<div id="wizPhotoPreview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div>' +
  '</div>';

  el.innerHTML = html;
  buildCustomerCalendar();
  attachStep3Handlers();
}

// Driver toggle + photo preview handlers (attached after render)
function attachStep3Handlers() {
  var toggle = document.getElementById('wizDriverToggle');
  var fields = document.getElementById('wizDriverFields');
  if (toggle && fields) {
    toggle.addEventListener('change', function () {
      window._wizDriverRequested = toggle.checked;
      fields.style.display = toggle.checked ? 'block' : 'none';
    });
  }
  // Save driver fields on change
  ['wizPickupAddr', 'wizPickupDate', 'wizPickupTime'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', function () { window['_' + id] = el.value; });
  });
  // Photo preview
  var photoInput = document.getElementById('wizPhotoInput');
  if (photoInput) {
    photoInput.addEventListener('change', function () {
      var preview = document.getElementById('wizPhotoPreview');
      if (!preview) return;
      window._wizPhotos = Array.from(photoInput.files).slice(0, 5);
      preview.innerHTML = '';
      window._wizPhotos.forEach(function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var img = document.createElement('img');
          img.src = e.target.result;
          img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid rgba(240,232,220,0.1)';
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
  }
}

// ── Step 4: Review ──────────────────────────────────────────
function renderStep4(el) {
  const selectedSvcs = orderServices.map(id => services.find(s => s.id === id)).filter(Boolean);
  const total = selectedSvcs.reduce((sum, s) => sum + s.price, 0);
  const totalTime = selectedSvcs.reduce((sum, s) => sum + parseDuration(s.time), 0);

  let html = '<h3 style="margin-bottom:16px;font-size:16px">' + t('wizard.review') + '</h3>';

  // Items
  html += '<div class="cust-review-section">' +
    '<h4>' + t('wizard.reviewItems') + '</h4>';
  orderItems.forEach(item => {
    html += '<div class="cust-review-row"><span>' + (item.qty > 1 ? item.qty + 'x ' : '') + item.name + '</span></div>';
  });
  html += '</div>';

  // Services (with custom fields)
  html += '<div class="cust-review-section">' +
    '<h4>' + t('wizard.reviewServices') + '</h4>';
  selectedSvcs.forEach(s => {
    let label = svcName(s);
    const cf = orderCustomFields[s.id];
    if (cf && cf.provision) label += ' (' + (cf.provision === 'own' ? t('misc.bringingOwn') : t('misc.needsPurchase')) + ')';
    if (cf && cf.name) label += ' \u2014 ' + t('wizard.nameForTape') + ' ' + cf.name;
    if (cf && cf.rank) label += ' \u2014 ' + t('wizard.rank') + ' ' + cf.rank;
    html += '<div class="cust-review-row"><span>' + label + '</span><span>' + fmt(s.price) + '</span></div>';
  });
  html += '<div class="cust-review-total"><span>Total</span><span>' + fmt(total) + '</span></div>' +
  '</div>';

  // Time
  html += '<div class="cust-review-section">' +
    '<h4>' + t('wizard.reviewTime') + '</h4>' +
    '<div class="cust-review-row"><span>' + totalTime + ' ' + t('misc.min') + '</span></div>' +
  '</div>';

  // Deadline
  if (orderDeadline) {
    html += '<div class="cust-review-section">' +
      '<h4>' + t('wizard.reviewNeedBy') + '</h4>' +
      '<div class="cust-review-row"><span>' + orderDeadline + '</span></div>' +
    '</div>';
  }

  // Drop-off Appointment
  if (orderDropoffDate && orderDropoffTime) {
    html += '<div class="cust-review-section">' +
      '<h4>' + t('wizard.reviewDropoff') + '</h4>' +
      '<div class="cust-review-row"><span>' + orderDropoffDate + ' at ' + formatTime(orderDropoffTime) + '</span></div>' +
    '</div>';
  }

  // Notes
  if (orderNotes) {
    html += '<div class="cust-review-section">' +
      '<h4>' + t('wizard.reviewNotes') + '</h4>' +
      '<div class="cust-review-row"><span>' + orderNotes + '</span></div>' +
    '</div>';
  }

  // Payment section
  html += '<div id="paymentSection" style="margin:20px 0;padding:20px;background:var(--glass-bg,rgba(30,28,26,0.5));border:1px solid rgba(255,255,255,0.08);border-radius:12px">' +
    '<h4 style="font-size:0.95rem;font-weight:700;margin-bottom:4px">Payment</h4>' +
    '<p style="font-size:0.8rem;color:var(--muted);margin-bottom:12px">Pay now or pay at pickup</p>' +
    '<div style="display:flex;gap:8px;margin-bottom:12px">' +
      '<button type="button" onclick="setPayMethod(\'card\')" id="payMethodCard" class="cust-btn-outline" style="flex:1;padding:10px;border-radius:8px;font-size:0.85rem">Pay with Card</button>' +
      '<button type="button" onclick="setPayMethod(\'later\')" id="payMethodLater" class="cust-btn-outline" style="flex:1;padding:10px;border-radius:8px;font-size:0.85rem;border-color:var(--accent);color:var(--accent)">Pay at Pickup</button>' +
    '</div>' +
    '<div id="sq-card-container" style="display:none;min-height:90px"></div>' +
    '<div id="paymentError" style="color:#e74c3c;font-size:0.8rem;margin-top:8px"></div>' +
  '</div>';

  el.innerHTML = html;
}

// ── Square Payment Integration ─────────────────────────────
let squarePayments = null;
let squareCard = null;
let payMethod = 'later';

async function initSquarePayment() {
  if (!window.Square) return;
  const appId = (typeof shopConfig !== 'undefined' && shopConfig.squareAppId) ? shopConfig.squareAppId : null;
  if (!appId) return; // No Square configured for this shop

  try {
    squarePayments = Square.payments(appId, (typeof shopConfig !== 'undefined' && shopConfig.squareLocationId) || undefined);
    squareCard = await squarePayments.card();
    const container = document.getElementById('sq-card-container');
    if (container) await squareCard.attach('#sq-card-container');
  } catch (e) {
    console.warn('Square payment init failed:', e);
  }
}

async function processPayment(orderTotal) {
  if (!squareCard) return { ok: true, method: 'pay-later' }; // No payment configured, allow pay-at-pickup

  try {
    const result = await squareCard.tokenize();
    if (result.status === 'OK') {
      const shopSlug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : '';
      const resp = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_slug: shopSlug,
          source_id: result.token,
          amount: Math.round(orderTotal * 100), // cents
          currency: 'USD'
        })
      });
      const data = await resp.json();
      return data;
    } else {
      return { ok: false, error: result.errors?.[0]?.message || 'Card declined' };
    }
  } catch (e) {
    return { ok: false, error: 'Payment processing failed' };
  }
}

function setPayMethod(method) {
  payMethod = method;
  const cardContainer = document.getElementById('sq-card-container');
  const cardBtn = document.getElementById('payMethodCard');
  const laterBtn = document.getElementById('payMethodLater');
  if (cardContainer) cardContainer.style.display = method === 'card' ? '' : 'none';
  if (cardBtn) {
    cardBtn.style.borderColor = method === 'card' ? 'var(--accent,#c9a84c)' : '';
    cardBtn.style.color = method === 'card' ? 'var(--accent,#c9a84c)' : '';
  }
  if (laterBtn) {
    laterBtn.style.borderColor = method === 'later' ? 'var(--accent,#c9a84c)' : '';
    laterBtn.style.color = method === 'later' ? 'var(--accent,#c9a84c)' : '';
  }
  if (method === 'card' && !squareCard) initSquarePayment();
}

// ── Submit Order ────────────────────────────────────────────
function submitOrder() {
  if (_SHOP_TIER === 'storefront' || _SHOP_TIER === 'tier3') {
    showToast('Online ordering is not available for this shop.');
    return;
  }
  const selectedSvcs = orderServices.map(id => services.find(s => s.id === id)).filter(Boolean);
  const total = selectedSvcs.reduce((sum, s) => sum + s.price, 0);
  const totalTime = selectedSvcs.reduce((sum, s) => sum + parseDuration(s.time), 0);

  // Items label for display
  const itemsLabel = orderItems.map(i => (i.qty > 1 ? i.qty + 'x ' : '') + i.name).join(', ');

  // Deadline from picker (fallback to +7 days)
  let dlStr = orderDeadline;
  if (!dlStr) {
    const dl = new Date();
    dl.setDate(dl.getDate() + 7);
    dlStr = dl.toISOString().split('T')[0];
  }

  // Build scheduled block if drop-off appointment booked
  let scheduledBlock = null;
  if (orderDropoffDate && orderDropoffTime) {
    const endMins = parseTime(orderDropoffTime) + totalTime;
    scheduledBlock = {
      date: orderDropoffDate,
      startTime: orderDropoffTime,
      endTime: minutesToTime(endMins),
      employeeId: findAvailableEmployee(orderDropoffDate, orderDropoffTime, totalTime)
    };
  }

  const pickupLabel = orderDropoffDate ? 'Drop-off & Pick-up' : 'Customer Pickup';

  const orderData = {
    customer: currentSession.name,
    phone: currentSession.phone,
    email: currentSession.email || '',
    unit: currentSession.unit || '',
    uniform: itemsLabel,
    uniformKey: orderItems[0].key,
    items: orderItems,
    deadline: dlStr,
    urgency: 'on-track',
    status: 'received',
    pickup: pickupLabel,
    pickupType: 'customer',
    modifications: selectedSvcs.map(s => {
      const cf = orderCustomFields[s.id];
      let label = s.name;
      if (cf && cf.provision) label += ' (' + (cf.provision === 'own' ? 'customer providing' : 'needs purchase') + ')';
      if (cf && cf.name) label += ' \u2014 Name: ' + cf.name;
      if (cf && cf.rank) label += ' \u2014 Rank: ' + cf.rank;
      return label;
    }),
    sopTitle: selectedSvcs.length === 1 ? selectedSvcs[0].name : (itemsLabel + ' \u2014 Custom'),
    sopTime: totalTime + ' min',
    costs: {
      labor: total,
      materials: selectedSvcs.map(s => ({ item: s.name, qty: 1, unitPrice: s.price, price: s.price }))
    },
    checklist: selectedSvcs.map(s => {
      const cf = orderCustomFields[s.id];
      let text = s.name;
      if (cf && cf.provision) text += ' (' + (cf.provision === 'own' ? 'customer providing' : 'needs purchase') + ')';
      if (cf && cf.name) text += ' \u2014 Name: ' + cf.name;
      if (cf && cf.rank) text += ' \u2014 Rank: ' + cf.rank;
      return { text: text, done: false, completedBy: null, completedAt: null };
    }),
    customerComment: orderNotes || '',
    createdBy: 'customer'
  };
  if (scheduledBlock) orderData.scheduledBlock = scheduledBlock;

  const incoming = DataStore.createIncoming(orderData);

  // Show confirmation modal with print option instead of just a toast
  var confirmHtml =
    '<div class="cust-confirm-overlay" id="orderConfirmOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px">' +
      '<div style="background:var(--bg-surface,#161d2f);border-radius:12px;padding:32px;max-width:400px;width:100%;text-align:center;border:1px solid var(--glass-border,rgba(240,232,220,.08))">' +
        '<div style="font-size:48px;margin-bottom:12px">&#10003;</div>' +
        '<h3 style="margin:0 0 8px;color:var(--accent-green,#22c55e)">Order Submitted!</h3>' +
        '<p style="color:var(--text-muted,#999);font-size:14px;margin:0 0 8px">Order <strong>' + incoming.id + '</strong> has been received.</p>' +
        '<p style="color:var(--text-muted,#999);font-size:13px;margin:0 0 20px">We\'ll notify you when it\'s ready.</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<button onclick="if(typeof printCustomerConfirmation===\'function\'){var o=' + JSON.stringify({
            id: incoming.id,
            customer: orderData.customer,
            phone: orderData.phone,
            email: orderData.email,
            uniform: orderData.uniform,
            deadline: orderData.deadline,
            modifications: orderData.modifications,
            costs: orderData.costs,
            scheduledBlock: orderData.scheduledBlock || null
          }).replace(/'/g, "\\'") + ';printCustomerConfirmation(o)}" class="cust-btn-primary" style="padding:10px 20px;font-size:14px;cursor:pointer">&#128424; Print Confirmation</button>' +
          '<button onclick="document.getElementById(\'orderConfirmOverlay\').remove()" class="cust-btn-secondary" style="padding:10px 20px;font-size:14px;cursor:pointer">Close</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  var confirmDiv = document.createElement('div');
  confirmDiv.innerHTML = confirmHtml;
  document.body.appendChild(confirmDiv.firstChild);

  renderWizard();
  renderWelcome();
  renderMyOrders();
}

// ══════════════════════════════════════════════════════════════
//  APPOINTMENT CALENDAR
// ══════════════════════════════════════════════════════════════

function buildCustomerCalendar() {
  const container = document.getElementById('custCalendar');
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let html = '<div class="cust-cal-grid">';

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay();
    const closed = isDayClosed(dateStr);
    const isSelected = orderDropoffDate === dateStr;

    let cls = 'cust-cal-day';
    if (closed) cls += ' cust-cal-disabled';
    if (isSelected) cls += ' selected';

    html += '<div class="' + cls + '" ' + (!closed ? 'onclick="selectCalDay(\'' + dateStr + '\')"' : '') + '>' +
      '<div class="cust-cal-day-name">' + shortDay(dow) + '</div>' +
      '<div class="cust-cal-day-num">' + d.getDate() + '</div>' +
      '<div class="cust-cal-day-month">' + monthName(d.getMonth()) + '</div>' +
    '</div>';
  }
  html += '</div>';
  container.innerHTML = html;

  // Render slots if date selected
  if (orderDropoffDate) {
    buildCustomerSlots(orderDropoffDate);
  }
}

function selectCalDay(dateStr) {
  orderDropoffDate = dateStr;
  orderDropoffTime = null;
  buildCustomerCalendar();
}

function buildCustomerSlots(dateStr) {
  const container = document.getElementById('custSlots');
  if (!container) return;

  const available = getAvailableSlots(dateStr);
  if (available.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:12px 0">' + t('wizard.noSlots') + '</div>';
    return;
  }

  container.innerHTML =
    '<div class="cust-slots-container">' +
      '<div class="cust-slots-title">' + t('wizard.availableTimes') + '</div>' +
      '<div class="cust-slots-grid">' +
        available.map(slot => {
          const cls = 'cust-slot' + (slot.taken ? ' cust-slot-taken' : '') + (orderDropoffTime === slot.time ? ' selected' : '');
          return '<div class="' + cls + '" ' +
            (!slot.taken ? 'onclick="selectSlot(\'' + slot.time + '\')"' : '') + '>' +
            formatTime(slot.time) +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
}

function selectSlot(time) {
  orderDropoffTime = time;
  buildCustomerSlots(orderDropoffDate);
}

function getAvailableSlots(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  const hrs = shopHours[dow];
  if (!hrs) return [];

  const startMins = parseTime(hrs.start);
  const endMins = parseTime(hrs.end);
  const slots = [];

  for (let m = startMins; m < endMins; m += 30) {
    const timeStr = minutesToTime(m);
    const taken = !hasAnyEmployeeFree(dateStr, timeStr);
    slots.push({ time: timeStr, taken: taken });
  }
  return slots;
}

function hasAnyEmployeeFree(dateStr, timeStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  const slotStart = parseTime(timeStr);
  const slotEnd = slotStart + 30;

  // Combine confirmed orders + incoming orders for conflict checking
  const allOrders = sharedOrders.concat(DataStore.getIncoming());

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const empSched = emp.schedule[dow];
    if (!empSched) continue;

    const empStart = parseTime(empSched.start);
    const empEnd = parseTime(empSched.end);
    if (slotStart < empStart || slotEnd > empEnd) continue;

    // Check if employee has a conflicting order
    const conflict = allOrders.some(o => {
      if (!o.scheduledBlock) return false;
      if (o.scheduledBlock.date !== dateStr) return false;
      if (o.scheduledBlock.employeeId !== emp.id) return false;
      const bStart = parseTime(o.scheduledBlock.startTime);
      const bEnd = parseTime(o.scheduledBlock.endTime);
      return slotStart < bEnd && slotEnd > bStart;
    });
    if (!conflict) return true;
  }
  return false;
}

function findAvailableEmployee(dateStr, timeStr, durationMins) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  const slotStart = parseTime(timeStr);
  const slotEnd = slotStart + durationMins;

  // Combine confirmed orders + incoming orders for conflict checking
  const allOrders = sharedOrders.concat(DataStore.getIncoming());

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const empSched = emp.schedule[dow];
    if (!empSched) continue;

    const empStart = parseTime(empSched.start);
    const empEnd = parseTime(empSched.end);
    if (slotStart < empStart || slotEnd > empEnd) continue;

    const conflict = allOrders.some(o => {
      if (!o.scheduledBlock) return false;
      if (o.scheduledBlock.date !== dateStr) return false;
      if (o.scheduledBlock.employeeId !== emp.id) return false;
      const bStart = parseTime(o.scheduledBlock.startTime);
      const bEnd = parseTime(o.scheduledBlock.endTime);
      return slotStart < bEnd && slotEnd > bStart;
    });
    if (!conflict) return emp.id;
  }
  return 'emp-1'; // fallback
}

// ══════════════════════════════════════════════════════════════
//  BIG HERO CALENDAR
// ══════════════════════════════════════════════════════════════

let bigcalDate = new Date();
bigcalDate.setDate(1);

function getBigcalDayCapacity(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  if (!shopHours[dow] || isDayClosed(dateStr)) return null;

  let totalAvail = 0;
  employees.forEach(emp => {
    const sched = emp.schedule[dow];
    if (sched) totalAvail += parseTime(sched.end) - parseTime(sched.start);
  });
  if (totalAvail === 0) return null;

  // Include both confirmed and incoming orders
  const allOrders = sharedOrders.concat(DataStore.getIncoming());
  let booked = 0;
  allOrders.forEach(o => {
    if (o.scheduledBlock && o.scheduledBlock.date === dateStr) {
      booked += parseTime(o.scheduledBlock.endTime) - parseTime(o.scheduledBlock.startTime);
    }
  });

  const ratio = booked / totalAvail;
  if (ratio >= 0.8) return 'full';
  if (ratio >= 0.4) return 'busy';
  return 'free';
}

const fullMonthNames = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const fullMonthKeys = ['month.january','month.february','month.march','month.april',
  'month.may_full','month.june','month.july','month.august','month.september',
  'month.october','month.november','month.december'];

function renderBigCalendar() {
  const grid = document.getElementById('bigcalGrid');
  const monthLabel = document.getElementById('bigcalMonth');
  if (!grid || !monthLabel) return;

  const year = bigcalDate.getFullYear();
  const month = bigcalDate.getMonth();
  monthLabel.textContent = t(fullMonthKeys[month]) + ' ' + year;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0,0,0,0);

  let html = '';

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cust-bigcal-cell cust-bigcal-empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split('T')[0];
    const dow = date.getDay();
    const hrs = shopHours[dow];
    const closed = isDayClosed(dateStr);
    const isToday = date.getTime() === today.getTime();
    const isPast = date < today;

    let cls = 'cust-bigcal-cell';
    if (isToday) cls += ' cust-bigcal-today';
    else if (closed) cls += ' cust-bigcal-closed';
    else if (isPast) cls += ' cust-bigcal-past';

    let hrsLabel = '';
    if (closed) {
      hrsLabel = t('bigcal.closed');
    } else if (hrs) {
      hrsLabel = formatTime(hrs.start).replace(' ', '') + '-' + formatTime(hrs.end).replace(' ', '');
    }

    const clickAttr = (!closed && !isPast)
      ? ' onclick="bigcalDayClick(\'' + dateStr + '\')"'
      : '';

    // Capacity — color the whole cell
    var capVal = null;
    var capText = 'Light';
    if (!closed && !isPast) {
      capVal = getBigcalDayCapacity(dateStr);
      if (capVal === 'free') { cls += ' cap-cell-free'; capText = 'Light'; }
      else if (capVal === 'busy') { cls += ' cap-cell-busy'; capText = 'Moderate'; }
      else if (capVal === 'full') { cls += ' cap-cell-full'; capText = 'Busy'; }
      else { cls += ' cap-cell-free'; capText = 'Light'; }
    }

    // Tooltip data for hover
    var tooltipAttr = '';
    if (!closed && hrs) {
      tooltipAttr = ' data-tip="' + hrsLabel + ' · ' + capText + '"';
    } else if (closed) {
      tooltipAttr = ' data-tip="Closed"';
    }

    html += '<div class="' + cls + '"' + clickAttr + tooltipAttr + '>' +
      '<span class="cust-bigcal-dot"></span>' +
      (isToday ? '<span class="cust-bigcal-today-label">' + t('bigcal.today') + '</span>' : '') +
      '<span class="cust-bigcal-num">' + d + '</span>' +
      '<span class="cust-bigcal-hrs">' + hrsLabel + '</span>' +
    '</div>';
  }

  grid.innerHTML = html;
}

function bigcalDayClick(dateStr) {
  // Tier3: show day detail overlay instead of auth/ordering
  if (_SHOP_TIER === 'tier3') {
    showTier3DayDetail(dateStr);
    return;
  }
  // If logged in, jump to dashboard wizard with date pre-selected
  if (currentSession) {
    orderDropoffDate = dateStr;
    switchToDashboard();
    orderStep = 3;
    renderWizardSteps();
    renderWizardContent();
    renderWizardNav();
    setTimeout(() => {
      const el = document.getElementById('custNewOrder');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    openAuth();
  }
}

function showTier3DayDetail(dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  var dow = d.getDay();
  var hrs = shopHours[dow];

  var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dayName = dayNames[dow];
  var dateLabel = monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();

  var closed = isDayClosed(dateStr);
  var hrsLabel = (!closed && hrs) ? formatTime(hrs.start) + ' \u2013 ' + formatTime(hrs.end) : 'Closed';

  // Capacity
  var cap = getBigcalDayCapacity(dateStr);
  var capLabel = 'Light';
  var capColor = '#10b981';
  if (cap === 'busy') { capLabel = 'Moderate'; capColor = '#f59e0b'; }
  if (cap === 'full') { capLabel = 'Busy'; capColor = '#ef4444'; }

  // Prev/next date strings
  var prevD = new Date(d); prevD.setDate(prevD.getDate() - 1);
  var nextD = new Date(d); nextD.setDate(nextD.getDate() + 1);
  var prevStr = prevD.toISOString().split('T')[0];
  var nextStr = nextD.toISOString().split('T')[0];

  // Build overlay
  var existing = document.getElementById('tier3DayOverlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'tier3DayOverlay';
  overlay.className = 't3day-overlay';
  overlay.innerHTML =
    '<button class="t3day-nav-arrow" onclick="document.getElementById(\'tier3DayOverlay\').remove();showTier3DayDetail(\'' + prevStr + '\')">&larr;</button>' +
    '<div class="t3day-modal">' +
      '<button class="t3day-close" onclick="document.getElementById(\'tier3DayOverlay\').remove()">&times;</button>' +
      '<div class="t3day-header">' +
        '<div class="t3day-dayname">' + dayName + '</div>' +
        '<div class="t3day-date">' + dateLabel + '</div>' +
      '</div>' +
      '<div class="t3day-body">' +
        '<div class="t3day-info-row">' +
          '<div class="t3day-info-block">' +
            '<div class="t3day-section-title">Hours</div>' +
            '<div class="t3day-hours-value">' + hrsLabel + '</div>' +
          '</div>' +
          '<div class="t3day-info-block">' +
            '<div class="t3day-section-title">Traffic</div>' +
            '<div class="t3day-cap-badge" style="background:' + capColor + '18;color:' + capColor + '">' +
              '<span class="t3day-cap-dot" style="background:' + capColor + '"></span>' + capLabel +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="t3day-ctas">' +
          '<button class="t3day-cta t3day-cta-call" onclick="document.getElementById(\'tier3DayOverlay\').remove();openContactModal()">Contact Us</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<button class="t3day-nav-arrow" onclick="document.getElementById(\'tier3DayOverlay\').remove();showTier3DayDetail(\'' + nextStr + '\')">&rarr;</button>';

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

function bigcalPrevMonth() {
  bigcalDate.setMonth(bigcalDate.getMonth() - 1);
  renderBigCalendar();
}

function bigcalNextMonth() {
  bigcalDate.setMonth(bigcalDate.getMonth() + 1);
  renderBigCalendar();
}

// ══════════════════════════════════════════════════════════════
//  STORE INVENTORY RENDERER
// ══════════════════════════════════════════════════════════════

function renderStoreInventory() {
  const pills = document.getElementById('invFilterPills');
  const grid = document.getElementById('custInvGrid');
  if (!pills || !grid) return;

  const allCats = ['All'].concat(invCategories);
  pills.innerHTML = allCats.map(c =>
    '<button class="cust-pill' + (c === 'All' ? ' active' : '') + '" data-inv-cat="' + c + '">' + (c === 'All' ? t('cat.all') : invCatName(c)) + '</button>'
  ).join('');

  let invShowAll = false;

  function removeInvToggle() {
    const old = document.getElementById('invShowMoreBtn');
    if (old) old.remove();
  }

  function renderInvGrid(cat) {
    const filtered = cat === 'All' ? storeInventory : storeInventory.filter(i => i.category === cat);
    grid.innerHTML = '';
    removeInvToggle();
    const limit = invShowAll ? filtered.length : 9;
    const visible = filtered.slice(0, limit);
    visible.forEach(item => {
      let stockCls, stockLabel;
      if (item.stock === 0) { stockCls = 'cust-inv-stock-out'; stockLabel = t('inventory.outOfStock'); }
      else if (item.stock <= 5) { stockCls = 'cust-inv-stock-low'; stockLabel = t('inventory.left', { count: item.stock }); }
      else { stockCls = 'cust-inv-stock-ok'; stockLabel = t('inventory.inStock', { count: item.stock }); }

      const imgHtml = item.image
        ? '<img src="' + item.image + '" alt="' + item.name + '" loading="lazy">'
        : '<span class="cust-inv-card-icon">' + (item.icon || '?') + '</span>';

      const card = document.createElement('div');
      card.className = 'cust-inv-card';
      card.innerHTML =
        '<div class="cust-inv-card-img">' + imgHtml + '</div>' +
        '<div class="cust-inv-card-body">' +
          '<div class="cust-inv-card-name">' + invName(item) + '</div>' +
          '<div class="cust-inv-card-meta">' +
            '<span class="cust-inv-cat-badge">' + invCatName(item.category) + '</span>' +
            '<span class="cust-inv-price">' + fmt(item.price) + '</span>' +
          '</div>' +
          '<div class="cust-inv-card-foot">' +
            '<span class="cust-inv-stock ' + stockCls + '">' + stockLabel + '</span>' +
            (item.stock > 0 ? '<button class="cust-add-cart" data-inv-id="' + item.id + '">' + t('misc.addToCart') + '</button>' : '') +
          '</div>' +
        '</div>';
      const cartBtn = card.querySelector('.cust-add-cart');
      if (cartBtn) {
        cartBtn.addEventListener('click', () => addToCart('inv', item.id));
      }
      grid.appendChild(card);
    });

    if (filtered.length > 9) {
      const btn = document.createElement('button');
      btn.id = 'invShowMoreBtn';
      btn.className = 'cust-btn-secondary cust-show-more-btn';
      btn.textContent = invShowAll ? t('inventory.showLess') : t('inventory.showAll', { count: filtered.length });
      btn.addEventListener('click', () => {
        invShowAll = !invShowAll;
        const activeCat = pills.querySelector('.cust-pill.active');
        renderInvGrid(activeCat ? activeCat.dataset.invCat : 'All');
      });
      grid.parentNode.insertBefore(btn, grid.nextSibling);
    }
  }

  pills.addEventListener('click', e => {
    if (!e.target.matches('.cust-pill')) return;
    pills.querySelectorAll('.cust-pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    invShowAll = false;
    renderInvGrid(e.target.dataset.invCat);
  });

  renderInvGrid('All');
}

// ══════════════════════════════════════════════════════════════
//  CART SYSTEM
// ══════════════════════════════════════════════════════════════

let cart = JSON.parse(localStorage.getItem(_ck('cart')) || '[]');

function saveCart() {
  localStorage.setItem(_ck('cart'), JSON.stringify(cart));
}

function resolveCartItem(c) {
  if (c.type === 'svc') return services.find(s => s.id === c.id);
  if (c.type === 'inv') return storeInventory.find(i => i.id === c.id);
  return null;
}

// ── Item Customization ──────────────────────────────────────
// Items that require customization before adding to cart
const _RANK_OPTIONS = ['PVT','PV2','PFC','SPC','CPL','SGT','SSG','SFC','MSG','1SG','SGM','CSM','SMA',
  '2LT','1LT','CPT','MAJ','LTC','COL','BG','MG','LTG','GEN'];

const CUSTOMIZABLE_ITEMS = {
  // ── Services ──────────────────────────────────────────────
  'SVC-001': {
    title: 'Name Tape — Creation (OCP)',
    fields: [
      { key: 'nameText', label: 'Name', type: 'text', placeholder: 'e.g. RODRIGUEZ', required: true }
    ]
  },
  'SVC-002': {
    title: 'Custom Nametape',
    fields: [
      { key: 'nameText', label: 'Name', type: 'text', placeholder: 'e.g. RODRIGUEZ', required: true },
      { key: 'pattern', label: 'Pattern', type: 'select', options: ['OCP', 'UCP'], required: true },
      { key: 'velcro', label: 'Backing', type: 'select', options: ['Velcro (Hook & Loop)', 'Sew-On (No Velcro)'], required: true }
    ]
  },
  'SVC-003': {
    title: 'Name Tape — Creation (AGSU)',
    fields: [
      { key: 'nameText', label: 'Name', type: 'text', placeholder: 'e.g. RODRIGUEZ', required: true }
    ]
  },
  'SVC-012': {
    title: 'Rank Insignia — Attach (H&L)',
    fields: [
      { key: 'rank', label: 'Rank', type: 'select', options: _RANK_OPTIONS, required: true }
    ]
  },
  'SVC-013': {
    title: 'Rank Insignia — Sew On',
    fields: [
      { key: 'rank', label: 'Rank', type: 'select', options: _RANK_OPTIONS, required: true }
    ]
  },
  'SVC-014': {
    title: 'Unit Patch (SSI) — Sew On',
    fields: [
      { key: 'unitName', label: 'Unit Name', type: 'text', placeholder: 'e.g. 82nd Airborne', required: true }
    ]
  },
  'SVC-015': {
    title: 'Combat Patch — Sew On',
    fields: [
      { key: 'unitName', label: 'Unit Name', type: 'text', placeholder: 'e.g. 101st Airborne', required: true }
    ]
  },
  'SVC-017': {
    title: 'Skill Badge — Sew On',
    fields: [
      { key: 'badgeType', label: 'Badge Type', type: 'select', options: ['Airborne Wings','Air Assault','Pathfinder','Ranger','CIB'], required: true }
    ]
  },
  'SVC-018': {
    title: 'Tab — Sew On',
    fields: [
      { key: 'tabType', label: 'Tab Type', type: 'select', options: ['Ranger','Airborne','Sapper','Special Forces'], required: true }
    ]
  },
  'SVC-023': {
    title: 'AGSU Nameplate — Attach',
    fields: [
      { key: 'nameText', label: 'Name', type: 'text', placeholder: 'e.g. RODRIGUEZ', required: true }
    ]
  },
  'SVC-050': {
    title: 'AGSU Trousers — Hem',
    fields: [
      { key: 'inseam', label: 'Inseam Length', type: 'text', placeholder: 'e.g. 30 inches', required: true }
    ]
  },
  'SVC-051': {
    title: 'ASU Trousers — Hem',
    fields: [
      { key: 'inseam', label: 'Inseam Length', type: 'text', placeholder: 'e.g. 30 inches', required: true }
    ]
  },
  'SVC-052': {
    title: 'OCP Trousers — Hem',
    fields: [
      { key: 'inseam', label: 'Inseam Length', type: 'text', placeholder: 'e.g. 30 inches', required: true }
    ]
  },
  'SVC-054': {
    title: 'Jacket — Take In / Let Out',
    fields: [
      { key: 'direction', label: 'Direction', type: 'select', options: ['Take In','Let Out'], required: true },
      { key: 'amount', label: 'Amount', type: 'text', placeholder: 'e.g. 1 inch', required: true }
    ]
  },
  'SVC-055': {
    title: 'Sleeve Shortening',
    fields: [
      { key: 'desiredLength', label: 'Desired Length', type: 'text', placeholder: 'e.g. 24 inches', required: true }
    ]
  },
  // ── Inventory ─────────────────────────────────────────────
  'INV-001': {
    title: 'Name Tape (OCP)',
    fields: [
      { key: 'nameText', label: 'Name', type: 'text', placeholder: 'e.g. RODRIGUEZ', required: true }
    ]
  },
  'INV-003': {
    title: 'Name Tape (AGSU)',
    fields: [
      { key: 'nameText', label: 'Name', type: 'text', placeholder: 'e.g. RODRIGUEZ', required: true }
    ]
  },
  'INV-004': {
    title: 'Rank Insignia — Hook & Loop',
    fields: [
      { key: 'rank', label: 'Rank', type: 'select', options: _RANK_OPTIONS, required: true }
    ]
  },
  'INV-005': {
    title: 'Rank Insignia — Pin-on (AGSU)',
    fields: [
      { key: 'rank', label: 'Rank', type: 'select', options: _RANK_OPTIONS, required: true }
    ]
  }
};

let _pendingCustomize = null;

function openCustomize(type, id, config) {
  _pendingCustomize = { type, id };
  document.getElementById('customizeTitle').textContent = config.title;
  const container = document.getElementById('customizeFields');
  var html = config.fields.map(f => {
    if (f.type === 'text') {
      return '<div class="cust-form-group">' +
        '<label>' + f.label + (f.required ? ' *' : '') + '</label>' +
        '<input type="text" class="cust-input" id="cust_cf_' + f.key + '" placeholder="' + (f.placeholder || '') + '">' +
      '</div>';
    }
    if (f.type === 'select') {
      return '<div class="cust-form-group">' +
        '<label>' + f.label + (f.required ? ' *' : '') + '</label>' +
        '<select class="cust-input" id="cust_cf_' + f.key + '">' +
          f.options.map(o => '<option value="' + o + '">' + o + '</option>').join('') +
        '</select>' +
      '</div>';
    }
    return '';
  }).join('');
  // Always show amount selector
  html += '<div class="cust-form-group">' +
    '<label>Amount *</label>' +
    '<div class="cust-qty-row">' +
      '<button type="button" class="cust-qty-btn" onclick="var e=document.getElementById(\'cust_cf__qty\');var v=parseInt(e.value)||1;if(v>1)e.value=v-1">−</button>' +
      '<input type="number" class="cust-input cust-qty-input" id="cust_cf__qty" value="1" min="1" max="99">' +
      '<button type="button" class="cust-qty-btn" onclick="var e=document.getElementById(\'cust_cf__qty\');var v=parseInt(e.value)||1;if(v<99)e.value=v+1">+</button>' +
    '</div>' +
  '</div>';
  container.innerHTML = html;
  document.getElementById('customizeOverlay').style.display = 'flex';
}

function closeCustomize() {
  document.getElementById('customizeOverlay').style.display = 'none';
  _pendingCustomize = null;
}

function confirmCustomize() {
  if (!_pendingCustomize) return;
  var type = _pendingCustomize.type;
  var id = _pendingCustomize.id;
  var config = CUSTOMIZABLE_ITEMS[id] || { title: '', fields: [] };
  var customData = {};
  var valid = true;
  var hasCustomFields = config.fields.length > 0;

  config.fields.forEach(function(f) {
    var el = document.getElementById('cust_cf_' + f.key);
    var val = el ? el.value.trim() : '';
    if (f.required && !val) valid = false;
    customData[f.key] = val;
  });

  if (!valid) { showToast('Please fill in all required fields'); return; }

  // Read qty
  var qtyEl = document.getElementById('cust_cf__qty');
  var qty = Math.max(1, parseInt(qtyEl ? qtyEl.value : '1') || 1);

  // For items without custom fields, just add to cart with qty
  if (!hasCustomFields) {
    var existing = cart.find(function(c) { return c.type === type && c.id === id && !c.custom; });
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ type: type, id: id, qty: qty });
    }
    saveCart();
    updateCartBadge();
    var item = resolveCartItem({ type: type, id: id });
    var name = item ? (typeof svcName !== 'undefined' && type === 'svc' ? svcName(item) : (typeof invName !== 'undefined' && type === 'inv' ? invName(item) : item.name)) : 'Item';
    showToast('Added ' + qty + 'x ' + name);
    closeCustomize();
    return;
  }

  // Build a display label with customization details
  var parts = config.fields.map(function(f) {
    var v = customData[f.key] || '';
    return f.key === 'nameText' ? v.toUpperCase() : v;
  }).filter(Boolean);
  var label = config.title + (parts.length ? ' (' + parts.join(', ') + ')' : '');

  // Add to cart with custom data
  cart.push({ type: type, id: id, qty: qty, custom: customData, customLabel: label });
  saveCart();
  updateCartBadge();
  showToast('Added: ' + label);
  closeCustomize();
}

function addToCart(type, id) {
  // Resolve item name for the modal title
  var item = resolveCartItem({ type, id });
  var itemName = item ? (typeof svcName !== 'undefined' && type === 'svc' ? svcName(item) : (typeof invName !== 'undefined' && type === 'inv' ? invName(item) : item.name)) : 'Item';

  if (CUSTOMIZABLE_ITEMS[id]) {
    openCustomize(type, id, CUSTOMIZABLE_ITEMS[id]);
  } else {
    // No custom fields — just amount picker
    openCustomize(type, id, { title: itemName, fields: [] });
  }
}

function removeFromCart(type, id) {
  cart = cart.filter(c => !(c.type === type && c.id === id));
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeCartByIndex(idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function updateCartQty(type, id, delta) {
  const item = cart.find(c => c.type === type && c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(type, id);
    return;
  }
  saveCart();
  renderCartDrawer();
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = cart.reduce((sum, c) => sum + c.qty, 0);
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function toggleCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  drawer.classList.toggle('open');
  overlay.classList.toggle('open');
  if (drawer.classList.contains('open')) renderCartDrawer();
}

function closeCartDrawer() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}

function renderCartDrawer() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const footer = document.getElementById('cartFooter');

  if (cart.length === 0) {
    container.innerHTML = '<div class="cust-cart-empty">' + t('cart.empty') + '</div>';
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';
  let total = 0;
  container.innerHTML = cart.map((c, idx) => {
    const item = resolveCartItem(c);
    if (!item) return '';
    const lineTotal = item.price * c.qty;
    total += lineTotal;
    const displayName = c.customLabel || item.name;
    return '<div class="cust-cart-item">' +
      '<div class="cust-cart-item-info">' +
        '<div class="cust-cart-item-name">' + displayName + '</div>' +
        '<div class="cust-cart-item-type">' + (c.type === 'svc' ? t('cart.service') : t('cart.supply')) + '</div>' +
      '</div>' +
      '<div class="cust-cart-qty">' +
        (c.custom
          ? '<span>' + c.qty + '</span>'
          : '<button onclick="updateCartQty(\'' + c.type + '\',\'' + c.id + '\',-1)">-</button>' +
            '<span>' + c.qty + '</span>' +
            '<button onclick="updateCartQty(\'' + c.type + '\',\'' + c.id + '\',1)">+</button>') +
      '</div>' +
      '<div class="cust-cart-item-price">' + fmt(lineTotal) + '</div>' +
      '<button class="cust-cart-item-remove" onclick="removeCartByIndex(' + idx + ')" title="Remove">&times;</button>' +
    '</div>';
  }).join('');
  totalEl.textContent = fmt(total);
}

function checkoutFromCart() {
  if (cart.length === 0) return;

  // Must be logged in
  if (!currentSession) {
    closeCartDrawer();
    openAuth();
    return;
  }

  // Pre-populate wizard service selection from cart
  orderServices = [];
  cart.forEach(c => {
    if (c.type === 'svc') {
      if (!orderServices.includes(c.id)) orderServices.push(c.id);
    }
  });

  closeCartDrawer();
  switchToDashboard();
  setTimeout(() => {
    const el = document.getElementById('custNewOrder');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 100);

  // Start at step 1 — user picks items, then services are pre-selected in step 2
  orderStep = 1;
  renderWizardSteps();
  renderWizardContent();
  renderWizardNav();

  showToast(t('cart.cartLoaded'));
}

// ══════════════════════════════════════════════════════════════
//  AI CHAT ENGINE
// ══════════════════════════════════════════════════════════════

let chatOpen = false;

function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chatPanel');
  const fab = document.getElementById('chatFab');
  panel.style.display = chatOpen ? 'flex' : 'none';
  fab.innerHTML = chatOpen ? '&times;' : '&#128172;';
  if (chatOpen) initChat();
}

function initChat() {
  const msgs = document.getElementById('chatMessages');
  if (msgs.children.length > 0) return; // already initialized
  addBotMessage(t('chat.greeting'));
  renderQuickReplies([t('chat.hours'), t('chat.showServices'), t('chat.trackOrder'), t('chat.stockQuestion')]);
}

function addBotMessage(text) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'cust-chat-msg bot';
  div.innerHTML = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addUserMessage(text) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'cust-chat-msg user';
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// Chat conversation history for AI context
let _chatHistory = [];

function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  addUserMessage(text);
  input.value = '';
  _chatHistory.push({ role: 'user', content: text });
  if (_chatHistory.length > 20) _chatHistory = _chatHistory.slice(-10);
  processUserInputAI(text);
}

function processUserInputAI(text) {
  // Try AI endpoint first, fall back to keyword matching
  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shop_slug: _CUST_PREFIX,
      message: text,
      history: _chatHistory.slice(-8)
    })
  })
  .then(function (r) { return r.ok ? r.json() : null; })
  .then(function (data) {
    if (data && data.reply) {
      addBotMessage(data.reply);
      _chatHistory.push({ role: 'assistant', content: data.reply });
      if (_chatHistory.length > 20) _chatHistory = _chatHistory.slice(-10);
    } else {
      processUserInputFallback(text);
    }
  })
  .catch(function () {
    processUserInputFallback(text);
  });
}

function matchesAny(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function processUserInputFallback(text) {
  const lower = text.toLowerCase();

  // Hours / schedule
  if (matchesAny(lower, ['hour', 'open', 'close', 'schedule', 'time', 'when'])) {
    const days = [1,2,3,4,5,6,0];
    const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    let hoursText = '<strong>Our Hours:</strong><br>';
    days.forEach((d, i) => {
      const hrs = shopHours[d];
      hoursText += dayNames[i] + ': ' + (hrs ? formatTime(hrs.start) + ' - ' + formatTime(hrs.end) : 'Closed') + '<br>';
    });
    addBotMessage(hoursText);
    renderQuickReplies(['Where are you located?', 'Show services', 'View cart']);
    return;
  }

  // Location / address / phone
  if (matchesAny(lower, ['location', 'address', 'where', 'direction', 'phone', 'call', 'contact'])) {
    addBotMessage('<strong>Location:</strong><br>123 Bragg Blvd, Fayetteville, NC 28301<br>&#128222; (555) 867-5309<br>&#9993; owner@ranger-beers.com');
    renderQuickReplies(['What are your hours?', 'Show services']);
    return;
  }

  // Track order
  if (matchesAny(lower, ['track', 'order status', 'my order', 'where is my'])) {
    addBotMessage('You can track your order by clicking <strong>Track My Order</strong> in the hero section. Enter your order number and phone number in the sign-in modal.');
    openAuth();
    renderQuickReplies(['Show services', 'What are your hours?']);
    return;
  }

  // Services overview
  if (matchesAny(lower, ['service', 'what do you do', 'what can you', 'categories', 'menu'])) {
    addBotMessage('<strong>Our Service Categories:</strong><br>' +
      '&#9997; <strong>Creation</strong> — Custom tapes & embroidery<br>' +
      '&#129525; <strong>Sewing</strong> — Attach patches, badges, rank<br>' +
      '&#9986; <strong>Removal</strong> — Strip & clean uniforms<br>' +
      '&#127873; <strong>Combos</strong> — Full setup bundles<br>' +
      '&#128207; <strong>Alteration</strong> — Hem, fit, reshape<br><br>' +
      '55 services total. Prices from $4 to $65.');
    renderQuickReplies(['OCP full setup', 'Name tape price', 'Show inventory']);
    return;
  }

  // View cart / checkout
  if (matchesAny(lower, ['cart', 'checkout', 'view cart', 'my cart'])) {
    toggleCartDrawer();
    addBotMessage('I\'ve opened your cart for you. You have <strong>' + cart.reduce((s,c) => s+c.qty, 0) + ' item(s)</strong> in your cart.');
    renderQuickReplies(['Show services', 'What are your hours?']);
    return;
  }

  // Inventory / stock
  if (matchesAny(lower, ['stock', 'inventory', 'supplies', 'what do you have', 'in stock', 'supply'])) {
    addBotMessage('We have <strong>35 items</strong> in stock across ' + invCategories.length + ' categories: ' + invCategories.join(', ') + '.<br><br>Check the <strong>Supplies & Inventory</strong> section to browse and add items to your cart.');
    switchToShop();
    renderQuickReplies(['Patches in stock', 'Badges available', 'Show services']);
    return;
  }

  // Add to cart intent
  if (matchesAny(lower, ['add', 'i want', 'i need', 'get me', 'buy', 'order a', 'order the'])) {
    const match = findBestMatch(lower);
    if (match) {
      addToCart(match.type, match.item.id);
      addBotMessage('Added <strong>' + match.item.name + '</strong> (' + fmt(match.item.price) + ') to your cart!');
      renderQuickReplies(['View cart', 'Add more items', 'Checkout']);
      return;
    }
  }

  // Search for specific items by keyword
  const match = findBestMatch(lower);
  if (match) {
    const item = match.item;
    const typeLabel = match.type === 'svc' ? 'Service' : 'Supply';
    addBotMessage('<strong>' + item.name + '</strong><br>' + typeLabel + ' — ' + fmt(item.price) +
      (match.type === 'inv' ? '<br>' + item.stock + ' in stock' : '<br>' + item.time) +
      '<br><br>Want me to add it to your cart?');
    renderQuickReplies(['Yes, add to cart', 'Show more options', 'No thanks']);
    // Store pending match for follow-up
    window._chatPendingMatch = match;
    return;
  }

  // Yes / confirm for pending match
  if (matchesAny(lower, ['yes', 'yeah', 'sure', 'yep', 'add it', 'please']) && window._chatPendingMatch) {
    const pm = window._chatPendingMatch;
    addToCart(pm.type, pm.item.id);
    addBotMessage('Added <strong>' + pm.item.name + '</strong> to your cart!');
    window._chatPendingMatch = null;
    renderQuickReplies(['View cart', 'Show services', 'Checkout']);
    return;
  }

  // Greeting
  if (matchesAny(lower, ['hi', 'hello', 'hey', 'sup', 'yo'])) {
    addBotMessage('Hey there! How can I help you today? You can ask about our services, hours, inventory, or track an order.');
    renderQuickReplies(['Show services', 'What are your hours?', 'Track my order']);
    return;
  }

  // Help
  if (matchesAny(lower, ['help', 'what can you'])) {
    addBotMessage('I can help you with:<br>' +
      '&#128337; <strong>Hours & location</strong><br>' +
      '&#128230; <strong>Browse services & inventory</strong><br>' +
      '&#128722; <strong>Add items to your cart</strong><br>' +
      '&#128270; <strong>Track your order</strong><br>' +
      '&#128176; <strong>Get prices</strong><br><br>' +
      'Just ask away!');
    renderQuickReplies(['Show services', 'What are your hours?', 'What do you have in stock?']);
    return;
  }

  // Fallback
  addBotMessage(t('chat.fallback'));
  renderQuickReplies([t('chat.showServices'), t('chat.hours'), t('chat.trackOrder'), 'Help']);
}

function findBestMatch(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;

  // Search services
  services.forEach(svc => {
    const nameWords = svc.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const tagWords = svc.tags.map(t => t.toLowerCase());
    let score = 0;
    words.forEach(w => {
      if (nameWords.some(nw => nw.includes(w) || w.includes(nw))) score++;
      if (tagWords.some(tw => tw.includes(w))) score += 0.5;
    });
    if (score >= 2 && score > bestScore) {
      bestScore = score;
      bestMatch = { type: 'svc', item: svc };
    }
  });

  // Search inventory
  storeInventory.forEach(inv => {
    const nameWords = inv.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    let score = 0;
    words.forEach(w => {
      if (nameWords.some(nw => nw.includes(w) || w.includes(nw))) score++;
    });
    if (score >= 2 && score > bestScore) {
      bestScore = score;
      bestMatch = { type: 'inv', item: inv };
    }
  });

  return bestMatch;
}

function renderQuickReplies(replies) {
  const container = document.getElementById('chatQuick');
  container.innerHTML = replies.map(r =>
    '<button class="cust-chat-quick-btn">' + r + '</button>'
  ).join('');
  container.querySelectorAll('.cust-chat-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addUserMessage(btn.textContent);
      setTimeout(() => processUserInput(btn.textContent), 300);
    });
  });
}

// ══════════════════════════════════════════════════════════════
//  SHOP CONFIG HYDRATION
// ══════════════════════════════════════════════════════════════

function applyShopConfig() {
  if (typeof shopConfig === 'undefined') return;
  const sc = shopConfig;

  // Page title
  if (sc.name) document.title = sc.name + ' — Military Uniform Alterations';

  // Brand name in nav
  const brandEl = document.querySelector('.cust-brand-name');
  if (brandEl && sc.name) brandEl.textContent = sc.name;

  // Priority support badge (Standard+ tiers)
  if (sc.tier && sc.tier !== 'tier3' && sc.tier !== 'basic') {
    var badge = document.createElement('span');
    badge.textContent = '\u2605 Priority Support';
    badge.style.cssText = 'display:inline-block;margin-left:10px;padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:var(--accent-blue,#c5b358);color:#1a1714;border-radius:20px;vertical-align:middle';
    if (brandEl) brandEl.parentNode.insertBefore(badge, brandEl.nextSibling);
  }

  // Contact card
  var cardName = document.getElementById('contactCardName');
  if (cardName && sc.name) cardName.textContent = sc.name;

  if (sc.address) {
    var mapsUrl = 'https://maps.google.com/maps?q=' + encodeURIComponent(sc.address);
    var cardAddr = document.getElementById('contactCardAddr');
    if (cardAddr) cardAddr.href = mapsUrl;
    var cardAddrText = document.getElementById('contactCardAddrText');
    if (cardAddrText) cardAddrText.textContent = sc.address;
    var dirBtn = document.getElementById('contactModalDirBtn');
    if (dirBtn) dirBtn.href = mapsUrl;
  }
  if (sc.phone) {
    const digits = sc.phone.replace(/\D/g, '');
    var cardPhone = document.getElementById('contactCardPhone');
    if (cardPhone) cardPhone.href = 'tel:' + digits;
    var cardPhoneText = document.getElementById('contactCardPhoneText');
    if (cardPhoneText) cardPhoneText.textContent = sc.phone;
    document.querySelectorAll('a[href^="tel:"]').forEach(a => {
      a.href = 'tel:' + digits;
    });
  }
  if (sc.email) {
    var cardEmail = document.getElementById('contactCardEmail');
    if (cardEmail) cardEmail.href = 'mailto:' + sc.email;
    var cardEmailText = document.getElementById('contactCardEmailText');
    if (cardEmailText) cardEmailText.textContent = sc.email;
  }

  // Social links — hide icons with no URL
  if (sc.socials) {
    var socialMap = { facebook: 'socialFacebook', instagram: 'socialInstagram', google: 'socialGoogle', yelp: 'socialYelp', tiktok: 'socialTiktok' };
    Object.keys(socialMap).forEach(function(key) {
      var el = document.getElementById(socialMap[key]);
      if (!el) return;
      if (sc.socials[key]) {
        el.href = sc.socials[key];
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
    // Also populate about page socials
    var aboutSocials = document.getElementById('aboutSocials');
    if (aboutSocials) {
      Object.keys(socialMap).forEach(function(key) {
        var el = aboutSocials.querySelector('#about' + key.charAt(0).toUpperCase() + key.slice(1));
        if (!el) return;
        if (sc.socials[key]) {
          el.href = sc.socials[key];
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      });
    }
  }

  // Hero title / subtitle
  const heroTitle = document.querySelector('.cust-hero-title');
  if (heroTitle && sc.heroTitle) heroTitle.innerHTML = sc.heroTitle;
  // Tier3: override hero title to remove ordering language
  if (_SHOP_TIER === 'tier3' && heroTitle) {
    heroTitle.textContent = sc.name || 'Welcome';
  }
  const heroSub = document.querySelector('.cust-hero-sub');
  if (heroSub && sc.tagline) heroSub.textContent = sc.tagline;

  // Location sidebar
  const locAddr = document.querySelector('.cust-location-addr');
  if (locAddr && sc.address) locAddr.innerHTML = sc.address.replace(', ', '<br>');
  const locDetails = document.querySelectorAll('.cust-location-detail');
  if (locDetails.length >= 1 && sc.phone) locDetails[0].innerHTML = '&#128222; ' + sc.phone;
  if (locDetails.length >= 2 && sc.email) locDetails[1].innerHTML = '&#9993; ' + sc.email;

  // Story section
  const storyEl = document.querySelector('.cust-story p');
  if (storyEl && sc.story) storyEl.textContent = sc.story;

  // Footer
  const footerEl = document.querySelector('.cust-footer p');
  if (footerEl && sc.name) footerEl.innerHTML = '&copy; 2026 ' + sc.name + '. All rights reserved.';

  // Chat widget header
  const chatHeader = document.querySelector('.cust-chat-header-title');
  if (chatHeader && sc.name) chatHeader.innerHTML = '&#9986; ' + sc.name + ' Assistant';

  // Trust signals
  if (sc.trustSignals) {
    const nums = document.querySelectorAll('.cust-trust-num');
    if (nums.length >= 4) {
      if (sc.trustSignals.orders) nums[0].textContent = sc.trustSignals.orders;
      if (sc.trustSignals.rating) nums[3].innerHTML = sc.trustSignals.rating + '&#9733;';
    }
  }

  // Theme colors
  if (sc.themeColors) {
    const root = document.documentElement.style;
    if (sc.themeColors.primary) root.setProperty('--accent-purple', sc.themeColors.primary);
    if (sc.themeColors.secondary) root.setProperty('--bg-deep', sc.themeColors.secondary);
    if (sc.themeColors.accent) root.setProperty('--accent-yellow', sc.themeColors.accent);
  }
}

// ── About Us Page ────────────────────────────────────────────
function renderAboutPage() {
  var cfg = _getShopCfg();
  var nameEl = document.getElementById('aboutShopName');
  if (nameEl) nameEl.textContent = cfg.name || 'SewReady';

  var estEl = document.getElementById('aboutEst');
  if (estEl && cfg.established) {
    estEl.textContent = 'Est. ' + cfg.established;
    estEl.style.display = '';
  }

  var storyEl = document.getElementById('aboutStory');
  if (storyEl) storyEl.textContent = cfg.story || '';

  var ownerEl = document.getElementById('aboutOwner');
  var ownerSection = document.getElementById('aboutOwnerSection');
  if (ownerEl && cfg.owner) {
    ownerEl.textContent = cfg.owner;
  } else if (ownerSection) {
    ownerSection.style.display = 'none';
  }

  // Hours
  var hoursList = document.getElementById('aboutHours');
  if (hoursList && typeof shopHours !== 'undefined') {
    var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var html = '';
    for (var d = 0; d < 7; d++) {
      var h = shopHours[d];
      if (h && h.start && h.end) {
        html += '<li><span class="day">' + dayNames[d] + '</span><span class="hours">' + formatTime(h.start) + ' - ' + formatTime(h.end) + '</span></li>';
      } else {
        html += '<li class="closed"><span class="day">' + dayNames[d] + '</span><span class="hours">Closed</span></li>';
      }
    }
    hoursList.innerHTML = html;
  }

  // Location
  if (cfg.address) {
    var mapsUrl = 'https://maps.google.com/maps?q=' + encodeURIComponent(cfg.address);
    var addrEl = document.getElementById('aboutAddr');
    if (addrEl) { addrEl.textContent = cfg.address; addrEl.href = mapsUrl; }
    var mapEmbed = document.getElementById('aboutMapEmbed');
    if (mapEmbed) {
      mapEmbed.innerHTML = '<iframe width="100%" height="250" frameborder="0" style="border:0;border-radius:12px" loading="lazy" allowfullscreen ' +
        'src="https://maps.google.com/maps?q=' + encodeURIComponent(cfg.address) + '&output=embed"></iframe>';
    }
  }

  // Contact
  if (cfg.phone) {
    var digits = cfg.phone.replace(/\D/g, '');
    var phoneEl = document.getElementById('aboutPhone');
    if (phoneEl) { phoneEl.textContent = cfg.phone; phoneEl.href = 'tel:' + digits; }
  }
  if (cfg.email) {
    var emailEl = document.getElementById('aboutEmail');
    if (emailEl) { emailEl.textContent = cfg.email; emailEl.href = 'mailto:' + cfg.email; }
  }

  // Socials (populated by applyShopConfig socials block)
}

// ══════════════════════════════════════════════════════════════
//  INIT
// ── Helper to get shop config safely ─────────────────────────
function _getShopCfg() {
  if (typeof shopConfig !== 'undefined') return shopConfig;
  if (typeof DataStore !== 'undefined') return DataStore.getShopConfig();
  return { name: 'SewReady', address: '', phone: '', email: '', tagline: '' };
}

// ── Contact Form Submission ──────────────────────────────────
function submitContactForm() {
  var name = document.getElementById('cfName').value.trim();
  var phone = document.getElementById('cfPhone').value.trim();
  var email = document.getElementById('cfEmail').value.trim();
  var message = document.getElementById('cfMessage').value.trim();
  var btn = document.getElementById('cfSubmitBtn');

  if (!name || !message) {
    showToast('Please enter your name and message.');
    return;
  }

  var slug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'sewready';

  btn.disabled = true;
  btn.textContent = 'Sending...';

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_slug: slug, name: name, phone: phone, email: email, message: message })
  })
  .then(function(r) { return r.json(); })
  .then(function(res) {
    if (res.ok) {
      showToast('Message sent! We\'ll get back to you soon.');
      document.getElementById('cfName').value = '';
      document.getElementById('cfPhone').value = '';
      document.getElementById('cfEmail').value = '';
      document.getElementById('cfMessage').value = '';
    } else {
      showToast(res.error || 'Failed to send message. Please call us instead.');
    }
  })
  .catch(function() {
    showToast('Failed to send message. Please call us instead.');
  })
  .finally(function() {
    btn.disabled = false;
    btn.textContent = 'Send Message';
  });
}

// ── Google Maps Embed ────────────────────────────────────────
function renderGoogleMapsEmbed() {
  var cfg = _getShopCfg();
  var addr = cfg.address || '';
  var container = document.getElementById('shopMapEmbed');
  if (!container || !addr) return;
  container.innerHTML =
    '<iframe width="100%" height="300" frameborder="0" style="border:0;border-radius:12px" loading="lazy" allowfullscreen ' +
    'src="https://maps.google.com/maps?q=' + encodeURIComponent(addr) + '&output=embed"></iframe>';
}

// ── SEO: JSON-LD Structured Data ─────────────────────────────
function injectSEOMetadata() {
  var cfg = _getShopCfg();
  if (!cfg.name) return;

  // Open Graph tags
  var ogTags = {
    'og:title': cfg.name + ' — SewReady',
    'og:description': cfg.tagline || 'Professional uniform alterations & embroidery',
    'og:type': 'business.business'
  };
  Object.keys(ogTags).forEach(function(prop) {
    if (!document.querySelector('meta[property="' + prop + '"]')) {
      var meta = document.createElement('meta');
      meta.setAttribute('property', prop);
      meta.setAttribute('content', ogTags[prop]);
      document.head.appendChild(meta);
    }
  });

  // Meta description
  if (cfg.tagline && !document.querySelector('meta[name="description"]')) {
    var desc = document.createElement('meta');
    desc.name = 'description';
    desc.content = cfg.tagline;
    document.head.appendChild(desc);
  }

  // JSON-LD LocalBusiness schema
  var hours = cfg.shopHours || {};
  var dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var openingHours = [];
  for (var d = 0; d < 7; d++) {
    var h = hours[d];
    if (h && h.start && h.end) {
      openingHours.push(dayMap[d].slice(0, 2) + ' ' + h.start + '-' + h.end);
    }
  }

  var ld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': cfg.name,
    'description': cfg.tagline || '',
    'address': cfg.address || '',
    'telephone': cfg.phone || '',
    'email': cfg.email || ''
  };
  if (openingHours.length) ld.openingHours = openingHours;

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);

  // FAQ Schema for search engines
  if (typeof shopConfig !== 'undefined') {
    var faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Do you do military uniform alterations?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, we specialize in AR 670-1 compliant military uniform alterations including name tapes, rank insignia, unit patches, and more.' }},
        { '@type': 'Question', name: 'How long do alterations take?', acceptedAnswer: { '@type': 'Answer', text: 'Most uniform alterations are completed same-day or within 24 hours. Rush service is available.' }},
        { '@type': 'Question', name: 'Do you offer online ordering?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, you can place orders directly through our website and track your order status in real-time.' }}
      ]
    };
    var faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(faqScript);
  }
}

// ── Pickup Modal Logic ──────────────────────────────────────
window.openPickupModal = function() {
  document.getElementById('pickupOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.closePickupModal = function() {
  document.getElementById('pickupOverlay').style.display = 'none';
  document.body.style.overflow = '';
};

window.submitPickupRequest = function() {
  const name = document.getElementById('pickupName').value.trim();
  const phone = document.getElementById('pickupPhone').value.trim();
  const addr = document.getElementById('pickupAddr').value.trim();
  const items = document.getElementById('pickupItems').value.trim();
  const time = document.getElementById('pickupTime').value;

  if (!name || !phone || !addr || !items) {
    showToast('Please fill in all fields');
    return;
  }

  // Add to DataStore (Simulated)
  if (typeof DataStore !== 'undefined') {
    DataStore.addNotification({
      type: 'dropoff',
      title: 'New Pickup Request',
      body: name + ' requested pickup at ' + addr,
      time: Date.now()
    });
  }

  showToast('Pickup requested! A driver will contact you shortly.');
  
  // Close modal and reset
  closePickupModal();
  document.getElementById('pickupName').value = '';
  document.getElementById('pickupPhone').value = '';
  document.getElementById('pickupAddr').value = '';
  document.getElementById('pickupItems').value = '';
};

// ══════════════════════════════════════════════════════════════
//  EDITORIAL GALLERY (Tier 3)
// ══════════════════════════════════════════════════════════════

function renderWorkGallery() {
  var grid = document.getElementById('workGallery');
  if (!grid || typeof svcImages === 'undefined') return;

  var accent = '#c5b358';
  if (typeof shopConfig !== 'undefined' && shopConfig.themeColors) {
    accent = shopConfig.themeColors.accent || shopConfig.themeColors.primary || accent;
  }

  // 032c-style: alternating image blocks + solid-color stat text blocks
  // Each row is 2 columns — one image, one text block (alternating sides)
  var trustStats = [
    { num: '500+', label: 'Orders Completed', bg: accent },
    { num: 'AR 670-1', label: 'Compliant', bg: '#1a1a1a' },
    { num: '24hr', label: 'Rush Available', bg: '#c0392b' },
    { num: '4.9\u2605', label: 'Rating', bg: accent }
  ];

  // Override with shop trust signals if available
  if (typeof shopConfig !== 'undefined' && shopConfig.trustSignals) {
    if (shopConfig.trustSignals.orders) trustStats[0].num = shopConfig.trustSignals.orders;
    if (shopConfig.trustSignals.rating) trustStats[3].num = shopConfig.trustSignals.rating + '\u2605';
  }

  var galleryImages = [
    { id: 'SVC-014', label: 'Unit Patches' },
    { id: 'SVC-023', label: 'AGSU Tailoring' },
    { id: 'SVC-018', label: 'Ranger Tab' },
    { id: 'SVC-051', label: 'Dress Uniform' }
  ];

  var html = '';
  for (var i = 0; i < 4; i++) {
    var img = galleryImages[i];
    var stat = trustStats[i];
    var imgUrl = svcImages[img.id] || '';

    var imgBlock =
      '<div class="cust-work-card">' +
        '<img src="' + imgUrl + '" alt="' + img.label + '" loading="lazy">' +
        '<div class="cust-work-overlay">' +
          '<span class="cust-work-label">' + img.label + '</span>' +
        '</div>' +
      '</div>';

    var textBlock =
      '<div class="cust-work-textblock" style="background:' + stat.bg + '">' +
        '<span class="cust-work-textblock-num">' + stat.num + '</span>' +
        '<span class="cust-work-textblock-label">' + stat.label + '</span>' +
      '</div>';

    // Alternate: even rows = image left / text right, odd rows = text left / image right
    if (i % 2 === 0) {
      html += imgBlock + textBlock;
    } else {
      html += textBlock + imgBlock;
    }
  }
  grid.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  applyShopConfig();

  // ── Storefront/Tier3: show polished landing with CTAs ──────
  if (_SHOP_TIER === 'storefront' || _SHOP_TIER === 'tier3') {
    var scfg = _getShopCfg();
    // Hide auth overlay, dashboard, order tracker, store inventory, cart
    var authOv = document.getElementById('authOverlay');
    if (authOv) authOv.style.display = 'none';
    var dashEl = document.getElementById('custDashboard');
    if (dashEl) dashEl.style.display = 'none';
    var trackerEl = document.getElementById('tracker');
    if (trackerEl) trackerEl.style.display = 'none';
    var invEl = document.getElementById('storeInventory');
    if (invEl) invEl.style.display = 'none';
    var cartBtn = document.querySelector('.cust-cart-btn');
    if (cartBtn) cartBtn.style.display = 'none';
    var navSignIn = document.getElementById('navSignIn');
    if (navSignIn) navSignIn.style.display = 'none';

    // Hide "Track", "Supplies", and "SHOP NOW" nav links
    document.querySelectorAll('.cust-nav-link').forEach(function(link) {
      var href = link.getAttribute('href') || '';
      var text = link.textContent.trim().toUpperCase();
      if (href === '#tracker' || href === '#storeInventory' || text === 'SHOP NOW') link.style.display = 'none';
    });

    // Hide "ONLINE ORDERS" banner
    var ordersBanner = document.querySelector('.cust-orders-banner');
    if (ordersBanner) ordersBanner.style.display = 'none';

    // Hide newsletter "10% off first order" section
    var newsletter = document.querySelector('.cust-newsletter');
    if (newsletter) newsletter.style.display = 'none';

    // Replace hero CTAs with Contact + Pickup buttons
    var heroCtaEl = document.querySelector('.cust-hero-ctas');
    if (heroCtaEl) {
      heroCtaEl.innerHTML =
        '<button class="cust-btn-primary" onclick="openContactModal()" style="font-size:16px;padding:14px 28px">&#128222; Contact Now</button>' +
        '<button class="cust-btn-editorial" onclick="document.getElementById(\'heroCal\').scrollIntoView({behavior:\'smooth\'})">&#128197; Store Hours</button>';
    }

    // Hide the separate "Contact Now" div below hero CTAs (already replaced above)
    var heroContent = document.querySelector('.cust-hero-content');
    if (heroContent) {
      var extraDiv = heroCtaEl.nextElementSibling;
      if (extraDiv && extraDiv.querySelector && extraDiv.querySelector('[onclick*="openContactModal"]')) {
        extraDiv.style.display = 'none';
      }
    }

    // (Contact link already in tier3 HTML nav — no duplicate needed)

    switchToLanding();
  } else {
    seedDemoAccounts();
    // Check for existing session
    const saved = localStorage.getItem(_ck('session'));
    if (saved) {
      currentSession = JSON.parse(saved);
      switchToDashboard();
    } else {
      switchToLanding();
    }
  }

  // Render landing page content
  renderPublicServices();
  if (_SHOP_TIER !== 'storefront' && _SHOP_TIER !== 'tier3') renderStoreInventory();
  renderBigCalendar();

  // Tier3 editorial: motto + gallery
  if (_SHOP_TIER === 'tier3') {
    // Inject motto
    var mottoEl = document.getElementById('heroMotto');
    if (mottoEl && typeof shopConfig !== 'undefined' && shopConfig.motto) {
      mottoEl.textContent = shopConfig.motto;
    } else if (mottoEl) {
      mottoEl.style.display = 'none';
    }
    // Render work gallery
    renderWorkGallery();

    // Scroll-reveal animations
    var revealEls = document.querySelectorAll('.cust-reveal, .cust-reveal-scale, .cust-reveal-stagger');
    if (revealEls.length && 'IntersectionObserver' in window) {
      var revealObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(function(el) { revealObs.observe(el); });
    } else {
      // Fallback: show everything
      revealEls.forEach(function(el) { el.classList.add('revealed'); });
    }
  }

  // Tier3: add calendar legend and subtitle
  if (_SHOP_TIER === 'tier3') {
    var calGrid = document.getElementById('bigcalGrid');
    if (calGrid && calGrid.parentNode) {
      var subtitle = document.createElement('div');
      subtitle.className = 'cust-bigcal-subtitle';
      subtitle.textContent = 'Tap a day to see hours & book by phone';
      calGrid.parentNode.insertBefore(subtitle, calGrid.nextSibling);

      var legend = document.createElement('div');
      legend.className = 'cust-bigcal-legend';
      legend.innerHTML =
        '<span class="cust-bigcal-legend-item"><span class="cust-bigcal-legend-dot leg-free"></span> Light</span>' +
        '<span class="cust-bigcal-legend-item"><span class="cust-bigcal-legend-dot leg-busy"></span> Moderate</span>' +
        '<span class="cust-bigcal-legend-item"><span class="cust-bigcal-legend-dot leg-full"></span> Busy</span>';
      subtitle.parentNode.insertBefore(legend, subtitle.nextSibling);
    }
  }

  renderTeam();
  renderShopHours();
  renderGallery();
  if (_SHOP_TIER !== 'storefront' && _SHOP_TIER !== 'tier3') updateCartBadge();

  // About page
  renderAboutPage();

  // Google Maps embed (all tiers)
  renderGoogleMapsEmbed();

  // SEO metadata (all tiers)
  injectSEOMetadata();

  // Big calendar nav buttons
  document.getElementById('bigcalPrev').addEventListener('click', bigcalPrevMonth);
  document.getElementById('bigcalNext').addEventListener('click', bigcalNextMonth);

  // Hamburger menu
  const hamburger = document.getElementById('custHamburger');
  const navLinks = document.getElementById('custNavLinks');
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

  // Close hamburger on link click
  navLinks.addEventListener('click', e => {
    if (e.target.matches('.cust-nav-link')) {
      navLinks.classList.remove('open');
    }
  });

  // Close hamburger on outside click
  document.addEventListener('click', e => {
    if (window.innerWidth <= 768 &&
        navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !hamburger.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('.cust-nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Close auth modal on overlay click
  document.getElementById('authOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAuth();
  });

  // Close customize modal on overlay click
  document.getElementById('customizeOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCustomize();
  });

  // Close contact modal on overlay click
  document.getElementById('contactOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeContactModal();
  });

  // Close about modal on overlay click
  var aboutOv = document.getElementById('aboutOverlay');
  if (aboutOv) {
    aboutOv.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeAboutModal();
    });
  }

  // Enter key handlers for auth forms
  document.getElementById('siPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') signIn();
  });
  document.getElementById('caPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') createAccount();
  });

  // Language change — re-render all dynamic content
  document.addEventListener('language-changed', () => {
    renderPublicServices();
    renderStoreInventory();
    renderBigCalendar();
    renderShopHours();
    if (currentSession) {
      renderWelcome();
      renderMyOrders();
      renderWizardSteps();
      renderWizardContent();
      renderWizardNav();
    }
  });

  // ── URL Param Handling (for demo iframe centering) ──────────
  var params = new URLSearchParams(window.location.search);

  // ?view=about — switch to About Us page (for Google Maps demo)
  if (params.get('view') === 'about') {
    _hideAllPages();
    var aboutEl = document.getElementById('custAboutPage');
    if (aboutEl) aboutEl.style.display = 'block';
    setTimeout(function() {
      var mapEl = document.getElementById('aboutMapEmbed');
      if (mapEl) window.scrollTo(0, mapEl.offsetTop - 20);
    }, 600);
  }

  // ?openContact=1 — open the contact card modal
  if (params.get('openContact') === '1') {
    setTimeout(function() { openContactModal(); }, 400);
  }

  // ?scroll=heroCal — scroll to the calendar/hours section
  if (params.get('scroll') === 'heroCal') {
    setTimeout(function() {
      var calEl = document.getElementById('heroCal');
      if (calEl) window.scrollTo(0, calEl.offsetTop);
    }, 600);
  }
});
