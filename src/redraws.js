// ──────────────────────────────────────────────────────────────────────────
// Redraws — the media bands that are diagrams rather than screenshots.
//
// Every deck page these come from is a white slide inside Adobe's rainbow
// gradient border. Shrunk to a 16:9 band they glare and their type goes
// unreadable, so the information is rebuilt here instead, in the site's own
// palette and faces. Inline SVG, not <img src="*.svg">, so the marks inherit
// --bone, --accent and the Pavilion/mono stacks from styles.css.
//
// All figures are sourced, never invented. Provenance is noted per drawing.
// Copy uses no em dashes, per the content brief.
// ──────────────────────────────────────────────────────────────────────────

const W = 1400;
const H = 787;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Greedy wrap at an approximate advance width. Mono is predictable enough that
// a per-character estimate beats measuring, and these strings never change.
const wrap = (text, maxChars) => {
  const out = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    const next = line ? line + " " + word : word;
    if (next.length > maxChars && line) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
};

const tspans = (lines, x, y, lh) =>
  lines
    .map(
      (l, i) =>
        `<tspan x="${x}" y="${(y + i * lh).toFixed(1)}">${esc(l)}</tspan>`
    )
    .join("");

const frame = (title, inner) =>
  `<svg class="rd" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}" ` +
  `preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">` +
  `<rect width="${W}" height="${H}" class="rd__ground"/>${inner}</svg>`;

const eyebrow = (text, x = 70, y = 62) =>
  `<text class="rd__eyebrow" x="${x}" y="${y}">${esc(text)}</text>`;

// ── heuristic-review a · the scorecard ────────────────────────────────────
// Source: Heuristic Review of Adobe Express Add-On Developer Experience.pdf,
// the six score pages: p14, p20, p26, p32, p39, p43. Documentation has only
// five scores in the deck; that cell is drawn as not scored rather than
// guessed at.
const HEURISTICS = [
  ["User", "control"],
  ["Consis-", "tency"],
  ["Error", "prevention"],
  ["Flexi-", "bility"],
  ["Recover", "from error"],
  ["Help and", "docs"],
];

const AREAS = [
  ["Add-ons, end-user experience", "p14", [2, 0, 2, 2, 3, 4]],
  ["Discoverability of the dev process", "p20", [0, 0, 1, 2, 2, 1]],
  ["Developer environment setup", "p26", [3, 1, 2, 2, 0, 0]],
  ["Documentation clarity", "p32", [2, 1, 2, 1, 2, null]],
  ["Submission and review", "p43", [2, 1, 2, 1, 2, 1]],
  ["Feedback and support", "p39", [2, 0, 0, 3, 3, 1]],
];

const SEVERITY = [
  "no usability problems detected",
  "cosmetic only",
  "minor or low priority",
  "major, address with priority",
  "imperative to fix before release",
];

const scorecard = () => {
  const x0 = 430;
  const cw = 136;
  const cgap = 18;
  const y0 = 172;
  const rh = 74;
  const rgap = 12;
  let s = eyebrow("HEURISTIC REVIEW · SEVERITY 0 TO 4 · SIX AREAS, SIX HEURISTICS");

  HEURISTICS.forEach((h, i) => {
    const cx = x0 + i * (cw + cgap) + cw / 2;
    s +=
      `<text class="rd__colhead" x="${cx}" y="118" text-anchor="middle">${esc(h[0])}` +
      `<tspan x="${cx}" y="134">${esc(h[1])}</tspan></text>`;
  });

  AREAS.forEach((area, r) => {
    const top = y0 + r * (rh + rgap);
    s +=
      `<text class="rd__rowhead" x="70" y="${top + 38}">${esc(area[0])}` +
      `<tspan class="rd__cite" dx="8">${esc(area[1])}</tspan></text>`;
    area[2].forEach((v, c) => {
      const x = x0 + c * (cw + cgap);
      if (v === null) {
        s +=
          `<rect class="rd__cell rd__cell--none" x="${x}" y="${top}" width="${cw}" height="${rh}" rx="2"/>` +
          `<text class="rd__cellnum rd__cellnum--none" x="${x + cw / 2}" y="${top + rh / 2 + 5}" text-anchor="middle">not scored</text>`;
      } else {
        s +=
          `<rect class="rd__cell rd__s${v}" x="${x}" y="${top}" width="${cw}" height="${rh}" rx="2"/>` +
          `<text class="rd__cellnum rd__num${v}" x="${x + cw / 2}" y="${top + rh / 2 + 8}" text-anchor="middle">${v}</text>`;
      }
    });
  });

  // legend
  let lx = 430;
  SEVERITY.forEach((label, v) => {
    s +=
      `<rect class="rd__cell rd__s${v}" x="${lx}" y="${H - 58}" width="18" height="18" rx="2"/>` +
      `<text class="rd__legend" x="${lx + 26}" y="${H - 44}">${v}</text>`;
    lx += 26 + label.length * 5.6 + 26;
  });
  s += `<text class="rd__legend" x="70" y="${H - 44}">0 none · 4 imperative</text>`;
  return frame(
    "Six developer experience areas scored against six heuristics on a 0 to 4 severity scale",
    s
  );
};

