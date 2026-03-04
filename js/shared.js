// ============================================
// RANGER BEERS — Shared Utilities
// Common functions used across all school subsites
// Auto-initializes based on which elements exist on page
// ============================================

(function() {
  'use strict';

  // ── Fade-in Animation Observer ──
  function initFadeIn() {
    const fadeElements = document.querySelectorAll('.fade-in');
    if (!fadeElements.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { 
        if (e.isIntersecting) e.target.classList.add('visible'); 
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    
    fadeElements.forEach(el => observer.observe(el));
  }

  // ── Phase Toggle (for school index pages) ──
  function initPhaseToggle() {
    const phaseButtons = document.querySelectorAll('.phase-card-btn[data-phase]');
    if (!phaseButtons.length) return;

    window.togglePhase = function(phase) {
      var panels = document.querySelectorAll('.phase-detail-panel');
      var panel = document.getElementById('detail-' + phase);
      var currentPhase = window._currentPhase || null;

      if (currentPhase === phase) {
        document.querySelectorAll('.phase-card-btn[data-phase]').forEach(function(b) { b.classList.remove('active'); });
        panels.forEach(function(p) { p.classList.remove('open'); });
        window._currentPhase = null;
        return;
      }
      document.querySelectorAll('.phase-card-btn').forEach(function(b) { b.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('open'); });
      if (panel) panel.classList.add('open');
      var btn = document.querySelector('.phase-card-btn[data-phase="' + phase + '"]');
      if (btn) btn.classList.add('active');
      window._currentPhase = phase;
      window._currentSeason = null;
    };

    // Auto-select foundation phase
    var foundationBtn = document.querySelector('.phase-card-btn[data-phase="foundation"]');
    if (foundationBtn) foundationBtn.classList.add('active');
  }

  // ── Season Toggle (for Ranger course pages) ──
  function initSeasonToggle() {
    const seasonButtons = document.querySelectorAll('.phase-card-btn[data-season]');
    if (!seasonButtons.length) return;

    window.toggleSeason = function(season) {
      var panels = document.querySelectorAll('.phase-detail-panel');
      var panel = document.getElementById('detail-' + season);
      var currentSeason = window._currentSeason || null;

      if (currentSeason === season) {
        document.querySelectorAll('.phase-card-btn[data-season]').forEach(function(b) { b.classList.remove('active'); });
        panels.forEach(function(p) { p.classList.remove('open'); });
        window._currentSeason = null;
        return;
      }
      document.querySelectorAll('.phase-card-btn').forEach(function(b) { b.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('open'); });
      if (panel) panel.classList.add('open');
      var btn = document.querySelector('.phase-card-btn[data-season="' + season + '"]');
      if (btn) btn.classList.add('active');
      window._currentSeason = season;
      window._currentPhase = null;
    };
  }

  // ── Nav Scroll Effect ──
  function initNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });
  }

  // ── Mobile Nav Toggle ──
  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navCenter = document.querySelector('.nav-center');
    if (!toggle || !navCenter) return;

    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = navCenter.classList.toggle('mobile-open');
      toggle.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navCenter.querySelectorAll('.nav-dropdown > a').forEach(function(link) {
      link.addEventListener('click', function(e) {
        if (window.innerWidth > 768) return;
        e.preventDefault();
        e.stopPropagation();
        const parent = this.closest('.nav-dropdown');
        const wasOpen = parent.classList.contains('mobile-expanded');
        navCenter.querySelectorAll('.nav-dropdown.mobile-expanded').forEach(function(d) { d.classList.remove('mobile-expanded'); });
        if (!wasOpen) parent.classList.add('mobile-expanded');
      });
    });

    navCenter.querySelectorAll('.nav-dropdown-menu a').forEach(function(a) {
      a.addEventListener('click', function() {
        navCenter.classList.remove('mobile-open');
        toggle.classList.remove('active');
        document.body.style.overflow = '';
        navCenter.querySelectorAll('.nav-dropdown.mobile-expanded').forEach(function(d) { d.classList.remove('mobile-expanded'); });
      });
    });
  }

  // ── Newsletter Form ──
  function initNewsletter() {
    const form = document.getElementById('subscribe-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('subscribe-email').value;
      const btn = document.getElementById('subscribe-btn');
      const success = document.getElementById('subscribe-success');
      const error = document.getElementById('subscribe-error');
      
      btn.disabled = true;
      btn.textContent = 'Subscribing...';
      
      try {
        // Simple email capture - replace with actual API call
        console.log('Newsletter signup:', email);
        success.style.display = 'block';
        error.style.display = 'none';
        form.reset();
      } catch (err) {
        error.textContent = 'Something went wrong. Please try again.';
        error.style.display = 'block';
        success.style.display = 'none';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });
  }

  // ── Initialize All ──
  function init() {
    initFadeIn();
    initPhaseToggle();
    initSeasonToggle();
    initNavScroll();
    initMobileNav();
    initNewsletter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
