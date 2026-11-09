"use client";

import { useEffect, useRef, useState } from "react";
import { getCastPhase, setCastPhase } from "@/lib/cast";

/**
 * The build: the page is assembled in front of the visitor by a small crew
 * of design-tool cursors.
 *
 * A first visit opens on an empty field. The crew scans it, drags out a
 * wireframe for everything in the hero, then types the content in while a
 * counter keeps score. After that the page is live, and each section below
 * is built the same way as it scrolls into view.
 *
 * How it stays honest:
 *
 *  - The real page is always in the DOM. A layer is only ever hidden by
 *    opacity (so it keeps its place in the reading order and the
 *    accessibility tree), and only after this component has tagged it, so
 *    if the script never arrives nothing is hidden at all.
 *  - Nothing can stay hidden. A layer that waits too long, is scrolled past,
 *    receives focus, or is caught by a resize is simply shown. Skip, Escape,
 *    the counter pill, 静 and a watchdog all end the build at once.
 *  - It reuses the cast phase (src/lib/cast.ts): 'play' while the field is
 *    up, 'departing' while the hero fills in, 'done' when the page is live.
 *    The GL stage and the device-tier probe already wait on that.
 *
 * The crew and the boxes are plain DOM driven by the Web Animations API.
 * React renders the shell once and stays out of the frame loop.
 */

/** The crew: one cursor per emblem the site is built on. */
const AGENTS = [
  { jp: "剣", rgb: "60 214 140" },
  { jp: "杖", rgb: "162 118 255" },
  { jp: "書", rgb: "242 85 95" },
  { jp: "雷", rgb: "250 204 21" },
  { jp: "塔", rgb: "34 211 238" },
  { jp: "花", rgb: "249 168 212" },
] as const;

/**
 * What counts as a layer. Outermost match wins, so a list item or a figure
 * is one box rather than a box around every line inside it.
 */
const BLOCKS = "h1,h2,h3,h4,p,li,figure,blockquote,dl > div,form";
/** Layers that are not text blocks, named outright. */
const EXTRAS =
  "#top .hud-frame,#top .eyebrow,#top [data-stage-avoid],#top [data-stage-slot]";
/** Layers drawn as an empty frame rather than typed into. */
const FRAMES = "figure,form,[data-stage-slot],#site-header,#site-header *";

/** One agent's markup: three cursor shapes and its emblem. */
const agentHTML = (jp: string) =>
  '<svg class="bld-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 1.5 13.2 8l-5 1.2L6 14z"/></svg>' +
  '<svg class="bld-cross" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5v13M1.5 8h13"/></svg>' +
  '<svg class="bld-ibeam" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2h6M5 14h6M8 2v12"/></svg>' +
  `<span class="bld-tag jp" lang="ja">${jp}</span>`;

/** Where agent i waits during the scan, as an offset from screen centre.
    Whole pixels: the server prints these and the client must print the same. */
const huddle = (i: number, n: number) => {
  const t = (i / n) * Math.PI * 2;
  return { dx: Math.round(Math.cos(t) * 34), dy: Math.round(Math.sin(t) * 26) };
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SCAN_MS = 450;
const FONT_WAIT_MS = 700;
/** The intro ends by itself if anything stalls. */
const WATCHDOG_MS = 9000;
/** A layer queued this long is shown without ceremony. */
const STALE_MS = 2200;

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/**
 * Runs as it is parsed, before React has hydrated: Skip is focused and the
 * page behind the field is inert from the first frame, and Skip, Escape and
 * a 9 s failsafe can lift the field even if the app never arrives. Once the
 * app has mounted it marks the field data-cast-live and these stand aside.
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

const SEALED = "data-cast-sealed";
function seal(on: boolean) {
  if (on) {
    const field = document.querySelector("[data-preloader]");
    Array.from(document.body.children).forEach((el) => {
      if (
        el.tagName === "SCRIPT" ||
        el.hasAttribute("data-preloader") ||
        (field && el.contains(field)) ||
        el.hasAttribute("inert")
      )
        return;
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

type Rect = { x: number; y: number; w: number; h: number };
type Layer = {
  el: HTMLElement;
  frame: boolean;
  state: "idle" | "queued" | "building" | "built";
  since: number;
  box?: HTMLElement;
};
type Agent = {
  el: HTMLElement;
  x: number;
  y: number;
  busy: boolean;
  seen: boolean;
};

/** Read through a function: a layer's state changes across awaits, and the
    compiler would otherwise hold it to whatever was assigned last. */
const isBuilt = (l: Layer) => l.state === "built";

/** Text blocks whose box should hug the words, not the column they sit in. */
const HUG = "h1,h2,h3,h4,p,blockquote,.eyebrow,[data-stage-avoid]";

/**
 * Document-space rect, or null when the element takes up no room. A text
 * block is as wide as its container whatever it says, so those are measured
 * by their contents instead: a selection drawn around a short label should
 * be the size of the label.
 */
function rectOf(el: HTMLElement): Rect | null {
  let r: DOMRect = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  if (el.matches(HUG)) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const ink = range.getBoundingClientRect();
    if (ink.width >= 8 && ink.height >= 8 && ink.width <= r.width + 1) r = ink;
  }
  // Clamped to the page: a layer that bleeds off an edge (the hero sigil
  // does) must not let its box widen the document and add a scrollbar.
  const max = document.documentElement.clientWidth;
  const left = Math.max(0, r.left + window.scrollX);
  const right = Math.min(max, r.right + window.scrollX);
  if (right - left < 2) return null;
  return {
    x: Math.round(left),
    y: Math.round(r.top + window.scrollY),
    w: Math.round(right - left),
    h: Math.round(r.height),
  };
}

