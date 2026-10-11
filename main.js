(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width: 900px)');

  /* ---------- mobile menu & dropdowns ---------- */
  const menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
  const setMenu = open => {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    document.body.classList.toggle('menu-open', open && phone.matches);
  };
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); $$('.dd.open').forEach(d => d.classList.remove('open')); } });
  $$('.dd-btn').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const dd = btn.parentElement, open = !dd.classList.contains('open');
    $$('.dd.open').forEach(d => { d.classList.remove('open'); $('.dd-btn', d).setAttribute('aria-expanded', false); });
    dd.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  }));
  document.addEventListener('click', e => {
    if (!e.target.closest('.dd')) $$('.dd.open').forEach(d => d.classList.remove('open'));
    if (e.target.closest('.nav-links a') || (!e.target.closest('.nav') && navLinks.classList.contains('open'))) setMenu(false);
  });

  /* ---------- hero expanding cards + carousel ---------- */
  const cards = $$('#heroCards .card');
  const cardWrap = $('#heroCards');
  cards.forEach(c => c.insertAdjacentHTML('beforeend', '<span class="card-progress" aria-hidden="true"></span>'));

  // phone switcher: one pill per card, sits under the open card
  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'card-tabs';
  tabsWrap.setAttribute('role', 'tablist');
  tabsWrap.setAttribute('aria-label', 'Services');
  cards.forEach(c => tabsWrap.insertAdjacentHTML('beforeend', `<button type="button" role="tab" data-key="${c.dataset.key}">${c.dataset.label}</button>`));
  cardWrap.after(tabsWrap);
  const cardTabs = $$('button', tabsWrap);

  const activate = card => {
    cards.forEach(c => c.classList.toggle('is-active', c === card));
    cardTabs.forEach(b => b.setAttribute('aria-selected', b.dataset.key === card.dataset.key));
  };
  activate($('.card.is-active', cardWrap) || cards[0]);

  const canHover = matchMedia('(hover: hover) and (min-width: 901px)').matches;
  const CYCLE_MS = 4500;
  let hoverTimer, autoTimer, paused = false;
  const current = () => cards.findIndex(c => c.classList.contains('is-active'));
  const kickProgress = () => { cardWrap.classList.remove('run'); void cardWrap.offsetWidth; cardWrap.classList.add('run'); };
  const restartAuto = () => {
    clearInterval(autoTimer);
    cardWrap.classList.remove('run');
    if (paused || reduce) return;
    kickProgress();
    autoTimer = setInterval(() => {
      if (document.hidden) return;
      activate(cards[(current() + 1) % cards.length]);
      kickProgress();
    }, CYCLE_MS);
  };
  const userActivate = card => { activate(card); restartAuto(); };

  cards.forEach(card => {
    card.addEventListener('click', e => { if (!card.classList.contains('is-active')) { e.preventDefault(); userActivate(card); } });
    card.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); userActivate(card); } });
    if (canHover) {
      card.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => activate(card), 140); });
      card.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
    }
  });
  cardTabs.forEach(b => b.addEventListener('click', () => userActivate(cards.find(c => c.dataset.key === b.dataset.key))));
  // hold still while the pointer or keyboard focus is on the cards, then carry on from there
  cardWrap.addEventListener('mouseenter', () => { paused = true; restartAuto(); });
  cardWrap.addEventListener('mouseleave', () => { paused = false; restartAuto(); });
  cardWrap.addEventListener('focusin', () => { paused = true; restartAuto(); });
  cardWrap.addEventListener('focusout', e => { if (!cardWrap.contains(e.relatedTarget)) { paused = false; restartAuto(); } });
  restartAuto();

  /* ---------- solution tabs ---------- */
  const tabs = $$('.tabs [role=tab]');
  const panelOf = t => document.getElementById(t.getAttribute('aria-controls'));
  const showTab = key => {
    tabs.forEach(t => {
      const on = t.dataset.tab === key;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const p = panelOf(t);
      p.hidden = !on;
      p.classList.toggle('is-active', on);
      if (on) $$('.reveal', p).forEach(el => el.classList.add('in'));
    });
    if (key === 'it') startTerminal();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => showTab(t.dataset.tab));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); showTab(n.dataset.tab); }
    });
  });
  // links like #security open that tab and bring the tab bar into view
  $$('a[data-tab]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    showTab(a.dataset.tab);
    history.replaceState(null, '', '#' + a.dataset.tab);
    $('#solutions').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  // links that pre-select a service in the quote form
  $$('[data-service]').forEach(a => a.addEventListener('click', () => {
    const r = $(`.svc-pick input[value="${a.dataset.service}"]`);
    if (r) r.checked = true;
  }));

  /* ---------- comms: room clock, booking, signage ---------- */
  const clock = $('#roomClock');
  const tick = () => { clock.textContent = new Date().toTimeString().slice(0, 5); };
  tick(); setInterval(tick, 30000);
  const room = $('.room-ui'), bookBtn = $('.room-book'), roomState = $('.room-status span', room);
  bookBtn.addEventListener('click', () => {
    const busy = room.classList.toggle('busy');
    roomState.textContent = busy ? 'In use' : 'Available';
    bookBtn.textContent = busy ? 'End meeting' : 'Book now';
  });
  const signs = ['Welcome to Head Office', 'Boardroom 2 is free until 11:00', 'Visitors, please sign in at reception', 'Fire drill on Friday at 10:00'];
  let si = 0; const signLine = $('#signLine');
  if (!reduce) setInterval(() => {
    signLine.classList.add('out');
    setTimeout(() => { si = (si + 1) % signs.length; signLine.textContent = signs[si]; signLine.classList.remove('out'); }, 400);
  }, 3200);

  /* ---------- IT: typing terminal ---------- */
  const lines = [
    ['<span class="k">$</span> show interfaces status', 60],
    ['Gi1/0/1   connected   1000  <span class="ok">up</span>', 10],
    ['Gi1/0/2   connected   1000  <span class="ok">up</span>', 10],
    ['Gi1/0/24  trunk       10G   <span class="ok">up</span>', 10],
    ['<span class="k">$</span> ping core-dc01', 60],
    ['Reply from 10.0.0.10: time=<span class="o">1ms</span>', 10],
    ['<span class="ok">✓ Network healthy, UPS on solar</span>', 10],
  ];
  let termStarted = false;
  function startTerminal() {
    if (termStarted) return; termStarted = true;
    const pre = $('#termText');
    if (reduce) { pre.innerHTML = lines.map(l => l[0]).join('\n'); return; }
    let li = 0, out = '';
    const nextLine = () => {
      if (li >= lines.length) { pre.innerHTML = out + '<span class="cursor"></span>'; return; }
      const [html, speed] = lines[li++];
      const plain = html.replace(/<[^>]+>/g, '');
      let c = 0;
      const typeChar = () => {
        c++;
        pre.innerHTML = out + plain.slice(0, c) + '<span class="cursor"></span>';
        if (c < plain.length) setTimeout(typeChar, speed === 60 ? 45 : 6);
        else { out += html + '\n'; setTimeout(nextLine, speed === 60 ? 380 : 120); }
      };
      typeChar();
    };
    nextLine();
  }

  /* ---------- smart control panel ---------- */
  const ctrl = $('#ctrl'), state = $('#ctrlState');
  const labels = { lights: ['On', 'Off'], cams: ['Recording', 'Paused'], gate: ['Open', 'Closed'], alarm: ['Armed', 'Tap to arm'] };
  $$('.ctrl-btn', ctrl).forEach(b => b.addEventListener('click', () => {
    const on = b.classList.toggle('on');
    b.setAttribute('aria-pressed', on);
    $('small', b).textContent = labels[b.dataset.k][on ? 0 : 1];
    if (b.dataset.k === 'alarm') { ctrl.classList.toggle('armed', on); state.textContent = on ? 'Armed' : 'Disarmed'; }
  }));

  /* ---------- reveal on scroll ----------
     Hidden state only exists under html.js, so a script failure never blanks the page.
     Siblings cascade 85ms apart. A sweep catches anything a fast scroll carried past the observer. */
  const groups = ['.section', '.marquee', '.feat li', '.steps li', '.why-item', '.about-grid article', '.bento > *'];
  const revealEls = [];
  groups.forEach(sel => $$(sel).forEach(el => {
    if (el.closest('.hero-frame')) return;
    const sibs = [...el.parentElement.children].filter(s => s.matches(sel));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6) * 85 + 'ms');
    el.classList.add('reveal');
    revealEls.push(el);
  }));
  const show = el => el.classList.add('in');
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));
  let sweepQueued = false;
  const sweep = () => {
    sweepQueued = false;
    const h = innerHeight;
    revealEls.forEach(el => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < h) { show(el); io.unobserve(el); } });
  };
  addEventListener('scroll', () => { if (!sweepQueued) { sweepQueued = true; requestAnimationFrame(sweep); } }, { passive: true });
  // flag once the hero has scrolled away (the phone layout shows the WhatsApp button from then on)
  const heroFrame = $('.hero-frame');
  new IntersectionObserver(([en]) => document.body.classList.toggle('past-hero', !en.isIntersecting), { threshold: .15 }).observe(heroFrame);

  /* ---------- quote form → WhatsApp / email ---------- */
  const form = $('#quoteForm');
  let via = 'whatsapp';
  $$('button[type=submit]', form).forEach(b => b.addEventListener('click', () => { via = b.value; }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const checks = {
      name: v => v.trim().length > 1,
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: v => v.trim().length > 4,
    };
    let firstBad = null;
    for (const [k, ok] of Object.entries(checks)) {
      const el = form.elements[k], good = ok(f.get(k) || '');
      el.closest('.fld').classList.toggle('err', !good);
      if (!good && !firstBad) firstBad = el;
    }
    if (firstBad) { firstBad.focus(); return; }
    const svc = f.get('service');
    const body = `Hello Omnitek,\n\nService: ${svc}\nName: ${f.get('name')}\nEmail: ${f.get('email')}\nPhone: ${f.get('phone') || '-'}\n\n${f.get('message')}`;
    if (via === 'email') {
      location.href = `mailto:sales@omnitek.co.zw?subject=${encodeURIComponent('Quote request: ' + svc)}&body=${encodeURIComponent(body)}`;
    } else {
      window.open(`https://wa.me/263773275590?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
    }
  });
  $$('.fld input, .fld textarea', form).forEach(el => el.addEventListener('input', () => el.closest('.fld').classList.remove('err')));

  $('#yr').textContent = new Date().getFullYear();

  /* ---------- initial tab state (runs last so everything above is ready) ---------- */
  const deep = location.hash.slice(1);
  if (tabs.some(t => t.dataset.tab === deep)) { showTab(deep); $('#solutions').scrollIntoView(); }
  else showTab('solar');
  sweep();
})();
