'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Briefcase, GraduationCap, Trophy } from 'lucide-react';
import { timeline, type TimelineItem } from '@/lib/content';
import { TextReveal } from '@/components/ui/TextReveal';
import { Reveal } from '@/components/ui/Reveal';

const icons: Record<TimelineItem['kind'], typeof Briefcase> = {
  work: Briefcase,
  education: GraduationCap,
  award: Trophy,
};

export function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.75', 'end 0.6'],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <section id="path" className="relative scroll-mt-24 py-24 sm:py-36">
      <div className="container-x">
        <header className="mb-16 border-b border-fg/[0.1] pb-6">
          <span className="eyebrow">04 — The path so far</span>
          <TextReveal
            as="h2"
            text="How I got here"
            className="display h-section mt-4 text-fg"
          />
        </header>

        <div ref={ref} className="relative">
          {/* Spine */}
          <div
            aria-hidden
            className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-px bg-fg/[0.1] sm:left-[15px]"
          >
            <motion.div
              className="h-full w-full origin-top bg-accent"
              style={{ scaleY }}
            />
          </div>

          <ol className="space-y-12 sm:space-y-16">
            {timeline.map((item, i) => {
              const Icon = icons[item.kind];
              return (
                <li key={`${item.period}-${item.title}`} className="relative pl-10 sm:pl-14">
                  <Reveal delay={i * 0.06}>
                    {/* Node */}
                    <span className="absolute left-0 top-1 flex h-[23px] w-[23px] items-center justify-center rounded-full border border-fg/15 bg-bg sm:h-[31px] sm:w-[31px]">
                      <Icon size={12} className="text-accent sm:hidden" />
                      <Icon size={14} className="hidden text-accent sm:block" />
                    </span>

                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
                        {item.period}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                        {item.kind}
                      </span>
                    </div>

                    <h3 className="display mt-2 text-2xl text-fg sm:text-3xl">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{item.org}</p>
                    <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>

                    <ul className="mt-5 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-fg/[0.12] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