/**
 * The words a visitor can see in a layer, for typing into its box. Text that
 * exists only for screen readers is left out: the hero name carries one
 * spoken copy beside its drawn lines, and typing both read as a stutter.
 */
function visibleText(el: HTMLElement): string {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement?.closest(".sr-only")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  let out = "";
  while (walker.nextNode()) out += ` ${walker.currentNode.textContent ?? ""}`;
  return out.replace(/\s+/g, " ").trim().slice(0, 64);
}

/** Everything the crew will build, in reading order. */
function collect(): Layer[] {
  const main = document.getElementById("main");
  if (!main) return [];
  const picked = new Set<HTMLElement>();
  const add = (el: HTMLElement | null) => {
    if (!el || el.closest("[data-build-skip]")) return;
    picked.add(el);
  };

  main.querySelectorAll<HTMLElement>(BLOCKS).forEach((el) => {
    if (el.parentElement?.closest(BLOCKS)) return;
    add(el);
  });
  main.querySelectorAll<HTMLElement>(EXTRAS).forEach(add);
  // Standalone controls: the calls to action, not links inside a sentence.
  main.querySelectorAll<HTMLElement>("a[href],button").forEach((el) => {
    if (el.closest(BLOCKS) || el.closest(EXTRAS)) return;
    const r = el.getBoundingClientRect();
    if (r.width >= 64 && r.height >= 28) add(el);
  });
  // The nav is its bar, not the full-width strip that positions it.
  add(
    document.querySelector<HTMLElement>("#site-header .container-x > div") ??
      document.getElementById("site-header"),
  );

  // A layer inside another picked layer is already covered by it.
  const list = Array.from(picked).filter((el) => {
    for (let p = el.parentElement; p; p = p.parentElement)
      if (picked.has(p)) return false;
    return true;
  });

  return list
    .map((el) => ({ el, r: rectOf(el) }))
    .filter((x): x is { el: HTMLElement; r: Rect } => x.r !== null)
    .sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x)
    .map(({ el }) => ({
      el,
      frame: el.matches(FRAMES),
      state: "idle" as const,
      since: 0,
    }));
}

