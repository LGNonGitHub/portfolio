'use client';

import { motion } from 'framer-motion';
import { influences } from '@/lib/content';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MagicCircle } from '@/components/ui/MagicCircle';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Where the visual language came from. Naming the sources is the honest move —
 * and it lets the rest of the site carry the influence without explaining
 * itself in every section.
 */
export function Influences() {
  return (
    <section
      id="influences"
      className="relative scroll-mt-24 overflow-hidden py-24 sm:py-36"
    >
      {/* Faint sigil anchoring the left edge */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-[18%] top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 opacity-45 lg:block"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 0.45, scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <MagicCircle className="h-full w-full" points={5} seed={11} />
      </motion.div>

      <div className="container-x relative">
        <SectionHeader
          index=""
          label="Influences"
          jp="影響"
          title={['What this site', 'is made of']}
        >
          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted">
            The palette, the sigils and the status panels are borrowed in
            spirit from five series. Every mark here is original geometry — no
            character art, no logos, nothing lifted.
          </p>
        </SectionHeader>

        <ul className="divide-y divide-fg/[0.08] border-y border-fg/[0.08]">
          {influences.map((inf, i) => (
            <li key={inf.title}>
              <Reveal delay={i * 0.05}>
                <article className="group grid items-baseline gap-x-8 gap-y-2 py-7 transition-colors duration-500 md:grid-cols-12">
                  <span className="font-mono text-[11px] text-faint md:col-span-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="md:col-span-5">
                    <h3 className="display text-xl text-fg transition-colors duration-500 group-hover:text-accent sm:text-2xl">
                      {inf.title}
                    </h3>
                    <p
                      aria-hidden
                      className="mt-1 font-serif text-sm text-accent-2/70"
                    >
                      {inf.jp}
                    </p>
                  </div>

                  <p className="text-pretty text-sm leading-relaxed text-muted md:col-span-4">
                    {inf.took}
                  </p>

                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint md:col-span-2 md:text-right">
                    {inf.motif}
                  </span>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