// ── heuristic-review b · the scale and the verdict ────────────────────────
// Source: same deck, p9 (severity definitions) and p49 (closing verdict).
const verdict = () => {
  let s = eyebrow("HEURISTIC REVIEW · THE VERDICT · 49 PAGES, SIX AREAS");
  s +=
    `<text class="rd__display" x="70" y="230">The state of the developer</text>` +
    `<text class="rd__display" x="70" y="300">experience for Add-ons is</text>` +
    `<text class="rd__display rd__display--accent" x="70" y="370">Strong.</text>`;
  s += `<text class="rd__body" x="70" y="424">${tspans(
    wrap(
      "Named gaps, in the order they should be fixed. Several of the recommendations shipped in later cycles.",
      52
    ),
    70,
    424,
    26
  )}</text>`;
  s += `<line class="rd__rule" x1="70" y1="520" x2="${W - 70}" y2="520"/>`;
  s += `<text class="rd__eyebrow" x="70" y="558">THE SCALE EVERY FINDING WAS HELD AGAINST</text>`;

  const bw = (W - 140 - 4 * 16) / 5;
  SEVERITY.forEach((label, v) => {
    const x = 70 + v * (bw + 16);
    s +=
      `<rect class="rd__cell rd__s${v}" x="${x}" y="590" width="${bw}" height="58" rx="2"/>` +
      `<text class="rd__cellnum rd__num${v}" x="${x + 16}" y="${590 + 38}">${v}</text>` +
      `<text class="rd__caption" y="674">${tspans(wrap(label, 24), x, 674, 20)}</text>`;
  });
  return frame("The 0 to 4 severity scale, and the review's closing verdict: Strong", s);
};

// ── personas a · six archetypes ───────────────────────────────────────────
// Source: Persona Definitions Update - Onepager.pdf, p1 to p7. First-person
// statements are the deck's own. The Adobe Confidential stamp on the source
// is not reproduced.
const ARCHETYPES = [
  [
    "Next Gen Dev",
    "I am a student or new developer leveraging AI as a foundational skill to accelerate my learning and build sophisticated projects from the start.",
    true,
  ],
  [
    "Creative Builder",
    "I am an Adobe tool power-user looking to solve inefficiencies and gaps in my workflows.",
    false,
  ],
  [
    "Indie Dev",
    "I am a hobbyist or solopreneur looking to solve a unique problem for myself or others.",
    false,
  ],
  [
    "ISV Dev",
    "My actions are driven by core business objectives, not personal ones.",
    false,
  ],
  [
    "Enterprise Dev",
    "I am an in-house developer for a larger enterprise company.",
    false,
  ],
  [
    "Consultant Dev",
    "My primary motivation is to build and deliver high-value solutions for clients.",
    false,
  ],
];

const personaGrid = () => {
  let s = eyebrow("ADOBE'S THIRD-PARTY DEVELOPER ARCHETYPES · REVISED 2025");
  const cols = 3;
  const gap = 24;
  const cardW = (W - 140 - gap * (cols - 1)) / cols;
  const cardH = 268;
  const top = 128;
  ARCHETYPES.forEach(([name, line, isNew], i) => {
    const x = 70 + (i % cols) * (cardW + gap);
    const y = top + Math.floor(i / cols) * (cardH + gap);
    s +=
      `<rect class="rd__card${isNew ? " rd__card--new" : ""}" x="${x}" y="${y}" ` +
      `width="${cardW}" height="${cardH}" rx="3"/>`;
    if (isNew) {
      s += `<text class="rd__tick" x="${x + cardW - 22}" y="${y + 34}" text-anchor="end">NEW · 2025</text>`;
    }
    s += `<text class="rd__name${isNew ? " rd__name--new" : ""}" x="${x + 24}" y="${y + 74}">${esc(name)}</text>`;
    s += `<line class="rd__rule" x1="${x + 24}" y1="${y + 100}" x2="${x + cardW - 24}" y2="${y + 100}"/>`;
    s += `<text class="rd__quote">${tspans(wrap(line, 36), x + 24, y + 134, 24)}</text>`;
  });
  return frame(
    "Six developer archetypes, with the Next Generation Developer added in 2025",
    s
  );
};

