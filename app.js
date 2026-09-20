(() => {
  'use strict';

  /* menu */
  const menuBtn = document.getElementById('menuBtn');
  const menuPanel = document.getElementById('menuPanel');
  menuBtn.addEventListener('click', () => {
    const open = menuPanel.hasAttribute('hidden');
    if (open) { menuPanel.removeAttribute('hidden'); } else { menuPanel.setAttribute('hidden',''); }
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!menuPanel.hasAttribute('hidden') && !e.target.closest('.nav')) {
      menuPanel.setAttribute('hidden','');
      menuBtn.setAttribute('aria-expanded','false');
    }
  });

  /* vsl */
  const vsl = document.getElementById('vsl');
  const video = document.getElementById('vslVideo');
  const playBtn = document.getElementById('playBtn');
  playBtn.addEventListener('click', () => {
    vsl.classList.add('playing');
    video.setAttribute('controls','');
    const p = video.play();
    if (p && p.catch) p.catch(() => { vsl.classList.remove('playing'); });
  });
  video.addEventListener('pause', () => { if (video.currentTime === 0) vsl.classList.remove('playing'); });
  video.addEventListener('error', () => {
    /* no master uploaded yet: fall back to the poster + button */
    vsl.classList.remove('playing');
    video.removeAttribute('controls');
  }, true);

  /* apply modal */
  const modal = document.getElementById('apply');
  const form = document.getElementById('applyForm');
  const thanks = document.getElementById('thanks');
  const errorEl = document.getElementById('formError');
  const submitBtn = document.getElementById('applySubmit');
  let lastFocus = null;

  function openApply(e) {
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    modal.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    menuPanel.setAttribute('hidden','');
    menuBtn.setAttribute('aria-expanded','false');
    const first = modal.querySelector('input');
    if (first) first.focus({ preventScroll: true });
  }
  function closeApply() {
    modal.setAttribute('hidden','');
    document.body.classList.remove('modal-open');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-open-apply]').forEach(el => el.addEventListener('click', openApply));
  document.querySelectorAll('[data-close-apply]').forEach(el => el.addEventListener('click', closeApply));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeApply();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.setAttribute('hidden','');

    const data = Object.fromEntries(new FormData(form).entries());
    const required = ['revenue','tried','camera','name','business','email','phone'];
    const missing = required.filter(k => !data[k] || !String(data[k]).trim());
    if (missing.length) {
      errorEl.textContent = 'Answer all three questions and fill in your details.';
      errorEl.removeAttribute('hidden');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      errorEl.textContent = 'That email address does not look right.';
      errorEl.removeAttribute('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('bad status ' + res.status);
      form.setAttribute('hidden','');
      thanks.removeAttribute('hidden');
    } catch (err) {
      errorEl.textContent = 'That did not send. Give it another go in a moment.';
      errorEl.removeAttribute('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Book A Call';
    }
  });
})();
