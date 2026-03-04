// ============================================
// RANGER BEERS — Magic Link Auth + Course Gate
// Replaces Firebase auth.js — no SDK, no passwords
// ============================================

// Load config (must be loaded before this script)
const API_BASE = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE : 'https://ranger-beers-api.dzbeers747.workers.dev';

// Storage keys from config
const STORAGE_KEYS = typeof CONFIG !== 'undefined' ? CONFIG.STORAGE_KEYS : {
  TOKEN: 'rb_token',
  USER: 'rb_user',
  OFFLINE_QUEUE: 'rb_offline_queue'
};

// ── JWT Helpers ──
function getToken() { return localStorage.getItem(STORAGE_KEYS.TOKEN); }
function setToken(token) { localStorage.setItem(STORAGE_KEYS.TOKEN, token); }
function clearToken() { localStorage.removeItem(STORAGE_KEYS.TOKEN); localStorage.removeItem(STORAGE_KEYS.USER); }

function getUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)); } catch { return null; }
}
function setUser(user) { localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)); }

function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  // Check JWT expiry without verifying signature (server will verify)
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp > Date.now() / 1000;
  } catch { return false; }
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res.json();
}

// ── Course Access Cache ──
let _accessCache = null;
let _accessCacheTime = 0;

async function getCourseAccess() {
  if (_accessCache && Date.now() - _accessCacheTime < 60000) return _accessCache;
  if (!isLoggedIn()) return [];
  try {
    const data = await apiFetch('/courses/access');
    _accessCache = data.courses || [];
    _accessCacheTime = Date.now();
    return _accessCache;
  } catch { return []; }
}

function invalidateAccessCache() { _accessCache = null; }

