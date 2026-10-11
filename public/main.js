(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width: 900px)');

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

  const cardWrap = $('#heroCards');
  if (cardWrap) {
    const cards = $$('.card', cardWrap);
    cards.forEach(c => c.insertAdjacentHTML('beforeend', '<svg class="card-trace" aria-hidden="true"><path pathLength="1"/></svg>'));

    const tracePath = card => {
      const w = card.clientWidth, h = card.clientHeight;
      const cs = getComputedStyle(card);
      const r = parseFloat(cs.borderTopLeftRadius) || 0;
      const bite = card.querySelector('.bite');
      if (!bite || !w || !h) return '';
      const n = parseFloat(cs.getPropertyValue('--notch')) || 18;
      const R = parseFloat(getComputedStyle(bite).borderTopLeftRadius) || r;
      const bx = bite.offsetLeft, by = bite.offsetTop;
      const k = r * (1 - Math.SQRT1_2);
      return [
        `M ${k} ${k}`, `A ${r} ${r} 0 0 1 ${r} 0`, `H ${w - r}`, `A ${r} ${r} 0 0 1 ${w} ${r}`,
        `V ${by - n}`, `A ${n} ${n} 0 0 1 ${w - n} ${by}`,
        `H ${bx + R}`, `A ${R} ${R} 0 0 0 ${bx} ${by + R}`,
        `V ${h - n}`, `A ${n} ${n} 0 0 1 ${bx - n} ${h}`,
        `H ${r}`, `A ${r} ${r} 0 0 1 0 ${h - r}`,
        `V ${r}`, `A ${r} ${r} 0 0 1 ${k} ${k}`
      ].join(' ');
    };
    const drawTrace = card => {
      const svg = card.querySelector('.card-trace');
      svg.setAttribute('viewBox', `0 0 ${card.clientWidth} ${card.clientHeight}`);
      svg.querySelector('path').setAttribute('d', tracePath(card));
    };
    const ro = new ResizeObserver(entries => entries.forEach(e => drawTrace(e.target)));
    cards.forEach(c => { ro.observe(c); drawTrace(c); });

    const tabsWrap = document.createElement('div');
    tabsWrap.className = 'card-tabs';
    tabsWrap.setAttribute('role', 'tablist');
    tabsWrap.setAttribute('aria-label', 'Services');
    cards.forEach(c => tabsWrap.insertAdjacentHTML('beforeend', `<button type="button" role="tab" data-key="${c.dataset.key}">${c.dataset.label}</button>`));
    cardWrap.after(tabsWrap);
    const cardTabs = $$('button', tabsWrap);

    const heroWord = $('#heroWord');
    let wordTimer;
    const setWord = card => {
      const word = card.dataset.word, href = $('.bite a', card)?.getAttribute('href');
      if (!heroWord || !word || heroWord.textContent === word) return;
      clearTimeout(wordTimer);
      heroWord.classList.add('swap');
      wordTimer = setTimeout(() => {
        heroWord.firstElementChild.textContent = word;
        if (href) heroWord.setAttribute('href', href);
        void heroWord.offsetWidth;
        heroWord.classList.remove('swap');
      }, reduce ? 0 : 260);
    };
    const activate = card => {
      cards.forEach(c => c.classList.toggle('is-active', c === card));
      setWord(card);
      cardTabs.forEach(b => b.setAttribute('aria-selected', b.dataset.key === card.dataset.key));
    };
    activate($('.card.is-active', cardWrap) || cards[0]);

    const canHover = matchMedia('(hover: hover) and (min-width: 901px)').matches;
    const CYCLE_MS = 4500;
    cardWrap.style.setProperty('--cycle', CYCLE_MS + 'ms');
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
    cardWrap.addEventListener('mouseenter', () => { paused = true; restartAuto(); });
    cardWrap.addEventListener('mouseleave', () => { paused = false; restartAuto(); });
    cardWrap.addEventListener('focusin', () => { paused = true; restartAuto(); });
    cardWrap.addEventListener('focusout', e => { if (!cardWrap.contains(e.relatedTarget)) { paused = false; restartAuto(); } });
    restartAuto();
  }

  const tabs = $$('.tabs [role=tab]');
  const showTab = key => {
    tabs.forEach(t => {
      const on = t.dataset.tab === key;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const p = document.getElementById(t.getAttribute('aria-controls'));
      p.hidden = !on;
      p.classList.toggle('is-active', on);
      if (on) $$('.reveal', p).forEach(el => el.classList.add('in'));
      if (on) $$('.term-text', p).forEach(startTerminal);
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => showTab(t.dataset.tab));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); showTab(n.dataset.tab); }
    });
  });

  const tick = () => $$('.room-time').forEach(c => { c.textContent = new Date().toTimeString().slice(0, 5); });
  tick(); setInterval(tick, 30000);
  $$('.room-ui').forEach(room => {
    const btn = $('.room-book', room), state = $('.room-status span', room);
    btn.addEventListener('click', () => {
      const busy = room.classList.toggle('busy');
      state.textContent = busy ? 'In use' : 'Available';
      btn.textContent = busy ? 'End meeting' : 'Book now';
    });
  });
  const signs = ['Welcome to Head Office', 'Boardroom 2 is free until 11:00', 'Visitors, please sign in at reception', 'Fire drill on Friday at 10:00'];
  const signLines = $$('.sign-line');
  if (signLines.length && !reduce) {
    let si = 0;
    setInterval(() => {
      signLines.forEach(l => l.classList.add('out'));
      setTimeout(() => { si = (si + 1) % signs.length; signLines.forEach(l => { l.textContent = signs[si]; l.classList.remove('out'); }); }, 400);
    }, 3200);
  }

  const lines = [
    ['<span class="k">$</span> show interfaces status', 60],
    ['Gi1/0/1   connected   1000  <span class="ok">up</span>', 10],
    ['Gi1/0/2   connected   1000  <span class="ok">up</span>', 10],
    ['Gi1/0/24  trunk       10G   <span class="ok">up</span>', 10],
    ['<span class="k">$</span> ping core-dc01', 60],
    ['Reply from 10.0.0.10: time=<span class="o">1ms</span>', 10],
    ['<span class="ok">✓ Network healthy, UPS on solar</span>', 10],
  ];
  function startTerminal(pre) {
    if (pre.dataset.started) return; pre.dataset.started = '1';
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
  const termIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.target.offsetParent) { startTerminal(e.target); termIO.unobserve(e.target); } }), { threshold: .3 });
  $$('.term-text').forEach(p => termIO.observe(p));

  const labels = { lights: ['On', 'Off'], cams: ['Recording', 'Paused'], gate: ['Open', 'Closed'], alarm: ['Armed', 'Tap to arm'] };
  $$('.ctrl').forEach(ctrl => {
    const state = $('.ctrl-state', ctrl);
    $$('.ctrl-btn', ctrl).forEach(b => b.addEventListener('click', () => {
      const on = b.classList.toggle('on');
      b.setAttribute('aria-pressed', on);
      $('small', b).textContent = labels[b.dataset.k][on ? 0 : 1];
      if (b.dataset.k === 'alarm') { ctrl.classList.toggle('armed', on); state.textContent = on ? 'Armed' : 'Disarmed'; }
    }));
  });

  const groups = ['.section', '.marquee', '.feat li', '.steps li', '.why-item', '.about-grid article', '.bento > *', '.svc-card', '.day-steps li', '.gallery > *'];
  const revealEls = [];
  groups.forEach(sel => $$(sel).forEach(el => {
    if (el.closest('.hero-frame') || el.classList.contains('reveal')) return;
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

  const topFrame = $('.hero-frame');
  if (topFrame) new IntersectionObserver(([en]) => document.body.classList.toggle('past-hero', !en.isIntersecting), { threshold: .15 }).observe(topFrame);
  else document.body.classList.add('past-hero');

  const form = $('#quoteForm');
  if (form) {
    const want = new URLSearchParams(location.search).get('service');
    const pre = want && $(`.svc-pick input[data-key="${want}"]`, form);
    if (pre) pre.checked = true;

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
  }

  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  if (tabs.length) {
    const deep = location.hash.slice(1);
    if (tabs.some(t => t.dataset.tab === deep)) { showTab(deep); $('#solutions').scrollIntoView(); }
    else showTab(tabs[0].dataset.tab);
  }
  sweep();
})();
