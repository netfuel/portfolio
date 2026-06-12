import "./styles.css";
import { initAnimations } from "./animations.js";
import { runLoader } from "./loader.js";

// Email reveal — replaces the placeholder button with a mailto link on click.
const initRevealEmail = () => {
  document.querySelectorAll(".reveal-email").forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const email = btn.dataset.u + "@" + btn.dataset.d;
        const link = document.createElement("a");
        link.href = "mailto:" + email;
        link.textContent = email;
        btn.replaceWith(link);
        link.focus();
      },
      { once: true }
    );
  });
};

// Live Memphis clock in the bottom-right corner marker
const initClock = () => {
  const el = document.querySelector("[data-clock]");
  if (!el) return;

  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Chicago",
  });

  const update = () => { el.textContent = fmt.format(new Date()); };
  update();
  setInterval(update, 1000);
};

const init = () => {
  initRevealEmail();
  initClock();
  // Three.js loads as an async chunk so the typography never waits on it
  const atmosphere = import("./atmosphere.js").then((m) => m.initAtmosphere());
  const cloud = import("./word-cloud.js").then((m) => m.initWordCloud());
  // The loader tracks real milestones, then hands off into the hero intro
  runLoader([document.fonts.ready, atmosphere, cloud]).then(() => {
    initAnimations();
    // Below the fold — loads after the loader so it never delays first paint
    import("./ventures-papers.js").then((m) => m.initVenturePapers());
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
