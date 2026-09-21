(() => {
  'use strict';

  // The static GitHub Pages mirror has no API in front of it; point those copies
  // back at the Cloudflare deployment so the calendar works wherever it is served.
  const API = location.hostname.endsWith('github.io') ? 'https://magnetic-vsl.pages.dev' : '';

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
      const res = await fetch(API + '/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('bad status ' + res.status);
      head.setAttribute('hidden', '');
      lead = data;
      form.setAttribute('hidden', '');
      done.removeAttribute('hidden');
      renderDays();
      backBtn.setAttribute('hidden', '');
    } catch (err) {
      errorEl.textContent = 'That did not send. Give it another go in a moment.';
      errorEl.removeAttribute('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Book The Call';
    }
  });


  /* ───────────────────────── booking calendar ───────────────────────── */

  const TZ = 'America/Los_Angeles';
  const SLOT_TIMES = ['9:00 am','9:30 am','10:00 am','10:30 am','11:00 am','11:30 am',
                      '1:00 pm','1:30 pm','2:00 pm','2:30 pm','3:00 pm','3:30 pm','4:00 pm','4:30 pm'];
  const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const LONG_DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const LONG_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const daysEl = document.getElementById('days');
  const slotsEl = document.getElementById('slots');
  const slotsLabel = document.getElementById('slotsLabel');
  const slotsEmpty = document.getElementById('slotsEmpty');
  const bookBtn = document.getElementById('bookBtn');
  const bookError = document.getElementById('bookError');
  const booked = document.getElementById('flowBooked');

  let lead = null;          /* filled in on apply submit */
  let pickedDate = null;    /* {iso, d} */
  let pickedTime = null;
  let taken = [];

  /* today's parts in Pacific, whatever the visitor's clock says */
  function pacificToday() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).reduce((a, p) => (a[p.type] = p.value, a), {});
    return new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
  }

  function businessDays(count) {
    const out = [];
    const d = pacificToday();
    d.setUTCDate(d.getUTCDate() + 1);        /* never same-day */
    while (out.length < count) {
      const dow = d.getUTCDay();
      if (dow !== 0 && dow !== 6) out.push(new Date(d));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
  }

  const iso = d => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  const pretty = d => `${LONG_DOW[d.getUTCDay()]}, ${LONG_MON[d.getUTCMonth()]} ${d.getUTCDate()}`;

  function renderDays() {
    daysEl.innerHTML = '';
    businessDays(10).forEach((d, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'day';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.innerHTML = `<span class="day-dow">${DOW[d.getUTCDay()]}</span>` +
                    `<span class="day-num">${d.getUTCDate()}</span>` +
                    `<span class="day-mon">${MON[d.getUTCMonth()]}</span>`;
      b.addEventListener('click', () => selectDay(d, b, true));
      daysEl.appendChild(b);
      if (i === 0) selectDay(d, b, false);
    });
  }

  async function selectDay(d, btn, scroll) {
    daysEl.querySelectorAll('.day').forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-selected', 'false'); });
    btn.classList.add('sel');
    btn.setAttribute('aria-selected', 'true');
    if (scroll) btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    pickedDate = { iso: iso(d), d };
    pickedTime = null;
    slotsLabel.textContent = `Available on ${pretty(d)}`;
    taken = [];
    try {
      const res = await fetch(`${API}/api/slots?date=${pickedDate.iso}`);
      if (res.ok) taken = (await res.json()).taken || [];
    } catch (err) { /* offline: show everything, the POST is the real gate */ }
    renderSlots();
    gateBook();
  }

  function renderSlots() {
    slotsEl.innerHTML = '';
    let open = 0;
    SLOT_TIMES.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot-btn';
      b.textContent = t;
      b.setAttribute('role', 'option');
      if (taken.includes(t)) { b.disabled = true; b.setAttribute('aria-disabled', 'true'); }
      else { open++; b.addEventListener('click', () => { pickedTime = t; renderSlots(); gateBook(); }); }
      if (pickedTime === t) b.classList.add('sel');
      slotsEl.appendChild(b);
    });
    if (open) { slotsEmpty.setAttribute('hidden', ''); slotsEl.removeAttribute('hidden'); }
    else { slotsEmpty.removeAttribute('hidden'); slotsEl.setAttribute('hidden', ''); }
  }

  function gateBook() {
    const ready = !!(pickedDate && pickedTime);
    bookBtn.disabled = !ready;
    bookBtn.textContent = ready
      ? `Confirm ${pretty(pickedDate.d)}, ${pickedTime}`
      : 'Pick a day and a time';
  }

  bookBtn.addEventListener('click', async () => {
    if (!pickedDate || !pickedTime) return;
    bookError.setAttribute('hidden', '');
    bookBtn.disabled = true;
    const label = bookBtn.textContent;
    bookBtn.textContent = 'Booking…';
    try {
      const res = await fetch(API + '/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: pickedDate.iso, time: pickedTime, ...(lead || {}) })
      });
      if (res.status === 409) {
        taken.push(pickedTime);
        pickedTime = null;
        renderSlots(); gateBook();
        bookError.textContent = 'Someone just took that one. Pick another time.';
        bookError.removeAttribute('hidden');
        return;
      }
      if (!res.ok) throw new Error('bad status ' + res.status);
      document.getElementById('ticketWhen').textContent = `${pretty(pickedDate.d)} at ${pickedTime}`;
      document.getElementById('ticketEmail').textContent = (lead && lead.email) || 'your inbox';
      done.setAttribute('hidden', '');
      booked.removeAttribute('hidden');
    } catch (err) {
      bookError.textContent = 'That did not go through. Try again in a moment.';
      bookError.removeAttribute('hidden');
      bookBtn.disabled = false;
      bookBtn.textContent = label;
    }
  });

  render(0);
})();
