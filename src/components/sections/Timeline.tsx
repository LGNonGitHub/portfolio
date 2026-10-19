'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Briefcase, GraduationCap, Trophy } from 'lucide-react';
import { hackathons, sectionThemes, timeline, type TimelineItem } from '@/lib/content';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Reveal } from '@/components/ui/Reveal';

const icons: Record<TimelineItem['kind'], typeof Briefcase> = {
  work: Briefcase,
  education: GraduationCap,
  award: Trophy,
};

/**
 * The ascent.
 *
 * The previous version stacked everything into the left half of a 12-column
 * grid and left the right half empty, with a spine that ran past the first and
 * last nodes into open space. This lays it out as a proper ledger instead:
 * floor + period pinned left, the spine as the column rule, body in the middle,
 * tags right. The spine is now clipped to run from the first node to the last
 * rather than the full container height.
 */
/** The gap below each row; the rail extends by exactly this to stay unbroken. */
const ROW_GAP = '3.5rem';

/** One rail segment, filling as its row arrives. */
function Rail({ isLast }: { isLast: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -35% 0px' });
  const height = isLast ? '1.75rem' : `calc(100% + ${ROW_GAP})`;

  return (
    <span ref={ref} aria-hidden className="absolute inset-y-0 left-1/2 -translate-x-1/2">
      <span
        className="absolute left-0 top-0 w-px bg-fg/[0.12]"
        style={{ height }}
      />
      <motion.span
        className="absolute left-0 top-0 w-px origin-top bg-gradient-to-b from-accent to-accent2"
        style={{ height }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: inView ? 1 : 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  );
}

export function Timeline() {
  const top = timeline.length;

  return (
    <section
      id="path"
      data-palette="path"
      className="motif-field relative isolate scroll-mt-24 overflow-x-clip py-24 sm:py-36"
    >
        <div className="container-x">
        <SectionHeader
          index="04" label="Ascent" jp="軌跡"
          emblem={sectionThemes.path.emblem} title={['How I', 'got here']}>
          <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted">
            Read it bottom-up if you like — every floor was climbed from the one
            below it.
          </p>
        </SectionHeader>

        <ol className="relative">
          {timeline.map((item, i) => {
            const Icon = icons[item.kind];
            const floor = String(top - i).padStart(2, '0');
            const isLast = i === timeline.length - 1;

            return (
              <li
                key={`${item.period}-${item.title}`}
                data-stage-floor={timeline.length - 1 - i}
                className="relative"
              >
                <Reveal delay={0.04}>
                  <div className="grid gap-x-8 gap-y-4 md:grid-cols-12">
                    {/* Floor + period, pinned to the left rail */}
                    <div className="md:col-span-2 md:text-right">
                      <p className="font-display text-3xl font-semibold leading-none text-fg/50 transition-colors duration-500 md:text-4xl">
                        {floor}
                      </p>
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
                        {item.period}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                        {item.kind}
                      </p>
                    </div>

                    {/* The spine column — node sits exactly on the rule */}
                    <div className="relative hidden md:col-span-1 md:flex md:justify-center">
                      <Rail isLast={isLast} />
                      <span className="relative z-10 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-bg">
                        <Icon size={13} className="text-accent" />
                      </span>
                    </div>

                    {/* Body */}
                    <div className="md:col-span-6">
                      {/* Mobile node, since the spine column is hidden there */}
                      <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-bg md:hidden">
                        <Icon size={13} className="text-accent" />
                      </span>
                      <h3 className="display text-2xl text-fg sm:text-3xl">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-accent-2">{item.org}</p>
                      <p className="mt-4 text-pretty text-sm leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <ul className="flex flex-wrap content-start gap-1.5 md:col-span-3">
                      {item.tags.map((tag) => (
                        <li
                          key={tag}
                          className="border border-fg/[0.12] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>

                {!isLast && <div aria-hidden style={{ height: ROW_GAP }} />}
              </li>
            );
          })}
        </ol>

        {/* The six events behind the hero counter. */}
        {/* The hero stats link straight here, hence the id and scroll offset. */}
        <div id="path-hackathons" className="scroll-mt-24">
        <Reveal className="mt-20 border-t border-fg/[0.1] pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h3 className="display text-2xl text-fg sm:text-3xl">
              Hackathons &amp; CTFs
            </h3>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              {hackathons.length} entered
            </p>
          </div>

          <ul className="mt-7 grid gap-px overflow-hidden border border-fg/[0.1] bg-fg/[0.08] sm:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((h, i) => (
              <li
                key={h.name}
                data-stage-rune={i}
                className="group relative flex items-baseline gap-3 bg-bg px-5 py-4 transition-colors duration-400 hover:bg-surface"
              >
                <span className="font-mono text-[10px] text-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-fg transition-colors group-hover:text-accent">
                    {h.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    {h.org}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        </div>
      </div>
    </section>
  );
}
