"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { TextReveal } from "@/components/ui/TextReveal";
import { KanjiWrite } from "@/components/ui/KanjiWrite";
import { MagicCircle } from "@/components/ui/MagicCircle";
import { type EmblemKind } from "@/components/ui/SectionEmblem";
import {
  SectionVisual,
  SectionVisualMobile,
} from "@/components/ui/SectionVisual";
import { type ArtKind } from "@/components/ui/SectionArt";
import { episodeFor } from "@/lib/episodes";
import { credits, nav } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The series a numbered section is themed after, read from the credits so the
 * footer rule names it without every section having to pass it in.
 */
function seriesFor(index: string) {
  const label = nav.find((n) => n.index === index)?.label;
  return credits.series.find((s) => s.section === label)?.title;
}

/**
 * An episode title card. Every section opens on one, the way each episode of
 * a season opens on its own card, so the cards are what break the page into
 * episodes now — not tickers, emblems or pills.
 *
 * Anatomy, at lg on a 12-column grid:
 *
 *   ┌ slate · hairline · EPISODE 01 — LABEL ┐┌──── plate ────┐┌ 作 ┐
 *   │                                        │  (cols 6–10)   ││    │
 *   │                                        └────────────────┘│ 品 │
 *   │ Things I have          ← condensed ink, in --fg          │    │
 *   │    built so far        ← italic serif answer, in accent  └────┘
 *   ├─────────────────────── duality rule ─────────────────────────────┤
 *   ( N° 001 ) · Black Clover                          │ standfirst
 *
 * The heading is no longer all accent: the ink line carries the weight in the
 * page's foreground colour and the italic line answers it in the section's
 * colour, which is what lets the accent read as an accent.
 *
 * Below lg it stacks — slate, heading, plate, footer — and the kanji moves
 * into the right gutter behind the heading at 30vw. It is ONE KanjiWrite in
 * both layouts, re-placed by classes, because a second display:none copy
 * would never scroll into view and never finish writing.
 *
 * The English <h2> carries all the semantics; the slate repeats the kicker in
 * Japanese and the kanji repeats the label, so both are aria-hidden.
 *
 * data-stage-slot marks where the GL stage lands its formation for this
 * section, and data-stage-avoid marks text the stage must keep dark behind.
 *
 * `emblem` is still accepted so existing callers compile, but the episode
 * card replaced the emblem and it is not rendered.
 */
