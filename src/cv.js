import "./styles.css";

// The CV is a fast, printable document. It skips the hero preloader and just
// eases in, with the same fog behind it for continuity (hidden when printing).
const init = () => {
  // Print / Save-PDF action
  const printBtn = document.querySelector("[data-print]");
  if (printBtn) printBtn.addEventListener("click", () => window.print());

  // Reuse the homepage's dust-and-light background, unless motion is reduced
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    import("./atmosphere.js").then((m) => m.initAtmosphere());
  }

  // Gentle fade-in once fonts are ready so text does not reflow into view
  const cv = document.getElementById("cv");
  if (cv) {
    cv.style.opacity = "0";
    document.fonts.ready.then(() => {
      cv.style.transition = "opacity 700ms ease";
      requestAnimationFrame(() => (cv.style.opacity = "1"));
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
