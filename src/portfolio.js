import "./styles.css";
import { runLoader } from "./loader.js";

// ──────────────────────────────────────────────────────────────────────────
// Content — the timeline reads present → past, strictly descending.
// `year` is the display range, `tick` the label under the timeline node,
// `ty` the fractional year that sets the tick's true position on the
// 2026→2000 bar. `img` is the card imagery (null = generative placeholder).
// `slug` is the deep-link hash; `pull` the cover's stat/highlight chip.
// ──────────────────────────────────────────────────────────────────────────
const WORK = [
  {
    title: "Developer Experiences at Adobe",
    role: "Senior UX Designer",
    year: "2026",
    tick: "2026",
    ty: 2026.0,
    img: null,
    slug: "adobe-dx",
    pull: "metric: time-to-first-build",
    hook: "The first successful build is a design problem. I treat DX like a product.",
    context: "Every platform lives or dies on its developers. Adobe's extensibility surface is vast — SDKs, APIs, docs, samples — and the first hour decides whether a developer stays or walks.",
    approach: "Time-to-first-build is the metric that matters. I design onboarding that answers the next question before it's asked, and “hello world” moments that arrive in minutes instead of afternoons.",
    work: "End-to-end onboarding design for Adobe's developer platform — from first landing to first successful build.",
    outcome: "A developer journey with fewer dead ends and a faster path to a working build — developer experience treated with product-grade care.",
  },
  {
    title: "Next-Gen Adobe Extensions",
    role: "Senior UX Designer",
    year: "2024–Present",
    tick: "2024",
    ty: 2024.5,
    img: null,
    slug: "adobe-extensions",
    pull: "agentic extensibility patterns",
    hook: "What happens when an extension stops waiting for clicks and starts acting?",
    context: "Creative Cloud runs on an ecosystem of add-ons built for a world where software waits for input. Agentic AI breaks that assumption — extensions can now reason, plan, and act across tools. Someone has to design what that shift feels like for the person in the loop.",
    approach: "I map where an agent should act and where it must ask. Connector architecture, handoff moments, confirmation and permission patterns — the interaction grammar that keeps a human in command of software that moves on its own.",
    work: "Agent flow maps, trust and confirmation UX, and live connector prototypes that carry work across Adobe tools — while showing exactly what the agent did, and why.",
    outcome: "Working patterns for agentic extensibility — prototypes that are shaping how add-ons graduate from passive panels to active collaborators.",
  },
  {
    title: "Adobe Firefly Services",
    role: "Senior UX Designer",
    year: "2023–Present",
    tick: "2023",
    ty: 2023.6,
    img: null,
    slug: "firefly-services",
    pull: "steerable generation at scale",
    hook: "Generative power means nothing if people can't steer it. I designed the controls.",
    context: "Firefly Services puts Adobe's generative models behind APIs so teams can produce content at industrial scale. But raw capability isn't a product — someone has to design how creative intent becomes usable output.",
    approach: "I design the control surfaces: prompt-to-output flows, parameters that read like creative decisions rather than machine settings, and guardrails that keep brands on-brand at ten thousand assets a batch.",
    work: "Control UI and flow design across the Firefly Services surface — the difference between an unsteerable model and a tool a creative team can direct with confidence.",
    outcome: "Interfaces that shorten the distance between intent and result — making generation something teams direct, not something they gamble on.",
  },
  {
    title: "St. Jude Donor Loyalty",
    role: "Sr. UX Architect · ALSAC/St. Jude",
    year: "2022–2023",
    tick: "2022",
    ty: 2022.3,
    img: "/images/work/loyalty.webp",
    slug: "donor-loyalty",
    pull: "+22% repeat giving · +5% avg gift",
    hook: "Repeat donors were slipping away. We designed a reason to stay.",
    context: "St. Jude raises $2.2 billion a year, but repeat digital donations were declining. Acquiring donors was working — keeping them wasn't. The mission needed loyalty, not just reach.",
    approach: "A loyalty layer that runs quietly behind a donor's profile, surfacing the tangible impact of every gift with personalized stories and incentives. Prototyped in XD, tested with a 30,000-donor segment over a full year, then shipped on the tools we already had.",
    work: "Onboarding, dashboard, impact reporting, and education flows — a complete product designed, tested, and delivered inside a nonprofit's existing stack.",
    outcome: "Repeat donations rose 22% and the average gift grew 5%. Donors said they felt more valued and more connected to the mission they were funding.",
  },
  {
    title: "Sequin Forest",
    role: "Sr. UX Architect · ALSAC/St. Jude",
    year: "2021–2022",
    tick: "2021",
    ty: 2021.3,
    img: "/images/work/sequin-forest.webp",
    slug: "sequin-forest",
    pull: "a surge in 18–35 donors",
    hook: "Micro-donations for a generation that trusts the chain more than the checkout.",
    context: "St. Jude wanted younger donors, transparent giving, and lower transaction overhead. Blockchain rails offered all three — if the experience could be made to feel human instead of financial.",
    approach: "Gamified micro-giving: small donations with near-zero fees, every transaction transparent and immutable, badges marking milestones along the way. Crypto mechanics, designed to feel like planting something that grows.",
    work: "The full giving experience — from first visit to a growing sequin forest that visualizes collective impact, one donation at a time.",
    outcome: "A surge in donations from 18–35 year-olds and drastically lower processing overhead — proof that emerging tech and philanthropy compound each other.",
  },
  {
    title: "Hall of Heroes VR",
    role: "Sr. Innovation Architect · ALSAC/St. Jude",
    year: "2019–2021",
    tick: "2020",
    ty: 2020.0,
    img: "/images/work/hall-of-heroes.webp",
    slug: "hall-of-heroes",
    pull: "featured at CES · built with Meta",
    hook: "Walking the halls of St. Jude from anywhere on Earth.",
    context: "Most people will never set foot on the St. Jude campus — yet presence is what turns sympathy into commitment. Virtual reality could close that distance.",
    approach: "An immersive experience built in partnership with Meta: donors walk the hospital's halls, meet its heroes, and feel the scale of the mission in first person. Comfort-first VR interaction, narrative pacing over spectacle.",
    work: "Ideation and UX design for the full experience — one thread of an innovation practice that spanned VR, AR, and IoT products for large-scale fundraising.",
    outcome: "Featured at the Consumer Electronics Show and shipped as a public experience — immersive storytelling in service of a $2.2 billion mission.",
  },
  {
    title: "The St. Jude Donation Experience",
    role: "Sr. GUI Developer → UX Architect",
    year: "2018–2023",
    tick: "2018",
    ty: 2018.0,
    img: "/images/work/donation.webp",
    slug: "donation-experience",
    pull: "$2.2B mission · five years of iteration",
    hook: "Five years refining the most important form in childhood cancer.",
    context: "stjude.org/donate is where the mission gets funded — by people who are mobile-first, time-crunched, and one distraction away from not giving. Every point of friction has a cost measured in research.",
    approach: "Continuous, test-driven redesign over five years: user testing, iteration, and a mobile-first rebuild of every step between impulse and impact.",
    work: "The complete donation flow, plus the platform around it — from crypto giving to Amazon merch — turning new channels into fundraising surfaces for one of America's most trusted brands.",
    outcome: "A modern giving experience with the friction removed from the moment generosity strikes — and a template for how a legacy nonprofit ships like a product team.",
  },
  {
    title: "The Early Years",
    role: "Lead Designer · Lokion Interactive → Hilton",
    year: "2000–2009",
    tick: "2000s",
    ty: 2004.5,
    img: null,
    slug: "early-years",
    pull: "nokia · fedex · hilton · viking · first tennessee",
    hook: "A decade of firsts, before the patterns existed — the work that shaped how I design today.",
    context: "My first decade was agency work at Lokion Interactive — Nokia, FedEx, Hilton, ServiceMaster — in the years before mobile-first was a strategy or design patterns existed to borrow. Every project was a first for somebody, usually including us.",
    approach: "Translate trust. A luxury stove with knobs, a bank built on tellers, a hotel front desk — each had to become digital without losing what people already believed in. Strip to essentials, honor the constraint, and draw the map while walking it.",
    work: "Lead design on Viking's digital range line, the redesign of First Tennessee's online banking, and Hilton's Android booking application — one of the era's first major hotel booking apps, designed for thumbs and small screens when every kilobyte and keystroke cost something.",
    outcome: "Two decades later the lessons still hold: new interfaces win by honoring what people already trust, and constraint is where discipline comes from. Everything since — St. Jude, Adobe — is built on that decade.",
  },
];

