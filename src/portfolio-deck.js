import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 720px)").matches;

// ──────────────────────────────────────────────────────────────────────────
// Per-card carousel — a horizontal track of panels (cover + four beats).
// The focused card pages via drag, arrows, dots, and ← → keys; each panel
// runs the homepage's line-lift reveal as it arrives.
// ──────────────────────────────────────────────────────────────────────────
function createCarousel(card) {
  const track = card.querySelector(".card__track");
  const panels = gsap.utils.toArray(card.querySelectorAll(".card__panel"));
  const dots = gsap.utils.toArray(card.querySelectorAll(".card__dot"));
  const prev = card.querySelector(".card__arrow--prev");
  const next = card.querySelector(".card__arrow--next");
  const n = panels.length;
  let active = 0;
  let focused = false;
  const splits = new Map(); // panel → cached SplitText lines

  // Split a panel's text once, then replay the lift on every visit
  const reveal = (panel) => {
    let lines = splits.get(panel);
    if (!lines) {
      lines = [];
      panel.querySelectorAll(".card__title, .card__beat-label, .card__meta, .card__desc")
        .forEach((t) => {
          const st = new SplitText(t, { type: "lines", mask: "lines" });
          lines.push(...st.lines);
        });
      splits.set(panel, lines);
    }
    gsap.fromTo(lines,
      { yPercent: 115 },
      { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.05, overwrite: true }
    );
  };

  const syncDots = () => dots.forEach((d, i) => d.classList.toggle("is-active", i === active));

  const goTo = (i, withReveal = true) => {
    active = Math.max(0, Math.min(n - 1, i));
    gsap.to(track, { xPercent: -active * 100, duration: 0.6, ease: "power3.inOut", overwrite: true });
    syncDots();
    prev.disabled = active === 0;
    next.disabled = active === n - 1;
    if (withReveal) reveal(panels[active]);
  };

  prev.addEventListener("click", () => goTo(active - 1));
  next.addEventListener("click", () => goTo(active + 1));
  dots.forEach((d, i) => d.addEventListener("click", () => goTo(i)));

  window.addEventListener("keydown", (e) => {
    if (!focused) return;
    if (e.key === "ArrowRight") goTo(active + 1);
    else if (e.key === "ArrowLeft") goTo(active - 1);
  });

  // Pointer drag with snap-on-release
  let dragging = false, startX = 0, baseX = 0;
  track.addEventListener("pointerdown", (e) => {
    if (!focused) return;
    dragging = true;
    startX = e.clientX;
    baseX = -active * 100;
    gsap.killTweensOf(track);
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dxPct = ((e.clientX - startX) / card.clientWidth) * 100;
    gsap.set(track, { xPercent: baseX + dxPct });
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    const dxPct = ((e.clientX - startX) / card.clientWidth) * 100;
    goTo(dxPct < -12 ? active + 1 : dxPct > 12 ? active - 1 : active);
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  return {
    activate() {
      focused = true;
      card.classList.add("is-focused");
      gsap.set(track, { xPercent: 0 });
      active = 0;
      syncDots();
      prev.disabled = true;
      next.disabled = n <= 1;
      reveal(panels[0]);
    },
    deactivate() {
      focused = false;
      card.classList.remove("is-focused");
    },
    // Mobile / reduced-motion: native horizontal scroll-snap + arrow scrolling
    staticInit() {
      const scrollTo = (i) => {
        active = Math.max(0, Math.min(n - 1, i));
        panels[active].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        syncDots();
      };
      prev.addEventListener("click", () => scrollTo(active - 1));
      next.addEventListener("click", () => scrollTo(active + 1));
      dots.forEach((d, i) => d.addEventListener("click", () => scrollTo(i)));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { active = panels.indexOf(en.target); syncDots(); }
        });
      }, { root: track, threshold: 0.6 });
      panels.forEach((p) => io.observe(p));
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Position one card by its signed distance `o` from the focal plane.
// o < 0 : receded in the deck (smaller, dimmed, peeking up like the design)
// o = 0 : focal, full size and brightness
// o > 0 : rushing toward and past the camera, scaling up and fading out
// ──────────────────────────────────────────────────────────────────────────
function positionCard(card, o) {
  let z, y, opacity, brightness;
  if (o <= 0) {
    const d = Math.max(o, -5);
    z = d * 360;
    y = d * 22;
    opacity = Math.max(0.1, 1 + d * 0.16);
    brightness = Math.max(0.32, 1 + d * 0.42);
  } else {
    z = o * 1100;
    y = -o * 12;
    opacity = Math.max(0, 1 - o * 1.7);
    brightness = 1;
  }
  card.style.transform = `translate(-50%, -50%) translateY(${y}px) translateZ(${z}px)`;
  card.style.opacity = opacity.toFixed(3);
  card.style.filter = brightness < 1 ? `brightness(${brightness.toFixed(3)})` : "none";
  card.style.zIndex = String(1000 + Math.round(o * 100));
  card.style.pointerEvents = o > -0.5 && o < 0.5 ? "auto" : "none";
}

export function initPortfolioDeck(count) {
  const work = document.getElementById("work");
  const cards = gsap.utils.toArray(".work-card");
  const timeline = document.getElementById("timeline");
  const ticks = gsap.utils.toArray(".timeline__tick");
  const node = timeline ? timeline.querySelector(".timeline__node") : null;
  if (!cards.length) return;

  const carousels = cards.map((card) => createCarousel(card));

  // Reduced-motion or mobile: plain vertical stack, native carousel, no 3D pin
  if (reduced || mobile) {
    work.classList.add("is-static");
    carousels.forEach((c) => c.staticInit());
    return;
  }

  // Smooth scroll — parity with the homepage
  const smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.6,
    smoothTouch: false,
  });
  if (import.meta.env.DEV) window.__smoother = smoother;

  let focus = -1;
  const onFocus = (f) => {
    carousels.forEach((c, i) => (i === f ? c.activate() : c.deactivate()));
  };

  const render = (t) => {
    cards.forEach((card, i) => positionCard(card, t - i));
    const p = count > 1 ? t / (count - 1) : 0;
    if (node) node.style.left = (6 + p * 88).toFixed(2) + "%";
    const f = Math.round(t);
    ticks.forEach((tk, i) => tk.classList.toggle("is-active", i === f));
    if (f !== focus) { focus = f; onFocus(f); }
  };

  ScrollTrigger.create({
    trigger: "#work",
    start: "top top",
    end: "+=" + count * 90 + "%",
    pin: true,
    scrub: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    snap: count > 1
      ? { snapTo: 1 / (count - 1), duration: { min: 0.2, max: 0.6 }, ease: "power1.inOut", delay: 0.04 }
      : false,
    onUpdate: (self) => render(self.progress * (count - 1)),
    onRefresh: (self) => render(self.progress * (count - 1)),
  });

  // Explicit fromTo — the `.js .work` rule leaves it visibility:hidden, so a
  // plain .from() would animate back to hidden
  gsap.fromTo(work, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out" });
  render(0);

  // ── Timeline: loader-style intro + draggable, dot-locking scrubber ──────
  if (timeline && node) {
    const line = timeline.querySelector(".timeline__line");
    const caps = gsap.utils.toArray(timeline.querySelectorAll(".timeline__cap"));
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const nearestTick = (p) => (count > 1 ? Math.round(p * (count - 1)) / (count - 1) : 0);

    // Reveal in the preloader's language: the bar draws in with an accent
    // flash (like the progress lines), then the node and ticks settle.
    gsap.timeline({ delay: 0.15 })
      .fromTo(line,
        { scaleX: 0, transformOrigin: "left center", backgroundColor: "rgba(211, 231, 79, 0.9)" },
        { scaleX: 1, backgroundColor: "rgba(232, 227, 214, 0.30)", duration: 1.1, ease: "power4.inOut" }, 0)
      .from(node, { scale: 0, duration: 0.6, ease: "back.out(2)" }, 0.45)
      .from(ticks, { autoAlpha: 0, y: 6, duration: 0.6, stagger: 0.04, ease: "power2.out" }, 0.6)
      .from(caps, { autoAlpha: 0, duration: 0.6, ease: "power2.out" }, 0.7);

    // Drag the node to scrub; it magnet-locks onto a dot as it nears one,
    // and eases to the exact dot on release.
    const pointerProgress = (clientX) => {
      const r = timeline.getBoundingClientRect();
      return clamp01((((clientX - r.left) / r.width) * 100 - 6) / 88);
    };
    let dragging = false;
    node.style.pointerEvents = "auto";
    node.style.cursor = "grab";
    node.addEventListener("pointerdown", (e) => {
      dragging = true;
      node.style.cursor = "grabbing";
      e.preventDefault();
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      let p = pointerProgress(e.clientX);
      const nt = nearestTick(p);
      if (count > 1 && Math.abs(p - nt) < (1 / (count - 1)) * 0.3) p = nt; // magnet
      smoother.scrollTop(p * maxScroll());
    });
    const endScrub = (e) => {
      if (!dragging) return;
      dragging = false;
      node.style.cursor = "grab";
      smoother.scrollTo(nearestTick(pointerProgress(e.clientX)) * maxScroll(), true);
    };
    window.addEventListener("pointerup", endScrub);
    window.addEventListener("pointercancel", endScrub);

    // Click a tick to jump to that card
    ticks.forEach((tk, i) => {
      tk.style.pointerEvents = "auto";
      tk.style.cursor = "pointer";
      tk.addEventListener("click", () => smoother.scrollTo((count > 1 ? i / (count - 1) : 0) * maxScroll(), true));
    });
  }

  requestAnimationFrame(() => setTimeout(() => ScrollTrigger.refresh(), 60));
}
