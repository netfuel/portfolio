import "./styles.css";
import { runLoader } from "./loader.js";

// ──────────────────────────────────────────────────────────────────────────
// Content — the timeline reads present → past. Each project carries the same
// six-beat case study; bracketed prompts are intentional TODOs and render
// dimmed. `tick` is the label under the timeline node (positions are even).
// ──────────────────────────────────────────────────────────────────────────
const WORK = [
  {
    title: "Adobe Firefly Services",
    role: "Senior UX Designer",
    year: "2023–Present",
    tick: "2023",
    hook: "Generative power means nothing if people can't steer it. I designed the controls.",
    context: "[The gap you were solving — turning raw generative capability into a product surface creatives and developers could actually direct.]",
    approach: "[Your interaction model: prompt-to-output flow, control surfaces, guardrails, the moments of creative intent.]",
    work: "Flow diagrams, control UI, before/after of an unsteerable vs. steerable interaction, [demo clip].",
    outcome: "[Adoption, scale, or the qualitative shift — e.g. “cut the distance between intent and result”.]",
  },
  {
    title: "Next-Gen Adobe Extensions",
    role: "Senior UX Designer",
    year: "2024–Present",
    tick: "2024",
    hook: "What happens when an extension stops waiting for clicks and starts acting?",
    context: "[The shift from passive add-ons to agents that reason and execute across tools.]",
    approach: "[Connector architecture, agent handoff moments, the trust and confirmation patterns you designed so users stay in control.]",
    work: "Agent flow maps, the confirmation/permission UX, a live connector demo, [the “agent did this” moment].",
    outcome: "[New capability unlocked, prototype-to-roadmap, internal validation.]",
  },
  {
    title: "Developer Experiences at Adobe",
    role: "Senior UX Designer",
    year: "2023–Present",
    tick: "2023",
    hook: "The first successful build is a design problem. I treat DX like a product.",
    context: "[Why developer experience needed dedicated design attention on the platform.]",
    approach: "[SDK flows, docs, onboarding, time-to-first-build.]",
    work: "Onboarding flow, the “hello world” moment, before/after activation funnel.",
    outcome: "[Activation, time-to-value, developer feedback.]",
  },
  {
    title: "St. Jude Innovation: VR, AR & IoT",
    role: "Sr. Innovation Architect",
    year: "2017–2022",
    tick: "2017",
    hook: "Immersive technology in service of a $2.2 billion mission.",
    context: "Lead design on the Innovation Team building products that powered large-scale fundraising for the hospital.",
    approach: "Immersive storytelling across VR, AR, and IoT devices tied directly to the life-saving mission.",
    work: "VR/AR experience captures, IoT device design, the Google Mobile Hackathon win.",
    outcome: "[Engagement, dollars influenced, what the tech made possible.]",
  },
  {
    title: "stjude.org & Digital Ecosystem",
    role: "Sr. UX Architect / GUI Dev",
    year: "2012–2023",
    tick: "2012",
    hook: "Years designing the digital front door of one of the most trusted brands in America.",
    context: "Lead design on stjude.org plus e-commerce and mobile-first web across the org, and Brand Ambassador.",
    approach: "[Systems thinking, brand consistency at scale, mobile-first.]",
    work: "Site redesigns, e-commerce flows, design system artifacts.",
    outcome: "[Traffic, conversion, brand impact.]",
  },
  {
    title: "Hilton Mobile Booking",
    role: "Lead Designer",
    year: "2007–2009",
    tick: "2007",
    hook: "Booking a room from your pocket, back when that was still a frontier.",
    context: "[The bet on mobile booking before the smartphone era had settled.]",
    approach: "[Booking flow, the constraints of early Android.]",
    work: "[Booking flow screens, what shipped on early Android.]",
    outcome: "[Adoption and what it proved about mobile-first booking.]",
  },
  {
    title: "Viking Range: Digital Ranges",
    role: "Lead Designer",
    year: "2000–2007",
    tick: "2004",
    hook: "Bringing a luxury kitchen brand into the connected age.",
    context: "[Designing UI for a line of digital ranges.]",
    approach: "[The interaction model for an appliance, not a screen.]",
    work: "[Range UI, the control system you designed.]",
    outcome: "[What the connected line unlocked for the brand.]",
  },
  {
    title: "First Tennessee Online Banking",
    role: "Lead Designer",
    year: "2000–2007",
    tick: "2000",
    hook: "Rebuilding trust into a banking experience people use every day.",
    context: "[The redesign goals and the trust problem you were solving.]",
    approach: "[The flows you owned and the structure you brought.]",
    work: "[Redesigned banking flows, the before/after.]",
    outcome: "[Results — engagement, trust, adoption.]",
  },
];

