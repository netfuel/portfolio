import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { initLensDistortion } from "./lens-distortion.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ──────────────────────────────────────────────────────────────────────────
// Hero intro — SplitText rolling name + rings scale-in
// ──────────────────────────────────────────────────────────────────────────
function initHeroIntro() {
  const name = document.querySelector(".hero__name");
  const rings = document.querySelector(".hero__rings");
  const scroll = document.querySelector(".hero__scroll");
  if (!name || reduced) return {};

  const split = new SplitText(name, {
    type: "words,chars",
    charsClass: "char",
    wordsClass: "word",
  });

  // SplitText strips inter-word whitespace; add gap back inline
  split.words.forEach((w, i) => {
    if (i < split.words.length - 1) w.style.marginRight = "0.4em";
  });

  const tl = gsap.timeline();

  // Rings scale from 0.85 → 1 (camera starts closer)
  tl.fromTo(
    rings,
    { opacity: 0, scale: 0.85 },
    { opacity: 1, scale: 1, duration: 1.8, ease: "expo.out" },
    0
  );

  // Rolling char reveal
  gsap.set(name, { overflow: "hidden" });
  tl.from(split.chars, {
    yPercent: 110,
    rotateX: -80,
    opacity: 0,
    duration: 0.9,
    ease: "back.out(1.4)",
    stagger: { each: 0.04, from: "start" },
  }, 0.3);

  // Scroll cue
  tl.fromTo(scroll, { opacity: 0 }, { opacity: 0.78, duration: 0.6, ease: "power2.out" }, 1.6);

  // After intro, add slow on-load rotation to each ring with easing
  // Store references so we can control them during scroll
  const ringInner = document.querySelector(".hero__ring--inner");
  const ringMiddle = document.querySelector(".hero__ring--middle");
  const ringOuter = document.querySelector(".hero__ring--outer");

  const idleRotations = [];

  if (ringInner) {
    const rotation = gsap.to(ringInner, {
      rotation: "+=360",
      duration: 120,
      ease: "sine.inOut",
      repeat: -1,
      delay: 1.8,
      paused: false,
    });
    idleRotations.push({ ring: ringInner, animation: rotation });
  }
  if (ringMiddle) {
    const rotation = gsap.to(ringMiddle, {
      rotation: "-=360",
      duration: 150,
      ease: "sine.inOut",
      repeat: -1,
      delay: 1.8,
      paused: false,
    });
    idleRotations.push({ ring: ringMiddle, animation: rotation });
  }
  if (ringOuter) {
    const rotation = gsap.to(ringOuter, {
      rotation: "+=360",
      duration: 180,
      ease: "sine.inOut",
      repeat: -1,
      delay: 1.8,
      paused: false,
    });
    idleRotations.push({ ring: ringOuter, animation: rotation });
  }

  return { split, idleRotations };
}