// ── personas b · what AI changed ──────────────────────────────────────────
// Source: Persona Definitions Update - Deep Dive.pdf, p5 (summary of
// recommended additions) and p7 to p8. Each row is a motivation the revision
// added. The sixth row has no left-hand cell, which is the finding.
const SHIFTS = [
  ["Creative Builder", "AI-augmented creativity and workflow automation"],
  ["Indie Dev", "AI-augmented creativity, monetizing niche AI tools"],
  ["ISV Dev", "Embedding AI as a competitive feature"],
  ["Enterprise Dev", "Secure, governable AI orchestration"],
  ["Consultant Dev", "Efficiently delivering AI solutions"],
  [null, "Rapid skill acquisition with AI as a foundational skill"],
];

const shifts = () => {
  let s = eyebrow("MOTIVATIONS · BEFORE THE REVISION AND AFTER");
  const lx = 70;
  const lw = 560;
  const rx = 700;
  const rw = W - 70 - rx;
  s += `<text class="rd__colhead" x="${lx}" y="120">ARCHETYPE AS WRITTEN</text>`;
  s += `<text class="rd__colhead rd__colhead--accent" x="${rx}" y="120">WHAT AI CHANGED</text>`;
  const top = 150;
  const rh = 88;
  SHIFTS.forEach(([name, change], i) => {
    const y = top + i * rh;
    const last = name === null;
    if (last) {
      s +=
        `<rect class="rd__empty" x="${lx}" y="${y}" width="${lw}" height="${rh - 14}" rx="2"/>` +
        `<text class="rd__missing" x="${lx + 20}" y="${y + 44}">not on the list</text>`;
      s += `<text class="rd__name rd__name--new" x="${rx}" y="${y + 40}">Next Gen Dev</text>`;
    } else {
      s += `<text class="rd__was" x="${lx}" y="${y + 40}">${esc(name)}</text>`;
    }
    s += `<text class="rd__change${last ? " rd__change--new" : ""}">${tspans(
      wrap(change, 42),
      rx,
      y + (last ? 74 : 40),
      22
    )}</text>`;
    s += `<line class="rd__rule" x1="${lx}" y1="${y + rh - 14}" x2="${W - 70}" y2="${y + rh - 14}"/>`;
  });
  return frame(
    "Motivations before and after the AI-era revision, with the sixth archetype appearing only on the right",
    s
  );
};

// ── connectors b · the journey ────────────────────────────────────────────
// Source: Connectors DevEx Design Brief.pdf, the developer journey on p3 and
// p10 and the phasing on p5. The phase track is drawn as sequence, not as a
// claim about which stations shipped in which phase.
const STATIONS = ["Learn", "Set up", "Build", "Test", "Validate", "Submit"];
const PHASES = ["Enterprise Alpha", "Enterprise Beta", "Launch · GA"];

const journey = () => {
  let s = eyebrow("SERVICE CONNECTORS · THE DEVELOPER JOURNEY");
  const x0 = 110;
  const x1 = W - 110;
  const y = 290;
  s += `<line class="rd__spine" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>`;
  const step = (x1 - x0) / (STATIONS.length - 1);
  STATIONS.forEach((name, i) => {
    const x = x0 + i * step;
    const lit = i === 0 || i === STATIONS.length - 1;
    s += `<circle class="rd__node${lit ? " rd__node--lit" : ""}" cx="${x}" cy="${y}" r="7"/>`;
    s += `<text class="rd__station" x="${x}" y="${y - 34}" text-anchor="middle">${esc(name)}</text>`;
    s += `<text class="rd__step" x="${x}" y="${y + 44}" text-anchor="middle">${String(i + 1).padStart(2, "0")}</text>`;
  });
  s += `<text class="rd__eyebrow" x="110" y="452">PHASED</text>`;
  const bw = (x1 - x0 - 2 * 18) / 3;
  PHASES.forEach((p, i) => {
    const x = x0 + i * (bw + 18);
    s +=
      `<rect class="rd__phase rd__phase--${i}" x="${x}" y="482" width="${bw}" height="52" rx="2"/>` +
      `<text class="rd__phaselabel${i === 2 ? " rd__phaselabel--dark" : ""}" x="${x + 18}" y="${514}">${esc(p)}</text>`;
  });
  s += `<text class="rd__caption">${tspans(
    wrap(
      "One surface where add-ons, connectors and MCP integrations sit side by side, built for the second hundred connectors rather than the first two.",
      74
    ),
    110,
    608,
    24
  )}</text>`;
  return frame(
    "The connector journey from Learn to Submit, phased Enterprise Alpha through GA",
    s
  );
};

