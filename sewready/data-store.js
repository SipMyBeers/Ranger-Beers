// ══════════════════════════════════════════════════════════════
//  SewReady — Unified Data Store
//  Central CRUD API, localStorage persistence, event system
//  Loaded AFTER shared-data.js + data files, BEFORE page scripts
// ══════════════════════════════════════════════════════════════

const DataStore = (function () {

  // ── Shop-specific localStorage prefix ───────────────────
  const SHOP_PREFIX = (typeof shopConfig !== 'undefined' && shopConfig.slug)
    ? shopConfig.slug : 'sewready';

  // ── localStorage Keys ─────────────────────────────────────
  const KEYS = {
    orders:       SHOP_PREFIX + '-orders',
    employees:    SHOP_PREFIX + '-employees',
    shopHours:    SHOP_PREFIX + '-shop-hours',
    closedDates:  SHOP_PREFIX + '-closed-dates',
    shiftRequests:SHOP_PREFIX + '-shift-requests',
    inventory:    SHOP_PREFIX + '-inventory',
    customers:    SHOP_PREFIX + '-customers-admin',
    shopConfig:   SHOP_PREFIX + '-shop-config',
    notifications:SHOP_PREFIX + '-notifications',
    incoming:     SHOP_PREFIX + '-incoming'
  };

  // ── API Sync Layer ───────────────────────────────────────
  const API_BASE = '/api';

  function _apiPost(path, data) {
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ shop_slug: SHOP_PREFIX }, data))
    }).catch(function () { /* offline — silent fail, localStorage has the data */ });
  }

  function _apiPatch(path, data) {
    return fetch(API_BASE + path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ shop_slug: SHOP_PREFIX }, data))
    }).catch(function () {});
  }

  function _apiGet(path) {
    var sep = path.indexOf('?') === -1 ? '?' : '&';
    return fetch(API_BASE + path + sep + 'shop=' + encodeURIComponent(SHOP_PREFIX))
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; });
  }

  function _apiDelete(path) {
    return fetch(API_BASE + path + '?shop=' + encodeURIComponent(SHOP_PREFIX), {
      method: 'DELETE'
    }).catch(function () {});
  }

  // ── Internal State ────────────────────────────────────────
  let _orders = [];
  let _employees = [];
  let _shopHours = {};
  let _closedDates = [];
  let _shiftRequests = [];
  let _inventoryOverrides = {}; // id → stock count
  let _customers = [];
  let _shopConfig = {};
  let _notifications = [];
  let _incoming = [];
  const _listeners = {};

  // ── Default Seed Data ─────────────────────────────────────

  const DEFAULT_SHOP_CONFIG = {
    name: "Maria's Alterations",
    brandName: 'SewReady',
    address: '1247 Bragg Blvd, Fayetteville, NC 28301',
    phone: '(555) 867-5309',
    email: 'demo@sewing.ranger-beers.com',
    accentColor: '#a855f7',
    secondaryColor: '#06b6d4',
    driverServiceEnabled: true,
    driverHours: 'Mon-Fri 9:00 AM - 4:00 PM'
  };

  const DEFAULT_CUSTOMERS = [
    { id: 'C-001', name: 'SGT Rodriguez', rank: 'SGT', phone: '(555) 201-4488', email: 'rodriguez.j@army.mil', unit: '82nd Airborne' },
    { id: 'C-002', name: 'SPC Chen', rank: 'SPC', phone: '(555) 339-7102', email: 'chen.w@army.mil', unit: '3rd Infantry' },
    { id: 'C-003', name: '1LT Adams', rank: '1LT', phone: '(555) 442-8830', email: 'adams.r@army.mil', unit: '75th Ranger' },
    { id: 'C-004', name: 'SSG Petrov', rank: 'SSG', phone: '(555) 581-2269', email: 'petrov.a@army.mil', unit: '10th Mountain' },
    { id: 'C-005', name: 'PFC Williams', rank: 'PFC', phone: '(555) 773-0154', email: 'williams.t@army.mil', unit: '1st Cavalry' },
    { id: 'C-006', name: 'CPT Hayes', rank: 'CPT', phone: '(555) 604-9917', email: 'hayes.m@army.mil', unit: '4th Infantry' }
  ];

  const DEFAULT_NOTIFICATIONS = [
    {
      id: 'n1', type: 'dropoff', read: false,
      title: 'Walk-in expected',
      body: '1LT Adams calling ahead for Ranger Bundle drop-off',
      orderId: 'SR-003', time: Date.now() - 15 * 60000
    },
    {
      id: 'n2', type: 'new', read: false,
      title: 'New online order',
      body: 'SGT Rodriguez — OCP Top with 5 modifications',
      orderId: 'SR-001', time: Date.now() - 45 * 60000
    },
    {
      id: 'n3', type: 'ready', read: false,
      title: 'Ready for pickup',
      body: 'PFC Williams patrol cap — rank insignia complete',
      orderId: 'SR-005', time: Date.now() - 2 * 3600000
    }
  ];

  const DEFAULT_ORDERS = [
    {
      id: 'SR-001', customer: 'SGT Rodriguez', phone: '(555) 201-4488',
      email: 'rodriguez.j@army.mil', unit: '82nd Airborne',
      uniform: 'OCP Top', uniformKey: 'ocp-top',
      modifications: ['Rank Insignia', 'Name Tape', 'US Army Tape', 'Unit Patch', 'Skill Badges'],
      deadline: '2026-03-02', urgency: 'urgent',
      scheduledBlock: { date: '2026-03-02', startTime: '08:00', endTime: '08:45', employeeId: 'emp-1' },
      pickup: 'SewReady Driver', pickupType: 'driver',
      status: 'received',
      costs: { labor: 35.00, materials: [
        { inventoryId: 'INV-004', item: 'Rank Insignia — Hook & Loop', qty: 1, unitPrice: 8.00 },
        { inventoryId: 'INV-001', item: 'Name Tape (OCP)', qty: 1, unitPrice: 5.00 },
        { inventoryId: 'INV-002', item: 'US Army Tape (OCP)', qty: 1, unitPrice: 5.00 },
        { inventoryId: 'INV-006', item: 'Unit Patch — 82nd Airborne', qty: 1, unitPrice: 12.00 },
        { inventoryId: 'INV-020', item: 'Skill Badge — Airborne Wings', qty: 1, unitPrice: 14.00 }
      ]},
      checklist: [
        { text: 'Rank Insignia', done: true, completedBy: 'Maria S.', completedAt: '2026-02-28 3:15 PM' },
        { text: 'Name Tape', done: true, completedBy: 'Maria S.', completedAt: '2026-02-28 3:22 PM' },
        { text: 'US Army Tape', done: true, completedBy: 'Ana R.', completedAt: '2026-02-28 4:01 PM' },
        { text: 'Unit Patch', done: false, completedBy: null, completedAt: null },
        { text: 'Skill Badges', done: false, completedBy: null, completedAt: null }
      ],
      sopTitle: 'OCP Top — Full Setup', sopTime: '45 min',
      customerComment: 'Need this ASAP for promotion ceremony Monday. Rank is E-5. Please double-check the unit patch — it\'s 82nd Airborne, NOT 101st.',
      photos: ['OCP Top — before', 'Full setup layout'],
      createdAt: '2026-02-28T10:00:00.000Z',
      createdBy: 'customer',
      updatedAt: '2026-02-28T16:01:00.000Z'
    },
    {
      id: 'SR-002', customer: 'SPC Chen', phone: '(555) 339-7102',
      email: 'chen.w@army.mil', unit: '3rd Infantry',
      uniform: 'OCP Bottom', uniformKey: 'ocp-bottom',
      modifications: ['Name Tape (above right pocket)'],
      deadline: '2026-03-04', urgency: 'on-track',
      scheduledBlock: { date: '2026-03-04', startTime: '09:00', endTime: '09:10', employeeId: 'emp-2' },
      pickup: 'Customer Pickup', pickupType: 'customer',
      status: 'in-progress',
      costs: { labor: 8.00, materials: [
        { inventoryId: 'INV-001', item: 'Name Tape (OCP)', qty: 1, unitPrice: 5.00 }
      ]},
      checklist: [
        { text: 'Name Tape (above right pocket)', done: true, completedBy: 'Ana R.', completedAt: '2026-03-01 9:45 AM' }
      ],
      sopTitle: 'OCP Bottom — Name Tape', sopTime: '10 min',
      customerComment: 'Last name spelling is C-H-E-N. Picking up after 1400 on Tuesday.',
      photos: ['OCP Bottom — before', 'Name tape placement'],
      createdAt: '2026-02-27T14:00:00.000Z',
      createdBy: 'Maria S.',
      updatedAt: '2026-03-01T09:45:00.000Z'
    },
    {
      id: 'SR-003', customer: '1LT Adams', phone: '(555) 442-8830',
      email: 'adams.r@army.mil', unit: '75th Ranger',
      uniform: 'Ranger Bundle', uniformKey: 'ranger-bundle',
      modifications: ['Cat Eyes', 'IR Flag', 'Ranger Tab'],
      deadline: '2026-03-03', urgency: 'soon',
      scheduledBlock: { date: '2026-03-03', startTime: '10:00', endTime: '10:30', employeeId: 'emp-3' },
      pickup: 'SewReady Driver', pickupType: 'driver',
      status: 'received',
      costs: { labor: 25.00, materials: [
        { inventoryId: 'INV-015', item: 'Cat Eyes Strip', qty: 1, unitPrice: 6.00 },
        { inventoryId: 'INV-013', item: 'IR Flag (Reverse)', qty: 1, unitPrice: 15.00 },
        { inventoryId: 'INV-016', item: 'Ranger Tab', qty: 1, unitPrice: 10.00 }
      ]},
      checklist: [
        { text: 'Cat Eyes', done: false, completedBy: null, completedAt: null },
        { text: 'IR Flag', done: false, completedBy: null, completedAt: null },
        { text: 'Ranger Tab', done: false, completedBy: null, completedAt: null }
      ],
      sopTitle: 'Ranger Bundle — Cat Eyes & Tab', sopTime: '30 min',
      customerComment: 'Ranger tab goes ABOVE the unit patch on left sleeve. IR flag is reverse (stars on right). Please call before driver pickup.',
      photos: ['Ranger items — before', 'Cat eyes / IR flag / tab'],
      createdAt: '2026-02-26T11:00:00.000Z',
      createdBy: 'customer',
      updatedAt: '2026-02-26T11:00:00.000Z'
    },
    {
      id: 'SR-004', customer: 'SSG Petrov', phone: '(555) 581-2269',
      email: 'petrov.a@army.mil', unit: '10th Mountain',
      uniform: 'AGSU', uniformKey: 'agsu',
      modifications: ['Awards Rack', 'Skill Badges', 'Rank Insignia'],
      deadline: '2026-03-06', urgency: 'on-track',
      scheduledBlock: { date: '2026-03-06', startTime: '08:00', endTime: '09:00', employeeId: 'emp-1' },
      pickup: 'Customer Pickup', pickupType: 'customer',
      status: 'in-progress',
      costs: { labor: 50.00, materials: [
        { inventoryId: 'INV-025', item: 'Awards Rack — Mounting Bar', qty: 1, unitPrice: 20.00 },
        { inventoryId: 'INV-020', item: 'Skill Badge — Airborne Wings', qty: 1, unitPrice: 14.00 },
        { inventoryId: 'INV-004', item: 'Rank Insignia — Hook & Loop', qty: 1, unitPrice: 8.00 },
        { inventoryId: 'INV-026', item: 'Purple Heart Medal', qty: 1, unitPrice: 25.00 },
        { inventoryId: 'INV-027', item: 'Bronze Star Medal', qty: 1, unitPrice: 25.00 }
      ]},
      checklist: [
        { text: 'Awards Rack', done: true, completedBy: 'Maria S.', completedAt: '2026-02-28 11:30 AM' },
        { text: 'Skill Badges', done: false, completedBy: null, completedAt: null },
        { text: 'Rank Insignia', done: true, completedBy: 'Maria S.', completedAt: '2026-02-28 12:15 PM' }
      ],
      sopTitle: 'AGSU Jacket — Awards & Badges', sopTime: '60 min',
      customerComment: 'Awards rack order: Purple Heart first, then Bronze Star. Skill badge is Airborne Wings. Will pick up Saturday morning.',
      photos: ['AGSU jacket — before', 'Awards + badges layout'],
      createdAt: '2026-02-25T09:00:00.000Z',
      createdBy: 'Maria S.',
      updatedAt: '2026-02-28T12:15:00.000Z'
    },
    {
      id: 'SR-005', customer: 'PFC Williams', phone: '(555) 773-0154',
      email: 'williams.t@army.mil', unit: '1st Cavalry',
      uniform: 'Patrol Cap', uniformKey: 'patrol-cap',
      modifications: ['Rank Insignia'],
      deadline: '2026-03-01', urgency: 'urgent',
      scheduledBlock: { date: '2026-03-01', startTime: '08:00', endTime: '08:10', employeeId: 'emp-2' },
      pickup: 'Customer Pickup', pickupType: 'customer',
      status: 'ready',
      costs: { labor: 8.00, materials: [
        { inventoryId: 'INV-004', item: 'Rank Insignia — Hook & Loop', qty: 1, unitPrice: 8.00 }
      ]},
      checklist: [
        { text: 'Rank Insignia', done: true, completedBy: 'Ana R.', completedAt: '2026-03-01 8:20 AM' }
      ],
      sopTitle: 'Patrol Cap — Rank Insignia', sopTime: '10 min',
      customerComment: 'Will pick up before 1700 today. Just the rank, nothing else.',
      photos: ['Patrol cap — before', 'Rank placement'],
      createdAt: '2026-02-28T08:00:00.000Z',
      createdBy: 'customer',
      updatedAt: '2026-03-01T08:20:00.000Z'
    },
    {
      id: 'SR-006', customer: 'CPT Hayes', phone: '(555) 604-9917',
      email: 'hayes.m@army.mil', unit: '4th Infantry',
      uniform: 'OCP Top', uniformKey: 'ocp-top',
      modifications: ['Rank Insignia (new)', 'Name Tape (keep)', 'US Army Tape (keep)', 'Unit Patch (keep)'],
      deadline: '2026-03-05', urgency: 'on-track',
      scheduledBlock: { date: '2026-03-05', startTime: '14:00', endTime: '14:15', employeeId: 'emp-1' },
      pickup: 'SewReady Driver', pickupType: 'driver',
      status: 'completed',
      costs: { labor: 15.00, materials: [
        { inventoryId: 'INV-004', item: 'Rank Insignia — Hook & Loop', qty: 1, unitPrice: 8.00 }
      ]},
      checklist: [
        { text: 'Rank Insignia (new)', done: true, completedBy: 'Maria S.', completedAt: '2026-02-27 2:00 PM' },
        { text: 'Name Tape (keep)', done: true, completedBy: 'Maria S.', completedAt: '2026-02-27 2:05 PM' },
        { text: 'US Army Tape (keep)', done: true, completedBy: 'Maria S.', completedAt: '2026-02-27 2:05 PM' },
        { text: 'Unit Patch (keep)', done: true, completedBy: 'Maria S.', completedAt: '2026-02-27 2:10 PM' }
      ],
      sopTitle: 'OCP Top — Promotion Re-sew', sopTime: '15 min',
      customerComment: 'Promoted to CPT. Only the rank needs to change — leave everything else as-is. Driver can pick up anytime.',
      photos: ['OCP Top — promotion re-sew', 'New rank placement'],
      createdAt: '2026-02-26T15:00:00.000Z',
      createdBy: 'Maria S.',
      updatedAt: '2026-02-27T14:10:00.000Z'
    }
  ];

  // ── Persistence Helpers ───────────────────────────────────
  function _save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* quota exceeded — silent */ }
  }

  function _load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ── Event System ──────────────────────────────────────────
  function _emit(event, detail) {
    (_listeners[event] || []).forEach(fn => {
      try { fn(detail); } catch (e) { console.error('DataStore event error:', e); }
    });
  }

  // ── Inventory Stock Application ───────────────────────────
  function _applyInventoryOverrides() {
    if (typeof storeInventory !== 'undefined') {
      storeInventory.forEach(item => {
        if (_inventoryOverrides.hasOwnProperty(item.id)) {
          item.stock = _inventoryOverrides[item.id];
        }
      });
    }
  }

  // ── Inventory Deduction ───────────────────────────────────
  function _deductMaterials(order) {
    if (!order.costs || !order.costs.materials) return;
    order.costs.materials.forEach(mat => {
      if (mat.inventoryId) {
        _updateStock(mat.inventoryId, -(mat.qty || 1));
      }
    });
  }

  function _updateStock(inventoryId, delta) {
    if (typeof storeInventory !== 'undefined') {
      const item = storeInventory.find(i => i.id === inventoryId);
      if (item) {
        item.stock = Math.max(0, item.stock + delta);
        _inventoryOverrides[inventoryId] = item.stock;
      }
    } else {
      const current = _inventoryOverrides[inventoryId] || 0;
      _inventoryOverrides[inventoryId] = Math.max(0, current + delta);
    }
    _save(KEYS.inventory, _inventoryOverrides);
    _emit('inventory-changed', { inventoryId, delta });
  }

  // ── Reassign Window Globals ───────────────────────────────
  function _reassignGlobals() {
    window.employees = _employees;
    window.shopHours = _shopHours;
    window.closedDates = _closedDates;
    window.shiftRequests = _shiftRequests;
    window.sharedOrders = _orders;
  }

  // ══════════════════════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════════════════════

  function init() {
    // Orders
    _orders = _load(KEYS.orders) || JSON.parse(JSON.stringify(DEFAULT_ORDERS));

    // Employees — seed from shared-data.js globals
    _employees = _load(KEYS.employees) ||
      (typeof employees !== 'undefined' ? JSON.parse(JSON.stringify(employees)) : []);

    // Shop Hours
    _shopHours = _load(KEYS.shopHours) ||
      (typeof shopHours !== 'undefined' ? JSON.parse(JSON.stringify(shopHours)) : {});

    // Closed Dates
    _closedDates = _load(KEYS.closedDates) ||
      (typeof closedDates !== 'undefined' ? JSON.parse(JSON.stringify(closedDates)) : []);

    // Shift Requests
    _shiftRequests = _load(KEYS.shiftRequests) ||
      (typeof shiftRequests !== 'undefined' ? JSON.parse(JSON.stringify(shiftRequests)) : []);

    // Inventory overrides
    _inventoryOverrides = _load(KEYS.inventory) || {};
    _applyInventoryOverrides();

    // Admin customers
    _customers = _load(KEYS.customers) || JSON.parse(JSON.stringify(DEFAULT_CUSTOMERS));

    // Shop config
    _shopConfig = _load(KEYS.shopConfig) || JSON.parse(JSON.stringify(DEFAULT_SHOP_CONFIG));

    // Notifications
    _notifications = _load(KEYS.notifications) || JSON.parse(JSON.stringify(DEFAULT_NOTIFICATIONS));

    // Incoming orders (customer-submitted, awaiting drop-off)
    _incoming = _load(KEYS.incoming) || [];

    // Reassign globals so existing code that reads employees, sharedOrders, etc. keeps working
    _reassignGlobals();

    // Persist initial seed if nothing was in localStorage
    if (!localStorage.getItem(KEYS.orders)) _save(KEYS.orders, _orders);
    if (!localStorage.getItem(KEYS.employees)) _save(KEYS.employees, _employees);
    if (!localStorage.getItem(KEYS.shopHours)) _save(KEYS.shopHours, _shopHours);
    if (!localStorage.getItem(KEYS.closedDates)) _save(KEYS.closedDates, _closedDates);
    if (!localStorage.getItem(KEYS.shiftRequests)) _save(KEYS.shiftRequests, _shiftRequests);
    if (!localStorage.getItem(KEYS.customers)) _save(KEYS.customers, _customers);
    if (!localStorage.getItem(KEYS.shopConfig)) _save(KEYS.shopConfig, _shopConfig);
    if (!localStorage.getItem(KEYS.notifications)) _save(KEYS.notifications, _notifications);
    if (!localStorage.getItem(KEYS.incoming)) _save(KEYS.incoming, _incoming);

    // Background sync from D1 — fetches server data and merges (D1 wins for conflicts)
    syncFromServer();
  }

  function syncFromServer() {
    // Orders — merge by ID, D1 wins
    _apiGet('/orders').then(function (serverOrders) {
      if (!serverOrders || !serverOrders.length) return;
      var idMap = {};
      _orders.forEach(function (o) { idMap[o.id] = o; });
      serverOrders.forEach(function (o) { idMap[o.id] = o; });
      _orders = Object.values(idMap);
      _save(KEYS.orders, _orders);
      _reassignGlobals();
      _emit('orders-synced', _orders);
    });

    // Incoming
    _apiGet('/incoming').then(function (serverIncoming) {
      if (!serverIncoming || !serverIncoming.length) return;
      var idMap = {};
      _incoming.forEach(function (o) { idMap[o.id] = o; });
      serverIncoming.forEach(function (o) { idMap[o.id] = o; });
      _incoming = Object.values(idMap);
      _save(KEYS.incoming, _incoming);
      _emit('incoming-synced', _incoming);
    });

    // Customers
    _apiGet('/customers').then(function (serverCusts) {
      if (!serverCusts || !serverCusts.length) return;
      var idMap = {};
      _customers.forEach(function (c) { idMap[c.id] = c; });
      serverCusts.forEach(function (c) { idMap[c.id] = c; });
      _customers = Object.values(idMap);
      _save(KEYS.customers, _customers);
      _emit('customers-synced', _customers);
    });

    // Notifications
    _apiGet('/notifications').then(function (serverNotifs) {
      if (!serverNotifs || !serverNotifs.length) return;
      var idMap = {};
      _notifications.forEach(function (n) { idMap[n.id] = n; });
      serverNotifs.forEach(function (n) { idMap[n.id] = n; });
      _notifications = Object.values(idMap);
      _notifications.sort(function (a, b) { return (b.time || 0) - (a.time || 0); });
      _save(KEYS.notifications, _notifications);
      _emit('notifications-synced', _notifications);
    });
  }

  // ── Orders ────────────────────────────────────────────────
  function getOrders(filter) {
    if (!filter) return _orders;
    return _orders.filter(o => {
      if (filter.status && o.status !== filter.status) return false;
      if (filter.customer && o.customer !== filter.customer) return false;
      return true;
    });
  }

  function getOrder(id) {
    return _orders.find(o => o.id === id) || null;
  }

  function createOrder(data) {
    // Generate next ID
    const maxNum = _orders.reduce((max, o) => {
      const n = parseInt(o.id.replace('SR-', ''), 10);
      return n > max ? n : max;
    }, 0);
    const newId = 'SR-' + String(maxNum + 1).padStart(3, '0');
    const now = new Date().toISOString();

    const order = Object.assign({
      id: newId,
      status: 'received',
      urgency: 'on-track',
      pickup: 'Customer Pickup',
      pickupType: 'customer',
      costs: { labor: 0, materials: [] },
      checklist: [],
      customerComment: '',
      photos: [],
      createdAt: now,
      createdBy: 'customer',
      updatedAt: now
    }, data, { id: newId });

    // Ensure progress fields exist for backward compat
    if (order.checklist && order.checklist.length > 0) {
      order.progress = order.checklist.filter(c => c.done).length;
      order.total = order.checklist.length;
    } else if (order.modifications) {
      order.progress = 0;
      order.total = order.modifications.length;
    }

    _orders.push(order);
    _save(KEYS.orders, _orders);
    _reassignGlobals();

    // Auto-generate admin notification for customer-created orders
    if (order.createdBy === 'customer') {
      addNotification({
        type: 'new',
        title: 'New online order',
        body: order.customer + ' — ' + order.uniform + ' with ' + (order.modifications ? order.modifications.length : 0) + ' modification' + ((order.modifications ? order.modifications.length : 0) !== 1 ? 's' : ''),
        orderId: order.id
      });
    }

    _emit('order-created', order);
    _apiPost('/orders', order);
    return order;
  }

  function updateOrder(id, changes) {
    const order = _orders.find(o => o.id === id);
    if (!order) return null;
    Object.assign(order, changes, { updatedAt: new Date().toISOString() });

    // Recalculate progress if checklist changed
    if (changes.checklist) {
      order.progress = order.checklist.filter(c => c.done).length;
      order.total = order.checklist.length;
    }

    _save(KEYS.orders, _orders);
    _reassignGlobals();
    _emit('order-updated', order);
    _apiPatch('/orders/' + id, order);
    return order;
  }

  function updateOrderStatus(id, status) {
    const order = _orders.find(o => o.id === id);
    if (!order) return null;
    const prev = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();

    // Deduct materials when moving to in-progress
    if (status === 'in-progress' && prev !== 'in-progress') {
      _deductMaterials(order);
    }

    _save(KEYS.orders, _orders);
    _reassignGlobals();
    _emit('order-status-changed', { order, prev, status });
    _apiPatch('/orders/' + id, order);
    return order;
  }

  // ── Employees ─────────────────────────────────────────────
  function getEmployees() { return _employees; }

  function getEmployee(id) {
    return _employees.find(e => e.id === id) || null;
  }

  function addEmployee(data) {
    const maxNum = _employees.reduce((max, e) => {
      const n = parseInt(e.id.replace('emp-', ''), 10);
      return n > max ? n : max;
    }, 0);
    const emp = Object.assign({
      id: 'emp-' + (maxNum + 1),
      schedule: { 0: null, 1: { start: '08:00', end: '18:00' }, 2: { start: '08:00', end: '18:00' }, 3: { start: '08:00', end: '18:00' }, 4: { start: '08:00', end: '18:00' }, 5: { start: '08:00', end: '18:00' }, 6: null }
    }, data);
    _employees.push(emp);
    _save(KEYS.employees, _employees);
    _reassignGlobals();
    _emit('employee-added', emp);
    return emp;
  }

  function updateEmployee(id, changes) {
    const emp = _employees.find(e => e.id === id);
    if (!emp) return null;
    Object.assign(emp, changes);
    _save(KEYS.employees, _employees);
    _reassignGlobals();
    _emit('employee-updated', emp);
    return emp;
  }

  function removeEmployee(id) {
    const idx = _employees.findIndex(e => e.id === id);
    if (idx === -1) return false;
    _employees.splice(idx, 1);
    _save(KEYS.employees, _employees);
    _reassignGlobals();
    _emit('employee-removed', { id });
    return true;
  }

  // ── Shop Hours ────────────────────────────────────────────
  function getShopHours() { return _shopHours; }

  function setShopHours(day, hours) {
    _shopHours[day] = hours;
    _save(KEYS.shopHours, _shopHours);
    _reassignGlobals();
    _emit('shop-hours-changed', { day, hours });
  }

  // ── Closed Dates ──────────────────────────────────────────
  function getClosedDates() { return _closedDates; }

  function addClosedDate(date) {
    if (!_closedDates.includes(date)) {
      _closedDates.push(date);
      _closedDates.sort();
      _save(KEYS.closedDates, _closedDates);
      _reassignGlobals();
      _emit('closed-date-added', { date });
    }
  }

  function removeClosedDate(date) {
    const idx = _closedDates.indexOf(date);
    if (idx > -1) {
      _closedDates.splice(idx, 1);
      _save(KEYS.closedDates, _closedDates);
      _reassignGlobals();
      _emit('closed-date-removed', { date });
    }
  }

  // ── Shift Requests ────────────────────────────────────────
  function getShiftRequests() { return _shiftRequests; }

  function createShiftRequest(data) {
    const maxNum = _shiftRequests.reduce((max, r) => {
      const n = parseInt(r.id.replace('req-', ''), 10);
      return n > max ? n : max;
    }, 0);
    const req = Object.assign({
      id: 'req-' + (maxNum + 1),
      status: 'pending'
    }, data);
    _shiftRequests.push(req);
    _save(KEYS.shiftRequests, _shiftRequests);
    _reassignGlobals();
    _emit('shift-request-created', req);
    return req;
  }

  function updateShiftRequest(id, changes) {
    const req = _shiftRequests.find(r => r.id === id);
    if (!req) return null;
    Object.assign(req, changes);
    _save(KEYS.shiftRequests, _shiftRequests);
    _reassignGlobals();
    _emit('shift-request-updated', req);
    return req;
  }

  // ── Inventory ─────────────────────────────────────────────
  function getInventory() {
    return typeof storeInventory !== 'undefined' ? storeInventory : [];
  }

  function getInventoryItem(id) {
    if (typeof storeInventory !== 'undefined') {
      return storeInventory.find(i => i.id === id) || null;
    }
    return null;
  }

  function updateStock(id, delta) {
    _updateStock(id, delta);
  }

  // ── Shop Config ───────────────────────────────────────────
  function getShopConfig() { return _shopConfig; }

  function updateShopConfig(changes) {
    Object.assign(_shopConfig, changes);
    _save(KEYS.shopConfig, _shopConfig);
    _emit('shop-config-changed', _shopConfig);
    return _shopConfig;
  }

  // ── Admin Customers ───────────────────────────────────────
  function getCustomers() { return _customers; }

  function addCustomer(data) {
    const maxNum = _customers.reduce((max, c) => {
      const n = parseInt(c.id.replace('C-', ''), 10);
      return n > max ? n : max;
    }, 0);
    const cust = Object.assign({ id: 'C-' + String(maxNum + 1).padStart(3, '0') }, data);
    _customers.push(cust);
    _save(KEYS.customers, _customers);
    _emit('customer-added', cust);
    _apiPost('/customers', cust);
    return cust;
  }

  // ── Incoming Orders ──────────────────────────────────────
  function getIncoming() { return _incoming; }

  function getIncomingOrder(id) {
    return _incoming.find(o => o.id === id) || null;
  }

  function createIncoming(data) {
    const maxNum = _incoming.reduce((max, o) => {
      const n = parseInt(o.id.replace('INC-', ''), 10);
      return n > max ? n : max;
    }, 0);
    const newId = 'INC-' + String(maxNum + 1).padStart(3, '0');
    const now = new Date().toISOString();

    const incoming = Object.assign({
      id: newId,
      status: 'pending',
      createdAt: now
    }, data, { id: newId });

    _incoming.push(incoming);
    _save(KEYS.incoming, _incoming);

    // Create employee notification
    addNotification({
      type: 'new',
      title: 'New online order',
      body: incoming.customer + ' \u2014 ' + incoming.uniform + ' with ' + (incoming.modifications ? incoming.modifications.length : 0) + ' modification' + ((incoming.modifications ? incoming.modifications.length : 0) !== 1 ? 's' : ''),
      incomingId: incoming.id
    });

    _emit('incoming-created', incoming);
    _apiPost('/incoming', incoming);
    return incoming;
  }

  function receiveIncoming(id) {
    const inc = _incoming.find(o => o.id === id);
    if (!inc) return null;

    // Remove from incoming
    _incoming = _incoming.filter(o => o.id !== id);
    _save(KEYS.incoming, _incoming);

    // Create a real order from the incoming data
    const orderData = Object.assign({}, inc);
    delete orderData.id;
    delete orderData.status;
    orderData.createdBy = 'customer';

    // Don't auto-generate notification — we already notified on incoming
    const order = _createOrderSilent(orderData);

    _emit('incoming-received', { incoming: inc, order: order });
    _apiPost('/incoming/' + id + '/receive', { order_id: order.id });
    return order;
  }

  function dismissIncoming(id) {
    _incoming = _incoming.filter(o => o.id !== id);
    _save(KEYS.incoming, _incoming);
    _emit('incoming-dismissed', id);
    _apiPost('/incoming/' + id + '/dismiss', {});
  }

  // Create order without auto-notification (used by receiveIncoming)
  function _createOrderSilent(data) {
    const maxNum = _orders.reduce((max, o) => {
      const n = parseInt(o.id.replace('SR-', ''), 10);
      return n > max ? n : max;
    }, 0);
    const newId = 'SR-' + String(maxNum + 1).padStart(3, '0');
    const now = new Date().toISOString();

    const order = Object.assign({
      id: newId,
      status: 'received',
      urgency: 'on-track',
      pickup: 'Customer Pickup',
      pickupType: 'customer',
      costs: { labor: 0, materials: [] },
      checklist: [],
      customerComment: '',
      photos: [],
      createdAt: now,
      createdBy: 'customer',
      updatedAt: now
    }, data, { id: newId });

    if (order.checklist && order.checklist.length > 0) {
      order.progress = order.checklist.filter(c => c.done).length;
      order.total = order.checklist.length;
    } else if (order.modifications) {
      order.progress = 0;
      order.total = order.modifications.length;
    }

    _orders.push(order);
    _save(KEYS.orders, _orders);
    _reassignGlobals();
    _emit('order-created', order);
    _apiPost('/orders', order);
    return order;
  }

  // ── Notifications ─────────────────────────────────────────
  function getNotifications() { return _notifications; }

  function addNotification(data) {
    const notif = Object.assign({
      id: 'n' + Date.now(),
      read: false,
      time: Date.now()
    }, data);
    _notifications.unshift(notif);
    _save(KEYS.notifications, _notifications);
    _emit('notification-added', notif);
    _apiPost('/notifications', notif);
    return notif;
  }

  function markRead(id) {
    const n = _notifications.find(n => n.id === id);
    if (n) {
      n.read = true;
      _save(KEYS.notifications, _notifications);
      _apiPatch('/notifications/' + id, { read: true });
    }
  }

  function markAllRead() {
    _notifications.forEach(n => { n.read = true; });
    _save(KEYS.notifications, _notifications);
    _apiPost('/notifications/read-all', {});
  }

  function dismissNotification(id) {
    const idx = _notifications.findIndex(n => n.id === id);
    if (idx > -1) {
      _notifications.splice(idx, 1);
      _save(KEYS.notifications, _notifications);
      _apiDelete('/notifications/' + id);
    }
  }

  // ── Drivers ──────────────────────────────────────────────
  function getDrivers() {
    return _apiGet('/drivers').then(function (r) { return r || []; });
  }
  function createDriver(data) {
    return _apiPost('/drivers', data).then(function (r) { return r ? r.json() : null; });
  }
  function updateDriver(id, data) {
    return _apiPatch('/drivers/' + id, data).then(function (r) { return r ? r.json() : null; });
  }
  function deleteDriver(id) {
    return _apiDelete('/drivers/' + id);
  }

  // ── Driver Assignments ─────────────────────────────────
  function getDriverAssignments(orderId) {
    var path = '/driver-assignments';
    if (orderId) path += '?order_id=' + encodeURIComponent(orderId);
    return _apiGet(path).then(function (r) { return r || []; });
  }
  function createDriverAssignment(data) {
    return _apiPost('/driver-assignments', data).then(function (r) { return r ? r.json() : null; });
  }
  function updateDriverAssignment(id, data) {
    return _apiPatch('/driver-assignments/' + id, data).then(function (r) { return r ? r.json() : null; });
  }

  // ── Photos ─────────────────────────────────────────────
  function getPhotos(orderId) {
    var path = '/photos';
    if (orderId) path += '?order_id=' + encodeURIComponent(orderId);
    return _apiGet(path).then(function (r) { return r || []; });
  }
  function uploadPhoto(formData) {
    formData.append('shop_slug', SHOP_PREFIX);
    return fetch(API_BASE + '/photos/upload', {
      method: 'POST',
      body: formData
    }).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function deletePhoto(photoId) {
    return _apiDelete('/photos?id=' + photoId);
  }

  // ── Audit Log ──────────────────────────────────────────
  function getAuditLog(entityType, entityId) {
    var path = '/audit';
    if (entityType) path += '&entity_type=' + encodeURIComponent(entityType);
    if (entityId) path += '&entity_id=' + encodeURIComponent(entityId);
    return _apiGet(path).then(function (r) { return r || []; });
  }

  // ── Event System ──────────────────────────────────────────
  function on(event, cb) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(cb);
  }

  function off(event, cb) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(fn => fn !== cb);
  }

  // ── Reset ─────────────────────────────────────────────────
  function resetAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    init();
  }

  // ── Auto-apply shop name to DOM ───────────────────────────
  function _applyShopNameToDOM() {
    document.querySelectorAll('.shop-name').forEach(el => {
      el.textContent = _shopConfig.name || "Maria's Alterations";
    });
    document.querySelectorAll('.brand-name').forEach(el => {
      el.textContent = _shopConfig.brandName || 'SewReady';
    });
  }

  // ── Auto Init ─────────────────────────────────────────────
  init();

  // Apply shop name after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _applyShopNameToDOM);
  } else {
    _applyShopNameToDOM();
  }

  // ── Public Interface ──────────────────────────────────────
  return {
    init: init,
    // Orders
    getOrders: getOrders,
    getOrder: getOrder,
    createOrder: createOrder,
    updateOrder: updateOrder,
    updateOrderStatus: updateOrderStatus,
    // Employees
    getEmployees: getEmployees,
    getEmployee: getEmployee,
    addEmployee: addEmployee,
    updateEmployee: updateEmployee,
    removeEmployee: removeEmployee,
    // Shop Hours
    getShopHours: getShopHours,
    setShopHours: setShopHours,
    // Closed Dates
    getClosedDates: getClosedDates,
    addClosedDate: addClosedDate,
    removeClosedDate: removeClosedDate,
    // Shift Requests
    getShiftRequests: getShiftRequests,
    createShiftRequest: createShiftRequest,
    updateShiftRequest: updateShiftRequest,
    // Inventory
    getInventory: getInventory,
    getInventoryItem: getInventoryItem,
    updateStock: updateStock,
    // Shop Config
    getShopConfig: getShopConfig,
    updateShopConfig: updateShopConfig,
    // Customers
    getCustomers: getCustomers,
    addCustomer: addCustomer,
    // Incoming
    getIncoming: getIncoming,
    getIncomingOrder: getIncomingOrder,
    createIncoming: createIncoming,
    receiveIncoming: receiveIncoming,
    dismissIncoming: dismissIncoming,
    // Notifications
    getNotifications: getNotifications,
    addNotification: addNotification,
    markRead: markRead,
    markAllRead: markAllRead,
    dismissNotification: dismissNotification,
    // Drivers
    getDrivers: getDrivers,
    createDriver: createDriver,
    updateDriver: updateDriver,
    deleteDriver: deleteDriver,
    // Driver Assignments
    getDriverAssignments: getDriverAssignments,
    createDriverAssignment: createDriverAssignment,
    updateDriverAssignment: updateDriverAssignment,
    // Photos
    getPhotos: getPhotos,
    uploadPhoto: uploadPhoto,
    deletePhoto: deletePhoto,
    // Audit
    getAuditLog: getAuditLog,
    // Events
    on: on,
    off: off,
    // Sync
    syncFromServer: syncFromServer,
    // Reset
    resetAll: resetAll
  };

})();
