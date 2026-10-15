'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { site, socials } from '@/lib/content';
import { TextReveal } from '@/components/ui/TextReveal';
import { Reveal } from '@/components/ui/Reveal';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/** TODO: rewrite these paragraphs in your own voice. */
const paragraphs = [
  'I am a designer who learned to code because the handoff kept losing the thing I cared about. Now I do both, which mostly means I argue with myself about whether an idea is worth the implementation cost — and lose about half the time.',
  'My work sits where visual craft meets engineering constraint. I care about type that holds up at 320 pixels, motion that explains rather than decorates, and interfaces that still make sense when the data is ugly and the network is slow.',
  'Currently finishing a computer science degree, taking freelance work, and treating every side project as an excuse to learn the thing I was avoiding.',
];

/**
 * Scroll-driven word highlight. Each word brightens as the section passes
 * through the viewport, which pulls the reader down the page.
 */
function HighlightParagraph({ text, index }: { text: string; index: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.4'],
  });

  const words = text.split(' ');

  if (reduced) {
    return (
      <p className="text-pretty text-xl leading-snug text-fg sm:text-2xl">{text}</p>
    );
  }

  return (
    <p
      ref={ref}
      className="text-pretty text-xl leading-snug sm:text-2xl md:text-[1.75rem]"
    >
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={`${index}-${i}`} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </p>
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
  const opacity = useTransform(progress, range, [0.22, 1]);
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
    <section id="about" className="relative scroll-mt-24 py-24 sm:py-36">
      <div className="container-x">
        <header className="mb-16 flex flex-wrap items-end justify-between gap-6 border-b border-fg/[0.1] pb-6">
          <div>
            <span className="eyebrow">02 — About</span>
            <TextReveal
              as="h2"
              text={['The short', 'version']}
              className="display h-section mt-4 text-fg"
            />
          </div>
          <p className="eyebrow shrink-0 whitespace-nowrap sm:text-right">
            Design-engineer
            <br />
            {site.location}
          </p>
        </header>

        <div className="grid gap-16 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            {paragraphs.map((p, i) => (
              <HighlightParagraph key={i} text={p} index={i} />
            ))}
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <Reveal className="sticky top-32 space-y-10">
              <div>
                <h3 className="eyebrow mb-4">What I do</h3>
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
