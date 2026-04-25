import lottie from "lottie-web";

const initPreloader = () => {
  const preloader = document.getElementById("preloader");
  const container = document.getElementById("preloader-anim");
  const video = document.querySelector(".hero__video");
  if (!preloader || !container) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let anim = null;
  if (!reduced) {
    anim = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/loader.json",
    });
  }

  const start = performance.now();
  const MIN_VISIBLE_MS = 900; // avoid flicker on fast cache hits
  let dismissed = false;
  let videoReady = false;

  const finalize = () => {
    if (dismissed) return;
    dismissed = true;
    preloader.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
    setTimeout(() => {
      if (anim) anim.destroy();
      preloader.remove();
    }, 700);
  };

  const tryDismiss = () => {
    if (!videoReady || dismissed) return;
    const elapsed = performance.now() - start;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    setTimeout(finalize, wait);
  };

  const markReady = () => {
    if (videoReady) return;
    videoReady = true;
    tryDismiss();
  };

  if (video) {
    if (video.readyState >= 4) {
      requestAnimationFrame(markReady);
    } else {
      video.addEventListener("canplaythrough", markReady, { once: true });
      video.addEventListener("loadeddata", markReady, { once: true });
      video.addEventListener("error", markReady, { once: true });
    }
  } else {
    markReady();
  }

  // Hard timeout fallback so users never get stuck.
  setTimeout(() => {
    videoReady = true;
    finalize();
  }, 8000);
};

const initScrollBlur = () => {
  const targets = document.querySelectorAll("[data-scroll-blur]");
  if (!targets.length) return;

  const MIN_BLUR = 2;
  const MAX_BLUR = 10;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let ticking = false;

  const update = () => {
    const viewH = window.innerHeight;
    const viewCenter = viewH / 2;

    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elCenter - viewCenter);
      const t = Math.min(distance / viewCenter, 1); // 0 at center, 1 at viewport edge
      const blur = reduced ? MIN_BLUR : MIN_BLUR + (MAX_BLUR - MIN_BLUR) * t;
      el.style.filter = `blur(${blur.toFixed(2)}px)`;
    });
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
};

const initParallax = () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const targets = document.querySelectorAll("[data-parallax]");
  if (!targets.length) return;

  let ticking = false;

  const update = () => {
    targets.forEach((el) => {
      const section = el.closest("section");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const offset = (progress - 0.5) * 120; // ±60px travel
      el.style.transform = `translateY(${offset}px)`;
    });
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
};

// Section-level reveal — hero entrance only
const reveal = () => {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );

  targets.forEach((el) => observer.observe(el));
};

// Element-level reveal — individual items fade up as they scroll in
const initReveal = () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) return;

  const selectors = [
    ".bio-float .eyebrow",
    ".bio-float .body-lg",
    ".ventures-section .eyebrow",
    ".ventures-section .body-lg",
    ".intro__heading",
    ".intro__content > .eyebrow",
    ".intro__content > .body-lg",
    ".intro__content > .cta-line",
    ".intro__content > .eyebrow--inline",
    ".intro__content > .featured",
    ".lets-talk .eyebrow",
    ".lets-talk .display",
    ".lets-talk .body-lg",
    ".contact > li",
    ".footer > p",
    ".craft__item",
  ].join(",");

  const items = [...document.querySelectorAll(selectors)];
  if (!items.length) return;

  // Stagger siblings within grouped containers
  [".craft", ".ventures", ".contact", ".featured"].forEach((containerSel) => {
    document.querySelectorAll(containerSel).forEach((container) => {
      const children = [...container.children].filter((c) => items.includes(c));
      children.forEach((child, i) => {
        if (i > 0) child.style.setProperty("--reveal-delay", `${i * 80}ms`);
      });
    });
  });

  items.forEach((el) => el.classList.add("reveal-item"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
  );

  items.forEach((el) => observer.observe(el));
};

const initRevealEmail = () => {
  document.querySelectorAll(".reveal-email").forEach((btn) => {
    btn.addEventListener("click", () => {
      const email = btn.dataset.u + "@" + btn.dataset.d;
      const link = document.createElement("a");
      link.href = "mailto:" + email;
      link.textContent = email;
      btn.replaceWith(link);
    }, { once: true });
  });
};

const init = () => {
  initPreloader();
  initScrollBlur();
  initParallax();
  reveal();
  initReveal();
  initRevealEmail();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
