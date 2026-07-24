import "./styles.css";
import { runLoader } from "./loader.js";

// ──────────────────────────────────────────────────────────────────────────
// Content — a scroll of pinned panels, present to past. Each panel is one of:
//   intro      · the cover statement
//   study      · a full case study (Context / Approach / The work / Outcome)
//   condensed  · a single-body card
//   index      · an "also shipped" list
//   outro      · closing statement + contact
// `year` is the big readout the left rail shows while a panel is active;
// `tick` is the short label on that panel's rail node. `img` = null draws a
// generative placeholder. Copy uses no em dashes, per the content brief.
// ──────────────────────────────────────────────────────────────────────────
const PANELS = [
  {
    kind: "intro",
    slug: "top",
    tick: "now",
    year: "2000 – 2026",
    era: "",
    title: "Selected work, present to past.",
    hook: "Senior Experience Designer building the places where humans and AI systems meet: developer platforms, agentic extensibility, and generative tools at Adobe.",
    body: "Twenty-five years of shipped work. Scroll to travel it, or jump from the timeline on the left.",
  },

  // ── Adobe · Extensibility · 2023 – Present ──────────────────────────────
  {
    kind: "study",
    slug: "playground",
    chapter: "Adobe",
    tick: "2025",
    year: "2024 – 2025",
    title: "In-App Add-on Playground",
    meta: "Adobe Express · Design lead · 4 shipped phases",
    chip: "zero-setup coding, inside the tool",
    hook: "What if trying a platform's APIs took zero setup? A full code playground, living inside the design tool itself.",
    context:
      "Developers exploring Adobe Express add-ons faced a heavy first step: install Node and a CLI, scaffold a project, and wire up a local dev server, all before writing a single line of add-on code. That setup wall filtered out exactly the developers Adobe most wanted: the curious, the evaluating, the not-yet-committed.",
    approach:
      "I anchored the work in a persona-driven journey around Daksh, a solo indie developer evaluating Express, then phased delivery so engineering could ship value continuously. Phase 1 was an in-app editor with HTML, CSS, iframe JS, and Document JS panes running against the live canvas. Later phases added Spectrum alignment, session persistence, cloud sessions with shareable links and moderation, and finally export to a CLI-compatible add-on. Throughout, I designed the safety rails that make an in-app IDE trustworthy: destructive-action confirmations, autosave disclosures, and session recovery.",
    work:
      "A full narrative journey map told through the Daksh persona, a 29-board deck, detailed designs for every playground state, and dev-spec handoffs to WXP engineering, with user testing in the Phase 2 cycle.",
    outcome:
      "The playground became the centerpiece of Express's developer surface, the experiment-with-the-SDK front door, and the foundation later extended to connectors and the AI code assistant. It turns the platform's steepest dropout point, environment setup, into a five-minute first win.",
    note: "Artifacts on file: Playground Journey (29 boards), Phase 2, Cloud Storage brief, Design Brief.",
    img: null,
  },
  {
    kind: "study",
    slug: "quickstart",
    chapter: "Adobe",
    tick: "2024",
    year: "2024",
    title: "Project QuickStart",
    meta: "Adobe Express · Design lead · shipped as BETA",
    chip: "an AI pair-programmer for add-ons",
    hook: "An AI pair-programmer for add-on development, designed to earn trust, not just generate code.",
    context:
      "Developers building Express add-ons have to learn many facets of the Document API at once. Adobe had a CodeGen model that could help, but a model is not a product. The team needed a low-stakes, friendly way for real developers to exercise the model, get value from it, and feed accuracy signals back to the model team.",
    approach:
      "I framed Phase 1 tightly: test the model's accuracy on real tasks and harvest structured feedback, with playground integration deferred. I designed the assistant as a chat-with-scaffolding experience, with suggested starter prompts that teach the model's range while lowering the blank-page barrier. Honesty was built into the surface: a persistent disclosure that AI output may be inaccurate, visible processing states, and inline feedback on every generation.",
    work:
      "An end-to-end BETA prototype covering the full loop, prompt to generation to code applied against the live document to feedback, with updated designs (with Steph Corrales), a design brief, and DACI alignment with the CodeGen engineering team.",
    outcome:
      "A working BETA that let Adobe evaluate its code-generation model with actual add-on developers, and an early, concrete instance of the pattern I now work on daily: AI assistance embedded in a creative tool, with trust, feedback, and human control designed in from the start.",
    note: "Artifacts on file: QuickStart Design Brief, QuickStart Designs (62 pages).",
    img: null,
  },
  {
    kind: "study",
    slug: "connectors",
    chapter: "Adobe",
    tick: "2025",
    year: "2024 – 2025",
    title: "Service Connectors & the Developer Panel",
    meta: "Adobe Express · Design lead · Enterprise Alpha to GA",
    chip: "extensibility beyond add-ons",
    hook: "Extensibility beyond add-ons: designing how enterprises plug their own AI services directly into Express.",
    context:
      "As web extensibility grew past add-ons, Express introduced connectors: service-level integrations that let enterprise developers wire internal translation, rewriting, or custom-LLM services directly into the tool. The goal was to accelerate enterprise onboarding and grow a scalable ecosystem. The design problem was to make building one clear, self-serve, and low-friction.",
    approach:
      "Manifest-driven and API-first: the manifest defines the connector's architecture, so the UI anchors to it with a WYSIWYG editor rather than inventing a parallel mental model. I leaned on workflows enterprise developers already know, OAuth, API contracts, versioning, and private and public listings, and built for scale with reusable schema conventions and validation. I mapped the full journey from Learn to Submit and phased it Alpha to Beta to GA. I also designed the companion Developer L1 panel: a unified launchpad consolidating docs, developer tools, add-on testing, connector building, and Express MCP integrations, with progressive disclosure and an extensible card pattern.",
    work:
      "Design briefs, journey maps, and detailed designs for the unified surface: mixed add-on and connector listings, playground sessions typed by integration, connector settings, publish, private-link and insights views, and the deletion and lifecycle flows that closed a long-standing gap.",
    outcome:
      "A single, coherent developer surface where add-ons, connectors, and MCP integrations live side by side: the interaction backbone for Express's move from plugins that wait for clicks to service- and agent-level extensibility.",
    note: "Artifacts on file: Connectors DevEx Design Brief, Detailed Designs.",
    img: null,
  },
  {
    kind: "study",
    slug: "personas",
    chapter: "Adobe",
    tick: "2025",
    year: "2025",
    title: "Persona Definitions for the AI Era",
    meta: "Adobe Developer Experience · Research & design lead",
    chip: "a sixth archetype: the Next-Gen Developer",
    hook: "AI did not just change the tools developers use. It changed who developers are. The persona system had to catch up.",
    context:
      "Adobe's foundational developer archetypes predated the AI shift. None of them mentioned AI workflows, now a primary driver of how people build. Low-code and no-code platforms had blurred the lines between archetypes, and modern deployment needs like CI/CD, containers, and security scanning were missing entirely. Outdated personas meant misaligned tools, resources, and support.",
    approach:
      "I ran a research program combining an internal Adobe research review, external benchmarks, expert and stakeholder interviews, and third-party developer interviews. I analyzed the AI-driven shift per archetype: how it transformed motivation, needs, and pain points. Then I defined a new sixth archetype, the Next-Gen Developer: an early-career coder who treats AI as core to how they learn and build, and who needs AI-native learning pathways, trustworthy explanations of generated code, and beginner-friendly debugging.",
    work:
      "A design brief, a deep-dive analysis deck, and a shareable one-pager mapping all six archetypes across description, motivation, needs, pain points, and technical skill. Each persona is written in first person and annotated with its AI-era additions.",
    outcome:
      "A persona framework the extensibility org could actually plan against. Tooling and roadmap decisions, playground, code assistant, connectors, and MCP, now trace to explicit AI-era developer needs. The work names its thesis: a universal shift toward AI-augmented development.",
    note: "Artifacts on file: Persona Definitions Update, Deep Dive, One-pager.",
    img: null,
  },
  {
    kind: "study",
    slug: "first-mile",
    chapter: "Adobe",
    tick: "2025",
    year: "2025",
    title: "First Mile: The Developer's First Hour",
    meta: "Adobe Express · Design lead",
    chip: "metric: time-to-first-build",
    hook: "The first successful build is a design problem. Time-to-first-build is the metric that matters.",
    context:
      "Many new developers stalled at the very start: activating Dev Mode, accepting Developer Terms of Use, creating a first add-on listing, and testing it were each small hurdles. Together they slowed the learning curve enough to lose people. First Mile targeted exactly that stretch of the journey.",
    approach:
      "I scoped Phase 1 to the three highest-friction moments: Dev Mode activation and terms acceptance, first listing creation, and add-on testing. Every decision was grounded in the Adobe Quality Framework of Useful, Usable, Modern, with the goal of answering the developer's next question before it is asked. I coordinated across product, DevRel, and design, aligning the in-app experience with the CLI flow and developer console so the first local run feels continuous with the in-app surface.",
    work:
      "A design brief and detailed designs covering the sign-in-to-first-test path across Express, developer.adobe.com, and the CLI touchpoints.",
    outcome:
      "A first-mile journey with fewer dead ends and a faster path to a working build: the concrete, current expression of a simple thesis, that developer experience deserves product-grade care.",
    note: "Artifacts on file: First Mile Dev Journey, Design Brief, Designs.",
    img: null,
  },
  {
    kind: "study",
    slug: "heuristic-review",
    chapter: "Adobe",
    tick: "2024",
    year: "2024",
    title: "Heuristic Review of the Add-on DX",
    meta: "Adobe Express · Co-lead · 49-page evaluation",
    chip: "measure before you redesign",
    hook: "Before redesigning anything, measure it. A systematic usability audit of an entire developer platform.",
    context:
      "Adobe needed an honest read on the usability and effectiveness of the end-to-end add-on developer experience, and a prioritized, actionable list of what to fix.",
    approach:
      "I evaluated six areas, from existing add-ons through environment setup, documentation, submission, and support, against six heuristics, scored on a 0 to 4 severity scale to force prioritization. Co-authored with design manager Shannon McCready, with raw notes and scoring published internally alongside the deck.",
    work:
      "Scored findings per area, highlights and lowlights, and concrete recommendations: standardized support templates, add-on deletion, submission-status notifications, a searchable code-snippet repository, error-scenario docs, and formalized documentation processes with DevRel.",
    outcome:
      "The verdict, that the add-on developer experience is strong, with specific gaps, became the evidence base for the roadmap that followed: First Mile, playground investment, and support and documentation changes. Several recommendations shipped in later cycles.",
    note: "Artifacts on file: Heuristic Review of Adobe Express Add-On DX (49 pages).",
    img: null,
  },
  {
    kind: "index",
    slug: "adobe-more",
    chapter: "Adobe",
    tick: "2024",
    year: "2024 – 2025",
    title: "Also shipped at Adobe",
    meta: "Adobe Developer Experience",
    items: [
      {
        title: "Vision Sprint 2025",
        note: "Vision lead, with Steph Corrales, for the org's sprint on the future of AI-powered developer experience: export-to-CLI, multi-session cloud storage, deep-linked playground, and the agentic threads connecting playground, assistant, connectors, and MCP.",
      },
      {
        title: "Docs IA & Landing Revamp",
        note: "Restructured developer.adobe.com's information architecture and landing experience with DevRel, with tailored paths for beginner and advanced developers.",
      },
      {
        title: "Add-on UX Guidelines Framework",
        note: "A scalable framework for developer-facing UX guidelines, migrated from Adobe XD to developer.adobe.com, with a competitive audit of Miro, Slack, Canva, and Apple.",
      },
      {
        title: "Firefly + Creative Cloud APIs Microsite",
        note: "A Phase-1 marketing and landing experience for the bundled APIs: definitions, business value, use-case buckets, code samples, and lead-gen, shipped for the Summit moment.",
      },
      {
        title: "Project Dragonfly",
        note: "A live demo of Firefly APIs for Adobe Summit decision-makers: localize campaigns, personalize assets, accelerate merchandising. Generative AI made tangible for a C-suite audience.",
      },
      {
        title: "Horizon Portal",
        note: "A framework for information-rich views in Adobe's internal engineering platform: customizable widgets, standardized tables and detail views, and real-time state for deployments and incidents.",
      },
    ],
    img: null,
  },

  // ── ALSAC / St. Jude · 2012 – 2023 ──────────────────────────────────────
  {
    kind: "study",
    slug: "donor-loyalty",
    chapter: "St. Jude",
    tick: "2022",
    year: "2022 – 2023",
    title: "St. Jude Donor Loyalty",
    meta: "ALSAC / St. Jude · Lead design",
    chip: "+22% repeat giving · +5% average gift",
    hook: "Repeat donors were quietly slipping away from a $2.2B mission. The fix was not louder asks. It was a product.",
    context:
      "St. Jude recognized a decline in repeat donor numbers over the years. Despite a large initial donor pool, retaining contributors and encouraging consistent gifts was proving a challenge. With growing demand for services, the mission needed loyalty, not just reach.",
    approach:
      "The hypothesis: engaging one-time digital donors at points within a loyalty journey would produce a positive experience and prolonged engagement. The solution was a product that runs quietly behind a donor's profile, surfacing the tangible impact of every gift through personalized stories and offering incentives as they participate. Prototype discipline over platform ambition: experiences tested as XD prototypes with real users, then built in the simplest form on Adobe Experience Manager using tools the organization already had. Tested over a full year with 30,000-plus donors, with automatic opt-out for those who did not engage or reached a preset goal.",
    work:
      "Onboarding, dashboard, impact reporting, and education flows: a complete product designed, tested, and delivered inside a nonprofit's existing stack.",
    outcome:
      "Repeat donations rose 22% and the average gift grew 5%. Donors reported feeling more valued, more connected to the mission, and more aware of the impact of their gifts. The program underscored that philanthropy is a relationship business, and that relationships can be designed.",
    img: "/images/work/loyalty.webp",
  },
  {
    kind: "study",
    slug: "sequin-forest",
    chapter: "St. Jude",
    tick: "2021",
    year: "2021 – 2022",
    title: "Sequin Forest",
    meta: "ALSAC / St. Jude · Ideation, UX/UI",
    chip: "a surge in donors aged 18 to 35",
    hook: "Younger donors, transparent giving, lower overhead. Blockchain rails offered all three, if the experience could feel human instead of financial.",
    context:
      "St. Jude was seeking new ways to fundraise with a younger, tech-savvy generation. The challenges: ensure transparency in how donations are used, reduce transactional overhead, and simplify the process. Rising trust in blockchain made a micro-donation platform viable.",
    approach:
      "A micro-donation website powered by blockchain: small contributions with minimal fees, every donation recorded as a transparent, immutable transaction donors can track. Gamification made it engaging, with badges for milestones and a growing sequin forest that visualizes collective impact, one donation at a time. Crypto mechanics, designed to feel like planting something that grows.",
    work: "The full giving experience, from first visit to a personal stake in the collective forest.",
    outcome:
      "A surge in donations from the 18 to 35 age group compared to traditional platforms, and drastically reduced administrative overhead. Proof that emerging tech and philanthropy compound each other.",
    img: "/images/work/sequin-forest.webp",
  },
  {
    kind: "condensed",
    slug: "donation-experience",
    chapter: "St. Jude",
    tick: "2018",
    year: "2018 – 2023",
    title: "The St. Jude Donation Experience",
    meta: "ALSAC / St. Jude · User testing, UX/UI, development",
    chip: "$2.2B mission · five years of iteration",
    hook: "The most important form in childhood cancer, refined for five years.",
    body: "Five years of continuous, test-driven redesign of stjude.org/donate: user testing, iteration, and a mobile-first rebuild of every step between impulse and impact. New channels followed, from crypto giving to an Amazon merch storefront, each one turning a modern surface into a way to fund the mission.",
    img: "/images/work/donation.webp",
  },
  {
    kind: "condensed",
    slug: "hall-of-heroes",
    chapter: "St. Jude",
    tick: "2020",
    year: "2019 – 2021",
    title: "Hall of Heroes VR",
    meta: "ALSAC / St. Jude · Ideation, UX design",
    chip: "featured at CES · built with Meta",
    hook: "Walk the halls of St. Jude from anywhere on Earth.",
    body: "An immersive VR campus experience built in conjunction with Meta: donors walk the hospital's halls and meet its heroes in first person. Comfort-first interaction, narrative pacing over spectacle. Featured at the Consumer Electronics Show.",
    img: "/images/work/hall-of-heroes.webp",
  },
  {
    kind: "index",
    slug: "stjude-more",
    chapter: "St. Jude",
    tick: "2015",
    year: "2012 – 2023",
    title: "Also at St. Jude",
    meta: "Innovation practice",
    items: [
      {
        title: "St. Jude Virtual Tour",
        note: "Ideation, UI and UX design, and user testing for a virtual walk through the campus most donors will never visit.",
      },
      {
        title: "St. Jude Amazon Merch",
        note: "Design, ideation, and implementation of a branded merchandise storefront: a low-cost way to develop Amazon as a fundraising platform.",
      },
      {
        title: "This Shirt Saves Lives Vending Machine",
        note: "Ideation, UX and UI design, and build for a physical vending machine that turns a t-shirt into a monthly donor commitment.",
      },
      {
        title: "Immersive Storytelling initiative",
        note: "Kicked off the innovation program that grew into the VR, AR, and IoT practice behind Hall of Heroes and the Virtual Tour.",
      },
    ],
    img: null,
  },

  // ── The agency years · 2000 – 2012 ──────────────────────────────────────
  {
    kind: "condensed",
    slug: "early-years",
    chapter: "Early",
    tick: "2000",
    year: "2000 – 2012",
    title: "The Early Years",
    meta: "Lokion, SimpleFocus, Hilton · Lead design",
    chip: "new interfaces win by translating trust",
    hook: "Agency work in the years before mobile-first was a strategy.",
    body: "Design for Nokia, FedEx, Hilton, ServiceMaster, Viking, Cellular South, and First Tennessee. Lead design on Viking's line of digital ranges, on the redesign of First Tennessee's online banking, and on Hilton's Android booking application, one of the era's first major hotel booking apps, drawn for thumbs and small screens when every kilobyte and keystroke cost something. The through-line held: new interfaces win by translating the trust people already have.",
    img: null,
  },

  {
    kind: "outro",
    slug: "end",
    tick: "now",
    year: "Today",
    era: "Now",
    title: "Users at the center.",
    hook: "I believe that by putting users at the center of the design and development process, products become more effective, more efficient, and more delightful to use.",
    email: "m@ttladner.co",
  },
];

