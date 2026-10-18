'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

/**
 * "Boot the live site here" — the captures are proof the site existed on a
 * given date; this is proof it still runs. It never auto-loads: a third-party
 * iframe on every page view would cost a cold Vercel start and a pile of
 * requests nobody asked for, so the visitor opts in with a click.
 *
 * Desktop only. A 1440-wide app squeezed into a phone column is unreadable,
 * so below lg this degrades to an honest outside link.
 */
export function LiveFacade({ url, title }: { url: string; title: string }) {
  const [booted, setBooted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // The iframe renders at a 1440x900 virtual desktop and is scaled down to the
  // figure's width, so the live app lays out as it would on a real desktop
  // instead of collapsing into its own mobile breakpoint.
  useEffect(() => {
    if (!booted) return;
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / 1440);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [booted]);

  // If it has not painted in 8 s, assume it will not: restore the captures and
  // offer the tab instead of leaving a white rectangle on the page.
  useEffect(() => {
    if (!booted || loaded) return;
    const id = window.setTimeout(() => setTimedOut(true), 8_000);
    return () => window.clearTimeout(id);
  }, [booted, loaded]);

  if (timedOut) {
    return (
      <p className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
        The live site did not answer in time.
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-accent underline underline-offset-4"
        >
          Open in a new tab <ArrowUpRight size={13} aria-hidden />
        </a>
      </p>
    );
  }

  if (!booted) {
    return (
      <div className="mt-4 hidden lg:block">
        <button
          type="button"
          onClick={() => setBooted(true)}
          className="inline-flex items-center gap-2 rounded-full border border-accent/50 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent hover:text-accent-ink"
        >
          Boot the live site here
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 hidden lg:block">
      <div
        ref={boxRef}
        className="relative w-full overflow-hidden border border-accent/40 bg-bg"
        style={{ height: 900 * scale }}
      >
        <iframe
          title="CarbonZero, live"
          src={url}
          onLoad={() => setLoaded(true)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer"
          style={{
            width: 1440,
            height: 900,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setBooted(false);
            setLoaded(false);
          }}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-fg"
        >
          Close
        </button>
        <span className="font-mono text-[11px] text-faint">
          {title} running live, embedded from its own deployment
        </span>
      </div>
    </div>
  );
}

/** Below lg the facade is just a link; there is no room to embed a desktop app. */
export function LiveFacadeMobile({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accent underline underline-offset-4 lg:hidden"
    >
      Open CarbonZero <ArrowUpRight size={13} aria-hidden />
    </a>
  );
}
