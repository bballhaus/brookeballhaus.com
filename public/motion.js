// Scroll-driven motion. Everything is skipped when the visitor prefers reduced motion.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Fade-up reveals for rows, cards and lists.
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // 2. Split the About paragraph into words so they can light up as you scroll.
  document.querySelectorAll('.words').forEach(p => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(t); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(p);
  });
  // Hand-drawn marks: a few key words and numbers get a single colored underline, circle or
  // highlighter swipe that draws itself when it scrolls into view.
  const NS = 'http://www.w3.org/2000/svg';
  const SHAPES = {
    u: ['0 0 100 12', 'M2 7 C 22 4, 45 9, 66 6 S 92 4, 98 6'],
    u2: ['0 0 100 14', 'M2 5 C 30 3, 70 7, 97 4 M8 11 C 35 8, 65 12, 92 9'],
    o: ['0 0 100 40', 'M58 4 C 26 1, 3 9, 3 20 C 3 32, 30 38, 56 37 C 84 36, 98 28, 97 18 C 96 8, 74 2, 44 5'],
    h: ['0 0 100 20', 'M1 12 C 30 10, 70 13, 99 10'],
  };
  // Brooke's palette: cardinal leads, show navy second, hunter green and sky now and then.
  const COLORS = ['#8c1515', '#1f2a44', '#8c1515', '#2f5d50', '#8c1515', '#1f2a44', '#8c1515', '#7fb0d4'];
  // Big section titles get a hand-drawn underline too.
  document.querySelectorAll('.section-head h2, .doors h2').forEach(h => {
    const span = document.createElement('span'); span.className = 'mk mk-title'; span.dataset.mk = 'u';
    while (h.firstChild && !(h.firstChild.classList && h.firstChild.classList.contains('arrow'))) span.append(h.firstChild);
    h.prepend(span);
  });
  const marksEls = [...document.querySelectorAll('.mk')];
  // Shapes are drawn on a 100-wide box; scale them to each word's real pixel size so the
  // stroke keeps an even width and the draw-in animation uses the true path length.
  const scalePath = (d, sx, sy) => { let k = 0; return d.replace(/-?\d*\.?\d+/g, n => (parseFloat(n) * (k++ % 2 ? sy : sx)).toFixed(1)); };
  const marks = marksEls.map((el, i) => {
    const kind = el.dataset.mk || 'u';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true'); svg.classList.add('mk-svg', 'mk-' + kind);
    const path = document.createElementNS(NS, 'path');
    svg.style.setProperty('--mk', el.dataset.color || COLORS[i % COLORS.length]);
    svg.style.setProperty('--mk-delay', (i % 3) * 0.12 + 's');
    svg.append(path); el.append(svg);
    return { svg, path, kind };
  });
  const sizeMarks = () => marks.forEach(({ svg, path, kind }) => {
    const [vb, d] = SHAPES[kind], [, , vw, vh] = vb.split(' ').map(Number);
    const r = svg.getBoundingClientRect(); if (!r.width) return;
    svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    path.setAttribute('d', scalePath(d, r.width / vw, r.height / vh));
    const len = Math.ceil(path.getTotalLength()) + 2;
    path.style.strokeDasharray = len; path.style.setProperty('--len', len);
  });
  sizeMarks();
  addEventListener('load', sizeMarks);
  document.fonts && document.fonts.ready.then(sizeMarks);
  let mrt; addEventListener('resize', () => { clearTimeout(mrt); mrt = setTimeout(sizeMarks, 150); });
  if (!reduce) {
    const mio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('drawn'); mio.unobserve(e.target); } }), { threshold: 1, rootMargin: '0px 0px -6% 0px' });
    marksEls.forEach(el => mio.observe(el));
  }

  if (reduce) { document.querySelectorAll('.w').forEach(w => w.style.opacity = 1); document.querySelectorAll('.typed').forEach(t => t.textContent = t.dataset.phrases.split('|')[0]); return; }

  // Photos bloom from grey into full color as they scroll into view.
  const phio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('bloom'); phio.unobserve(e.target); } }), { threshold: .35 });
  document.querySelectorAll('.photo').forEach(ph => { ph.classList.add('greyed'); phio.observe(ph); });



  const vh = () => innerHeight;
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));
  const words = [...document.querySelectorAll('.words')].map(p => ({ p, ws: [...p.querySelectorAll('.w')] }));
  const speedEls = [...document.querySelectorAll('[data-speed]')];
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const drift = [...document.querySelectorAll('[data-drift]')];
  const titles = [...document.querySelectorAll('.slide-title, .doors h2, .contact h2')];
  const bar = document.querySelector('.progress span');
  const ease = t => t * t * t;                       // accelerating, like cubic-bezier(.7,0,.84,0)
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const portrait = document.querySelector('.hero-photo img.settle');
  const heroFig = document.querySelector('.hero-photo');
  const heroText = document.querySelector('.hero-text');
  const chips = [...document.querySelectorAll('.chip')].map((el, i) => ({ el, i, rot: [-4, 3, 5, -3][i] || 0 }));
  const slideUnder = [...document.querySelectorAll('.section-head .mk-title')];
  const railItems = [...document.querySelectorAll('.rail li')].map(li => ({ li, row: document.querySelector(li.querySelector('a').getAttribute('href')) }));

  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY, H = vh();

    // Hero name: the two lines slide apart as you scroll away.
    speedEls.forEach(el => { el.style.transform = `translate3d(${y * parseFloat(el.dataset.speed)}px,0,0)`; });

    // Photos and art drift slower than the page.
    parallax.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const c = (r.top + r.height / 2 - H / 2);
      el.style.transform = `translate3d(0,${clamp(-c * parseFloat(el.dataset.parallax), el.offsetHeight * .055)}px,0) scale(1.12)`;
    });
    drift.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      el.style.transform = `translate3d(0,${clamp((r.top - H / 2) * parseFloat(el.dataset.drift), el.offsetHeight * .07)}px,0) scale(1.15)`;
    });

    // Portrait settles into its frame over the first ~70% of a screen of scrolling (scrubbed).
    if (portrait) {
      const p = clamp01(y / (H * .7));
      portrait.style.transform = `translate3d(0,${-4 + 4 * p}%,0) scale(${1.18 - .18 * p})`;
      heroFig.style.clipPath = `inset(${3 * p}% ${3 * p}% ${3 * p}% ${3 * p}% round ${18 * p}px)`;
    }
    // Scattered topic chips gather toward the tagline and fade, staggered (positions are relative to the hero text box).
    if (chips.length) {
      const lede = heroText.querySelector('.lede'), mark = lede.querySelector('.mk') || lede;
      const tx = lede.offsetLeft + mark.offsetLeft + mark.offsetWidth / 2, ty = lede.offsetTop + mark.offsetTop + mark.offsetHeight / 2;
      chips.forEach(({ el, i, rot }) => {
        const start = i * 40, e = ease(clamp01((y - start) / 300));
        const cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
        el.style.transform = `translate3d(${(tx - cx) * e}px,${(ty - cy) * e}px,0) rotate(${rot * (1 - e)}deg) scale(${1 - .75 * e})`;
        el.style.opacity = 1 - clamp01((y - 140 - start * .6) / 120);
      });
    }
    // Big page titles slip under the rule as the header scrolls away.
    slideUnder.forEach(el => {
      const r = el.closest('.section-head').getBoundingClientRect();
      const p = clamp01((H * .3 - r.bottom) / (H * .3));
      el.style.transform = `translate3d(0,${p * 115}%,0)`;
    });
    // Sticky project rail: each line fills as its project scrolls past; the current one turns cardinal.
    railItems.forEach(({ li, row }) => {
      if (!row) return;
      const r = row.getBoundingClientRect();
      const p = clamp01((H * .55 - r.top) / r.height);
      li.style.setProperty('--fill', p);
      li.classList.toggle('on', p > 0 && p < 1);
    });

    // Big titles glide in from the left as they enter.
    titles.forEach(el => {
      const r = el.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (H - r.top) / (H * .6)));
      el.style.transform = `translate3d(${(1 - t) * -60}px,0,0)`;
      el.style.opacity = .25 + .75 * t;
    });

    // About paragraph: words light up one by one.
    words.forEach(({ p, ws }) => {
      const r = p.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (H * .85 - r.top) / (r.height + H * .35)));
      const n = Math.round(t * ws.length);
      ws.forEach((w, i) => w.classList.toggle('lit', i < n));
    });

    // Progress line on the right edge.
    if (bar) bar.style.transform = `scaleY(${y / Math.max(1, document.documentElement.scrollHeight - H)})`;
  };
  // "Currently ..." line types itself, pauses, erases, and moves to the next phrase.
  document.querySelectorAll('.typed').forEach(el => {
    const phrases = el.dataset.phrases.split('|'); let k = 0, n = 0, dir = 1;
    const tick = () => {
      const w = phrases[k]; n += dir; el.textContent = w.slice(0, n);
      let wait = dir > 0 ? 55 + Math.random() * 45 : 22;
      if (dir > 0 && n >= w.length) { dir = -1; wait = 2200; }
      else if (dir < 0 && n <= 0) { dir = 1; k = (k + 1) % phrases.length; wait = 350; }
      setTimeout(tick, wait);
    };
    tick();
  });

  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