// A beat is a TODO when it's wholly a bracketed prompt — render it dimmed.
const isTodo = (s) => /^\[[\s\S]*\]$/.test(s.trim());

// Beats that appear as carousel panels after the cover, in order.
const BEATS = [
  { key: "context", label: "Context", media: false },
  { key: "approach", label: "Approach", media: false },
  { key: "work", label: "The work", media: true },
  { key: "outcome", label: "Outcome", media: false },
];

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

// Build one project card: a horizontal track of panels (cover + four beats).
const buildCard = (item, index) => {
  const card = el("article", "work-card");
  card.dataset.index = String(index);

  const track = el("div", "card__track");

  // Cover panel — the design-faithful face: title + meta left, hook right,
  // imagery block below.
  const cover = el("div", "card__panel card__panel--cover");
  const coverHead = el("div", "card__cover-head");
  coverHead.append(
    el("h2", "card__title", item.title),
    el("p", "card__meta", `[ ${item.year} · ${item.role} ]`)
  );
  const desc = el("p", "card__desc", item.hook);
  const media = el("div", "card__media");
  media.append(el("span", "card__media-label", "Portfolio work Imagery"));
  cover.append(coverHead, desc, media);
  track.append(cover);

  // Beat panels — Context / Approach / The work / Outcome.
  BEATS.forEach((beat) => {
    const text = item[beat.key];
    const panel = el("div", "card__panel card__panel--beat");
    const head = el("div", "card__cover-head");
    head.append(
      el("p", "card__beat-label", beat.label),
      el("p", "card__meta", item.title)
    );
    const body = el("p", `card__desc${isTodo(text) ? " card__desc--todo" : ""}`, text);
    panel.append(head, body);
    if (beat.media) {
      const m = el("div", "card__media");
      m.append(el("span", "card__media-label", "Portfolio work Imagery"));
      panel.append(m);
    }
    track.append(panel);
  });

  // Carousel controls — prev / dots / next.
  const panelCount = 1 + BEATS.length;
  const nav = el("div", "card__nav");
  const prev = el("button", "card__arrow card__arrow--prev");
  prev.type = "button";
  prev.setAttribute("aria-label", "Previous detail");
  prev.textContent = "←";
  const next = el("button", "card__arrow card__arrow--next");
  next.type = "button";
  next.setAttribute("aria-label", "Next detail");
  next.textContent = "→";
  const dots = el("div", "card__dots");
  for (let i = 0; i < panelCount; i++) {
    const d = el("button", "card__dot" + (i === 0 ? " is-active" : ""));
    d.type = "button";
    d.dataset.panel = String(i);
    d.setAttribute("aria-label", `Detail ${i + 1} of ${panelCount}`);
    dots.append(d);
  }
  nav.append(prev, dots, next);
  card.append(track, nav);
  return card;
};

// Build the timeline bar: end caps + one evenly-spaced tick per card + node.
const buildTimeline = (mount) => {
  mount.append(el("span", "timeline__line", ""));
  const caps = el("div", "timeline__caps");
  caps.append(el("span", "timeline__cap", "2026"), el("span", "timeline__cap", "2000"));
  mount.append(caps);

  const ticks = el("div", "timeline__ticks");
  const n = WORK.length;
  WORK.forEach((item, i) => {
    const pos = n > 1 ? 6 + (i / (n - 1)) * 88 : 50;
    const t = el("div", "timeline__tick" + (i === 0 ? " is-active" : ""));
    t.style.left = pos.toFixed(2) + "%";
    t.dataset.index = String(i);
    t.append(el("span", "timeline__tick-dot", ""), el("span", "timeline__tick-year", item.tick));
    ticks.append(t);
  });
  mount.append(ticks);

  const node = el("div", "timeline__node");
  node.style.left = "6%";
  mount.append(node);
};

const buildDOM = () => {
  const deck = document.getElementById("deck");
  const timeline = document.getElementById("timeline");
  if (!deck || !timeline) return;
  WORK.forEach((item, i) => deck.append(buildCard(item, i)));
  buildTimeline(timeline);
};

const init = () => {
  buildDOM();

  // Reuse the homepage's dust-and-light background (no word cloud / title)
  const atmosphere = import("./atmosphere.js").then((m) => m.initAtmosphere());

  // Same preloader, tracking real milestones, then hand off into the deck
  runLoader([document.fonts.ready, atmosphere]).then(() => {
    import("./portfolio-deck.js").then((m) => m.initPortfolioDeck(WORK.length));
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
