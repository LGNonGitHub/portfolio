"use client";

import { useEffect, useState } from "react";
import { site, nav } from "@/lib/content";

/**
 * The instrument strip above the nav.
 *
 * Every figure on it is live and real — the clock ticks, the section readout
 * follows the same observer the theme does, the depth is actual scroll
 * progress. Nothing here is decoration pretending to be data.
 */
export function Telemetry() {
  const [clock, setClock] = useState("");
  const [depth, setDepth] = useState(0);
  const [section, setSection] = useState<(typeof nav)[number]>(nav[0]);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setDepth(
          max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0,
        );
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    // Same centre-line rule the section theming uses, so the readout and the
    // palette can never disagree about which section you are in.
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const hit = nav.find((n) => n.href === `#${e.target.id}`);
          if (hit) setSection(hit);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    nav.forEach((n) => {
      const el = document.querySelector(n.href);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const Cell = ({ label, value }: { label: string; value: string }) => (
    <span className="flex shrink-0 items-baseline gap-1.5">
      <span className="text-faint">{label}</span>
      <span className="text-accent">{value}</span>
    </span>
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 hidden h-7 items-center overflow-hidden border-b border-fg/[0.07] bg-bg/80 backdrop-blur-md lg:flex"
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
        <Cell label="Local" value={`${clock} IST`} />
        <span className="h-3 w-px shrink-0 bg-fg/10" />
        <Cell label="Section" value={`${section.index} ${section.label}`} />
        <span className="h-3 w-px shrink-0 bg-fg/10" />
        <Cell label="Depth" value={`${String(depth).padStart(2, "0")}%`} />

        <span className="ml-auto hidden shrink-0 items-center gap-5 xl:flex">
          <span className="h-3 w-px bg-fg/10" />
          <Cell label="Build" value={site.build} />
        </span>
      </div>
    </div>
  );
}
