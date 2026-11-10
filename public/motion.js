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

    // Progress line on the right edge.
    if (bar) bar.style.transform = `scaleY(${y / Math.max(1, document.documentElement.scrollHeight - H)})`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
