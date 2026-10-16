"use client";

import Image from "next/image";
import { SectionArt, type ArtKind } from "@/components/ui/SectionArt";
import { cn } from "@/lib/utils";

/**
 * Natural size of each plate, so the <img> box can be the art itself.
 *
 * With `fill` the element box is the whole slot and the fade mask is measured
 * against that box, not the picture inside it — a portrait plate then gets a
 * hard vertical edge where the letterboxing starts. Sizing the image to its
 * own aspect ratio makes the mask hug the art whatever shape it is.
 */
const DIMS: Record<string, { w: number; h: number }> = {
  "/art/work.webp": { w: 1400, h: 952 },
  "/art/about.webp": { w: 900, h: 1000 },
  "/art/stack.webp": { w: 1120, h: 1260 },
  "/art/path.webp": { w: 1400, h: 944 },
  "/art/contact.webp": { w: 1400, h: 920 },
};

/** Feathered on all four sides so the plate belongs to the page. */
const FADE =
  "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%), " +
  "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 86%, rgba(0,0,0,0) 100%)";

/**
 * Section artwork, filling the right half of the section header.
 *
 * It is positioned against the <header> rather than the <section>, which is
 * the point: a header is a fixed box with the heading on its left and dead
 * space on its right, so the plate can never reach the content below. Two
 * earlier versions positioned it against the section and were first covered
 * by the project grid, then ran over the standfirst and the timeline tags.
 *
 * Bottom-aligned and never cropped — these are character plates, and cropping
 * one to fill a box tends to behead somebody.
 *
 * Decorative — the section is already named in text beside it — so empty alt.
 */
export function SectionVisual({
  src,
  fallback,
  className,
}: {
  src?: string;
  fallback: ArtKind;
  className?: string;
}) {
  const slot = cn(
    "pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[min(48%,600px)] lg:block",
    className,
  );

  const dims = src ? DIMS[src] : undefined;

  if (!src || !dims) {
    return (
      <div aria-hidden className={cn(slot, "text-accent opacity-50")}>
        <SectionArt kind={fallback} />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(slot, "lg:flex lg:items-end lg:justify-end")}
    >
      <div className="relative h-full">
        <Image
          src={src}
          alt=""
          width={dims.w}
          height={dims.h}
          sizes="(min-width: 1024px) 600px, 0px"
          className="h-full w-auto max-w-full object-contain opacity-[0.82]"
          style={{
            WebkitMaskImage: FADE,
            WebkitMaskComposite: "source-in",
            maskImage: FADE,
            maskComposite: "intersect",
          }}
          priority={false}
        />
      </div>
    </div>
  );
}

/**
 * The same plate for phones, where the header has no spare right half.
 *
 * It sits in the flow under the heading, right-aligned, and is pulled up a
 * little so it overlaps the end of the text block rather than adding a full
 * band of height. Whole figure, never cropped: the image keeps its own ratio
 * via max-width/max-height with auto sizes (which preserve aspect ratio on a
 * replaced element), so the fade mask hugs the art at any orientation.
 */
export function SectionVisualMobile({
  src,
  className,
}: {
  src?: string;
  className?: string;
}) {
  const dims = src ? DIMS[src] : undefined;
  if (!src || !dims) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative -z-10 -mt-10 flex h-[210px] items-end justify-end sm:h-[260px] lg:hidden",
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        width={dims.w}
        height={dims.h}
        sizes="(min-width: 1024px) 0px, 80vw"
        className="h-auto max-h-full w-auto max-w-[80%] opacity-80"
        style={{
          WebkitMaskImage: FADE,
          WebkitMaskComposite: "source-in",
          maskImage: FADE,
          maskComposite: "intersect",
        }}
      />
    </div>
  );
}