// ── donor-loyalty b · the outcome ─────────────────────────────────────────
// Figures as stated in the case study: a 22 percent rise in repeat donations,
// a 5 percent larger average gift, more than 30,000 donors, one year live.
const FIGURES = [
  ["+22%", "Repeat giving", true],
  ["+5%", "Average gift", false],
  ["30,000", "Donors", false],
  ["12", "Months live", false],
];

const outcome = () => {
  let s = eyebrow("ST. JUDE DONOR LOYALTY · WHAT IT MOVED");
  const cw = (W - 140) / 4;
  FIGURES.forEach(([fig, label, lit], i) => {
    const x = 70 + i * cw;
    if (i > 0) s += `<line class="rd__rule" x1="${x}" y1="300" x2="${x}" y2="500"/>`;
    s +=
      `<text class="rd__figure${lit ? " rd__figure--accent" : ""}" x="${x + 34}" y="420">${esc(fig)}</text>` +
      `<text class="rd__eyebrow" x="${x + 34}" y="460">${esc(label.toUpperCase())}</text>`;
  });
  s += `<text class="rd__caption">${tspans(
    wrap(
      "Donors said they felt more valued and more connected to the mission, because for the first time they could see what their money did.",
      78
    ),
    70,
    620,
    26
  )}</text>`;
  return frame(
    "A 22 percent rise in repeat donations, a 5 percent larger average gift, 30,000 donors over one year",
    s
  );
};

// ── early-years a · 2000 to 2012 ──────────────────────────────────────────
// No usable capture survives from these years, so the work is set as a
// timeline rather than faked with a mock screen.
const LEADS = [
  ["2000 – 2007", "Viking", "Digital interfaces for a line of ranges"],
  ["2007 – 2009", "Hilton", "One of the first serious Android booking apps"],
  ["2009 – 2011", "First Tennessee", "Online banking, redesigned"],
];
const ROSTER = [
  "Nokia",
  "FedEx",
  "Hilton",
  "ServiceMaster",
  "Viking",
  "Cellular South",
  "First Tennessee",
];

const earlyYears = () => {
  let s = eyebrow("LOKION · SIMPLEFOCUS · THE YEARS BEFORE MOBILE FIRST WAS A STRATEGY");
  const y = 250;
  s += `<line class="rd__spine" x1="110" y1="${y}" x2="${W - 110}" y2="${y}"/>`;
  s += `<text class="rd__step" x="110" y="${y - 22}">2000</text>`;
  s += `<text class="rd__step" x="${W - 110}" y="${y - 22}" text-anchor="end">2012</text>`;
  const span = W - 220;
  LEADS.forEach(([years, client, note], i) => {
    const x = 110 + span * (0.06 + i * 0.32);
    s += `<circle class="rd__node rd__node--lit" cx="${x}" cy="${y}" r="7"/>`;
    s += `<line class="rd__rule" x1="${x}" y1="${y + 12}" x2="${x}" y2="${y + 52}"/>`;
    s += `<text class="rd__step" x="${x - 4}" y="${y + 86}">${esc(years)}</text>`;
    s += `<text class="rd__name" x="${x - 4}" y="${y + 132}">${esc(client)}</text>`;
    s += `<text class="rd__quote">${tspans(wrap(note, 26), x - 4, y + 166, 22)}</text>`;
  });
  s += `<line class="rd__rule" x1="110" y1="600" x2="${W - 110}" y2="600"/>`;
  s += `<text class="rd__eyebrow" x="110" y="640">CLIENTS</text>`;
  s += `<text class="rd__roster" x="110" y="690">${esc(ROSTER.join("   ·   "))}</text>`;
  return frame(
    "A timeline of the agency years: Viking, Hilton and First Tennessee, with the wider client roster",
    s
  );
};

// ── registry ──────────────────────────────────────────────────────────────
export const REDRAWS = {
  "heuristic-review:a": scorecard,
  "heuristic-review:b": verdict,
  "personas:a": personaGrid,
  "personas:b": shifts,
  "connectors:b": journey,
  "donor-loyalty:b": outcome,
  "early-years:a": earlyYears,
};

export const redraw = (slug, slot) => {
  const build = REDRAWS[slug + ":" + slot];
  return build ? build() : null;
};
