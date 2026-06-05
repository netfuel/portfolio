/**
 * Lens Bulge Distortion
 *
 * Replicates the GLSL bulge() function from the sandbox fragment shader:
 *   strengthAmount = strength / (1.0 + pow(dist/radius, 2.0))
 *   uv *= strengthAmount
 *
 * That UV-remapping pulls sample coordinates toward center, making the
 * center image appear magnified/pushed outward — a convex bulge.
 *
 * Here we bake the same math into a Canvas-2D displacement map, inject
 * it into an SVG feDisplacementMap filter, and animate the filter's
 * `scale` attribute via setDistortion(0…1).
 *
 * The filter is applied to .hero__rings (so GSAP's transform on the same
 * element stays separate — transform and filter are independent CSS props).
 * The Canvas overlay for vignette + chromatic sits above as screen-space.
 */

// ---------------------------------------------------------------------------
// Build the bulge displacement map — same maths as main.frag
// ---------------------------------------------------------------------------
function buildBulgeMap(size = 512, strength = 1.1, radius = 0.6) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = px / (size - 1);           // [0, 1]
      const v = py / (size - 1);

      // centre-relative UV (same as `uv -= center` in shader)
      let nx = u - 0.5;
      let ny = v - 0.5;

      const dist     = Math.sqrt(nx * nx + ny * ny) / radius;
      const distPow  = dist * dist;
      const amount   = strength / (1.0 + distPow);   // ≈ shader's strengthAmount

      // where the shader actually samples from
      const su = nx * amount + 0.5;
      const sv = ny * amount + 0.5;

      // displacement = sample - original  (range roughly –0.3 … +0.3)
      const dx = su - u;
      const dy = sv - v;

      // encode into 8-bit: 128 = 0, <128 = neg, >128 = pos
      const r = Math.max(0, Math.min(255, Math.round((0.5 + dx) * 255)));
      const g = Math.max(0, Math.min(255, Math.round((0.5 + dy) * 255)));

      const i = (py * size + px) * 4;
      img.data[i]     = r;
      img.data[i + 1] = g;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export function initLensDistortion(hero) {
  if (!hero) return null;

  const rings = hero.querySelector('.hero__rings');
  if (!rings) return null;

  // ── 1. Build displacement map (once) ────────────────────────────────────
  const mapDataURL = buildBulgeMap(512, 1.1, 0.6);

  // ── 2. Inject SVG filter into <body> ────────────────────────────────────
  const NS = 'http://www.w3.org/2000/svg';

  const svgEl = document.createElementNS(NS, 'svg');
  svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';

  const defs   = document.createElementNS(NS, 'defs');
  const filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', 'ringBulge');
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  // large region so displaced pixels don't get clipped
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');

  const feImg = document.createElementNS(NS, 'feImage');
  feImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', mapDataURL);
  feImg.setAttribute('href', mapDataURL);
  feImg.setAttribute('result', 'dispMap');
  feImg.setAttribute('preserveAspectRatio', 'none');

  const feDisp = document.createElementNS(NS, 'feDisplacementMap');
  feDisp.setAttribute('in', 'SourceGraphic');
  feDisp.setAttribute('in2', 'dispMap');
  feDisp.setAttribute('scale', '0');
  feDisp.setAttribute('xChannelSelector', 'R');
  feDisp.setAttribute('yChannelSelector', 'G');

  filter.appendChild(feImg);
  filter.appendChild(feDisp);
  defs.appendChild(filter);
  svgEl.appendChild(defs);
  document.body.appendChild(svgEl);

  // ── 3. Canvas overlay for vignette + chromatic aberration ────────────────
  const canvas = document.createElement('canvas');
  canvas.style.cssText = [
    'position:absolute', 'inset:0',
    'width:100%', 'height:100%',
    'pointer-events:none', 'z-index:3',
  ].join(';');
  hero.appendChild(canvas);

  let W = 0, H = 0, currentT = 0, rafId = null;

  const resize = () => {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    drawOverlay(currentT);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(hero);
  resize();

  function drawOverlay(t) {
    if (!W || !H) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    if (t <= 0) return;

    const cx = W / 2, cy = H / 2;
    const r  = Math.hypot(cx, cy);

    // Vignette — tightens as distortion grows
    const vig = ctx.createRadialGradient(
      cx, cy, (0.45 - t * 0.20) * r,
      cx, cy, (0.80 - t * 0.15) * r,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${t * 0.70})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Chromatic aberration — red fringe upper-right, blue lower-left
    ctx.globalCompositeOperation = 'screen';
    const ca     = t * 0.75;
    const spread = 0.30 + t * 0.25;

    const red = ctx.createRadialGradient(
      cx + W * 0.22 * t, cy - H * 0.22 * t, 0, cx, cy, r,
    );
    red.addColorStop(Math.max(0, 1 - spread), 'rgba(255,0,80,0)');
    red.addColorStop(1, `rgba(255,0,80,${ca})`);
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, W, H);

    const blue = ctx.createRadialGradient(
      cx - W * 0.22 * t, cy + H * 0.22 * t, 0, cx, cy, r,
    );
    blue.addColorStop(Math.max(0, 1 - spread), 'rgba(0,80,255,0)');
    blue.addColorStop(1, `rgba(0,80,255,${ca})`);
    ctx.fillStyle = blue;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 4. Public API ────────────────────────────────────────────────────────
  return {
    setDistortion(amount) {
      const t = Math.max(0, Math.min(1, amount));
      currentT = t;

      // Bulge scale: at t=1 the max displacement ≈ 0.27× the shorter viewport edge.
      // Multiply by 1.8 for a dramatic effect.
      const maxScale = Math.min(W, H) * 0.27 * 1.8;
      feDisp.setAttribute('scale', (t * maxScale).toFixed(2));

      // Attach / detach filter on rings (not on hero — avoids stacking-context issues)
      rings.style.filter = t > 0.01 ? 'url(#ringBulge)' : '';

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => { rafId = null; drawOverlay(t); });
    },

    dispose() {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      canvas.remove();
      svgEl.remove();
      rings.style.filter = '';
    },
  };
}
