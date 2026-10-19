'use client';

import { credits, favouriteAnime, hobbies } from '@/lib/content';
import { plateSrcForSeries } from '@/lib/plates';
import Image from 'next/image';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Who he is away from the coursework — and the season's ending.
 *
 * The five series are credited exactly once on the page, here, as ED credits:
 * each row carries its own section's data-palette, so the rank number picks up
 * that episode's accent automatically in both themes and under either 剣/杖
 * cast, without a colour being written down a second time.
 */
/** Episode slates, inline so the ED does not depend on episodes.ts. They
    must stay in step with it. */
const SLATES: Record<string, string> = {
  work: '第壱話',
  about: '第弐話',
  stack: '第参話',
  path: '第肆話',
  contact: '次回予告',
};

export function Hobbies() {
  return (
    <section
      id="hobby"
      data-palette="hobby"
      className="motif-field relative isolate scroll-mt-24 overflow-x-clip py-24 sm:py-36"
    >
      <div className="container-x">
        <SectionHeader index="05" label="Off the clock" jp="趣味" title={['What I do with', 'the rest of it']}>
          <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted">
            A portfolio only shows the output. This is the part that explains
            why any of it looks the way it does.
          </p>
        </SectionHeader>

        <div className="grid gap-px overflow-hidden border border-fg/[0.1] bg-fg/[0.08] sm:grid-cols-2 lg:grid-cols-3">
          {hobbies.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.05} className="h-full">
              <article className="group relative flex h-full flex-col bg-bg p-7 transition-colors duration-500 hover:bg-surface">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="display text-xl text-fg sm:text-2xl">
                    {h.title}
                  </h3>
                  <span
                    aria-hidden
                    className="jp shrink-0 text-lg text-accent-2/70"
                  >
                    {h.jp}
                  </span>
                </div>

                <p className="mt-4 flex-1 text-pretty text-sm leading-relaxed text-muted">
                  {h.blurb}
                </p>

                <ul className="mt-6 flex flex-wrap gap-1.5">
                  {h.tags.map((t) => (
                    <li
                      key={t}
                      className="border border-fg/[0.12] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint transition-colors group-hover:border-accent/30"
                    >
                      {t}
                    </li>
                  ))}
                </ul>

                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-accent to-accent2 transition-transform duration-700 ease-expo group-hover:scale-x-100"
                />
              </article>
            </Reveal>
          ))}
        </div>

        {/* The five the sections are built on, rolled as ending credits. */}
        <Reveal className="mt-20 border-t border-fg/[0.1] pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h3 className="display text-2xl text-fg sm:text-3xl">
              Top five anime
            </h3>
            <p className="max-w-md text-pretty font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              Each episode of this site is themed after one of them
            </p>
          </div>

          {/* The ED roll. Each row carries the artwork its episode is built
              on, so the plate and the series it comes from are read together
              — the sections no longer print the credit under their own art. */}
          <ol className="mt-7 border-t border-fg/[0.08]">
            {favouriteAnime.map((a, i) => {
              // Exact-title join, so a renamed series fails loudly here rather
              // than silently crediting the wrong studio.
              const credit = credits.series.find((c) => c.title === a.title);
              const src = plateSrcForSeries(a.title);
              const section = credit?.section.toLowerCase() ?? 'work';
              const slate = SLATES[section] ?? '';
              return (
                <li
                  key={a.title}
                  data-palette={section}
                  className="group border-b border-fg/[0.08] border-l-[3px] border-l-accent/70 py-5 pl-5 transition-colors duration-400 hover:bg-surface/60"
                >
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {src && (
                      <div
                        aria-hidden
                        className="relative h-20 w-16 shrink-0 overflow-hidden border border-fg/[0.08] bg-surface sm:h-24 sm:w-20"
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover grayscale-[0.4] transition duration-500 group-hover:grayscale-0"
                        />
                      </div>
                    )}
                    <span className="font-mono text-[11px] tabular-nums text-accent">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-pretty text-[15px] leading-snug text-fg">
                        {a.title}
                      </span>
                      <span className="mt-1 block text-[12px] text-faint">
                        <span aria-hidden className="jp">
                          {a.jp}
                        </span>
                        {credit && (
                          <>
                            <span aria-hidden className="mx-1.5">
                              ·
                            </span>
                            {credit.creator} · {credit.studio}
                          </>
                        )}
                      </span>
                    </span>
                    <a
                      href={`#${section}`}
                      className="link-underline shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-accent"
                    >
                      <span aria-hidden className="jp mr-2 normal-case tracking-normal">
                        {slate}
                      </span>
                      {credit?.section}
                    </a>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
