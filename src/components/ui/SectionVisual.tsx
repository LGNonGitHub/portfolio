"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { useInView } from "framer-motion";
import { SectionArt, type ArtKind } from "@/components/ui/SectionArt";
import {
  creditFor,
  plateFor,
  ratioValue,
  type PlateConfig,
} from "@/lib/plates";
import { cn } from "@/lib/utils";

/**
 * Character plates, printed rather than pasted.
 *
 * Every plate goes through the same process: a manga panel with one corner
 * cut off and a keyline, a duotone pass in the section's ink, the full-colour
 * plate cut in over it with that series' own shape, and a halftone screen on
 * top. The old version faded a white-ground rectangle into the page at 0.82
 * opacity, which is exactly what made it look stuck on; a hard panel edge
 * owns the fact that it is a picture. All the drawing is CSS (plates.css),
 * so the only script here is one IntersectionObserver per plate.
 *
 * Both exports render an in-flow block that fills its parent's width. The
 * parent decides where it goes.
 */

type PlateState = "static" | "idle" | "revealed";

/** Matches Tailwind's `lg`, which is where the two variants hand over. */
const LG = "(min-width: 1024px)";

function subscribeLg(onChange: () => void) {
  const mql = window.matchMedia(LG);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * `null` until hydrated, then whether we are at `lg` or wider.
 *
 * The server cannot know the viewport, so both variants are in the HTML and
 * CSS shows the right one. Once the client knows, the hidden copy unmounts,
 * which keeps one figure, one caption and one pair of images per plate in
 * the live DOM instead of two.
 */
function useIsLg(): boolean | null {
  return useSyncExternalStore(
    subscribeLg,
    () => window.matchMedia(LG).matches,
    () => null,
  );
}

function stillRequested() {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.motion === "still"
  );
}

/** Share of the element's box that is inside the viewport, 0–1. */
function visibleFraction(el: Element) {
  const r = el.getBoundingClientRect();
  const area = r.width * r.height;
  if (!area) return 0;
  const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
  const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  return (Math.max(0, w) * Math.max(0, h)) / area;
}

/**
 * The reveal, as a three-value attribute the CSS reads.
 *
 * The server sends `static` — the finished, full-colour plate — so first paint
 * and no-JS are both correct and nothing waits on hydration. Only after mount
 * does a plate that is still off-screen drop to `idle` (duotone, colour plate
 * clipped away), and it cuts in when 40% of it is visible. A plate that is
 * already on screen at mount, the hidden copy for the other breakpoint, and
 * anyone who asked for less motion all stay `static`: re-hiding something
 * the visitor is already looking at would be a flash, not a reveal.
 */
function usePlateState(ref: React.RefObject<HTMLElement | null>) {
  const [state, setState] = useState<PlateState>("static");
  const inView = useInView(ref, { once: true, amount: 0.4 });

  useEffect(() => {
    const el = ref.current;
    if (!el || stillRequested()) return;
    if (el.getClientRects().length === 0) return;
    if (visibleFraction(el) >= 0.4) return;
    setState("idle");
  }, [ref]);

  useEffect(() => {
    if (inView) setState((s) => (s === "idle" ? "revealed" : s));
  }, [inView]);

  return state;
}

type PlateProps = {
  src?: string;
  /** Drawn in the same panel when there is no artwork for this section. */
  fallback?: ArtKind;
  className?: string;
  /** The `sizes` hint for next/image; the variants pass their own. */
  sizes?: string;
};

/**
 * A single plate with no breakpoint opinion. SectionVisual and
 * SectionVisualMobile are this, shown above and below `lg`.
 */
export function Plate({ src, fallback, className, sizes, credit = true }: PlateProps & { credit?: boolean }) {
  const config = plateFor(src);

  if (!src || !config) {
    return fallback ? (
      <FallbackPlate kind={fallback} className={className} />
    ) : null;
  }

  return (
    <PrintedPlate
      src={src}
      config={config}
      className={className}
      sizes={sizes ?? "100vw"}
      credit={credit}
    />
  );
}

