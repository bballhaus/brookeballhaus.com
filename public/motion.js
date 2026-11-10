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

  // Lines of color: a few thin ribbons that weave down the whole page and draw themselves as you scroll.
  const COLORS = ['#e0603f', '#f2b134', '#2fa39b', '#3d6fd6', '#8c4fa3'];
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('color-lines'); svg.setAttribute('aria-hidden', 'true');
  document.body.prepend(svg);
  let paths = [];
  const buildLines = () => {
    const W = document.documentElement.clientWidth, Hd = document.documentElement.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${Hd}`); svg.style.height = Hd + 'px';
    svg.innerHTML = '';
    const step = Math.max(500, innerHeight * .75);
    paths = COLORS.map((c, k) => {
      const off = (k - 2) * 16;                       // ribbons run side by side
      // Smooth S-curves: every node has a vertical tangent, so there are no kinks.
      const xs = [.86, .1, .72, .2, .9, .34, .78, .06];
      let px = W * xs[0] + off, py = -40;
      let d = `M ${px} ${py}`;
      for (let i = 1; py < Hd + step; i++) {
        const nx = W * xs[i % xs.length] + off, ny = py + step;
        d += ` C ${px} ${py + step * .55}, ${nx} ${ny - step * .55}, ${nx} ${ny}`;
        px = nx; py = ny;
      }
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d); p.setAttribute('stroke', c);
      svg.append(p);
      const len = p.getTotalLength();
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      return { p, len };
    });
  };
  buildLines();
  addEventListener('load', buildLines);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(buildLines, 200); });

  // Section titles get a painted color underline when they enter.
  document.querySelectorAll('.section-head h2, .doors h2').forEach(h => h.classList.add('paint'));
  const hio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('painted'); hio.unobserve(e.target); } }), { threshold: .6 });
  document.querySelectorAll('.paint').forEach(h => hio.observe(h));

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

    // Draw the color lines in step with scrolling (slightly ahead of the viewport).
    const reach = (y + H * .9) / Math.max(1, document.documentElement.scrollHeight);
    paths.forEach(({ p, len }, k) => { p.style.strokeDashoffset = len * (1 - Math.min(1, reach * (1 - k * .015))); });

    // Progress line on the right edge.
    if (bar) bar.style.transform = `scaleY(${y / Math.max(1, document.documentElement.scrollHeight - H)})`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
