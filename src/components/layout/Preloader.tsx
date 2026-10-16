"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { site, nav } from "@/lib/content";

/**
 * The intro: a summoning circle being cast.
 *
 * Nothing here is borrowed. It is assembled out of this site's own vocabulary
 * — the six section glyphs, the sword/wand duality, the grimoire sigil — and
 * it ends by handing that sigil to the hero, which is already drawing one on
 * the GPU. The circle tilts into perspective and flies to the hero's corner as
 * the page comes up behind it, so the loader does not cut to the landing page;
 * it becomes it.
 *
 * Beats: motes converge, rings land, the six glyphs ignite around the rim,
 * 剣 and 杖 collide at the centre, the name resolves, the sigil leaves.
 *
 * Plays once per tab session. Three ways out, because a loader that can trap
 * someone is a bug: it finishes, you press Skip or Escape, or the watchdog
 * fires.
 */

/** Every beat below is measured from mount, in seconds. */
const B = {
  motes: 0.25,
  rings: 0.85,
  runes: 1.3,
  glyphs: 1.65,
  duality: 2.6,
  name: 3.1,
  depart: 3.85,
} as const;

const RUN_MS = 4750;
/** Nothing holds the page longer than this, whatever goes wrong. */
const WATCHDOG_MS = 6500;

/** SVG space. The circle is drawn at 400×400 and scaled by its container. */
const C = 200;
const R_GLYPH = 150;

const vertex = (i: number, r = R_GLYPH) => {
  const a = (-90 + i * 60) * (Math.PI / 180);
  return { x: C + Math.cos(a) * r, y: C + Math.sin(a) * r };
};

