"use client";

import { useEffect, useRef } from "react";
import { site, nav } from "@/lib/content";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useClock, useRuntime } from "@/hooks/useRuntime";
import { scrollY, subscribe } from "@/lib/frame";

function Cell({
  label,
  value,
  valueRef,
}: {
  label: string;
  value: string;
  valueRef?: React.Ref<HTMLSpanElement>;
}) {
  return (
    <span className="flex shrink-0 items-baseline gap-1.5">
      <span className="text-faint">{label}</span>
      <span ref={valueRef} className="text-accent">
        {value}
      </span>
    </span>
  );
}

/**
 * The instrument strip above the nav.
 *
 * Every figure on it is live and real — the clock ticks, the section readout
 * is the same store the palette and the nav pill read, the depth is actual
 * scroll progress. Nothing here is decoration pretending to be data.
 *
 * Desktop only, and below 1024px it is not mounted at all (it used to be
 * display:none and keep ticking), so phones pay nothing for it.
 */
export function Telemetry() {
  const shown = useMediaQuery("(min-width: 1024px)");
  return shown ? <Strip /> : null;
}

function Strip() {
  const clock = useClock();
  const section = useRuntime((s) => s.section);
  const depthRef = useRef<HTMLSpanElement>(null);

  // On the hero (or a page with no sections, like the 404) the honest reading
  // is the prologue, not "01 Work".
  const hit = nav.find((n) => n.href === `#${section}`);
  const reading = hit ? `${hit.index} ${hit.jp} ${hit.label}` : "00 序 PROLOGUE";

  // Depth is written straight into the text node from the frame ticker, so
  // scrolling never re-renders this component.
  useEffect(() => {
    let max = 1;
    let shownDepth = -1;
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      shownDepth = -1;
    };
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    measure();

    const unsubscribe = subscribe(() => {
      const depth = Math.min(100, Math.max(0, Math.round((scrollY() / max) * 100)));
      // Write the existing text node, not textContent: React still owns it.
      const text = depthRef.current?.firstChild;
      if (depth === shownDepth || !text) return;
      shownDepth = depth;
      text.nodeValue = `${String(depth).padStart(2, "0")}%`;
    });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      unsubscribe();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex h-7 items-center overflow-hidden border-b border-fg/[0.07] bg-bg/80 backdrop-blur-md"
    >
      <div className="container-x flex w-full items-center gap-x-5 font-mono text-[10px] uppercase tracking-[0.14em]">
        <span className="flex shrink-0 items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span className="text-muted">{site.locationShort}</span>
          <span className="text-faint">{site.coords}</span>
        </span>

        <span className="h-3 w-px shrink-0 bg-fg/10" />
        <Cell label="Local" value={`${clock || "--:--:--"} IST`} />
        <span className="h-3 w-px shrink-0 bg-fg/10" />
        <Cell label="Section" value={reading} />
        <span className="h-3 w-px shrink-0 bg-fg/10" />
        <Cell label="Depth" value="00%" valueRef={depthRef} />

        <span className="ml-auto hidden shrink-0 items-center gap-5 xl:flex">
          <span className="h-3 w-px bg-fg/10" />
          <Cell label="Build" value={site.build} />
        </span>
      </div>
    </div>
  );
}