function PrintedPlate({
  src,
  config,
  className,
  sizes,
  credit: printCredit = true,
}: {
  src: string;
  config: PlateConfig;
  className?: string;
  sizes: string;
  /** False where the attribution is carried elsewhere on the page. */
  credit?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const state = usePlateState(ref);
  const credit = creditFor(config.series);

  const vars = {
    "--ar": config.ratio.replace("/", " / "),
    "--ratio": ratioValue(config.ratio),
    ...(config.irisAt ? { "--iris": config.irisAt } : null),
  } as CSSProperties;

  // Both layers ask for the same file at the same size, so the browser
  // fetches it once and paints it twice.
  const image = (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      className="object-cover"
      style={{ objectPosition: config.focus }}
    />
  );

  return (
    <figure
      ref={ref}
      data-plate=""
      data-section={config.section}
      data-ground={config.ground}
      data-cut={config.cut}
      data-state={state}
      className={cn("plate-figure", className)}
      style={vars}
    >
      <div className="plate">
        <div className="plate-duo">{image}</div>
        <div className="plate-colour">{image}</div>
        <PlateKeyline />
      </div>

      {/* Visible attribution, so the figure is deliberately not aria-hidden:
          the art is decorative (alt="") but whose art it is is not. A section
          may drop it (credit={false}) only where the same attribution is
          printed elsewhere on the page — the Hobby list credits all five. */}
      {printCredit && (
      <figcaption className="plate-caption mt-2 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
        {credit ? (
          <>
            {credit.title}{" "}
            <span className="jp" lang="ja">
              {credit.jp}
            </span>{" "}
            — {credit.creator} · {credit.studio}
          </>
        ) : (
          config.series
        )}
      </figcaption>
      )}
    </figure>
  );
}

/**
 * The panel's outline, drawn as a polygon that matches the clip-path corner
 * for corner. non-scaling-stroke keeps it a true 2px at any panel size, and
 * since the stroke is centred on the clip edge, half of it is clipped and a
 * crisp 1px line is what shows.
 */
function PlateKeyline() {
  return (
    <svg
      className="plate-keyline"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      <polygon
        points="0,0 100,0 100,86 90,100 0,100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * No artwork for this section: the original SectionArt geometry, in the same
 * cut panel so the page rhythm is unchanged. It names no one, so there is no
 * caption and it is hidden from assistive tech.
 */
function FallbackPlate({
  kind,
  className,
}: {
  kind: ArtKind;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      data-plate-fallback=""
      className={cn("plate-figure", className)}
      style={{ "--ar": "4 / 5", "--ratio": 0.8 } as CSSProperties}
    >
      <div className="plate plate-fallback text-accent">
        <div className="absolute inset-0 opacity-50">
          <SectionArt kind={kind} />
        </div>
        <PlateKeyline />
      </div>
    </div>
  );
}

/**
 * The plate from `lg` up. In the episode header it sits in the plate slot;
 * the slot sets the width, the plate caps its own height at 52vh.
 *
 * `sizes` is the desktop slot width (at most 42vw) or the 52vh height cap
 * times the ratio, whichever binds first — so a portrait plate does not pull
 * a landscape-sized file.
 */
export function SectionVisual({
  src,
  fallback,
  className,
  credit = true,
}: {
  src?: string;
  fallback: ArtKind;
  className?: string;
  credit?: boolean;
}) {
  const lg = useIsLg();
  if (lg === false) return null;

  const config = plateFor(src);
  const cap = config ? Math.round(52 * ratioValue(config.ratio)) : 42;

  return (
    <Plate
      src={src}
      fallback={fallback}
      className={cn("hidden lg:block", className)}
      sizes={`${LG} min(42vw, ${cap}vh), 1px`}
      credit={credit}
    />
  );
}

/**
 * The same plate below `lg`: full width under the heading, each with its own
 * ratio and focal crop, and the credit wrapping beneath. Nothing is drawn
 * when there is no artwork — phones do not need the fallback geometry.
 */
export function SectionVisualMobile({
  src,
  className,
  credit = true,
}: {
  src?: string;
  className?: string;
  credit?: boolean;
}) {
  const lg = useIsLg();
  if (lg === true) return null;
  if (!plateFor(src)) return null;

  return (
    <Plate
      src={src}
      className={cn("lg:hidden", className)}
      sizes={`${LG} 1px, 100vw`}
      credit={credit}
    />
  );
}
