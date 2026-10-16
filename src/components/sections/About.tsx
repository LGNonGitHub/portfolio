'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { site, socials } from '@/lib/content';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Reveal } from '@/components/ui/Reveal';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/** TODO: rewrite these paragraphs in your own voice. */
const paragraphs = [
  'I am a designer who learned to code because the handoff kept losing the thing I cared about. Now I do both, which mostly means I argue with myself about whether an idea is worth the implementation cost — and lose about half the time.',
  'My work sits where visual craft meets engineering constraint. I care about type that holds up at 320 pixels, motion that explains rather than decorates, and interfaces that still make sense when the data is ugly and the network is slow.',
  'Currently finishing a computer science degree, taking freelance work, and treating every side project as an excuse to learn the thing I was avoiding.',
];

/**
 * Scroll-driven word highlight.
 *
 * All three paragraphs share ONE scroll progress value spanning the whole
 * block, and each gets a disjoint slice of it. That is what makes them strictly
 * sequential: paragraph two's first word cannot brighten until paragraph one's
 * last word has. Giving each paragraph its own useScroll (the obvious approach)
 * lets them overlap whenever two are on screen at once.
 */
function HighlightBlock({ paragraphs }: { paragraphs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.55'],
  });

  if (reduced) {
    return (
      <div className="space-y-10">
        {paragraphs.map((text, i) => (
          <p key={i} className="text-pretty text-xl leading-snug text-fg sm:text-2xl">
            {text}
          </p>
        ))}
      </div>
    );
  }

  // Weight each paragraph's slice by its length so a long one does not race.
  const totalWords = paragraphs.reduce((n, t) => n + t.split(' ').length, 0);
  let consumed = 0;
  const slices = paragraphs.map((text) => {
    const words = text.split(' ').length;
    const from = consumed / totalWords;
    consumed += words;
    return [from, consumed / totalWords] as const;
  });

  return (
    <div ref={ref} className="space-y-10">
      {paragraphs.map((text, pi) => {
        const [from, to] = slices[pi];
        const words = text.split(' ');
        return (
          <p
            key={pi}
            className="text-pretty text-xl leading-snug sm:text-2xl md:text-[1.75rem]"
          >
            {words.map((word, wi) => {
              const span = (to - from) / words.length;
              const start = from + wi * span;
              return (
                <Word
                  key={`${pi}-${wi}`}
                  progress={scrollYProgress}
                  range={[start, start + span]}
                >
                  {word}
                </Word>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <span className="relative mr-[0.26em] inline-block">
      <span className="absolute inset-0 text-fg/20" aria-hidden>
        {children}
      </span>
      <motion.span style={{ opacity }} className="text-fg">
        {children}
      </motion.span>
    </span>
  );
}

export function About() {
  return (
    <section id="about" className="motif-field relative scroll-mt-24 overflow-hidden py-24 sm:py-36">
      <div className="container-x">
        <SectionHeader
          index="02"
          label="Origin"
          jp="紹介"
          title={['The short', 'version']}
        >
          <p className="eyebrow shrink-0 whitespace-nowrap sm:text-right">
            Design-engineer
            <br />
            {site.location}
          </p>
        </SectionHeader>

        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <HighlightBlock paragraphs={paragraphs} />
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <Reveal className="sticky top-32 space-y-10">
              <div>
                <h3 className="eyebrow mb-4">Abilities</h3>
                <ul className="space-y-2.5">
                  {[
                    'Product & interface design',
                    'Front-end engineering',
                    'Design systems & tokens',
                    'Motion and micro-interaction',
                    'Brand identity & art direction',
                    'Prototyping and validation',
                  ].map((item) => (
                    <li
                      key={item}
                      className="group flex items-center gap-3 text-sm text-muted transition-colors hover:text-fg"
                    >
                      <span className="h-px w-4 bg-fg/25 transition-all duration-500 ease-expo group-hover:w-8 group-hover:bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="eyebrow mb-4">Elsewhere</h3>
                <ul className="space-y-2.5">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-baseline justify-between gap-4 text-sm"
                      >
                        <span className="link-underline text-fg">{s.label}</span>
                        <span className="font-mono text-[11px] text-faint transition-colors group-hover:text-accent">
                          {s.handle}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </section>
  );
}
