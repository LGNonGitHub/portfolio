'use client';

import { favouriteAnime, hobbies } from '@/lib/content';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Who he is away from the coursework. Also the one place the five series are
 * named — the sections themselves are themed after them but say nothing,
 * which is the right way round: the look should land before the reference does.
 */
export function Hobbies() {
  return (
    <section
      id="hobby"
      className="motif-field relative isolate scroll-mt-24 overflow-hidden py-24 sm:py-36"
    >
      <div className="container-x">
        <SectionHeader index="05" label="Off the clock" jp="趣味" title="What I do with the rest of it">
          <p className="max-w-xs rounded-lg bg-bg/70 p-3 text-pretty text-sm leading-relaxed text-muted backdrop-blur-sm">
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

        {/* The five the sections are built on */}
        <Reveal className="mt-20 border-t border-fg/[0.1] pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h3 className="display text-2xl text-fg sm:text-3xl">
              Top five anime
            </h3>
            <p className="max-w-md text-pretty font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              Each section of this site is themed after one of them
            </p>
          </div>

          <ol className="mt-7 grid gap-px overflow-hidden border border-fg/[0.1] bg-fg/[0.08] sm:grid-cols-2 lg:grid-cols-5">
            {favouriteAnime.map((a, i) => (
              <li
                key={a.title}
                className="group flex flex-col gap-2 bg-bg px-5 py-5 transition-colors duration-400 hover:bg-surface"
              >
                <span className="font-mono text-[10px] text-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-pretty text-sm leading-snug text-fg transition-colors group-hover:text-accent">
                  {a.title}
                </span>
                <span aria-hidden className="jp mt-auto text-[11px] text-accent-2/70">
                  {a.jp}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
