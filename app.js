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

})();
