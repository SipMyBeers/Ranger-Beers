document.addEventListener('DOMContentLoaded', () => {

  // ── Tier Gating ────────────────────────────────────────────
  const _SHOP_TIER = (typeof shopConfig !== 'undefined' && shopConfig.tier) || 'full';

  // Storefront tier: show upgrade prompt
  if (_SHOP_TIER === 'storefront') {
    var main = document.querySelector('.main-content') || document.querySelector('main');
    if (main) {
      main.innerHTML =
        '<div style="max-width:480px;margin:80px auto;text-align:center;padding:32px">' +
          '<h2 style="margin-bottom:12px">Order Management Not Available</h2>' +
          '<p style="color:var(--text-muted)">This shop is on the <strong>Storefront</strong> plan.</p>' +
          '<p style="margin-top:16px"><a href="mailto:owner@ranger-beers.com" style="color:var(--accent)">Contact us to upgrade</a></p>' +
        '</div>';
    }
    return;
  }

  // ── Current employee (from auth system) ──
  const currentUser = (window.currentUser && window.currentUser.name) ? window.currentUser.name : 'Admin';

  // ── Customer Database (from DataStore) ─────────────────────
  const customers = DataStore.getCustomers();

  // ── Inventory / Shop Items (from storeInventory via data-store) ──
  const inventory = (typeof storeInventory !== 'undefined') ? storeInventory : DataStore.getInventory();

  // ── SOP References ─────────────────────────────────────────
  const sops = [
    { id: 'sop-1', title: 'OCP Top — Full Setup', category: 'ocp-top', time: '45 min', difficulty: 'medium', laborCost: 35.00 },
    { id: 'sop-2', title: 'OCP Top — Promotion Re-sew', category: 'ocp-top', time: '15 min', difficulty: 'easy', laborCost: 15.00 },
    { id: 'sop-3', title: 'OCP Bottom — Name Tape', category: 'ocp-bottom', time: '10 min', difficulty: 'easy', laborCost: 8.00 },
    { id: 'sop-4', title: 'AGSU Jacket — Awards & Badges', category: 'agsu', time: '60 min', difficulty: 'hard', laborCost: 50.00 },
    { id: 'sop-5', title: 'AGSU Trousers — Hemming', category: 'agsu', time: '25 min', difficulty: 'medium', laborCost: 20.00 },
    { id: 'sop-6', title: 'Ranger Bundle — Cat Eyes & Tab', category: 'ranger-bundle', time: '30 min', difficulty: 'medium', laborCost: 25.00 },
    { id: 'sop-7', title: 'Patrol Cap — Rank Insignia', category: 'patrol-cap', time: '10 min', difficulty: 'easy', laborCost: 8.00 },
    { id: 'sop-8', title: 'Patrol Cap — Full Setup', category: 'patrol-cap', time: '25 min', difficulty: 'medium', laborCost: 20.00 }
  ];

  const difficultyColors = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };

  // ── Item Images (from database / Wikimedia Commons) ──────
  const WK = 'https://upload.wikimedia.org/wikipedia/commons/';
  const itemImages = {
    'ocp-top': WK + '6/67/Operational_Camouflage_Pattern_2015.jpg',
    'ocp-bottom': WK + 'thumb/a/a1/OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg/500px-OCP_uniform_requirements_deadline_approaches_%286189972%29.jpeg',
    'agsu': WK + 'thumb/d/d1/Brigadier_General_Michael_B._Siegl_AGSU.jpg/500px-Brigadier_General_Michael_B._Siegl_AGSU.jpg',
    'patrol-cap': WK + 'thumb/0/02/220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg/500px-220827-A-AJ619-1002_-_Orient_Shield_22_begins_with_opening_ceremony.jpg',
    'ranger-bundle': WK + 'thumb/5/55/Ranger_Tab.svg/200px-Ranger_Tab.svg.png',
    'asu': WK + 'thumb/7/7e/U.S._Army_Reserve_Soldiers_in_Army_Service_Uniform_170725-A-TI382-0757.jpg/500px-U.S._Army_Reserve_Soldiers_in_Army_Service_Uniform_170725-A-TI382-0757.jpg',
    'custom': ''
  };

  // ── SOP References by uniform key ────────────────────────
  const sopRef = {
    'ocp-top': { title: 'OCP Top (ACU Coat)', reg: 'AR 670-1 / DA PAM 670-1, para 4-7' },
    'ocp-bottom': { title: 'OCP Bottom (ACU Trousers)', reg: 'DA PAM 670-1, para 4-7(b)' },
    'agsu': { title: 'AGSU Coat (Jacket)', reg: 'DA PAM 670-1, ch 4-10' },
    'patrol-cap': { title: 'Patrol Cap (OCP)', reg: 'AR 670-1, para 4-10(a)' },
    'ranger-bundle': { title: 'Ranger Bundle', reg: 'AR 670-1, para 21-18 / 21-30' },
    'asu': { title: 'ASU (Dress Blues)', reg: 'DA PAM 670-1, para 21-6 thru 21-31' }
  };

  // ── Service pricing lookup ───────────────────────────────
  const servicePrice = {
    'Rank Insignia': 8, 'Rank Insignia (new)': 8,
    'Name Tape': 5, 'Name Tape (keep)': 0, 'Name Tape (above right pocket)': 5,
    'US Army Tape': 5, 'US Army Tape (keep)': 0,
    'Unit Patch': 10, 'Unit Patch (keep)': 0,
    'Skill Badges': 10,
    'Cat Eyes': 6, 'IR Flag': 8, 'Ranger Tab': 10,
    'Awards Rack': 25
  };

  // ── Service detail lookup (for checklist accordion) ─────
  const serviceDetail = {
    'Rank Insignia': { desc: 'Remove old rank, sew new rank insignia per AR 670-1. Hook & loop or sew-on.', time: '10 min', tags: ['Insignia'] },
    'Rank Insignia (new)': { desc: 'Sew on new rank insignia. Position per DA PAM 670-1.', time: '10 min', tags: ['Insignia'] },
    'Name Tape': { desc: 'Sew name tape above right breast pocket. Regulation placement, matching thread.', time: '8 min', tags: ['Tape', 'OCP'] },
    'Name Tape (keep)': { desc: 'Existing name tape retained — no service needed.', time: '0 min', tags: ['Tape'] },
    'Name Tape (above right pocket)': { desc: 'Sew name tape above right breast pocket per regulation.', time: '8 min', tags: ['Tape'] },
    'US Army Tape': { desc: 'Sew US Army tape above left breast pocket. OCP Tan 499 or AGSU gold.', time: '8 min', tags: ['Tape'] },
    'US Army Tape (keep)': { desc: 'Existing US Army tape retained — no service needed.', time: '0 min', tags: ['Tape'] },
    'Unit Patch': { desc: 'Sew unit shoulder sleeve insignia (SSI) on left shoulder. 1/2" below shoulder seam.', time: '12 min', tags: ['Patch', 'SSI'] },
    'Unit Patch (keep)': { desc: 'Existing unit patch retained — no service needed.', time: '0 min', tags: ['Patch'] },
    'Skill Badges': { desc: 'Sew skill/qualification badges. Airborne, Air Assault, Pathfinder, etc. per AR 670-1 ch 22.', time: '15 min', tags: ['Badge'] },
    'Cat Eyes': { desc: 'Sew cat eye (luminous) band on rear of patrol cap. IR-reflective.', time: '8 min', tags: ['Patrol Cap'] },
    'IR Flag': { desc: 'Sew IR (infrared) US flag on right shoulder. Forward-facing per AR 670-1.', time: '10 min', tags: ['Flag', 'IR'] },
    'Ranger Tab': { desc: 'Sew Ranger tab above unit patch on left shoulder. 1/8" gap.', time: '10 min', tags: ['Tab', 'Ranger'] },
    'Awards Rack': { desc: 'Build and mount awards rack with ribbons, campaign stars, and devices per AR 670-1 ch 29.', time: '25 min', tags: ['Awards', 'Rack'] },
    'Waist Taper': { desc: 'Take in trouser waist for a fitted regulation appearance.', time: '20 min', tags: ['Alteration'] },
    'Hem': { desc: 'Hem trousers to regulation length. Slight break at front.', time: '20 min', tags: ['Alteration', 'Hemming'] }
  };

  // ── Order Data (from DataStore) ────────────────────────────
  const orders = DataStore.getOrders();

  // ── REMOVED: inline orders array — now sourced from DataStore ──
  // Compatibility shim: ensure orders have fields the detail panel expects
  orders.forEach(o => {
    if (!o.customerComment) o.customerComment = '';
    if (!o.photos) o.photos = [];
    if (!o.costs) o.costs = { labor: 0, materials: [] };
    if (!o.checklist) o.checklist = (o.modifications || []).map(m => ({ text: m, done: false, completedBy: null, completedAt: null }));
    // Backward-compat: materials may use unitPrice instead of price
    o.costs.materials.forEach(m => { if (m.unitPrice !== undefined && m.price === undefined) m.price = m.unitPrice; });
    if (o.pickupType && !o.pickupIcon) o.pickupIcon = o.pickupType;
    if (!o.pickup) o.pickup = o.pickupType === 'driver' ? 'SewReady Driver' : 'Customer Pickup';
    if (!o.deadlineLabel) {
      const d = new Date(o.deadline + 'T00:00:00');
      const today = new Date(2026, 2, 1);
      const diff = Math.round((d - today) / 86400000);
      if (diff <= 0) o.deadlineLabel = 'Due Today';
      else if (diff === 1) o.deadlineLabel = 'Due Tomorrow';
      else o.deadlineLabel = 'Due in ' + diff + ' Days';
    }
    // Sync progress/total from checklist
    o.progress = o.checklist.filter(c => c.done).length;
    o.total = o.checklist.length;
  });

  // NOTE: Original inline orders array removed — all data sourced from DataStore
  if (false) { void(0 /* placeholder for removed block
    {
      id: 'SR-001', customer: 'SGT Rodriguez', phone: '(555) 201-4488',
      uniform: 'OCP Top', uniformKey: 'ocp-top',
      modifications: ['Rank Insignia', 'Name Tape', 'US Army Tape', 'Unit Patch', 'Skill Badges'],
      deadline: '2026-03-02', deadlineLabel: 'Due Tomorrow', urgency: 'urgent',
      pickup: 'SewReady Driver', pickupIcon: 'driver', status: 'received',
      customerComment: 'Need this ASAP for promotion ceremony Monday. Rank is E-5. Please double-check the unit patch — it\'s 82nd Airborne, NOT 101st.',
      photos: ['OCP Top — before', 'Full setup layout'],
      costs: { labor: 35.00, materials: [
        { item: 'Rank Insignia — Hook & Loop', qty: 1, price: 8.00 },
        { item: 'Name Tape (OCP)', qty: 1, price: 5.00 },
        { item: 'US Army Tape (OCP)', qty: 1, price: 5.00 },
        { item: 'Unit Patch — 82nd Airborne', qty: 1, price: 12.00 },
        { item: 'Skill Badge — Airborne Wings', qty: 1, price: 14.00 }
      ]},
      checklist: [
        { text: 'Rank Insignia', done: true, completedBy: 'Maria S.', completedAt: '2026-02-28 3:15 PM' },
        { text: 'Name Tape', done: true, completedBy: 'Maria S.', completedAt: '2026-02-28 3:22 PM' },
        { text: 'US Army Tape', done: true, completedBy: 'Ana R.', completedAt: '2026-02-28 4:01 PM' },
        { text: 'Unit Patch', done: false, completedBy: null, completedAt: null },
        { text: 'Skill Badges', done: false, completedBy: null, completedAt: null }
      ],
      scheduledBlock: { date: '2026-03-02', startTime: '08:00', endTime: '08:45', employeeId: 'emp-1' }
    },
    {
      id: 'SR-002', customer: 'SPC Chen', phone: '(555) 339-7102',
      uniform: 'OCP Bottom', uniformKey: 'ocp-bottom',
      modifications: ['Name Tape (above right pocket)'],
      deadline: '2026-03-04', deadlineLabel: 'Due in 3 Days', urgency: 'on-track',
      pickup: 'Customer Pickup', pickupIcon: 'customer', status: 'in-progress',
      customerComment: 'Last name spelling is C-H-E-N. Picking up after 1400 on Tuesday.',
      photos: ['OCP Bottom — before', 'Name tape placement'],
      costs: { labor: 8.00, materials: [
        { item: 'Name Tape (OCP)', qty: 1, price: 5.00 }
      ]},
      checklist: [
        { text: 'Name Tape (above right pocket)', done: true, completedBy: 'Ana R.', completedAt: '2026-03-01 9:45 AM' }
      ],
      scheduledBlock: { date: '2026-03-04', startTime: '09:00', endTime: '09:10', employeeId: 'emp-2' }
    },
    {
      id: 'SR-003', customer: '1LT Adams', phone: '(555) 442-8830',
      uniform: 'Ranger Bundle', uniformKey: 'ranger-bundle',
      modifications: ['Cat Eyes', 'IR Flag', 'Ranger Tab'],
      deadline: '2026-03-03', deadlineLabel: 'Due in 2 Days', urgency: 'soon',
      pickup: 'SewReady Driver', pickupIcon: 'driver', status: 'received',
      customerComment: 'Ranger tab goes ABOVE the unit patch on left sleeve. IR flag is reverse (stars on right). Please call before driver pickup.',
      photos: ['Ranger items — before', 'Cat eyes / IR flag / tab'],
      costs: { labor: 25.00, materials: [
        { item: 'Cat Eyes Strip', qty: 1, price: 6.00 },
        { item: 'IR Flag (Reverse)', qty: 1, price: 15.00 },
        { item: 'Ranger Tab', qty: 1, price: 10.00 }
      ]},
      checklist: [
        { text: 'Cat Eyes', done: false, completedBy: null, completedAt: null },
        { text: 'IR Flag', done: false, completedBy: null, completedAt: null },
        { text: 'Ranger Tab', done: false, completedBy: null, completedAt: null }
      ],
      scheduledBlock: { date: '2026-03-03', startTime: '10:00', endTime: '10:30', employeeId: 'emp-3' }
    },
    {
      id: 'SR-004', customer: 'SSG Petrov', phone: '(555) 581-2269',
      uniform: 'AGSU', uniformKey: 'agsu',
      modifications: ['Awards Rack', 'Skill Badges', 'Rank Insignia'],
      deadline: '2026-03-06', deadlineLabel: 'Due in 5 Days', urgency: 'on-track',
      pickup: 'Customer Pickup', pickupIcon: 'customer', status: 'in-progress',
      customerComment: 'Awards rack order: Purple Heart first, then Bronze Star. Skill badge is Airborne Wings. Will pick up Saturday morning.',
      photos: ['AGSU jacket — before', 'Awards + badges layout'],
      costs: { labor: 50.00, materials: [
        { item: 'Awards Rack — Mounting', qty: 1, price: 20.00 },
        { item: 'Skill Badge — Airborne Wings', qty: 1, price: 14.00 },
        { item: 'Rank Insignia — Hook & Loop', qty: 1, price: 8.00 },
        { item: 'Purple Heart Medal', qty: 1, price: 25.00 },
        { item: 'Bronze Star Medal', qty: 1, price: 25.00 }
      ]},
      checklist: [
        { text: 'Awards Rack', done: true, completedBy: 'Maria S.', completedAt: '2026-02-28 11:30 AM' },
        { text: 'Skill Badges', done: false, completedBy: null, completedAt: null },
        { text: 'Rank Insignia', done: true, completedBy: 'Maria S.', completedAt: '2026-02-28 12:15 PM' }
      ],
      scheduledBlock: { date: '2026-03-06', startTime: '08:00', endTime: '09:00', employeeId: 'emp-1' }
    },
    {
      id: 'SR-005', customer: 'PFC Williams', phone: '(555) 773-0154',
      uniform: 'Patrol Cap', uniformKey: 'patrol-cap',
      modifications: ['Rank Insignia'],
      deadline: '2026-03-01', deadlineLabel: 'Due Today', urgency: 'urgent',
      pickup: 'Customer Pickup', pickupIcon: 'customer', status: 'ready',
      customerComment: 'Will pick up before 1700 today. Just the rank, nothing else.',
      photos: ['Patrol cap — before', 'Rank placement'],
      costs: { labor: 8.00, materials: [
        { item: 'Rank Insignia — Hook & Loop', qty: 1, price: 8.00 }
      ]},
      checklist: [
        { text: 'Rank Insignia', done: true, completedBy: 'Ana R.', completedAt: '2026-03-01 8:20 AM' }
      ],
      scheduledBlock: { date: '2026-03-01', startTime: '08:00', endTime: '08:10', employeeId: 'emp-2' }
    },
    {
      id: 'SR-006', customer: 'CPT Hayes', phone: '(555) 604-9917',
      uniform: 'OCP Top', uniformKey: 'ocp-top',
      modifications: ['Rank Insignia (new)', 'Name Tape (keep)', 'US Army Tape (keep)', 'Unit Patch (keep)'],
      deadline: '2026-03-05', deadlineLabel: 'Due in 4 Days', urgency: 'on-track',
      pickup: 'SewReady Driver', pickupIcon: 'driver', status: 'completed',
      customerComment: 'Promoted to CPT. Only the rank needs to change — leave everything else as-is. Driver can pick up anytime.',
      photos: ['OCP Top — promotion re-sew', 'New rank placement'],
      costs: { labor: 15.00, materials: [
        { item: 'Rank Insignia — Hook & Loop', qty: 1, price: 8.00 }
      ]},
      checklist: [
        { text: 'Rank Insignia (new)', done: true, completedBy: 'Maria S.', completedAt: '2026-02-27 2:00 PM' },
        { text: 'Name Tape (keep)', done: true, completedBy: 'Maria S.', completedAt: '2026-02-27 2:05 PM' },
        { text: 'US Army Tape (keep)', done: true, completedBy: 'Maria S.', completedAt: '2026-02-27 2:05 PM' },
        { text: 'Unit Patch (keep)', done: true, completedBy: 'Maria S.', completedAt: '2026-02-27 2:10 PM' }
      ],
      scheduledBlock: { date: '2026-03-05', startTime: '14:00', endTime: '14:15', employeeId: 'emp-1' }
    }
  */ ); }

  const statusLabels = { 'received': 'Received', 'in-progress': 'In Progress', 'ready': 'Ready for Pickup', 'completed': 'Completed' };
  const statusKeys = ['received', 'in-progress', 'ready', 'completed'];

  const tbody = document.getElementById('ordersBody');
  const searchInput = document.getElementById('orderSearch');
  const statusFilter = document.getElementById('statusFilter');
  const orderCount = document.getElementById('orderCount');
  const toastEl = document.getElementById('toast');

  let sortCol = null;
  let sortAsc = true;
  const expandedRows = new Set(); // accordion — multiple open

  // ── Helpers ────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg, duration) {
    duration = duration || 4000;
    toastEl.textContent = msg;
    toastEl.classList.add('toast-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('toast-show'), duration);
  }

  function sendCustomerNotification(order) {
    if (_SHOP_TIER !== 'full') {
      showToast('Upgrade to Full Shop for SMS & email notifications');
      return;
    }
    var shopCfg = DataStore.getShopConfig();
    showToast('Sending notification to ' + order.customer + '...');

    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_slug: (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'sewready',
        order_id: order.id,
        customer_phone: order.phone,
        customer_email: order.email,
        customer_name: order.customer,
        shop_name: shopCfg.name || 'SewReady',
        shop_phone: shopCfg.phone || '',
        type: order.status || 'ready'
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      var smsOk = res.results && res.results.sms && res.results.sms.status === 'sent';
      var emailOk = res.results && res.results.email && res.results.email.status === 'sent';
      var methods = [];
      if (smsOk) methods.push('SMS');
      if (emailOk) methods.push('Email');
      if (methods.length > 0) {
        showToast('Notified ' + order.customer + ' via ' + methods.join(' & '));
      } else {
        showToast('Notification queued for ' + order.customer);
      }
    })
    .catch(function () {
      showToast('Notified ' + order.customer + ' (queued offline)');
    });
  }

  function calcOrderTotal(order) {
    const matTotal = order.costs.materials.reduce((sum, m) => sum + m.qty * m.price, 0);
    return order.costs.labor + matTotal;
  }

  function fmt(n) { return '$' + n.toFixed(2); }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function showStatusDropdown(wrapEl, order) {
    const existing = document.querySelector('.status-dropdown');
    if (existing) { existing.remove(); return; }
    const dd = document.createElement('div');
    dd.className = 'status-dropdown';
    statusKeys.forEach(key => {
      const opt = document.createElement('div');
      opt.className = 'status-option' + (order.status === key ? ' current' : '');
      opt.innerHTML = '<span class="status-pill status-pill-' + key + '">' + statusLabels[key] + '</span>';
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const prev = order.status;
        DataStore.updateOrderStatus(order.id, key);
        if ((key === 'ready' || key === 'completed') && prev !== key && _SHOP_TIER === 'full') sendCustomerNotification(order);
        if (key === 'completed' && prev !== 'completed' && typeof printPickupReceipt === 'function') printPickupReceipt(order);
        dd.remove();
        render();
      });
      dd.appendChild(opt);
    });
    wrapEl.appendChild(dd);
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!wrapEl.contains(e.target)) { dd.remove(); document.removeEventListener('click', handler); }
      });
    }, 0);
  }

  // ── Render Table ──────────────────────────────────────────
  function render() {
    let filtered = orders.filter(o => {
      const q = searchInput.value.toLowerCase();
      const matchSearch = !q ||
        o.customer.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.uniform.toLowerCase().includes(q) ||
        o.customerComment.toLowerCase().includes(q);
      const matchStatus = statusFilter.value === 'all' || o.status === statusFilter.value;
      return matchSearch && matchStatus;
    });

    if (sortCol) {
      filtered.sort((a, b) => {
        let va, vb;
        switch (sortCol) {
          case 'order':    va = a.id; vb = b.id; break;
          case 'customer': va = a.customer; vb = b.customer; break;
          case 'uniform':  va = a.uniform; vb = b.uniform; break;
          case 'deadline': va = a.deadline; vb = b.deadline; break;
          case 'status':   va = a.status; vb = b.status; break;
          case 'total':    va = calcOrderTotal(a); vb = calcOrderTotal(b); break;
          default: return 0;
        }
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    orderCount.textContent = filtered.length + ' order' + (filtered.length !== 1 ? 's' : '');

    tbody.innerHTML = '';
    filtered.forEach(order => {
      const tr = document.createElement('tr');
      tr.className = 'order-row';
      tr.dataset.id = order.id;
      const isExpanded = expandedRows.has(order.id);
      if (isExpanded) tr.classList.add('expanded');

      const shortComment = order.customerComment.length > 50
        ? order.customerComment.substring(0, 50) + '...' : order.customerComment;

      const total = calcOrderTotal(order);
      const imgSrc = itemImages[order.uniformKey] || '';

      // Services with prices
      const svcCells = order.modifications.map(m => {
        const p = servicePrice[m];
        const priceStr = p != null && p > 0 ? '<span class="ord-svc-price">' + fmt(p) + '</span>'
          : p === 0 ? '<span class="ord-svc-price free">incl.</span>' : '';
        return '<div class="ord-svc-row"><span>' + m + '</span>' + priceStr + '</div>';
      }).join('');

      tr.innerHTML =
        '<td class="col-order"><span class="ord-id">' + order.id + '</span><span class="ord-expand">' + (isExpanded ? '\u25B2' : '\u25BC') + '</span></td>' +
        '<td class="col-customer">' +
          '<span class="customer-name-table">' + order.customer + '</span>' +
          '<span class="customer-phone-table">' + order.phone + '</span>' +
        '</td>' +
        '<td class="col-item">' +
          '<div class="ord-item-cell">' +
            (imgSrc ? '<img class="ord-item-thumb" src="' + imgSrc + '" alt="' + order.uniform + '" onerror="this.style.display=\'none\'">' : '') +
            '<span class="uniform-badge badge-' + order.uniformKey + '">' + order.uniform + '</span>' +
          '</div>' +
        '</td>' +
        '<td class="col-services"><div class="ord-services-list">' + svcCells + '</div></td>' +
        '<td class="col-comment" title="' + order.customerComment.replace(/"/g, '&quot;') + '">' +
          '<span class="comment-preview">' + shortComment + '</span>' +
        '</td>' +
        '<td class="col-pickup">' +
          '<div class="ord-pickup-info">' +
            '<span class="ord-pickup-date ' + order.urgency + '">' + formatDate(order.deadline) + '</span>' +
            '<span class="ord-pickup-method">' + order.pickup + '</span>' +
          '</div>' +
        '</td>' +
        '<td class="col-total"><strong>' + fmt(total) + '</strong></td>' +
        '<td class="col-status">' +
          '<div class="status-pill-wrap" data-id="' + order.id + '">' +
            '<span class="status-pill status-pill-' + order.status + '">' + statusLabels[order.status] + '</span>' +
          '</div>' +
        '</td>';

      tr.addEventListener('click', (e) => {
        if (e.target.closest('.status-pill-wrap')) return;
        toggleExpand(order.id);
      });

      tbody.appendChild(tr);

      // Status pill click → dropdown
      const pillWrap = tr.querySelector('.status-pill-wrap');
      pillWrap.addEventListener('click', (e) => {
        e.stopPropagation();
        showStatusDropdown(pillWrap, order);
      });

      // Detail panel (accordion — check Set)
      if (isExpanded) {
        const detailTr = document.createElement('tr');
        detailTr.className = 'detail-row';

        // Build a materials lookup: service name → materials used
        const matLookup = {};
        order.costs.materials.forEach(m => {
          // Try to match material to checklist item
          order.checklist.forEach(c => {
            const cLower = c.text.toLowerCase();
            const mLower = m.item.toLowerCase();
            if (mLower.includes(cLower.split(' ')[0].replace(/[()]/g, '')) || cLower.includes(mLower.split(' — ')[0].split(' (')[0].toLowerCase())) {
              if (!matLookup[c.text]) matLookup[c.text] = [];
              matLookup[c.text].push(m);
            }
          });
        });

        const checklistHtml = order.checklist.map((c, idx) => {
          const auditHtml = c.done && c.completedBy
            ? '<div class="chk-audit">Completed by <strong>' + c.completedBy + '</strong> on ' + c.completedAt + '</div>' : '';
          const p = servicePrice[c.text];
          const priceTag = p != null && p > 0 ? '<span class="chk-price">' + fmt(p) + '</span>'
            : p === 0 ? '<span class="chk-price free">incl.</span>' : '';
          // Materials for this service
          const mats = matLookup[c.text];
          const matHtml = mats && mats.length > 0
            ? '<div class="chk-materials">' + mats.map(m => '<span class="chk-mat">' + m.item + ' x' + m.qty + ' <em>' + fmt(m.qty * m.price) + '</em></span>').join('') + '</div>'
            : '';
          // Lookup full service details for accordion
          const svcMatch = serviceDetail[c.text];
          const detailHtml = svcMatch
            ? '<div class="chk-svc-detail">' +
                '<div class="chk-svc-desc">' + svcMatch.desc + '</div>' +
                '<div class="chk-svc-meta">' +
                  '<span class="chk-svc-time">&#9202; ' + svcMatch.time + '</span>' +
                  (svcMatch.tags ? svcMatch.tags.map(t => '<span class="chk-svc-tag">' + t + '</span>').join('') : '') +
                '</div>' +
              '</div>'
            : '';
          const hasDetails = matHtml || auditHtml || detailHtml;
          return '<div class="check-row' + (hasDetails ? ' chk-has-detail' : '') + '">' +
            '<div class="chk-top">' +
              '<label class="check-item">' +
                '<input type="checkbox" ' + (c.done ? 'checked' : '') + ' data-order="' + order.id + '" data-idx="' + idx + '">' +
                '<span class="check-text ' + (c.done ? 'check-done' : '') + '">' + c.text + '</span>' +
              '</label>' +
              '<div class="chk-top-right">' +
                priceTag +
                (hasDetails ? '<span class="chk-expand-arrow">&#9654;</span>' : '') +
              '</div>' +
            '</div>' +
            (hasDetails ? '<div class="chk-detail-body">' + detailHtml + matHtml + auditHtml + '</div>' : '') +
          '</div>';
        }).join('');

        const matTotal = order.costs.materials.reduce((sum, m) => sum + m.qty * m.price, 0);
        const costSummaryHtml =
          '<div class="chk-cost-summary">' +
            '<div class="chk-cost-row"><span>Materials</span><span>' + fmt(matTotal) + '</span></div>' +
            '<div class="chk-cost-row"><span>Labor</span><span>' + fmt(order.costs.labor) + '</span></div>' +
            '<div class="chk-cost-row chk-cost-total"><span>Order Total</span><span>' + fmt(total) + '</span></div>' +
          '</div>';

        // SOP reference
        const sop = sopRef[order.uniformKey];
        const sopHtml = sop
          ? '<h4 style="margin-top:14px">SOP Reference</h4>' +
            '<a href="sop-library.html" class="ord-sop-link">' +
              '<span class="ord-sop-icon">&#128214;</span>' +
              '<div class="ord-sop-text"><strong>' + sop.title + '</strong><span>' + sop.reg + '</span></div>' +
            '</a>'
          : '';

        // Before / After photos from database
        const photoSrc = itemImages[order.uniformKey] || '';
        const photosHtml = photoSrc
          ? '<div class="ord-before-after">' +
              '<div class="ord-photo-card">' +
                '<div class="ord-photo-label">Before</div>' +
                '<img src="' + photoSrc + '" alt="Before" class="ord-photo-img" onerror="this.parentElement.classList.add(\'ord-photo-err\')">' +
              '</div>' +
              '<div class="ord-photo-card">' +
                '<div class="ord-photo-label ord-photo-label-after">After (Reference)</div>' +
                '<img src="' + photoSrc + '" alt="After" class="ord-photo-img" onerror="this.parentElement.classList.add(\'ord-photo-err\')">' +
              '</div>' +
            '</div>'
          : '<div class="detail-photos">' +
              '<div class="img-placeholder"><span class="img-label">Before</span></div>' +
              '<div class="img-placeholder"><span class="img-label">After</span></div>' +
            '</div>';

        detailTr.innerHTML =
          '<td colspan="8">' +
            '<div class="detail-panel detail-panel-v2">' +
              '<div class="detail-col detail-col-photos">' +
                '<h4>Item Photos</h4>' +
                photosHtml +
              '</div>' +
              '<div class="detail-col detail-col-checklist">' +
                '<h4>Service Checklist</h4>' +
                '<div class="checklist-audit">' + checklistHtml + '</div>' +
                costSummaryHtml +
              '</div>' +
              '<div class="detail-col detail-col-info">' +
                '<h4>Customer Comment</h4>' +
                '<div class="customer-comment-bubble">' + order.customerComment + '</div>' +
                sopHtml +
                '<h4 style="margin-top:14px">Order Info</h4>' +
                '<div class="detail-meta">' +
                  '<div><strong>Order:</strong> ' + order.id + '</div>' +
                  '<div><strong>Phone:</strong> ' + order.phone + '</div>' +
                  '<div><strong>Pickup Date:</strong> ' + formatDate(order.deadline) + '</div>' +
                  '<div><strong>Pickup:</strong> ' + order.pickup + '</div>' +
                '</div>' +
                '<div class="detail-print-actions" style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">' +
                  '<button class="btn-print-receipt" data-id="' + order.id + '" style="padding:6px 14px;font-size:12px;background:var(--accent,#a855f7);color:#fff;border:none;border-radius:6px;cursor:pointer">&#128424; Receipt</button>' +
                  '<button class="btn-print-label" data-id="' + order.id + '" style="padding:6px 14px;font-size:12px;background:var(--border,rgba(240,232,220,.08));color:var(--text,#f0e8dc);border:none;border-radius:6px;cursor:pointer">&#127991; Label</button>' +
                '</div>' +
                // Driver assignment panel
                '<div class="detail-driver-panel" data-order="' + order.id + '" style="margin-top:16px;padding:12px;border-radius:8px;background:rgba(168,85,247,0.04);border:1px solid rgba(168,85,247,0.1)">' +
                  '<h4 style="margin:0 0 8px;font-size:13px">&#128666; Driver Assignment</h4>' +
                  '<div class="driver-assignment-content" id="driverPanel-' + order.id + '"><span style="color:rgba(240,232,220,0.4);font-size:12px">Loading...</span></div>' +
                '</div>' +
                // Photo grid
                '<div class="detail-photo-grid" style="margin-top:16px">' +
                  '<h4 style="margin:0 0 8px;font-size:13px">&#128247; Order Photos</h4>' +
                  '<div class="photo-grid-content" id="photoGrid-' + order.id + '"><span style="color:rgba(240,232,220,0.4);font-size:12px">Loading...</span></div>' +
                '</div>' +
                // Audit trail
                '<div class="detail-audit" style="margin-top:16px">' +
                  '<h4 style="margin:0 0 8px;font-size:13px">&#128221; Activity</h4>' +
                  '<div class="audit-content" id="auditTrail-' + order.id + '"><span style="color:rgba(240,232,220,0.4);font-size:12px">Loading...</span></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</td>';

        tbody.appendChild(detailTr);

        // Accordion toggles for checklist items
        detailTr.querySelectorAll('.chk-has-detail .chk-top').forEach(topEl => {
          topEl.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT') return; // don't toggle when checking box
            e.stopPropagation();
            const row = topEl.closest('.check-row');
            row.classList.toggle('chk-open');
          });
        });

        detailTr.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.addEventListener('change', (e) => {
            e.stopPropagation();
            const orderId = cb.dataset.order;
            const idx = parseInt(cb.dataset.idx, 10);
            const ord = orders.find(o => o.id === orderId);
            const item = ord.checklist[idx];
            const now = new Date();
            const timeStr = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
              + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            if (cb.checked) { item.done = true; item.completedBy = currentUser; item.completedAt = timeStr; }
            else { item.done = false; item.completedBy = currentUser + ' (unchecked)'; item.completedAt = timeStr; }
            DataStore.updateOrder(orderId, { checklist: ord.checklist });
            render();
          });
        });

        // Load driver assignment, photos, audit for expanded order
        loadDriverPanel(order.id);
        loadPhotoGrid(order.id);
        loadAuditTrail(order.id);

        // Print buttons
        detailTr.querySelectorAll('.btn-print-receipt').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            var ord = orders.find(o => o.id === btn.dataset.id);
            if (ord && typeof printPickupReceipt === 'function') {
              if (ord.status === 'completed') printPickupReceipt(ord);
              else printDropoffReceipt(ord);
            }
          });
        });
        detailTr.querySelectorAll('.btn-print-label').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            var ord = orders.find(o => o.id === btn.dataset.id);
            if (ord && typeof printOrderLabel === 'function') printOrderLabel(ord);
          });
        });
      }
    });
  }

  // ── Driver Assignment Panel ──────────────────────────────
  function loadDriverPanel(orderId) {
    var panel = document.getElementById('driverPanel-' + orderId);
    if (!panel) return;
    DataStore.getDriverAssignments(orderId).then(function (assignments) {
      DataStore.getDrivers().then(function (drivers) {
        if (assignments.length > 0) {
          var a = assignments[0];
          var statusSteps = ['pending', 'assigned', 'en-route', 'picked-up', 'delivered'];
          var timeline = statusSteps.map(function (s) {
            var active = statusSteps.indexOf(a.status) >= statusSteps.indexOf(s);
            return '<span style="padding:3px 8px;border-radius:4px;font-size:11px;' +
              (active ? 'background:rgba(168,85,247,0.2);color:#a855f7;font-weight:600' : 'background:rgba(240,232,220,0.04);color:rgba(240,232,220,0.3)') +
              '">' + s + '</span>';
          }).join(' &#8250; ');

          panel.innerHTML = '<div style="margin-bottom:8px">' + timeline + '</div>' +
            '<div style="font-size:12px;color:rgba(240,232,220,0.6)">' +
              (a.driver_name ? 'Driver: <strong>' + a.driver_name + '</strong>' : 'No driver assigned') +
              (a.scheduled_date ? ' &middot; ' + a.scheduled_date : '') +
            '</div>' +
            '<div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap">' +
              statusSteps.filter(function (s) { return statusSteps.indexOf(s) > statusSteps.indexOf(a.status); }).map(function (s) {
                return '<button class="driver-status-btn" data-assignment="' + a.id + '" data-status="' + s + '" style="padding:3px 10px;font-size:11px;border:1px solid rgba(168,85,247,0.2);background:none;color:#a855f7;border-radius:4px;cursor:pointer">' + s + '</button>';
              }).join('') +
            '</div>';

          // Bind status update buttons
          panel.querySelectorAll('.driver-status-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
              e.stopPropagation();
              DataStore.updateDriverAssignment(btn.dataset.assignment, { status: btn.dataset.status, shop_slug: DataStore.getShopConfig().slug || '' });
              setTimeout(function () { loadDriverPanel(orderId); }, 500);
            });
          });
        } else {
          // No assignment — show create form
          var driverOpts = drivers.filter(function (d) { return d.active; }).map(function (d) {
            return '<option value="' + d.id + '">' + d.name + '</option>';
          }).join('');
          panel.innerHTML = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<select id="driverSelect-' + orderId + '" style="padding:4px 8px;border-radius:4px;border:1px solid rgba(240,232,220,0.1);background:rgba(240,232,220,0.06);color:#f0e8dc;font-size:12px">' +
              '<option value="">Select driver...</option>' + driverOpts +
            '</select>' +
            '<button class="assign-driver-btn" data-order="' + orderId + '" style="padding:4px 12px;font-size:12px;background:#a855f7;color:#fff;border:none;border-radius:4px;cursor:pointer">Assign</button>' +
          '</div>';

          panel.querySelector('.assign-driver-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            var sel = document.getElementById('driverSelect-' + orderId);
            if (!sel || !sel.value) return;
            DataStore.createDriverAssignment({ order_id: orderId, driver_id: sel.value });
            setTimeout(function () { loadDriverPanel(orderId); }, 500);
          });
        }
      });
    });
  }

  // ── Photo Grid ─────────────────────────────────────────
  function loadPhotoGrid(orderId) {
    var grid = document.getElementById('photoGrid-' + orderId);
    if (!grid) return;
    DataStore.getPhotos(orderId).then(function (photos) {
      if (photos.length === 0) {
        grid.innerHTML = '<span style="color:rgba(240,232,220,0.4);font-size:12px">No photos uploaded</span>';
        return;
      }
      grid.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        photos.map(function (p) {
          return '<div style="position:relative">' +
            '<img src="' + p.url + '" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid rgba(240,232,220,0.1)" loading="lazy">' +
            '<button class="delete-photo-btn" data-photo="' + p.id + '" style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#e74c3c;color:#fff;border:none;font-size:10px;cursor:pointer;line-height:18px">&times;</button>' +
          '</div>';
        }).join('') +
      '</div>';
      grid.querySelectorAll('.delete-photo-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          DataStore.deletePhoto(btn.dataset.photo);
          setTimeout(function () { loadPhotoGrid(orderId); }, 500);
        });
      });
    });
  }

  // ── Audit Trail ────────────────────────────────────────
  function loadAuditTrail(orderId) {
    var trail = document.getElementById('auditTrail-' + orderId);
    if (!trail) return;
    DataStore.getAuditLog('order', orderId).then(function (entries) {
      if (entries.length === 0) {
        trail.innerHTML = '<span style="color:rgba(240,232,220,0.4);font-size:12px">No activity recorded</span>';
        return;
      }
      trail.innerHTML = entries.slice(0, 10).map(function (e) {
        return '<div style="font-size:11px;color:rgba(240,232,220,0.5);padding:3px 0;border-bottom:1px solid rgba(240,232,220,0.04)">' +
          '<strong>' + (e.user_name || 'System') + '</strong> ' + e.action +
          (e.new_value ? ' → ' + e.new_value : '') +
          '<span style="float:right;font-size:10px">' + (e.created_at || '').slice(0, 16) + '</span>' +
        '</div>';
      }).join('');
    });
  }

  function toggleExpand(id) {
    if (expandedRows.has(id)) expandedRows.delete(id);
    else expandedRows.add(id);
    render();
  }

  // ── Sorting ───────────────────────────────────────────────
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (sortCol === col) sortAsc = !sortAsc;
      else { sortCol = col; sortAsc = true; }
      document.querySelectorAll('.sortable').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(sortAsc ? 'sort-asc' : 'sort-desc');
      render();
    });
  });

  searchInput.addEventListener('input', render);
  statusFilter.addEventListener('change', render);

  // ══════════════════════════════════════════════════════════
  //  NEW ORDER MODAL
  // ══════════════════════════════════════════════════════════

  const newOrderBtn = document.getElementById('newOrderBtn');
  const newOrderOverlay = document.getElementById('newOrderOverlay');
  const newOrderClose = document.getElementById('newOrderClose');

  // State
  let newOrderStep = 1;
  let selectedCustomer = null;
  let selectedSop = null;
  let selectedItems = []; // { invItem, qty }
  let newOrderPickup = 'customer';
  let newOrderDeadline = '';
  let newOrderComment = '';
  let selectedEmployee = null;
  let selectedScheduleDate = null;
  let selectedScheduleStart = null;
  let schedCalMonth = 2; // March (0-indexed)
  let schedCalYear = 2026;

  newOrderBtn.addEventListener('click', () => {
    newOrderStep = 1;
    selectedCustomer = null;
    selectedSop = null;
    selectedItems = [];
    newOrderPickup = 'customer';
    newOrderDeadline = '';
    newOrderComment = '';
    selectedEmployee = null;
    selectedScheduleDate = null;
    selectedScheduleStart = null;
    schedCalMonth = 2;
    schedCalYear = 2026;
    newOrderOverlay.classList.add('open');
    renderNewOrderStep();
  });

  newOrderClose.addEventListener('click', () => newOrderOverlay.classList.remove('open'));
  newOrderOverlay.addEventListener('click', (e) => {
    if (e.target === newOrderOverlay) newOrderOverlay.classList.remove('open');
  });

  function renderNewOrderStep() {
    const content = document.getElementById('newOrderContent');
    const stepDots = document.querySelectorAll('.no-step');
    stepDots.forEach((dot, i) => {
      dot.classList.toggle('active', i < newOrderStep);
      dot.classList.toggle('current', i + 1 === newOrderStep);
    });

    if (newOrderStep === 1) renderStep1(content);
    else if (newOrderStep === 2) renderStep2(content);
    else if (newOrderStep === 3) renderStep3(content);
    else if (newOrderStep === 4) renderStep4(content);
  }

  // ── Step 1: Customer ──────────────────────────────────────
  function renderStep1(el) {
    let custHtml = customers.map(c =>
      '<div class="no-cust-item' + (selectedCustomer && selectedCustomer.id === c.id ? ' selected' : '') + '" data-id="' + c.id + '">' +
        '<div class="no-cust-info">' +
          '<strong>' + c.name + '</strong>' +
          '<span>' + c.phone + ' &middot; ' + c.unit + '</span>' +
        '</div>' +
        '<span class="no-cust-rank">' + c.rank + '</span>' +
      '</div>'
    ).join('');

    el.innerHTML =
      '<h3>Step 1: Select or Create Customer</h3>' +
      '<input type="text" class="dropoff-search" id="noCustSearch" placeholder="Search by name, phone, or unit...">' +
      '<div class="no-cust-list" id="noCustList">' + custHtml + '</div>' +
      '<div class="no-divider"><span>or create new</span></div>' +
      '<div class="no-new-cust" id="noNewCust">' +
        '<div class="no-new-cust-grid">' +
          '<div class="form-group"><label>Rank</label><input type="text" id="ncRank" placeholder="e.g. SGT"></div>' +
          '<div class="form-group"><label>Full Name</label><input type="text" id="ncName" placeholder="e.g. SGT Johnson"></div>' +
          '<div class="form-group"><label>Phone</label><input type="text" id="ncPhone" placeholder="(555) 000-0000"></div>' +
          '<div class="form-group"><label>Email</label><input type="text" id="ncEmail" placeholder="name@army.mil"></div>' +
          '<div class="form-group"><label>Unit</label><input type="text" id="ncUnit" placeholder="e.g. 82nd Airborne"></div>' +
          '<button class="btn-primary no-create-btn" id="ncCreateBtn">Create Customer</button>' +
        '</div>' +
      '</div>' +
      '<div class="no-nav">' +
        '<div></div>' +
        '<button class="btn-primary no-next-btn" id="noNext1"' + (!selectedCustomer ? ' disabled' : '') + '>Next: Select Service</button>' +
      '</div>';

    // Search
    document.getElementById('noCustSearch').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.no-cust-item').forEach(item => {
        const c = customers.find(c => c.id === item.dataset.id);
        const match = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.unit.toLowerCase().includes(q);
        item.style.display = match ? '' : 'none';
      });
    });

    // Select customer
    document.querySelectorAll('.no-cust-item').forEach(item => {
      item.addEventListener('click', () => {
        selectedCustomer = customers.find(c => c.id === item.dataset.id);
        document.querySelectorAll('.no-cust-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        document.getElementById('noNext1').disabled = false;
      });
    });

    // Create new customer
    document.getElementById('ncCreateBtn').addEventListener('click', () => {
      const rank = document.getElementById('ncRank').value.trim();
      const name = document.getElementById('ncName').value.trim();
      const phone = document.getElementById('ncPhone').value.trim();
      const email = document.getElementById('ncEmail').value.trim();
      const unit = document.getElementById('ncUnit').value.trim();
      if (!name || !phone) { showToast('Name and phone are required'); return; }
      const newCust = DataStore.addCustomer({ name: name, rank: rank, phone: phone, email: email, unit: unit });
      selectedCustomer = newCust;
      showToast('Customer ' + name + ' created');
      renderNewOrderStep();
    });

    document.getElementById('noNext1').addEventListener('click', () => {
      if (!selectedCustomer) return;
      newOrderStep = 2;
      renderNewOrderStep();
    });
  }

  // ── Step 2: SOP / Service ─────────────────────────────────
  function renderStep2(el) {
    const isCustom = selectedSop && selectedSop.id === 'custom';

    let sopHtml = sops.map(s => {
      const dc = difficultyColors[s.difficulty];
      return '<div class="no-sop-card' + (selectedSop && selectedSop.id === s.id ? ' selected' : '') + '" data-id="' + s.id + '">' +
        '<div class="no-sop-info">' +
          '<strong>' + s.title + '</strong>' +
          '<span class="no-sop-meta">' +
            '<span class="sop-difficulty" style="background:' + dc + '20;color:' + dc + '">' + s.difficulty + '</span>' +
            '<span class="sop-time">\u23F2 ' + s.time + '</span>' +
            '<span class="no-sop-labor">' + fmt(s.laborCost) + ' labor</span>' +
          '</span>' +
        '</div>' +
        '<span class="uniform-badge badge-' + s.category + '">' + s.category.replace(/-/g, ' ') + '</span>' +
      '</div>';
    }).join('');

    // Custom service card
    sopHtml += '<div class="no-sop-card no-sop-custom' + (isCustom ? ' selected' : '') + '" data-id="custom">' +
      '<span class="no-sop-plus">+</span>' +
      '<div class="no-sop-info">' +
        '<strong>Custom Service</strong>' +
        '<span class="no-sop-meta"><span class="sop-time">Define your own</span></span>' +
      '</div>' +
      '<span class="badge-custom">Custom</span>' +
    '</div>';

    // Custom fields (shown when custom is selected)
    let customFieldsHtml = '';
    if (isCustom) {
      customFieldsHtml = '<div class="no-custom-fields">' +
        '<div class="no-custom-row">' +
          '<div class="form-group"><label>Service Name</label><input type="text" id="customName" placeholder="e.g. Hem Dress Pants" value="' + (selectedSop.title !== 'Custom Service' ? selectedSop.title : '') + '"></div>' +
          '<div class="form-group"><label>Estimated Time</label><input type="text" id="customTime" placeholder="e.g. 30 min" value="' + (selectedSop.time || '') + '"></div>' +
          '<div class="form-group"><label>Labor Price ($)</label><input type="number" id="customPrice" placeholder="0.00" step="0.01" min="0" value="' + (selectedSop.laborCost || '') + '"></div>' +
        '</div>' +
      '</div>';
    }

    const canProceed = selectedSop && (selectedSop.id !== 'custom' || (selectedSop.title && selectedSop.title !== 'Custom Service' && selectedSop.laborCost > 0));

    el.innerHTML =
      '<h3>Step 2: Select Service (SOP)</h3>' +
      '<p class="no-step-desc">Choose the sewing procedure for this order, or create a custom service.</p>' +
      '<div class="no-sop-list">' + sopHtml + '</div>' +
      customFieldsHtml +
      '<div class="no-nav">' +
        '<button class="btn-secondary no-back-btn" id="noBack2">Back</button>' +
        '<button class="btn-primary no-next-btn" id="noNext2"' + (!canProceed ? ' disabled' : '') + '>Next: Materials & Items</button>' +
      '</div>';

    // Select SOP cards (including custom)
    document.querySelectorAll('.no-sop-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        if (id === 'custom') {
          selectedSop = { id: 'custom', title: 'Custom Service', category: 'custom', time: '30 min', difficulty: 'medium', laborCost: 0 };
        } else {
          selectedSop = sops.find(s => s.id === id);
        }
        renderStep2(el);
      });
    });

    // Custom fields live update
    if (isCustom) {
      const nameInput = document.getElementById('customName');
      const timeInput = document.getElementById('customTime');
      const priceInput = document.getElementById('customPrice');
      const nextBtn = document.getElementById('noNext2');

      function updateCustom() {
        if (nameInput) selectedSop.title = nameInput.value.trim() || 'Custom Service';
        if (timeInput) selectedSop.time = timeInput.value.trim() || '30 min';
        if (priceInput) selectedSop.laborCost = parseFloat(priceInput.value) || 0;
        const valid = selectedSop.title && selectedSop.title !== 'Custom Service' && selectedSop.laborCost > 0;
        nextBtn.disabled = !valid;
      }
      if (nameInput) nameInput.addEventListener('input', updateCustom);
      if (timeInput) timeInput.addEventListener('input', updateCustom);
      if (priceInput) priceInput.addEventListener('input', updateCustom);
    }

    document.getElementById('noBack2').addEventListener('click', () => { newOrderStep = 1; renderNewOrderStep(); });
    document.getElementById('noNext2').addEventListener('click', () => { if (!selectedSop) return; newOrderStep = 3; renderNewOrderStep(); });
  }

  // ── Step 3: Inventory Items ───────────────────────────────
  function renderStep3(el) {
    const cats = [...new Set(inventory.map(i => i.category))];

    let invHtml = '';
    cats.forEach(cat => {
      const items = inventory.filter(i => i.category === cat);
      invHtml += '<div class="no-inv-cat"><h4>' + cat + '</h4>';
      items.forEach(item => {
        const sel = selectedItems.find(s => s.invItem.id === item.id);
        const qty = sel ? sel.qty : 0;
        const stockClass = item.stock <= 5 ? ' low-stock' : '';
        invHtml +=
          '<div class="no-inv-item' + (qty > 0 ? ' selected' : '') + '" data-id="' + item.id + '">' +
            '<div class="no-inv-info">' +
              '<span class="no-inv-name">' + item.name + '</span>' +
              '<span class="no-inv-price">' + fmt(item.price) + '</span>' +
            '</div>' +
            '<div class="no-inv-right">' +
              '<span class="no-inv-stock' + stockClass + '">' + item.stock + ' in stock</span>' +
              '<div class="no-qty-ctrl">' +
                '<button class="no-qty-btn" data-action="dec" data-id="' + item.id + '">-</button>' +
                '<span class="no-qty-val">' + qty + '</span>' +
                '<button class="no-qty-btn" data-action="inc" data-id="' + item.id + '">+</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      });
      invHtml += '</div>';
    });

    const matTotal = selectedItems.reduce((sum, s) => sum + s.qty * s.invItem.price, 0);
    const laborCost = selectedSop ? selectedSop.laborCost : 0;

    el.innerHTML =
      '<h3>Step 3: Add Materials & Items</h3>' +
      '<p class="no-step-desc">Select badges, patches, tapes, and supplies needed for this order.</p>' +
      '<div class="no-inv-grid">' + invHtml + '</div>' +
      '<div class="no-cost-summary">' +
        '<span>Materials: ' + fmt(matTotal) + '</span>' +
        '<span>Labor: ' + fmt(laborCost) + '</span>' +
        '<strong>Running Total: ' + fmt(matTotal + laborCost) + '</strong>' +
      '</div>' +
      '<div class="no-nav">' +
        '<button class="btn-secondary no-back-btn" id="noBack3">Back</button>' +
        '<button class="btn-primary no-next-btn" id="noNext3">Next: Review & Submit</button>' +
      '</div>';

    // Qty buttons
    document.querySelectorAll('.no-qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.id;
        const action = btn.dataset.action;
        const invItem = inventory.find(i => i.id === itemId);
        let existing = selectedItems.find(s => s.invItem.id === itemId);

        if (action === 'inc') {
          if (existing) { if (existing.qty < invItem.stock) existing.qty++; }
          else { selectedItems.push({ invItem: invItem, qty: 1 }); }
        } else {
          if (existing) {
            existing.qty--;
            if (existing.qty <= 0) selectedItems = selectedItems.filter(s => s.invItem.id !== itemId);
          }
        }
        renderStep3(el);
      });
    });

    document.getElementById('noBack3').addEventListener('click', () => { newOrderStep = 2; renderNewOrderStep(); });
    document.getElementById('noNext3').addEventListener('click', () => { newOrderStep = 4; renderNewOrderStep(); });
  }

  // ── Step 4: Review & Submit ───────────────────────────────

  function buildMiniCalendar() {
    const mNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dNames = ['S','M','T','W','T','F','S'];
    const firstDay = new Date(schedCalYear, schedCalMonth, 1).getDay();
    const daysInMonth = new Date(schedCalYear, schedCalMonth + 1, 0).getDate();
    const todayDate = new Date(2026, 2, 1);

    let html = '<div class="no-mini-cal">';
    html += '<div class="no-mini-cal-header">';
    html += '<button class="no-mini-cal-nav" data-dir="prev">\u25C0</button>';
    html += '<h4>' + mNames[schedCalMonth] + ' ' + schedCalYear + '</h4>';
    html += '<button class="no-mini-cal-nav" data-dir="next">\u25B6</button>';
    html += '</div>';
    html += '<div class="no-mini-cal-grid">';
    dNames.forEach(d => { html += '<span class="no-mini-cal-dayh">' + d + '</span>'; });

    for (let i = 0; i < firstDay; i++) {
      html += '<span class="no-mini-cal-cell empty"></span>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = schedCalYear + '-' + String(schedCalMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const closed = isDayClosed(dateStr);
      const isToday = schedCalYear === todayDate.getFullYear() && schedCalMonth === todayDate.getMonth() && d === todayDate.getDate();
      const isSelected = selectedScheduleDate === dateStr;

      let cls = 'no-mini-cal-cell';
      if (closed) cls += ' closed';
      if (isToday) cls += ' today';
      if (isSelected) cls += ' selected';

      let capDot = '';
      if (!closed) {
        const dObj = new Date(dateStr + 'T00:00:00');
        const dow = dObj.getDay();
        let totalAvail = 0;
        employees.forEach(emp => { const s = emp.schedule[dow]; if (s) totalAvail += parseTime(s.end) - parseTime(s.start); });
        let booked = 0;
        orders.forEach(o => { if (o.scheduledBlock && o.scheduledBlock.date === dateStr) booked += parseTime(o.scheduledBlock.endTime) - parseTime(o.scheduledBlock.startTime); });
        if (totalAvail > 0) {
          const ratio = booked / totalAvail;
          const level = ratio >= 0.8 ? 'full' : ratio >= 0.4 ? 'busy' : 'free';
          capDot = '<span class="no-mini-cap-dot ' + level + '"></span>';
        }
      }

      html += '<span class="' + cls + '" data-date="' + dateStr + '">' + d + capDot + '</span>';
    }

    html += '</div></div>';
    return html;
  }

  function buildSlotPicker() {
    let html = '<div class="no-slot-panel">';
    html += '<h4>Pick a Time Slot</h4>';

    // Employee dropdown
    html += '<div class="form-group"><label>Assign Employee</label><select id="noEmpSelect">';
    html += '<option value="">— Select —</option>';
    employees.forEach(emp => {
      html += '<option value="' + emp.id + '"' + (selectedEmployee === emp.id ? ' selected' : '') + '>' + emp.name + ' (' + emp.role + ')</option>';
    });
    html += '</select></div>';

    // Day summary — all jobs for selected date across all employees
    if (selectedScheduleDate) {
      const allDayOrders = orders.filter(o =>
        o.scheduledBlock && o.scheduledBlock.date === selectedScheduleDate
      );
      if (allDayOrders.length > 0) {
        html += '<div class="no-day-summary"><h5>Jobs Scheduled — ' + selectedScheduleDate + '</h5>';
        allDayOrders.forEach(o => {
          const emp = employees.find(e => e.id === o.scheduledBlock.employeeId);
          html += '<div class="no-day-job">' +
            '<span class="no-day-job-dot" style="background:' + (emp ? emp.color : '#888') + '"></span>' +
            '<div class="no-day-job-info">' +
              '<span class="no-day-job-time">' + formatTime(o.scheduledBlock.startTime) + ' – ' + formatTime(o.scheduledBlock.endTime) + '</span>' +
              '<span class="no-day-job-detail">' + o.id + ' · ' + o.customer + ' · ' + o.uniform + '</span>' +
              (emp ? '<span class="no-day-job-emp">' + emp.name + '</span>' : '') +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      }
    }

    // Time slots
    if (selectedScheduleDate && selectedEmployee) {
      const dObj = new Date(selectedScheduleDate + 'T00:00:00');
      const dow = dObj.getDay();
      const emp = employees.find(e => e.id === selectedEmployee);
      const empSched = emp ? emp.schedule[dow] : null;

      if (!empSched) {
        html += '<p class="no-slot-empty">' + (emp ? emp.name : 'Employee') + ' is not scheduled this day.</p>';
      } else {
        const startMin = parseTime(empSched.start);
        const endMin = parseTime(empSched.end);

        // Get booked orders for this employee on this date (with full info)
        const bookedOrders = orders.filter(o =>
          o.scheduledBlock &&
          o.scheduledBlock.date === selectedScheduleDate &&
          o.scheduledBlock.employeeId === selectedEmployee
        );
        const bookedBlocks = bookedOrders.map(o => ({
          start: parseTime(o.scheduledBlock.startTime),
          end: parseTime(o.scheduledBlock.endTime),
          order: o
        }));

        html += '<div class="no-slot-list">';
        for (let m = startMin; m < endMin; m += 30) {
          const slotTime = minutesToTime(m);
          const bookedBlock = bookedBlocks.find(b => m >= b.start && m < b.end);
          const isSelected = selectedScheduleStart === slotTime;
          let cls = 'no-slot';
          if (bookedBlock) {
            cls += ' booked';
            // Only show the order label on the first 30-min chunk of the block
            if (m === bookedBlock.start) {
              html += '<div class="' + cls + '" data-time="' + slotTime + '">' +
                '<span class="no-slot-time">' + formatTime(slotTime) + '</span>' +
                '<span class="no-slot-order">' + bookedBlock.order.id + ' — ' + bookedBlock.order.customer + ' · ' + bookedBlock.order.uniform + '</span>' +
              '</div>';
            } else {
              html += '<div class="' + cls + ' booked-cont" data-time="' + slotTime + '">' +
                '<span class="no-slot-time">' + formatTime(slotTime) + '</span>' +
                '<span class="no-slot-order cont">continued</span>' +
              '</div>';
            }
          } else {
            if (isSelected) cls += ' selected';
            html += '<span class="' + cls + '" data-time="' + slotTime + '">' + formatTime(slotTime) + '</span>';
          }
        }
        html += '</div>';
      }
    } else if (selectedScheduleDate && !selectedEmployee) {
      html += '<p class="no-slot-empty">Select an employee to see available slots.</p>';
    } else {
      html += '<p class="no-slot-empty">Select a day on the calendar first.</p>';
    }

    html += '</div>';
    return html;
  }

  function renderStep4(el) {
    const matTotal = selectedItems.reduce((sum, s) => sum + s.qty * s.invItem.price, 0);
    const laborCost = selectedSop ? selectedSop.laborCost : 0;
    const grandTotal = matTotal + laborCost;

    let itemRows = selectedItems.map(s =>
      '<tr><td>' + s.invItem.name + '</td><td>' + s.qty + '</td><td>' + fmt(s.qty * s.invItem.price) + '</td></tr>'
    ).join('');
    if (!itemRows) itemRows = '<tr><td colspan="3" style="color:var(--text-muted)">No materials selected</td></tr>';

    // Schedule summary
    let schedSummary = '';
    if (selectedScheduleDate && selectedScheduleStart && selectedEmployee) {
      const emp = employees.find(e => e.id === selectedEmployee);
      const dur = parseDuration(selectedSop ? selectedSop.time : '30 min');
      const endMin = parseTime(selectedScheduleStart) + dur;
      schedSummary = '<p>' + formatTime(selectedScheduleStart) + ' – ' + formatTime(minutesToTime(endMin)) + '<br>' +
        (emp ? '<span style="color:' + emp.color + '">\u25CF</span> ' + emp.name : '') + '</p>';
    } else {
      schedSummary = '<p style="color:var(--text-dim)">Not scheduled yet</p>';
    }

    el.innerHTML =
      '<h3>Step 4: Review & Submit</h3>' +
      '<div class="no-review">' +
        '<div class="no-review-section">' +
          '<h4>Customer</h4>' +
          '<p><strong>' + (selectedCustomer ? selectedCustomer.name : '—') + '</strong><br>' +
          (selectedCustomer ? selectedCustomer.phone + ' &middot; ' + (selectedCustomer.email || '') + '<br>' + (selectedCustomer.unit || '') : '') + '</p>' +
        '</div>' +
        '<div class="no-review-section">' +
          '<h4>Service</h4>' +
          '<p><strong>' + (selectedSop ? selectedSop.title : '—') + '</strong>' +
          (selectedSop && selectedSop.id === 'custom' ? ' <span class="badge-custom">Custom</span>' : '') + '<br>' +
          (selectedSop ? '\u23F2 ' + selectedSop.time + ' &middot; ' + fmt(selectedSop.laborCost) + ' labor' : '') + '</p>' +
        '</div>' +
        '<div class="no-review-section">' +
          '<h4>Materials</h4>' +
          '<table class="cost-table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>' + itemRows + '</tbody></table>' +
        '</div>' +
        '<div class="no-review-section">' +
          '<h4>Order Details</h4>' +
          '<div class="no-review-fields">' +
            '<div class="form-group"><label>Deadline</label><input type="date" id="noDeadline" value="' + newOrderDeadline + '"></div>' +
            '<div class="form-group"><label>Pickup Method</label>' +
              '<select id="noPickup" class="table-filter-select">' +
                '<option value="customer"' + (newOrderPickup === 'customer' ? ' selected' : '') + '>Customer Pickup</option>' +
                '<option value="driver"' + (newOrderPickup === 'driver' ? ' selected' : '') + '>SewReady Driver</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group form-group-full"><label>Customer Notes</label><textarea id="noComment" class="no-textarea" placeholder="Any special instructions...">' + newOrderComment + '</textarea></div>' +
          '</div>' +
        '</div>' +
        '<div class="no-review-section">' +
          '<h4>Schedule Work</h4>' +
          '<div class="no-schedule-grid">' +
            buildMiniCalendar() +
            buildSlotPicker() +
          '</div>' +
        '</div>' +
        '<div class="no-review-total">' +
          '<span>Materials: ' + fmt(matTotal) + '</span>' +
          '<span>Labor: ' + fmt(laborCost) + '</span>' +
          '<strong>Grand Total: ' + fmt(grandTotal) + '</strong>' +
        '</div>' +
      '</div>' +
      '<div class="no-nav">' +
        '<button class="btn-secondary no-back-btn" id="noBack4">Back</button>' +
        '<button class="btn-primary no-submit-btn" id="noSubmit">Create Order</button>' +
      '</div>';

    // ── Event Listeners ──
    document.getElementById('noDeadline').addEventListener('change', (e) => { newOrderDeadline = e.target.value; });
    document.getElementById('noPickup').addEventListener('change', (e) => { newOrderPickup = e.target.value; });
    document.getElementById('noComment').addEventListener('input', (e) => { newOrderComment = e.target.value; });
    document.getElementById('noBack4').addEventListener('click', () => { newOrderStep = 3; renderNewOrderStep(); });

    // Mini calendar navigation
    document.querySelectorAll('.no-mini-cal-nav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.dataset.dir === 'prev') { schedCalMonth--; if (schedCalMonth < 0) { schedCalMonth = 11; schedCalYear--; } }
        else { schedCalMonth++; if (schedCalMonth > 11) { schedCalMonth = 0; schedCalYear++; } }
        renderStep4(el);
      });
    });

    // Mini calendar day selection
    document.querySelectorAll('.no-mini-cal-cell:not(.empty):not(.closed)').forEach(cell => {
      cell.addEventListener('click', () => {
        selectedScheduleDate = cell.dataset.date;
        selectedScheduleStart = null;
        renderStep4(el);
      });
    });

    // Employee select
    const empSelect = document.getElementById('noEmpSelect');
    if (empSelect) {
      empSelect.addEventListener('change', (e) => {
        selectedEmployee = e.target.value || null;
        selectedScheduleStart = null;
        renderStep4(el);
      });
    }

    // Time slot selection
    document.querySelectorAll('.no-slot:not(.booked)').forEach(slot => {
      slot.addEventListener('click', () => {
        selectedScheduleStart = slot.dataset.time;
        renderStep4(el);
      });
    });

    // Submit
    document.getElementById('noSubmit').addEventListener('click', () => {
      if (!selectedCustomer || !selectedSop) { showToast('Customer and service are required'); return; }
      const deadline = document.getElementById('noDeadline').value;
      if (!deadline) { showToast('Please set a deadline'); return; }
      const comment = document.getElementById('noComment').value;
      const pickup = document.getElementById('noPickup').value;

      const catLabel = selectedSop.id === 'custom' ? selectedSop.title :
        selectedSop.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const uniformKey = selectedSop.id === 'custom' ? 'custom' : selectedSop.category;
      const mods = selectedItems.map(s => s.invItem.name);

      const d = new Date(deadline + 'T00:00:00');
      const today = new Date(2026, 2, 1);
      const diff = Math.round((d - today) / 86400000);
      let urgency;
      if (diff <= 1) { urgency = 'urgent'; }
      else if (diff <= 3) { urgency = 'soon'; }
      else { urgency = 'on-track'; }

      // Build scheduled block if scheduling was filled
      let scheduledBlock = null;
      if (selectedScheduleDate && selectedScheduleStart && selectedEmployee) {
        const dur = parseDuration(selectedSop.time);
        const endMin = parseTime(selectedScheduleStart) + dur;
        scheduledBlock = {
          date: selectedScheduleDate,
          startTime: selectedScheduleStart,
          endTime: minutesToTime(endMin),
          employeeId: selectedEmployee
        };
      }

      const orderData = {
        customer: selectedCustomer.name, phone: selectedCustomer.phone,
        email: selectedCustomer.email || '', unit: selectedCustomer.unit || '',
        uniform: catLabel, uniformKey: uniformKey,
        modifications: mods.length ? mods : [selectedSop.title],
        deadline: deadline, urgency: urgency,
        pickup: pickup === 'driver' ? 'SewReady Driver' : 'Customer Pickup',
        pickupType: pickup, status: 'received',
        customerComment: comment || 'No notes.',
        photos: [catLabel + ' — before', 'SOP reference'],
        sopTitle: selectedSop.title, sopTime: selectedSop.time,
        costs: {
          labor: selectedSop.laborCost,
          materials: selectedItems.map(s => ({ inventoryId: s.invItem.id, item: s.invItem.name, qty: s.qty, unitPrice: s.invItem.price, price: s.invItem.price }))
        },
        checklist: (mods.length ? mods : [selectedSop.title]).map(m => ({ text: m, done: false, completedBy: null, completedAt: null })),
        createdBy: currentUser
      };
      if (scheduledBlock) orderData.scheduledBlock = scheduledBlock;

      const newOrder = DataStore.createOrder(orderData);
      // Apply compat shim for local render
      if (!newOrder.pickupIcon) newOrder.pickupIcon = newOrder.pickupType;
      if (!newOrder.deadlineLabel) {
        if (diff <= 0) newOrder.deadlineLabel = 'Due Today';
        else if (diff === 1) newOrder.deadlineLabel = 'Due Tomorrow';
        else newOrder.deadlineLabel = 'Due in ' + diff + ' Days';
      }
      newOrder.costs.materials.forEach(m => { if (m.unitPrice !== undefined && m.price === undefined) m.price = m.unitPrice; });

      newOrderOverlay.classList.remove('open');
      showToast('Order ' + newOrder.id + ' created for ' + selectedCustomer.name);
      expandedRows.add(newOrder.id);
      render();
    });
  }

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

  // ── URL Highlight Param ────────────────────────────────────
  function handleHighlightParam() {
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get('highlight');
    if (highlightId) {
      const order = orders.find(o => o.id === highlightId);
      if (order) {
        expandedRows.add(highlightId);
        render();
        setTimeout(() => {
          const row = tbody.querySelector('tr[data-id="' + highlightId + '"]');
          if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
    }
  }

  // ── Init ──────────────────────────────────────────────────
  render();
  handleHighlightParam();
});
