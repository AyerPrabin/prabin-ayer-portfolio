/* Shared behavior for every page: mobile nav, reveal-on-scroll, scroll
   progress bar, back-to-top, and a graceful image-fallback helper. Same
   patterns as zulu-website.html's storytelling scroll engine, trimmed to
   what a multi-page CV site actually needs. */

function toggleMenu() {
  const h = document.getElementById('hamburger'), n = document.getElementById('nav-links');
  if (!h || !n) return;
  h.classList.toggle('open'); n.classList.toggle('open');
}
function closeMenu() {
  const h = document.getElementById('hamburger'), n = document.getElementById('nav-links');
  if (!h || !n) return;
  h.classList.remove('open'); n.classList.remove('open');
}

/* Call from an <img onerror="imgFallback(this)">. Marks the parent .img-slot
   as broken so the CSS-only fallback (icon + label) shows instead of the
   browser's broken-image icon — same idea as zulu-website.html's hero photo
   fallback, generalized for every image slot on this site. */
function imgFallback(img) {
  const slot = img.closest('.img-slot');
  if (slot) slot.classList.add('broken');
}

(function () {
  const obs = new IntersectionObserver(es => {
    es.forEach((e, i) => {
      if (e.isIntersecting) {
        const el = e.target;
        const delay = parseFloat(el.dataset.delay || 0) || i * 70;
        setTimeout(() => el.classList.add('vis'), delay);
        obs.unobserve(el);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  const sp = document.getElementById('sp');
  const btt = document.getElementById('btt');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY || window.pageYOffset;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (sp) sp.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      if (btt) btt.classList.toggle('show', y > 600);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
