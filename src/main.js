import { initAnimations } from "./animations.js";

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
      },
      { once: true }
    );
  });
};

const init = () => {
  initRevealEmail();
  initAnimations();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