export function SectionHeader({
  index,
  label,
  jp,
  title,
  series,
  art,
  children,
  className,
  size = "mega",
}: {
  /** Section number. Pass an empty string for unnumbered sections. */
  index: string;
  label: string;
  jp: string;
  title: string | string[];
  /** The series this section is themed after. Defaults to the credits entry
   *  for this section, then to the label. */
  series?: string;
  /** Superseded by the episode card; accepted for compatibility only. */
  emblem?: EmblemKind;
  /** Character plate for the card. */
  art?: { src?: string; fallback: ArtKind; credit?: boolean };
  /** The standfirst, set against the footer rule. */
  children?: React.ReactNode;
  className?: string;
  /** mega — a full title card (default). section — the same card at the
   *  older section-heading size, without the near-full-screen height. */
  size?: "mega" | "section";
}) {
  const episode = index ? episodeFor(index) : undefined;
  const credit = series ?? (index ? seriesFor(index) : undefined) ?? label;
  const mega = size === "mega";

  // Same trigger and margin as TextReveal, so the tracking settle in
  // type.css starts on the frame the lines start to rise.
  const headingRef = useRef<HTMLDivElement>(null);
  const headingIn = useInView(headingRef, {
    once: true,
    margin: "0px 0px -12% 0px",
  });

  return (
    <header
      className={cn(
        "relative isolate mb-16 grid grid-cols-12 gap-x-6",
        mega && "lg:min-h-[min(88svh,52rem)]",
        "lg:grid-rows-[auto_1fr_auto_auto]",
        className,
      )}
    >
      {/* Slate row. On a phone the slate and kicker stack, which is how the
          card reads at 390px beside the kanji gutter. */}
      <div className="relative z-10 col-span-full flex flex-col items-start gap-3 lg:col-[1/7] lg:row-start-1 lg:flex-row lg:items-center lg:gap-5">
        {episode && (
          <>
            <span
              aria-hidden
              className="jp text-[clamp(1.6rem,2.4vw,2.25rem)] leading-none text-accent-2"
            >
              {episode.slate}
            </span>
            <span aria-hidden className="hidden h-px w-12 bg-accent lg:block" />
          </>
        )}
        {/* Uppercased in the text itself, not with text-transform, so the
            kicker reads the same to anything that takes textContent. */}
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          {(episode ? `${episode.kicker} — ${label}` : label).toUpperCase()}
        </p>
      </div>

      {/* The kanji. A column at lg; a 30vw gutter behind the heading below.

          It is held well back on a phone. In the gutter the ink sits directly
          under the italic answer line, and both are the section's accent — at
          full strength the red kanji and the red serif cancel each other and
          the headline stops being readable. At lg the kanji has its own
          column and nothing crosses it, so it plays at full strength. */}
      {jp && (
        <div
          aria-hidden
          data-stage-avoid="soft"
          className="pointer-events-none absolute right-0 top-0 z-0 w-[30vw] opacity-[0.38] lg:relative lg:col-[11/13] lg:row-[1/4] lg:w-auto lg:self-start lg:opacity-100"
        >
          <KanjiWrite text={jp} size="gutter" className="w-full" />
        </div>
      )}

      <div
        ref={headingRef}
        data-stage-avoid
        data-settle={headingIn ? "in" : "out"}
        className="relative z-10 col-span-full mt-8 lg:col-[1/9] lg:row-start-3 lg:mt-12 lg:self-end"
      >
        <TextReveal
          as="h2"
          text={title}
          className={cn(
            "display-cond",
            mega
              ? "h-mega max-lg:!text-[clamp(3.4rem,17.5vw,7rem)]"
              : "h-section",
          )}
          lineClassNames={{
            0: "text-fg",
            1: "pl-[0.42em] font-serif font-normal italic tracking-[-0.01em] text-accent",
          }}
        />
      </div>

      {/* Plate slot. print-plates' SectionVisual and SectionVisualMobile fill
          their parent's width, so this box is what places them.

          The min-height is a floor, not a frame: it reserves the middle of
          the card so the composition holds even while the plate inside is
          still the pre-rebuild absolutely-positioned SectionVisual, and a
          taller plate is free to push past it. Without it the slot measures
          zero and the card opens on a hole where the character should be. */}
      <div
        data-stage-slot
        className="relative col-span-full mt-10 lg:col-[6/11] lg:row-[1/3] lg:mt-0 lg:min-h-[min(42svh,22rem)] lg:self-start"
      >
        {art ? (
          <>
            <SectionVisual
              src={art.src}
              fallback={art.fallback}
              credit={art.credit}
            />
            <SectionVisualMobile src={art.src} credit={art.credit} />
          </>
        ) : (
          // No plate (the Hobby ED): a quiet sigil where the GL aperture
          // forms, and the no-GL fallback for it.
          <div aria-hidden className="relative aspect-[3/2] text-accent">
            <MagicCircle
              className="stage-fallback h-full w-full opacity-40"
              points={6}
              seed={9}
              glyphs={false}
            />
          </div>
        )}
      </div>

      <div className="col-span-full mt-12 lg:col-[1/13] lg:row-start-4">
        <div aria-hidden className="duality-rule h-px w-full" />
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            {index ? `( N° ${index.padStart(3, "0")} ) · ${credit}` : credit}
          </p>
          {children && (
            <div
              data-stage-avoid
              className="max-w-sm border-l border-accent/40 pl-4 text-sm text-muted"
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
