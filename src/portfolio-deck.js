import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 720px)").matches;

// ──────────────────────────────────────────────────────────────────────────
// Deck pose — pure map from signed distance `o` (card index − focal t) to
// visual state. Receded cards rise behind the focal card in a stacked-paper
// cascade, tipping back and dimming into the fog; passed cards rush the
// camera and fade. Returned as tweenable strings so the overview can animate
// to and from the exact same poses.
// ──────────────────────────────────────────────────────────────────────────
const deckPose = (o) => {
  if (o < -3.6 || o > 0.95) return null; // outside the visible depth window
  let z, y, rx, opacity, brightness;
  if (o <= 0) {
    z = o * 150;
    y = o * 74;
    rx = o * -2.4;
    brightness = Math.max(0.16, 1 + o * 0.3);
    opacity = 1 + o * 0.12;
    if (o < -2.6) opacity *= Math.max(0, (3.6 + o) / 1.0);
  } else {
    z = o * 1100;
    y = -o * 10;
    rx = o * 4;
    opacity = Math.max(0, 1 - o * 1.6);
    brightness = 1;
  }
  return {
    transform: `translate(-50%, -50%) translateY(${y.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg)`,
    opacity: Math.max(0, Math.min(1, opacity)),
    filter: brightness < 0.999 ? `brightness(${brightness.toFixed(3)})` : "none",
    z: 1000 + Math.round(o * 100),
    interactive: Math.abs(o) < 0.3, // only the focal card takes input
  };
};

const positionCard = (card, o) => {
  const p = deckPose(o);
  if (!p) {
    card.style.visibility = "hidden";
    card.style.pointerEvents = "none";
    return;
  }
  card.style.visibility = "visible";
  card.style.transform = p.transform;
  card.style.opacity = String(p.opacity);
  card.style.filter = p.filter;
  card.style.zIndex = String(p.z);
  card.style.pointerEvents = p.interactive ? "auto" : "none";
};

