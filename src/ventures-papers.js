import * as THREE from "three";

// Flyer cascade for Creative Ventures — sheets of paper drop out of the
// section-head rule line and drift down like leaves; the visitor can grab
// one mid-air to keep it from falling. A scissor clip bounds the render to
// the band between the rule line and the Writing section, so sheets emerge
// from the line and vanish at the next section — no fades needed.
// Add new flyers here (portrait images read best):
const FLYERS = [
  "/images/flyers/flyer-01.jpg",
  "/images/flyers/flyer-02.jpg",
  "/images/flyers/flyer-03.jpg",
  "/images/flyers/flyer-04.jpg",
  "/images/flyers/flyer-05.jpg",
  "/images/flyers/flyer-06.jpg",
  "/images/flyers/flyer-07.jpg",
  "/images/flyers/flyer-08.jpg",
  "/images/flyers/flyer-09.jpg",
];

// Depth range of the stack. Each sheet owns an exclusive z lane spaced wider
// than curl + tumble can ever reach, so sheets can overlap on screen but the
// geometry can never intersect.
const Z_NEAR = 0.4;
const Z_FAR = -1.12;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec4  uCurl;   // x: edge-curl amp, y: curl waves, z: flutter amp, w: phase
  varying vec2  vUv;
  varying float vShade;
  void main() {
    vUv = uv;
    vec3 p = position;
    // Edge curl — strongest at the sheet's left/right margins, like held paper
    float edge = pow(abs(uv.x - 0.5) * 2.0, 1.6);
    float c1 = sin(uv.y * 6.2831 * uCurl.y + uTime * 1.3 + uCurl.w) * uCurl.x * (0.25 + 0.75 * edge);
    // Slow body flutter across the sheet
    float c2 = sin(uv.x * 7.0 + uTime * 0.9 + uCurl.w * 1.7) * uCurl.z;
    p.z += c1 + c2;
    vShade = (c1 + c2) / (uCurl.x + uCurl.z + 1e-4);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

// The texture passes through untouched so the flyers read exactly like the
// source images — only a whisper of curl shading for dimensionality.
const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2  vUv;
  varying float vShade;
  void main() {
    vec4 tex = texture2D(uMap, vUv);
    vec3 col = tex.rgb * (1.0 + vShade * 0.1);
    if (!gl_FrontFacing) col *= 0.92; // back of the sheet reads slightly darker
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function initVenturePapers() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 720px)").matches;
  const section = document.getElementById("ventures");
  const head = section && section.querySelector(".section__head");
  const writing = document.getElementById("writing");
  // Desktop-only — mobile skips the cascade (and its textures) entirely
  if (reduced || mobile || !section || !head) return;

  // Fewer sheets than flyers — meshes pick the next flyer from the pool on
  // every respawn, so all of them still cycle through
  const COUNT = 6;

  const canvas = document.createElement("canvas");
  canvas.id = "venture-papers";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    canvas.remove();
    return;
  }

  let w = window.innerWidth;
  let h = window.innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(w, h);

  const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 10);
  camera.position.z = 2;
  const scene = new THREE.Scene();

  // World-space size of the viewport at z = 0; multiply by a paper's
  // distance factor to get the visible extent at its depth
  const worldH = () => 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
  const worldW = () => worldH() * camera.aspect;
  // Screen y (CSS px) → world y at a paper's depth
  const screenToWorldY = (yPx, distF) => (0.5 - yPx / h) * worldH() * distF;

  const loader = new THREE.TextureLoader();
  const geometry = new THREE.PlaneGeometry(1, 1, 20, 28);
  const rand = (a, b) => a + Math.random() * (b - a);

  const textures = FLYERS.map((url) =>
    loader.load(url, (t) => { t.anisotropy = 4; })
  );
  let nextTex = 0;

  // ── Build the sheets ────────────────────────────────────────────────────
  // Shuffled z lanes so depth doesn't correlate with spawn order
  const lanes = [...Array(COUNT).keys()].sort(() => Math.random() - 0.5);

  const papers = [];
  for (let i = 0; i < COUNT; i++) {
    const z = THREE.MathUtils.lerp(Z_NEAR, Z_FAR, COUNT > 1 ? lanes[i] / (COUNT - 1) : 0);
    const distF = (camera.position.z - z) / camera.position.z;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap:  { value: null },
        uTime: { value: 0 },
        uCurl: { value: new THREE.Vector4(rand(0.03, 0.05), rand(0.7, 1.3), rand(0.02, 0.032), rand(0, Math.PI * 2)) },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, mat);
    const paper = {
      mesh, mat, z, distF,
      height: worldH() * rand(0.26, 0.36),
      baseX: 0, speed: 0, swayAmp: 0, swayW: 0, phase: rand(0, Math.PI * 2),
      vx: 0, vy: 0, // carries throw inertia after a drag releases
      rotW: rand(0.3, 0.6),
      grabbed: false,
      grabOffset: new THREE.Vector3(),
    };
    papers.push(paper);
    scene.add(mesh);
  }

  // Park a sheet just above the rule line with the next flyer from the pool,
  // so it drops out of the line as it falls. Respawns add a random gap so
  // only a few sheets share the screen.
  // Desktop: bias right-of-center so the lead copy stays readable.
  const placeAtLine = (paper, i) => {
    const W = worldW() * paper.distF;
    paper.baseX = rand(-W * 0.05, W * 0.42);
    // Far sheets fall and sway slower — parallax sells the depth
    const pace = THREE.MathUtils.lerp(1.1, 0.7, (paper.distF - 1) / 0.5);
    paper.speed = rand(0.07, 0.12) * pace;
    paper.swayAmp = rand(0.04, 0.09) * paper.distF;
    paper.swayW = rand(0.25, 0.55);

    const tex = textures[nextTex++ % textures.length];
    paper.mat.uniforms.uMap.value = tex;
    const img = tex.image;
    const aspect = img ? img.width / img.height : 0.647; // flyers are 3300×5100
    paper.mesh.scale.set(paper.height * aspect, paper.height, 1);

    paper.vx = 0;
    paper.vy = -paper.speed;

    const lineY = screenToWorldY(head.getBoundingClientRect().bottom, paper.distF);
    const gap = i != null ? i * rand(1.4, 2.0) : rand(0, 6);
    paper.mesh.position.set(paper.baseX, lineY + paper.height * (0.55 + gap), paper.z);
  };
  papers.forEach((p, i) => placeAtLine(p, i));

  // ── Grab interaction ────────────────────────────────────────────────────
  // The canvas sits behind the page content, so it never receives events —
  // we listen on window instead, and links always win over paper grabs.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(-2, -2);
  let held = null;
  let started = false; // begins once the section has climbed 60% up the page
  const band = { y1: 0, y2: 0 }; // visible strip: rule line → writing top

  // Pointer position projected onto a given z plane
  const pointerAt = (z, out) => {
    const f = (camera.position.z - z) / camera.position.z;
    out.set((ndc.x * worldW() * f) / 2, (ndc.y * worldH() * f) / 2, z);
    return out;
  };
  const pointerWorld = new THREE.Vector3();

  const pick = () => {
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(papers.map((p) => p.mesh), false)[0];
    return hit ? papers.find((p) => p.mesh === hit.object) : null;
  };

  const overInteractive = (e) =>
    e.target instanceof Element && e.target.closest("a, button");

  // Only sheets inside the visible band are grabbable
  const inBand = (e) =>
    started && band.y2 > band.y1 && e.clientY > band.y1 && e.clientY < band.y2;

  window.addEventListener("pointermove", (e) => {
    ndc.set((e.clientX / w) * 2 - 1, -(e.clientY / h) * 2 + 1);
    if (held) return;
    const over = inBand(e) && !overInteractive(e) && pick();
    document.body.style.cursor = over ? "grab" : "";
  });

  window.addEventListener("pointerdown", (e) => {
    if (!inBand(e) || overInteractive(e)) return;
    ndc.set((e.clientX / w) * 2 - 1, -(e.clientY / h) * 2 + 1);
    const paper = pick();
    if (!paper) return;
    held = paper;
    paper.grabbed = true;
    paper.grabOffset.copy(paper.mesh.position).sub(pointerAt(paper.z, pointerWorld));
    paper.grabOffset.z = 0;
    document.body.style.cursor = "grabbing";
    e.preventDefault();
  });

  const release = () => {
    if (!held) return;
    held.grabbed = false;
    held.baseX = held.mesh.position.x; // resume the fall from where it was let go
    held.phase = -performance.now() / 1000 * held.swayW; // re-zero the sway
    // Cap the throw so a violent flick can't launch a sheet into orbit
    const v = Math.hypot(held.vx, held.vy);
    const MAX = 1.4;
    if (v > MAX) { held.vx *= MAX / v; held.vy *= MAX / v; }
    held = null;
    document.body.style.cursor = "grab";
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);

  window.addEventListener("resize", () => {
    w = window.innerWidth;
    h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  const clock = new THREE.Clock();
  let idleFrames = 0;
  let cleared = false;

  const tick = () => {
    requestAnimationFrame(tick);

    // Until the cascade starts, poll the section lazily (every 6th frame)
    // and do no other layout reads or GPU work at all
    if (!started) {
      if (++idleFrames % 6 !== 0) return;
      if (section.getBoundingClientRect().top >= h * 0.4) return;
      started = true;
    }

    // Rect reads are kept to two per frame — layout reads interleaved with
    // the smoother's transform writes are the main scroll-jank tax
    band.y1 = Math.max(0, head.getBoundingClientRect().bottom);
    band.y2 = Math.min(h, writing ? writing.getBoundingClientRect().top : h);

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    if (band.y2 <= band.y1) {
      if (!cleared) {
        renderer.setScissorTest(false);
        renderer.clear();
        cleared = true;
      }
      return;
    }
    cleared = false;

    for (const p of papers) {
      p.mat.uniforms.uTime.value = t;
      const m = p.mesh;

      if (p.grabbed) {
        // Held sheets ease to the pointer and settle flat; track the sheet's
        // real velocity so a fast flick releases as a throw
        const k = 1 - Math.exp(-dt * 14);
        const px = m.position.x, py = m.position.y;
        pointerAt(p.z, pointerWorld);
        m.position.x += (pointerWorld.x + p.grabOffset.x - m.position.x) * k;
        m.position.y += (pointerWorld.y + p.grabOffset.y - m.position.y) * k;
        if (dt > 0) {
          p.vx = (m.position.x - px) / dt;
          p.vy = (m.position.y - py) / dt;
        }
        m.rotation.x += (0 - m.rotation.x) * k;
        m.rotation.y += (0 - m.rotation.y) * k;
        m.rotation.z += (Math.sin(t * 0.8 + p.phase) * 0.03 - m.rotation.z) * k;
        continue;
      }

      // Leaf fall — slow descent with side-to-side sway and a lively twirl.
      // Throw inertia bleeds off here: sideways momentum drags the sway
      // center along while vertical speed relaxes back to the terminal fall.
      // Tilt reach stays under half the z-lane spacing (0.15) so a sheet can
      // never touch a neighboring lane: curl 0.082 + rx 0.031 + ry 0.021.
      // The flat z-spin is free — it adds no depth reach at all.
      p.vx *= Math.exp(-dt * 1.8);
      p.vy += (-p.speed - p.vy) * (1 - Math.exp(-dt * 1.2));
      p.baseX += p.vx * dt;
      m.position.y += p.vy * dt;
      m.position.x = p.baseX + Math.sin(t * p.swayW + p.phase) * p.swayAmp;
      m.rotation.z = Math.sin(t * p.rotW + p.phase) * 0.22
                   + Math.sin(t * p.rotW * 1.7 + p.phase * 2.0) * 0.06;
      m.rotation.x = Math.sin(t * p.rotW * 0.8 + p.phase * 2.0) * 0.12;
      m.rotation.y = Math.sin(t * p.rotW * 0.6 + p.phase * 3.0) * 0.18;

      // Fully below the bottom clip → rejoin the queue above the line
      const bottomY = screenToWorldY(band.y2, p.distF);
      if (m.position.y < bottomY - p.height * 0.75) placeAtLine(p);
    }

    // Full clear first (no scissor) so nothing lingers outside the band as
    // it moves with scroll, then clip the draw to line → writing top
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    renderer.setScissor(0, h - band.y2, w, band.y2 - band.y1);
    renderer.render(scene, camera);
  };
  tick();
}
