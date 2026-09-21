(() => {
  'use strict';

  const TITLES = [
    "What's your company name?",
    'What do you do?',
    'Tell us about the business.',
    'What are you after?',
    'Last step. How do we reach you?'
  ];
  const TOTAL = TITLES.length;

  const form = document.getElementById('flowForm');
  const panels = [...form.querySelectorAll('.panel')];
  const bars = [...document.querySelectorAll('.bar')];
  const badge = document.getElementById('stepBadge');
  const title = document.getElementById('stepTitle');
  const head = document.getElementById('stepHead');
  const backBtn = document.getElementById('backBtn');
  const errorEl = document.getElementById('flowError');
  const submitBtn = document.getElementById('flowSubmit');
  const done = document.getElementById('flowDone');

  const answers = { company: '', industry: '', tenure: '', content: '', goal: '' };
  let step = 0;

  /* ── rendering ── */

  function render(next) {
    const prev = step;
    step = next;
    panels.forEach((p, i) => {
      if (i === step) { p.removeAttribute('hidden'); }
      else { p.setAttribute('hidden', ''); }
    });
    if (step !== prev) {
      const live = panels[step];
      live.style.animation = 'none';
      void live.offsetWidth;
      live.style.animation = '';
    }
    badge.textContent = `STEP ${step + 1} OF ${TOTAL}`;
    title.textContent = TITLES[step];
    bars.forEach((b, i) => b.classList.toggle('on', i <= step));
    if (step === 0) { backBtn.setAttribute('hidden', ''); } else { backBtn.removeAttribute('hidden'); }
    gate();
    const focusable = panels[step].querySelector('input');
    if (focusable) focusable.focus({ preventScroll: true });
  }

  /* enable/disable the Continue button of the live panel */
  function gate() {
    const panel = panels[step];
    const btn = panel.querySelector('[data-next]');
    if (!btn) return;
    let ok = false;
    if (step === 0) ok = !!panel.querySelector('input[name="company"]').value.trim();
    if (step === 2) ok = !!answers.tenure && !!answers.content;
    btn.disabled = !ok;
  }

  function advance() {
    if (step < TOTAL - 1) render(step + 1);
  }

  /* ── inputs ── */

  const companyInput = form.querySelector('input[name="company"]');
  companyInput.addEventListener('input', () => { answers.company = companyInput.value; gate(); });
  companyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (answers.company.trim()) advance(); }
  });

  form.querySelectorAll('.opts').forEach(group => {
    const key = group.dataset.group;
    const auto = key === 'industry' || key === 'goal';
    group.querySelectorAll('.opt').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.opt').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        answers[key] = btn.dataset.value;
        gate();
        if (auto) setTimeout(advance, 180);
      });
    });
  });

  form.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => { if (!btn.disabled) advance(); });
  });

  backBtn.addEventListener('click', () => { if (step > 0) render(step - 1); });

  /* ── submit ── */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.setAttribute('hidden', '');

    const data = {
      company: answers.company.trim(),
      industry: answers.industry,
      tenure: answers.tenure,
      content: answers.content,
      goal: answers.goal,
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim()
    };

    const missing = Object.keys(data).filter(k => !data[k]);
    if (missing.length) {
      errorEl.textContent = missing.some(k => ['firstName', 'lastName', 'email', 'phone'].includes(k))
        ? 'Fill in all four fields so we can reach you.'
        : 'Go back and answer every step.';
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
      head.setAttribute('hidden', '');
      form.setAttribute('hidden', '');
      done.removeAttribute('hidden');
      backBtn.setAttribute('hidden', '');
    } catch (err) {
      errorEl.textContent = 'That did not send. Give it another go in a moment.';
      errorEl.removeAttribute('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Book The Call';
    }
  });

  render(0);
})();
