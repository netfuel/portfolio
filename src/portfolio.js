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
      "The first hour of add-on development was mostly setup. Install Node, learn a CLI, scaffold a project, wire up a local dev server, all before writing a single line of add-on code. That is a lot to ask of someone who is only curious. The wall did not filter out weak developers. It filtered out the ones who were still deciding, and those were exactly the people Adobe needed.",
    approach:
      "I designed the whole thing for one person. Daksh is a solo developer who has already shipped Figma and Canva plugins and is deciding whether Express is worth his weekend. If it worked for him, it would work. We shipped in phases so engineering always had something real in front of developers: first a plain editor with HTML, CSS, iframe JS, and Document JS panes running live against the canvas, then Spectrum alignment and saved sessions, then cloud sessions you could share with a link, then a clean exit to the CLI once you outgrow the playground. The part I care most about is the unglamorous part. Telling you before you overwrite your own work, being honest about what autosave is doing, and getting your session back when something goes wrong. An in-app IDE only earns trust if it never loses anything.",
    work:
      "A 29-board journey told through Daksh, detailed designs for every state the playground can be in, and dev specs handed to WXP engineering. We put it in front of real developers during the Phase 2 cycle.",
    outcome:
      "The playground became the front door. It is where developers try the SDK before committing to anything, and it became the foundation we later extended to connectors and the AI code assistant. The steepest drop-off on the platform used to be environment setup. Now it is a five-minute first win.",
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
      "Learning the Document API means holding a lot in your head at once. Adobe had a CodeGen model that could help with exactly that. But a model is not a product. We needed a low-stakes way for real developers to put it to work, get something useful out of it, and send accuracy signals back to the team training it.",
    approach:
      "I kept Phase 1 narrow on purpose: find out whether the model is accurate on real tasks, and collect structured feedback while we do it. Playground integration could wait. The assistant is a chat with scaffolding. Suggested starter prompts teach the model's range and spare you the blank page. Honesty is the part I insisted on. A persistent note that AI output may be inaccurate, visible processing states, and a way to rate every single generation. If you are going to ask people to trust generated code, you have to be plain with them about what it is.",
    work:
      "An end-to-end BETA prototype covering the whole loop: prompt, generation, code applied against the live document, feedback. Updated designs with Steph Corrales, a design brief, and DACI alignment with the CodeGen engineering team.",
    outcome:
      "A working BETA that let Adobe evaluate its own code-generation model with actual add-on developers instead of internal guesses. It was also the first time I designed the thing I now work on every day: AI sitting inside a creative tool, with trust, feedback, and human control built in from the start rather than bolted on later.",
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
      "Add-ons were never going to be the whole story. Enterprises wanted their own services running inside Express: internal translation, rewriting, a custom LLM. Connectors are how that happens, wiring a service straight into the tool. The business wanted faster enterprise onboarding and a real ecosystem. My job was to make building one clear enough that a team could do it without us in the room.",
    approach:
      "The manifest already describes a connector's architecture, so I anchored the UI to it with a WYSIWYG editor instead of inventing a second mental model to keep in sync. Everything else leans on what enterprise developers already know: OAuth, API contracts, versioning, private and public listings. I built for the second hundred connectors rather than the first two, with reusable schema conventions and validation. Then I mapped the whole journey, Learn to Set Up to Build to Test to Validate to Submit, and phased it from Enterprise Alpha through Beta to GA. The companion piece is the Developer L1 panel: one launchpad in Express's primary navigation holding docs, developer tools, add-on testing, connector building, and Express MCP integrations, with progressive disclosure so a newcomer is not staring at all of it at once.",
    work:
      "Design briefs, journey maps, and detailed designs for the unified surface: mixed add-on and connector listings, playground sessions typed by integration, connector settings, publish, private-link and insights views, and the deletion and lifecycle flows that closed a gap developers had lived with for years.",
    outcome:
      "One coherent surface where add-ons, connectors, and MCP integrations sit side by side. It is the interaction backbone for Express moving from plugins that wait for a click to services and agents that act on their own.",
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
      "Adobe's developer archetypes were written before AI changed how people build. Not one of them mentioned an AI workflow, which by then was the main way many developers worked. Low-code and no-code tools had smudged the lines between the archetypes we did have, and modern realities like CI/CD, containers, and security scanning were missing altogether. Personas that are out of date are not harmless. They quietly aim your tools, your docs, and your support at people who no longer exist.",
    approach:
      "I ran this as a research program, not a survey: a review of Adobe's internal research, external benchmarks, interviews with experts and stakeholders inside the company, and interviews with third-party developers. Then I went archetype by archetype and asked what AI had changed about motivation, needs, and pain points. The answer kept pointing at someone who was not on our list. So I added a sixth archetype, the Next-Gen Developer. Early in their career, treats AI as a normal part of learning and building, and needs AI-native learning paths, explanations of generated code they can actually trust, and debugging that does not assume ten years of experience.",
    work:
      "A design brief, a deep-dive analysis deck, and a one-pager mapping all six archetypes across description, motivation, needs, pain points, and technical skill. Each persona is written in first person and annotated with what AI changed.",
    outcome:
      "A persona framework the extensibility org could actually plan against. The playground, the code assistant, connectors, and MCP all trace back to a stated AI-era need rather than a hunch. The thesis it landed on is simple: every one of these archetypes is moving toward AI-augmented development.",
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
      "New developers were not failing at the hard part. They were stalling at the beginning. Activating Dev Mode, accepting the Developer Terms of Use, creating a first listing, testing an add-on. Each one small on its own, and all of them together enough to lose people before they ever built anything. That stretch is what First Mile went after.",
    approach:
      "I scoped Phase 1 to the three moments with the most friction: Dev Mode and terms, creating the first listing, and testing. I held every decision against Adobe's Quality Framework of Useful, Usable, Modern, plus one rule of my own: answer the developer's next question before they have to ask it. Then I worked across product, DevRel, and design so the in-app path, the CLI, and the developer console feel like one continuous thing instead of three products that happen to share a login.",
    work:
      "A design brief and detailed designs for the whole path from signing in to a first successful test, across Express, developer.adobe.com, and the CLI touchpoints.",
    outcome:
      "Fewer dead ends and a shorter road to a build that works. It is the plainest version of the thing I keep arguing for: developer experience deserves the same product-grade care as anything with a marketing budget behind it.",
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
      "Adobe wanted an honest read on the add-on developer experience, end to end, and a list of what to fix in the order it should be fixed. Not impressions. Evidence.",
    approach:
      "I evaluated six areas, from the add-ons themselves through environment setup, documentation, submission, and support, against six heuristics, and scored each one on a 0 to 4 severity scale. The scale mattered more than it sounds. It forced us to say out loud which problems were worse than the others, which is the part teams usually avoid. Co-authored with design manager Shannon McCready, with the raw notes and scoring published internally next to the deck so anyone could check our work.",
    work:
      "Scored findings for every area, the highlights and the lowlights, and recommendations specific enough to act on: standardized support templates, add-on deletion, submission-status notifications, a searchable snippet repository, documentation for error scenarios, and a real process with DevRel for keeping docs current.",
    outcome:
      "The verdict was that the add-on developer experience is strong, with named gaps. That became the evidence base for everything that followed: First Mile, the investment in the playground, and the support and documentation changes. Several of the recommendations shipped in later cycles.",
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
      "People gave once, then drifted. Not because they stopped caring, but because nothing ever told them what their gift actually did. St. Jude was very good at finding new donors and quietly losing them. With demand for services still growing, the mission did not need more reach. It needed a reason to come back.",
    approach:
      "The hypothesis was simple. If we meet one-time digital donors at a few points along a loyalty journey, they will stay for the next one. So we built a product that runs quietly behind a donor's profile, showing the tangible impact of every gift through personalized stories, with incentives along the way. I chose prototype discipline over platform ambition. We tested the experiences as XD prototypes with real people, then built the simplest possible version on Adobe Experience Manager using tools the organization already owned. It ran for a full year with more than 30,000 donors, and it opted people out automatically if they stopped engaging or reached the goal they had set.",
    work:
      "Onboarding, dashboard, impact reporting, and education flows. A complete product designed, tested, and delivered inside a nonprofit's existing stack.",
    outcome:
      "Repeat donations rose 22% and the average gift grew 5%. The part that stayed with me was the feedback. Donors said they felt more valued and more connected to the mission, because for the first time they could see what their money did. Philanthropy is a relationship business. Relationships can be designed.",
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
      "St. Jude wanted to reach a younger, tech-comfortable generation, and the usual channels were not doing it. Three things had to be true at once. Donors had to see exactly where their money went, the overhead had to come down, and giving had to stay simple. Trust in blockchain had risen far enough to make a micro-donation platform worth trying.",
    approach:
      "A micro-donation site on blockchain rails. Small gifts, minimal fees, and every donation written as a transparent, immutable record a donor can follow. The mechanics are financial, so the experience could not be. We made it something you grow instead: badges for milestones, and a sequin forest that fills in as the collective gives, one donation at a time. Crypto underneath, planting something above.",
    work: "The full giving experience, from a first visit to a personal stake in a forest that belongs to everybody.",
    outcome:
      "A surge in giving from 18 to 35 year olds compared to the traditional platforms, and a sharp drop in administrative overhead. Emerging technology and philanthropy do not merely coexist. They compound.",
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
    body: "stjude.org/donate is where the mission actually gets funded, and I spent five years making that path shorter. Continuous, test-driven redesign: user testing, iteration, and a mobile-first rebuild of every step between impulse and impact. New channels followed, from crypto giving to an Amazon storefront, each one turning a modern surface into a way to fund the work.",
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
    body: "Most people will never set foot on the St. Jude campus, and presence is what turns sympathy into commitment. So we built the campus in VR with Meta. Donors walk the halls and meet the people who work there in first person. Comfort-first interaction, and narrative pacing instead of spectacle. It was featured at the Consumer Electronics Show.",
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
    body: "Nokia, FedEx, Hilton, ServiceMaster, Viking, Cellular South, First Tennessee. I led design on Viking's line of digital ranges, on the redesign of First Tennessee's online banking, and on Hilton's Android booking application, one of the first serious hotel booking apps, drawn for thumbs and small screens back when every kilobyte and every keystroke cost something. A luxury stove and a bank taught me the same lesson, and I have never stopped using it. New interfaces do not win by being new. They win by translating trust people already have.",
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
