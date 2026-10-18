'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Github } from 'lucide-react';
import type { Project } from '@/lib/content';
import { capturedAt, numerals, shots } from '@/lib/work';
import { Pipeline } from '@/components/work/Pipeline';
import { LiveFacade, LiveFacadeMobile } from '@/components/work/LiveFacade';
import { cn } from '@/lib/utils';

/**
 * The bench is the heaviest thing on the page and most visitors never reach
 * it, so its chunk is not in the first load. It mounts once the spread is
 * within 600px of the viewport — far enough ahead that it is ready by the
 * time it is read, late enough that a phone scrolling past Work never pays
 * for it.
 */
const PipelineBench = dynamic(() => import('@/components/work/PipelineBench'), {
  ssr: false,
  loading: () => (
    <p className="mt-5 font-mono text-[11px] text-faint">Loading the bench…</p>
  ),
});

/** The clipped corner is the grimoire's cut page. */
const PAGE_CLIP = 'polygon(0 0,100% 0,100% 86%,90% 100%,0 100%)';

export function Spread({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) {
  // Odd spreads mirror, so the book alternates sides the way a real one does.
  const mirrored = index % 2 === 1;
  const status = project.links.live
    ? 'Live on Vercel'
    : 'Desktop app · no public build';

  const page =
    project.id === 'pictotrack' ? (
      <PictoTrackPage />
    ) : shots[project.id]?.length ? (
      <CaptureSheet project={project} />
    ) : null;

  return (
    <article
      data-spread
      className="grid grid-cols-1 gap-y-10 border-t border-fg/10 py-16 sm:py-20 lg:grid-cols-12 lg:gap-x-8"
    >
      {/* Numeral */}
      <div
        className={cn(
          'flex items-start gap-4 lg:col-span-1 lg:block',
          mirrored ? 'lg:order-3 lg:text-right' : 'lg:order-1',
        )}
      >
        <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint lg:block">
          N° {String(index + 1).padStart(2, '0')}
        </span>
        <span
          aria-hidden
          className="jp block text-[clamp(4rem,8vw,8rem)] leading-none text-accent lg:mt-1"
        >
          {numerals[index] ?? numerals[0]}
        </span>
      </div>

      {/* Title block */}
      <div
        className={cn(
          'lg:col-span-6',
          mirrored ? 'lg:order-2' : 'lg:order-2',
        )}
      >
        <h3 className="display display-cond text-[clamp(3.5rem,9vw,9rem)] leading-[.84] text-fg">
          {project.title}
        </h3>
        <p className="mt-3 font-serif text-[clamp(1.25rem,2.4vw,2rem)] italic leading-tight text-accent">
          {project.subtitle}
        </p>

        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 font-mono text-[11px] uppercase tracking-[0.14em]">
          {[
            ['Year', project.year],
            ['Role', project.role],
            ['Context', project.category],
            ['Status', status],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="text-faint">{term}</dt>
              <dd className="mt-1 text-fg">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 max-w-prose text-pretty text-base leading-relaxed text-muted">
          {project.summary}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-ink"
          >
            Read the case study
          </button>
          {project.links.live && (
            <a
              href={project.links.live}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-fg/20 px-5 py-2.5 text-sm text-fg transition-colors hover:border-accent hover:text-accent"
            >
              Live site
              <ArrowUpRight
                size={15}
                aria-hidden
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </a>
          )}
          {project.links.repo && (
            <a
              href={project.links.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-fg/20 px-5 py-2.5 text-sm text-fg transition-colors hover:border-accent hover:text-accent"
            >
              <Github size={15} aria-hidden />
              Source
            </a>
          )}
        </div>
      </div>

      {/* Page */}
      <div
        className={cn('lg:col-span-5', mirrored ? 'lg:order-1' : 'lg:order-3')}
      >
        {page}
      </div>
    </article>
  );
}

/**
 * The captures, overlapped like proof sheets on a desk. Explicit width and
 * height on both so the layout never jumps while they decode.
 */
function CaptureSheet({ project }: { project: Project }) {
  const sheet = shots[project.id];
  const [first, second] = sheet;

  return (
    <figure className="relative">
      <div className="relative">
        <Image
          src={first.src}
          width={first.w}
          height={first.h}
          alt={first.alt}
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="w-full border border-accent/40"
          style={{ clipPath: PAGE_CLIP }}
        />

        {/* The second sheet slides out from under the first. Hidden on phones:
            at 390px it would cover the one capture that matters. */}
        {second && (
          <Image
            src={second.src}
            width={second.w}
            height={second.h}
            alt={second.alt}
            sizes="30vw"
            className="absolute hidden w-[62%] border border-accent/40 shadow-[0_24px_60px_-20px_rgb(0_0_0_/_0.6)] lg:block"
            style={{
              clipPath: PAGE_CLIP,
              right: -32,
              bottom: -56,
            }}
          />
        )}
      </div>

      <figcaption className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-faint lg:mt-20">
        carbon-footprint-calc-v5.vercel.app · captured {capturedAt}
      </figcaption>

      {project.links.live && (
        <>
          <LiveFacade url={project.links.live} title={project.title} />
          <LiveFacadeMobile url={project.links.live} />
        </>
      )}
    </figure>
  );
}

/** The lane diagram, and under it the bench that actually runs the fallback. */
function PictoTrackPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <Pipeline project="pictotrack" />
      {near && <PipelineBench />}
    </div>
  );
}
