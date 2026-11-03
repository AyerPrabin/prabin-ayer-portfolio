/* Hero: the portrait bust as a 3D dot sculpture (assets/img/portrait-dots.bin, baked offline from a
   cut-out of portrait.jpg). The head is a full 3D shell (front + back) that turns on the neck to look at
   the cursor; the shoulders follow a little. On load the dots fly in from a cloud. "Reveal" scatters them
   and the real photo fades in underneath. Orthographic camera, so at rest each dot sits on its pixel of
   the photo. No WebGL: the photo shows. Reduced motion: still sculpture, no fly-in. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const stage = document.getElementById('dot-stage');
const hero = document.getElementById('hero');
const btn = document.getElementById('dot-reveal');
const GW = 250, GH = 224;                                   // grid the dots were baked on (bake.py)
const HEAD = { x: 97, y: 44, rx: 36, ry: 44 };              // head ellipse on that grid
const NECK = { x: 100, y: 86 };                             // pivot the head turns on
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fallback() { stage.classList.add('revealed', 'no-gl'); hero.classList.add('is-revealed'); if (btn) btn.hidden = true; }

async function start() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' }); }
  catch { return fallback(); }
  const buf = await fetch('assets/img/portrait-dots.bin').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
  if (!buf) return fallback();
  const raw = new Uint16Array(buf), n0 = raw.length / 3;

  // build points: body as baked, head as a rounded shell with a back so it reads as solid when it turns
  const P = [], L = [], Wt = [];
  const add = (x, y, z, l, w) => { P.push(x - GW / 2, GH / 2 - y, z); L.push(l); Wt.push(w); };
  for (let i = 0; i < n0; i++) {
    const x = raw[i * 3] + (Math.random() - .5) * .9, y = raw[i * 3 + 1] + (Math.random() - .5) * .9, zl = raw[i * 3 + 2];
    const l = .22 + (zl & 255) / 255 * .78;
    const ex = (x - HEAD.x) / HEAD.rx, ey = (y - HEAD.y) / HEAD.ry, e = Math.hypot(ex, ey);
    const w = 1 - smooth(.97, 1.06, e);                     // 1 inside the head, 0 on the collar and body
    const z = (zl >> 8) / 255 * 72;                         // AI depth map (Depth Anything V2), face relief baked in
    add(x, y, z, l, w);
    // back of the head: a dimmer shell behind the face, thickest in the middle, so a turned head looks solid
    if (w > .7 && Math.random() < .55) add(x, y, z - Math.sqrt(Math.max(0, 1 - e * e)) * HEAD.rx * 1.05, l * .42, w);
  }
  const n = L.length;

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -3000, 3000);
  const body = new THREE.Group(); scene.add(body);

  const seed = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
    seed[i * 3] = Math.sin(b) * Math.cos(a); seed[i * 3 + 1] = Math.cos(b) * .6 + .4; seed[i * 3 + 2] = Math.sin(b) * Math.sin(a);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('lum', new THREE.BufferAttribute(new Float32Array(L), 1));
  geo.setAttribute('hw', new THREE.BufferAttribute(new Float32Array(Wt), 1));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
  const pivot = new THREE.Vector3(NECK.x - GW / 2, GH / 2 - NECK.y, 30);   // z: middle of the head, so it turns in place
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uScale: { value: 1 }, uSize: { value: 2 }, uTime: { value: 0 }, uScatter: { value: 1 }, uWobble: { value: reduce ? 0 : 1 },
      uHead: { value: new THREE.Matrix3() }, uPivot: { value: pivot } },
    vertexShader: `
      attribute float lum, hw; attribute vec3 seed;
      uniform float uScale, uSize, uTime, uScatter, uWobble; uniform mat3 uHead; uniform vec3 uPivot;
      varying float vL, vA;
      void main(){
        vec3 p = position;
        p = mix(p, uPivot + uHead * (p - uPivot), hw);                    // the head turns on the neck
        p += normalize(p + vec3(.001)) * sin(uTime*1.4 + p.y*.09 + p.x*.04) * .9 * uWobble;   // breathing shimmer
        float r = smoothstep(0., 1., uScatter);
        p += seed * r * (140. + 180.*fract(seed.x*91.7));                  // fly-in / dissolve
        p.y += r * r * 30.;
        vec4 mv = modelViewMatrix * vec4(p * uScale, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (.75 + lum*.7) * (1. - r*.55);
        vL = lum;
        vA = smoothstep(-${(GH / 2).toFixed(1)}, -${(GH / 2 - 34).toFixed(1)}, position.y) * (1. - r*.85);   // soft cut at the bottom
      }`,
    fragmentShader: `
      varying float vL, vA;
      void main(){
        vec2 c = gl_PointCoord - .5; float d = dot(c, c);
        if (d > .25) discard;
        vec3 ember = vec3(.62,.08,.02), hot = vec3(1.,.32,.08), spark = vec3(1.,.74,.45);
        vec3 col = mix(ember, hot, smoothstep(.15,.6,vL)); col = mix(col, spark, smoothstep(.75,1.,vL));
        gl_FragColor = vec4(col, vA * (1. - d*3.2) * (.55 + vL*.65));
      }`,
  });
  body.add(new THREE.Points(geo, mat));

  let W = 0, H = 0, S = 1;
  function size() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2; cam.updateProjectionMatrix();
    S = Math.min(H / GH, W / GW);                             // bust fills the stage, bottom-aligned like the photo
    body.position.y = -(H - GH * S) / 2;
    mat.uniforms.uScale.value = S;
    mat.uniforms.uSize.value = Math.max(1.25, S * .72) * renderer.getPixelRatio();   // fine sand, like the reel
    stage.style.setProperty('--photo-w', GW * S + 'px');
  }
  size(); new ResizeObserver(size).observe(stage);

  // where the head is on screen, so it looks AT the pointer (not just left/right of the page)
  const look = { x: 0, y: 0, active: false }, head = { yaw: 0, pitch: 0 }, torso = { yaw: 0 };
  let lastMove = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    const hx = r.left + W / 2 + (HEAD.x - GW / 2) * S, hy = r.top + H / 2 - body.position.y - (GH / 2 - HEAD.y) * S;
    look.x = (e.clientX - hx) / Math.max(320, innerWidth * .45);
    look.y = (e.clientY - hy) / Math.max(260, innerHeight * .55);
    lastMove = performance.now();
  }, { passive: true });

  let revealed = false, sc = reduce ? 0 : 1, visible = true, raf = 0;
  if (btn) btn.hidden = false;
  btn?.addEventListener('click', () => {
    revealed = !revealed;
    stage.classList.toggle('revealed', revealed); hero.classList.toggle('is-revealed', revealed);
    btn.setAttribute('aria-pressed', revealed);
    btn.lastElementChild.textContent = revealed ? 'Back to dots' : 'Reveal';
    loop();
  });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  const m4 = new THREE.Matrix4(), eul = new THREE.Euler();
  const t0 = performance.now();
  function frame(now) {
    raf = 0;
    const t = (now - t0) / 1000;
    let ty = 0, tp = 0;
    if (!revealed && !reduce) {
      if (now - lastMove < 2500) { ty = clamp(look.x, -1, 1) * .26; tp = clamp(look.y, -1, 1) * .2; }   // just a bit: a glance, not a spin
      else { ty = Math.sin(t * .4) * .12; tp = Math.sin(t * .27) * .05; }      // idle / touch: a slow, small look around
    }
    head.yaw += (ty - head.yaw) * .06; head.pitch += (tp - head.pitch) * .06;
    torso.yaw += (ty * .15 - torso.yaw) * .04;
    body.rotation.y = torso.yaw; body.rotation.x = head.pitch * .12;
    m4.makeRotationFromEuler(eul.set(head.pitch * .85, head.yaw * .78, -head.yaw * .05, 'YXZ'));
    mat.uniforms.uHead.value.setFromMatrix4(m4);
    sc += ((revealed ? 1 : 0) - sc) * (reduce ? 1 : revealed ? .05 : .035);
    mat.uniforms.uScatter.value = sc; mat.uniforms.uTime.value = t;
    renderer.render(scene, cam);
    const settled = reduce || (revealed && sc > .995);
    if (visible && !document.hidden && !settled) loop();
  }
  function loop() { if (!raf) raf = requestAnimationFrame(frame); }
  stage.classList.add('gl-on');
  loop();
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
start().catch(fallback);
