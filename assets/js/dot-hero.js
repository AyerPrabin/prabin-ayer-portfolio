/* Hero: the portrait as a 3D dot sculpture (assets/img/portrait-dots.bin, baked offline from a
   cut-out of portrait.jpg). It turns to follow the cursor; "Reveal" scatters the dots and the real
   photo fades in underneath. Orthographic camera, so at rest each dot sits exactly on its pixel
   of the photo and the hand-off lines up. No WebGL / reduced motion: the photo just shows. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const stage = document.getElementById('dot-stage');
const btn = document.getElementById('dot-reveal');
const GW = 230, GH = 279;   // grid the dots were baked on (bake.py)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fallback() { stage.classList.add('revealed', 'no-gl'); if (btn) btn.hidden = true; }

async function start() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' }); }
  catch { return fallback(); }
  const buf = await fetch('assets/img/portrait-dots.bin').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
  if (!buf) return fallback();
  const raw = new Uint16Array(buf), n = raw.length / 3;

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
  const group = new THREE.Group(); scene.add(group);

  // positions are in grid units around the portrait centre; scale to CSS px happens per resize
  const pos = new Float32Array(n * 3), lum = new Float32Array(n), seed = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = raw[i * 3], y = raw[i * 3 + 1], zl = raw[i * 3 + 2];
    pos[i * 3] = x - GW / 2 + (Math.random() - .5) * .9; pos[i * 3 + 1] = GH / 2 - y + (Math.random() - .5) * .9;   // jitter: dots, not a pixel grid pos[i * 3 + 2] = (zl >> 8) / 255 * 46;
    lum[i] = .22 + (zl & 255) / 255 * .78;   // a floor, so the dark face and coat still read as dots
    const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
    seed[i * 3] = Math.sin(b) * Math.cos(a); seed[i * 3 + 1] = Math.cos(b) * .6 + .4; seed[i * 3 + 2] = Math.sin(b) * Math.sin(a);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('lum', new THREE.BufferAttribute(lum, 1));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uScale: { value: 1 }, uSize: { value: 2 }, uTime: { value: 0 }, uReveal: { value: 0 }, uWobble: { value: reduce ? 0 : 1 } },
    vertexShader: `
      attribute float lum; attribute vec3 seed;
      uniform float uScale, uSize, uTime, uReveal, uWobble;
      varying float vL, vA;
      void main(){
        vec3 p = position;
        p.z += sin(uTime*1.3 + p.y*.08 + p.x*.05) * 1.6 * uWobble;          // the sculpture breathes
        float r = smoothstep(0., 1., uReveal);
        p += seed * r * (120. + 160.*fract(seed.x*91.7));                   // dissolve outward
        p.y += r * r * 40.;
        vec4 mv = modelViewMatrix * vec4(p * uScale, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (.75 + lum*.7) * (1. - r*.6);
        vL = lum;
        float base = smoothstep(-${(GH / 2).toFixed(1)}, -${(GH / 2 - 40).toFixed(1)}, position.y);   // fade the cut at the bottom
        vA = base * (1. - r);
      }`,
    fragmentShader: `
      varying float vL, vA;
      void main(){
        vec2 c = gl_PointCoord - .5; float d = dot(c, c);
        if (d > .25) discard;
        vec3 ember = vec3(.55,.13,.03), hot = vec3(1.,.5,.18), spark = vec3(1.,.86,.62);
        vec3 col = mix(ember, hot, smoothstep(.1,.6,vL)); col = mix(col, spark, smoothstep(.72,1.,vL));
        gl_FragColor = vec4(col, vA * (1. - d*3.2) * (.5 + vL*.6));
      }`,
  });
  group.add(new THREE.Points(geo, mat));

  let W = 0, H = 0;
  function size() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2; cam.updateProjectionMatrix();
    const s = H / GH;                                   // portrait fills the stage height, bottom-aligned like the photo
    mat.uniforms.uScale.value = s;
    mat.uniforms.uSize.value = Math.max(1.6, s * 1.05) * renderer.getPixelRatio();
    group.position.y = 0;
  }
  size(); new ResizeObserver(size).observe(stage);

  // cursor follow (whole page, so it works over the text too); gentle sway on touch / idle
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let lastMove = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    target.x = (e.clientX / innerWidth - .5) * 1.1; target.y = (e.clientY / innerHeight - .5) * .5; lastMove = performance.now();
  }, { passive: true });

  let revealed = false, rv = 0, visible = true, raf = 0;
  btn.hidden = false;
  btn.addEventListener('click', () => {
    revealed = !revealed;
    stage.classList.toggle('revealed', revealed);
    btn.setAttribute('aria-pressed', revealed);
    btn.lastElementChild.textContent = revealed ? 'Back to dots' : 'Reveal';
    loop();
  });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  const t0 = performance.now();
  function frame(now) {
    raf = 0;
    const t = (now - t0) / 1000;
    if (!reduce && now - lastMove > 2500) { target.x = Math.sin(t * .35) * .35; target.y = Math.sin(t * .23) * .08; }
    const rest = revealed || reduce;                       // face straight on for the hand-off to the photo
    const k = rest ? .12 : .06;
    cur.x += ((rest ? 0 : target.x) - cur.x) * k; cur.y += ((rest ? 0 : target.y) - cur.y) * k;
    group.rotation.y = cur.x; group.rotation.x = cur.y;
    rv += ((revealed ? 1 : 0) - rv) * (reduce ? 1 : .05);
    mat.uniforms.uReveal.value = rv; mat.uniforms.uTime.value = t;
    renderer.render(scene, cam);
    const settled = reduce || (revealed && rv > .995);
    if (visible && !document.hidden && !settled) loop();
  }
  function loop() { if (!raf) raf = requestAnimationFrame(frame); }
  stage.classList.add('gl-on');
  loop();
}
start().catch(fallback);
