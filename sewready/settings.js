document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('settingsForm');
  const toast = document.getElementById('toast');

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('toast-show');
    setTimeout(() => toast.classList.remove('toast-show'), 3000);
  }

  // ── Populate form from DataStore shop config ──
  const config = DataStore.getShopConfig();
  const shopNameInput = document.getElementById('shopName');
  const shopAddressInput = document.getElementById('shopAddress');
  const shopPhoneInput = document.getElementById('shopPhone');
  const shopEmailInput = document.getElementById('shopEmail');
  if (shopNameInput) shopNameInput.value = config.name || '';
  if (shopAddressInput) shopAddressInput.value = config.address || '';
  if (shopPhoneInput) shopPhoneInput.value = config.phone || '';
  if (shopEmailInput) shopEmailInput.value = config.email || '';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const changes = {};
    if (shopNameInput) changes.name = shopNameInput.value;
    if (shopAddressInput) changes.address = shopAddressInput.value;
    if (shopPhoneInput) changes.phone = shopPhoneInput.value;
    if (shopEmailInput) changes.email = shopEmailInput.value;
    DataStore.updateShopConfig(changes);
    // Update .shop-name elements on the page
    document.querySelectorAll('.shop-name').forEach(el => { el.textContent = changes.name || config.name; });
    showToast('Settings saved successfully!');
  });

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

  // ══════════════════════════════════════════════════════════
  //  EMPLOYEE SCHEDULE EDITOR
  // ══════════════════════════════════════════════════════════

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ── Master Render ──────────────────────────────────────────
  function renderScheduleSection() {
    renderShiftRequests();
    renderEmployeeCards();
    renderClosedDates();
  }

  // ── Shift Requests ─────────────────────────────────────────
  function renderShiftRequests() {
    const container = document.getElementById('schedRequests');
    if (shiftRequests.length === 0) {
      container.innerHTML = '<p class="sched-no-requests">No pending shift requests.</p>';
      return;
    }

    container.innerHTML = shiftRequests.map(req => {
      const emp = employees.find(e => e.id === req.employeeId);
      const swapEmp = req.preferredSwap ? employees.find(e => e.id === req.preferredSwap) : null;
      const empName = emp ? emp.name : 'Unknown';
      const empColor = emp ? emp.color : '#888';

      const typeLabels = { 'day-off': 'Day Off', 'change-hours': 'Change Hours', 'swap': 'Swap With Coworker' };
      const typeLabel = typeLabels[req.type] || req.type;

      const isPending = req.status === 'pending';

      return '<div class="sched-request-card" data-status="' + req.status + '" data-id="' + req.id + '">' +
        '<div class="sched-request-icon">&#128197;</div>' +
        '<div class="sched-request-body">' +
          '<div class="sched-request-title">' +
            '<span class="sched-emp-dot" style="background:' + empColor + '"></span> ' +
            empName + ' — ' + typeLabel +
            ' <span class="sched-request-status ' + req.status + '">' + req.status.charAt(0).toUpperCase() + req.status.slice(1) + '</span>' +
          '</div>' +
          '<div class="sched-request-detail">Date: ' + req.date +
            (swapEmp ? ' &middot; Preferred swap: ' + swapEmp.name : '') +
          '</div>' +
          (req.reason ? '<div class="sched-request-reason">"' + req.reason + '"</div>' : '') +
          '<div class="sched-request-time">Submitted: ' + req.submittedAt + '</div>' +
        '</div>' +
        (isPending ?
          '<div class="sched-request-actions">' +
            '<button class="sched-approve-btn" data-id="' + req.id + '">Approve</button>' +
            '<button class="sched-deny-btn" data-id="' + req.id + '">Deny</button>' +
          '</div>' : '') +
      '</div>';
    }).join('');

    // Event delegation for approve/deny
    container.querySelectorAll('.sched-approve-btn').forEach(btn => {
      btn.addEventListener('click', () => approveRequest(btn.dataset.id));
    });
    container.querySelectorAll('.sched-deny-btn').forEach(btn => {
      btn.addEventListener('click', () => denyRequest(btn.dataset.id));
    });
  }

  function approveRequest(reqId) {
    const req = shiftRequests.find(r => r.id === reqId);
    if (!req) return;
    DataStore.updateShiftRequest(reqId, { status: 'approved' });

    // Update employee schedule for that date's day-of-week
    if (req.type === 'day-off') {
      const emp = employees.find(e => e.id === req.employeeId);
      if (emp) {
        const dow = new Date(req.date + 'T00:00:00').getDay();
        emp.schedule[dow] = null;
        DataStore.updateEmployee(emp.id, { schedule: emp.schedule });
      }
    } else if (req.type === 'change-hours' && req.requestedShift) {
      const emp = employees.find(e => e.id === req.employeeId);
      if (emp) {
        const dow = new Date(req.date + 'T00:00:00').getDay();
        emp.schedule[dow] = { start: req.requestedShift.start, end: req.requestedShift.end };
        DataStore.updateEmployee(emp.id, { schedule: emp.schedule });
      }
    }

    showToast('Shift request approved!');
    renderScheduleSection();
  }

  function denyRequest(reqId) {
    DataStore.updateShiftRequest(reqId, { status: 'denied' });
    showToast('Shift request denied.');
    renderScheduleSection();
  }

  // ── Employee Cards ─────────────────────────────────────────
  function renderEmployeeCards() {
    const container = document.getElementById('schedEmployeeList');

    container.innerHTML = employees.map((emp, idx) => {
      let weekHtml = '';
      for (let d = 0; d < 7; d++) {
        const sched = emp.schedule[d];
        if (sched) {
          weekHtml += '<div class="sched-day sched-day-on">' +
            '<div class="sched-day-label">' + dayNames[d] + '</div>' +
            '<input type="time" class="sched-time-input" data-emp="' + emp.id + '" data-dow="' + d + '" data-field="start" value="' + sched.start + '">' +
            '<input type="time" class="sched-time-input" data-emp="' + emp.id + '" data-dow="' + d + '" data-field="end" value="' + sched.end + '">' +
            '<button class="sched-day-toggle" data-emp="' + emp.id + '" data-dow="' + d + '" data-action="off" title="Set day off">&#10005;</button>' +
          '</div>';
        } else {
          weekHtml += '<div class="sched-day sched-day-off">' +
            '<div class="sched-day-label">' + dayNames[d] + '</div>' +
            '<span class="sched-off-label">Off</span>' +
            '<button class="sched-day-toggle" data-emp="' + emp.id + '" data-dow="' + d + '" data-action="on" title="Set working">&#10003;</button>' +
          '</div>';
        }
      }

      const empUrl = 'employee.html?id=' + emp.id;

      return '<div class="sched-emp-card" data-emp-id="' + emp.id + '">' +
        '<div class="sched-emp-header">' +
          '<span class="sched-emp-dot" style="background:' + emp.color + '"></span>' +
          '<span class="sched-emp-name">' + emp.name + '</span>' +
          '<span class="sched-emp-role">' + emp.role + '</span>' +
          '<button class="sched-emp-remove" data-emp="' + emp.id + '" title="Remove employee">&times;</button>' +
        '</div>' +
        '<div class="sched-week-grid">' + weekHtml + '</div>' +
        '<div class="sched-emp-link">' +
          '<span class="sched-emp-link-url">' + empUrl + '</span>' +
          '<button class="sched-emp-link-copy" data-url="' + empUrl + '">Copy</button>' +
        '</div>' +
      '</div>';
    }).join('');

    // Event delegation — time inputs
    container.querySelectorAll('.sched-time-input').forEach(input => {
      input.addEventListener('change', () => {
        const emp = employees.find(e => e.id === input.dataset.emp);
        if (!emp) return;
        const dow = parseInt(input.dataset.dow);
        if (!emp.schedule[dow]) emp.schedule[dow] = { start: '08:00', end: '18:00' };
        emp.schedule[dow][input.dataset.field] = input.value;
        DataStore.updateEmployee(emp.id, { schedule: emp.schedule });
      });
    });

    // Day toggles
    container.querySelectorAll('.sched-day-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const emp = employees.find(e => e.id === btn.dataset.emp);
        if (!emp) return;
        const dow = parseInt(btn.dataset.dow);
        if (btn.dataset.action === 'off') {
          emp.schedule[dow] = null;
        } else {
          emp.schedule[dow] = { start: '08:00', end: '18:00' };
        }
        DataStore.updateEmployee(emp.id, { schedule: emp.schedule });
        renderEmployeeCards();
      });
    });

    // Remove employee
    container.querySelectorAll('.sched-emp-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        DataStore.removeEmployee(btn.dataset.emp);
        renderEmployeeCards();
        showToast('Employee removed.');
      });
    });

    // Copy link
    container.querySelectorAll('.sched-emp-link-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        navigator.clipboard.writeText(url).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        });
      });
    });
  }

  // ── Closed Dates ───────────────────────────────────────────
  function renderClosedDates() {
    const list = document.getElementById('schedClosedList');
    list.innerHTML = closedDates.map(d =>
      '<span class="sched-closed-chip">' + d +
        '<button data-date="' + d + '">&times;</button>' +
      '</span>'
    ).join('');

    list.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        DataStore.removeClosedDate(btn.dataset.date);
        renderClosedDates();
      });
    });
  }

  document.getElementById('addClosedDateBtn').addEventListener('click', () => {
    const input = document.getElementById('newClosedDate');
    const val = input.value;
    if (val && !closedDates.includes(val)) {
      DataStore.addClosedDate(val);
      input.value = '';
      renderClosedDates();
    }
  });

  // ── Add Employee ───────────────────────────────────────────
  const addBtn = document.getElementById('addEmployeeBtn');
  const addForm = document.getElementById('addEmployeeForm');

  addBtn.addEventListener('click', () => {
    addForm.classList.toggle('visible');
  });

  document.getElementById('cancelAddEmp').addEventListener('click', () => {
    addForm.classList.remove('visible');
  });

  document.getElementById('confirmAddEmp').addEventListener('click', () => {
    const name = document.getElementById('newEmpName').value.trim();
    const role = document.getElementById('newEmpRole').value;
    const color = document.getElementById('newEmpColor').value;

    if (!name) return;

    DataStore.addEmployee({ name: name, role: role, color: color });

    document.getElementById('newEmpName').value = '';
    addForm.classList.remove('visible');
    renderEmployeeCards();
    showToast('Employee added!');
  });

  // ── Init ───────────────────────────────────────────────────
  renderScheduleSection();

  // ══════════════════════════════════════════════════════════
  //  BILLING & PLAN
  // ══════════════════════════════════════════════════════════

  const _SHOP_TIER = (typeof shopConfig !== 'undefined' && shopConfig.tier) || 'full';
  const _SHOP_SLUG = (typeof shopConfig !== 'undefined' && shopConfig.slug) || '';

  const tierBadge = document.getElementById('billingTierBadge');
  const billingStatus = document.getElementById('billingStatus');
  const pastDueWarning = document.getElementById('billingPastDueWarning');
  const upgradeOnlineBtn = document.getElementById('billingUpgradeOnline');
  const upgradeFullBtn = document.getElementById('billingUpgradeFull');
  const manageBtn = document.getElementById('billingManageBtn');

  // Tier badge styling
  const tierColors = {
    'storefront': { bg: 'rgba(249,115,22,.15)', color: '#f97316' },
    'online': { bg: 'rgba(59,130,246,.15)', color: '#3b82f6' },
    'full': { bg: 'rgba(34,197,94,.15)', color: '#22c55e' }
  };
  const tierLabels = { 'storefront': 'Storefront — Free', 'online': 'Online — $79/mo', 'full': 'Full — $149/mo' };

  function renderBilling() {
    if (!tierBadge) return;

    var tc = tierColors[_SHOP_TIER] || tierColors.storefront;
    tierBadge.textContent = tierLabels[_SHOP_TIER] || _SHOP_TIER;
    tierBadge.style.background = tc.bg;
    tierBadge.style.color = tc.color;

    // Show upgrade buttons based on current tier
    if (_SHOP_TIER === 'storefront') {
      if (upgradeOnlineBtn) upgradeOnlineBtn.style.display = 'inline-block';
      if (upgradeFullBtn) upgradeFullBtn.style.display = 'inline-block';
    } else if (_SHOP_TIER === 'online') {
      if (upgradeFullBtn) upgradeFullBtn.style.display = 'inline-block';
      if (manageBtn) manageBtn.style.display = 'inline-block';
    } else if (_SHOP_TIER === 'full') {
      if (manageBtn) manageBtn.style.display = 'inline-block';
      if (billingStatus) billingStatus.textContent = 'Active';
    }

    // Check URL params for billing result
    var params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'success') {
      showToast('Subscription activated! Welcome to your new plan.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('billing') === 'canceled') {
      showToast('Checkout canceled. No changes made.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  // Snipcart handles checkout via data attributes on the buttons.
  // Upgrade buttons are snipcart-add-item, Manage is snipcart-checkout.
  // Add shop slug as custom field so the webhook can identify the shop.
  if (upgradeOnlineBtn && _SHOP_SLUG) {
    upgradeOnlineBtn.setAttribute('data-item-custom1-name', 'Shop');
    upgradeOnlineBtn.setAttribute('data-item-custom1-value', _SHOP_SLUG);
    upgradeOnlineBtn.setAttribute('data-item-custom1-type', 'hidden');
  }
  if (upgradeFullBtn && _SHOP_SLUG) {
    upgradeFullBtn.setAttribute('data-item-custom1-name', 'Shop');
    upgradeFullBtn.setAttribute('data-item-custom1-value', _SHOP_SLUG);
    upgradeFullBtn.setAttribute('data-item-custom1-type', 'hidden');
  }

  renderBilling();

  // ══════════════════════════════════════════════════════════
  //  DRIVER SETUP SECTION
  // ══════════════════════════════════════════════════════════

  var driverSection = document.getElementById('driverSetup');
  if (driverSection) {
    function driverStatusBadge(d) {
      if (d.email && !d.reset_token) {
        return '<span style="padding:2px 8px;font-size:10px;font-weight:700;border-radius:4px;background:rgba(52,211,153,0.15);color:#34d399">Active</span>';
      }
      if (d.reset_token) {
        return '<span style="padding:2px 8px;font-size:10px;font-weight:700;border-radius:4px;background:rgba(250,204,21,0.15);color:#facc15">Invited</span>';
      }
      return '<span style="padding:2px 8px;font-size:10px;font-weight:700;border-radius:4px;background:rgba(148,163,184,0.15);color:#94a3b8">No account</span>';
    }

    function showInviteLinkModal(url, email) {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);padding:20px';
      overlay.innerHTML =
        '<div style="background:#141d33;border:1px solid rgba(240,232,220,0.1);border-radius:16px;padding:28px 24px;max-width:440px;width:100%">' +
          '<h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#fff">Driver Invite Link</h3>' +
          '<p style="margin:0 0 16px;font-size:13px;color:rgba(240,232,220,0.6)">Send this link to <strong style="color:#06b6d4">' + email + '</strong> to set up their password:</p>' +
          '<input id="inviteLinkInput" type="text" value="' + url + '" readonly style="width:100%;padding:10px 12px;font-size:13px;font-family:monospace;background:rgba(240,232,220,0.06);color:#f0e8dc;border:1px solid rgba(240,232,220,0.1);border-radius:8px;box-sizing:border-box;margin-bottom:12px">' +
          '<div style="display:flex;gap:8px">' +
            '<button id="inviteCopyBtn" style="flex:1;padding:10px;border:none;border-radius:8px;font-size:14px;font-weight:600;color:#fff;background:linear-gradient(135deg,#3a6ea5,#06b6d4);cursor:pointer">Copy Link</button>' +
            '<button id="inviteCloseBtn" style="padding:10px 20px;border:1px solid rgba(240,232,220,0.1);border-radius:8px;font-size:14px;font-weight:600;color:#f0e8dc;background:transparent;cursor:pointer">Close</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);

      document.getElementById('inviteCopyBtn').addEventListener('click', function () {
        var input = document.getElementById('inviteLinkInput');
        input.select();
        navigator.clipboard.writeText(input.value).then(function () {
          document.getElementById('inviteCopyBtn').textContent = 'Copied!';
        });
      });
      document.getElementById('inviteCloseBtn').addEventListener('click', function () {
        document.body.removeChild(overlay);
      });
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) document.body.removeChild(overlay);
      });
    }

    function renderDriverList() {
      DataStore.getDrivers().then(function (drivers) {
        var inputStyle = 'padding:6px 10px;border-radius:6px;border:1px solid rgba(240,232,220,0.1);background:rgba(240,232,220,0.06);color:#f0e8dc;font-size:13px';
        var html = '<div style="margin-bottom:12px">' +
          drivers.filter(function (d) { return d.active; }).map(function (d) {
            return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(240,232,220,0.06)">' +
              '<span style="flex:1;font-weight:500">' + d.name + '</span>' +
              '<span style="color:rgba(240,232,220,0.4);font-size:12px">' + (d.email || '') + '</span>' +
              driverStatusBadge(d) +
              '<span style="color:rgba(240,232,220,0.5);font-size:12px">' + (d.phone || 'No phone') + '</span>' +
              '<span style="color:rgba(240,232,220,0.4);font-size:12px">' + (d.vehicle || '') + '</span>' +
              '<button class="remove-driver-btn" data-id="' + d.id + '" style="padding:3px 10px;font-size:11px;background:rgba(231,76,60,0.1);color:#e74c3c;border:1px solid rgba(231,76,60,0.2);border-radius:4px;cursor:pointer">Remove</button>' +
            '</div>';
          }).join('') +
        '</div>';

        html += '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<input type="text" id="newDriverName" placeholder="Driver name" style="' + inputStyle + ';flex:1">' +
          '<input type="email" id="newDriverEmail" placeholder="Email (for login)" style="' + inputStyle + ';width:160px">' +
          '<input type="tel" id="newDriverPhone" placeholder="Phone" style="' + inputStyle + ';width:120px">' +
          '<input type="text" id="newDriverVehicle" placeholder="Vehicle" style="' + inputStyle + ';width:120px">' +
          '<button id="addDriverBtn" class="btn-primary" style="padding:6px 16px;font-size:13px">Add Driver</button>' +
        '</div>';

        driverSection.innerHTML = html;

        // Bind add button
        document.getElementById('addDriverBtn').addEventListener('click', function () {
          var name = document.getElementById('newDriverName').value.trim();
          if (!name) return;
          var email = document.getElementById('newDriverEmail').value.trim();
          var btn = document.getElementById('addDriverBtn');
          btn.disabled = true;
          btn.textContent = '...';
          DataStore.createDriver({
            name: name,
            phone: document.getElementById('newDriverPhone').value.trim(),
            vehicle: document.getElementById('newDriverVehicle').value.trim(),
            email: email || undefined
          }).then(function (result) {
            if (result && result.invite_token) {
              var inviteUrl = window.location.origin + '/driver.html?setup_token=' + result.invite_token;
              showInviteLinkModal(inviteUrl, email);
            }
            showToast('Driver added!');
            renderDriverList();
          }).catch(function () {
            showToast('Failed to add driver');
            btn.disabled = false;
            btn.textContent = 'Add Driver';
          });
        });

        // Bind remove buttons
        driverSection.querySelectorAll('.remove-driver-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            DataStore.deleteDriver(btn.dataset.id);
            setTimeout(renderDriverList, 500);
            showToast('Driver removed');
          });
        });
      });
    }
    renderDriverList();
  }

});