// ── Small DOM helper ──────────────────────────────────────────────────────
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

// ── Generative placeholder — a seeded contour field, in the site language ──
// Deterministic per slug so the art is stable between visits; reads as art
// direction, not absence, until real imagery lands.
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

const placeholderSVG = (slug, label) => {
  const rnd = seededRandom(slug);
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
    `<text x="46" y="430" font-family="Pavilion, Georgia, serif" font-size="220" fill="rgba(232,227,214,0.06)">${label}</text>` +
    `<g class="ph__drift">${rings}</g>${dust}</svg>`
  );
};

// Media band, 16:9, interspersed in the reading flow. Slot "a" shows the real
// image when there is one; other slots always draw a generative placeholder.
const buildMedia = (panel, slot = "a") => {
  const media = el("figure", "panel__media");
  if (slot === "a" && panel.img) {
    const img = document.createElement("img");
    img.src = panel.img;
    img.alt = `${panel.title}, project imagery`;
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;
    media.append(img);
  } else {
    media.classList.add("panel__media--ph");
    const seed = slot === "a" ? panel.slug : `${panel.slug}-${slot}`;
    media.innerHTML = placeholderSVG(seed, panel.tick);
    media.append(el("figcaption", "panel__media-note", "[ imagery in production ]"));
  }
  return media;
};

