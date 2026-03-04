// ============================================
// RANGER BEERS — Gear Card Engine
// Transforms flat item rows into hero cards
// with expandable detail panels, tiedown
// tracking, shop links, and section collapsing
// ============================================

// Expects gear-data.js loaded first (GEAR_DATA, SYSTEM_SETUPS, CATEGORY_GRADIENTS)

// ── Build Detail HTML (expand section) ──────
function buildDetailHTML(itemId) {
    const item = GEAR_DATA[itemId];
    if (!item) return '';

    // Form link for admin items
    let formHTML = '';
    if (item.formUrl) {
        formHTML = `
            <a href="${item.formUrl}" target="_blank" class="gear-form-link">
                Download Official Form (PDF)
            </a>`;
    }

    // Tiedown indicator
    let tiedownHTML = '';
    if (item.tiedown) {
        tiedownHTML = `
            <div class="gear-tiedown-badge">
                Tiedown / Dummy Cord Required
            </div>`;
    }

    // Shop button (not for admin items)
    let shopHTML = '';
    if (item.shopSlug && item.category !== 'admin') {
        shopHTML = `
            <a href="shop.html#${item.shopSlug}" class="gear-shop-btn">
                View in Shop
            </a>`;
    }

    // Variants
    let variantsHTML = '';
    if (item.variants && item.variants.length > 0) {
        const cards = item.variants.map(v => {
            const variantSlug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const shopLink = item.category !== 'admin'
                ? `<a href="shop.html#${variantSlug}" class="gear-variant-shop-link">View in Shop</a>`
                : '';
            return `
            <div class="gear-variant-card">
                <div class="gear-variant-img-wrap">
                    <img class="gear-variant-img" src="${v.image}" alt="${v.name}"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
                    <div class="gear-variant-img-fallback" style="display:none;background:${CATEGORY_GRADIENTS[item.category]};">
                        <span>${v.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                </div>
                <div class="gear-variant-info">
                    <div class="gear-variant-name">${v.name}</div>
                    <div class="gear-variant-note">${v.note}</div>
                    ${shopLink}
                </div>
            </div>`;
        }).join('');

        variantsHTML = `
            <div class="gear-detail-section">
                <div class="gear-detail-section-title">Allowed Variants</div>
                <div class="gear-detail-variants">${cards}</div>
            </div>`;
    }

    // System Setup
    let setupHTML = '';
    if (item.systemSetup && SYSTEM_SETUPS[item.systemSetup]) {
        const setup = SYSTEM_SETUPS[item.systemSetup];

        const tags = setup.items.map(id => {
            const gd = GEAR_DATA[id];
            const label = gd ? gd.name : `Item #${id}`;
            const active = id === itemId ? ' gear-setup-tag-active' : '';
            return `<span class="gear-setup-tag${active}">${label}</span>`;
        }).join('');

        const steps = setup.steps.map(s => `<li>${s}</li>`).join('');
        const tips = setup.proTips.map(t =>
            `<div class="gear-setup-tip">${t}</div>`
        ).join('');

        setupHTML = `
            <div class="gear-detail-section">
                <div class="gear-detail-section-title">${setup.icon} ${setup.title}</div>
                <div class="gear-setup-tags">${tags}</div>
                <ol class="gear-setup-steps">${steps}</ol>
                <div class="gear-setup-tips-label">Pro Tips</div>
                ${tips}
            </div>`;
    }

    return `
        <div class="gear-card-detail">
            ${tiedownHTML}
            ${formHTML}
            <p class="gear-card-desc">${item.description}</p>
            <div class="gear-card-actions">
                ${shopHTML}
            </div>
            ${variantsHTML}
            ${setupHTML}
        </div>`;
}