// ──────────────────────────────────────────────────────────────────────────
// Tunnel scroll — rings rush toward camera + name splits apart
// Pinned to the hero for 300vh of scroll distance, fully scrubbed.
// Idle rotations pause during scroll and resume smoothly after
// ──────────────────────────────────────────────────────────────────────────
function initTunnelScroll(idleRotations = []) {
  if (reduced) return;

  const hero = document.querySelector(".hero");
  const ringInner = document.querySelector(".hero__ring--inner");
  const ringMiddle = document.querySelector(".hero__ring--middle");
  const ringOuter = document.querySelector(".hero__ring--outer");
  const wordL = document.querySelector(".word-l");
  const wordR = document.querySelector(".word-r");
  const scrollCue = document.querySelector(".hero__scroll");
  if (!hero || !ringInner) return;

  // Initialize lens distortion effect
  const lensDistortion = initLensDistortion(hero);

  // Track scroll state for smooth rotation transitions
  let isScrolling = false;
  let scrollEndTimeout;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "+=300%",     // 300vh of scroll distance
      pin: true,
      scrub: 1,          // smooth 1-second lag behind scroll
      anticipatePin: 1,
      onEnter: () => {
        isScrolling = true;
        // Pause idle rotations when entering tunnel
        idleRotations.forEach(({ animation }) => {
          gsap.to(animation, { timeScale: 0, duration: 0.6, ease: "power2.inOut" });
        });
      },
      onLeave: () => {
        isScrolling = false;
        // Resume idle rotations smoothly when leaving tunnel
        clearTimeout(scrollEndTimeout);
        scrollEndTimeout = setTimeout(() => {
          idleRotations.forEach(({ animation }) => {
            gsap.to(animation, { timeScale: 1, duration: 1.2, ease: "power2.inOut" });
          });
        }, 300);
      },
      onUpdate: (self) => {
        // Update lens distortion based on scroll progress
        // Maximum distortion at 70% of scroll (when rings are closest)
        const progress = self.progress;
        const distortion = Math.sin(Math.min(progress, 0.7) * Math.PI) * progress;
        if (lensDistortion) {
          lensDistortion.setDistortion(distortion);
        }
      },
    },
  });

  // Phase 1: scroll cue fades out immediately (0–5%)
  tl.to(scrollCue, { opacity: 0, duration: 0.05 }, 0);

  // Phase 2: all rings scale up + rotate toward the camera simultaneously
  // All three rings move forward together (0–40% of scroll)

  tl.to(ringOuter, {
    scale: 14,
    rotation: 360,
    opacity: 0,
    duration: 0.4,
    ease: "power2.in",
  }, 0);

  tl.to(ringMiddle, {
    scale: 14,
    rotation: -540,
    opacity: 0,
    duration: 0.4,
    ease: "power2.in",
  }, 0);  // Same start time as outer ring

  tl.to(ringInner, {
    scale: 14,
    rotation: 720,
    opacity: 0,
    duration: 0.4,
    ease: "power2.in",
  }, 0);  // Same start time as outer ring

  // Phase 3: name splits apart (24–54%, 60% earlier)
  // "Matthew" slides left, "Ladner" slides right
  tl.to(wordL, {
    xPercent: -150,
    opacity: 0,
    duration: 0.3,
    ease: "power3.in",
  }, 0.24);

  tl.to(wordR, {
    xPercent: 150,
    opacity: 0,
    duration: 0.3,
    ease: "power3.in",
  }, 0.24);
}

// ──────────────────────────────────────────────────────────────────────────
// Card-stack panels — each panel is position:sticky; GSAP ScrollTrigger
// pins with pinSpacing:false for the stacking-cards overlay effect.
// ──────────────────────────────────────────────────────────────────────────
function initCardStack() {
  // The CSS already has `position: sticky; top: 0` on `.panel`.
  // For the overscroll effect, we add a subtle scale-down + shadow on
  // the outgoing card as the next one overlays it.
  if (reduced) return;

  const panels = gsap.utils.toArray(".panel");

  panels.forEach((panel, i) => {
    // Skip the last panel — nothing overlays it
    if (i === panels.length - 1) return;

    ScrollTrigger.create({
      trigger: panel,
      start: "bottom bottom",
      end: () => "+=" + window.innerHeight,
      scrub: true,
      onUpdate: (self) => {
        // Subtle scale-down + dim as the panel gets covered
        const p = self.progress;
        gsap.set(panel, {
          scale: 1 - p * 0.04,
          opacity: 1 - p * 0.3,
          filter: `brightness(${1 - p * 0.15})`,
        });
      },
      onLeaveBack: () => {
        gsap.set(panel, { scale: 1, opacity: 1, filter: "none" });
      },
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Hover micro-interactions
// ──────────────────────────────────────────────────────────────────────────
function initHovers() {
  if (reduced) return;

  gsap.utils.toArray("a:not(.hero__scroll), .reveal-email").forEach((el) => {
    el.addEventListener("mouseenter", () =>
      gsap.to(el, { skewX: -6, duration: 0.2, ease: "power2.out" }));
    el.addEventListener("mouseleave", () =>
      gsap.to(el, { skewX: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" }));
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Resize handler — refresh scroll triggers to keep rings centered on resize
// ──────────────────────────────────────────────────────────────────────────
function initResizeHandler() {
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);  // debounce to avoid excessive refreshes
  });
}

// ──────────────────────────────────────────────────────────────────────────
export function initAnimations() {
  const { idleRotations } = initHeroIntro() || { idleRotations: [] };
  initTunnelScroll(idleRotations);
  initCardStack();
  initHovers();
  initResizeHandler();

  // Force scroll trigger refresh on load to ensure rings are perfectly centered
  // Use requestAnimationFrame to wait for DOM layout, then refresh
  requestAnimationFrame(() => {
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 50);
  });
}