// Timeline geometry — ticks are spaced evenly across the bar
const TICK_MIN = 6;   // % inset for the first tick
const TICK_SPAN = 88; // % width the ticks are distributed across

// The four case-study beats, rendered as sections of the expanded study.
const BEATS = [
  { key: "context", label: "Context", num: "01" },
  { key: "approach", label: "Approach", num: "02" },
  { key: "work", label: "The work", num: "03", media: true },
  { key: "outcome", label: "Outcome", num: "04", stat: true },
];

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

// ── Generative placeholder — contour field in the site's language ─────────
// Deterministic per project (seeded by slug) so the art is stable between
// visits. Reads as art direction, not absence, until real imagery lands.
const seededRandom = (slug) => {
  let h = 2166136261 >>> 0;
  for (const ch of slug) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

const placeholderSVG = (item, index) => {
  const rnd = seededRandom(item.slug);
  const cx = 430 + (rnd() * 160 - 80);
  const cy = 235 + (rnd() * 90 - 45);
  const rot = rnd() * 56 - 28;
  let rings = "";
  for (let k = 0; k < 9; k++) {
    const rx = 44 + k * (32 + rnd() * 10);
    const ry = 19 + k * (16 + rnd() * 6);
    const o = Math.max(0.05, 0.34 - k * 0.033);
    const dash = k % 3 === 2 ? ' stroke-dasharray="2 6"' : "";
    rings +=
      `<ellipse cx="${(cx + (rnd() * 22 - 11) * k).toFixed(1)}" cy="${(cy + (rnd() * 13 - 6.5) * k).toFixed(1)}"` +
      ` rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"` +
      ` transform="rotate(${(rot + k * (rnd() * 6 - 3)).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"` +
      ` fill="none" stroke="rgba(211,231,79,${o.toFixed(3)})" stroke-width="1"${dash}/>`;
  }
  let dust = "";
  for (let k = 0; k < 26; k++) {
    dust += `<circle cx="${(rnd() * 800).toFixed(0)}" cy="${(rnd() * 480).toFixed(0)}" r="${(rnd() * 1.3 + 0.4).toFixed(2)}" fill="rgba(232,227,214,${(rnd() * 0.18 + 0.06).toFixed(2)})"/>`;
  }
  return (
    `<svg class="ph" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="800" height="480" fill="#0B0B0E"/>` +
    `<text x="48" y="432" font-family="Pavilion, Georgia, serif" font-size="230" fill="rgba(232,227,214,0.07)">0${index + 1}</text>` +
    `<g class="ph__drift">${rings}</g>${dust}</svg>`
  );
};

const buildMedia = (item, index) => {
  const media = el("div", "card__media");
  if (item.img) {
    const img = document.createElement("img");
    img.src = item.img;
    img.alt = `${item.title} — project imagery`;
    img.loading = "lazy";
    img.draggable = false;
    media.append(img);
  } else {
    media.classList.add("card__media--ph");
    media.innerHTML = placeholderSVG(item, index);
    media.append(el("span", "card__media-note", "[ imagery in production ]"));
  }
  return media;
};

// ── One project card: cover teaser + expandable case study ────────────────
const buildCard = (item, index) => {
  const card = el("article", "work-card");
  card.dataset.index = String(index);
  card.dataset.slug = item.slug;

  // Close control — sticky so it survives the study's internal scroll
  const closeWrap = el("div", "card__closebar");
  const close = el("button", "card__close");
  close.type = "button";
  close.setAttribute("aria-label", "Close case study");
  close.textContent = "×";
  closeWrap.append(close);
  card.append(closeWrap);

  // Cover — the teaser face: title + year + hook. The role and pull chip
  // belong to the expanded study; closed covers stay quiet.
  const cover = el("div", "card__cover");
  const head = el("div", "card__cover-head");
  head.append(
    el("h2", "card__title", item.title),
    el(
      "p",
      "card__meta",
      `[ ${item.year}<span class="card__meta-role"> · ${item.role}</span> ]`
    )
  );
  if (item.pull) head.append(el("p", "card__pull", item.pull));
  cover.append(head, el("p", "card__hook", item.hook), buildMedia(item, index));
  card.append(cover);

  // Bottom bar — the explicit way in
  const bar = el("div", "card__bar");
  const open = el("button", "card__open");
  open.type = "button";
  open.setAttribute("aria-label", `Open case study: ${item.title}`);
  open.innerHTML = "Open case study&nbsp;&nbsp;→";
  bar.append(
    open,
    el("span", "card__bar-hint", `<span class="hint-desktop">scroll — next project</span><span class="hint-mobile">swipe ↑ next<br>tap to open</span>`)
  );
  card.append(bar);

  // Study — a vertically scrolling editorial article, revealed on expand
  const study = el("div", "card__study");
  BEATS.forEach((beat) => {
    const section = el("section", "study__beat");
    section.append(el("p", "study__label", `${beat.num} — ${beat.label}`));
    const body = el("div", "study__body");
    body.append(el("p", "study__text", item[beat.key]));
    if (beat.stat && item.pull) {
      body.append(el("p", "study__stat", item.pull));
    }
    if (beat.media) {
      const m = buildMedia(item, index);
      m.classList.add("study__media");
      body.append(m);
    } else if (beat.key !== "outcome") {
      body.append(
        el("div", "study__slot", "[ artifact slot — process imagery to come ]")
      );
    }
    section.append(body);
    study.append(section);
  });
  const foot = el("footer", "study__foot");
  const next = el("button", "study__next");
  next.type = "button";
  const after = WORK[index + 1];
  next.innerHTML = after
    ? `Next:&nbsp;${after.title}&nbsp;&nbsp;→`
    : "To the end of the timeline&nbsp;&nbsp;→";
  foot.append(el("span", "study__foot-meta", `[ ${item.year} ]`), next);
  study.append(foot);
  card.append(study);

  return card;
};

// ── Outro — the journey ends with a door, not a wall ──────────────────────
const buildOutro = () => {
  const card = el("article", "work-card work-card--outro");
  card.dataset.index = String(WORK.length);
  const cover = el("div", "card__cover card__cover--outro");
  cover.append(
    el("p", "card__meta card__meta--outro", "[ 2000 — 2026 ]"),
    el("h2", "card__title card__title--outro", "Twenty-six years, charted."),
    el(
      "p",
      "outro__note",
      "More work is being restored from the archive — this timeline grows."
    ),
    el(
      "p",
      "outro__links",
      `<a href="/">← Back to the homepage</a><button type="button" class="outro__restart">Start over ↑</button>`
    )
  );
  card.append(cover);
  return card;
};

// Build the timeline bar: labeled end caps + one evenly spaced tick per
// project + the draggable node. The ticks read as a steady cadence rather
// than clustering by true year — the year labels still carry the real dates.
const evenPos = (i) => TICK_MIN + (i / (WORK.length - 1)) * TICK_SPAN;

const buildTimeline = (mount) => {
  mount.append(el("span", "timeline__line", ""));
  // Vertical serifs bookend the bar — a start and a finish
  mount.append(
    el("span", "timeline__end timeline__end--start", ""),
    el("span", "timeline__end timeline__end--finish", "")
  );

  const ticks = el("div", "timeline__ticks");
  WORK.forEach((item, i) => {
    const pos = evenPos(i);
    const t = el("div", "timeline__tick" + (i === 0 ? " is-active" : ""));
    t.style.left = pos.toFixed(2) + "%";
    t.dataset.index = String(i);
    t.dataset.pos = pos.toFixed(3);
    t.append(
      el("span", "timeline__tick-title", item.title),
      el("span", "timeline__tick-dot", ""),
      el("span", "timeline__tick-year", item.tick)
    );
    ticks.append(t);
  });
  mount.append(ticks);

  const node = el("div", "timeline__node");
  node.style.left = evenPos(0).toFixed(2) + "%";
  mount.append(node);
};

const buildDOM = () => {
  const deck = document.getElementById("deck");
  const timeline = document.getElementById("timeline");
  if (!deck || !timeline) return;
  // Stage — the tiltable 3D plane all cards live on
  const stage = el("div", "deck__stage");
  stage.id = "deck-stage";
  WORK.forEach((item, i) => stage.append(buildCard(item, i)));
  stage.append(buildOutro());
  deck.append(stage);
  buildTimeline(timeline);
};

const init = () => {
  buildDOM();

  // Reuse the homepage's dust-and-light background (no word cloud / title)
  const atmosphere = import("./atmosphere.js").then((m) => m.initAtmosphere());

  // Same preloader, tracking real milestones, then hand off into the deck
  runLoader([document.fonts.ready, atmosphere]).then(() => {
    import("./portfolio-deck.js").then((m) => m.initPortfolioDeck());
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
