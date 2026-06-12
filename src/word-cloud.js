import * as THREE from "three";

const WORDS = [
  "Agentic UX",
  "Malleable Interfaces",
  "Design Systems",
  "Developer Experience",
  "Emerging Tech",
  "Extensibility",
  "Generative Design",
  "Brand Design",
];

const BONE = "#E8E3D6";

// Soft radial glow texture for the mouse-light — drawn once, reused
function makeGlowTexture() {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  // Gaussian falloff — no perceptible edge even at very low sprite opacity
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const a = 0.55 * Math.exp(-((t * 2.6) ** 2));
    g.addColorStop(t, `rgba(255, 244, 218, ${a.toFixed(4)})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const DUST_COUNT = 380;

const DUST_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSeed;
  uniform float uTime;
  uniform float uDpr;
  uniform vec3 uLight;
  varying float vAlpha;
  varying float vGlow;

  void main() {
    vec3 p = position;
    // Slow volumetric drift — each mote on its own phase so the field never repeats
    p.x += sin(uTime * 0.11 + aPhase) * 0.42;
    p.y += sin(uTime * 0.07 + aPhase * 1.7) * 0.34 + sin(uTime * 0.045 + aSeed) * 0.2;
    p.z += cos(uTime * 0.09 + aSeed * 3.1) * 0.38;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    gl_PointSize = min(aSize * uDpr * (105.0 / dist), 26.0 * uDpr);

    // Depth cue: motes dim and shrink as they recede
    vAlpha = clamp(1.25 - dist / 16.0, 0.04, 0.8);
    // Big near-camera bokeh stays ghostly — large discs read soft, not solid
    vAlpha *= mix(1.0, 0.28, smoothstep(8.0, 26.0, gl_PointSize / uDpr));
    // Slow individual twinkle
    vAlpha *= 0.55 + 0.45 * sin(uTime * (0.25 + aSeed * 0.5) + aPhase * 6.2831);

    // Motes catch the mouse-light as it sweeps past them
    float dl = distance((modelMatrix * vec4(p, 1.0)).xyz, uLight);
    vGlow = exp(-dl * dl * 0.045);

    gl_Position = projectionMatrix * mv;
  }
`;

const DUST_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uFade;
  varying float vAlpha;
  varying float vGlow;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.1, d) * 0.85 + smoothstep(0.18, 0.0, d) * 0.15;
    vec3 base = vec3(0.50, 0.48, 0.43);          // unlit bone-grey dust
    vec3 lit  = vec3(1.0, 0.95, 0.82);           // warm key-light
    vec3 col  = mix(base, lit, vGlow);
    float a = disc * vAlpha * (0.07 + vGlow * 0.55) * uFade;
    gl_FragColor = vec4(col, a);
  }
`;

// Splash ripple post-pass — bends the rendered cloud like the surface of water.
// Same wave math as the atmosphere shader so the two layers ripple in lockstep.
const RIPPLE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const RIPPLE_FRAG = /* glsl */ `
  precision mediump float;
  uniform sampler2D tDiffuse;
  uniform vec2  uCenter;
  uniform float uT;
  uniform float uAspect;
  varying vec2  vUv;

  void main() {
    vec2  uvA  = vec2(vUv.x * uAspect, vUv.y);
    vec2  cA   = vec2(uCenter.x * uAspect, uCenter.y);
    float d    = length(uvA - cA);
    float band = d - uT * 0.55;
    float wave = sin(band * 50.0) * exp(-band * band * 28.0) * exp(-uT * 1.4);
    vec2  dir  = (uvA - cA) / max(d, 1e-4);
    vec2  uv   = vUv + dir * wave * 0.04 * vec2(1.0 / uAspect, 1.0);
    gl_FragColor = texture2D(tDiffuse, uv);
  }