// ── Auth Modal ──
function createAuthModal() {
  if (document.getElementById('auth-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.className = 'auth-modal-overlay';
  modal.innerHTML = `
    <div class="auth-modal">
      <button class="auth-modal-close" id="auth-close">&times;</button>

      <!-- MAGIC LINK FORM -->
      <div id="auth-magic-view">
        <div class="auth-modal-title">Sign In</div>
        <div class="auth-modal-subtitle">Enter your email and we'll send you a login link. No password needed.</div>
        <form id="auth-magic-form">
          <div class="auth-field">
            <label class="auth-label" for="magic-email">Email</label>
            <input type="email" class="auth-input" id="magic-email" placeholder="you@example.com" required>
          </div>
          <div id="magic-error" class="auth-error"></div>
          <div id="magic-success" class="auth-success" style="display:none;"></div>
          <button type="submit" class="btn btn-primary auth-submit" id="magic-submit">Send Login Link</button>
        </form>
      </div>

      <!-- PROFILE FORM (shown after first login) -->
      <div id="auth-profile-view" style="display:none;">
        <div class="auth-modal-title">Complete Your Profile</div>
        <div class="auth-modal-subtitle">Help us personalize your experience</div>
        <form id="auth-profile-form">
          <div class="auth-field">
            <label class="auth-label" for="profile-name">Full Name</label>
            <input type="text" class="auth-input" id="profile-name" placeholder="Last, First">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="profile-rank">Rank</label>
            <select class="auth-input auth-select" id="profile-rank">
              <option value="" disabled selected>Select rank...</option>
              <option value="E-1">E-1 (PVT)</option>
              <option value="E-2">E-2 (PV2)</option>
              <option value="E-3">E-3 (PFC)</option>
              <option value="E-4">E-4 (SPC/CPL)</option>
              <option value="E-5">E-5 (SGT)</option>
              <option value="E-6">E-6 (SSG)</option>
              <option value="E-7">E-7 (SFC)</option>
              <option value="E-8">E-8 (MSG/1SG)</option>
              <option value="E-9">E-9 (SGM/CSM)</option>
              <option value="O-1">O-1 (2LT)</option>
              <option value="O-2">O-2 (1LT)</option>
              <option value="O-3">O-3 (CPT)</option>
              <option value="O-4">O-4 (MAJ)</option>
              <option value="O-5">O-5 (LTC)</option>
              <option value="O-6">O-6 (COL)</option>
              <option value="Cadet">Cadet</option>
              <option value="Civilian">Civilian</option>
            </select>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="profile-branch">Branch</label>
            <select class="auth-input auth-select" id="profile-branch">
              <option value="" disabled selected>Select branch...</option>
              <option value="Army">Army</option>
              <option value="Marines">Marines</option>
              <option value="Navy">Navy</option>
              <option value="Air Force">Air Force</option>
              <option value="Space Force">Space Force</option>
              <option value="Civilian">Civilian</option>
            </select>
          </div>
          <div id="profile-error" class="auth-error"></div>
          <button type="submit" class="btn btn-primary auth-submit">Save Profile</button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  bindModalEvents();
}

function bindModalEvents() {
  const modal = document.getElementById('auth-modal');

  document.getElementById('auth-close').addEventListener('click', hideAuthModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideAuthModal();
  });

  // Magic link form
  document.getElementById('auth-magic-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('magic-email').value.trim();
    const errorEl = document.getElementById('magic-error');
    const successEl = document.getElementById('magic-success');
    const submitBtn = document.getElementById('magic-submit');
    errorEl.textContent = '';
    successEl.style.display = 'none';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const data = await apiFetch('/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (data.error) {
        errorEl.textContent = data.error;
      } else {
        successEl.textContent = 'Login link sent! Check your email (including spam folder).';
        successEl.style.display = 'block';
        document.getElementById('auth-magic-form').querySelector('.auth-field').style.display = 'none';
      }
    } catch {
      errorEl.textContent = 'Something went wrong. Please try again.';
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Login Link';
  });

  // Profile form
  document.getElementById('auth-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('profile-error');
    const submitBtn = document.querySelector('#auth-profile-form button[type="submit"]');
    errorEl.textContent = '';

    // Loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    try {
      await apiFetch('/auth/profile', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('profile-name').value,
          rank: document.getElementById('profile-rank').value,
          branch: document.getElementById('profile-branch').value,
        }),
      });

      // Update local user cache
      const user = getUser();
      if (user) {
        user.name = document.getElementById('profile-name').value;
        user.rank = document.getElementById('profile-rank').value;
        user.branch = document.getElementById('profile-branch').value;
        setUser(user);
      }

      hideAuthModal();
      updateNavUI();
    } catch {
      errorEl.textContent = 'Failed to save profile. Please try again.';
    } finally {
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Complete Profile';
      }
    }
  });
}

function showAuthModal() {
  createAuthModal();
  const modal = document.getElementById('auth-modal');

  // Reset to magic link view
  document.getElementById('auth-magic-view').style.display = 'block';
  document.getElementById('auth-profile-view').style.display = 'none';

  // Reset form state
  const form = document.getElementById('auth-magic-form');
  const field = form.querySelector('.auth-field');
  if (field) field.style.display = '';
  document.getElementById('magic-error').textContent = '';
  document.getElementById('magic-success').style.display = 'none';
  document.getElementById('magic-email').value = '';

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showProfileModal() {
  createAuthModal();
  const modal = document.getElementById('auth-modal');
  document.getElementById('auth-magic-view').style.display = 'none';
  document.getElementById('auth-profile-view').style.display = 'block';

  const user = getUser();
  if (user) {
    document.getElementById('profile-name').value = user.name || '';
    if (user.rank) document.getElementById('profile-rank').value = user.rank;
    if (user.branch) document.getElementById('profile-branch').value = user.branch;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ── Nav Auth UI ──
function updateNavUI() {
  const signInBtn = document.getElementById('nav-auth-btn');
  const userInfo = document.getElementById('nav-user-info');
  const userName = document.getElementById('nav-user-name');

  if (!signInBtn) return;

  if (isLoggedIn()) {
    signInBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    const user = getUser();
    if (userName && user) {
      userName.textContent = user.rank && user.name ? `${user.rank} ${user.name}` : user.name || user.email;
    }
  } else {
    signInBtn.style.display = '';
    if (userInfo) userInfo.style.display = 'none';
  }
}

function initAuthUI() {
  updateNavUI();

  const signInBtn = document.getElementById('nav-auth-btn');
  if (signInBtn) {
    signInBtn.addEventListener('click', showAuthModal);
  }

  const signOutBtn = document.getElementById('nav-sign-out');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      clearToken();
      invalidateAccessCache();
      updateNavUI();
      // Reload to reset course gate state
      window.location.reload();
    });
  }
}

// ── Course Gate (3 states) ──
async function initCourseGate() {
  const courseContent = document.getElementById('course-content');
  const loginGate = document.getElementById('login-gate');
  if (!courseContent || !loginGate) return;

  // Get course ID from hero section data attribute
  const hero = document.querySelector('[data-course-id]');
  const courseId = hero ? hero.dataset.courseId : null;

  // Free courses — show everything
  if (courseId && ['course-recycle'].includes(courseId)) {
    courseContent.style.display = 'block';
    loginGate.style.display = 'none';
    return;
  }

  if (!isLoggedIn()) {
    // State 1: Not logged in — show auth gate
    courseContent.style.display = 'none';
    loginGate.style.display = 'block';

    const gateBtn = document.getElementById('gate-sign-in');
    if (gateBtn) gateBtn.addEventListener('click', showAuthModal);
    const gateSignup = document.getElementById('gate-create-account');
    if (gateSignup) gateSignup.addEventListener('click', (e) => { e.preventDefault(); showAuthModal(); });
    return;
  }

  // Logged in — check access
  const access = await getCourseAccess();
  const hasAccess = courseId && access.includes(courseId);

  if (hasAccess) {
    // State 3: Logged in + owns course — show all modules
    courseContent.style.display = 'block';
    loginGate.style.display = 'none';

    // Unlock all locked modules
    document.querySelectorAll('.locked-module').forEach(el => {
      el.classList.remove('locked-module');
    });
  } else {
    // State 2: Logged in, no access — show Module 1 as preview, lock rest
    courseContent.style.display = 'block';
    loginGate.style.display = 'none';

    // Show purchase gate instead of login gate
    showPurchaseGate(courseId);
  }
}

function showPurchaseGate(courseId) {
  const loginGate = document.getElementById('login-gate');
  if (!loginGate) return;

  loginGate.style.display = 'block';
  loginGate.innerHTML = `
    <div class="login-gate-card">
      <div class="login-gate-title">Purchase Required</div>
      <div class="login-gate-desc">
        Module 1 is free to preview. Purchase this course or a bundle to unlock all modules, quizzes, and progress tracking.
      </div>
      <a href="courses.html#bundles" class="btn btn-primary" style="width:100%; text-align:center; text-decoration:none;">View Course Bundles</a>
      <div style="text-align:center; margin-top:12px; color:var(--color-text-muted); font-size:13px;">
        Already purchased? Try <a href="#" id="gate-refresh-access" style="color:var(--color-gold);">refreshing your access</a>
      </div>
    </div>
  `;

  const refreshLink = document.getElementById('gate-refresh-access');
  if (refreshLink) {
    refreshLink.addEventListener('click', async (e) => {
      e.preventDefault();
      invalidateAccessCache();
      await initCourseGate();
    });
  }
}

// ── Courses Page: Owned/Not-Owned Badges ──
async function initCoursesPage() {
  if (!isLoggedIn()) return;

  const access = await getCourseAccess();
  document.querySelectorAll('[data-course-id]').forEach(card => {
    const courseId = card.dataset.courseId;
    const badge = card.querySelector('.course-owned-badge');
    if (access.includes(courseId)) {
      if (!badge) {
        const b = document.createElement('span');
        b.className = 'course-owned-badge';
        b.textContent = 'Owned';
        const meta = card.querySelector('.course-hero-meta') || card.querySelector('.course-card-tags');
        if (meta) meta.appendChild(b);
      }
    }
  });
}

// ── Handle Auth Callback (called from auth-callback.html) ──
async function handleAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const statusEl = document.getElementById('auth-status');

  if (!token) {
    if (statusEl) statusEl.textContent = 'Invalid login link.';
    return;
  }

  if (statusEl) statusEl.textContent = 'Verifying...';

  try {
    const data = await apiFetch('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    if (data.error) {
      if (statusEl) statusEl.textContent = data.error;
      return;
    }

    setToken(data.token);
    setUser(data.user);

    if (statusEl) statusEl.textContent = 'Signed in! Redirecting...';

    // Redirect to courses page or referring page
    const redirect = localStorage.getItem('rb_redirect') || 'courses.html';
    localStorage.removeItem('rb_redirect');
    setTimeout(() => { window.location.href = redirect; }, 1000);
  } catch {
    if (statusEl) statusEl.textContent = 'Verification failed. Please try again.';
  }
}

// ── Inventory Page Support ──
function initInventoryPage() {
  const inventoryContent = document.getElementById('inventory-content');
  const loginGate = document.getElementById('login-gate');
  if (!inventoryContent || !loginGate) return;

  if (isLoggedIn()) {
    inventoryContent.style.display = 'block';
    loginGate.style.display = 'none';
  } else {
    inventoryContent.style.display = 'none';
    loginGate.style.display = 'block';
  }

  const gateBtn = document.getElementById('gate-sign-in');
  if (gateBtn) gateBtn.addEventListener('click', showAuthModal);
  const gateSignup = document.getElementById('gate-create-account');
  if (gateSignup) gateSignup.addEventListener('click', (e) => { e.preventDefault(); showAuthModal(); });
}

// ── Exports ──
window.RangerAuth = {
  initAuthUI,
  initCourseGate,
  initCoursesPage,
  initInventoryPage,
  handleAuthCallback,
  showAuthModal,
  showProfileModal,
  isLoggedIn,
  getUser,
  getToken,
  getCourseAccess,
  invalidateAccessCache,
  apiFetch,
  API_BASE,
};
