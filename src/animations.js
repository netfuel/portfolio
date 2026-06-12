import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ──────────────────────────────────────────────────────────────────────────
// Smooth scroll — desktop only; touch devices keep native scrolling
// ──────────────────────────────────────────────────────────────────────────
function initSmoother() {
  return ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.1,
    smoothTouch: false,
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Hero intro — words rise out of their masks, metadata settles in
// ──────────────────────────────────────────────────────────────────────────
function initHeroIntro() {
  const words   = gsap.utils.toArray(".hero__word");
  const rule    = document.querySelector(".hero__rule");
  const tagline = document.querySelector(".hero__tagline");
  const corners = gsap.utils.toArray(".hero__corner");
  const scroll  = document.querySelector(".hero__scroll");

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.fromTo(words,
    { yPercent: 115, visibility: "visible" },
    { yPercent: 0, duration: 1.5, stagger: 0.14 },
    0.15
  );

  if (rule) {
    tl.fromTo(rule,
      { scaleX: 0 },
      { scaleX: 1, duration: 1.1, ease: "power3.inOut" },
      0.9
    );
  }

  if (tagline) {
    tl.fromTo(tagline,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.9 },
      1.15
    );
  }

  if (corners.length) {
    tl.fromTo(corners,
      { opacity: 0 },
      { opacity: 1, duration: 1.0, stagger: 0.09, ease: "power2.out" },
      1.3
    );
  }

  if (scroll) {
    tl.fromTo(scroll,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: "power2.out" },
      1.7
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Hero parallax — name drifts up and dissolves as the page takes over
// ──────────────────────────────────────────────────────────────────────────
function initHeroParallax() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  })
    .to(".hero__name", { yPercent: -24, opacity: 0.12, ease: "none" }, 0)
    .to(".hero__meta", { yPercent: -90, opacity: 0, ease: "none" }, 0)
    .to(".hero__cloud", { yPercent: -10, opacity: 0, ease: "none" }, 0)
    .to(".hero__scroll", { opacity: 0, ease: "none" }, 0);
}

// ──────────────────────────────────────────────────────────────────────────
// Section reveals — heads wipe in, serif leads rise line by line
// ──────────────────────────────────────────────────────────────────────────
function initSectionReveals() {
  gsap.utils.toArray(".section__head").forEach((head) => {
    gsap.fromTo(head,
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        duration: 1.3,
        ease: "power3.inOut",
        scrollTrigger: { trigger: head, start: "top 82%" },
      }
    );
  });

  gsap.utils.toArray(".lead").forEach((lead) => {
    SplitText.create(lead, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 115,
          duration: 1.3,
          ease: "power4.out",
          stagger: 0.09,
          scrollTrigger: { trigger: lead, start: "top 78%" },
        });
      },
    });
  });

  gsap.utils.toArray(".body-col").forEach((col) => {
    gsap.from(col.children, {
      y: 28,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out",
      stagger: 0.14,
      scrollTrigger: { trigger: col, start: "top 82%" },
    });
  });

  const groups = [
    [".entries", ".entry", 0.12],
    ["#ventures .rows", ".row", 0.1],
    [".rows--articles", ".row", 0.1],
    [".contact", ".contact__row", 0.08],
  ];

  groups.forEach(([parentSel, childSel, stagger]) => {
    gsap.utils.toArray(parentSel).forEach((parent) => {
      gsap.from(parent.querySelectorAll(childSel), {
        y: 36,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: parent, start: "top 85%" },
      });
    });
  });

  gsap.from(".sub-label", {
    opacity: 0,
    duration: 1,
    scrollTrigger: { trigger: ".sub-label", start: "top 88%" },
  });

  gsap.from(".footer__mark", {
    opacity: 0,
    y: 14,
    duration: 1.2,
    ease: "power2.out",
    scrollTrigger: { trigger: ".footer", start: "top 96%" },
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Anchor links — route through the smoother so easing stays consistent
// ──────────────────────────────────────────────────────────────────────────
function initAnchors(smoother) {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      if (smoother) {
        smoother.scrollTo(target, true, "top top");
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
export async function initAnimations() {
  if (reduced) return; // .js class never added — content is fully visible

  // Serif metrics must be final before SplitText measures lines
  await document.fonts.ready;

  const smoother = initSmoother();
  initHeroIntro();
  initHeroParallax();
  initSectionReveals();
  initAnchors(smoother);

  requestAnimationFrame(() => setTimeout(() => ScrollTrigger.refresh(), 60));
}