`;

// Words rendered to canvas textures — drawn oversized for retina crispness
function makeWordTexture(text, fontPx) {
  const pad = Math.round(fontPx * 0.4);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");

  const font = `400 ${fontPx}px "Space Mono", monospace`;
  ctx.font = font;
  const metrics = ctx.measureText(text);

  c.width = Math.ceil(metrics.width) + pad * 2;
  c.height = Math.ceil(fontPx * 1.4);

  ctx.font = font; // canvas resize resets state
  ctx.fillStyle = BONE;
  ctx.textBaseline = "middle";
  ctx.fillText(text, pad, c.height / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  return { tex, w: c.width, h: c.height };
}

export async function initWordCloud() {
  const host = document.querySelector(".hero__cloud");
  if (!host) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The serif must be loaded before words are drawn to textures
  await document.fonts.ready;

  let w = host.clientWidth || window.innerWidth;
  let h = host.clientHeight || window.innerHeight;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  } catch {
    return; // no WebGL — hero simply has no sphere
  }

  const dpr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  host.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  camera.position.z = 14;

  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);

  // Sphere fills the hero vertically — driven by viewport height, not the narrower axis
  const computeRadius = () => {
    const visHalfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    return THREE.MathUtils.clamp(visHalfH * 0.88, 3.5, 7.5);
  };
  let radius = computeRadius();

  // Two passes around the sphere so it reads as full from every angle
  const entries = [...WORDS, ...WORDS];
  const n = entries.length;
  const texPx = Math.round(64 * 0.512 * dpr);   // texture font size in device px
  const pxPerUnit = 150 * dpr;            // texture px → world units
  const sprites = [];

  entries.forEach((word, i) => {
    const { tex, w: tw, h: th } = makeWordTexture(word, texPx);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);

    // Fibonacci sphere distribution — even spread, no clustering
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    sprite.userData.dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);

    // Second pass slightly smaller and deeper — cheap depth richness
    const tier = i < WORDS.length ? 1 : 0.78;
    sprite.userData.tier = tier;
    sprite.userData.baseW = (tw / pxPerUnit) * tier;
    sprite.userData.baseH = (th / pxPerUnit) * tier;

    group.add(sprite);
    sprites.push(sprite);
  });

  // ── Dust field — motes fill the cloud volume, catching the mouse-light ──
  const dustGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(DUST_COUNT * 3);
    const size = new Float32Array(DUST_COUNT);
    const phase = new Float32Array(DUST_COUNT);
    const seed = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      // Unit-sphere volume (cube-root bias toward the rim) — scaled to radius later
      const dir = new THREE.Vector3().randomDirection();
      const r = Math.cbrt(Math.random()) * 1.35;
      pos[i * 3] = dir.x * r;
      pos[i * 3 + 1] = dir.y * r;
      pos[i * 3 + 2] = dir.z * r;
      size[i] = 0.35 + Math.random() * 0.85 + (Math.random() < 0.06 ? 1.2 : 0); // mostly fine grain, a few bokeh motes
      phase[i] = Math.random() * Math.PI * 2;
      seed[i] = Math.random() * 10;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    dustGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    dustGeo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  }

  const dustMat = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uDpr: { value: dpr },
      uFade: { value: 0 },
      uLight: { value: new THREE.Vector3(2, 1.4, 2) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  group.add(dust);

  // Volumetric mouse-light — a layered glow that trails the cursor in 3D
  const glowTex = makeGlowTexture();
  const glowWide = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.07,
  }));
  const glowCore = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.12,
  }));
  scene.add(glowWide, glowCore);

  const lightPos = new THREE.Vector3(2, 1.4, 2);
  const lightTarget = lightPos.clone();

  // Word size follows the sphere so small viewports get a proportionate cloud
  const applyLayout = () => {
    const k = THREE.MathUtils.clamp(radius / 6.5, 0.55, 1.4);
    sprites.forEach((s) => {
      s.position.copy(s.userData.dir).multiplyScalar(radius);
      s.scale.set(s.userData.baseW * k, s.userData.baseH * k, 1);
    });
    dust.scale.setScalar(radius);
    glowWide.scale.setScalar(radius * 3.2);
    glowCore.scale.setScalar(radius * 1.4);
  };
  applyLayout();

  // Mouse steers the sphere's drift and carries the key-light — eased so both trail
  const rotTarget = new THREE.Vector2(0, 0);
  const LIGHT_Z = () => radius * 0.45; // light floats in the front half of the volume
  if (!reduced) {
    window.addEventListener("mousemove", (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      rotTarget.set(-ny * 0.225, nx * 0.3);
      // Unproject the cursor onto the light's depth plane
      const lz = LIGHT_Z();
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - lz);
      lightTarget.set(nx * halfH * camera.aspect, ny * halfH, lz);
    });
  }

  // Scroll flies the cloud forward past the camera — progress comes from the
  // hero's ScrollTrigger in animations.js
  let scrollTarget = 0;
  let scrollP = 0;
  let cloudIdle = false;
  window.addEventListener("hero:scroll", (e) => { scrollTarget = e.detail.p; });

  const worldPos = new THREE.Vector3();
  const ndc = new THREE.Vector3();
  let fade = reduced ? 1 : 0;
  let elapsed = 0;

  // ── Splash ripple post-pass — only pays the extra pass while a ripple is live ──
  const rt = new THREE.WebGLRenderTarget(Math.round(w * dpr), Math.round(h * dpr));
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postScene = new THREE.Scene();
  const postMat = new THREE.ShaderMaterial({
    vertexShader: RIPPLE_VERT,
    fragmentShader: RIPPLE_FRAG,
    uniforms: {
      tDiffuse: { value: rt.texture },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uT: { value: 0 },
      uAspect: { value: w / h },
    },
    transparent: true,
    blending: THREE.NoBlending, // straight copy — keeps the canvas's alpha intact
    depthTest: false,
    depthWrite: false,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

  let splashAt = -1;
  if (!reduced) {
    window.addEventListener("hero:splash", (e) => {
      const r = host.getBoundingClientRect();
      postMat.uniforms.uCenter.value.set(
        (e.detail.cx - r.left) / r.width,
        1 - (e.detail.cy - r.top) / r.height
      );
      splashAt = elapsed;
    });
  }

  const renderFrame = (dt) => {
    if (fade < 1) fade = Math.min(1, fade + dt * 0.45);
    elapsed += dt;

    // Scroll pushes the whole cloud toward (and past) the camera, fading as it goes
    scrollP += (scrollTarget - scrollP) * 0.12;
    group.position.z = scrollP * (camera.position.z + radius);
    const scrollFade = 1 - THREE.MathUtils.smoothstep(scrollP, 0.25, 0.6);

    // Fully faded — clear once and skip all per-sprite work and GPU passes
    if (scrollFade <= 0.002) {
      if (!cloudIdle) { renderer.clear(); cloudIdle = true; }
      return;
    }
    cloudIdle = false;

    group.rotation.y += dt * 0.05;
    group.rotation.x += (rotTarget.x - group.rotation.x) * 0.03;
    group.rotation.z += (rotTarget.y * 0.25 - group.rotation.z) * 0.03;

    // The key-light drifts after the cursor — slow enough to feel weighted
    lightPos.lerp(lightTarget, 0.045);
    glowWide.position.copy(lightPos);
    glowCore.position.copy(lightPos);
    glowWide.material.opacity = 0.05 * fade * scrollFade;
    glowCore.material.opacity = 0.08 * fade * scrollFade;

    dustMat.uniforms.uTime.value = elapsed;
    dustMat.uniforms.uFade.value = fade * scrollFade;
    dustMat.uniforms.uLight.value.copy(lightPos);

    // Depth cue: words dim and recede as they orbit behind.
    // An elliptical clearing keeps the name and tagline legible —
    // words fade as they cross the identity block, glow at the rim.
    // The mouse-light warms words it passes near.
    sprites.forEach((s) => {
      s.getWorldPosition(worldPos);
      const t = (worldPos.z + radius) / (radius * 2); // 0 = back, 1 = front
      ndc.copy(worldPos).project(camera);
      const e = (ndc.x / 0.85) ** 2 + (ndc.y / 0.6) ** 2;
      const clearing = 0.18 + 0.82 * THREE.MathUtils.smoothstep(e, 0.3, 1.1);
      const dl = worldPos.distanceTo(lightPos);
      const lit = 1 + Math.exp(-dl * dl * 0.03) * 0.5;
      s.material.opacity = Math.min(1,
        (0.06 + Math.pow(Math.min(t, 1.6), 1.2) * 0.42) * s.userData.tier * clearing * fade * lit * scrollFade
      );
    });

    const rippleT = splashAt >= 0 ? elapsed - splashAt : -1;
    if (rippleT >= 0 && rippleT < 4) {
      postMat.uniforms.uT.value = rippleT;
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
    } else {
      renderer.render(scene, camera);
    }
  };

  // Dev-only: lets tooling pump frames when rAF is throttled (stripped from prod)
  if (import.meta.env.DEV) host.__cloud = { renderFrame, sprites, camera, group };

  const resize = () => {
    w = host.clientWidth || window.innerWidth;
    h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    rt.setSize(Math.round(w * dpr), Math.round(h * dpr));
    postMat.uniforms.uAspect.value = w / h;
    radius = computeRadius();
    applyLayout();
  };
  window.addEventListener("resize", () => {
    resize();
    if (reduced) renderFrame(0);
  });

  if (reduced) {
    group.rotation.y = 0.6; // pleasant static angle
    renderFrame(0);
    return;
  }

  let raf = null;
  let last = performance.now();

  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    renderFrame(dt);
  };

  const start = () => {
    if (raf !== null) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (raf === null) return;
    cancelAnimationFrame(raf);
    raf = null;
  };

  // Render only while the hero is on screen and the tab is visible
  let heroVisible = true;
  const io = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    heroVisible && !document.hidden ? start() : stop();
  });
  io.observe(host);

  document.addEventListener("visibilitychange", () => {
    !document.hidden && heroVisible ? start() : stop();
  });

  start();

  return () => {
    stop();
    io.disconnect();
    sprites.forEach((s) => {
      s.material.map.dispose();
      s.material.dispose();
    });
    dustGeo.dispose();
    dustMat.dispose();
    rt.dispose();
    postMat.dispose();
    glowTex.dispose();
    glowWide.material.dispose();
    glowCore.material.dispose();
    renderer.dispose();
  };
}
