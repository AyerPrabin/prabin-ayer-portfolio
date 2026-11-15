/* Cinematic opening, timed like a film title card (styles: assets/css/intro.css).
   index.html's inline head script adds html.intro-on only on the first visit of a session without
   reduced motion, and creates window.jdIntro, a promise dot-hero.js waits on before the dots fly in. */
(function () {
  const done = window.jdIntroDone || function () {};
  const el = document.getElementById('intro');
  if (!el || !document.documentElement.classList.contains('intro-on')) { done(); return; }
  const pre = el.querySelector('.intro-pre'), timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  let ended = false;

  const line = 'Coventry University London · 2027';
  let i = 0;
  at(250, () => { el.classList.add('s1'); (function type() { pre.innerHTML = line.slice(0, ++i) + '<i>_</i>'; if (i < line.length) timers.push(setTimeout(type, 34)); })(); });
  at(1700, () => el.classList.add('s2'));       // flare crosses, the name comes out of the blur
  at(3000, () => el.classList.add('s3'));       // light glints across the name, subtitle
  at(4300, finish);

  function finish() {
    if (ended) return; ended = true;
    timers.forEach(clearTimeout);
    el.classList.add('s2', 's3', 'open');      // bars open, the title pushes towards the viewer
    done();                                     // the portrait starts assembling behind it
    setTimeout(() => el.classList.add('out'), 350);
    setTimeout(() => { document.documentElement.classList.remove('intro-on'); el.remove(); document.querySelector('.hero-name')?.classList.add('glint'); }, 1300);
    removeEventListener('keydown', finish); removeEventListener('wheel', finish); removeEventListener('touchmove', finish);
  }
  el.addEventListener('click', finish);
  addEventListener('keydown', finish); addEventListener('wheel', finish, { passive: true }); addEventListener('touchmove', finish, { passive: true });
})();
