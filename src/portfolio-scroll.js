import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 720px)").matches;

// Blocks that fade and lift into view as they enter — the intro head, each
// case-study beat, every media band, index rows, and the outro pieces.
const REVEAL_SEL =
  ".panel__head, .beat, .panel__media, .index-item, .outro__contact";

export function initPortfolioScroll() {
  const panels = gsap.utils.toArray(".panel");
  const rail = document.getElementById("rail");
  const marker = rail && rail.querySelector(".rail__marker");
  const nodes = gsap.utils.toArray(".rail__node");
  const eraEl = rail && rail.querySelector(".rail__era");
  if (!panels.length) return;

  const n = panels.length;
  const nodeFrac = (i) => (n > 1 ? i / (n - 1) : 0);
  const eras = panels.map((p) => p.dataset.era || "");

  const revealPanels = () => {
    const el = document.getElementById("panels");
    if (el) el.style.visibility = "visible";
  };

  // Active chapter — updates the rail's era readout and the lit node
  let active = -1;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    nodes.forEach((nd, k) => nd.classList.toggle("is-active", k === i));
    if (eraEl) eraEl.textContent = eras[i];
  };
  const moveMarker = (frac) => {
    if (marker) marker.style.top = (frac * 100).toFixed(3) + "%";
  };

  // Jump to a panel from the rail
  const smootherRef = { current: null };
  const jumpTo = (i) => {
    const sm = smootherRef.current;
    if (sm) sm.scrollTo(panels[i], true, "top 12%");
    else panels[i].scrollIntoView({ behavior: "smooth", block: "start" });
  };
  nodes.forEach((nd, i) => nd.addEventListener("click", () => jumpTo(i)));
  if (rail) rail.setAttribute("aria-hidden", "false");

  // Deep link — open at #slug
  const hashIndex = () => {
    const slug = location.hash.slice(1);
    if (!slug) return 0;
    const i = panels.findIndex((p) => p.dataset.slug === slug);
    return i >= 0 ? i : 0;
  };

  // The rail marker glides continuously; the panel crossing the viewport
  // centre owns the era readout and the lit node.
  const trackRail = () => {
    panels.forEach((panel, i) => {
      ScrollTrigger.create({
        trigger: panel,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (self.isActive) setActive(i);
        },
        onUpdate: (self) => {
          if (self.isActive) moveMarker((i + self.progress) / (n - 1));
        },
      });
    });
  };

  // ── Reduced motion: plain readable document, nothing hidden ─────────────
  if (reduced) {
    document.documentElement.classList.add("is-static");
    revealPanels();
    setActive(0);
    moveMarker(0);
    trackRail();
    return;
  }

  // Smooth scrolling (native on touch), shared by desktop and mobile
  const smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: mobile ? 0 : 1.2,
    smoothTouch: false,
    ignoreMobileResize: true,
  });
  smootherRef.current = smoother;
  if (import.meta.env.DEV) window.__smoother = smoother;

  // Reveal each block as it enters — legible, section by section
  const targets = gsap.utils.toArray(REVEAL_SEL);
  gsap.set(targets, { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch(targets, {
    start: "top 88%",
    onEnter: (els) =>
      gsap.to(els, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
        overwrite: true,
      }),
  });

  trackRail();
  setActive(0);
  moveMarker(0);
  revealPanels();

  requestAnimationFrame(() =>
    setTimeout(() => {
      ScrollTrigger.refresh();
      const i = hashIndex();
      if (i > 0) jumpTo(i);
      else smoother.scrollTop(0); // always open at the intro
    }, 60)
  );
}
