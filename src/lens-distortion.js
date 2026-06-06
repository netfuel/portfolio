/**
 * Lens Bulge Distortion
 *
 * Ports the GLSL bulge() function from the reference sandbox:
 *   strengthAmount = strength / (1.0 + pow(dist/radius, 2.0))
 *   sampledUV = (uv - center) * strengthAmount + center
 *
 * The UV remapping pulls sample coordinates toward center, making center
 * content appear magnified/pushed outward — a convex fisheye bulge.
 *
 * The displacement map is baked once in Canvas 2D, injected as an SVG
 * feDisplacementMap filter, and applied to the WHOLE .hero element so
 * the outer rim of the page visually bulges as the rings rush in.
 *
 * The vignette / chromatic canvas is appended to document.body
 * (position:fixed) so it stays in screen-space and is NOT itself filtered.
 */

// ─── Build displacement map (same maths as sandbox main.frag) ────────────
function buildBulgeMap(size = 512, strength = 1.1, radius = 0.6) {
  const offscreen = document.createElement('canvas');
  offscreen.width = offscreen.height = size;
  const ctx = offscreen.getContext('2d');
  const id  = ctx.createImageData(size, size);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u  = px / (size - 1);
      const v  = py / (size - 1);
      let   nx = u - 0.5;
      let   ny = v - 0.5;

      const dist    = Math.sqrt(nx * nx + ny * ny) / radius;
      const amount  = strength / (1.0 + dist * dist);

      // where the shader would actually sample
      const su = nx * amount + 0.5;
      const sv = ny * amount + 0.5;

      // displacement vector (sample - original)
      const dx = su - u;   // ≈ –0.27 … +0.27
      const dy = sv - v;

      // encode: 128 = no displacement, <128 = negative, >128 = positive
      const r = Math.max(0, Math.min(255, Math.round((0.5 + dx) * 255)));
      const g = Math.max(0, Math.min(255, Math.round((0.5 + dy) * 255)));

      const i = (py * size + px) * 4;
      id.data[i]     = r;
      id.data[i + 1] = g;
      id.data[i + 2] = 128;
      id.data[i + 3] = 255;
    }
  }

  ctx.putImageData(id, 0, 0);
  return offscreen.toDataURL('image/png');
}

// ─── Main ─────────────────────────────────────────────────────────────────
export function initLensDistortion(hero) {
  if (!hero) return null;

  // ── 1. Bake displacement map ────────────────────────────────────────────
  const mapDataURL = buildBulgeMap(512, 1.1, 0.6);

  // ── 2. SVG filter — injected into <body> so it's globally reachable ─────
  const NS    = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(NS, 'svg');
  svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';

  const defs   = document.createElementNS(NS, 'defs');
  const filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', 'heroBulge');
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  // Generous region — displaced pixels near edges must not be clipped
  filter.setAttribute('x', '-30%');
  filter.setAttribute('y', '-30%');
  filter.setAttribute('width', '160%');
  filter.setAttribute('height', '160%');

  const feImg = document.createElementNS(NS, 'feImage');
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

  // Pre-attach filter to hero at scale 0 (avoids re-composite flash on first trigger)
  hero.style.filter = 'url(#heroBulge)';
  // Remove overflow:hidden while filter is live so displaced edge pixels aren't clipped
  const originalOverflow = hero.style.overflow;
  hero.style.overflow = 'visible';

  // ── 3. Screen-space canvas — appended to body so it is NOT filtered ─────
  const canvas = document.createElement('canvas');
  canvas.style.cssText = [
    'position:fixed', 'top:0', 'left:0',
    'width:100%', 'height:100%',
    'pointer-events:none',
    'z-index:999',
    'opacity:0',
  ].join(';');
  document.body.appendChild(canvas);

  let W = 0, H = 0, currentT = 0, rafId = null;

  const sizeCanvas = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    drawOverlay(currentT);
  };

  window.addEventListener('resize', sizeCanvas);
  sizeCanvas();

  function drawOverlay(t) {
    canvas.style.opacity = t > 0 ? '1' : '0';
    if (!W || !H || t <= 0) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const r  = Math.hypot(cx, cy);

    // Vignette — radial dark ring that tightens toward centre
    const vig = ctx.createRadialGradient(
      cx, cy, (0.42 - t * 0.22) * r,
      cx, cy, (0.78 - t * 0.12) * r,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${t * 0.72})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Chromatic aberration — red upper-right, blue lower-left
    ctx.globalCompositeOperation = 'screen';
    const ca     = t * 0.8;
    const spread = 0.28 + t * 0.28;

    const red = ctx.createRadialGradient(
      cx + W * 0.20 * t, cy - H * 0.20 * t, 0,
      cx, cy, r,
    );
    red.addColorStop(Math.max(0, 1 - spread), 'rgba(255,0,80,0)');
    red.addColorStop(1, `rgba(255,0,80,${ca})`);
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, W, H);

    const blue = ctx.createRadialGradient(
      cx - W * 0.20 * t, cy + H * 0.20 * t, 0,
      cx, cy, r,
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

      // Scale drives pixel displacement magnitude.
      // At t=1, max corner displacement ≈ 0.27 × shorter viewport edge.
      // Factor 1.6 makes it clearly visible without breaking.
      const maxScale = Math.min(W, H) * 0.27 * 1.6;
      feDisp.setAttribute('scale', (t * maxScale).toFixed(1));

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => { rafId = null; drawOverlay(t); });
    },

    dispose() {
      window.removeEventListener('resize', sizeCanvas);
      if (rafId) cancelAnimationFrame(rafId);
      canvas.remove();
      svgEl.remove();
      hero.style.filter   = '';
      hero.style.overflow = originalOverflow;
    },
  };
}
