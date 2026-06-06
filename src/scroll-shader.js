/**
 * Scroll Velocity Shader — rings wave/distort as the user scrolls fast,
 * settle back to flat when they stop.
 *
 * Mirrors the GSAP "Shader on Scroll" demo technique:
 *   - ScrollTrigger.getVelocity() → uScrollVelocity uniform
 *   - Vertex shader deforms geometry with sin(uv.x × PI) × velocity
 *
 * Here we use the CSS equivalent:
 *   SVG feTurbulence + feDisplacementMap applied to .hero__rings
 *   GSAP tweens the displacement scale based on velocity (with inertia)
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initScrollShader() {
  const rings = document.querySelector(".hero__rings");
  if (!rings) return;

  // ── Build SVG filter ─────────────────────────────────────────────────────
  const NS    = "http://www.w3.org/2000/svg";
  const svg   = document.createElementNS(NS, "svg");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";

  const defs   = document.createElementNS(NS, "defs");
  const filter = document.createElementNS(NS, "filter");
  filter.setAttribute("id",     "scrollWave");
  filter.setAttribute("x",      "-20%");
  filter.setAttribute("y",      "-20%");
  filter.setAttribute("width",  "140%");
  filter.setAttribute("height", "140%");

  // Turbulence generates the noise map (static — no time animation)
  const turb = document.createElementNS(NS, "feTurbulence");
  turb.setAttribute("type",          "turbulence");
  turb.setAttribute("baseFrequency", "0.008 0.025");  // low X freq → wave columns; higher Y → ripple rows
  turb.setAttribute("numOctaves",    "2");
  turb.setAttribute("seed",          "5");
  turb.setAttribute("result",        "noise");

  // Displacement map driven by `scale` — mirrors uScrollVelocity
  const disp = document.createElementNS(NS, "feDisplacementMap");
  disp.setAttribute("in",              "SourceGraphic");
  disp.setAttribute("in2",             "noise");
  disp.setAttribute("scale",           "0");
  disp.setAttribute("xChannelSelector","R");
  disp.setAttribute("yChannelSelector","G");

  filter.appendChild(turb);
  filter.appendChild(disp);
  defs.appendChild(filter);
  svg.appendChild(defs);
  document.body.appendChild(svg);

  // Pre-attach filter (scale=0 = invisible distortion, no compositing flash)
  rings.style.filter = "url(#scrollWave)";

  // ── Velocity → scale tween ───────────────────────────────────────────────
  // `proxy` is the single object we tween so GSAP handles the inertia/easing
  const proxy = { scale: 0 };

  function applyVelocity(velocity) {
    // Map raw px/s velocity to displacement pixels (clamped, absolute value)
    const target = Math.min(Math.abs(velocity) * 0.018, 28);

    gsap.to(proxy, {
      scale:    target,
      duration: 0.35,
      ease:     "power2.out",
      overwrite: true,
      onUpdate() {
        disp.setAttribute("scale", proxy.scale.toFixed(2));
      },
      onComplete() {
        // Settle back to zero after velocity drops
        gsap.to(proxy, {
          scale:    0,
          duration: 0.6,
          ease:     "power3.out",
          overwrite: true,
          onUpdate() {
            disp.setAttribute("scale", proxy.scale.toFixed(2));
          },
        });
      },
    });
  }

  // ── Hook into any active ScrollTrigger ───────────────────────────────────
  // We listen to native scroll so this works whether the hero is pinned or not
  let rafId;
  let lastY = window.scrollY;

  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      // Convert frame Δ to approximate px/s (60fps assumed)
      applyVelocity(dy * 60);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  return {
    dispose() {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      svg.remove();
      rings.style.filter = "";
    },
  };
}
