'use client';

import { process } from '@/lib/content';
import { TextReveal } from '@/components/ui/TextReveal';
import { Reveal } from '@/components/ui/Reveal';

export function Process() {
  return (
    <section className="relative py-24 sm:py-36">
      <div className="container-x">
        <header className="mb-14 border-b border-fg/[0.1] pb-6">
          <span className="eyebrow">How I work</span>
          <TextReveal
            as="h2"
            text="Four steps, repeated"
            className="display h-section mt-4 text-fg"
          />
        </header>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-fg/[0.1] bg-fg/[0.08] sm:grid-cols-2 lg:grid-cols-4">
          {process.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.08} className="h-full">
              <article className="group relative flex h-full flex-col bg-bg p-7 transition-colors duration-500 hover:bg-surface sm:p-8">
                <span className="display text-5xl text-fg/15 transition-colors duration-500 group-hover:text-accent">
                  {step.step}
                </span>
                <h3 className="display mt-6 text-xl text-fg sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
                <span
                  aria-hidden
                  className="mt-auto block h-px w-0 bg-accent pt-6 transition-all duration-700 ease-expo group-hover:w-full"
                />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
