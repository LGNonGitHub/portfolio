'use client';

import { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { skillGroups } from '@/lib/content';
import { TextReveal } from '@/components/ui/TextReveal';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useMediaQuery';

export function Skills() {
  const [activeGroup, setActiveGroup] = useState(0);

  return (
    <section id="stack" className="relative scroll-mt-24 py-24 sm:py-36">
      <div className="container-x">
        <header className="mb-14 border-b border-fg/[0.1] pb-6">
          <span className="eyebrow">03 — Capabilities</span>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <TextReveal
              as="h2"
              text={['What I work', 'with daily']}
              className="display h-section text-fg"
            />
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted">
              The percentages are honest, not aspirational. Anything below 70 is
              something I can work in but would not call myself fluent in yet.
            </p>
          </div>
        </header>

        {/* Group tabs */}
        <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Skill groups">
          {skillGroups.map((g, i) => (
            <button
              key={g.title}
              role="tab"
              aria-selected={activeGroup === i}
              onClick={() => setActiveGroup(i)}
              className={cn(
                'group relative overflow-hidden rounded-full border px-5 py-2.5 text-left transition-colors duration-300',
                activeGroup === i
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-fg/[0.12] text-muted hover:border-fg/30 hover:text-fg',
              )}
            >
              <span className="text-sm font-medium">{g.title}</span>
              <span
                className={cn(
                  'ml-2 font-mono text-[10px] uppercase tracking-[0.12em]',
                  activeGroup === i ? 'text-accent-ink/70' : 'text-faint',
                )}
              >
                {g.note}
              </span>
            </button>
          ))}
        </div>

        {/* Bars */}
        <div className="grid gap-x-12 gap-y-7 md:grid-cols-2">
          {skillGroups[activeGroup].skills.map((skill, i) => (
            <SkillBar
              key={`${activeGroup}-${skill.name}`}
              name={skill.name}
              level={skill.level}
              delay={i * 0.06}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SkillBar({
  name,
  level,
  delay,
}: {
  name: string;
  level: number;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '0px 0px -8% 0px' });
  const reduced = useReducedMotion();

  return (
    <div ref={ref} className="group">
      <div className="mb-2.5 flex items-baseline justify-between gap-4">
        <span className="text-sm text-fg transition-colors group-hover:text-accent">
          {name}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-faint">
          {level}
        </span>
      </div>
      <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-fg/[0.08]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          initial={reduced ? false : { width: 0 }}
          animate={inView ? { width: `${level}%` } : { width: 0 }}
          transition={{ duration: 1.3, delay, ease: [0.16, 1, 0.3, 1] }}
          style={reduced ? { width: `${level}%` } : undefined}
        />
      </div>
    </div>
  );
}
