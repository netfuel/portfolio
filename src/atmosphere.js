// Fog atmosphere — one fullscreen triangle, one shader, raw WebGL.
// (This was previously Three.js; a 475KB dependency for a single quad.)

const VERT = /* glsl */ `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

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

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("atmosphere shader: " + log);
  }
  return shader;
};

export function initAtmosphere() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile  = window.matchMedia("(max-width: 720px)").matches;

  const canvas = document.createElement("canvas");
  canvas.id = "atmosphere";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const gl = canvas.getContext("webgl", {
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) {
    canvas.remove(); // no WebGL — the solid background carries the design
    return;
  }

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("atmosphere link: " + gl.getProgramInfoLog(program));
    }
  } catch {
    canvas.remove();
    return;
  }
  gl.useProgram(program);

  // One triangle covers the whole screen — no index buffer, no quad seam
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const name of ["uTime", "uResolution", "uMouse", "uScroll", "uRippleC", "uRippleT"]) {
    U[name] = gl.getUniformLocation(program, name);
  }

  // Soft fog doesn't need resolution — capping dpr cuts the heaviest fragment
  // workload on the page (~8 fbm octaves/pixel) by up to 30%
  const dpr = mobile ? 1 : Math.min(devicePixelRatio, 1.25);
  let w = window.innerWidth;
  let h = window.innerHeight;

  const setSize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // The shader was tuned against CSS-pixel resolution — keep that contract
    gl.uniform2f(U.uResolution, w, h);
  };
  setSize();

  // Mouse eases toward the pointer — the glow trails like a lantern
  const mouse = { x: 0.5, y: 0.62 };
  const mouseTarget = { x: 0.5, y: 0.62 };
  window.addEventListener("mousemove", (e) => {
    mouseTarget.x = e.clientX / window.innerWidth;
    mouseTarget.y = 1.0 - e.clientY / window.innerHeight;
  });

  // scrollHeight forces layout — cache it instead of reading every frame
  let maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const refreshMaxScroll = () => {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  };
  window.addEventListener("load", refreshMaxScroll);
  const getScrollProgress = () => (maxScroll > 0 ? window.scrollY / maxScroll : 0);

  const t0 = performance.now();
  let raf = null;
  let splashAt = -1;
  let scroll = 0;

  // The loader's circle lands here — the fog ripples out from the impact point
  if (!reduced) {
    window.addEventListener("hero:splash", (e) => {
      const { cx, cy } = e.detail;
      gl.uniform2f(U.uRippleC, cx / window.innerWidth, 1 - cy / window.innerHeight);
      splashAt = (performance.now() - t0) / 1000;
    });
  }

  const renderFrame = () => {
    const elapsed = (performance.now() - t0) / 1000;
    mouse.x += (mouseTarget.x - mouse.x) * 0.045;
    mouse.y += (mouseTarget.y - mouse.y) * 0.045;
    scroll += (getScrollProgress() - scroll) * 0.06;
    gl.uniform1f(U.uTime, elapsed);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform1f(U.uScroll, scroll);
    gl.uniform1f(U.uRippleT, splashAt >= 0 && elapsed - splashAt < 4 ? elapsed - splashAt : -1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  window.addEventListener("resize", () => {
    setSize();
    refreshMaxScroll();
    if (reduced) renderFrame(); // static frame — re-render so it stays crisp
  });

  if (reduced) {
    renderFrame();
    return;
  }

  const start = () => {
    if (raf !== null) return;
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
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