// ── Beats of a case study ─────────────────────────────────────────────────
const BEATS = [
  ["context", "Context"],
  ["approach", "Approach"],
  ["work", "The work"],
  ["outcome", "Outcome"],
];

const buildHead = (panel) => {
  const head = el("header", "panel__head");
  if (panel.meta) head.append(el("p", "panel__eyebrow", panel.meta));
  head.append(el("h2", "panel__title", panel.title));
  if (panel.hook) head.append(el("p", "panel__hook", panel.hook));
  return head;
};

const CHAPTER_LABEL = {
  Adobe: "Adobe · Extensibility",
  "St. Jude": "ALSAC / St. Jude",
  Early: "Agency years",
};

const buildPanel = (panel, index) => {
  const section = el("section", `panel panel--${panel.kind}`);
  section.dataset.index = String(index);
  section.dataset.slug = panel.slug;
  section.dataset.year = panel.year || "";
  section.dataset.era = panel.era || CHAPTER_LABEL[panel.chapter] || "";
  section.id = "p-" + panel.slug;
  const inner = el("div", "panel__inner");

  if (panel.kind === "intro") {
    inner.classList.add("panel__inner--center");
    const head = el("header", "panel__head");
    head.append(
      el("h2", "panel__title panel__title--display", panel.title),
      el("p", "panel__hook panel__hook--lead", panel.hook)
    );
    if (panel.body) head.append(el("p", "panel__body", panel.body));
    inner.append(head);
    section.append(inner);
    return section;
  }

  if (panel.kind === "outro") {
    inner.classList.add("panel__inner--center");
    const head = el("header", "panel__head");
    head.append(
      el("h2", "panel__title panel__title--display", panel.title),
      el("p", "panel__hook panel__hook--lead", panel.hook)
    );
    const contact = el("div", "outro__contact");
    const mail = el("a", "outro__mail", panel.email);
    mail.href = "mailto:" + panel.email;
    contact.append(mail);
    const links = el("nav", "outro__links");
    links.innerHTML =
      '<a href="/cv.html">Read the CV</a>' +
      '<a href="https://www.linkedin.com/in/mattladner/" target="_blank" rel="noreferrer noopener">LinkedIn</a>' +
      '<a href="https://mattladner.medium.com/" target="_blank" rel="noreferrer noopener">Writing</a>' +
      '<a href="/">Home</a>';
    contact.append(links);
    head.append(contact);
    inner.append(head);
    section.append(inner);
    return section;
  }

  // study / condensed / index are light cards; media is woven through the text
  inner.classList.add("panel__card");
  inner.append(buildHead(panel));

  if (panel.kind === "study") {
    const mkBeat = (key, label) => {
      if (!panel[key]) return null;
      const beat = el("div", "beat");
      beat.append(
        el("p", "beat__label", label),
        el("p", "beat__text", panel[key])
      );
      return beat;
    };
    const context = mkBeat("context", "Context");
    const approach = mkBeat("approach", "Approach");
    const work = mkBeat("work", "The work");
    const outcome = mkBeat("outcome", "Outcome");
    if (context) inner.append(context);
    inner.append(buildMedia(panel, "a"));
    if (approach) inner.append(approach);
    if (work) inner.append(work);
    inner.append(buildMedia(panel, "b"));
    if (outcome) inner.append(outcome);
    if (panel.note) inner.append(el("p", "panel__note", panel.note));
  } else if (panel.kind === "condensed") {
    inner.append(el("p", "panel__lead", panel.body), buildMedia(panel, "a"));
  } else if (panel.kind === "index") {
    const ul = el("ul", "panel__index");
    panel.items.forEach((it) => {
      const li = el("li", "index-item");
      li.append(
        el("h3", "index-item__title", it.title),
        el("p", "index-item__note", it.note)
      );
      ul.append(li);
    });
    inner.append(ul);
  }

  section.append(inner);
  return section;
};

