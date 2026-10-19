/**
 * The director: what the stage is doing, frame by frame.
 *
 * It runs inside frame.subscribe, so it shares the one ticker with Lenis and
 * reads the same scroll value the DOM was laid out against — never a frame
 * behind. It owns no GL; it hands the engine a plain DrawState.
 *
 * Its job is to keep the sigil standing where the page says it should: on the
 * hero's slot at the top, then on each section header's slot as that section
 * takes the centre line, so the formation reads as the ground the printed
 * plate was summoned on.
 */
import type { DrawState, Stage } from '@/lib/gl/engine';
import { quiet } from '@/lib/gl/quality';
import * as frame from '@/lib/frame';
import { BG, pairFor, type RGB } from '@/lib/palettes';
import { runtime, SECTION_IDS, type SectionId } from '@/lib/runtime';

const EASE_CAST = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const MORPH_MS = 1400;
// The one-time arrival. 1.2 s is long enough to read as motes GATHERING and
// short enough that nobody waits for the hero to finish assembling.
const IGNITE_MS = 1200;
const COLOUR_MS = 700;

/** The formation index for a section; the prologue wears the hero sigil. */
const indexOf = (id: SectionId) => Math.max(0, SECTION_IDS.indexOf(id));

/** Where each section's formation stands. */
function anchorFor(id: SectionId): DOMRect | null {
  const root = id === 'prologue' ? '#top' : `#${id}`;
  const slots = document.querySelectorAll<HTMLElement>(`${root} [data-stage-slot]`);
  for (const el of Array.from(slots)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  const header = document.querySelector<HTMLElement>(`${root} header`);
  const r = header?.getBoundingClientRect();
  if (r && r.width > 0) return r;
  return null;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRGB = (a: RGB, b: RGB, t: number): [number, number, number] => [
  lerp(a[0], b[0], t) / 255,
  lerp(a[1], b[1], t) / 255,
  lerp(a[2], b[2], t) / 255,
];

export function startDirector(stage: Stage, canvas: HTMLCanvasElement) {
  const root = document.documentElement;
  let from = indexOf(runtime.get().section);
  let to = from;
  let mix = 1;
  let morphStart = 0;
  let igniteStart = 0;
  let ready = false;

  // Colour is lerped on its own 700 ms timeline; getComputedStyle is never
  // called per frame (that is what made the old petals run a section behind).
  let fromPair = pairFor(runtime.get().theme, runtime.get().section, runtime.get().accent);
  let toPair = fromPair;
  let colourStart = 0;

  // Geometry is sampled once per frame from the live rects. The anchors are
  // few and the reads happen before any write, so this is one layout flush.
  let offX = 0.42;
  let offY = 0.02;
  let scale = 1.05;

  function syncColours() {
    const s = runtime.get();
    const next = pairFor(s.theme, s.section, s.accent);
    if (next[0] !== toPair[0] || next[1] !== toPair[1]) {
      fromPair = toPair;
      toPair = next;
      colourStart = performance.now();
    }
  }

  function syncSection() {
    const id = runtime.get().section;
    const want = indexOf(id);
    if (want !== to) {
      from = to;
      to = want;
      mix = 0;
      morphStart = performance.now();
    }
    if (ready) root.setAttribute('data-stage', id === 'prologue' ? 'hero' : id);
  }

  const unsubRuntime = runtime.subscribe(() => {
    syncSection();
    syncColours();
    root.setAttribute(
      'data-stage-mode',
      runtime.get().theme === 'dark' ? 'glow' : 'ink',
    );
    frame.invalidate();
    wake();
  });

  // Lite tier and quiet modes render on demand only, so an idle phone spends
  // nothing. activeUntil is pushed forward by scroll, resize and morphs.
  let dead = false;
  let activeUntil = performance.now() + 1200;
  // Skipping the draw is not enough: frame.ts keeps its rAF loop alive for as
  // long as it has a subscriber, so a director that stays subscribed holds the
  // whole site's ticker at 60 fps on a phone that is doing nothing. Going idle
  // means UNSUBSCRIBING, and scroll/resize/morph subscribe us back.
  let stop: (() => void) | null = null;
  const park = () => {
    stop?.();
    stop = null;
  };
  const resume = () => {
    if (!stop && !dead) stop = frame.subscribe(tick);
  };
  const wake = () => {
    activeUntil = performance.now() + 600;
    resume();
  };
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake);

  const lost = (e: Event) => {
    // Give the page back to the DOM fallbacks rather than a dead canvas.
    // `dead` latches: without it the next tick's `if (!ready)` branch simply
    // re-adds html.gl and the visitor is left staring at a blank canvas that
    // the CSS still believes is painting.
    e.preventDefault();
    dead = true;
    root.classList.remove('gl');
    root.removeAttribute('data-stage');
    root.removeAttribute('data-stage-tier');
    root.removeAttribute('data-stage-mode');
    ready = false;
    park();
  };
  canvas.addEventListener('webglcontextlost', lost);

  // The clamp has to follow the COPY, not the box that holds it. A text
  // column is as wide as its container while the lines inside fill only part
  // of it, so clamping container rects darkened the sigil everywhere beside
  // the text too. A Range over an element's contents measures the line boxes
  // themselves; their union is the ink, and that is all we need to protect.
  const INK_PAD = 10; // px — descenders, focus rings, the odd hanging glyph
  const range = typeof document === 'undefined' ? null : document.createRange();

  function inkRect(el: HTMLElement): DOMRect {
    const box = el.getBoundingClientRect();
    if (!range) return box;
    try {
      range.selectNodeContents(el);
      const lines = range.getClientRects();
      let l = Infinity;
      let t = Infinity;
      let r = -Infinity;
      let b = -Infinity;
      for (let i = 0; i < lines.length; i++) {
        const q = lines[i];
        if (q.width < 1 || q.height < 1) continue;
        if (q.left < l) l = q.left;
        if (q.top < t) t = q.top;
        if (q.right > r) r = q.right;
        if (q.bottom > b) b = q.bottom;
      }
      // Replaced content — an SVG plate, a canvas — reports no line boxes at
      // all. Those elements still need their whole box kept clear.
      if (l === Infinity) return box;
      const x = Math.max(box.left, l - INK_PAD);
      const y = Math.max(box.top, t - INK_PAD);
      const x2 = Math.min(box.right, r + INK_PAD);
      const y2 = Math.min(box.bottom, b + INK_PAD);
      return new DOMRect(x, y, Math.max(0, x2 - x), Math.max(0, y2 - y));
    } catch {
      return box;
    }
  }

  function collectAvoid(vw: number, vh: number, dpr: number) {
    const avoid: number[] = [];
    const soft: number[] = [];
    const els = document.querySelectorAll<HTMLElement>('[data-stage-avoid]');
    for (const el of Array.from(els)) {
      if (avoid.length >= 64) break;
      const r = inkRect(el);
      if (r.bottom < -40 || r.top > vh + 40 || r.width <= 0) continue;
      avoid.push(r.left * dpr, r.top * dpr, r.right * dpr, r.bottom * dpr);
      soft.push(el.getAttribute('data-stage-avoid') === 'soft' ? 1 : 0);
    }
    return { avoid, soft };
  }

  function tick(time: number) {
    if (dead) return;
    const now = performance.now();
    const still = quiet();
    // The gate is a TIME bound, not `mix >= 1`: a morph that never quite
    // settles (an ambient lerp still chasing, a formation slice landing late)
    // would otherwise hold the whole site's ticker open on a phone forever.
    const morphing = now - morphStart < MORPH_MS + 120;
    if (stage.tier === 'lite' && !still && now > activeUntil && !morphing) {
      park();
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dpr = canvas.width / Math.max(1, vw);

    if (mix < 1) {
      const raw = Math.min(1, (now - morphStart) / (still ? 250 : MORPH_MS));
      mix = EASE_CAST(raw);
      if (raw >= 1) mix = 1;
      wake();
    }

    // Stand the formation on its slot: centred, with a radius of 0.62 of the
    // slot's diagonal, so the sigil is as wide as the thing it belongs to.
    const rect = anchorFor(SECTION_IDS[to]) ?? anchorFor(SECTION_IDS[from]);
    let targetX = 0.42;
    let targetY = 0.02;
    let targetScale = 1.05;
    let ambient = 0;
    if (rect) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = (cx / vw) * 2 - 1;
      targetY = -((cy / vh) * 2 - 1);
      const radius = 0.62 * Math.hypot(rect.width, rect.height) * 0.5;
      targetScale = radius / (vh / 2) / 0.5;
      // Ambient: away from the anchor the body drifts apart into a field.
      const pad = vh * 0.25;
      const visible =
        Math.max(0, Math.min(rect.bottom, vh + pad) - Math.max(rect.top, -pad)) /
        Math.max(1, rect.height);
      ambient = 1 - Math.min(1, visible);
    } else {
      ambient = 0.6;
    }
    // A hero dolly without a pin: the first scroll flies through the sigil's
    // hollow core into Work, instead of the sigil simply scrolling away.
    if (to === 0 && !still) {
      const hero = document.getElementById('top');
      const h = hero?.offsetHeight || vh;
      const p = Math.min(1, Math.max(0, frame.scrollY() / (h * 0.9)));
      targetScale *= 1 + p * 2.2;
    }
    const k = still ? 1 : 0.12;
    offX = lerp(offX, targetX, k);
    offY = lerp(offY, targetY, k);
    scale = lerp(scale, targetScale, k);

    // Ignite: the stage used to simply appear the instant the cast handed
    // over. It arrives now — the motes are already scattered across the field
    // and gather into the hero formation. This reuses the ambient spread the
    // shader draws between sections (p is mixed toward a hashed field and the
    // brightness drops with it), so an arrival costs no extra uniform and no
    // second path through the vertex program: ambient is held at 1 and
    // released. First mount only, and never under 静 or reduced motion, where
    // the sigil is simply there.
    if (igniteStart === 0) igniteStart = now;
    if (!still) {
      const ig = (now - igniteStart) / IGNITE_MS;
      if (ig < 1) {
        ambient = Math.max(ambient, 1 - EASE_CAST(Math.max(0, ig)));
        wake();
      }
    }

    const ct = Math.min(1, colourStart ? (now - colourStart) / COLOUR_MS : 1);
    const theme = runtime.get().theme;
    const bg = BG[theme];
    const { avoid, soft } = collectAvoid(vw, vh, dpr);

    const s: DrawState = {
      from,
      to,
      mix,
      offset: [offX, offY],
      scale,
      // Under reduced motion or 静 the clock stands still: no swarm, no spin,
      // and a static grain hash.
      time: still ? 10 : time / 1000,
      ambient,
      fall: to === 6 && !still ? 1 : 0,
      swarm: still ? 0 : 1,
      grain: 1,
      ink: theme === 'light' ? 1 : 0,
      bg: [bg[0] / 255, bg[1] / 255, bg[2] / 255],
      c1: mixRGB(fromPair[0], toPair[0], ct),
      c2: mixRGB(fromPair[1], toPair[1], ct),
      avoid,
      avoidSoft: soft,
    };
    stage.draw(s);

    if (!ready) {
      ready = true;
      root.classList.add('gl');
      root.setAttribute('data-stage-tier', stage.tier);
      root.setAttribute('data-stage-mode', theme === 'dark' ? 'glow' : 'ink');
      syncSection();
    }
  }

  stop = frame.subscribe(tick);
  syncSection();

  return () => {
    park();
    unsubRuntime();
    window.removeEventListener('scroll', wake);
    window.removeEventListener('resize', wake);
    canvas.removeEventListener('webglcontextlost', lost);
    root.classList.remove('gl');
    root.removeAttribute('data-stage');
    root.removeAttribute('data-stage-tier');
    root.removeAttribute('data-stage-mode');
  };
}