export function initPortfolioDeck() {
  const work = document.getElementById("work");
  const stage = document.getElementById("deck-stage");
  const cards = gsap.utils.toArray(".work-card");
  const timeline = document.getElementById("timeline");
  const ticks = gsap.utils.toArray(".timeline__tick");
  const node = timeline ? timeline.querySelector(".timeline__node") : null;
  const counter = document.getElementById("counter");
  const hint = document.getElementById("scroll-hint");
  const indexToggle = document.getElementById("index-toggle");
  const intro = document.getElementById("work-intro");
  if (!cards.length) return;

  const total = cards.length; // projects + outro
  const N = ticks.length; // projects only
  const pad = (n) => String(n).padStart(2, "0");

  // True year positions (%) — set by portfolio.js from each project's year
  const tickPos = ticks.map((tk) => parseFloat(tk.dataset.pos));

  // Piecewise map: continuous card index t → % position along the bar,
  // so the node always travels through the ticks' true year positions
  const clampT = (t) => Math.max(0, Math.min(total - 1, t));
  const nodePos = (t) => {
    t = Math.max(0, Math.min(N - 1, t));
    const i = Math.max(0, Math.min(N - 2, Math.floor(t)));
    return tickPos[i] + (tickPos[i + 1] - tickPos[i]) * (t - i);
  };
  const posToT = (p) => {
    if (p <= tickPos[0]) return 0;
    if (p >= tickPos[N - 1]) return N - 1;
    let i = 0;
    while (i < N - 2 && tickPos[i + 1] < p) i++;
    return i + (p - tickPos[i]) / (tickPos[i + 1] - tickPos[i]);
  };

  // Reduced motion: plain vertical stack, studies inline, no 3D at all
  if (reduced) {
    work.classList.add("is-static");
    return;
  }

  // ── State machine: deck ⇄ overview, deck ⇄ open (case study) ───────────
  let mode = "deck"; // 'deck' | 'overview' | 'open' | 'closing'
  let focus = -1;
  let lastT = 0;
  let scrubbing = false; // timeline-node drag owns the node position
  let openIndex = -1;
  let preRect = null;
  let smoother = null;
  const state = { t: 0 }; // mobile story position
  let hintShown = true;

  const dismissHint = () => {
    if (!hintShown || !hint) return;
    hintShown = false;
    gsap.to(hint, { autoAlpha: 0, duration: 0.5, ease: "power2.out" });
  };

  // Intro screen — the first scroll, swipe, or click sends it on its way.
  // The focal card's text reveal waits behind it and plays as the veil lifts.
  let introShown = !!intro;
  const dismissIntro = () => {
    if (!introShown) return;
    introShown = false;
    gsap.to(intro, {
      autoAlpha: 0,
      y: -30,
      duration: 0.7,
      ease: "power3.inOut",
      onComplete: () => intro.remove(),
    });
    if (focus >= 0) revealCover(cards[focus]);
  };
  if (intro) intro.addEventListener("click", dismissIntro);

  // Cover text reveal — homepage line-lift, played once per card. The meta
  // is faded rather than split: its hidden role span expands when the study
  // opens, and SplitText's line masks would clip the grown line.
  const revealed = new Set();
  const revealCover = (card) => {
    if (revealed.has(card)) return;
    revealed.add(card);
    const lines = [];
    card.querySelectorAll(".card__title, .card__hook").forEach((t) => {
      const st = new SplitText(t, { type: "lines", mask: "lines" });
      lines.push(...st.lines);
    });
    gsap.fromTo(
      lines,
      { yPercent: 115 },
      { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.05 }
    );
    const meta = card.querySelector(".card__meta");
    if (meta)
      gsap.fromTo(
        meta,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.35, ease: "power2.out" }
      );
  };

  const onFocus = (f) => {
    focus = f;
    cards.forEach((c, i) => c.classList.toggle("is-focused", i === f));
    if (!introShown) revealCover(cards[f]);
    if (counter)
      counter.textContent = f < N ? `${pad(f + 1)} / ${pad(N)}` : "fin.";
    const slug = cards[f].dataset.slug || "end";
    history.replaceState(null, "", "#" + slug);
  };

  const render = (t) => {
    if (mode !== "deck") return;
    lastT = t;
    cards.forEach((card, i) => positionCard(card, t - i));
    if (node && !scrubbing) node.style.left = nodePos(t).toFixed(2) + "%";
    const nearest = Math.round(clampT(t));
    ticks.forEach((tk, i) => tk.classList.toggle("is-active", i === nearest));
    if (t > 0.05) dismissHint();
    if (t > 0.12) dismissIntro();
    // Commit focus only once a card is nearly centered — crossing midpoints
    // mid-scrub shouldn't replay reveals
    if (nearest !== focus && !scrubbing && Math.abs(clampT(t) - nearest) < 0.35) {
      onFocus(nearest);
    }
  };

  const maxScroll = () =>
    document.documentElement.scrollHeight - window.innerHeight;

  // The first gap (card 0 → card 1) is widened so the scroll that dismisses
  // the intro has a broad landing basin on card 0 — you settle on the first
  // card instead of sliding straight past it. Card 0 still rests at progress
  // 0 (top), so the page opens on the intro with no auto-scroll. Later gaps
  // are uniform. (Mobile guards its first swipe directly instead.)
  const GAP0 = 1.8;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const cumUnits = []; // scroll "units" at each card center
  for (let k = 0, acc = 0; k < total; k++) {
    cumUnits.push(acc);
    acc += k === 0 ? GAP0 : 1;
  }
  const UNITS = cumUnits[total - 1]; // total units across the whole deck
  const progressForT = (t) => {
    t = clampT(t);
    const i = Math.min(total - 2, Math.floor(t));
    const pos = cumUnits[i] + (cumUnits[i + 1] - cumUnits[i]) * (t - i);
    return pos / UNITS;
  };
  const tFromProgress = (p) => {
    const pos = clamp01(p) * UNITS;
    let i = 0;
    while (i < total - 2 && cumUnits[i + 1] <= pos) i++;
    return i + (pos - cumUnits[i]) / (cumUnits[i + 1] - cumUnits[i]);
  };

  // Jump the deck to a card index (platform-appropriate)
  const goToIndex = (i, smooth = true) => {
    i = Math.round(clampT(i));
    if (smoother) {
      const y = progressForT(i) * maxScroll();
      smooth ? smoother.scrollTo(y, true) : smoother.scrollTop(y);
    } else {
      gsap.to(state, {
        t: i,
        duration: smooth ? 0.7 : 0,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => render(state.t),
      });
    }
  };

  // ── Case study: the focal card expands into a scrolling article ─────────
  const openStudy = (i) => {
    if (mode !== "deck" || i < 0 || !cards[i].querySelector(".card__study"))
      return;
    const card = cards[i];
    mode = "open";
    openIndex = i;
    preRect = card.getBoundingClientRect();
    dismissHint();
    dismissIntro();
    tiltReset();
    if (smoother) smoother.paused(true);
    work.classList.add("has-open");
    card.classList.add("is-open");
    gsap.set(card, { width: preRect.width, height: preRect.height });
    card.style.transform = "translate(-50%, -50%)";
    card.style.opacity = "1";
    card.style.filter = "none";
    card.style.zIndex = "2000";
    gsap.to(card, {
      width: window.innerWidth,
      height: window.innerHeight,
      duration: 0.75,
      ease: "power4.inOut",
      onComplete: () => {
        const close = card.querySelector(".card__close");
        if (close) close.focus({ preventScroll: true });
      },
    });
    gsap.fromTo(
      card.querySelectorAll(".card__pull, .study__beat, .study__foot"),
      { autoAlpha: 0, y: 34 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.07,
        delay: 0.35,
        ease: "power2.out",
        clearProps: "all",
      }
    );
  };

  const closeStudy = (advance = 0) => {
    if (mode !== "open") return;
    const card = cards[openIndex];
    mode = "closing";
    gsap.to(card, { scrollTop: 0, duration: 0.25, ease: "power2.out" });
    gsap.to(card, {
      width: preRect.width,
      height: preRect.height,
      duration: 0.6,
      ease: "power4.inOut",
      delay: 0.1,
      onComplete: () => {
        card.classList.remove("is-open");
        work.classList.remove("has-open");
        gsap.set(card, { clearProps: "width,height" });
        const target = openIndex + advance;
        openIndex = -1;
        mode = "deck";
        if (smoother) smoother.paused(false);
        render(lastT);
        if (advance) goToIndex(target);
      },
    });
  };

  // ── Overview: the camera pulls back, the whole deck fans into a grid ────
  const setToggle = (on) => {
    if (!indexToggle) return;
    indexToggle.setAttribute("aria-pressed", String(on));
    indexToggle.textContent = on ? "[ Close ]" : "[ Index ]";
  };

  const enterOverview = () => {
    if (mode !== "deck") return;
    mode = "overview";
    dismissHint();
    dismissIntro();
    tiltReset();
    work.classList.add("is-overview");
    setToggle(true);
    if (smoother) smoother.paused(true);
    const cw = cards[0].offsetWidth;
    const ch = cards[0].offsetHeight;
    const cols = window.innerWidth > 900 ? 3 : 2;
    const rows = Math.ceil(total / cols);
    const availW = window.innerWidth * 0.86;
    const availH = window.innerHeight * (mobile ? 0.72 : 0.64);
    const cellW = availW / cols;
    const cellH = availH / rows;
    const s = Math.min(cellW / cw, cellH / ch) * 0.92;
    cards.forEach((card, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * cellW;
      const y = (row - (rows - 1) / 2) * cellH;
      card.style.visibility = "visible";
      card.style.pointerEvents = "auto";
      card.style.zIndex = String(10 + i);
      gsap.to(card, {
        transform: `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`,
        opacity: 1,
        filter: "brightness(1)",
        duration: 0.8,
        ease: "power3.inOut",
        overwrite: "auto",
      });
    });
  };

  const exitOverview = (i) => {
    if (mode !== "overview") return;
    mode = "closing";
    i = Math.round(clampT(i));
    work.classList.remove("is-overview");
    setToggle(false);
    const tl = gsap.timeline({
      onComplete: () => {
        mode = "deck";
        if (smoother) {
          smoother.paused(false);
          smoother.scrollTop(progressForT(i) * maxScroll());
        } else {
          state.t = i;
        }
        render(i);
        if (focus !== i) onFocus(i);
      },
    });
    cards.forEach((card, idx) => {
      const o = idx - i;
      const p =
        deckPose(o) ||
        {
          transform: `translate(-50%, -50%) translateY(${(o * 74).toFixed(1)}px) translateZ(${(o < 0 ? o * 150 : o * 1100).toFixed(1)}px) rotateX(0deg)`,
          opacity: 0,
          filter: "brightness(1)",
        };
      tl.to(
        card,
        {
          transform: p.transform,
          opacity: p.opacity,
          filter: p.filter === "none" ? "brightness(1)" : p.filter,
          duration: 0.8,
          ease: "power3.inOut",
          overwrite: "auto",
        },
        0
      );
    });
  };

  // ── Cursor parallax — the whole stage leans with the pointer ────────────
  let tiltRX = null;
  let tiltRY = null;
  if (!mobile && stage) {
    tiltRY = gsap.quickTo(stage, "rotationY", { duration: 1.1, ease: "power2.out" });
    tiltRX = gsap.quickTo(stage, "rotationX", { duration: 1.1, ease: "power2.out" });
    window.addEventListener("pointermove", (e) => {
      if (mode !== "deck") return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      tiltRY(nx * 2.6);
      tiltRX(-ny * 2.0);
    });
  }
  const tiltReset = () => {
    if (tiltRY) {
      tiltRY(0);
      tiltRX(0);
    }
  };

  // ── Shared controls ──────────────────────────────────────────────────────
  cards.forEach((card, i) => {
    const open = card.querySelector(".card__open");
    if (open) open.addEventListener("click", () => openStudy(i));
    const close = card.querySelector(".card__close");
    if (close) close.addEventListener("click", () => closeStudy());
    const next = card.querySelector(".study__next");
    if (next)
      next.addEventListener("click", () =>
        closeStudy(i < total - 1 ? 1 : -(total - 1))
      );
    const restart = card.querySelector(".outro__restart");
    if (restart) restart.addEventListener("click", () => goToIndex(0));
    // In the overview, any card is a door back into the deck
    card.addEventListener("click", (e) => {
      if (mode !== "overview") return;
      if (e.target instanceof Element && e.target.closest("button, a")) return;
      exitOverview(i);
    });
  });

  if (indexToggle)
    indexToggle.addEventListener("click", () =>
      mode === "overview" ? exitOverview(Math.max(0, focus)) : enterOverview()
    );

  // One keyboard router for the whole page
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (mode === "open") closeStudy();
      else if (mode === "overview") exitOverview(Math.max(0, focus));
      return;
    }
    if (mode !== "deck") return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goToIndex(Math.round(clampT(lastT)) + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goToIndex(Math.round(clampT(lastT)) - 1);
    } else if (e.key === "Enter" && document.activeElement === document.body) {
      openStudy(focus);
    }
  });

  // Timeline reveal in the preloader's language: the bar draws in with an
  // accent flash, then the node and ticks settle into place
  const introTimeline = () => {
    if (!timeline || !node) return;
    const line = timeline.querySelector(".timeline__line");
    gsap.timeline({ delay: 0.15 })
      .fromTo(line,
        { scaleX: 0, transformOrigin: "left center", backgroundColor: "rgba(211, 231, 79, 0.9)" },
        { scaleX: 1, backgroundColor: "rgba(232, 227, 214, 0.30)", duration: 1.1, ease: "power4.inOut" }, 0)
      .from(node, { scale: 0, duration: 0.6, ease: "back.out(2)" }, 0.45)
      .from(ticks, { autoAlpha: 0, y: 6, duration: 0.6, stagger: 0.04, ease: "power2.out" }, 0.6);
  };

  // Deep link — #slug opens the deck at that project. Captured now, before
  // the first focus commit replaces the hash with the focal card's slug.
  const initialSlug = location.hash.slice(1);
  const hashIndex = () => {
    if (!initialSlug) return 0;
    const i = cards.findIndex((c) => c.dataset.slug === initialSlug);
    return i >= 0 ? i : initialSlug === "end" ? total - 1 : 0;
  };

  // Intro entrance — staggered line arrival; a deep link skips the welcome
  const introEntrance = () => {
    if (!intro) return;
    if (hashIndex() > 0) {
      introShown = false;
      intro.remove();
      return;
    }
    gsap.fromTo(
      intro.children,
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.09, delay: 0.25, ease: "power3.out" }
    );
  };

  // ── MOBILE: full-screen story deck, gesture-driven (vertical only) ──────
  if (mobile) {
    document.documentElement.classList.add("story");
    work.classList.add("is-story");

    const snapTo = (target, dur = 0.65) => {
      gsap.to(state, {
        t: Math.round(clampT(target)),
        duration: dur,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => render(state.t),
      });
    };

    let startY = 0, startT = 0, t0 = 0, startX = 0;
    let lastY = 0, lastTime = 0, vy = 0;
    let active = false, moved = false, wasIntro = false;

    const onDown = (e) => {
      if (mode !== "deck") return;
      // The timeline and nav own their taps — a drag must not start there
      if (e.target instanceof Element && e.target.closest(".timeline, .work__nav"))
        return;
      active = true;
      moved = false;
      wasIntro = introShown;
      startX = e.clientX;
      startY = lastY = e.clientY;
      startT = state.t;
      t0 = performance.now();
      lastTime = t0;
      vy = 0;
      gsap.killTweensOf(state);
    };

    const onMove = (e) => {
      if (!active) return;
      const dy = e.clientY - startY;
      const dx = e.clientX - startX;
      if (!moved && Math.hypot(dx, dy) < 10) return;
      moved = true;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      vy = ((e.clientY - lastY) / dt) * 16.7;
      lastY = e.clientY;
      lastTime = now;
      // Finger-follow with gentle resistance at the ends
      let t = startT + -dy / (window.innerHeight * 0.55);
      if (t < 0) t = t * 0.3;
      if (t > total - 1) t = total - 1 + (t - (total - 1)) * 0.3;
      state.t = t;
      render(state.t);
      dismissHint();
    };

    const onUp = (e) => {
      if (!active) return;
      active = false;
      const dy = e.clientY - startY;
      const dt = performance.now() - t0;

      // Tap: dismiss the intro first; otherwise the focal card opens its study
      if (!moved && dt < 350 && focus >= 0) {
        if (introShown) {
          dismissIntro();
          return;
        }
        if (e.target instanceof Element && e.target.closest("button, a")) return;
        if (e.target instanceof Element && e.target.closest(".work-card"))
          openStudy(focus);
        return;
      }

      // The first swipe just clears the intro and lands on card 0 — it must
      // not flick straight past it
      if (wasIntro) {
        dismissIntro();
        snapTo(0, 0.5);
        return;
      }

      // Flick advances; otherwise settle on the nearest card
      const flickV = vy / window.innerHeight;
      let target = Math.round(state.t);
      if (Math.abs(flickV) > 0.012)
        target = Math.round(startT) + (flickV < 0 ? 1 : -1);
      snapTo(target, 0.6);
    };

    // Bound to the section, not the deck, so swipes that begin on the intro
    // overlay still drive the flythrough
    work.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    // Ticks jump straight to a project
    ticks.forEach((tk, i) => {
      tk.style.pointerEvents = "auto";
      tk.addEventListener("click", () => {
        if (mode === "overview") exitOverview(i);
        else if (mode === "deck") snapTo(i, 0.8);
      });
    });

    gsap.fromTo(work, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out" });
    state.t = hashIndex();
    render(state.t);
    if (state.t > 0 && focus < 0) onFocus(Math.round(state.t));
    introTimeline();
    introEntrance();
    return;
  }

  // ── DESKTOP: pinned scroll flythrough with smoothed scrub ───────────────
  smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.6,
    smoothTouch: false,
  });
  if (import.meta.env.DEV) window.__smoother = smoother;

  ScrollTrigger.create({
    trigger: "#work",
    start: "top top",
    end: "+=" + total * 90 + "%",
    pin: true,
    scrub: 1.2,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    snap: total > 1
      ? {
          // Snap to true card centers (which now include the leading hold);
          // while the timeline node is being dragged, snap yields — it was
          // fighting the hand mid-drag and jittering the deck
          snapTo: (value) => {
            if (scrubbing || mode !== "deck") return value;
            let best = value, bd = Infinity;
            for (let k = 0; k < total; k++) {
              const pp = progressForT(k);
              const d = Math.abs(pp - value);
              if (d < bd) { bd = d; best = pp; }
            }
            return best;
          },
          duration: { min: 0.2, max: 0.6 },
          ease: "power1.inOut",
          delay: 0.04,
        }
      : false,
    onUpdate: (self) => {
      if (self.progress > 0.015) dismissIntro();
      render(tFromProgress(self.progress));
    },
    onRefresh: (self) => render(tFromProgress(self.progress)),
  });

  // Explicit fromTo — the `.js .work` rule leaves it visibility:hidden, so a
  // plain .from() would animate back to hidden
  gsap.fromTo(work, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out" });
  render(0);
  introTimeline();
  introEntrance();

  // ── Timeline: draggable, dot-locking scrubber (desktop) ─────────────────
  if (timeline && node) {
    const pointerT = (clientX) => {
      const r = timeline.getBoundingClientRect();
      return posToT(((clientX - r.left) / r.width) * 100);
    };
    let dragging = false;
    node.style.pointerEvents = "auto";
    node.style.cursor = "grab";
    node.addEventListener("pointerdown", (e) => {
      if (mode !== "deck") return;
      dragging = true;
      scrubbing = true;
      node.style.cursor = "grabbing";
      e.preventDefault();
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      let t = pointerT(e.clientX);
      const nt = Math.round(t);
      if (Math.abs(t - nt) < 0.3) t = nt; // magnet-lock onto the dot
      // The node sticks to the hand (render yields it while scrubbing);
      // the deck eases behind it through the scrub smoothing
      node.style.left = nodePos(t).toFixed(2) + "%";
      smoother.scrollTop(progressForT(t) * maxScroll());
    });
    const endScrub = (e) => {
      if (!dragging) return;
      dragging = false;
      scrubbing = false;
      node.style.cursor = "grab";
      // Instant scroll target; the scrub smoothing provides the one and
      // only ease — scrollTo's own tween on top of it read as a glitch
      smoother.scrollTop(progressForT(Math.round(pointerT(e.clientX))) * maxScroll());
    };
    window.addEventListener("pointerup", endScrub);
    window.addEventListener("pointercancel", endScrub);

    // Click a tick to jump to that card
    ticks.forEach((tk, i) => {
      tk.style.pointerEvents = "auto";
      tk.style.cursor = "pointer";
      tk.addEventListener("click", () => {
        if (mode === "overview") exitOverview(i);
        else if (mode === "deck") smoother.scrollTo(progressForT(i) * maxScroll(), true);
      });
    });
  }

  requestAnimationFrame(() =>
    setTimeout(() => {
      ScrollTrigger.refresh();
      const i = hashIndex();
      if (i > 0) smoother.scrollTop(progressForT(i) * maxScroll());
    }, 60)
  );
}
