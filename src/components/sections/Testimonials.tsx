'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Quote } from 'lucide-react';
import { testimonials } from '@/lib/content';
import { Magnetic } from '@/components/ui/Magnetic';

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (delta: number) => {
    setDir(delta);
    setIndex((i) => (i + delta + testimonials.length) % testimonials.length);
  };

  const current = testimonials[index];

  return (
    <section className="relative overflow-hidden border-y border-fg/[0.1] bg-surface/30 py-24 sm:py-32">
      <div className="container-x">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-3">
            <Quote size={36} className="text-accent" aria-hidden />
            <span aria-hidden className="h-px w-10 bg-accent-2/50" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
              Field reports
            </span>
          </div>

          <div className="relative min-h-[220px] sm:min-h-[200px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.blockquote
                key={index}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-balance font-serif text-2xl leading-snug text-fg sm:text-3xl md:text-4xl">
                  &ldquo;{current.quote}&rdquo;
                </p>
                <footer className="mt-8 flex items-center gap-4">
                  <span className="h-px w-10 bg-accent" aria-hidden />
                  <div>
                    <cite className="not-italic">
                      <span className="block text-sm font-medium text-fg">
                        {current.author}
                      </span>
                      <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                        {current.role}
                      </span>
                    </cite>
                  </div>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-fg/[0.1] pt-6">
            <span className="font-mono text-xs tabular-nums text-faint">
              {String(index + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
            </span>

            <div className="flex gap-2">
              <Magnetic strength={0.3}>
                <button
                  onClick={() => go(-1)}
                  aria-label="Previous testimonial"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-fg/[0.12] text-fg transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
                >
                  <ArrowLeft size={16} />
                </button>
              </Magnetic>
              <Magnetic strength={0.3}>
                <button
                  onClick={() => go(1)}
                  aria-label="Next testimonial"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-fg/[0.12] text-fg transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
                >
                  <ArrowRight size={16} />
                </button>
              </Magnetic>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
