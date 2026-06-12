import { gsap } from "gsap";

// Preloader — tracks real milestones (fonts, atmosphere, word cloud), eases a
// giant serif counter toward them, then wipes upward into the hero intro.
// Resolves mid-wipe so the hero animation starts while the curtain is still moving.
export function runLoader(tasks) {
  const el = document.getElementById("loader");
  if (!el) return Promise.resolve();

  // No .js → loader is display:none (no-JS / reduced-motion) — clean up and go
  if (!document.documentElement.classList.contains("js")) {
    el.remove();
    return Promise.resolve();
  }

  document.documentElement.classList.add("loading");

  const countEl = el.querySelector("[data-count]");
  const lines = el.querySelectorAll(".loader__line");

  const MIN_TIME = 1500;  // never flash — the loader earns its moment
  const MAX_TIME = 7000;  // never trap — force completion if something hangs
  const start = performance.now();

  const state = { shown: 0, target: 0 };
  let settled = 0;
  let allDone = false;
  let exiting = false;

  // Ambient creep so the counter moves immediately, before any milestone lands
  gsap.to(state, { target: 0.16, duration: 1.1, ease: "power1.out" });

  const onMilestone = () => {
    settled += 1;
    const t = 0.16 + (settled / tasks.length) * 0.84;
    gsap.to(state, { target: t, duration: 0.7, ease: "power2.out", overwrite: true });
    if (settled === tasks.length) allDone = true;
  };
  tasks.forEach((p) => Promise.resolve(p).catch(() => {}).then(onMilestone));
  const failsafe = setTimeout(() => { allDone = true; state.target = 1; }, MAX_TIME);

  let resolveDone;
  const done = new Promise((res) => { resolveDone = res; });

  const exit = () => {
    exiting = true;
    clearTimeout(failsafe);
    gsap.ticker.remove(render);
    countEl.textContent = "100";
    lines.forEach((l) => { l.style.transform = "scaleX(1)"; });

    const badge = el.querySelector(".loader__badge");

    // Fired at the moment of impact — the GL layers ripple out from this point,
    // and the DOM title wobbles through the same wave via an SVG displacement filter
    const splash = () => {
      const r = badge.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent("hero:splash", {
        detail: { cx: r.left + r.width / 2, cy: r.top + r.height / 2 },
      }));

      const disp = document.querySelector("#ripple-displace feDisplacementMap");
      const turb = document.querySelector("#ripple-displace feTurbulence");
      const name = document.querySelector(".hero__name");
      if (disp && turb && name) {
        name.style.filter = "url(#ripple-displace)";
        gsap.timeline({ onComplete: () => { name.style.filter = ""; } })
          .to(disp, { attr: { scale: 22 }, duration: 0.18, ease: "power2.out" })
          .to(disp, { attr: { scale: 0 }, duration: 1.7, ease: "sine.out" }, 0.18)
          // Noise stretches as it fades — the distortion reads as an outbound wave
          .to(turb, { attr: { baseFrequency: "0.008 0.014" }, duration: 1.88, ease: "none" }, 0);
      }
    };

    // The progress line becomes the seam — the page splits open along it,
    // then the circle drops into the hero and splashes like a stone in water
    gsap.timeline()
      .to(lines, { opacity: 0, duration: 0.45, ease: "power1.out" }, 0.4)
      .to(el.querySelector(".loader__panel--top"), {
        yPercent: -100, duration: 1.05, ease: "power4.inOut",
      }, 0.5)
      .to(el.querySelector(".loader__panel--bottom"), {
        yPercent: 100, duration: 1.05, ease: "power4.inOut",
      }, 0.5)
      .set(el, { pointerEvents: "none" }, 1.0)
      .add(() => {
        document.documentElement.classList.remove("loading");
        resolveDone(); // hero intro begins while the curtains are still parting
      }, 1.0)
      // The circle falls away from the camera — shrinking into the hero's
      // center like a stone dropped from above, splashing where it lands
      .to(badge, {
        scale: 0.12, duration: 0.7, ease: "power2.in",
      }, 0.95)
      .add(splash, 1.65)
      .to(badge, { scale: 0, opacity: 0, duration: 0.25, ease: "power3.out" }, 1.65)
      .set(el, { display: "none" })
      .add(() => el.remove());
  };

  const render = () => {
    state.shown += (state.target - state.shown) * 0.085;
    countEl.textContent = String(Math.round(state.shown * 100));
    const sx = `scaleX(${state.shown.toFixed(4)})`;
    lines.forEach((l) => { l.style.transform = sx; });

    // Dev-only: sessionStorage flag freezes the loader for visual inspection
    const held = import.meta.env.DEV && sessionStorage.getItem("loaderHold");
    if (!exiting && !held && allDone && performance.now() - start >= MIN_TIME) {
      // Let the displayed value catch up to 100 before the curtain moves
      state.target = 1;
      if (state.shown > 0.995) exit();
    }
  };
  gsap.ticker.add(render);

  return done;
}
