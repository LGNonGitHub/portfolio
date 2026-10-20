"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { site, nav } from "@/lib/content";
import {
  CAST_EVENT,
  getCastPhase,
  setCastPhase,
  type CastPhase,
} from "@/lib/cast";
import { galaxy, SPIN, TILT_SQUASH, type Star } from "@/lib/galaxy";
import { invalidate, subscribe } from "@/lib/frame";

/**
 * The intro: a twin singularity. Light collapses to a point, flares, and
 * bursts out as the galaxy the hero then holds — 剣 and 杖 as its two arms.
 *
 * Nothing here is borrowed. It is assembled out of this site's own
 * vocabulary — the six section glyphs, the sword/wand duality, the grimoire
 * sigil — and every piece of it ends up somewhere real: the six glyphs fly
 * to their nav links (or into the burger on a phone), 剣 and 杖 drop into the
 * hero's duality row, the wordmark grows into the hero name and the galaxy
 * lands on the hero's at its true size and rotation. The loader does not cut to the
 * landing page; it assembles it.
 *
 * Beats: motes spiral into a single point, it flares, the galaxy throws out
 * its two arms, the six glyphs ignite around the rim, 剣 and 杖 collide at
 * the core, the name resolves, the pieces leave.
 *
 * The opening frame is server-rendered and shown by CSS from the first
 * paint (prologue.css, keyed off html[data-cast], which layout.tsx writes
 * before paint), so a first visit never flashes the nav and an empty hero.
 * Everyone else (repeat visits, other pages, reduced motion, 静) is 'done'
 * before paint and never sees it.
 *
 * Plays once per tab session. Four ways out, because a loader that can trap
 * someone is a bug: it lands, you press Skip or Escape, the watchdog fires,
 * or (if the app's JavaScript never arrives at all) the inline failsafe
 * lifts it.
 */

/** Every beat below is measured from mount, in seconds. */
const B = {
  implode: 0.2,
  flare: 1.15,
  burst: 1.3,
  glyphs: 1.65,
  duality: 2.6,
  name: 3.1,
  depart: 3.85,
} as const;

/**
 * Nothing holds the page longer than this after the navigation started,
 * whatever goes wrong. Counted from navigation rather than mount so it is a
 * promise about the page, not about when the app happened to arrive.
 */
const WATCHDOG_MS = 6500;

/** Fonts get this long to settle before the pieces are measured; a late
    swap must not strand the name at the wrong size, nor hold the cast. */
const FONT_WAIT_MS = 300;

/**
 * The flight. Same numbers as EASE_CAST and STAGGER.item in
 * src/lib/motion.ts, hard-coded until that module merges.
 */
const EASE_CAST: [number, number, number, number] = [0.65, 0, 0.35, 1];
const FLIGHT_S = 0.9;
const STAGGER_S = 0.04;

/**
 * The one exception to the watchdog: when the app mounted so late that the
 * departure would be cut off, the pieces still get the time to fly (font
 * wait, the last piece's stagger and flight, and a little slack) before
 * the watchdog may end it.
 */
const FLIGHT_BUDGET_MS = FONT_WAIT_MS + (FLIGHT_S + 10 * STAGGER_S) * 1000 + 300;

/** The fixed site header. Nav gives it the id; the bare <header> is only a
    fallback so a renamed id degrades to a working cast, not a stuck one. */
function siteHeader(): HTMLElement | null {
  return (
    document.getElementById("site-header") ??
    document.querySelector<HTMLElement>("body > header")
  );
}

/**
 * Elements the cast seals while it plays, so focus and the reading order
 * cannot wander onto a page nobody can see yet: #main, the header and the
 * footer, and every other top-level sibling of the overlay with them. The
 * three alone are not enough: Nav's "Skip to content" link sits outside the
 * header, and in testing Tab went straight from Skip to it, out of the
 * dialog. Each sealed element is marked, so unsealing only ever lifts the
 * inert this cast set.
 */
