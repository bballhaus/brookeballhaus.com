// Scroll-driven motion. Everything is skipped when the visitor prefers reduced motion.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Fade-up reveals for rows, cards and lists.
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
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
  if (reduce) { document.querySelectorAll('.w').forEach(w => w.style.opacity = 1); return; }

  // Color field: soft blurred blobs behind the page that change palette per section.
  const PALETTES = [
    ['#e0603f', '#f2b134', '#f3a6b8'],   // terracotta, saffron, blush
    ['#f2b134', '#7fae8c', '#3d6fd6'],   // saffron, sage, cobalt
    ['#3d6fd6', '#2fa39b', '#f2b134'],   // cobalt, teal, saffron
    ['#e0603f', '#8c4fa3', '#f2b134'],   // terracotta, plum, saffron
    ['#f3a6b8', '#3d6fd6', '#7fae8c'],   // blush, cobalt, sage
  ];
  const field = document.createElement('div');
  field.className = 'color-field'; field.setAttribute('aria-hidden', 'true');
  field.innerHTML = '<i></i><i></i><i></i>';
  document.body.prepend(field);
  const blobs = [...field.children];
  const sections = [...document.querySelectorAll('body > section, body > .hero')];
  sections.forEach((sec, i) => { sec.dataset.palette = i % PALETTES.length; });
  let current = -1;
  const setPalette = i => {
    if (i === current) return; current = i;
    PALETTES[i].forEach((c, k) => blobs[k].style.background = `radial-gradient(circle at 50% 50%, ${c} 0%, ${c}00 68%)`);
  };
  setPalette(0);
  const pio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setPalette(+e.target.dataset.palette); }), { rootMargin: '-45% 0px -45% 0px' });
  sections.forEach(s => pio.observe(s));

  // Photos bloom from grey into full color as they scroll into view.
  const phio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('bloom'); phio.unobserve(e.target); } }), { threshold: .35 });
  document.querySelectorAll('.photo').forEach(ph => { ph.classList.add('greyed'); phio.observe(ph); });

  // Section titles get a painted color underline when they enter.
  document.querySelectorAll('.section-head h2, .doors h2').forEach(h => h.classList.add('paint'));
  const hio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('painted'); hio.unobserve(e.target); } }), { threshold: .6 });
  document.querySelectorAll('.paint').forEach(h => hio.observe(h));


  const vh = () => innerHeight;
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));
  const words = [...document.querySelectorAll('.words')].map(p => ({ p, ws: [...p.querySelectorAll('.w')] }));
  const speedEls = [...document.querySelectorAll('[data-speed]')];
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const drift = [...document.querySelectorAll('[data-drift]')];
  const titles = [...document.querySelectorAll('.slide-title, .doors h2, .contact h2')];
  const bar = document.querySelector('.progress span');

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

    // Blobs orbit and breathe as you scroll.
    const p = y / Math.max(1, document.documentElement.scrollHeight - H);
    blobs.forEach((b, k) => {
      const a = p * Math.PI * 4 + k * 2.1;
      const x = 50 + Math.cos(a) * (28 + k * 6), yy = 45 + Math.sin(a * .8) * (26 - k * 4);
      const sc = 1 + .25 * Math.sin(a * 1.3);
      b.style.transform = `translate3d(${x - 50}vw, ${yy - 50}vh, 0) scale(${sc})`;
    });

    // Progress line on the right edge.
    if (bar) bar.style.transform = `scaleY(${y / Math.max(1, document.documentElement.scrollHeight - H)})`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