/** Two overlapping triangles — the six section glyphs sit on its points. */
const TRIANGLES = [
  [0, 2, 4],
  [1, 3, 5],
].map(
  (t) =>
    t
      .map((i, n) => {
        const p = vertex(i);
        return `${n === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(" ") + " Z",
);

const RUNES = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2;
  const long = i % 4 === 0;
  const r1 = 162;
  const r2 = long ? 178 : 170;
  return {
    x1: C + Math.cos(a) * r1,
    y1: C + Math.sin(a) * r1,
    x2: C + Math.cos(a) * r2,
    y2: C + Math.sin(a) * r2,
  };
});

export function Preloader() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(true);
  const [leaving, setLeaving] = useState(false);

  /** Motes fly in from a ring outside the frame; fixed seed, no randomness
      between server and client because this only ever renders on the client. */
  const motes = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const a = (i / 44) * Math.PI * 2 + (i % 3) * 0.4;
        const dist = 60 + ((i * 37) % 40);
        return {
          x: Math.cos(a) * dist,
          y: Math.sin(a) * dist,
          delay: B.motes + (i % 11) * 0.045,
          size: i % 5 === 0 ? 3 : 2,
        };
      }),
    [],
  );

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("preloaded") === "1";
    } catch {
      /* private mode — play it */
    }

    if (seen || reduced) {
      setDone(true);
      document.body.style.overflow = "";
      return;
    }

    setDone(false);
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new Event("lenis:stop"));

    const timers: number[] = [];
    const release = () => {
      setDone(true);
      document.body.style.overflow = "";
      window.dispatchEvent(new Event("lenis:start"));
    };
    const finish = () => {
      try {
        sessionStorage.setItem("preloaded", "1");
      } catch {
        /* ignore */
      }
      setLeaving(true);
      timers.push(window.setTimeout(release, 850));
    };

    timers.push(window.setTimeout(finish, RUN_MS));
    timers.push(window.setTimeout(finish, WATCHDOG_MS));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.dispatchEvent(new Event("lenis:start"));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const skip = () => {
    try {
      sessionStorage.setItem("preloaded", "1");
    } catch {
      /* ignore */
    }
    setDone(true);
    document.body.style.overflow = "";
    window.dispatchEvent(new Event("lenis:start"));
  };

  const ring = (r: number, delay: number, opacity: number) => (
    <motion.circle
      cx={C}
      cy={C}
      r={r}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity }}
      transition={{ duration: 1, delay, ease: [0.34, 1.4, 0.64, 1] }}
      style={{ transformOrigin: `${C}px ${C}px` }}
    />
  );

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[10000] overflow-hidden bg-[#07080c]"
          animate={{ opacity: leaving ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          role="presentation"
        >
          <div
            aria-hidden
            className="grid-lines absolute inset-0 opacity-[0.07]"
          />

          {/* The cast. On departure the whole thing tilts into perspective and
              leaves towards the hero's sigil rather than cutting away. */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-[min(76vmin,620px)] w-[min(76vmin,620px)]"
            style={{ perspective: 1200 }}
            initial={{ x: "-50%", y: "-50%" }}
            animate={
              leaving
                ? {
                    x: "-50%",
                    y: "-50%",
                    translateX: "29vw",
                    translateY: "-3vh",
                    scale: 0.46,
                    rotateX: 56,
                    opacity: 0,
                  }
                : { x: "-50%", y: "-50%", scale: 1, rotateX: 0, opacity: 1 }
            }
            transition={{ duration: 0.95, ease: [0.65, 0, 0.35, 1] }}
          >
            {/* Motes converging on the centre */}
            {motes.map((m, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 block rounded-full bg-green"
                style={{ width: m.size, height: m.size }}
                initial={{ x: `${m.x}%`, y: `${m.y}%`, opacity: 0, scale: 0.4 }}
                animate={{
                  x: "0%",
                  y: "0%",
                  opacity: [0, 1, 0],
                  scale: [0.4, 1, 0.2],
                }}
                transition={{
                  duration: 1.15,
                  delay: m.delay,
                  ease: [0.4, 0, 0.1, 1],
                }}
              />
            ))}

            <svg
              viewBox="0 0 400 400"
              className="absolute inset-0 h-full w-full text-green"
            >
              {ring(188, B.rings, 0.35)}
              {ring(R_GLYPH, B.rings + 0.1, 0.75)}
              {ring(96, B.rings + 0.2, 0.5)}
              {ring(58, B.rings + 0.3, 0.3)}

              {/* Shockwave at the moment the rings land */}
              <motion.circle
                cx={C}
                cy={C}
                r={96}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 2.6], opacity: [0.9, 0] }}
                transition={{
                  duration: 1.1,
                  delay: B.rings + 0.25,
                  ease: "easeOut",
                }}
                style={{ transformOrigin: `${C}px ${C}px` }}
              />

              {RUNES.map((r, i) => (
                <motion.line
                  key={i}
                  x1={r.x1}
                  y1={r.y1}
                  x2={r.x2}
                  y2={r.y2}
                  stroke="currentColor"
                  strokeWidth={1}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.55 }}
                  transition={{ duration: 0.3, delay: B.runes + i * 0.012 }}
                />
              ))}

              {/* The hexagram the six sections hang off */}
              {TRIANGLES.map((d, i) => (
                <motion.path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="rgb(var(--accent-2))"
                  strokeWidth={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{
                    duration: 1.5,
                    delay: B.glyphs + i * 0.25,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                />
              ))}
            </svg>

            {/* The six section glyphs igniting around the rim. This is the
                site's own navigation, cast as the circle's runes. */}
            {nav.map((item, i) => {
              const p = vertex(i);
              return (
                <motion.span
                  key={item.href}
                  className="absolute -translate-x-1/2 -translate-y-1/2 font-serif text-[clamp(1rem,3.4vmin,1.9rem)] text-green"
                  style={{
                    left: `${(p.x / 400) * 100}%`,
                    top: `${(p.y / 400) * 100}%`,
                  }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: [0, 1, 0.85], scale: [0.4, 1.25, 1] }}
                  transition={{
                    duration: 0.65,
                    delay: B.glyphs + 0.1 + i * 0.13,
                  }}
                >
                  {item.jp}
                </motion.span>
              );
            })}

            {/* 剣 and 杖 close on the centre and meet */}
            <motion.span
              className="absolute left-1/2 top-1/2 -translate-y-1/2 font-serif text-[clamp(1.6rem,6vmin,3.4rem)] text-green"
              initial={{ x: "-320%", y: "-50%", opacity: 0 }}
              animate={{ x: "-130%", y: "-50%", opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: B.duality,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              剣
            </motion.span>
            <motion.span
              className="absolute left-1/2 top-1/2 -translate-y-1/2 font-serif text-[clamp(1.6rem,6vmin,3.4rem)] text-purple"
              initial={{ x: "220%", y: "-50%", opacity: 0 }}
              animate={{ x: "30%", y: "-50%", opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: B.duality,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              杖
            </motion.span>

            {/* The flash where they meet */}
            <motion.span
              aria-hidden
              className="absolute left-1/2 top-1/2 block h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-2xl"
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0, 0.65, 0], scale: [0.2, 1.8, 2.6] }}
              transition={{
                duration: 0.9,
                delay: B.duality + 0.55,
                ease: "easeOut",
              }}
            />
          </motion.div>

          {/* Name and status sit outside the sigil, so they stay put while it
              tilts away. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-7 sm:px-10 sm:pb-9">
            <div className="flex items-end justify-between gap-6">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: B.name,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="wordmark text-[clamp(1.5rem,4.6vw,3rem)] leading-none text-white">
                  {site.name}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">
                  {site.role}
                </div>
              </motion.div>

              <motion.div
                className="text-right font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 sm:text-[11px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: B.name + 0.15 }}
              >
                <div>
                  {site.locationShort} {site.coords}
                </div>
                <button
                  onClick={skip}
                  className="pointer-events-auto mt-3 rounded-full border border-white/20 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-white/70 hover:text-white"
                >
                  Skip ↵
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
