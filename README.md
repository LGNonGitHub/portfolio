# Mohammed Mishal — Portfolio

A design-engineer portfolio built with Next.js 15, TypeScript, Tailwind CSS and
Framer Motion. Dark-first, motion-heavy, and accessible by default.

The visual language is drawn from five anime — *My Hero Academia*, *Black
Clover*, *Sword Art Online*, *Fragrant Flower Blooms with Dignity* and
*Wistoria: Wand and Sword* — interpreted as an original system rather than fan
art. No character imagery, no logos, nothing lifted: the sigils are generated
geometry, the petals are drawn to canvas, and the palette is two colours.

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

Redeploy and the route starts delivering. Without them the form still succeeds,
so the UI is never broken in a fresh deploy.

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
- An Influences section crediting all five series in the open

**Motion and interaction**
- Flow-field particle canvas in the hero that reacts to the pointer
- Session-scoped preloader with a counter and panel wipe
- Two-part custom cursor with per-element states (`data-cursor-state`)
- Momentum scrolling via Lenis, with eased in-page anchors
- Magnetic buttons, 3D tilt cards with specular glare
- Masked line reveals, character-staggered headlines, scroll-driven word highlighting
- Scroll-linked progress bar and animated timeline spine
- Seamless CSS marquees, animated counters, layout-animated project filter

**Structure**
- Hero · Work · About · Stack · Process · Path · Testimonials · Influences · Contact
- Expandable project case studies with focus trap and scroll lock
- Working contact form with validation, rate limiting and a honeypot
- Dark/light theme with no flash of the wrong palette on load
- Konami code (`↑↑↓↓←→←→BA`) toggles "Plus Ultra" wireframe mode

**Technical**
- Generated Open Graph image and favicon via `next/og`
- `sitemap.xml`, `robots.txt`, JSON-LD `Person` schema
- Security headers set in `next.config.mjs`
- ~170 kB first-load JS

---

## Accessibility

This was checked, not assumed:

- `prefers-reduced-motion` is honoured throughout — smooth scroll, the particle
  canvas, the cursor, the preloader and every reveal stand down, and the content
  renders in its final state rather than disappearing
- Single `h1`, no heading-level jumps
- All interactive elements have accessible names; all inputs have labels
- Visible focus rings, a skip link, and Escape/Tab handling in the dialog
- Custom cursor and hover effects disable themselves on touch devices
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
│   ├── layout/                # Nav, Footer, Preloader, Cursor, ScrollProgress
│   ├── providers/             # Theme, SmoothScroll
│   ├── sections/              # the nine page sections
│   └── ui/                    # Magnetic, Tilt, TextReveal, FlowField, …
├── hooks/                     # useMediaQuery, useMounted
└── lib/
    ├── content.ts             # ← all site content
    └── utils.ts
```

---

## Licence

Code is MIT. The written content, project descriptions and personal details are
not — please don't redeploy this as your own portfolio.
