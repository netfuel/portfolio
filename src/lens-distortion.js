/**
 * Lens distortion effect — edge chromatic aberration + vignette
 *
 * Draws onto a 2D canvas overlay that sits ABOVE the hero.
 * Never touches the rings' transform — that belongs to GSAP alone.
 * setDistortion(0…1) is called by the ScrollTrigger onUpdate.
 */

export function initLensDistortion(hero) {
  if (!hero) return null;

  const canvas = document.createElement("canvas");
  canvas.style.cssText = [
    "position:absolute",
    "inset:0",
    "width:100%",
    "height:100%",
    "pointer-events:none",
    "z-index:3",
  ].join(";");
  hero.appendChild(canvas);

  let W = 0, H = 0;
  let currentAmount = 0;
  let rafId = null;

  // Fit canvas to hero on load and resize
  const resize = () => {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    draw(currentAmount);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(hero);
  resize();

  function draw(t) {
    if (!W || !H) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    if (t <= 0) return;

    const cx = W / 2, cy = H / 2;
    const r  = Math.hypot(cx, cy); // corner-to-centre distance

    // ── Vignette ───────────────────────────────────────────────────────
    // Dark ring that tightens as distortion grows
    const vigInner = 0.45 - t * 0.20;  // inner transparent zone shrinks
    const vigOuter = 0.80 - t * 0.15;
    const vigAlpha = t * 0.65;

    const vig = ctx.createRadialGradient(cx, cy, vigInner * r, cx, cy, vigOuter * r);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // ── Chromatic aberration ────────────────────────────────────────────
    // Red fringe: upper-right arc
    // Blue fringe: lower-left arc
    // Both start fully transparent in the centre and glow at the edge.
    const ca = t * 0.75;  // max opacity of the colour fringe
    const spread = 0.30 + t * 0.20; // fraction of radius where fringe lives

    // Red — upper-right quadrant
    const redGrad = ctx.createRadialGradient(
      cx + W * 0.25 * t, cy - H * 0.25 * t, 0,
      cx, cy, r
    );
    redGrad.addColorStop(Math.max(0, 1 - spread), "rgba(255,0,80,0)");
    redGrad.addColorStop(1, `rgba(255,0,80,${ca})`);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = redGrad;
    ctx.fillRect(0, 0, W, H);

    // Blue — lower-left quadrant
    const blueGrad = ctx.createRadialGradient(
      cx - W * 0.25 * t, cy + H * 0.25 * t, 0,
      cx, cy, r
    );
    blueGrad.addColorStop(Math.max(0, 1 - spread), "rgba(0,80,255,0)");
    blueGrad.addColorStop(1, `rgba(0,80,255,${ca})`);
    ctx.fillStyle = blueGrad;
    ctx.fillRect(0, 0, W, H);

    // Restore composite
    ctx.globalCompositeOperation = "source-over";
  }

  return {
    setDistortion(amount) {
      const t = Math.max(0, Math.min(1, amount));
      if (t === currentAmount) return;
      currentAmount = t;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        draw(t);
      });
    },
    dispose() {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      canvas.remove();
    },
  };
}
