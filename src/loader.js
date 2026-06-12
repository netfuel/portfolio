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
  const rule = el.querySelector(".loader__rule");

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
    rule.style.transform = "scaleX(1)";

    gsap.timeline()
      .to(el.querySelector(".loader__count"), {
        yPercent: -40, opacity: 0, duration: 0.55, ease: "power2.in",
      }, 0.25)
      .to(el.querySelector(".loader__head"), {
        opacity: 0, duration: 0.4, ease: "power2.in",
      }, 0.3)
      .to(rule, { opacity: 0, duration: 0.35 }, 0.35)
      .to(el, { yPercent: -100, duration: 1.05, ease: "power4.inOut" }, 0.55)
      .add(() => {
        document.documentElement.classList.remove("loading");
        resolveDone(); // hero intro begins while the curtain is still lifting
      }, 1.05)
      .set(el, { display: "none" })
      .add(() => el.remove());
  };

  const render = () => {
    state.shown += (state.target - state.shown) * 0.085;
    countEl.textContent = String(Math.round(state.shown * 100));
    rule.style.transform = `scaleX(${state.shown.toFixed(4)})`;

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
