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
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      reveals.forEach((el) => io.observe(el));
    }
  }

  /* ── infrastructure picker ── */
  const picker = $('infraPicker');
  const body = $('infraBody');
  if (picker && body) {
    const picks = Array.from(picker.querySelectorAll('.pick'));
    const select = (btn) => {
      if (btn.classList.contains('is-on')) return;
      picks.forEach((p) => { p.classList.remove('is-on'); p.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-on');
      btn.setAttribute('aria-selected', 'true');
      body.classList.add('fade');
      window.setTimeout(() => {
        body.textContent = btn.dataset.body || '';
        body.classList.remove('fade');
      }, reduced ? 0 : 180);
    };
    picks.forEach((btn) => {
      btn.addEventListener('click', () => select(btn));
      btn.addEventListener('mouseenter', () => { if (window.matchMedia('(min-width:1000px)').matches) select(btn); });
      btn.addEventListener('focus', () => select(btn));
    });
    picker.addEventListener('keydown', (e) => {
      const i = picks.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); picks[(i + 1) % picks.length].focus(); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); picks[(i - 1 + picks.length) % picks.length].focus(); }
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