const SEALED = "data-cast-sealed";
function sealedElements(): Element[] {
  const overlay = document.querySelector("[data-preloader]");
  return Array.from(document.body.children).filter(
    (el) =>
      el.tagName !== "SCRIPT" &&
      !el.hasAttribute("data-preloader") &&
      !(overlay && el.contains(overlay)),
  );
}
function seal(on: boolean) {
  if (on) {
    sealedElements().forEach((el) => {
      if (el.hasAttribute("inert")) return;
      el.setAttribute("inert", "");
      el.setAttribute(SEALED, "");
    });
  } else {
    document.querySelectorAll(`[${SEALED}]`).forEach((el) => {
      el.removeAttribute("inert");
      el.removeAttribute(SEALED);
    });
  }
}

/**
 * Runs as it is parsed, before React has hydrated. Someone using a screen
 * reader or a keyboard who arrives during the cast should already be inside
 * the dialog: Skip focused, the page behind it inert. React cannot do that
 * until its JavaScript has arrived, which on a slow phone is seconds after
 * this frame is on screen.
 *
 * #main and the footer have not been parsed yet when this runs (the overlay
 * comes first in <body>), so sealing waits for readystatechange, which fires
 * before any DOMContentLoaded listener.
 *
 * Because Skip has focus from that first frame, it has to work from that
 * first frame too: until the app mounts, Skip and Escape lift the overlay
 * here (a plain cut, no flight). Once the app has mounted it marks the
 * overlay data-cast-live and these handlers stand aside for its own.
 *
 * It also carries the failsafe: if the app never mounts (a chunk failed to
 * load), the overlay lifts itself after 9 s, so the server-rendered page is
 * still readable rather than hidden behind a ring for good.
 */
const SEAL_SCRIPT = `(function(){
var d=document,h=d.documentElement;
if(h.dataset.cast!=='play')return;
var s=d.querySelector('[data-cast-skip]');
if(s)try{s.focus({preventScroll:true})}catch(e){}
function seal(){if(h.dataset.cast!=='play')return;var p=d.querySelector('[data-preloader]');[].forEach.call(d.body.children,function(e){if(e.tagName==='SCRIPT'||e.hasAttribute('data-preloader')||(p&&e.contains(p))||e.hasAttribute('inert'))return;e.setAttribute('inert','');e.setAttribute('data-cast-sealed','')})}
function lift(){
var p=d.querySelector('[data-preloader]');
if(h.dataset.cast==='done'||(p&&p.hasAttribute('data-cast-live')))return;
h.dataset.cast='done';
[].forEach.call(d.querySelectorAll('[data-cast-sealed]'),function(e){e.removeAttribute('inert');e.removeAttribute('data-cast-sealed')});
try{sessionStorage.setItem('preloaded','1')}catch(e){}
if(s&&d.activeElement===s)s.blur();
try{window.dispatchEvent(new CustomEvent('cast:phase',{detail:'done'}))}catch(e){}
}
if(s)s.addEventListener('click',lift);
d.addEventListener('keydown',function(e){if(e.key==='Escape')lift()});
if(d.readyState==='loading')d.addEventListener('readystatechange',seal,{once:true});else seal();
setTimeout(lift,9000);
})();`;

/** SVG space. The circle is drawn at 400×400 and scaled by its container. */
const C = 200;
const R_GLYPH = 150;

/**
 * Rounded to 3dp because all of this is now server-rendered and hydrated:
 * a raw double can serialise differently on the server and in the browser,
 * which React reports as a mismatch. A thousandth of an SVG unit is far
 * below a pixel.
 */
const r3 = (n: number) => Math.round(n * 1000) / 1000;

const vertex = (i: number, r = R_GLYPH) => {
  const a = (-90 + i * 60) * (Math.PI / 180);
  return { x: r3(C + Math.cos(a) * r), y: r3(C + Math.sin(a) * r) };
};

/** The trailing initial, which has no home on the page and fades out. */
const NAME_TAIL = site.name.slice(site.nameLines.join(" ").length);

type Flight = ReturnType<typeof animate>;

