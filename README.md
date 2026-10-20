# Mohammed Mishal — Portfolio

A design-engineer portfolio built with Next.js 15, TypeScript, Tailwind CSS and
Framer Motion. Dark-first, motion-heavy, and accessible by default.

The visual language is built on a green/purple duality — craft and magic, 剣 and
杖 — with generated sigils, a dual-stream particle field and drifting petals.
Every mark is original geometry: no borrowed artwork, no logos.

![Next.js](https://img.shields.io/badge/Next.js-15.5-000) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run audit` | The budget and accessibility gates (see [Budgets & audit](#budgets--audit)) |

---

## Making it yours

**Everything editable lives in one file: [`src/lib/content.ts`](src/lib/content.ts).**

It is currently filled with realistic placeholder content. Every line that needs
your real information is marked with a `// TODO` comment. Work through them and
the whole site updates — no component changes needed.

| What | Where in `content.ts` |
| --- | --- |
| Name, role, email, location, domain | `site` |
| Social links | `socials` |
| Nav items | `nav` |
| Hero statement + stat counters | `intro` |
| Scrolling ticker words | `marqueeWords` |
| Projects and case studies | `projects` |
| Skill groups and levels | `skillGroups` |
| Education, roles, awards | `timeline` |
| Working process | `process` |
| Quotes | `testimonials` |

Two blocks of copy live outside that file because they are prose, not data:

- `src/components/sections/About.tsx` — the three "about" paragraphs
- `src/components/sections/Contact.tsx` — the contact blurb

### Project artwork

Projects currently render **generative SVG artwork** derived from each project's
`palette`, rather than screenshots. When you have real images, drop them in
`public/` and swap `<ProjectArtwork />` for `next/image` inside
`src/components/sections/Projects.tsx` — the card layout does not care which it
gets.

### Colours — the duality system

Green and purple are the organising idea, not decoration. **Green carries craft
and design (剣, sword); purple carries magic and code (杖, wand).** The switch in
the nav swaps which one leads — and because every component reads `--accent` and
`--accent-2` rather than a fixed hue, the swap costs nothing.

Defined in `src/app/globals.css` as space-separated RGB channels, so Tailwind
can apply opacity to them:

```css
--green:  60 214 140;   /* dark theme */
--purple: 162 118 255;
--accent:   var(--green);    /* flipped by [data-accent='purple'] */
--accent-2: var(--purple);
```

That gives four combinations — dark/light × green-led/purple-led — and all four
are checked. If you change `--faint`, `--muted`, `--green` or `--purple`,
re-check contrast in **all four**, not just the one you were looking at.

| Token | Dark | Light |
| --- | --- | --- |
| `--muted` | 7.26:1 | 7.15:1 |
| `--faint` | 5.20:1 | 4.94:1 |
| accent text | 10.73:1 (green) / 6.30:1 (purple) | 5.64:1 |

> One gotcha worth knowing: the colour is registered in `tailwind.config.ts`
> under **both** `accent2` and `accent-2`. Tailwind will silently emit nothing
> for an unregistered name, so `text-accent-2` would just inherit — which is
> exactly the bug that shipped and had to be caught by auditing the computed
> colours rather than by eye.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. At [vercel.com/new](https://vercel.com/new), import the repository.
3. Accept the defaults — Vercel detects Next.js automatically. No build config
   or environment variables are required for a first deploy.
4. Deploy. Every push to `main` ships to production; every other branch gets a
   preview URL.

Afterwards, update `site.url` in `src/lib/content.ts` to your real domain so the
Open Graph tags, `sitemap.xml` and `robots.txt` point at the right place.

### Contact form delivery (optional)

The form at `/api/contact` validates, rate-limits and honeypots submissions out
of the box, but it only **logs** them until a mail provider is configured. To
actually receive mail, add two environment variables in your Vercel project
(Settings → Environment Variables):

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | An API key from [resend.com](https://resend.com) (free tier is enough) |
| `CONTACT_TO_EMAIL` | The address that should receive enquiries |

Redeploy and the route starts delivering. Without them the route answers `503`
with `{ fallback: 'mailto' }`, and the form says so and offers a pre-filled
email instead. It never reports a message as sent when it was not; the audit's
`honesty` gate checks exactly that.

---

## What's in here

**The theme**
- Generated magic circles (`MagicCircle`) — concentric rings, a counter-rotating
  glyph band and an inscribed star polygon, all derived from a seed
- Dual-stream mana field: pointer-reactive particles in both accent colours
- Drifting petals rendered to canvas, deliberately sparse
- `剣 / 杖` duality switch that repaints the whole site live
- "Link Start" preloader with a boot sequence and a summoning circle
- Section headers paired with Japanese labels (作品 / 紹介 / 魔法 / 軌跡 / 連絡)
- Projects framed as a grimoire; skills as mana gauges; the timeline as a tower
  ascent with floor numbers
- The Hobby ending credits replaced the old `Influences` section; its component
  is gone, but the `influences` export in `src/lib/content.ts` is still there
  and unused.

**Motion and interaction**
- Flow-field particle canvas in the hero that reacts to the pointer
- Session-scoped preloader with a counter and panel wipe
- Momentum scrolling via Lenis, with eased in-page anchors
- Magnetic buttons, 3D tilt cards with specular glare
- Masked line reveals, character-staggered headlines, scroll-driven word highlighting
- A segmented episode bar (one gauge per section, in its own colours) and an
  animated timeline spine
- Seamless CSS marquees, animated counters, layout-animated project filter

**Structure**
- Hero · Work · About · Stack · Process · Path · Testimonials · Contact
- Expandable project case studies with focus trap and scroll lock
- Working contact form with validation, rate limiting and a honeypot
- Dark/light theme with no flash of the wrong palette on load
- Konami code (`↑↑↓↓←→←→BA`) toggles a wireframe mode

**Technical**
- Generated Open Graph image and favicon via `next/og`
- `sitemap.xml`, `robots.txt`, JSON-LD `Person` schema
- Security headers set in `next.config.mjs`
- ~202 kB first-load JS on `/` (103 kB of it shared) — the `js-initial` gate
  measures transferred bytes on mobile, which is the number with a budget

---

## One heartbeat

Everything that reacts to scroll, section, theme or motion reads from three
small, React-free modules. Before them, three components ran their own
section observers, three clocks ticked at 1 Hz, Lenis ran its own frame loop
and two canvases polled `<html>` with `getComputedStyle`, measured running a
palette behind.

| Module | What it owns |
| --- | --- |
| `src/lib/runtime.ts` | The store: `{ section, theme, accent, motion }`. `runtime.get/set/subscribe`, the one shared IST clock (`subscribeClock`), and `detectTier()`, which picks `'lite'` once per visit for slow devices. React reads it through `useRuntime(selector)` and `useClock()` in `src/hooks/useRuntime.ts`. |
| `src/lib/frame.ts` | The only `requestAnimationFrame` loop. Lenis advances first, then every subscriber, with `dt` clamped to 50 ms. `subscribe`, `invalidate`, `scrollY`, `velocity`, `scrollTo` (which also hands keyboard focus to the target). |
| `src/lib/palettes.ts` | Every section's colour pair as data, `pairFor()` and `washHex()`. The CSS copies live in `globals.css` (fixed chrome) and `src/styles/palettes.css` (per-section subtrees). |
| `src/lib/motion.ts` | The motion language: `EASE_OUT`, `EASE_CAST`, `EASE_SPRING`, `DUR`, `STAGGER`. |
| `src/lib/transition.ts` | `withTransition()`: the theme toggle opens as a circle and the 剣/杖 switch as a slash or a bloom, through View Transitions. |

**Palettes per subtree.** `html[data-section]` names the one section under the
viewport's centre line, and only the fixed chrome (nav, telemetry, scrollbar,
selection) follows it, crossfading over 700 ms. A section that puts
`data-palette="work"` (or `about`, `stack`, `path`, `hobby`, `contact`,
`prologue`) on its root always shows its own pair, wherever it is on screen.

**Motion levels.** `html[data-motion]` is absent for `full`, `lite` on devices
`detectTier()` judged slow, and `still` when the visitor pressed **静** in the
nav (remembered in `localStorage`). Under `still` every CSS animation is
paused, Lenis is not created, framer runs with `reducedMotion="always"`,
`useReducedMotion()` returns `true` and the frame loop goes idle, painting one
frame per real change. `prefers-reduced-motion` gets the same treatment.

### Rules for anything that moves

- One WebGL context on the whole site. Device pixel ratio capped at 1.5.
- Pause when the tab is hidden. Fall back to the SVG version on
  `webglcontextlost`.
- Animate on time, not frames: use the `dt` the frame ticker hands you, so a
  120 Hz screen does not run twice as fast.
- Every continuous loop registers with `frame.ts` (`subscribe`). No private
  `requestAnimationFrame` loops; no `getComputedStyle` per frame (read
  `palettes.ts` and the runtime store instead).
- No above-the-fold text is server-rendered at `opacity: 0`; LCP must not wait
  for hydration.
- Scroll-linked effects write `transform` and `opacity` only.
- Overlays are dialogs: `role="dialog"`, `aria-modal`, the page behind made
  `inert`, focus moved in on open and returned to the opener on close.

---

## Budgets & audit

`scripts/audit.mjs` turns the site's promises into gates that fail. It drives
Chromium through Playwright, writes `.audit/report.json` and exits `1` if any
gate fails.

```bash
npm run build
npm run audit -- --serve                  # starts `next start -p 3123` from .next, audits, stops it
npm run audit                             # against a server already on :3000 (or $BASE_URL)
npm run audit -- --only=keyboard,axe      # a subset; a name ending in -skip is listed as skipped
npm run audit -- --serve --shots          # also every section x theme x viewport x motion as PNGs in .audit/shots/
```

It never runs `next build` itself, so it always measures exactly the build
you made. With `--serve` the server runs with no mail provider configured and
is stopped on exit — as its own process group on POSIX, via `taskkill /T` on
Windows, which has no process groups and used to leave the server holding the
port after the run.

Four of these are **ratchets, not goals**: they are set to what the build
costs today so a regression trips them, and the number worth reaching is in
the target column. Tighten one whenever a change earns it; never loosen one to
make a run green.

| Gate | Budget | Target | Before Season One |
| --- | --- | --- | --- |
| `lcp-mobile` | LCP <= 4000 ms at 390x844, 4x CPU, 1.6 Mbps / 150 ms, `?gl=0`, fastest of 3 | 2500 ms | 5404 ms |
| `cls` | Cumulative layout shift <= 0.05 | — | 0.0028 |
| `longtasks` | Long-task time after FCP <= 5200 ms (`?gl=0`) | 600 ms | 2352 ms |
| `js-initial` | JS transferred before `load` on mobile <= 240 KB | 200 KB | 191 KB |
| `no-three` | No script containing `three.module` or `WebGLRenderer` | — | — |
| `stage-size` | The chunk marked `__MANA_STAGE__` <= 12 KB encoded (skipped while absent) | — | — |
| `fonts` | Font bytes over a full mobile scroll <= 195 KB | 180 KB | ~253 KB |
| `axe` | axe-core 4.14.0: zero serious or critical violations, each section at centre, both themes | — | — |
| `console` | No console error or page error on the mobile runs — a hydration mismatch is one | — | — |
| `still-idle` | Under 静 and under reduced motion: no running infinite animation, <= 2 rAF callbacks in 2 s | — | — |
| `keyboard` | First Tab is the skip link and Enter lands in `#main`; clicking the Stack link focuses `#stack` | — | — |
| `resilience` | Aborting the PipelineBench or mana-stage chunk never shows "Application error" | — | — |
| `honesty` | `POST /api/contact` with no mail provider never answers `delivered: true` | — | — |
| `palette-parity` | Every pair in `globals.css` and `palettes.css` equals `src/lib/palettes.ts` | — | — |

The timing gates run with `?gl=0` and gate main-thread work, because the
headless browser renders WebGL in software (SwiftShader), which inflates
GPU-bound numbers. Treat GPU timings from it as relative, not absolute.

They also take the **fastest** of the three runs, not the median. These are
measured on whatever machine you are sitting at, and anything else running on
it lands in the numbers — one set of three came back [23703, 6005, 3762] ms of
long tasks for a build whose quiet cost is about 3.8 s. The fastest run is the
one that came closest to measuring the page instead of the laptop, and it
repeats: 3029 and 2943 ms LCP across two back-to-back audits, where the median
swung 3655 to 14090. It reads low rather than high, so treat a failure as real
and a pass as "no worse than this".

**Run the timing gates on their own.** A full suite drives browsers across
fourteen gates while `lcp-mobile` and `longtasks` are trying to measure, and
they pick up the contention: the same build measured 3029 ms / 3276 ms alone
and 6512 ms / 10686 ms inside a full run. The ratchets are set above the spread
isolated runs actually show (LCP: 2389, 2943, 3029, 3745 ms), so judge those
two from:

```bash
npm run audit -- --serve --only=lcp-mobile,longtasks,cls
```

A full run is still the right thing for everything else; just read a timing
failure there as "the laptop was busy" until an isolated run agrees.

Why the three gaps are open: `longtasks` is style recalc and layout, not the
bundle — about 6.5 s of the main thread, of which the intro is ~2.9 s, and the
floor with every animation disabled is still ~3.7 s for a 2400-node, 18000px
page. `js-initial` is framer-motion, Lenis and the preloader. `fonts` is six
families, and 18.3 KB of it is one Bricolage subset pulled in by `₹` and the
macrons in Kōhei / Yūki / Ōmori — correct typography, not waste. None of the
three closes without giving up the single-page design.

The audit needs Playwright, which is deliberately NOT a dependency: its
postinstall downloads a Chromium build, and that would run on every Vercel
deploy for a tool only the audit uses. Install it when you want to run the
gates:

```bash
npm i -D playwright && npx playwright install chromium
```

Playwright is resolved from the project if installed, otherwise from
`/opt/node-tools`. axe-core is a dev dependency.

---

## Accessibility

This was checked, not assumed:

- `prefers-reduced-motion` is honoured throughout — smooth scroll, the particle
  canvas, the cursor, the preloader and every reveal stand down, and the content
  renders in its final state rather than disappearing
- Single `h1`, no heading-level jumps
- All interactive elements have accessible names; all inputs have labels
- Visible focus rings, plus a keyboard-only focus reticle (four corner brackets
  in the section's colour) that never follows the pointer
- A skip link that really moves focus into the page, and in-page anchors that
  hand focus to the section they scroll to
- Escape/Tab handling in the dialogs; the mobile menu is a modal dialog with
  the page behind it made `inert`
- **静 Stillness** in the nav (and in the mobile menu) pauses every ambient
  loop on the site, for anyone who wants it, whatever their OS setting
- Hover effects disable themselves on touch devices
- Text contrast meets WCAG AA in all four theme/accent combinations
- The Japanese labels are decorative and `aria-hidden`; the English label stays
  in the accessibility tree

Under reduced motion the petal canvas is not rendered at all, the sigils stop
rotating, and the smooth-scroll hijack is skipped entirely.

Re-check these if you change colours or add sections.

---

## Project structure

```
src/
├── app/
│   ├── api/contact/route.ts   # form endpoint
│   ├── layout.tsx             # fonts, metadata, providers, theme script
│   ├── page.tsx               # section order
│   ├── globals.css            # design tokens + base styles
│   ├── opengraph-image.tsx    # generated OG card
│   └── icon.tsx, sitemap.ts, robots.ts, not-found.tsx
├── components/
│   ├── layout/                # Nav, Footer, Preloader, ScrollProgress, Telemetry
│   ├── providers/             # Theme, SmoothScroll, SectionTheme, ThemeColor
│   ├── sections/              # the nine page sections
│   └── ui/                    # Magnetic, Tilt, TextReveal, FlowField, …
├── hooks/                     # useMediaQuery, useMounted, useRuntime
├── styles/palettes.css        # per-section palettes, 静, view transitions, focus reticle
└── lib/
    ├── content.ts             # ← all site content
    ├── runtime.ts, frame.ts   # the store and the one frame loop
    ├── palettes.ts, motion.ts, transition.ts
    └── utils.ts
scripts/audit.mjs              # budgets & accessibility gates (npm run audit)
```

---

## Licence

Code is MIT. The written content, project descriptions and personal details are
not — please don't redeploy this as your own portfolio.
