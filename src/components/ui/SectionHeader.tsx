"use client";

import { TextReveal } from "@/components/ui/TextReveal";
import { SectionEmblem, type EmblemKind } from "@/components/ui/SectionEmblem";
import { SectionVisual } from "@/components/ui/SectionVisual";
import { type ArtKind } from "@/components/ui/SectionArt";
import { cn } from "@/lib/utils";

/**
 * Shared section header: index, English label, Japanese label, and a
 * green-to-purple rule. Keeping it in one place is what stops the six
 * sections from drifting apart visually.
 *
 * When `art` is given the header reserves a taller box, keeps its own text to
 * the left half, and hands the right half to the plate. The standfirst moves
 * under the heading rather than floating opposite it — it used to sit exactly
 * where the artwork now is.
 */
export function SectionHeader({
  index,
  label,
  jp,
  title,
  series,
  emblem,
  art,
  children,
  className,
}: {
  /** Section number. Pass an empty string for unnumbered sections. */
  index: string;
  label: string;
  jp: string;
  title: string | string[];
  /** The series this section is themed after, named so it is identifiable. */
  series?: string;
  emblem?: EmblemKind;
  /** Character plate for the right half of the header. */
  art?: { src?: string; fallback: ArtKind };
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative isolate mb-14 flex flex-col gap-6",
        art && "lg:min-h-[21rem]",
        className,
      )}
    >
      {art && <SectionVisual src={art.src} fallback={art.fallback} />}

      <div className={cn(art && "lg:max-w-[50%]")}>
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          {emblem && (
            <span className="h-7 w-7 shrink-0 text-accent">
              <SectionEmblem kind={emblem} />
            </span>
          )}
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            {index ? `( N° ${index.padStart(3, "0")} ) — ${label}` : label}
          </span>
          <span aria-hidden className="h-px w-8 bg-accent/60" />
          <span aria-hidden className="font-serif text-base text-accent-2">
            {jp}
          </span>
          {series && (
            <span className="rounded-full border border-accent/35 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
              {series}
            </span>
          )}
        </div>

        {/* The second line drops into italic serif — the one typographic move
            that carries the most weight, and the same one CarbonZero uses. */}
        <TextReveal
          as="h2"
          text={title}
          className="display h-section text-accent"
          lineClassNames={{
            1: "font-serif font-normal italic tracking-[-0.01em]",
          }}
        />

        {children && <div className="mt-6">{children}</div>}
      </div>

      <div aria-hidden className="duality-rule mt-auto h-px w-full" />
    </header>
  );
}
