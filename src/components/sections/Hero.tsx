"use client";

import type { CSSProperties } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDownRight } from "lucide-react";
import { site, intro } from "@/lib/content";
import { MagicCircle } from "@/components/ui/MagicCircle";
import { Magnetic } from "@/components/ui/Magnetic";
import { Counter } from "@/components/ui/Counter";
import { cn } from "@/lib/utils";

/** The tagline's two beats: everything up to and including the dash, then
    the rest. (Not a lookbehind regex: older Safari cannot parse one, and a
    syntax error there takes the whole bundle with it.) */
const dash = site.tagline.indexOf("—");
const taglineBeats =
  dash < 0
    ? [site.tagline]
    : [site.tagline.slice(0, dash + 1), site.tagline.slice(dash + 1).trim()];

/** Entrance delay for a .hero-rise block (prologue.css). */
const rise = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * The first frame: one statement, said once.
 *
 * The name is the page's largest paint and it paints at the first frame. Its
 * entrance (the ink sweep, the rise of everything around it) is CSS that
 * starts with the paint, not framer waiting for hydration, so nothing above
 * the fold is server-rendered at opacity 0. While the intro is casting, the
 * same CSS holds the entrance paused and hides the landing targets (the name
 * lines, 剣 and 杖, the sigil) so the cast can deliver them.
 *
 * Each fact appears once: the role as an eyebrow, the tagline as the payoff
 * under the name, the owner's own intro line as the small print, and the
 * numbers as evidence that each link to where they come from.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // The headline drifts a little slower than the page and fades as it goes.
  // The sigil is deliberately not parallaxed: it is a landing target, and
  // the GL stage that replaces it owns its own motion.
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "38%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  // The two lines are inline spans with a <br>, not blocks. Chrome measures
  // a text paint per block container, so block lines would make each line
  // its own, smaller LCP candidate, and on a phone a four-line paragraph
  // outweighs half a name. Inline, the whole name is one paint: the h1.
  // The intro's flying name lines are inline spans too, so both ends of the
  // flight are measured the same way.
  const name = (
    <h1 className="wordmark h-display hero-ink w-fit text-fg max-sm:text-[12.4vw]">
      <span className="sr-only">{site.name}</span>
      <span aria-hidden data-cast-target="name-0">
        {site.nameLines[0]}
      </span>
      <br />
      <span aria-hidden data-cast-target="name-1">
        {site.nameLines[1]}
        <span className="hero-dot -ml-[0.04em] inline-block text-accent">.</span>
      </span>
    </h1>
  );

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-10 pt-24 sm:pt-32"
    >
      <div
        aria-hidden
        data-hero-scrim
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-bg/70 via-bg/20 to-bg"
      />
      <div
        aria-hidden
        data-hero-grid
        className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-60"
      />

      {/* The sigil slot. The intro's circle lands here at this box's real
          size, and the GL stage draws into it when it is running; the SVG
          circle is what shows when neither is. Offset right so it frames
          the headline rather than sitting behind it; on phones it bleeds
          off the top-right corner. */}
      <div
        aria-hidden
        data-stage-slot
        data-cast-target="sigil"
        className="pointer-events-none absolute -right-[46%] top-[7%] -z-10 h-[112vw] w-[112vw] md:-right-[6%] md:top-[6%] md:h-[min(58vw,720px)] md:w-[min(58vw,720px)]"
      >
        <MagicCircle
          className="stage-fallback h-full w-full max-md:opacity-50"
          points={7}
          seed={5}
        />
      </div>

      <div className="container-x relative">
        {/* Status row */}
        <div
          className="hero-rise mb-10 flex flex-wrap items-center justify-between gap-4"
          style={rise(0)}
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
        </div>

        {/* Name through stats: the text column the GL stage keeps clear of. */}
        <div data-stage-avoid>
          <motion.div style={{ y: titleY, opacity: fade }}>
            <p
              className="hero-rise eyebrow mb-4 max-sm:tracking-[0.14em] sm:mb-5"
              style={rise(60)}
            >
              {site.role}
            </p>

            {/* The katakana reading runs down beside the name, as a key
                visual sets a character's name, once the owner has given
                it. Until then this renders the name alone. */}
            {site.nameKana ? (
              <div className="h-display flex items-start gap-[0.12em] max-sm:text-[12.4vw]">
                {name}
                <span
                  aria-hidden
                  lang="ja"
                  className="jp vertical-jp hero-kana mt-[0.1em] text-[0.32em] leading-none text-[rgb(var(--accent-2)/0.8)]"
                >
                  {site.nameKana}
                </span>
              </div>
            ) : (
              name
            )}

            {/* The duality line — the site's thesis, stated once. The
                glyphs are where the intro's 剣 and 杖 land. */}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="flex items-center gap-2.5">
                <span
                  lang="ja"
                  data-cast-target="sword"
                  className="jp text-2xl leading-none text-green sm:text-3xl"
                >
                  {site.duality.green.jp}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {site.duality.green.label} · {site.duality.green.discipline}
                </span>
              </span>
              <span aria-hidden className="h-4 w-px bg-fg/20" />
              <span className="flex items-center gap-2.5">
                <span
                  lang="ja"
                  data-cast-target="wand"
                  className="jp text-2xl leading-none text-purple sm:text-3xl"
                >
                  {site.duality.purple.jp}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {site.duality.purple.label} · {site.duality.purple.discipline}
                </span>
              </span>
            </div>

            {/* The payoff: the name, answered in his own words. Set in its
                two beats, what he does and then what he is, broken at the
                dash. Each beat is its own block, which also keeps either
                one smaller than the name, so on a phone the name stays the
                largest thing painted (LCP is judged per block). A tagline
                without a dash renders as one block. */}
            <p
              className="hero-rise mt-7 max-w-[21em] font-serif text-[clamp(1.6rem,3.2vw,3rem)] italic leading-tight text-accent"
              style={rise(120)}
            >
              {taglineBeats.map((beat, i) => (
                <span key={i} className="block text-balance">
                  {beat}
                </span>
              ))}
            </p>

            <div className="mt-8 grid gap-8 border-t border-fg/[0.1] pt-6 sm:mt-10 sm:pt-8 md:grid-cols-12">
              {/* One sentence, broken by hand for the narrow desktop column.
                  On a phone those breaks just make a ragged edge, so the
                  <br>s only exist from md up. */}
              <p
                className="hero-rise text-pretty text-sm leading-relaxed text-muted md:col-span-5"
                style={rise(180)}
              >
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

              <div
                className="hero-rise hidden items-start md:col-span-2 md:col-start-11 md:flex md:justify-end"
                style={rise(240)}
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
                      aria-hidden
                      size={20}
                      className="text-fg transition-all duration-500 group-hover:rotate-45 group-hover:text-accent-ink"
                    />
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint transition-colors duration-500 group-hover:text-accent-ink">
                      Scroll
                    </span>
                  </a>
                </Magnetic>
              </div>
            </div>
          </motion.div>

          {/* The evidence. Number first, then what it counts, then where it
              comes from; and every figure links to the section that backs
              it, because a number nobody can check is just decoration. */}
          <div className="hero-rise mt-10 sm:mt-14" style={rise(300)}>
            <dl className="grid grid-cols-2 gap-y-10 border-t border-fg/[0.1] pt-10 sm:grid-cols-4 sm:gap-x-6">
              {intro.stats.map((stat, i) => (
                // dt must precede its dd in the DOM (axe: definition-list),
                // and a <p> is not allowed inside dl > div. The number still
                // reads first visually — `order` moves it, not the markup.
                // The link's ::after covers the whole cell, so the number is
                // as clickable as the label.
                <div
                  key={stat.label}
                  className={cn(
                    "group relative flex flex-col",
                    i > 0 && "sm:border-l sm:border-fg/[0.08] sm:pl-6",
                  )}
                >
                  <dt className="order-2 mt-3 text-sm font-medium text-fg">
                    <a
                      href={stat.href}
                      className="after:absolute after:inset-0 after:-m-2 after:rounded-sm focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
                    >
                      {stat.label}
                      <span
                        aria-hidden
                        className="ml-1.5 inline-block text-faint transition-[color,transform] duration-300 ease-expo group-hover:translate-x-0.5 group-hover:text-accent"
                      >
                        →
                      </span>
                    </a>
                  </dt>
                  <dd className="display order-1 text-5xl leading-none text-fg transition-colors duration-300 group-hover:text-accent sm:text-6xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </dd>
                  <dd className="order-3 mt-1 font-mono text-[11px] tracking-[0.04em] text-faint">
                    {stat.note}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
