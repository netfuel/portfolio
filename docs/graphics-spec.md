# Portfolio graphics

What fills every media band in `src/portfolio.js`, where it came from, and how
the treatment works. Built 2026-09-17. No placeholders remain.

Site language: background `#08080A`, bone `#E8E3D6`, accent `#D3E74F`, Pavilion
serif display, Space Mono body. Bands are 16:9, `border-radius: 3px`, full
column width. No em dashes in any caption or alt text.

---

## 1. Three treatments

**T1 · Night screen.** A real capture, grayscale at 74% brightness under a 16%
accent wash, returning to untouched colour over 700ms while its panel owns the
viewport centre. The page stays quiet and the design lights up exactly when you
are reading about it. The treatment is entirely CSS, so the source images stay
honest and can be swapped without redoing artwork.

```css
.panel__media--shot img { filter: grayscale(1) contrast(1.08) brightness(0.74); }
.panel__media--shot::after { background: var(--accent); mix-blend-mode: color; opacity: 0.16; }
.panel.is-active .panel__media--shot img { filter: none; }
.panel.is-active .panel__media--shot::after { opacity: 0; }
```

`setActive()` in `portfolio-scroll.js` now toggles `is-active` on the panel as
well as the rail node. Reduced motion drops the transition, not the reveal, and
`.is-static` shows everything in full colour.

**T2 · Board wall.** Many boards from one deck tiled small and dimmed, one lit.
Used once, where the story is volume.

**T3 · Redraw.** Diagrams rebuilt as inline SVG in `src/redraws.js`. Inline, not
`<img src="*.svg">`, so the marks inherit `--bone`, `--accent` and the font
stacks from `styles.css`. Redraws are never filtered by T1.

Why redraw at all: the source decks are white slides inside Adobe's rainbow
gradient border. Shrunk to a 16:9 band they glare, and their type goes
unreadable.

---

## 2. What is in each slot

| Slot | Kind | Source |
| --- | --- | --- |
| `playground:a` | capture | Playground Cloud Storage Designs, p10 |
| `playground:b` | board wall | Playground Journey, all 29 boards, Daksh lit |
| `quickstart:a` | capture | QuickStart Designs, p27 |
| `quickstart:b` | capture | QuickStart Designs, p53 and p56 |
| `connectors:a` | capture | Connectors Detailed Designs, p1 |
| `connectors:b` | redraw | Connectors Design Brief, p3, p5, p10 |
| `personas:a` | redraw | Personas Onepager, p1 to p7 |
| `personas:b` | redraw | Personas Deep Dive, p5, p7, p8 |
| `first-mile:a` | capture | First Mile Designs, p5 |
| `first-mile:b` | capture | First Mile Designs, p2, p3, p9 |
| `heuristic-review:a` | redraw | Heuristic Review, p14, 20, 26, 32, 39, 43 |
| `heuristic-review:b` | redraw | Heuristic Review, p9 and p49 |
| `donor-loyalty:b` | redraw | Figures from the case study copy |
| `sequin-forest:b` | capture | Pre-Adobe portfolio deck, p25 |
| `early-years:a` | redraw | No capture survives, set as a timeline |

The four St. Jude images that were already on the site (`loyalty`,
`sequin-forest`, `donation`, `hall-of-heroes`) keep their files and now take the
T1 treatment, which is what pulls the older work into the same system.

Composites use a shared rule: where a source is already close to 16:9 it runs
full bleed, and where it is not it sits on the near-black ground inside a
hairline, so mixed aspect ratios never fight each other in the scroll.

Two redraws carry the argument rather than illustrating it:
`heuristic-review:a` collects six score slides scattered through a 49-page deck
into one 6 by 6 matrix, and `personas:b` sets the five original archetypes
against what AI changed, with the sixth row's left-hand cell empty, which is
the finding.

---

## 3. Code

- `src/redraws.js` · new. Seven drawings, a registry keyed `slug:slot`, and a
  `redraw(slug, slot)` lookup. Every figure is sourced in a comment above its
  data.
- `src/portfolio.js` · panels now carry `media: { a, b }` instead of a single
  `img`. `buildMedia()` resolves a slot in order: redraw, then capture, then the
  generative contour placeholder, which stays in the codebase so a future empty
  slot still looks deliberate. An `ALT` map carries real alt text per slot.
- `src/portfolio-scroll.js` · the active panel lights its own media.
- `src/styles.css` · the reveal, and the redraw type scale.
- `public/images/work/` · eight new webp files at 1400px. 644KB for all twelve.

To replace a capture, drop a new `.jpg` into `public/images/work` and run
`node scripts/optimize-images.mjs`, which already covers that directory at
1400px and q78.

---

## 4. Still open

**Two source questions.** The Heuristic Review deck has only five scores for
Documentation on p32, so that cell is drawn as not scored rather than guessed
at. The titles on p39 and p43 also look swapped against the sections they sit
in. Both are worth resolving before the scorecard goes public, since a
published matrix invites exactly that kind of reading.

**The index panels.** `adobe-more` and `stjude-more` render no media at all,
which leaves six one-line projects with no picture as the weakest stretch of the
scroll. There is material for all six on disk:

| Item | Source | Page |
| --- | --- | --- |
| Vision Sprint 2025 | Vision Sprint 2025 Design Brief | p1 |
| Docs IA and landing revamp | Docs IA landing page revamp Design Brief | p2 or p3 |
| Add-on UX Guidelines Framework | UX Guidelines Framework Audit | any audit page |
| Firefly + CC APIs Microsite | FF + CC APIs Microsite Design Brief | p2 |
| Project Dragonfly | Project Dragonfly Designs | p5 or p16 |
| Horizon Portal | Horizon Portal Comps | any dashboard comp |

A six-up thumbnail strip above the list, T1 treated, with the thumb matching the
hovered row coming to full colour. Small change to `buildPanel`'s `index`
branch. Dragonfly p5 and p16 are the most visually alive frames in the whole
folder: generated product placements and a live API console.

**Confidentiality.** The Persona deep dive carries an "Adobe Confidential" stamp
on p1. Nothing from that page is reproduced, and the persona redraws use the
one-pager's public-facing first-person statements. Worth a second pass on any
future crop from that deck.

**The build.** `npm run build` could not be run from this session: reading files
in the repo over the desktop bridge fails with a filesystem error on some paths,
including `package.json`. Every change was verified by rendering the drawings
and the treated captures in a headless browser and by a harness that resolves
every panel slot, but the Vite build itself has not been exercised.