const onScreen = (r: DOMRect) =>
  r.width > 0 &&
  r.height > 0 &&
  r.bottom > 0 &&
  r.right > 0 &&
  r.top < window.innerHeight &&
  r.left < window.innerWidth;

const centre = (r: DOMRect) => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2,
});

const fontPx = (el: Element) => parseFloat(getComputedStyle(el).fontSize) || 1;

/**
 * The rect of the first run of text inside `el`: the glyphs themselves, not
 * the box around them. Boxes differ between the two ends of a flight (an
 * inline span on the page, an inline-block in the overlay, line-heights,
 * baseline alignment of a nested span); the text's content area does not,
 * so this is what the flights line up.
 */
function textRect(el: Element): DOMRect {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    return range.getBoundingClientRect();
  }
  return el.getBoundingClientRect();
}

/** Pin the transform origin on a point of the page, given in viewport
    coordinates, so a scale grows the glyphs about that point. */
const pinOrigin = (el: HTMLElement, box: DOMRect, x: number, y: number) => {
  el.style.transformOrigin = `${x - box.left}px ${y - box.top}px`;
};

const flight = (delay: number) => ({
  duration: FLIGHT_S,
  ease: EASE_CAST,
  delay,
});

/**
 * A piece that changes colour on the way takes on its home colour at the
 * pace of the field's 300 ms fade, not over the whole flight. In the light
 * theme the field turns pale in 300 ms, and a name still most of the way to
 * white at that point would cross the page nearly invisible.
 */
const recolour = (delay: number) => ({
  ...flight(delay),
  color: { duration: 0.3, ease: EASE_CAST, delay },
});

/** Opacity holds, then goes in the last `tail` of the flight. */
const fadeLate = (delay: number, tail: number) => ({
  ...flight(delay),
  opacity: { ...flight(delay), ease: "linear" as const, times: [0, 1 - tail, 1] },
});

/**
 * Measure every piece and its home, then fly them. Apart from the one
 * line-height correction up front, all the reads happen before any write,
 * so this costs two layouts, not eleven.
 *
 * Each piece records where it was sent in data-cast-to: that is what the
 * acceptance checks look at, and what a person debugging a landing needs.
 * A piece whose home is missing or off screen (a deep link scrolled the
 * hero away) fades where it is instead of flying somewhere invisible.
 */
