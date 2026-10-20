import Link from 'next/link';
import { MagicCircle } from '@/components/ui/MagicCircle';
import { NotFoundPath } from '@/components/ui/NotFoundPath';
import { nav, site } from '@/lib/content';

export const metadata = { title: 'Page not found' };

/**
 * 召喚失敗 — the summon that failed.
 *
 * A 404 on this site is a cast that did not take, so the page is the circle
 * that broke: the ring is open, the star never closes, nothing rotates. The
 * six section kanji ride the hexagram points as the way back in, which makes
 * the page a navigator rather than a dead end.
 *
 * It stays deliberately light — one static SVG and one tiny client component
 * for the path echo. Nobody should download the whole site to be told a URL
 * is wrong.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-5 py-20 text-center">
      <span className="eyebrow">Error 404</span>

      <div className="circle-gate mt-8 text-accent">
        <MagicCircle broken points={6} seed={404} className="h-full w-full" />

        {/* The six kanji on the hexagram points. Each is a real link, labelled
            in English for anything that does not read the glyph. */}
        {nav.map((item, i) => {
          const angle = (i / nav.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <Link
              key={item.href}
              href={`/${item.href}`}
              aria-label={item.label}
              className="circle-gate-node jp flex h-12 w-12 items-center justify-center rounded-full text-xl text-accent-2 transition-colors hover:text-accent"
              style={{
                marginLeft: `${Math.cos(angle) * 38}%`,
                marginTop: `${Math.sin(angle) * 38}%`,
              }}
            >
              <span aria-hidden>{item.jp[0]}</span>
            </Link>
          );
        })}

        {/* The slate sits in the still core of the circle. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="jp text-[clamp(2rem,9vw,3.5rem)] leading-none text-fg">
            召喚失敗
          </h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Summoning failed
          </p>
        </div>
      </div>

      <div className="mt-10">
        <NotFoundPath />
      </div>

      <p className="mt-5 max-w-sm text-pretty text-sm leading-relaxed text-muted">
        This page does not exist, or it did once and I moved it without
        leaving a forwarding address. The circle above still works.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-ink"
      >
        Back to {site.name.split(' ')[1]}&rsquo;s work
      </Link>
    </main>
  );
}
