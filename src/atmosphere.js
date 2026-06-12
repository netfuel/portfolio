import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform float uScroll;
  uniform vec2  uRippleC;   // splash center, uv space
  uniform float uRippleT;   // seconds since splash, negative = inactive
  varying vec2  vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 43.21);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                 hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.05 + vec2(11.3, 7.7);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2  uvA    = vec2(vUv.x * aspect, vUv.y);
    float t      = uTime * 0.035;

    // Splash ripple — an expanding, damped ring that bends the fog like water
    float wave = 0.0;
    if (uRippleT >= 0.0) {
      vec2  cA   = vec2(uRippleC.x * aspect, uRippleC.y);
      float d    = length(uvA - cA);
      float band = d - uRippleT * 0.55;
      wave = sin(band * 50.0) * exp(-band * band * 28.0) * exp(-uRippleT * 1.4);
      vec2 dir = (uvA - cA) / max(d, 1e-4);
      uvA += dir * wave * 0.045;
    }

    // Slow drifting fog — scroll gently advances the field
    vec2  drift = vec2(t * 0.6, -t * 0.35) + vec2(0.0, uScroll * 1.4);
    float fog   = fbm(uvA * 1.7 + drift);
    fog += 0.4 * fbm(uvA * 3.9 - drift * 1.3);
    fog *= 0.72;

    // Near-black base with the faintest warm lift in the fog
    vec3 deep = vec3(0.027, 0.027, 0.036);
    vec3 lit  = vec3(0.058, 0.056, 0.066);
    vec3 color = mix(deep, lit, smoothstep(0.25, 0.95, fog));

    // Mouse: a soft bone-warm glow that breathes through the fog
    vec2  mA   = vec2(uMouse.x * aspect, uMouse.y);
    float d    = length(uvA - mA);
    float glow = exp(-d * 2.6) * (0.5 + 0.5 * fog);
    color += vec3(0.10, 0.094, 0.082) * glow * 0.55;

    // Ripple crest catches light; the trough falls into shadow
    color += vec3(0.16, 0.17, 0.12) * wave * 1.4;

    // Vignette — settles the edges
    vec2  c   = vUv - 0.5;
    float vig = 1.0 - dot(c, c) * 1.5;
    color *= clamp(vig, 0.0, 1.0);

    // Film grain — keeps the dark field alive, hides banding
    float grain = hash(vUv * uResolution + fract(uTime) * 100.0) - 0.5;
    color += grain * 0.028;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function initAtmosphere() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile  = window.matchMedia("(max-width: 720px)").matches;

  const canvas = document.createElement("canvas");
  canvas.id = "atmosphere";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  let w = window.innerWidth;
  let h = window.innerHeight;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
  } catch {
    canvas.remove(); // no WebGL — the solid background carries the design
    return;
  }

  // Soft fog doesn't need resolution — capping dpr cuts the heaviest fragment
  // workload on the page (~8 fbm octaves/pixel) by up to 30%
  renderer.setPixelRatio(mobile ? 1 : Math.min(devicePixelRatio, 1.25));
  renderer.setSize(w, h);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene  = new THREE.Scene();

  const uniforms = {
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2(w, h) },
    uMouse:      { value: new THREE.Vector2(0.5, 0.62) },
    uScroll:     { value: 0 },
    uRippleC:    { value: new THREE.Vector2(0.5, 0.5) },
    uRippleT:    { value: -1 },
  };

  scene.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG })
    )
  );

  // Mouse eases toward the pointer — the glow trails like a lantern
  const mouseTarget = new THREE.Vector2(0.5, 0.62);
  window.addEventListener("mousemove", (e) => {
    mouseTarget.set(e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight);
  });

  const getScrollProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  };

  window.addEventListener("resize", () => {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setSize(w, h);
    uniforms.uResolution.value.set(w, h);
  });

  const clock = new THREE.Clock();
  let raf = null;
  let splashAt = -1;

  // The loader's circle lands here — the fog ripples out from the impact point
  if (!reduced) {
    window.addEventListener("hero:splash", (e) => {
      const { cx, cy } = e.detail;
      uniforms.uRippleC.value.set(cx / window.innerWidth, 1 - cy / window.innerHeight);
      splashAt = clock.getElapsedTime();
    });
  }

  const renderFrame = () => {
    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;
    uniforms.uMouse.value.lerp(mouseTarget, 0.045);
    uniforms.uScroll.value += (getScrollProgress() - uniforms.uScroll.value) * 0.06;
    uniforms.uRippleT.value = splashAt >= 0 && elapsed - splashAt < 4 ? elapsed - splashAt : -1;
    renderer.render(scene, camera);
  };

  if (reduced) {
    // Static frame only — re-render on resize so it stays crisp
    renderFrame();
    window.addEventListener("resize", () => renderFrame());
    return;
  }

  const start = () => {
    if (raf !== null) return;
    clock.getDelta();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      renderFrame();
    };
    tick();
  };

  const stop = () => {
    if (raf === null) return;
    cancelAnimationFrame(raf);
    raf = null;
  };

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  start();

  return () => {
    stop();
    renderer.dispose();
  };
}
