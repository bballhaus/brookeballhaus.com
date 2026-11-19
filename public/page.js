// Subpages: hero polaroid spins in, title slams down; each entry's polaroid tosses in as you scroll.
(() => {
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => hero.classList.add('go'));
    if (!still) setTimeout(() => { document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); }, 1400);
  }
  const entries = [...document.querySelectorAll('.entry')];
  function toss() {
    entries.forEach((e, i) => {
      const r = e.getBoundingClientRect();
      const t = still ? 1 : ease(clamp((innerHeight - r.top) / (innerHeight * .55)));
      const pol = e.querySelector('.pol'), txt = e.querySelector('.txt');
      const side = getComputedStyle(pol).order === '2' ? 1 : -1;
      const rot = (i % 2 ? 4 : -4);
      if (pol) pol.style.transform = `translate(${side * (1 - t) * 70}vw, ${(1 - t) * -20}vh) rotate(${rot + side * (1 - t) * 540}deg) scale(${.5 + .5 * t})`;
      if (txt) { txt.style.opacity = clamp(t * 1.4 - .3); txt.style.transform = `translateY(${(1 - t) * 30}px)`; }
    });
  }
  addEventListener('scroll', toss, { passive: true }); addEventListener('resize', toss); toss();

  // showjumping: each show's three polaroids toss in one after another
  const shows = [...document.querySelectorAll('.show')];
  function tossShows() {
    shows.forEach((sh, i) => {
      const r = sh.getBoundingClientRect();
      const base = clamp((innerHeight - r.top) / (innerHeight * .7));
      const side = i % 2 ? -1 : 1;
      sh.querySelectorAll('.pols .pol').forEach((p, j) => {
        const t = still ? 1 : ease(clamp(base * 1.6 - j * .25));
        const rot = parseFloat(p.style.getPropertyValue('--r')) || 0;
        p.style.transform = `translate(${side * (1 - t) * 60}vw, ${(1 - t) * -15}vh) rotate(${rot + side * (1 - t) * 420}deg)`;
        p.style.opacity = t > 0.02 ? 1 : 0;
      });
      const txt = sh.querySelector('.txt');
      if (txt) { const t = still ? 1 : ease(clamp(base * 1.4)); txt.style.opacity = clamp(t * 1.4 - .3); txt.style.transform = `translateY(${(1 - t) * 30}px)`; }
    });
  }
  if (shows.length) { addEventListener('scroll', tossShows, { passive: true }); addEventListener('resize', tossShows); tossShows(); }
})();