// ── Transform Rows into Cards ───────────────
function transformToCards() {
    const rows = document.querySelectorAll('.inv-item');

    rows.forEach(row => {
        const checkbox = row.querySelector('.inv-checkbox');
        if (!checkbox) return;

        const itemId = checkbox.dataset.itemId;
        const itemName = checkbox.dataset.itemName;
        const item = GEAR_DATA[itemId];

        // Get display values from the original row
        const qtyEl = row.querySelector('.inv-item-qty');
        const weightEl = row.querySelector('.inv-item-weight');
        const qty = qtyEl ? qtyEl.textContent : '';
        const weight = weightEl ? weightEl.textContent : '';

        // Get the numbered name from the .inv-item-name element
        const nameEl = row.querySelector('.inv-item-name');
        const displayName = nameEl ? nameEl.textContent : itemName;

        // Determine category and gradient
        const category = item ? item.category : 'essential';
        const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.essential;
        const imageSrc = item ? item.image : '';

        // Tiedown indicator
        const tiedownBadge = (item && item.tiedown) ? '<span class="gear-card-tiedown" title="Tiedown required">TD</span>' : '';

        // Build card
        const card = document.createElement('div');
        card.className = 'gear-card' + (checkbox.checked ? ' gear-card-checked' : '');
        card.dataset.gearId = itemId;

        card.innerHTML = `
            <div class="gear-card-hero" style="background:${gradient}">
                <img class="gear-card-hero-img" src="${imageSrc}" alt="${displayName}"
                     onerror="this.style.display='none';" />
                <div class="gear-card-overlay">
                    <label class="gear-card-check" onclick="event.stopPropagation();">
                    </label>
                    <div class="gear-card-badges">
                        ${tiedownBadge}
                    </div>
                </div>
                <div class="gear-card-name">${displayName}</div>
                <div class="gear-card-qty-big">${qty}</div>
                <div class="gear-card-expand-hint"></div>
            </div>
        `;

        // Move the original checkbox into the card (preserves event listeners)
        const checkLabel = card.querySelector('.gear-card-check');
        checkLabel.prepend(checkbox);

        // Checkbox toggle — update card checked state
        checkbox.addEventListener('change', function () {
            card.classList.toggle('gear-card-checked', this.checked);
            updateTiedownStats();
        });

        // Click hero to expand/collapse (not checkbox)
        const hero = card.querySelector('.gear-card-hero');
        hero.addEventListener('click', (e) => {
            if (e.target.closest('.gear-card-check')) return;
            toggleCardDetail(card, itemId);
        });

        // Replace the old row
        row.replaceWith(card);
    });

    // Initialize section collapsing — start all collapsed
    initSectionCollapse();
    document.querySelectorAll('.inv-category').forEach(cat => {
        cat.classList.add('collapsed');
    });

    // Update tiedown stats
    updateTiedownStats();
}

// ── Toggle Detail Expand/Collapse ───────────
function toggleCardDetail(card, itemId) {
    const existing = card.querySelector('.gear-card-detail');

    if (existing) {
        // Collapse
        card.classList.remove('gear-card-open');
        existing.style.maxHeight = existing.scrollHeight + 'px';
        requestAnimationFrame(() => {
            existing.style.maxHeight = '0';
        });
        existing.addEventListener('transitionend', () => existing.remove(), { once: true });
        setTimeout(() => { if (existing.parentNode) existing.remove(); }, 400);
        return;
    }

    // Close any other open card
    const openCard = document.querySelector('.gear-card-open');
    if (openCard && openCard !== card) {
        const openDetail = openCard.querySelector('.gear-card-detail');
        openCard.classList.remove('gear-card-open');
        if (openDetail) {
            openDetail.style.maxHeight = openDetail.scrollHeight + 'px';
            requestAnimationFrame(() => { openDetail.style.maxHeight = '0'; });
            openDetail.addEventListener('transitionend', () => openDetail.remove(), { once: true });
            setTimeout(() => { if (openDetail.parentNode) openDetail.remove(); }, 400);
        }
    }

    // Build and insert detail
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildDetailHTML(itemId);
    const detail = wrapper.firstElementChild;
    if (!detail) return;

    card.appendChild(detail);
    card.classList.add('gear-card-open');

    // Animate open
    detail.style.maxHeight = '0';
    detail.style.overflow = 'hidden';
    requestAnimationFrame(() => {
        detail.style.maxHeight = detail.scrollHeight + 'px';
        detail.addEventListener('transitionend', () => {
            detail.style.maxHeight = 'none';
            detail.style.overflow = '';
        }, { once: true });
    });

    // Scroll into view
    setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// ── Section Collapse/Expand ─────────────────
function initSectionCollapse() {
    document.querySelectorAll('.inv-section-toggle').forEach(header => {
        header.addEventListener('click', () => {
            const category = header.closest('.inv-category');
            if (!category) return;
            category.classList.toggle('collapsed');
        });
    });
}

// ── Tiedown Stats ───────────────────────────
function updateTiedownStats() {
    const el = document.getElementById('inv-tiedown');
    if (!el) return;

    let total = 0;
    let done = 0;

    document.querySelectorAll('.gear-card').forEach(card => {
        const id = card.dataset.gearId;
        const item = GEAR_DATA[id];
        if (item && item.tiedown) {
            total++;
            const cb = card.querySelector('.inv-checkbox');
            if (cb && cb.checked) done++;
        }
    });

    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    el.textContent = `${pct}%`;
}

// ── Init ────────────────────────────────────
function initGearModals() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', transformToCards);
    } else {
        transformToCards();
    }
}
