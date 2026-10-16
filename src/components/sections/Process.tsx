"use client";

import { processSteps } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

export function Process() {
  return (
    <section className="relative py-24 sm:py-36">
      <div className="container-x">
        <SectionHeader
          index=""
          label="Technique"
          jp="型"
          title={["Four steps,", "repeated"]}
        />

        <div className="grid gap-px overflow-hidden border border-fg/[0.1] bg-fg/[0.08] sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.08} className="h-full">
              <article className="group relative flex h-full flex-col bg-bg p-6 transition-colors duration-500 hover:bg-surface sm:p-8">
                <span className="display text-4xl text-fg/15 sm:text-5xl transition-colors duration-500 group-hover:text-accent">
                  {step.step}
                </span>
                <span
                  aria-hidden
                  className="absolute right-6 top-7 font-serif text-lg text-accent-2/0 transition-colors duration-500 group-hover:text-accent-2/60"
                >
                  {["観", "描", "造", "磨"][i]}
                </span>
                <h3 className="display mt-4 text-xl text-fg sm:mt-6 sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
                <span
                  aria-hidden
                  className="mt-auto block h-px w-0 bg-gradient-to-r from-accent to-accent2 pt-6 transition-all duration-700 ease-expo group-hover:w-full"
                />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