function launch(root: HTMLElement): Flight[] {
  const q = (sel: string) => root.querySelector<HTMLElement>(sel);
  const runs: (() => Flight)[] = [];

  // The pieces that hold their size or shrink on the way get their own
  // compositor layer, so the flight moves them instead of repainting them
  // every frame. Not the name: a promoted layer keeps the resolution it was
  // rasterised at, and the name grows 2-3x, so it would land soft.
  const promote = (el: HTMLElement) => {
    el.style.willChange = "transform, opacity";
  };

  // One write before the reads. The browser rounds a font's ascent and
  // descent to whole pixels, so a fixed line-height leaves each wordmark
  // line's box up to a pixel off its glyphs, and the flight's scale turns
  // that pixel into three at the landing. Setting the line-height to the
  // measured content area makes box and glyphs the same rectangle, the same
  // as the hero's inline lines, so the landed boxes match and not only the
  // letters.
  const lines = ["name-0", "name-1"]
    .map((k) => q(`[data-cast-flight="${k}"]`))
    .filter((el): el is HTMLElement => !!el);
  const contentHeights = lines.map((el) => textRect(el).height);
  lines.forEach((el, i) => {
    el.style.lineHeight = `${contentHeights[i]}px`;
  });
  const fade = (el: HTMLElement) => {
    runs.push(() => animate(el, { opacity: 0 }, { duration: 0.3 }));
  };

  // The circle → the hero's sigil slot, centre to centre, at the slot's
  // real size (on a phone that means growing to the 112vw corner sigil,
  // not shrinking to a thumbnail). It stays flat and lands fully opaque;
  // the slot's own sigil fades in underneath it.
  const sigil = q('[data-cast-flight="sigil"]');
  if (sigil) {
    const a = sigil.getBoundingClientRect();
    const b = document
      .querySelector('[data-cast-target="sigil"]')
      ?.getBoundingClientRect();
    if (b && onScreen(b)) {
      const from = centre(a);
      const to = centre(b);
      sigil.dataset.castTo = '[data-cast-target="sigil"]';
      runs.push(() => {
        promote(sigil);
        return animate(
          sigil,
          {
            x: to.x - from.x,
            y: to.y - from.y,
            scale: b.width / a.width,
            rotateX: 0,
            opacity: 1,
          },
          flight(0),
        );
      });
    } else fade(sigil);
  }

  // The wordmark → the hero name, line by line. Top-left to top-left with
  // the origin pinned there. Scaled by the font-size ratio rather than the
  // rects' heights: the browser rounds ascent and descent to whole pixels at
  // each size, so the height ratio of 52px and 139px boxes is 1% short, and
  // across a 900px line that is a 9px miss at the far end.
  ["name-0", "name-1"].forEach((k, i) => {
    const el = q(`[data-cast-flight="${k}"]`);
    if (!el) return;
    const home = document.querySelector(`[data-cast-target="${k}"]`);
    const b = home?.getBoundingClientRect();
    if (!home || !b || !onScreen(b)) return fade(el);
    const box = el.getBoundingClientRect();
    const from = textRect(el);
    const to = textRect(home);
    const color = getComputedStyle(home).color;
    el.dataset.castTo = `[data-cast-target="${k}"]`;
    runs.push(() => {
      pinOrigin(el, box, from.left, from.top);
      return animate(
        el,
        {
          x: to.left - from.left,
          y: to.top - from.top,
          scale: fontPx(home) / fontPx(el),
          color,
        },
        recolour(i * STAGGER_S),
      );
    });
  });

  // 剣 and 杖 → the duality row, glyph centre to glyph centre.
  ["sword", "wand"].forEach((k, i) => {
    const el = q(`[data-cast-flight="${k}"]`);
    if (!el) return;
    const home = document.querySelector(`[data-cast-target="${k}"]`);
    const b = home?.getBoundingClientRect();
    if (!home || !b || !onScreen(b)) return fade(el);
    const box = el.getBoundingClientRect();
    const from = centre(textRect(el));
    const to = centre(textRect(home));
    const scale = fontPx(home) / fontPx(el);
    const color = getComputedStyle(home).color;
    el.dataset.castTo = `[data-cast-target="${k}"]`;
    runs.push(() => {
      promote(el);
      pinOrigin(el, box, from.x, from.y);
      return animate(
        el,
        { x: to.x - from.x, y: to.y - from.y, scale, color },
        recolour(i * STAGGER_S),
      );
    });
  });

  // The six glyphs → their nav links. Below lg the links are hidden, so
  // they funnel into the burger instead, shrinking as they go in.
  const header = siteHeader();
  const headerSel =
    header?.id === "site-header" ? "#site-header" : "body > header";
  const burger = header?.querySelector<HTMLElement>("button[aria-expanded]");
  nav.forEach((item, i) => {
    const el = q(`[data-cast-flight="nav-${item.href}"]`);
    if (!el) return;
    const box = el.getBoundingClientRect();
    const from = centre(textRect(el));
    const linkSel = `nav[aria-label='Primary'] a[href$='${item.href}']`;
    const link = header?.querySelector<HTMLElement>(linkSel);
    const delay = i * STAGGER_S;

    if (link && link.getBoundingClientRect().width > 0) {
      // Land on the link's own kanji when Nav shows one during the landing;
      // on the link itself otherwise.
      const jp = link.querySelector<HTMLElement>("[data-nav-jp]");
      const to = centre(jp ? textRect(jp) : link.getBoundingClientRect());
      const scale = fontPx(jp ?? link) / fontPx(el);
      el.dataset.castTo = `${headerSel} ${linkSel}`;
      runs.push(() => {
        promote(el);
        pinOrigin(el, box, from.x, from.y);
        return animate(
          el,
          { x: to.x - from.x, y: to.y - from.y, scale, opacity: [1, 1, 0] },
          fadeLate(delay, 0.2),
        );
      });
      return;
    }

    const b = burger?.getBoundingClientRect();
    if (!b || !onScreen(b)) return fade(el);
    const to = centre(b);
    el.dataset.castTo = `${headerSel} button[aria-expanded]`;
    runs.push(() => {
      promote(el);
      pinOrigin(el, box, from.x, from.y);
      return animate(
        el,
        { x: to.x - from.x, y: to.y - from.y, scale: 0.2, opacity: [1, 1, 0] },
        fadeLate(delay, 0.3),
      );
    });
  });

  return runs.map((run) => run());
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const skip = useRef<() => void>(() => {});
  // The beats are gated, not mounted: the server and the first client
  // render produce the same frozen opening frame (so hydration adopts the
  // SSR'd DOM untouched), and the beat table only starts if this tab is
  // actually casting. A repeat visit never starts ~140 animations it would
  // never show.
  const [play, setPlay] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || getCastPhase() !== "play") {
      setGone(true);
      return;
    }

    // Tells the inline failsafe that the app arrived and owns the cast now.
    root.setAttribute("data-cast-live", "");
    const html = document.documentElement;
    const timers: number[] = [];
    const flights: Flight[] = [];
    let ended = false;
    let frame = 0;
    // StrictMode mounts, unmounts and remounts in development. The cleanup
    // must undo only what this run did and leave the phase alone, so the
    // remount can start the cast again.
    let disposed = false;

    const lock = (on: boolean) => {
      seal(on);
      window.dispatchEvent(new Event(on ? "lenis:stop" : "lenis:start"));
    };

    const finish = (flown: boolean) => {
      if (ended || disposed) return;
      ended = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
      const from = getCastPhase();
      if (!flown) flights.forEach((f) => f.stop());
      // Set before the phase flips: this attribute is what keeps the overlay
      // displayed through its crossfade once html says 'done'.
      root.setAttribute(
        "data-leaving",
        flown || from === "departing" ? "pieces" : "field",
      );
      if (flown) html.classList.add("cast-flown");
      setCastPhase("done");
      lock(false);
      try {
        sessionStorage.setItem("preloaded", "1");
      } catch {
        /* private mode — it simply plays again next visit */
      }
      // Focus was parked on Skip. Leave it on the document, so the next Tab
      // starts at the top of the page (the skip link) as on any other load.
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.contains(active)) active.blur();
      window.setTimeout(() => setGone(true), 170);
    };
    skip.current = () => finish(false);

    const depart = async () => {
      if (ended || disposed || getCastPhase() !== "play") return;
      setCastPhase("departing");
      await Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        wait(FONT_WAIT_MS),
      ]);
      if (ended || disposed) return;
      // Whatever is still entering settles now, so what gets measured is
      // where it rests.
      entrances.forEach((a) => a.finish());
      const runs = launch(root);
      flights.push(...runs);
      await Promise.all(
        runs.map((f) => new Promise<void>((done) => f.then(done, done))),
      );
      finish(true);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
    };
    // Someone else (the inline failsafe) ended it.
    const onPhase = (e: Event) => {
      if ((e as CustomEvent<CastPhase>).detail === "done") finish(false);
    };

    // The entrances of everything that later flies run on the Web
    // Animations API, not framer. They are time-based in the browser's own
    // timeline, so their values are correct whenever layout is read, and
    // finish() settles them synchronously. A frame-driven framer value can
    // still be mid-entrance in the DOM on a busy phone at the moment the
    // pieces are measured, and then finish moving after the flight has
    // been computed: in testing that landed the name 18px low.
    const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
    const entrances: Animation[] = [];
    const enter = (
      el: Element | null,
      frames: Keyframe[],
      opts: KeyframeAnimationOptions,
    ) => {
      if (el) entrances.push(el.animate(frames, { fill: "both", ...opts }));
    };
    root.querySelectorAll('[data-cast-in="glyph"]').forEach((el, i) =>
      enter(
        el,
        [
          { opacity: 0, transform: "scale(0.4)" },
          { opacity: 1, transform: "scale(1.25)" },
          { opacity: 0.85, transform: "scale(1)" },
        ],
        {
          duration: 650,
          delay: (B.glyphs + 0.1 + i * 0.13) * 1000,
          easing: "ease-out",
        },
      ),
    );
    (["sword", "wand"] as const).forEach((k) =>
      enter(
        root.querySelector(`[data-cast-in="${k}"]`),
        [
          { opacity: 0, transform: `translateX(${k === "sword" ? -190 : 190}%)` },
          { opacity: 1, transform: "translateX(0)" },
        ],
        { duration: 800, delay: B.duality * 1000, easing: EASE_OUT },
      ),
    );
    enter(
      root.querySelector('[data-cast-in="name"]'),
      [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 800, delay: B.name * 1000, easing: EASE_OUT },
    );

    setPlay(true);
    lock(true);
    // Effects run child-first, so SmoothScroll may not be listening for
    // lenis:stop yet. Ask again once everything has mounted, unless the cast
    // has already ended by then: on a busy phone that frame can arrive after
    // an early Escape, and a late stop would leave the page unscrollable.
    frame = requestAnimationFrame(() => {
      if (!ended && !disposed) window.dispatchEvent(new Event("lenis:stop"));
    });
    if (document.activeElement !== skipRef.current) {
      skipRef.current?.focus({ preventScroll: true });
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(CAST_EVENT, onPhase);
    timers.push(window.setTimeout(depart, B.depart * 1000));
    timers.push(
      window.setTimeout(
        () => finish(false),
        Math.max(
          WATCHDOG_MS - performance.now(),
          B.depart * 1000 + FLIGHT_BUDGET_MS,
        ),
      ),
    );

    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(CAST_EVENT, onPhase);
      flights.forEach((f) => f.stop());
      entrances.forEach((a) => a.cancel());
      if (!ended) lock(false);
    };
  }, []);

  if (gone) return null;

  /** Animate only once the cast is confirmed; until then hold the frame. */
  const go = <T,>(target: T) => (play ? target : undefined);

  return (
    <div
      ref={rootRef}
      data-preloader
      data-lenis-prevent
      // The cast is always on black. This scopes the dark tokens to it in
      // either theme (prologue.css re-derives the accent pair).
      data-theme="dark"
      role="dialog"
      aria-modal="true"
      aria-label="Intro"
      className="fixed inset-0 z-[10000] overflow-hidden bg-[#07080c]"
    >
      <div
        aria-hidden
        data-cast-fade
        className="grid-lines absolute inset-0 opacity-[0.07]"
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[min(76vmin,620px)] w-[min(76vmin,620px)]">
          {/* The circle itself. A sibling of the glyphs, not their parent:
              each piece flies on its own, and a moving parent would carry
              its children off their measured paths. */}
          <div
            aria-hidden
            data-cast-flight="sigil"
            className="absolute inset-0 text-green"
          >
            {/* The opening frame: the singularity itself, on screen from the
                first paint and before any JavaScript (cast-core in
                prologue.css), so a first visit is never just black. */}
            <span className="cast-core absolute left-1/2 top-1/2 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />

            <Singularity play={play} />

            {/* The flash where 剣 and 杖 meet */}
            <motion.span
              className="absolute inset-0 m-auto block h-20 w-20 rounded-full bg-white blur-2xl"
              initial={{ opacity: 0, scale: 0.2 }}
              animate={go({ opacity: [0, 0.65, 0], scale: [0.2, 1.8, 2.6] })}
              transition={{
                duration: 0.9,
                delay: B.duality + 0.55,
                ease: "easeOut",
              }}
            />
          </div>

          {/* The six section glyphs igniting around the rim. This is the
              site's own navigation, cast as the circle's runes. Each sits on
              a zero-size anchor at its vertex, so it is centred there by
              layout rather than by a transform the flight would overwrite. */}
          {nav.map((item, i) => {
            const p = vertex(i);
            return (
              <span
                key={item.href}
                aria-hidden
                className="absolute flex h-0 w-0 items-center justify-center"
                style={{ left: `${r3(p.x / 4)}%`, top: `${r3(p.y / 4)}%` }}
              >
                <span
                  data-cast-flight={`nav-${item.href}`}
                  className="jp block whitespace-nowrap text-[clamp(1rem,3.4vmin,1.9rem)] leading-none text-green"
                >
                  <span
                    data-cast-in="glyph"
                    className="block"
                    style={{ opacity: 0, transform: "scale(0.4)" }}
                  >
                    {item.jp}
                  </span>
                </span>
              </span>
            );
          })}

          {/* 剣 and 杖 close on the centre and meet. The outer spans rest
              where they meet, so they measure true at the departure; the
              inner spans do the travelling in (see `entrances`). */}
          <div
            aria-hidden
            className="jp absolute inset-0 flex items-center justify-center gap-[0.6em] text-[clamp(1.6rem,6vmin,3.4rem)] leading-none"
          >
            <span data-cast-flight="sword" className="inline-block text-green">
              <span
                data-cast-in="sword"
                className="inline-block"
                style={{ opacity: 0, transform: "translateX(-190%)" }}
              >
                {site.duality.green.jp}
              </span>
            </span>
            <span data-cast-flight="wand" className="inline-block text-purple">
              <span
                data-cast-in="wand"
                className="inline-block"
                style={{ opacity: 0, transform: "translateX(190%)" }}
              >
                {site.duality.purple.jp}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Name and status sit outside the circle, so they stay put while it
          leaves. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-7 sm:px-10 sm:pb-9">
        <div className="flex items-end justify-between gap-6">
          <div
            data-cast-in="name"
            style={{ opacity: 0, transform: "translateY(18px)" }}
          >
            {/* Split so each line flies to its own line of the hero name.
                Inline-block because a transform does nothing to a plain
                inline span. The line-height is Japan Ramen's content area,
                (ascent 831 + descent 241) / 1000 from its hhea table, so
                each box is exactly its glyphs: the same box the hero's
                inline lines report, so the landed rects match, not only the
                letters. */}
            <p className="wordmark text-[clamp(1.5rem,4.6vw,3rem)] text-white">
              <span
                data-cast-flight="name-0"
                className="inline-block leading-[1.072]"
              >
                {site.nameLines[0]}
              </span>{" "}
              <span
                data-cast-flight="name-1"
                className="inline-block leading-[1.072]"
              >
                {site.nameLines[1]}
              </span>
              <span data-cast-fade>{NAME_TAIL}</span>
            </p>
            <p
              data-cast-fade
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 sm:text-[11px]"
            >
              {site.role}
            </p>
          </div>

          <div
            data-cast-fade
            className="text-right font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 sm:text-[11px]"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={go({ opacity: 1 })}
              transition={{ duration: 0.6, delay: B.name + 0.15 }}
            >
              {site.locationShort} {site.coords}
            </motion.p>
            {/* Up early, not with the name: it already has focus, and a way
                out that only appears at the end is not much of one. CSS
                fades it in from the first paint (not framer after
                hydration), and the inline script makes it work before
                hydration as well. */}
            <div className="cast-skip-in">
              <button
                ref={skipRef}
                type="button"
                data-cast-skip
                onClick={() => skip.current()}
                aria-label="Skip intro"
                className="pointer-events-auto mt-3 rounded-full border border-white/25 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/75 transition-colors hover:border-white/70 hover:text-white"
              >
                Skip ↵
              </button>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: SEAL_SCRIPT }} />
    </div>
  );
}

