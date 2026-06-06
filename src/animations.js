import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { initScrollShader } from "./scroll-shader.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ──────────────────────────────────────────────────────────────────────────
// Hero intro — rings fade/scale in, name chars roll up, scroll cue appears
// ──────────────────────────────────────────────────────────────────────────
function initHeroIntro() {
  const name   = document.querySelector(".hero__name");
  const rings  = document.querySelector(".hero__rings");
  const scroll = document.querySelector(".hero__scroll");
  if (!name || !rings || reduced) return { idleRotations: [] };

  // Split name into animatable chars
  const split = new SplitText(name, {
    type: "words,chars",
    charsClass: "char",
    wordsClass: "word",
  });
  // SplitText removes inter-word space — restore it
  split.words.forEach((w, i) => {
    if (i < split.words.length - 1) w.style.marginRight = "0.4em";
  });

  // Intro timeline
  const tl = gsap.timeline();

  tl.fromTo(
    rings,
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1, duration: 1.8, ease: "expo.out" },
    0
  );

  gsap.set(name, { overflow: "hidden" });
  tl.from(split.chars, {
    yPercent: 110,
    rotateX: -80,
    opacity: 0,
    duration: 0.9,
    ease: "back.out(1.4)",
    stagger: { each: 0.04, from: "start" },
  }, 0.3);

  tl.fromTo(scroll, { opacity: 0 }, { opacity: 0.78, duration: 0.6, ease: "power2.out" }, 1.6);

  // Idle rotations — start after intro, sine easing for buttery motion
  const ringInner  = document.querySelector(".hero__ring--inner");
  const ringMiddle = document.querySelector(".hero__ring--middle");
  const ringOuter  = document.querySelector(".hero__ring--outer");

  const idleRotations = [];

  const addRotation = (el, deg, dur) => {
    if (!el) return;
    const anim = gsap.to(el, {
      rotation: deg,
      duration: dur,
      ease: "none",         // linear so timeScale tweening feels smooth
      repeat: -1,
      delay: 1.8,
    });
    idleRotations.push(anim);
  };

  addRotation(ringInner,  "+=360",  120);
  addRotation(ringMiddle, "-=360",  150);
  addRotation(ringOuter,  "+=360",  180);

  return { idleRotations };
}

// ──────────────────────────────────────────────────────────────────────────
// Tunnel scroll — rings zoom in (scrubbed), name splits, lens effect plays
// ──────────────────────────────────────────────────────────────────────────
function initTunnelScroll(idleRotations = []) {
  if (reduced) return;

  const hero      = document.querySelector(".hero");
  const vignette  = document.querySelector(".hero__vignette");
  const ringInner = document.querySelector(".hero__ring--inner");
  const ringMiddle= document.querySelector(".hero__ring--middle");
  const ringOuter = document.querySelector(".hero__ring--outer");
  const wordL     = document.querySelector(".word-l");
  const wordR     = document.querySelector(".word-r");
  const scrollCue = document.querySelector(".hero__scroll");
  if (!hero || !ringInner) return;

  let resumeTimer;

  const pauseIdle = () => {
    clearTimeout(resumeTimer);
    idleRotations.forEach(a => gsap.to(a, { timeScale: 0, duration: 0.5, ease: "power2.inOut" }));
  };

  const resumeIdle = () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      idleRotations.forEach(a => gsap.to(a, { timeScale: 1, duration: 1.0, ease: "power2.inOut" }));
    }, 300);
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "+=300%",
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      onEnter:     pauseIdle,
      onEnterBack: pauseIdle,
      onLeave:     resumeIdle,
      onLeaveBack: resumeIdle,
      onUpdate(self) {
        if (vignette) {
          // Bell-curve: 0 at start and end, peaks at mid-scroll
          gsap.set(vignette, { opacity: Math.sin(self.progress * Math.PI) * 0.65 });
        }
      },
    },
  });

  // Scroll cue out
  tl.to(scrollCue, { opacity: 0, duration: 0.05 }, 0);


  // All three rings rush toward camera together
  const ringConfig = [
    [ringOuter,  14,  360],
    [ringMiddle, 14, -540],
    [ringInner,  14,  720],
  ];
  ringConfig.forEach(([el, scale, rotation]) => {
    tl.to(el, { scale, rotation, opacity: 0, duration: 0.4, ease: "power2.in" }, 0);
  });

  // Name splits apart slightly after rings start moving
  tl.to(wordL, { xPercent: -150, opacity: 0, duration: 0.3, ease: "power3.in" }, 0.24);
  tl.to(wordR, { xPercent:  150, opacity: 0, duration: 0.3, ease: "power3.in" }, 0.24);
}

// ──────────────────────────────────────────────────────────────────────────
// Card-stack panels — each .panel is sticky; scale-down the one being covered
// ──────────────────────────────────────────────────────────────────────────
function initCardStack() {
  if (reduced) return;

  gsap.utils.toArray(".panel").forEach((panel, i, all) => {
    if (i === all.length - 1) return; // last panel — nothing covers it

    ScrollTrigger.create({
      trigger: panel,
      start: "bottom bottom",
      end: () => "+=" + window.innerHeight,
      scrub: true,
      onUpdate(self) {
        const p = self.progress;
        gsap.set(panel, {
          scale:  1 - p * 0.04,
          opacity: 1 - p * 0.3,
          filter: `brightness(${1 - p * 0.15})`,
        });
      },
      onLeaveBack: () => gsap.set(panel, { scale: 1, opacity: 1, filter: "none" }),
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Hover micro-interactions
// ──────────────────────────────────────────────────────────────────────────
function initHovers() {
  if (reduced) return;
  gsap.utils.toArray("a:not(.hero__scroll), .reveal-email").forEach(el => {
    el.addEventListener("mouseenter", () => gsap.to(el, { skewX: -6, duration: 0.2, ease: "power2.out" }));
    el.addEventListener("mouseleave", () => gsap.to(el, { skewX:  0, duration: 0.4, ease: "elastic.out(1, 0.4)" }));
  });
}

// ──────────────────────────────────────────────────────────────────────────
export function initAnimations() {
  initScrollShader();
  const { idleRotations } = initHeroIntro();
  initTunnelScroll(idleRotations);
  initCardStack();
  initHovers();

  // Debounced resize — keeps ScrollTrigger measurements accurate
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  });

  // Single deferred refresh so GSAP measures the fully-laid-out page
  requestAnimationFrame(() => setTimeout(() => ScrollTrigger.refresh(), 50));
}
