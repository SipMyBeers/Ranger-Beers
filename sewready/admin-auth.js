// ══════════════════════════════════════════════════════════════
//  SewReady — Admin Auth Gate (Phase 3: Session-Based)
//  Loaded FIRST on all admin pages. Checks session via
//  GET /api/auth/me, falls back to legacy password if no
//  admin_users exist for the shop.
// ══════════════════════════════════════════════════════════════

(function () {
  var slug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'sewready';
  var SESSION_KEY = slug + '-admin-session';
  var legacyPassword = (typeof shopConfig !== 'undefined' && shopConfig.adminPassword) ? shopConfig.adminPassword : null;

  // Block the page until auth resolves
  document.documentElement.style.visibility = 'hidden';

  // ── Check session via API ────────────────────────────────
  function checkSession() {
    return fetch('/api/auth/me', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.user) {
          window.currentUser = data.user;
          sessionStorage.setItem(SESSION_KEY, 'authenticated');
          revealPage();
          return true;
        }
        return false;
      })
      .catch(function () { return false; });
  }

  function revealPage() {
    document.documentElement.style.visibility = 'visible';
    document.body.style.visibility = 'visible';
    var overlay = document.getElementById('adminAuthOverlay');
    if (overlay) overlay.remove();
  }

  // ── Login Form Submission ────────────────────────────────
  function attemptLogin(email, password, errorEl) {
    return fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password, shop_slug: slug })
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (res.ok && res.data.user) {
        window.currentUser = res.data.user;
        sessionStorage.setItem(SESSION_KEY, 'authenticated');
        revealPage();
        return true;
      } else {
        errorEl.textContent = res.data.error || 'Invalid credentials';
        errorEl.style.display = 'block';
        return false;
      }
    })
    .catch(function () {
      // Offline fallback: try legacy password
      if (legacyPassword && password === legacyPassword) {
        window.currentUser = { id: 'legacy', name: (typeof shopConfig !== 'undefined' ? shopConfig.name : 'Shop') + ' Owner', role: 'owner', shop_slug: slug };
        sessionStorage.setItem(SESSION_KEY, 'authenticated');
        revealPage();
        return true;
      }
      errorEl.textContent = 'Connection error. Please try again.';
      errorEl.style.display = 'block';
      return false;
    });
  }

  // ── Build Login Overlay ──────────────────────────────────
  function showLoginForm() {
    document.body.style.visibility = 'hidden';

    var themeColor = '#a855f7';
    var shopName = 'Shop Admin';
    if (typeof shopConfig !== 'undefined') {
      if (shopConfig.themeColors && shopConfig.themeColors.primary) themeColor = shopConfig.themeColors.primary;
      if (shopConfig.name) shopName = shopConfig.name;
    }

    var overlay = document.createElement('div');
    overlay.id = 'adminAuthOverlay';
    overlay.innerHTML =
      '<div style="position:fixed;inset:0;background:#0e1528;display:flex;align-items:center;justify-content:center;z-index:99999;font-family:Inter,sans-serif">' +
        '<div style="background:#141d33;border:1px solid rgba(240,232,220,.1);border-radius:16px;padding:40px;max-width:360px;width:90%;text-align:center">' +
          '<div style="font-size:32px;margin-bottom:8px">&#9986;</div>' +
          '<h2 style="color:#f0e8dc;margin:0 0 4px;font-size:20px" id="authShopName">' + shopName + '</h2>' +
          '<p style="color:rgba(240,232,220,.5);font-size:13px;margin:0 0 24px">Sign in to your admin account</p>' +
          '<input type="email" id="adminEmailInput" placeholder="Email" ' +
            'style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:8px;border:1px solid rgba(240,232,220,.1);background:rgba(240,232,220,.06);color:#f0e8dc;font-size:14px;outline:none;margin-bottom:10px">' +
          '<input type="password" id="adminPassInput" placeholder="Password" ' +
            'style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:8px;border:1px solid rgba(240,232,220,.1);background:rgba(240,232,220,.06);color:#f0e8dc;font-size:14px;outline:none;margin-bottom:12px">' +
          '<div id="adminAuthError" style="color:#e74c3c;font-size:12px;margin-bottom:12px;display:none">Incorrect password</div>' +
          '<button id="adminPassBtn" ' +
            'style="width:100%;padding:10px;border:none;border-radius:8px;background:' + themeColor + ';color:#fff;font-size:14px;font-weight:600;cursor:pointer">Sign In</button>' +
          '<div style="margin-top:16px;text-align:center">' +
            '<a href="#" id="forgotPassLink" style="color:rgba(240,232,220,.5);font-size:12px;text-decoration:none">Forgot password?</a>' +
          '</div>' +
          '<div id="forgotPassForm" style="display:none;margin-top:16px;text-align:center">' +
            '<p style="color:rgba(240,232,220,.5);font-size:12px;margin:0 0 10px">Enter your email to receive a reset link</p>' +
            '<input type="email" id="forgotEmailInput" placeholder="Email address" ' +
              'style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:8px;border:1px solid rgba(240,232,220,.1);background:rgba(240,232,220,.06);color:#f0e8dc;font-size:14px;outline:none;margin-bottom:10px">' +
            '<button id="forgotSendBtn" ' +
              'style="width:100%;padding:10px;border:none;border-radius:8px;background:' + themeColor + ';color:#fff;font-size:13px;font-weight:600;cursor:pointer">Send Reset Link</button>' +
            '<div id="forgotMsg" style="font-size:12px;margin-top:8px;display:none"></div>' +
            '<a href="#" id="backToLoginLink" style="color:rgba(240,232,220,.5);font-size:12px;text-decoration:none;display:inline-block;margin-top:8px">&larr; Back to sign in</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.style.visibility = 'visible';
    document.documentElement.style.visibility = 'visible';

    var emailInput = document.getElementById('adminEmailInput');
    var passInput = document.getElementById('adminPassInput');
    var btn = document.getElementById('adminPassBtn');
    var err = document.getElementById('adminAuthError');

    function doLogin() {
      var email = emailInput.value.trim();
      var pass = passInput.value;
      if (!email && pass && legacyPassword) {
        // Legacy mode: password-only login (no email needed for old password gate)
        if (pass === legacyPassword) {
          window.currentUser = { id: 'legacy', name: shopName + ' Owner', role: 'owner', shop_slug: slug };
          sessionStorage.setItem(SESSION_KEY, 'authenticated');
          revealPage();
          return;
        }
      }
      if (!email || !pass) {
        err.textContent = 'Enter email and password';
        err.style.display = 'block';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Signing in...';
      attemptLogin(email, pass, err).then(function (ok) {
        if (!ok) {
          btn.disabled = false;
          btn.textContent = 'Sign In';
          passInput.value = '';
          passInput.focus();
        }
      });
    }

    btn.addEventListener('click', doLogin);
    passInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    emailInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') passInput.focus(); });
    emailInput.focus();

    // ── Forgot Password ──────────────────────────────────
    var forgotLink = document.getElementById('forgotPassLink');
    var forgotForm = document.getElementById('forgotPassForm');
    var forgotEmailInput = document.getElementById('forgotEmailInput');
    var forgotSendBtn = document.getElementById('forgotSendBtn');
    var forgotMsg = document.getElementById('forgotMsg');
    var backToLogin = document.getElementById('backToLoginLink');

    forgotLink.addEventListener('click', function (e) {
      e.preventDefault();
      emailInput.parentElement && (emailInput.style.display = 'none');
      passInput.style.display = 'none';
      err.style.display = 'none';
      btn.style.display = 'none';
      forgotLink.style.display = 'none';
      forgotForm.style.display = 'block';
      forgotEmailInput.focus();
    });

    backToLogin.addEventListener('click', function (e) {
      e.preventDefault();
      emailInput.style.display = '';
      passInput.style.display = '';
      btn.style.display = '';
      forgotLink.style.display = '';
      forgotForm.style.display = 'none';
      forgotMsg.style.display = 'none';
      emailInput.focus();
    });

    forgotSendBtn.addEventListener('click', function () {
      var femail = forgotEmailInput.value.trim();
      if (!femail) {
        forgotMsg.textContent = 'Enter your email address';
        forgotMsg.style.color = '#e74c3c';
        forgotMsg.style.display = 'block';
        return;
      }
      forgotSendBtn.disabled = true;
      forgotSendBtn.textContent = 'Sending...';
      fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: femail, shop_slug: slug })
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        forgotMsg.textContent = data.message || 'Reset link sent! Check your email.';
        forgotMsg.style.color = '#2ecc71';
        forgotMsg.style.display = 'block';
        forgotSendBtn.textContent = 'Sent';
      })
      .catch(function () {
        forgotMsg.textContent = 'Connection error. Please try again.';
        forgotMsg.style.color = '#e74c3c';
        forgotMsg.style.display = 'block';
        forgotSendBtn.disabled = false;
        forgotSendBtn.textContent = 'Send Reset Link';
      });
    });
  }

  // ── Reset Token Handler ──────────────────────────────
  function checkResetToken() {
    var params = new URLSearchParams(window.location.search);
    var resetToken = params.get('reset_token');
    if (!resetToken) return false;

    // Show reset password form instead of login
    document.body.style.visibility = 'hidden';
    var themeColor = '#a855f7';
    var shopName = 'Shop Admin';
    if (typeof shopConfig !== 'undefined') {
      if (shopConfig.themeColors && shopConfig.themeColors.primary) themeColor = shopConfig.themeColors.primary;
      if (shopConfig.name) shopName = shopConfig.name;
    }

    var overlay = document.createElement('div');
    overlay.id = 'adminAuthOverlay';
    overlay.innerHTML =
      '<div style="position:fixed;inset:0;background:#0e1528;display:flex;align-items:center;justify-content:center;z-index:99999;font-family:Inter,sans-serif">' +
        '<div style="background:#141d33;border:1px solid rgba(240,232,220,.1);border-radius:16px;padding:40px;max-width:360px;width:90%;text-align:center">' +
          '<div style="font-size:32px;margin-bottom:8px">&#128272;</div>' +
          '<h2 style="color:#f0e8dc;margin:0 0 4px;font-size:20px">Set New Password</h2>' +
          '<p style="color:rgba(240,232,220,.5);font-size:13px;margin:0 0 24px">' + shopName + '</p>' +
          '<input type="password" id="resetPass1" placeholder="New password (min 6 characters)" ' +
            'style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:8px;border:1px solid rgba(240,232,220,.1);background:rgba(240,232,220,.06);color:#f0e8dc;font-size:14px;outline:none;margin-bottom:10px">' +
          '<input type="password" id="resetPass2" placeholder="Confirm new password" ' +
            'style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:8px;border:1px solid rgba(240,232,220,.1);background:rgba(240,232,220,.06);color:#f0e8dc;font-size:14px;outline:none;margin-bottom:12px">' +
          '<div id="resetError" style="color:#e74c3c;font-size:12px;margin-bottom:12px;display:none"></div>' +
          '<div id="resetSuccess" style="color:#2ecc71;font-size:12px;margin-bottom:12px;display:none"></div>' +
          '<button id="resetBtn" ' +
            'style="width:100%;padding:10px;border:none;border-radius:8px;background:' + themeColor + ';color:#fff;font-size:14px;font-weight:600;cursor:pointer">Reset Password</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.style.visibility = 'visible';
    document.documentElement.style.visibility = 'visible';

    var pass1 = document.getElementById('resetPass1');
    var pass2 = document.getElementById('resetPass2');
    var resetBtn = document.getElementById('resetBtn');
    var resetErr = document.getElementById('resetError');
    var resetOk = document.getElementById('resetSuccess');

    resetBtn.addEventListener('click', function () {
      var p1 = pass1.value, p2 = pass2.value;
      if (!p1 || p1.length < 6) {
        resetErr.textContent = 'Password must be at least 6 characters';
        resetErr.style.display = 'block';
        return;
      }
      if (p1 !== p2) {
        resetErr.textContent = 'Passwords do not match';
        resetErr.style.display = 'block';
        return;
      }
      resetBtn.disabled = true;
      resetBtn.textContent = 'Resetting...';
      resetErr.style.display = 'none';

      fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: p1 })
      })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (res.ok && res.data.ok) {
          resetOk.textContent = res.data.message || 'Password reset! Redirecting to login...';
          resetOk.style.display = 'block';
          resetBtn.style.display = 'none';
          // Remove token from URL and reload to show login
          var cleanUrl = window.location.pathname;
          setTimeout(function () { window.location.href = cleanUrl; }, 2000);
        } else {
          resetErr.textContent = res.data.error || 'Reset failed';
          resetErr.style.display = 'block';
          resetBtn.disabled = false;
          resetBtn.textContent = 'Reset Password';
        }
      })
      .catch(function () {
        resetErr.textContent = 'Connection error. Please try again.';
        resetErr.style.display = 'block';
        resetBtn.disabled = false;
        resetBtn.textContent = 'Reset Password';
      });
    });

    pass1.focus();
    return true;
  }

  // ── Main Flow ────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // Preview mode — skip login for demo iframes
    var params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1') {
      window.currentUser = { id: 'preview', name: 'Preview', role: 'viewer', shop_slug: slug };
      revealPage();
      return;
    }

    // Check for password reset token first
    if (checkResetToken()) return;

    checkSession().then(function (valid) {
      if (!valid) {
        showLoginForm();
      }
    });
  });
})();
