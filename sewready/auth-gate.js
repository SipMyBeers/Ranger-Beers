// ══════════════════════════════════════════════════════════════
//  SewReady — Role-Based UI Gate
//  Loaded AFTER admin-auth.js on all admin pages.
//  Hides/restricts UI elements based on window.currentUser.role.
//
//  Roles:
//    owner    → full access
//    manager  → everything except Settings > Billing, password changes
//    employee → only their assigned orders, no Settings/Billing
// ══════════════════════════════════════════════════════════════

(function () {
  function applyGating() {
    var user = window.currentUser;
    if (!user || user.role === 'owner') return; // owners see everything

    var role = user.role; // 'manager' or 'employee'

    // ── Sidebar Navigation Restrictions ────────────────────
    var sidebarLinks = document.querySelectorAll('.sidebar-nav a, .sidebar a[href]');
    sidebarLinks.forEach(function (link) {
      var href = (link.getAttribute('href') || '').toLowerCase();

      // Employees: hide Settings, Billing, Services, Inventory, SOP Library, Calendar, Analytics
      if (role === 'employee') {
        var employeeHidden = ['settings', 'services', 'inventory', 'sop-library', 'calendar', 'analytics', 'employee.html'];
        var shouldHide = employeeHidden.some(function (page) { return href.indexOf(page) !== -1; });
        if (shouldHide) {
          link.closest('li') ? link.closest('li').style.display = 'none' : link.style.display = 'none';
        }
      }
    });

    // ── Settings Page Restrictions ─────────────────────────
    if (role === 'manager') {
      // Hide billing section on settings page
      var billingSections = document.querySelectorAll('[data-section="billing"], .billing-section, #billingSection');
      billingSections.forEach(function (el) { el.style.display = 'none'; });

      // Hide password change inputs
      var pwdFields = document.querySelectorAll('[data-section="password"], .password-section, #passwordSection');
      pwdFields.forEach(function (el) { el.style.display = 'none'; });
    }

    // ── Employee-specific restrictions on orders page ──────
    if (role === 'employee') {
      // Add a data attribute so orders.js can filter by employee
      document.body.setAttribute('data-user-role', 'employee');
      document.body.setAttribute('data-user-employee-id', user.employee_id || '');
      document.body.setAttribute('data-user-name', user.name || '');
    }

    // ── Display current user badge ─────────────────────────
    var header = document.querySelector('.header, .topbar, header');
    if (header && user.name) {
      var badge = document.createElement('div');
      badge.className = 'user-badge';
      badge.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:auto;padding:4px 12px;border-radius:8px;background:rgba(240,232,220,0.06);font-size:13px;color:rgba(240,232,220,0.7)';
      var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
      badge.innerHTML = '<span style="font-weight:600;color:#f0e8dc">' + user.name + '</span>' +
        '<span style="padding:2px 8px;border-radius:4px;background:rgba(168,85,247,0.15);color:#a855f7;font-size:11px;font-weight:600">' + roleLabel + '</span>' +
        '<button id="logoutBtn" style="background:none;border:none;color:rgba(240,232,220,0.5);cursor:pointer;font-size:12px;padding:4px 8px">Sign Out</button>';
      header.appendChild(badge);

      document.getElementById('logoutBtn').addEventListener('click', function () {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
          .finally(function () {
            var slug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'sewready';
            sessionStorage.removeItem(slug + '-admin-session');
            window.currentUser = null;
            location.reload();
          });
      });
    }
  }

  // Run after auth resolves
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      // Small delay to ensure admin-auth.js has set window.currentUser
      setTimeout(applyGating, 100);
    });
  } else {
    setTimeout(applyGating, 100);
  }

  // Also run when auth completes (for dynamic login)
  var origReveal = window.__authRevealed;
  window.__onAuthReady = applyGating;
})();
