"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { site, introTrack } from "@/lib/content";

/**
 * The intro: his own trajectory, drawn.
 *
 * A line crosses the years from 2010 to 2029 while the milestones from the
 * Ascent section drop in beside it, then the endpoint blooms into a ring and
 * whites out — landing on the page in light mode, where the hero's summoning
 * circle is already waiting in roughly the spot the ring left off.
 *
 * The chart has no y-axis on purpose. The x-axis is real years; the height is
 * just a path. Giving it a scale would imply a measurement that does not exist.
 *
 * Plays once per tab session. Three ways out, because a loader that can trap
 * someone is a bug: it finishes, you press Skip or Escape, or the watchdog
 * fires.
 */

/** Line draw, chip stagger and the white-out all live inside this. */
const RUN_MS = 5200;
const WHITEOUT_MS = 900;
/** Nothing holds the page longer than this, whatever goes wrong. */
const WATCHDOG_MS = 7000;

const { from, to, marks } = introTrack;
const xOf = (year: number) => ((year - from) / (to - from)) * 1000;

/** Smooth cubic through the milestones; see introTrack for the y values. */
const PATH =
  "M 0 235 C 200 232, 420 215, 684 180 " +
  "C 730 172, 762 145, 789 120 " +
  "C 805 108, 824 96, 842 86 " +
  "C 890 70, 950 45, 1000 24";

export function Preloader() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(true);
  const [whiteout, setWhiteout] = useState(false);
  const [year, setYear] = useState<number>(from);
  const raf = useRef(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("preloaded") === "1";
    } catch {
      /* private mode — play it */
    }

    // The loader ends on white, so the page behind it is already light.
    try {
      if (!localStorage.getItem("theme")) {
        document.documentElement.dataset.theme = "light";
      }
    } catch {
      document.documentElement.dataset.theme = "light";
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
      setWhiteout(true);
      timers.push(window.setTimeout(release, WHITEOUT_MS));
    };

    // The year readout is driven off the clock rather than a CSS animation,
    // so it cannot drift away from the line being drawn beside it.
    const COUNT_FROM = 700;
    const COUNT_FOR = 3200;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0 - COUNT_FROM) / COUNT_FOR));
      const eased = 1 - Math.pow(1 - p, 3);
      setYear(Math.round(from + (to - from) * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);

    timers.push(window.setTimeout(finish, RUN_MS));
    timers.push(window.setTimeout(finish, WATCHDOG_MS));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf.current);
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
    cancelAnimationFrame(raf.current);
    setDone(true);
    document.body.style.overflow = "";
    window.dispatchEvent(new Event("lenis:start"));
  };

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[10000] overflow-hidden bg-[#07100c] text-white"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          role="presentation"
        >
          {/* A breath of the site's green, so the loader is the same world */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 78% 18%, rgba(34,160,104,0.26), transparent 62%), " +
                "radial-gradient(90% 80% at 12% 90%, rgba(124,92,200,0.16), transparent 60%)",
            }}
          />

          <div className="relative flex h-full flex-col justify-between px-6 py-6 sm:px-10 sm:py-9">
            {/* Masthead */}
            <motion.div
              className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/55 sm:text-[11px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="text-white/80">Mohammed Mishal®</span>
              <span className="text-right leading-relaxed">
                Trajectory · {from}—{to}
                <br />
                <span className="text-white/40">
                  {site.locationShort} {site.coords}
                </span>
              </span>
            </motion.div>

            {/* Headline — the same grotesque/italic-serif pairing as the page */}
            <div className="pointer-events-none absolute left-6 top-[18%] sm:left-10">
              <motion.h1
                className="display text-[clamp(2.1rem,6.4vw,4.6rem)] leading-[0.95]"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.9,
                  delay: 0.18,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <span className="block">Everything so far,</span>
                <motion.span
                  className="block font-serif font-normal italic text-[#4ade9a]"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.9,
                    delay: 0.42,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  since {from}.
                </motion.span>
              </motion.h1>
            </div>

            {/* The track */}
            <div className="relative mx-auto mt-auto w-full max-w-5xl">
              <div className="relative aspect-[1000/260] w-full">
                <svg
                  viewBox="0 0 1000 260"
                  fill="none"
                  className="absolute inset-0 h-full w-full overflow-visible"
                  aria-hidden
                >
                  {/* Year gridlines — the only axis there is */}
                  {marks.map((m, i) => (
                    <motion.line
                      key={m.year}
                      x1={xOf(m.year)}
                      x2={xOf(m.year)}
                      y1={m.y - 12}
                      y2={260}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={1}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}

                  <motion.path
                    d={PATH}
                    stroke="#4ade9a"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 3.2,
                      delay: 0.7,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  />

                  {marks.map((m, i) => (
                    <motion.circle
                      key={m.year}
                      cx={xOf(m.year)}
                      cy={m.y}
                      r={4}
                      fill="#07100c"
                      stroke="#4ade9a"
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.95 + i * 0.58,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                      style={{ transformOrigin: `${xOf(m.year)}px ${m.y}px` }}
                    />
                  ))}
                </svg>

                {/* Milestone chips, positioned against the same coordinates */}
                {marks.map((m, i) => (
                  <motion.div
                    key={m.year}
                    className="absolute hidden -translate-y-1/2 whitespace-nowrap rounded bg-black/55 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/75 backdrop-blur-sm sm:block"
                    style={{
                      left: `${xOf(m.year) / 10}%`,
                      top: `${(m.y / 260) * 100}%`,
                      transform: "translate(-50%, -160%)",
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 1.05 + i * 0.58 }}
                  >
                    <span className="text-[#4ade9a]">{m.year}</span>{" "}
                    <span>{m.label}</span>
                  </motion.div>
                ))}

                {/* The bloom: the endpoint opens into a ring, which is what the
                    hero's summoning circle picks up on the other side. */}
                <motion.span
                  aria-hidden
                  className="absolute block rounded-full border border-[#4ade9a]"
                  style={{
                    left: "100%",
                    top: `${(24 / 260) * 100}%`,
                    width: 18,
                    height: 18,
                    marginLeft: -9,
                    marginTop: -9,
                  }}
                  initial={{ opacity: 0, scale: 0.2 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.2, 9, 16] }}
                  transition={{ duration: 1.4, delay: 3.9, ease: "easeOut" }}
                />
              </div>

              {/* Year rule */}
              <div className="mt-3 flex justify-between font-mono text-[10px] tracking-[0.14em] text-white/35">
                <span>{from}</span>
                <span>{to}</span>
              </div>
            </div>

            {/* Readout */}
            <div className="mt-8 flex items-end justify-between gap-6">
              <motion.div
                className="display text-[clamp(3.4rem,13vw,9rem)] leading-[0.82] tabular-nums"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.9,
                  delay: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {year}
              </motion.div>

              <motion.div
                className="pb-2 text-right font-mono text-[10px] uppercase tracking-[0.16em] sm:text-[11px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.1 }}
              >
                <div className="text-white/75">{site.role}</div>
                <div className="mt-1 text-[#4ade9a]">{site.availableFrom}</div>
                <button
                  onClick={skip}
                  className="pointer-events-auto mt-4 rounded-full border border-white/25 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-white/70 hover:text-white"
                >
                  Skip intro ↵
                </button>
              </motion.div>
            </div>
          </div>

          {/* White-out: this is the handover to the light-mode landing page */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: whiteout ? 1 : 0 }}
            transition={{ duration: 0.55, ease: "easeIn" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