// ── Left timeline rail: readout + one node per panel + moving marker ───────
const buildRail = (mount) => {
  const readout = el("div", "rail__readout");
  readout.append(el("span", "rail__era", PANELS[0].era || ""));

  const line = el("div", "rail__line");
  line.append(el("span", "rail__serif rail__serif--top"));
  line.append(el("span", "rail__serif rail__serif--bottom"));
  const marker = el("span", "rail__marker");
  line.append(marker);

  const nodes = el("div", "rail__nodes");
  const n = PANELS.length;
  PANELS.forEach((panel, i) => {
    const node = el("button", "rail__node" + (i === 0 ? " is-active" : ""));
    node.type = "button";
    node.dataset.index = String(i);
    node.style.top = ((i / (n - 1)) * 100).toFixed(3) + "%";
    node.setAttribute("aria-label", panel.title);
    node.append(el("span", "rail__dot"));
    nodes.append(node);
  });
  line.append(nodes);

  mount.append(readout, line);
};

const buildDOM = () => {
  const panels = document.getElementById("panels");
  const rail = document.getElementById("rail");
  if (!panels || !rail) return;
  PANELS.forEach((panel, i) => panels.append(buildPanel(panel, i)));
  buildRail(rail);
};

const init = () => {
  buildDOM();

  // Reuse the homepage's dust-and-light background (no word cloud / title)
  const atmosphere = import("./atmosphere.js").then((m) => m.initAtmosphere());

  // Same preloader, tracking real milestones, then hand off into the scroll
  runLoader([document.fonts.ready, atmosphere]).then(() => {
    import("./portfolio-scroll.js").then((m) => m.initPortfolioScroll());
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export { PANELS };
