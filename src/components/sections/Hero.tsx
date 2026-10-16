"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowDownRight } from "lucide-react";
import { site, intro } from "@/lib/content";
import dynamic from "next/dynamic";
import { FlowField } from "@/components/ui/FlowField";
import { MagicCircle } from "@/components/ui/MagicCircle";

import { CharReveal } from "@/components/ui/TextReveal";
import { Magnetic } from "@/components/ui/Magnetic";
import { Counter } from "@/components/ui/Counter";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * The GPU sigil is client-only and carries three.js with it, so it loads
 * after the page is interactive rather than blocking first paint. The SVG
 * MagicCircle renders underneath as the fallback, which means no WebGL and
 * no JavaScript both still get a summoning circle.
 */
const ManaCore = dynamic(
  () =>
    import("@/components/ui/ManaCore")
      .then((m) => m.ManaCore)
      // If the chunk fails (flaky network, blocked CDN) render nothing: the
      // SVG sigil is already on screen, and the page must not die over an
      // ornament. Measured before this: an aborted chunk took the whole page.
      .catch(() => {
        const Fallback = () => null;
        return Fallback;
      }),
  { ssr: false },
);

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  // The SVG sigil holds the frame until WebGL confirms it has a context;
  // then it steps aside so the two are never drawn on top of each other.
  const [gpu, setGpu] = useState(false);
  // The sigil is hidden below md, but CSS-hiding it would still download
  // three.js and spin up a context on a zero-size element. Gate the mount.
  const wide = useMediaQuery("(min-width: 768px)");
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Three parallax depths: sigil furthest back, field behind, headline in front.
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "38%"]);
  const fieldY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const sigilY = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const sigilRotate = useTransform(scrollYProgress, [0, 1], [0, 42]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-10 pt-24 sm:pt-32"
    >
      {/* Mana field */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: fieldY }}>
        <FlowField className="h-full w-full" />
      </motion.div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-bg/70 via-bg/20 to-bg"
      />
      <div
        aria-hidden
        className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-60"
      />

      {/* Summoning circle, offset right so it frames the headline rather than
          sitting behind it. On phones it bleeds off the top-right corner as
          the SVG sigil — the GPU version stays desktop-only (see `wide`). */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-[46%] top-[7%] -z-10 h-[112vw] w-[112vw] md:-right-[6%] md:top-[6%] md:h-[min(58vw,720px)] md:w-[min(58vw,720px)]"
        style={{
          y: sigilY,
          rotate: sigilRotate,
        }}
        initial={{ opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      >
        <MagicCircle
          className={cn(
            "h-full w-full transition-opacity duration-700 max-md:opacity-50",
            gpu && "opacity-0",
          )}
          points={7}
          seed={5}
        />
        {wide && (
          <ManaCore
            className="absolute inset-0 h-full w-full"
            onReady={() => setGpu(true)}
            /* Faded towards the headline so the sigil never competes with type. */
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 78% 78% at 62% 50%, rgba(0,0,0,1) 38%, rgba(0,0,0,0) 100%)",
              maskImage:
                "radial-gradient(ellipse 78% 78% at 62% 50%, rgba(0,0,0,1) 38%, rgba(0,0,0,0) 100%)",
            }}
          />
        )}
      </motion.div>

      <div className="container-x relative">
        {/* Status row */}
        <motion.div
          className="mb-10 flex flex-wrap items-center justify-between gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hud-frame inline-flex items-center gap-2.5 border border-fg/10 bg-surface/50 px-3.5 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              {site.availability}
            </span>
          </div>
          <span className="eyebrow hidden sm:block">
            {site.location} · {site.availableFrom}
          </span>
        </motion.div>

        {/* Name */}
        <motion.div style={{ y: titleY, opacity: fade }}>
          <h1 className="wordmark h-display text-fg max-sm:text-[12.4vw]">
            <span className="block">
              <CharReveal text="Mohammed" delay={0.25} />
            </span>
            <span className="block">
              <CharReveal text="Mishal" delay={0.42} />
              <motion.span
                className="-ml-[0.04em] inline-block text-accent"
                initial={{ opacity: 0, scale: 0.4, rotate: -40 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 1.1,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                .
              </motion.span>
            </span>
          </h1>

          {/* The duality line — the site's thesis, stated once */}
          <motion.div
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.88, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="flex items-center gap-2.5">
              <span className="font-serif text-2xl text-green sm:text-3xl">
                剣
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Sword · Design
              </span>
            </span>
            <span aria-hidden className="h-4 w-px bg-fg/20" />
            <span className="flex items-center gap-2.5">
              <span className="font-serif text-2xl text-purple sm:text-3xl">
                杖
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Wand · Code
              </span>
            </span>
          </motion.div>

          {/* Role + statement */}
          <div className="mt-10 grid gap-8 border-t border-fg/[0.1] pt-8 md:grid-cols-12">
            <motion.div
              className="md:col-span-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.95,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <p className="font-serif text-2xl italic leading-tight text-fg sm:text-3xl">
                {site.role}
              </p>
              <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted">
                {site.tagline}
              </p>
            </motion.div>

            <motion.div
              className="md:col-span-4 md:col-start-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 1.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* One sentence, broken by hand for the narrow desktop column.
                  On a phone those breaks just make a ragged edge, so the
                  <br>s only exist from md up. */}
              <p className="text-pretty text-sm leading-relaxed text-muted">
                {intro.lines.map((line, i) => (
                  <span key={i}>
                    {i > 0 && (
                      <>
                        <br className="hidden md:inline" />
                        <span className="md:hidden"> </span>
                      </>
                    )}
                    {line}
                  </span>
                ))}
              </p>
            </motion.div>

            <motion.div
              className="hidden items-start md:col-span-2 md:col-start-11 md:flex md:justify-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 1.15,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Magnetic strength={0.4}>
                <a
                  href="#work"
                  className="group relative flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-full border border-fg/15 transition-colors duration-500 hover:border-accent hover:bg-accent"
                >
                  <span
                    aria-hidden
                    className="absolute inset-1.5 rounded-full border border-dashed border-accent/30 transition-opacity duration-500 group-hover:opacity-0"
                  />
                  <ArrowDownRight
                    size={20}
                    className="text-fg transition-all duration-500 group-hover:rotate-45 group-hover:text-accent-ink"
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint transition-colors duration-500 group-hover:text-accent-ink">
                    Scroll
                  </span>
                </a>
              </Magnetic>
            </motion.div>
          </div>
        </motion.div>

        {/* Status panel — the HUD readout */}
        <motion.div
          className="mt-14 border-t border-fg/[0.1] pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
        >
          <div className="mb-6 flex flex-wrap gap-x-8 gap-y-3">
            {intro.status.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  {s.label}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-accent">
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Number first, then what it counts, then where it comes from —
              a figure nobody can source is just decoration. */}
          <dl className="grid grid-cols-2 gap-y-10 border-t border-fg/[0.08] pt-10 sm:grid-cols-4 sm:gap-x-6">
            {intro.stats.map((stat, i) => (
              // dt must precede its dd in the DOM (axe: definition-list), and a
              // <p> is not allowed inside dl > div. The number still reads
              // first visually — `order` moves it, not the markup.
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col",
                  i > 0 && "sm:border-l sm:border-fg/[0.08] sm:pl-6",
                )}
              >
                <dt className="order-2 mt-3 text-sm font-medium text-fg">
                  {stat.label}
                </dt>
                <dd className="display order-1 text-5xl leading-none text-fg sm:text-6xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </dd>
                <dd className="order-3 mt-1 font-mono text-[11px] tracking-[0.04em] text-faint">
                  {stat.note}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}