/**
 * The centrepiece, on a 2D canvas inside the circle's box: light spirals into
 * a point, flares, and the galaxy (src/lib/galaxy.ts) throws out its two arms.
 *
 * It replaces about a hundred framer-animated SVG and DOM nodes — the motes,
 * rings, runes and hexagram. Those cost the old intro most of its ~2.9 s of
 * long tasks in style recalc; a canvas draw never touches style or layout.
 *
 * The spin is read off the same frame clock the GL stage uses, and the disc
 * is spun and then squashed in the same order its shader does, so the galaxy
 * lands on the hero at the rotation the GL one is already showing under it.
 */
const STAR_N = 720;
const BURST_S = 1.2;
const FLARE_S = 0.45;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

function Singularity({ play }: { play: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!play || !canvas || !ctx) return;

    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let w = 1;
    const fit = () => {
      w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.width = canvas.height = w;
    };
    fit();
    window.addEventListener("resize", fit);

    // Read once, never per frame: the overlay scopes the dark accent pair.
    const css = getComputedStyle(canvas);
    const rgb = (v: string) => `rgb(${css.getPropertyValue(v).trim().split(/\s+/).join(",")})`;

    // Where each star starts its fall: a wide ring well outside the galaxy.
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    type Mote = Star & { fa: number; fd: number };
    const motes: Mote[] = galaxy(STAR_N, 11).map((st) => ({
      ...st,
      fa: rand() * Math.PI * 2,
      fd: 1.3 + rand() * 0.6,
    }));
    // One fillStyle per colour; alpha goes through globalAlpha, so a frame
    // allocates no colour strings.
    const groups: [string, Mote[]][] = [
      [rgb("--accent"), motes.filter((m) => m.arm === 0)],
      [rgb("--accent-2"), motes.filter((m) => m.arm === 1)],
      ["#ffffff", motes.filter((m) => m.arm === "core")],
    ];

    let start = 0;
    const stop = subscribe((now) => {
      // The shared loop idles 1.6 s after its last nudge; keep it awake for
      // as long as the intro is on screen.
      invalidate();
      if (!start) start = now;
      const t = (now - start) / 1000;
      const R = w * 0.47;
      const c = w / 2;
      const fall = clamp01((t - B.implode) / (B.flare - B.implode));
      const out = clamp01((t - B.burst) / BURST_S);
      const grow = 1 - (1 - out) ** 3;
      const th = -SPIN * (now / 1000);
      const cos = Math.cos(th);
      const sin = Math.sin(th);

      ctx.clearRect(0, 0, w, w);
      ctx.globalCompositeOperation = "lighter";
      for (const [fill, list] of groups) {
        ctx.fillStyle = fill;
        for (const m of list) {
          let x: number;
          let y: number;
          let a: number;
          if (t < B.flare) {
            // The fall: inward and accelerating, winding as it goes.
            const e = fall * fall;
            const ang = m.fa + e * 2.4;
            x = Math.cos(ang) * m.fd * (1 - e);
            y = Math.sin(ang) * m.fd * (1 - e);
            a = Math.min(1, fall * 3) * (0.35 + m.b * 0.4);
          } else {
            if (out <= 0) continue;
            x = m.x * grow;
            y = m.y * grow;
            a = (0.25 + m.b * 0.5) * Math.min(1, out * 2);
          }
          const px = x * cos - y * sin;
          const py = (x * sin + y * cos) * TILT_SQUASH;
          const sz = (0.9 + m.b * 1.1) * dpr;
          ctx.globalAlpha = a;
          ctx.fillRect(c + px * R - sz / 2, c + py * R - sz / 2, sz, sz);
        }
      }
      ctx.globalAlpha = 1;

      // The flare, where the point gives way.
      const fl = (t - B.flare) / FLARE_S;
      if (fl > 0 && fl < 1) {
        const g = ctx.createRadialGradient(c, c, 0, c, c, R * (0.15 + fl * 0.9));
        g.addColorStop(0, `rgba(255,255,255,${((1 - fl) * 0.95).toFixed(3)})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, w);
      }
      // The core's glow, once the arms are out.
      if (out > 0) {
        const g = ctx.createRadialGradient(c, c, 0, c, c, R * 0.22);
        g.addColorStop(0, `rgba(255,255,255,${(0.55 * Math.min(1, out * 2)).toFixed(3)})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(c - R * 0.25, c - R * 0.25, R * 0.5, R * 0.5);
      }
    });

    return () => {
      stop();
      window.removeEventListener("resize", fit);
    };
  }, [play]);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
