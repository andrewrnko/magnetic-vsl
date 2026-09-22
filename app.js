(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── menu ── */
  const menuBtn = $('menuBtn');
  const menuPanel = $('menuPanel');
  if (menuBtn && menuPanel) {
    menuBtn.addEventListener('click', () => {
      const open = menuPanel.hasAttribute('hidden');
      if (open) { menuPanel.removeAttribute('hidden'); } else { menuPanel.setAttribute('hidden', ''); }
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!menuPanel.hasAttribute('hidden') && !e.target.closest('.nav')) {
        menuPanel.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    menuPanel.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        menuPanel.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── scroll reveals ──
     One observer for every .r. Children of the same block are staggered by
     their index within that block, so a card grid lands in a wave rather
     than all at once. */
  const reveals = Array.from(document.querySelectorAll('.r'));
  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const sibs = Array.from(el.parentElement.children).filter((n) => n.classList.contains('r'));
          const i = Math.max(0, sibs.indexOf(el));
          el.style.transitionDelay = Math.min(i, 8) * 55 + 'ms';
          el.classList.add('in');
          obs.unobserve(el);
          /* Cards parked off-screen inside a horizontal rail never intersect
             the viewport, so they would stay at opacity 0 and the reader would
             swipe to a blank card. Reveal the rail as one group. */
          const rail = el.closest('[data-reveal-group]');
          if (rail) {
            rail.querySelectorAll('.r').forEach((n, k) => {
              n.style.transitionDelay = Math.min(k, 8) * 55 + 'ms';
              n.classList.add('in');
              obs.unobserve(n);
            });
          }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      reveals.forEach((el) => io.observe(el));
    }
  }

  /* ── infrastructure reel ──
     A self-advancing vertical list: the centred row is the live one, the rest
     fade out under a mask. It only runs while it is on screen, and it stops
     the moment anyone points at it. */
  const reel = $('infraReel');
  const reelList = $('infraList');
  if (reel && reelList) {
    const items = Array.from(reelList.children);
    let i = 0, timer = null, held = false, onScreen = false;
    const paint = () => {
      reelList.style.setProperty('--i', String(i));
      items.forEach((el, n) => el.classList.toggle('is-on', n === i));
    };
    const step = () => { i = (i + 1) % items.length; paint(); };
    const run = () => {
      window.clearInterval(timer);
      if (reduced || held || !onScreen) return;
      timer = window.setInterval(step, 2200);
    };
    items.forEach((el, n) => {
      el.addEventListener('click', () => { i = n; paint(); });
    });
    ['mouseenter', 'focusin', 'touchstart'].forEach((e) =>
      reel.addEventListener(e, () => { held = true; run(); }, { passive: true }));
    ['mouseleave', 'focusout'].forEach((e) =>
      reel.addEventListener(e, () => { held = false; run(); }));
    document.addEventListener('visibilitychange', run);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        es.forEach((e) => { onScreen = e.isIntersecting; });
        run();
      }, { threshold: 0.35 }).observe(reel);
    } else {
      onScreen = true;
    }
    paint();
    run();
  }

  /* ── faq accordion ──
     Buttons and panels rather than <details>, because a 0fr→1fr grid row is
     the one height animation that works without measuring, and <details>
     removes the panel from layout before it can transition. */
  const faq = $('faqList');
  if (faq) {
    const rows = Array.from(faq.querySelectorAll('.qa'));
    rows.forEach((row) => {
      const btn = row.querySelector('.qa-q');
      const panel = row.querySelector('.qa-p');
      const id = 'qa-' + Math.random().toString(36).slice(2, 8);
      panel.id = id;
      btn.setAttribute('aria-controls', id);
      btn.addEventListener('click', () => {
        const open = row.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        /* one at a time: the list stays scannable and the page does not jump */
        if (open) rows.forEach((r) => {
          if (r !== row && r.classList.contains('is-open')) {
            r.classList.remove('is-open');
            r.querySelector('.qa-q').setAttribute('aria-expanded', 'false');
          }
        });
      });
    });
  }

  /* ── sticky CTA ──
     Hidden while the hero is on screen (it has its own button) and hidden
     again over the final CTA, so the page never shows the same ask twice. */
  const sticky = $('stickyCta');
  const hero = $('top');
  const final = $('apply');
  if (sticky && hero) {
    document.body.classList.add('has-sticky');
    sticky.removeAttribute('hidden');
    const state = { hero: true, final: false };
    const paint = () => {
      const show = !state.hero && !state.final;
      sticky.classList.toggle('show', show);
      sticky.setAttribute('aria-hidden', String(!show));
      sticky.tabIndex = show ? 0 : -1;
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        es.forEach((e) => { state.hero = e.isIntersecting; });
        paint();
      }, { threshold: 0.18 }).observe(hero);
      if (final) {
        new IntersectionObserver((es) => {
          es.forEach((e) => { state.final = e.isIntersecting; });
          paint();
        }, { threshold: 0.3 }).observe(final);
      }
    } else {
      state.hero = false;
    }
    paint();
  }

  /* ── vsl (absent on the no-video lander) ── */
  const vsl = $('vsl');
  const video = $('vslVideo');
  const playBtn = $('playBtn');
  if (vsl && video && playBtn) {
    playBtn.addEventListener('click', () => {
      vsl.classList.add('playing');
      video.setAttribute('controls', '');
      const p = video.play();
      if (p && p.catch) p.catch(() => { vsl.classList.remove('playing'); });
    });
    video.addEventListener('pause', () => { if (video.currentTime === 0) vsl.classList.remove('playing'); });
    video.addEventListener('error', () => {
      /* no master uploaded yet: fall back to the poster + button */
      vsl.classList.remove('playing');
      video.removeAttribute('controls');
    }, true);
  }

})();
