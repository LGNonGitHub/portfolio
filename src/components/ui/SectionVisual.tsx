'use client';

import Image from 'next/image';
import { SectionArt, type ArtKind } from '@/components/ui/SectionArt';
import { cn } from '@/lib/utils';

/**
 * The artwork panel on the right of each section.
 *
 * Supplied artwork wins; the drawn SectionArt is the fallback, so pulling an
 * image out never leaves a hole. Either way the panel is decorative — the
 * series is already named in the header beside it, so the image carries empty
 * alt rather than repeating that to a screen reader.
 *
 * Two things keep it from fighting the page. A left-and-bottom mask dissolves
 * the hard rectangle edge into the background, and a scrim tinted to the live
 * accent sits on top, so a dark plate like Black Clover and a white plate like
 * Wistoria both settle into the same light page.
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
  if (!src) {
    return (
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute right-[-6%] top-1/2 -z-10 hidden h-[min(78vh,620px)] w-[min(46vw,520px)] -translate-y-1/2 text-accent opacity-[0.55] lg:block',
          className,
        )}
      >
        <SectionArt kind={fallback} />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[min(68%,980px)] lg:block',
        className,
      )}
    >
      <div
        className="relative h-full w-full"
        style={{
          WebkitMaskImage:
            'linear-gradient(to left, rgba(0,0,0,1) 22%, rgba(0,0,0,0) 78%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 16%, rgba(0,0,0,1) 84%, rgba(0,0,0,0) 100%)',
          WebkitMaskComposite: 'source-in',
          maskImage:
            'linear-gradient(to left, rgba(0,0,0,1) 22%, rgba(0,0,0,0) 78%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 16%, rgba(0,0,0,1) 84%, rgba(0,0,0,0) 100%)',
          maskComposite: 'intersect',
        }}
      >
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 68vw, 0px"
          className="object-cover object-center opacity-[0.88]"
          priority={false}
        />

        {/* Scrim in the section's own colour, so every plate reads as one system */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to left, rgb(var(--accent) / 0.14), rgb(var(--accent-2) / 0.08) 55%, rgb(var(--bg) / 0.4) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'rgb(var(--bg) / 0.12)' }}
        />
      </div>
    </div>
  );
}
