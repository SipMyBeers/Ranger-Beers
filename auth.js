// ============================================
// RANGER BEERS — Shared Firebase Auth Module
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ── Firebase Config ──────────────────────────
// TODO: Replace with your Firebase project config from https://console.firebase.google.com
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ── Auth Modal HTML ──────────────────────────
function createAuthModal() {
    if (document.getElementById('auth-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'auth-modal-overlay';
    modal.innerHTML = `
        <div class="auth-modal">
            <button class="auth-modal-close" id="auth-close">&times;</button>

            <!-- LOGIN FORM -->
            <div id="auth-login-view">
                <div class="auth-modal-title">Sign In</div>
                <div class="auth-modal-subtitle">Access your Ranger Beers account</div>
                <form id="auth-login-form">
                    <div class="auth-field">
                        <label class="auth-label" for="login-email">Email</label>
                        <input type="email" class="auth-input" id="login-email" placeholder="you@example.com" required>
                    </div>
                    <div class="auth-field">
                        <label class="auth-label" for="login-password">Password</label>
                        <input type="password" class="auth-input" id="login-password" placeholder="Password" required>
                    </div>
                    <div id="login-error" class="auth-error"></div>
                    <button type="submit" class="btn btn-primary auth-submit">Sign In</button>
                </form>
                <div class="auth-toggle">Don't have an account? <a href="#" id="show-signup">Create Account</a></div>
            </div>

            <!-- SIGNUP FORM -->
            <div id="auth-signup-view" style="display:none;">
                <div class="auth-modal-title">Create Account</div>
                <div class="auth-modal-subtitle">Join the Ranger Beers community</div>
                <form id="auth-signup-form">
                    <div class="auth-field">
                        <label class="auth-label" for="signup-email">Email</label>
                        <input type="email" class="auth-input" id="signup-email" placeholder="you@example.com" required>
                    </div>
                    <div class="auth-field">
                        <label class="auth-label" for="signup-password">Password</label>
                        <input type="password" class="auth-input" id="signup-password" placeholder="Min 6 characters" required minlength="6">
                    </div>
                    <div class="auth-field">
                        <label class="auth-label" for="signup-confirm">Confirm Password</label>
                        <input type="password" class="auth-input" id="signup-confirm" placeholder="Confirm password" required minlength="6">
                    </div>
                    <div id="signup-error" class="auth-error"></div>
                    <button type="submit" class="btn btn-primary auth-submit">Create Account</button>
                </form>
                <div class="auth-toggle">Already have an account? <a href="#" id="show-login">Sign In</a></div>
            </div>

            <!-- PROFILE FORM (shown after signup) -->
            <div id="auth-profile-view" style="display:none;">
                <div class="auth-modal-title">Complete Your Profile</div>
                <div class="auth-modal-subtitle">Help us personalize your experience</div>

                <!-- Step 1 — About You -->
                <div id="profile-step-1" class="profile-step">
                    <div class="profile-step-label">Step 1 of 3 — About You</div>
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
                    <button type="button" class="btn btn-primary auth-submit" id="profile-next-1">Next</button>
                </div>

                <!-- Step 2 — Goals -->
                <div id="profile-step-2" class="profile-step" style="display:none;">
                    <div class="profile-step-label">Step 2 of 3 — Goals</div>
                    <div class="auth-field">
                        <label class="auth-label">Why are you using Ranger Beers?</label>
                        <div class="auth-checkbox-group">
                            <label class="auth-checkbox"><input type="checkbox" name="goals" value="preparing"> Preparing for Ranger School</label>
                            <label class="auth-checkbox"><input type="checkbox" name="goals" value="current"> Currently in Ranger School</label>
                            <label class="auth-checkbox"><input type="checkbox" name="goals" value="other-schools"> Prep for other schools</label>
                            <label class="auth-checkbox"><input type="checkbox" name="goals" value="gear"> General military gear</label>
                            <label class="auth-checkbox"><input type="checkbox" name="goals" value="browsing"> Just browsing</label>
                        </div>
                    </div>
                    <div class="auth-field">
                        <label class="auth-label">Schools interested in</label>
                        <div class="auth-checkbox-group">
                            <label class="auth-checkbox"><input type="checkbox" name="schools" value="ranger"> Ranger School</label>
                            <label class="auth-checkbox"><input type="checkbox" name="schools" value="airborne"> Airborne</label>
                            <label class="auth-checkbox"><input type="checkbox" name="schools" value="air-assault"> Air Assault</label>
                            <label class="auth-checkbox"><input type="checkbox" name="schools" value="sapper"> Sapper</label>
                            <label class="auth-checkbox"><input type="checkbox" name="schools" value="pathfinder"> Pathfinder</label>
                            <label class="auth-checkbox"><input type="checkbox" name="schools" value="mountain"> Mountain</label>
                            <label class="auth-checkbox"><input type="checkbox" name="schools" value="jungle"> Jungle</label>
                            <label class="auth-checkbox"><input type="checkbox" name="schools" value="other"> Other</label>
                        </div>
                    </div>
                    <div class="profile-nav-btns">
                        <button type="button" class="btn btn-outline" id="profile-back-2">Back</button>
                        <button type="button" class="btn btn-primary" id="profile-next-2">Next</button>
                    </div>
                </div>

                <!-- Step 3 — Needs Assessment -->
                <div id="profile-step-3" class="profile-step" style="display:none;">
                    <div class="profile-step-label">Step 3 of 3 — Needs</div>
                    <div class="auth-field">
                        <label class="auth-label">What do you need help with?</label>
                        <div class="auth-checkbox-group">
                            <label class="auth-checkbox"><input type="checkbox" name="needs" value="packing"> Packing list / gear</label>
                            <label class="auth-checkbox"><input type="checkbox" name="needs" value="pt"> Physical training</label>
                            <label class="auth-checkbox"><input type="checkbox" name="needs" value="landnav"> Land navigation</label>
                            <label class="auth-checkbox"><input type="checkbox" name="needs" value="tactical"> Tactical knowledge</label>
                            <label class="auth-checkbox"><input type="checkbox" name="needs" value="study"> Study materials</label>
                            <label class="auth-checkbox"><input type="checkbox" name="needs" value="all"> All of the above</label>
                        </div>
                    </div>
                    <div class="auth-field">
                        <label class="auth-label" for="profile-class-date">When is your class date?</label>
                        <input type="date" class="auth-input" id="profile-class-date">
                        <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 4px;">Leave blank if not sure yet</div>
                    </div>
                    <div class="profile-nav-btns">
                        <button type="button" class="btn btn-outline" id="profile-back-3">Back</button>
                        <button type="button" class="btn btn-primary" id="profile-submit">Complete Profile</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    bindModalEvents();
}

// ── Modal Event Binding ──────────────────────
function bindModalEvents() {
    const modal = document.getElementById('auth-modal');

    // Close modal
    document.getElementById('auth-close').addEventListener('click', hideAuthModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideAuthModal();
    });

    // Toggle login/signup
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('auth-login-view').style.display = 'none';
        document.getElementById('auth-signup-view').style.display = 'block';
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('auth-signup-view').style.display = 'none';
        document.getElementById('auth-login-view').style.display = 'block';
    });

    // Login form
    document.getElementById('auth-login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = '';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            hideAuthModal();
        } catch (err) {
            errorEl.textContent = getAuthErrorMessage(err.code);
        }
    });

    // Signup form
    document.getElementById('auth-signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;
        const errorEl = document.getElementById('signup-error');
        errorEl.textContent = '';

        if (password !== confirm) {
            errorEl.textContent = 'Passwords do not match.';
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // Show profile form
            document.getElementById('auth-signup-view').style.display = 'none';
            document.getElementById('auth-profile-view').style.display = 'block';
        } catch (err) {
            errorEl.textContent = getAuthErrorMessage(err.code);
        }
    });

    // Profile step navigation
    document.getElementById('profile-next-1').addEventListener('click', () => {
        document.getElementById('profile-step-1').style.display = 'none';
        document.getElementById('profile-step-2').style.display = 'block';
    });
    document.getElementById('profile-back-2').addEventListener('click', () => {
        document.getElementById('profile-step-2').style.display = 'none';
        document.getElementById('profile-step-1').style.display = 'block';
    });
    document.getElementById('profile-next-2').addEventListener('click', () => {
        document.getElementById('profile-step-2').style.display = 'none';
        document.getElementById('profile-step-3').style.display = 'block';
    });
    document.getElementById('profile-back-3').addEventListener('click', () => {
        document.getElementById('profile-step-3').style.display = 'none';
        document.getElementById('profile-step-2').style.display = 'block';
    });

    // Profile submit
    document.getElementById('profile-submit').addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;

        const getChecked = (name) => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);

        const profileData = {
            name: document.getElementById('profile-name').value,
            rank: document.getElementById('profile-rank').value,
            branch: document.getElementById('profile-branch').value,
            email: user.email,
            goals: getChecked('goals'),
            schools: getChecked('schools'),
            needs: getChecked('needs'),
            classDate: document.getElementById('profile-class-date').value || '',
            createdAt: new Date().toISOString()
        };

        try {
            await setDoc(doc(db, 'users', user.uid), profileData);
        } catch (err) {
            console.error('Error saving profile:', err);
        }

        hideAuthModal();
    });
}

// ── Show / Hide Modal ────────────────────────
export function showAuthModal(mode = 'login') {
    createAuthModal();
    const modal = document.getElementById('auth-modal');

    document.getElementById('auth-login-view').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('auth-signup-view').style.display = mode === 'signup' ? 'block' : 'none';
    document.getElementById('auth-profile-view').style.display = 'none';

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

// ── Auth Error Messages ──────────────────────
function getAuthErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
    };
    return messages[code] || 'An error occurred. Please try again.';
}

// ── Auth State UI Updates ────────────────────
export function initAuthUI() {
    onAuthStateChanged(auth, async (user) => {
        const signInBtn = document.getElementById('nav-auth-btn');
        const userInfo = document.getElementById('nav-user-info');
        const userName = document.getElementById('nav-user-name');
        const signOutBtn = document.getElementById('nav-sign-out');

        if (!signInBtn) return; // Nav not set up yet

        if (user) {
            signInBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';

            // Try to get user profile for display name
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (userName) userName.textContent = data.rank && data.name ? `${data.rank} ${data.name}` : data.name || user.email;
                } else {
                    if (userName) userName.textContent = user.email;
                }
            } catch {
                if (userName) userName.textContent = user.email;
            }
        } else {
            signInBtn.style.display = '';
            if (userInfo) userInfo.style.display = 'none';
        }
    });

    // Bind sign-in button
    const signInBtn = document.getElementById('nav-auth-btn');
    if (signInBtn) {
        signInBtn.addEventListener('click', () => showAuthModal('login'));
    }

    // Bind sign-out button
    const signOutBtn = document.getElementById('nav-sign-out');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (err) {
                console.error('Sign out error:', err);
            }
        });
    }
}

// ── Course Gate ──────────────────────────────
export function initCourseGate() {
    const courseContent = document.getElementById('course-content');
    const loginGate = document.getElementById('login-gate');
    if (!courseContent || !loginGate) return;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            courseContent.style.display = 'block';
            loginGate.style.display = 'none';
        } else {
            courseContent.style.display = 'none';
            loginGate.style.display = 'block';
        }
    });

    // Bind gate sign-in button
    const gateBtn = document.getElementById('gate-sign-in');
    if (gateBtn) {
        gateBtn.addEventListener('click', () => showAuthModal('login'));
    }
    const gateSignup = document.getElementById('gate-create-account');
    if (gateSignup) {
        gateSignup.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthModal('signup');
        });
    }
}

// ── Inventory Functions ─────────────────────
export async function saveInventory(uid, data) {
    try {
        await updateDoc(doc(db, 'users', uid), {
            inventory: data,
            inventoryUpdated: new Date().toISOString()
        });
    } catch (err) {
        // If doc doesn't exist yet, use setDoc with merge
        await setDoc(doc(db, 'users', uid), {
            inventory: data,
            inventoryUpdated: new Date().toISOString()
        }, { merge: true });
    }
}

export async function loadInventory(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return data.inventory || {};
        }
    } catch (err) {
        console.error('Error loading inventory:', err);
    }
    return {};
}

export function initInventoryPage() {
    const inventoryContent = document.getElementById('inventory-content');
    const loginGate = document.getElementById('login-gate');
    if (!inventoryContent || !loginGate) return;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            inventoryContent.style.display = 'block';
            loginGate.style.display = 'none';

            // Load saved inventory
            const saved = await loadInventory(user.uid);
            const checkboxes = document.querySelectorAll('.inv-checkbox');
            checkboxes.forEach(cb => {
                const id = cb.dataset.itemId;
                if (saved[id]) cb.checked = true;
            });
            updateInventoryStats();

            // Bind checkbox changes
            checkboxes.forEach(cb => {
                cb.addEventListener('change', async () => {
                    const inventory = {};
                    document.querySelectorAll('.inv-checkbox').forEach(c => {
                        inventory[c.dataset.itemId] = c.checked ? 1 : 0;
                    });
                    updateInventoryStats();
                    await saveInventory(user.uid, inventory);
                });
            });
        } else {
            inventoryContent.style.display = 'none';
            loginGate.style.display = 'block';
        }
    });

    // Bind gate buttons
    const gateBtn = document.getElementById('gate-sign-in');
    if (gateBtn) {
        gateBtn.addEventListener('click', () => showAuthModal('login'));
    }
    const gateSignup = document.getElementById('gate-create-account');
    if (gateSignup) {
        gateSignup.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthModal('signup');
        });
    }
}

function updateInventoryStats() {
    const checkboxes = document.querySelectorAll('.inv-checkbox');
    const total = checkboxes.length;
    let owned = 0;
    let totalWeight = 0;

    checkboxes.forEach(cb => {
        if (cb.checked) {
            owned++;
            totalWeight += parseFloat(cb.dataset.weight || 0);
        }
    });

    const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

    const countEl = document.getElementById('inv-count');
    const pctEl = document.getElementById('inv-pct');
    const barEl = document.getElementById('inv-bar-fill');
    const weightEl = document.getElementById('inv-weight');

    if (countEl) countEl.textContent = `${owned} of ${total} items`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (barEl) barEl.style.width = `${pct}%`;
    if (weightEl) weightEl.textContent = `${totalWeight.toFixed(1)} lbs`;

    // Update missing items section
    const missingContainer = document.getElementById('inv-missing');
    if (missingContainer) {
        const missing = [];
        checkboxes.forEach(cb => {
            if (!cb.checked) {
                missing.push(cb.dataset.itemName);
            }
        });

        if (missing.length === 0) {
            missingContainer.innerHTML = '<div style="color: var(--color-success); font-weight: 600;">You have everything on the packing list. RLTW.</div>';
        } else {
            missingContainer.innerHTML = missing.map(name =>
                `<div class="inv-missing-item">${name}</div>`
            ).join('');
        }
    }
}