export function Builder() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const crewRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const skipIntro = useRef<() => void>(() => {});
  const finishAll = useRef<() => void>(() => {});
  // The field leaves when the intro ends; the crew and the pill stay until
  // the last layer is built.
  const [fieldGone, setFieldGone] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const field = fieldRef.current;
    const crew = crewRef.current;
    const pill = pillRef.current;
    if (!field || !crew || !pill || getCastPhase() !== "play") {
      setFieldGone(true);
      setDone(true);
      return;
    }

    // Hoisted functions below cannot see the null checks above.
    const fieldEl: HTMLDivElement = field;
    const pillEl: HTMLButtonElement = pill;
    const html = document.documentElement;
    field.setAttribute("data-cast-live", "");
    // From here the hero's own entrance stands down: the build delivers it.
    html.classList.add("bld-seen");

    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
      return id;
    };
    let disposed = false;
    let introOver = false;
    let finished = false;

    let layers: Layer[] = [];
    const byEl = new Map<Element, Layer>();
    const queue: Layer[] = [];
    let built = 0;
    let io: IntersectionObserver | null = null;

    const small = window.matchMedia("(max-width: 767px)").matches;
    const agents: Agent[] = AGENTS.slice(0, small ? 3 : 6).map((a) => {
      const el = document.createElement("div");
      el.className = "bld-agent";
      el.dataset.mode = "arrow";
      el.style.setProperty("--a", a.rgb);
      el.innerHTML = agentHTML(a.jp);
      crew.appendChild(el);
      return { el, x: 0, y: 0, busy: false, seen: false };
    });

    /* ── The pill ─────────────────────────────────────────────────────── */
    const label = pill.querySelector<HTMLElement>("[data-bld-count]");
    const say = (text: string) => {
      if (label) label.textContent = text;
    };
    const tally = () =>
      say(`${agents.length} agents · ${built} / ${layers.length} layers`);

    /* ── Agents ───────────────────────────────────────────────────────── */
    const place = (a: Agent, x: number, y: number) => {
      a.x = x;
      a.y = y;
      a.el.style.transform = `translate(${x}px,${y}px)`;
    };
    const fly = async (a: Agent, x: number, y: number, ms: number) => {
      if (ms < 20) return place(a, x, y);
      const anim = a.el.animate(
        [
          { transform: `translate(${a.x}px,${a.y}px)` },
          { transform: `translate(${x}px,${y}px)` },
        ],
        { duration: ms, easing: EASE, fill: "forwards" },
      );
      a.x = x;
      a.y = y;
      try {
        await anim.finished;
      } catch {
        /* cancelled by a flush: the commit below still lands it */
      }
      a.el.style.transform = `translate(${x}px,${y}px)`;
      anim.cancel();
    };
    const show = (a: Agent, on: boolean) => {
      a.seen = on;
      a.el.classList.toggle("is-on", on);
    };
    /** An agent left a screen away walks in from the nearest edge instead
        of crossing the whole page. */
    const summon = (a: Agent, r: Rect) => {
      const top = window.scrollY;
      const vh = window.innerHeight;
      if (a.seen && a.y > top - 80 && a.y < top + vh + 80) return;
      const below = r.y > top + vh / 2;
      place(a, r.x + r.w / 2 + (Math.random() - 0.5) * 240, below ? top + vh + 30 : top - 30);
      show(a, true);
    };

    /* ── Layers ───────────────────────────────────────────────────────── */
    const reveal = (l: Layer) => {
      if (l.state === "built") return;
      l.state = "built";
      l.el.setAttribute("data-built", "");
      built += 1;
      if (introOver || getCastPhase() !== "play") tally();
      io?.unobserve(l.el);
      if (built >= layers.length) complete();
    };
    const dropBox = (l: Layer, ms = 520) => {
      const box = l.box;
      if (!box) return;
      l.box = undefined;
      box.classList.add("is-done");
      later(() => box.remove(), ms);
    };
    /** Show a layer now, with no animation. */
    const snap = (l: Layer) => {
      dropBox(l, 260);
      reveal(l);
    };

    const makeBox = (l: Layer, r: Rect) => {
      const box = document.createElement("div");
      box.className = "bld-box";
      if (l.frame) box.dataset.frame = "";
      // The outline takes the colour of the section it is drawn in.
      const accent = getComputedStyle(l.el).getPropertyValue("--accent").trim();
      if (accent) box.style.setProperty("--k", accent);
      box.style.left = `${r.x}px`;
      box.style.top = `${r.y}px`;
      box.style.width = `${r.w}px`;
      box.style.height = `${r.h}px`;
      box.innerHTML =
        '<span class="bld-fill"></span><span class="bld-type"></span>' +
        '<i class="bld-h tl"></i><i class="bld-h tr"></i><i class="bld-h bl"></i><i class="bld-h br"></i>' +
        `<span class="bld-size">${r.w} × ${r.h}</span>`;
      crew.appendChild(box);
      l.box = box;
      return box;
    };

    /** Fly in, then drag the wireframe out corner to corner. */
    const wire = async (a: Agent, l: Layer, speed: number) => {
      const r = rectOf(l.el);
      if (!r) return null;
      summon(a, r);
      a.el.dataset.mode = "arrow";
      await fly(a, r.x, r.y, 300 * speed);
      if (disposed || l.state === "built") return null;
      const box = makeBox(l, r);
      a.el.dataset.mode = "cross";
      const grow = box.animate(
        [
          { width: "0px", height: "0px" },
          { width: `${r.w}px`, height: `${r.h}px` },
        ],
        { duration: 260 * speed, easing: EASE },
      );
      await Promise.all([
        grow.finished.catch(() => {}),
        fly(a, r.x + r.w, r.y + r.h, 260 * speed),
      ]);
      return r;
    };

    /** Type into the box, then swap it for the real thing. */
    const fill = async (a: Agent, l: Layer, r: Rect, speed: number) => {
      const box = l.box;
      if (!box || l.state === "built") return;
      if (!l.frame) {
        const text = visibleText(l.el);
        const out = box.querySelector<HTMLElement>(".bld-type");
        if (text && out) {
          a.el.dataset.mode = "text";
          await fly(a, r.x + 10, r.y + Math.min(r.h / 2, 16), 150 * speed);
          const steps = Math.min(9, text.length);
          for (let i = 1; i <= steps; i++) {
            if (disposed || isBuilt(l)) return;
            out.textContent = text.slice(0, Math.ceil((text.length * i) / steps));
            await wait((240 * speed) / steps);
          }
        }
      } else {
        await wait(120 * speed);
      }
      if (disposed) return;
      reveal(l);
      dropBox(l);
      a.el.dataset.mode = "arrow";
    };

    /* ── The scroll queue ─────────────────────────────────────────────── */
    let idleTimer = 0;
    const pump = () => {
      if (disposed || finished) return;
      window.clearTimeout(idleTimer);
      // Too far behind to catch up gracefully: show the oldest outright.
      while (queue.length > agents.length * 3) snap(queue.shift() as Layer);
      const speed = queue.length > agents.length * 1.5 ? 0.55 : 1;
      for (const a of agents) {
        if (a.busy) continue;
        const l = queue.shift();
        if (!l) break;
        if (l.state !== "queued") continue;
        a.busy = true;
        l.state = "building";
        l.since = performance.now();
        void (async () => {
          try {
            const r = await wire(a, l, speed);
            if (r) await fill(a, l, r, speed);
            else if (!isBuilt(l)) snap(l);
          } catch {
            if (!isBuilt(l)) snap(l);
          }
          a.busy = false;
          pump();
        })();
      }
      if (!queue.length && agents.every((a) => !a.busy))
        idleTimer = window.setTimeout(
          () => agents.forEach((a) => !a.busy && show(a, false)),
          1100,
        );
    };

    const enqueue = (l: Layer) => {
      if (l.state !== "idle") return;
      l.state = "queued";
      l.since = performance.now();
      queue.push(l);
    };

    const watch = () => {
      io = new IntersectionObserver(
        (entries) => {
          let added = false;
          for (const e of entries) {
            const l = byEl.get(e.target);
            if (!l || l.state === "built") continue;
            if (e.isIntersecting) {
              enqueue(l);
              added = true;
            } else if (e.boundingClientRect.bottom < 0) {
              // Scrolled straight past: nobody is there to watch it built.
              const i = queue.indexOf(l);
              if (i >= 0) queue.splice(i, 1);
              snap(l);
            }
          }
          if (added) {
            queue.sort(
              (a, b) =>
                a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top,
            );
            pump();
          }
        },
        { rootMargin: "0px 0px -6% 0px" },
      );
      layers.forEach((l) => l.state !== "built" && io?.observe(l.el));
    };

    /* ── Ending ───────────────────────────────────────────────────────── */
    const cleanup = () => {
      io?.disconnect();
      window.clearInterval(sweep);
      window.clearTimeout(idleTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("keydown", onKey);
      motionWatch.disconnect();
    };
    function complete() {
      if (finished) return;
      finished = true;
      if (layers.length) say(`${layers.length} / ${layers.length} layers · built`);
      else pillEl.classList.remove("is-live");
      pillEl.classList.add("is-complete");
      agents.forEach((a) => show(a, false));
      if (!introOver) endIntro(true);
      later(() => {
        cleanup();
        html.removeAttribute("data-building");
        setDone(true);
      }, 1700);
    }
    /** Everything, now. */
    const flush = () => {
      queue.length = 0;
      layers.forEach((l) => l.state !== "built" && snap(l));
    };
    finishAll.current = flush;

    function endIntro(clean: boolean) {
      if (introOver) return;
      introOver = true;
      window.clearTimeout(watchdog);
      const from = getCastPhase();
      fieldEl.setAttribute(
        "data-leaving",
        clean || from === "departing" ? "pieces" : "field",
      );
      setCastPhase("done");
      seal(false);
      window.dispatchEvent(new Event("lenis:start"));
      try {
        sessionStorage.setItem("preloaded", "1");
      } catch {
        /* private mode: it simply plays again next visit */
      }
      const active = document.activeElement;
      if (active instanceof HTMLElement && fieldEl.contains(active)) active.blur();
      later(() => setFieldGone(true), 170);
      if (!layers.length) return complete();
      pillEl.classList.add("is-live");
      tally();
      if (!finished) {
        watch();
        pump();
      }
    }
    /** Count the layers and take charge of them. Once only. */
    let prepared = false;
    function prepare() {
      if (prepared) return;
      prepared = true;
      layers = collect();
      layers.forEach((l) => {
        byEl.set(l.el, l);
        l.el.setAttribute("data-build", "");
      });
      html.setAttribute("data-building", "");
    }
    /** Skip: the hero is simply there, and the rest still builds on scroll.
        A Skip pressed during the scan arrives before the layers were
        counted, so it counts them first; otherwise the counter would be
        left reading 0 / 0 with nothing to finish it. */
    skipIntro.current = () => {
      if (introOver) return;
      prepare();
      const vh = window.innerHeight;
      layers.forEach((l) => {
        if (l.state !== "built" && l.el.getBoundingClientRect().top < vh) snap(l);
      });
      endIntro(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!introOver) skipIntro.current();
      else flush();
    };
    // Focus must never land on something invisible.
    const onFocus = (e: FocusEvent) => {
      for (let n = e.target as Element | null; n; n = n.parentElement) {
        const l = byEl.get(n);
        if (l && l.state !== "built") {
          const i = queue.indexOf(l);
          if (i >= 0) queue.splice(i, 1);
          snap(l);
        }
      }
    };
    // Every box was measured against the old layout.
    const onResize = () => {
      layers.forEach((l) => l.state === "building" && snap(l));
    };
    // 静 or reduced motion switched on part-way through.
    const motionWatch = new MutationObserver(() => {
      if (html.dataset.motion === "still") {
        if (!introOver) skipIntro.current();
        flush();
      }
    });
    motionWatch.observe(html, { attributes: true, attributeFilter: ["data-motion"] });

    // The observer is the fast path; this is the one that cannot be wrong.
    // In testing roughly one visit in four ended a layer short: an entry
    // that was plainly on screen and never reported. So every other tick
    // the idle layers are simply measured. In view: build it. Scrolled past
    // or no longer taking up room (a filter, a breakpoint): count it. The
    // counter therefore always reaches its total.
    let tick = 0;
    const sweep = window.setInterval(() => {
      const now = performance.now();
      const poll = introOver && ++tick % 2 === 0;
      const vh = window.innerHeight;
      let woke = false;
      for (const l of layers) {
        if (l.state === "queued" && now - l.since > STALE_MS) {
          const i = queue.indexOf(l);
          if (i >= 0) queue.splice(i, 1);
          snap(l);
        } else if (l.state === "building" && now - l.since > STALE_MS * 2) snap(l);
        else if (poll && l.state === "idle") {
          const r = l.el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2 || r.bottom < 0) snap(l);
          else if (r.top < vh * 0.94) {
            enqueue(l);
            woke = true;
          }
        }
      }
      if (woke) pump();
    }, 600);

    const watchdog = window.setTimeout(() => skipIntro.current(), WATCHDOG_MS);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    document.addEventListener("focusin", onFocus);

    /* ── The intro ────────────────────────────────────────────────────── */
    const intro = async () => {
      seal(true);
      window.dispatchEvent(new Event("lenis:stop"));

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Scan: the crew gathers where the page will be.
      // They take over from the server-drawn huddle, in the same spots.
      agents.forEach((a, i) => {
        const { dx, dy } = huddle(i, AGENTS.length);
        place(a, Math.round(vw / 2) + dx, Math.round(vh / 2) + dy);
        show(a, true);
      });

      await Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        wait(FONT_WAIT_MS),
      ]);
      await wait(SCAN_MS);
      if (disposed || introOver) return;

      prepare();
      if (!layers.length) return endIntro(true);
      pill.classList.add("is-live");
      say(`${agents.length} agents · 0 / ${layers.length} layers`);

      const first = layers.filter((l) => l.el.getBoundingClientRect().top < vh);
      const rects = new Map<Layer, Rect>();

      // Pass one: the whole first screen as a wireframe.
      const todo = [...first];
      await Promise.all(
        agents.map(async (a) => {
          for (let l = todo.shift(); l; l = todo.shift()) {
            if (disposed || introOver) return;
            l.state = "building";
            l.since = performance.now();
            const r = await wire(a, l, 0.8);
            if (r) rects.set(l, r);
            else if (!isBuilt(l)) snap(l);
          }
        }),
      );
      if (disposed || introOver) return;
      await wait(180);

      // Pass two: the field lifts and the content is typed in.
      setCastPhase("departing");
      const fills = first.filter((l) => l.state !== "built" && rects.has(l));
      await Promise.all(
        agents.map(async (a) => {
          for (let l = fills.shift(); l; l = fills.shift()) {
            if (disposed || introOver) return;
            l.since = performance.now();
            await fill(a, l, rects.get(l) as Rect, 0.85);
          }
        }),
      );
      if (disposed || introOver) return;
      first.forEach((l) => l.state !== "built" && snap(l));
      endIntro(true);
    };
    void intro().catch(() => skipIntro.current());

    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      window.clearTimeout(watchdog);
      cleanup();
      // StrictMode remounts in development: put the page back as it was so
      // the second run starts clean.
      layers.forEach((l) => {
        l.el.removeAttribute("data-build");
        l.el.removeAttribute("data-built");
      });
      html.removeAttribute("data-building");
      crew.replaceChildren();
      if (!introOver) seal(false);
    };
  }, []);

  return (
    <>
      {!fieldGone && (
        <div
          ref={fieldRef}
          data-preloader
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label="Intro"
          className="fixed inset-0 z-[10000] overflow-hidden"
        >
          <div aria-hidden data-cast-fade className="grid-lines absolute inset-0 opacity-[0.06]" />
          {/* The crew, on screen from the first paint and before any script:
              a first visit is never just an empty field. The live agents
              take these places when the app arrives (build.css hides these
              once the field is marked data-cast-live). */}
          <div aria-hidden data-bld-static>
            {AGENTS.map((a, i) => {
              const { dx, dy } = huddle(i, AGENTS.length);
              return (
                <div
                  key={a.jp}
                  className="bld-agent is-on"
                  data-mode="arrow"
                  style={
                    {
                      "--a": a.rgb,
                      transform: `translate(calc(50vw + ${dx}px), calc(50vh + ${dy}px))`,
                    } as React.CSSProperties
                  }
                  dangerouslySetInnerHTML={{ __html: agentHTML(a.jp) }}
                />
              );
            })}
          </div>
          <button
            type="button"
            data-cast-skip
            data-cast-fade
            onClick={() => skipIntro.current()}
            className="cast-skip-in absolute bottom-[4.5rem] right-4 z-10 border sm:bottom-6 sm:right-6 border-fg/15 bg-surface/70 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted backdrop-blur-sm transition-colors hover:text-fg"
          >
            Skip
          </button>
          <script dangerouslySetInnerHTML={{ __html: SEAL_SCRIPT }} />
        </div>
      )}

      {!done && (
        <>
          {/* The crew and their boxes, in document space so they scroll
              with the page they are building. */}
          <div ref={crewRef} data-build-crew aria-hidden />
          <button
            ref={pillRef}
            type="button"
            data-build-pill
            onClick={() => finishAll.current()}
            aria-label="Finish building the page now"
            title="Finish building the page now"
          >
            <span aria-hidden className="bld-dots">
              {AGENTS.map((a) => (
                <i key={a.jp} style={{ background: `rgb(${a.rgb})` }} />
              ))}
            </span>
            <span data-bld-count>Scanning page…</span>
          </button>
        </>
      )}
    </>
  );
}
